import { config } from 'dotenv'
import { Client } from 'pg'
config({ quiet: true })
const url =
  process.env.NETLIFY_DATABASE_URL_UNPOOLED ??
  process.env.NETLIFY_DATABASE_URL ??
  process.env.DATABASE_URL
if (!url) throw new Error('Missing migration database URL')
const client = new Client({
  connectionString: url.replace('sslmode=require', 'sslmode=verify-full')
})
await client.connect()
try {
  await client.query('BEGIN READ ONLY')
  const ledger = await client.query(
    'select created_at from drizzle.__drizzle_migrations order by created_at desc limit 1'
  )
  const columns = await client.query(
    "select table_name,column_name,data_type,udt_name,is_nullable,column_default from information_schema.columns where table_schema='public' and table_name in ('event_registrations','series_registrations','tournament_series','tournaments','bracket_matches')"
  )
  const expectations: [string, string, string, boolean][] = [
    ['event_registrations', 'companions', 'int4', false],
    ['event_registrations', 'is_paid', 'bool', false],
    ['event_registrations', 'email', 'text', true],
    ['series_registrations', 'player_gender', 'text', true],
    ['tournament_series', 'females_only', 'bool', false],
    ['tournament_series', 'series_date', 'text', true],
    ['tournament_series', 'start_time', 'text', true],
    ['tournaments', 'location_lat', 'float8', true],
    ['tournaments', 'location_lng', 'float8', true],
    ['tournaments', 'date_end', 'text', true],
    ['tournament_series', 'bracket_mode', 'bracket_mode', false],
    ['bracket_matches', 'bracket_side', 'bracket_side', false],
    ['bracket_matches', 'loser_next_match_id', 'int4', true],
    ['bracket_matches', 'loser_next_match_slot', 'int4', true]
  ]
  for (const [table, column, type, nullable] of expectations) {
    const row = columns.rows.find(function (row) {
      return row.table_name === table && row.column_name === column
    })
    if (
      !row ||
      row.udt_name !== type ||
      (row.is_nullable === 'YES') !== nullable
    )
      throw new Error(`Definition mismatch: ${table}.${column}`)
  }
  const defaults: [string, string, string][] = [
    ['event_registrations', 'companions', '0'],
    ['event_registrations', 'is_paid', 'false'],
    ['tournament_series', 'females_only', 'false'],
    ['tournament_series', 'bracket_mode', "'single'::bracket_mode"],
    ['bracket_matches', 'bracket_side', "'winners'::bracket_side"]
  ]
  for (const [table, column, value] of defaults) {
    const row = columns.rows.find(function (row) {
      return row.table_name === table && row.column_name === column
    })
    if (row?.column_default !== value)
      throw new Error(`Default mismatch: ${table}.${column}`)
  }
  const enums = await client.query(
    "select t.typname,array_agg(e.enumlabel::text order by e.enumsortorder) as labels from pg_type t join pg_enum e on e.enumtypid=t.oid where t.typname in ('bracket_mode','bracket_side') group by t.typname"
  )
  for (const [type, labels] of [
    ['bracket_mode', ['single', 'double']],
    ['bracket_side', ['winners', 'losers', 'grand_final']]
  ] as const) {
    const row = enums.rows.find(function (row) {
      return row.typname === type
    })
    if (JSON.stringify(row?.labels) !== JSON.stringify(labels))
      throw new Error(`Enum mismatch: ${type}`)
  }
  const constraints = await client.query(
    "select pg_get_constraintdef(oid) as definition from pg_constraint where conrelid='bracket_matches'::regclass and conname='bracket_matches_series_id_bracket_side_round_match_number_unique'"
  )
  if (
    constraints.rows[0]?.definition !==
    'UNIQUE (series_id, bracket_side, round, match_number)'
  )
    throw new Error('Match uniqueness mismatch')
  const counts = await client.query(
    'select (select count(*) from tournaments)::int as tournaments,(select count(*) from tournament_series)::int as series,(select count(*) from bracket_matches)::int as matches'
  )
  process.stdout.write(
    JSON.stringify({
      verified: true,
      lastMigration: ledger.rows[0]?.created_at,
      counts: counts.rows[0]
    }) + '\n'
  )
  await client.query('ROLLBACK')
} finally {
  await client.end()
}

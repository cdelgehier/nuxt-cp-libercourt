interface ScoreRow {
  score1: number | null | ''
  score2: number | null | ''
}
/** Empty number inputs become empty strings after the user clears them. */
export function scoreInput(
  rows: ScoreRow[]
): { score1: number; score2: number }[] {
  const sets: { score1: number; score2: number }[] = []
  let gap = false
  for (const row of rows) {
    const firstEmpty = row.score1 === null || row.score1 === '',
      secondEmpty = row.score2 === null || row.score2 === ''
    if (firstEmpty && secondEmpty) {
      gap = true
      continue
    }
    if (firstEmpty || secondEmpty)
      throw new Error('Saisissez les deux scores de chaque manche.')
    if (gap) throw new Error('Saisissez les manches dans l’ordre.')
    sets.push({ score1: row.score1 as number, score2: row.score2 as number })
  }
  return sets
}

<script setup lang="ts">
  import {
    createJaAccessInputSchema,
    type TournamentJaAccess
  } from '~~/server/domains/tournament/types'

  const props = defineProps<{
    accesses: TournamentJaAccess[]
    slug: string
    tournamentId: number
  }>()

  const emit = defineEmits<{ refresh: [] }>()
  const toast = useToast()

  const modalOpen = ref(false)
  const saving = ref(false)

  const form = reactive({ name: '', pin: '' })
  const errors = reactive<Record<string, string>>({})

  const schema = createJaAccessInputSchema

  function resetForm() {
    form.name = ''
    form.pin = ''
    Object.keys(errors).forEach(k => Reflect.deleteProperty(errors, k))
  }

  function closeCreateModal() {
    modalOpen.value = false
    resetForm()
  }

  async function create() {
    const result = schema.safeParse(form)
    if (!result.success) {
      result.error.issues.forEach(i => {
        errors[String(i.path[0])] = i.message
      })
      return
    }
    Object.keys(errors).forEach(k => Reflect.deleteProperty(errors, k))
    saving.value = true
    try {
      await $fetch(`/api/admin/tournois/${props.slug}/ja-access`, {
        method: 'POST',
        body: form
      })
      toast.add({ title: 'Code JA créé', color: 'success' })
      emit('refresh')
      modalOpen.value = false
      resetForm()
    } catch (e: unknown) {
      const msg =
        (e as { data?: { message?: string } })?.data?.message ?? 'Erreur'
      toast.add({ title: msg, color: 'error' })
    } finally {
      saving.value = false
    }
  }

  async function toggleActive(access: TournamentJaAccess) {
    try {
      await $fetch(`/api/admin/tournois/${props.slug}/ja-access/${access.id}`, {
        method: 'PATCH',
        body: { isActive: !access.isActive }
      })
      emit('refresh')
    } catch {
      toast.add({ title: 'Erreur', color: 'error' })
    }
  }

  async function remove(id: number) {
    try {
      await $fetch(`/api/admin/tournois/${props.slug}/ja-access/${id}`, {
        method: 'DELETE'
      })
      emit('refresh')
      toast.add({ title: 'Accès supprimé', color: 'success' })
    } catch {
      toast.add({ title: 'Erreur', color: 'error' })
    }
  }

  function formatDate(d: Date | string | null): string {
    if (!d) return 'Jamais'
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(d))
  }
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 class="text-lg font-semibold text-slate-900">Juges-arbitres</h2>
        <p class="mt-1 text-sm text-slate-500">
          Un accès personnel au poste JA pour ce tournoi.
        </p>
      </div>
      <UButton icon="i-heroicons-plus" @click="modalOpen = true"
        >Créer un accès JA</UButton
      >
    </div>
    <div
      v-if="!accesses.length"
      class="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"
    >
      <UIcon name="i-heroicons-key" class="size-9 text-slate-300" />
      <h3 class="mt-3 font-semibold text-slate-900">
        Aucun accès pour le moment
      </h3>
      <p class="mt-1 text-sm text-slate-500">
        Créez un code personnel pour chaque juge-arbitre.
      </p>
    </div>
    <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      <article
        v-for="access in accesses"
        :key="access.id"
        class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div class="flex items-start gap-3">
          <div
            class="flex size-10 shrink-0 items-center justify-center rounded-full bg-slate-100 font-semibold text-slate-600"
          >
            {{ access.name.charAt(0).toUpperCase() }}
          </div>
          <div class="min-w-0 flex-1">
            <h3 class="font-semibold text-slate-900">{{ access.name }}</h3>
            <p class="mt-1 text-xs text-slate-500">
              Dernière utilisation : {{ formatDate(access.lastUsedAt) }}
            </p>
          </div>
          <UBadge
            :color="access.isActive ? 'success' : 'neutral'"
            variant="subtle"
            >{{ access.isActive ? 'Actif' : 'Désactivé' }}</UBadge
          >
        </div>
        <div
          class="mt-5 flex items-center justify-between border-t border-slate-100 pt-4"
        >
          <UButton
            size="sm"
            variant="outline"
            color="neutral"
            @click="toggleActive(access)"
            >{{ access.isActive ? 'Désactiver' : 'Activer' }}</UButton
          ><UButton
            size="sm"
            variant="ghost"
            color="error"
            icon="i-heroicons-trash"
            :aria-label="`Supprimer l’accès de ${access.name}`"
            @click="remove(access.id)"
          />
        </div>
      </article>
    </div>

    <!-- Create modal -->
    <UModal
      v-model:open="modalOpen"
      title="Créer un accès juge-arbitre"
      description="Ce code donne accès uniquement à ce tournoi."
      :ui="{ content: 'rounded-2xl' }"
    >
      <template #body>
        <div class="space-y-5">
          <UFormField
            label="Nom du JA"
            hint='Ex : "Marc Dupont" ou "JA Fédération"'
            :error="errors.name"
            required
          >
            <UInput
              v-model="form.name"
              class="w-full"
              placeholder="Marc Dupont"
            />
          </UFormField>
          <UFormField
            label="Code PIN (4 à 6 chiffres)"
            :error="errors.pin"
            required
          >
            <UInput
              v-model="form.pin"
              type="password"
              placeholder="••••"
              class="w-full font-mono"
            />
          </UFormField>
        </div>
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton variant="ghost" color="neutral" @click="closeCreateModal">
            Annuler
          </UButton>
          <UButton :loading="saving" @click="create"> Créer </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

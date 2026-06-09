"use client"

import { create } from "zustand"
import { api, type Client, type ClientSummary, type Payment, type Plot, type Reservation } from "@/lib/api"

type DashboardStore = {
  clients: Client[]
  selectedClientId: number | null
  selectedClient: Client | null
  summary: ClientSummary | null
  plots: Plot[]
  availablePlots: Plot[]
  reservations: Reservation[]
  payments: Payment[]
  loading: boolean
  error: string | null
  setSelectedClientId: (clientId: number) => Promise<void>
  loadInitial: () => Promise<void>
  refreshClientData: () => Promise<void>
  refreshPlots: () => Promise<void>
  refreshAll: () => Promise<void>
}

export const useDashboardStore = create<DashboardStore>((set, get) => ({
  clients: [],
  selectedClientId: null,
  selectedClient: null,
  summary: null,
  plots: [],
  availablePlots: [],
  reservations: [],
  payments: [],
  loading: false,
  error: null,

  setSelectedClientId: async (clientId) => {
    set({ selectedClientId: clientId, error: null })
    await get().refreshClientData()
  },

  loadInitial: async () => {
    set({ loading: true, error: null })
    try {
      const [clients, plots, availablePlots] = await Promise.all([
        api.getClients(),
        api.getAllPlots(),
        api.getAvailablePlots(),
      ])
      const selectedClientId = get().selectedClientId ?? clients[0]?.id ?? null
      set({ clients, plots, availablePlots, selectedClientId })
      if (selectedClientId) {
        await get().refreshClientData()
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Unknown API error" })
    } finally {
      set({ loading: false })
    }
  },

  refreshClientData: async () => {
    const selectedClientId = get().selectedClientId
    if (!selectedClientId) {
      set({ selectedClient: null, summary: null, reservations: [], payments: [] })
      return
    }

    try {
      const [selectedClient, summaryRows, reservations, payments] = await Promise.all([
        api.getClient(selectedClientId),
        api.getClientSummary(selectedClientId),
        api.getReservations(selectedClientId),
        api.getPayments(selectedClientId),
      ])
      set({
        selectedClient,
        summary: summaryRows[0] ?? null,
        reservations,
        payments,
        error: null,
      })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Unknown API error" })
    }
  },

  refreshPlots: async () => {
    try {
      const [plots, availablePlots] = await Promise.all([
        api.getAllPlots(),
        api.getAvailablePlots(),
      ])
      set({ plots, availablePlots, error: null })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Unknown API error" })
    }
  },

  refreshAll: async () => {
    await Promise.all([get().loadInitial(), get().refreshClientData()])
  },
}))

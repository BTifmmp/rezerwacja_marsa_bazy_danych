export type Client = {
  id: number
  name: string
  last_name: string
  balance: string | number
}

export type ClientSummary = {
  client_id: number
  full_name: string
  current_account_balance: string | number
  plots_owned_count: string | number
  total_size: string | number
  total_paid: string | number
}

export type Plot = {
  id: number
  reserved_by: number | null
  price: string | number
  size: string | number
}

export type Reservation = {
  id: number
  client_id: number
  plot_id: number
  operation: "add" | "remove"
  balance_change: string | number
  created_at: string
}

export type Payment = {
  id: number
  client_id: number
  amount: string | number
  created_at: string
}

export type SoldPlot = {
  time_of_transaction: string
  client_name: string
  plot_id: number
  amount: string | number
  size: string | number
}

export type PlotPayload = {
  price: number
  size: number
  reservedBy?: number | null
}

export type ClientPayload = {
  name?: string
  lastName?: string
  balance?: number
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api"

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.error ?? `Request failed: ${response.status}`)
  }

  return response.json() as Promise<T>
}

export const api = {
  getClients: () => apiRequest<Client[]>("/clients"),
  getClient: (clientId: number) => apiRequest<Client>(`/clients/${clientId}`),
  getClientSummary: (clientId: number) =>
    apiRequest<ClientSummary[]>(`/client-summary/${clientId}`),
  updateClient: (clientId: number, payload: ClientPayload) =>
    apiRequest<Client>(`/clients/${clientId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteClient: (clientId: number) =>
    apiRequest<{ message: string }>(`/clients/${clientId}`, {
      method: "DELETE",
    }),
  addClient: (name: string, lastName: string) =>
    apiRequest<Client>("/add-client", {
      method: "POST",
      body: JSON.stringify({ name, lastName }),
    }),
  getAvailablePlots: () => apiRequest<Plot[]>("/plots"),
  getAllPlots: () => apiRequest<Plot[]>("/plots/all"),
  getPlot: (plotId: number) => apiRequest<Plot>(`/plots/${plotId}`),
  addPlot: (payload: PlotPayload) =>
    apiRequest<Plot>("/plots", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updatePlot: (plotId: number, payload: Partial<PlotPayload>) =>
    apiRequest<Plot>(`/plots/${plotId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deletePlot: (plotId: number) =>
    apiRequest<{ message: string }>(`/plots/${plotId}`, {
      method: "DELETE",
    }),
  getPlotsSold: (startDate: string, endDate: string) =>
    apiRequest<SoldPlot[]>(
      `/reports/plots-sold?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`
    ),
  reservePlot: (clientId: number, plotId: number) =>
    apiRequest<{ message: string }>("/reserve", {
      method: "POST",
      body: JSON.stringify({ clientId, plotId }),
    }),
  removeReservation: (clientId: number, plotId: number) =>
    apiRequest<{ message: string }>("/remove-reservation", {
      method: "POST",
      body: JSON.stringify({ clientId, plotId }),
    }),
  getReservations: (clientId: number, plotId?: number) => {
    const params = new URLSearchParams({ clientId: String(clientId) })
    if (plotId) params.set("plotId", String(plotId))
    return apiRequest<Reservation[]>(`/reservations?${params.toString()}`)
  },
  getPayments: (clientId: number) =>
    apiRequest<Payment[]>(`/payments?clientId=${clientId}`),
}

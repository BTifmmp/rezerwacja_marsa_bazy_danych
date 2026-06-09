"use client"

import { useEffect, useMemo, useState } from "react"
import {
  IconBuildingBank,
  IconCalendarStats,
  IconCreditCard,
  IconEdit,
  IconMap,
  IconPlus,
  IconRefresh,
  IconTrash,
  IconUser,
} from "@tabler/icons-react"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  api,
  type Client,
  type ClientPayload,
  type Plot,
  type SoldPlot,
} from "@/lib/api"
import { useDashboardStore } from "@/lib/dashboard-store"
import { cn } from "@/lib/utils"

type Section = "reservations" | "payments" | "plots" | "clients"

const sections: Array<{ id: Section; label: string; icon: React.ElementType }> =
  [
    { id: "reservations", label: "Reservations", icon: IconCalendarStats },
    { id: "payments", label: "Payments", icon: IconCreditCard },
    { id: "plots", label: "Plots", icon: IconMap },
    { id: "clients", label: "Clients", icon: IconUser },
  ]

function money(value: string | number | undefined | null) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value ?? 0))
}

function amount(value: string | number | undefined | null) {
  return Number(value ?? 0).toLocaleString("en-US", {
    maximumFractionDigits: 2,
  })
}

function dateTime(value: string | undefined) {
  if (!value) return "-"
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

function isoDate(daysAgo: number) {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  return date.toISOString().slice(0, 10)
}

function EmptyRow({ colSpan, label }: { colSpan: number; label: string }) {
  return (
    <TableRow>
      <TableCell
        colSpan={colSpan}
        className="h-24 text-center text-muted-foreground"
      >
        {label}
      </TableCell>
    </TableRow>
  )
}

function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon: React.ElementType
}) {
  return (
    <Card size="sm" className="rounded-lg">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-xl">{value}</CardTitle>
        <CardAction>
          <Icon className="size-5 text-muted-foreground" />
        </CardAction>
      </CardHeader>
    </Card>
  )
}

function EditClientCard({
  client,
  busy,
  onSave,
}: {
  client: Client | null
  busy: boolean
  onSave: (payload: Required<ClientPayload>) => Promise<void>
}) {
  const [name, setName] = useState(client?.name ?? "")
  const [lastName, setLastName] = useState(client?.last_name ?? "")
  const [balance, setBalance] = useState(String(client?.balance ?? ""))

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await onSave({
      name: name.trim(),
      lastName: lastName.trim(),
      balance: Number(balance || 0),
    })
  }

  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle>Edit selected client</CardTitle>
        <CardDescription>Uses `PATCH /clients/:clientId`.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-3" onSubmit={handleSubmit}>
          <div className="grid gap-1.5">
            <Label htmlFor="edit-name">Name</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={!client}
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="edit-last-name">Last name</Label>
            <Input
              id="edit-last-name"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              disabled={!client}
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="edit-balance">Balance</Label>
            <Input
              id="edit-balance"
              type="number"
              step="0.01"
              value={balance}
              onChange={(event) => setBalance(event.target.value)}
              disabled={!client}
              required
            />
          </div>
          <Button disabled={!client || busy}>Save client</Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default function Page() {
  const [section, setSection] = useState<Section>("reservations")
  const [clientName, setClientName] = useState("")
  const [clientLastName, setClientLastName] = useState("")
  const [reservePlotId, setReservePlotId] = useState("")
  const [plotPrice, setPlotPrice] = useState("")
  const [plotSize, setPlotSize] = useState("")
  const [editingPlot, setEditingPlot] = useState<Plot | null>(null)
  const [soldStart, setSoldStart] = useState(isoDate(30))
  const [soldEnd, setSoldEnd] = useState(isoDate(0))
  const [soldPlots, setSoldPlots] = useState<SoldPlot[]>([])
  const [busy, setBusy] = useState<string | null>(null)

  const {
    clients,
    selectedClientId,
    selectedClient,
    summary,
    plots,
    availablePlots,
    reservations,
    payments,
    loading,
    error,
    setSelectedClientId,
    loadInitial,
    refreshClientData,
    refreshPlots,
  } = useDashboardStore()

  useEffect(() => {
    void loadInitial()
  }, [loadInitial])

  const selectedClientName = selectedClient
    ? `${selectedClient.name} ${selectedClient.last_name}`
    : "No client selected"

  const totalPayments = useMemo(
    () => payments.reduce((sum, payment) => sum + Number(payment.amount), 0),
    [payments]
  )

  const selectedClientPlots = useMemo(
    () => plots.filter((plot) => plot.reserved_by === selectedClientId),
    [plots, selectedClientId]
  )

  async function runAction(label: string, action: () => Promise<void>) {
    setBusy(label)
    try {
      await action()
      toast.success("Done", { description: label })
    } catch (error) {
      toast.error("Request failed", {
        description:
          error instanceof Error ? error.message : "Unknown API error",
      })
    } finally {
      setBusy(null)
    }
  }

  async function reloadAfterMutation() {
    await Promise.all([loadInitial(), refreshPlots(), refreshClientData()])
  }

  async function handleAddClient(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!clientName.trim() || !clientLastName.trim()) return
    await runAction("Client added", async () => {
      const client = await api.addClient(
        clientName.trim(),
        clientLastName.trim()
      )
      setClientName("")
      setClientLastName("")
      await loadInitial()
      await setSelectedClientId(client.id)
    })
  }

  async function handleUpdateClient(payload: Required<ClientPayload>) {
    if (!selectedClientId) return
    await runAction("Client updated", async () => {
      await api.updateClient(selectedClientId, payload)
      await reloadAfterMutation()
    })
  }

  async function handleDeleteClient(clientId: number) {
    await runAction("Client deleted", async () => {
      await api.deleteClient(clientId)
      await loadInitial()
    })
  }

  async function handleReserve(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const plotId = reservePlotId || String(availablePlots[0]?.id ?? "")
    if (!selectedClientId || !plotId) return
    await runAction("Plot reserved", async () => {
      await api.reservePlot(selectedClientId, Number(plotId))
      await reloadAfterMutation()
    })
  }

  async function handleRemove(plotId: number) {
    if (!selectedClientId) return
    await runAction("Reservation removed", async () => {
      await api.removeReservation(selectedClientId, plotId)
      await reloadAfterMutation()
    })
  }

  async function handleSavePlot(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await runAction(editingPlot ? "Plot updated" : "Plot added", async () => {
      const payload = {
        price: Number(plotPrice),
        size: Number(plotSize),
        reservedBy: editingPlot?.reserved_by ?? null,
      }
      if (editingPlot) {
        await api.updatePlot(editingPlot.id, payload)
      } else {
        await api.addPlot(payload)
      }
      setEditingPlot(null)
      setPlotPrice("")
      setPlotSize("")
      await reloadAfterMutation()
    })
  }

  async function loadPlotForEdit(plotId: number) {
    await runAction("Plot loaded", async () => {
      const plot = await api.getPlot(plotId)
      setEditingPlot(plot)
      setPlotPrice(String(plot.price))
      setPlotSize(String(plot.size))
    })
  }

  async function handleDeletePlot(plotId: number) {
    await runAction("Plot deleted", async () => {
      await api.deletePlot(plotId)
      await reloadAfterMutation()
    })
  }

  async function handleSoldReport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await runAction("Sold plots report loaded", async () => {
      setSoldPlots(await api.getPlotsSold(soldStart, soldEnd))
    })
  }

  return (
    <main className="min-h-svh bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <IconBuildingBank className="size-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Mars Reservation</p>
              <h1 className="text-xl font-semibold">Reservation dashboard</h1>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="grid gap-1.5">
              <Label>Client</Label>
              <Select
                value={selectedClientId ? String(selectedClientId) : undefined}
                onValueChange={(value) =>
                  void setSelectedClientId(Number(value))
                }
              >
                <SelectTrigger className="w-full min-w-64">
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={String(client.id)}>
                      {client.name} {client.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              onClick={() => void reloadAfterMutation()}
              disabled={loading || busy !== null}
            >
              <IconRefresh />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6">
        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Backend request failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {loading ? (
            <>
              <Skeleton className="h-24 rounded-lg" />
              <Skeleton className="h-24 rounded-lg" />
              <Skeleton className="h-24 rounded-lg" />
              <Skeleton className="h-24 rounded-lg" />
            </>
          ) : (
            <>
              <MetricCard
                label="Selected client"
                value={selectedClientName}
                icon={IconUser}
              />
              <MetricCard
                label="Account balance"
                value={money(summary?.current_account_balance)}
                icon={IconCreditCard}
              />
              <MetricCard
                label="Reserved plots"
                value={amount(summary?.plots_owned_count)}
                icon={IconMap}
              />
              <MetricCard
                label="Total reserved size"
                value={`${amount(summary?.total_size)} m2`}
                icon={IconCalendarStats}
              />
            </>
          )}
        </section>

        <nav className="flex flex-wrap gap-2">
          {sections.map((item) => {
            const Icon = item.icon
            return (
              <Button
                key={item.id}
                variant={section === item.id ? "default" : "outline"}
                onClick={() => setSection(item.id)}
              >
                <Icon />
                {item.label}
              </Button>
            )
          })}
        </nav>

        {section === "reservations" ? (
          <section className="grid gap-5 xl:grid-cols-[360px_1fr]">
            <Card className="rounded-lg">
              <CardHeader>
                <CardTitle>Reserve plot</CardTitle>
                <CardDescription>
                  Uses the `p_reserve` procedure.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="grid gap-3" onSubmit={handleReserve}>
                  <div className="grid gap-1.5">
                    <Label>Available plot</Label>
                    <Select
                      value={
                        reservePlotId || String(availablePlots[0]?.id ?? "")
                      }
                      onValueChange={setReservePlotId}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose plot" />
                      </SelectTrigger>
                      <SelectContent>
                        {availablePlots.map((plot) => (
                          <SelectItem key={plot.id} value={String(plot.id)}>
                            Plot #{plot.id} - {money(plot.price)} /{" "}
                            {amount(plot.size)} m2
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    disabled={
                      !selectedClientId ||
                      (!reservePlotId && !availablePlots[0]) ||
                      busy !== null
                    }
                  >
                    <IconPlus />
                    Reserve for client
                  </Button>
                </form>

                <Separator className="my-4" />

                <div className="grid gap-2">
                  <p className="text-sm font-medium">Current client plots</p>
                  {selectedClientPlots.length ? (
                    selectedClientPlots.map((plot) => (
                      <div
                        key={plot.id}
                        className="flex items-center justify-between gap-3 rounded-lg border p-2"
                      >
                        <span className="text-sm">
                          Plot #{plot.id} · {money(plot.price)}
                        </span>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => void handleRemove(plot.id)}
                          disabled={busy !== null}
                        >
                          Remove
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No reserved plots.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-lg">
              <CardHeader>
                <CardTitle>Reservation history</CardTitle>
                <CardDescription>
                  Filtered by the selected client.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Plot</TableHead>
                      <TableHead>Operation</TableHead>
                      <TableHead>Balance change</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reservations.length ? (
                      reservations.map((reservation) => (
                        <TableRow key={reservation.id}>
                          <TableCell>#{reservation.id}</TableCell>
                          <TableCell>#{reservation.plot_id}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                reservation.operation === "add"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {reservation.operation}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {money(reservation.balance_change)}
                          </TableCell>
                          <TableCell>
                            {dateTime(reservation.created_at)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <EmptyRow
                        colSpan={5}
                        label="No reservations for this client."
                      />
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </section>
        ) : null}

        {section === "payments" ? (
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle>Payments</CardTitle>
              <CardDescription>
                Filtered by the selected client.
              </CardDescription>
              <CardAction>
                <Badge variant="outline">Total {money(totalPayments)}</Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.length ? (
                    payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>#{payment.id}</TableCell>
                        <TableCell>#{payment.client_id}</TableCell>
                        <TableCell>{money(payment.amount)}</TableCell>
                        <TableCell>{dateTime(payment.created_at)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <EmptyRow
                      colSpan={4}
                      label="No payments for this client."
                    />
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : null}

        {section === "plots" ? (
          <section className="grid gap-5">
            <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
              <Card className="rounded-lg">
                <CardHeader>
                  <CardTitle>
                    {editingPlot ? `Edit plot #${editingPlot.id}` : "Add plot"}
                  </CardTitle>
                  <CardDescription>
                    Creates and updates records in `plots`.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="grid gap-3" onSubmit={handleSavePlot}>
                    <div className="grid gap-1.5">
                      <Label htmlFor="plot-price">Price</Label>
                      <Input
                        id="plot-price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={plotPrice}
                        onChange={(event) => setPlotPrice(event.target.value)}
                        required
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="plot-size">Size</Label>
                      <Input
                        id="plot-size"
                        type="number"
                        min="0"
                        step="0.01"
                        value={plotSize}
                        onChange={(event) => setPlotSize(event.target.value)}
                        required
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button disabled={busy !== null}>
                        <IconPlus />
                        {editingPlot ? "Save plot" : "Add plot"}
                      </Button>
                      {editingPlot ? (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setEditingPlot(null)
                            setPlotPrice("")
                            setPlotSize("")
                          }}
                        >
                          Cancel
                        </Button>
                      ) : null}
                    </div>
                  </form>
                </CardContent>
              </Card>

              <Card className="rounded-lg">
                <CardHeader>
                  <CardTitle>Plots sold report</CardTitle>
                  <CardDescription>
                    Uses `fn_plots_sold_between`.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form
                    className="grid gap-3 md:grid-cols-[1fr_1fr_auto]"
                    onSubmit={handleSoldReport}
                  >
                    <div className="grid gap-1.5">
                      <Label htmlFor="sold-start">Start date</Label>
                      <Input
                        id="sold-start"
                        type="date"
                        value={soldStart}
                        onChange={(event) => setSoldStart(event.target.value)}
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="sold-end">End date</Label>
                      <Input
                        id="sold-end"
                        type="date"
                        value={soldEnd}
                        onChange={(event) => setSoldEnd(event.target.value)}
                      />
                    </div>
                    <Button className="self-end" disabled={busy !== null}>
                      Load report
                    </Button>
                  </form>
                  <Separator className="my-4" />
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Plot</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Size</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {soldPlots.length ? (
                        soldPlots.map((plot) => (
                          <TableRow
                            key={`${plot.time_of_transaction}-${plot.plot_id}`}
                          >
                            <TableCell>
                              {dateTime(plot.time_of_transaction)}
                            </TableCell>
                            <TableCell>{plot.client_name}</TableCell>
                            <TableCell>#{plot.plot_id}</TableCell>
                            <TableCell>{money(plot.amount)}</TableCell>
                            <TableCell>{amount(plot.size)} m2</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <EmptyRow
                          colSpan={5}
                          label="Load a date range to see sold plots."
                        />
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            <Card className="rounded-lg">
              <CardHeader>
                <CardTitle>All plots</CardTitle>
                <CardDescription>
                  No pagination, all rows from `/plots/all`.
                </CardDescription>
                <CardAction>
                  <Badge variant="outline">
                    {availablePlots.length} available
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plots.length ? (
                      plots.map((plot) => (
                        <TableRow key={plot.id}>
                          <TableCell>#{plot.id}</TableCell>
                          <TableCell>{money(plot.price)}</TableCell>
                          <TableCell>{amount(plot.size)} m2</TableCell>
                          <TableCell>
                            {plot.reserved_by ? (
                              <Badge variant="secondary">
                                Client #{plot.reserved_by}
                              </Badge>
                            ) : (
                              <Badge>Available</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-2">
                              <Button
                                size="icon-sm"
                                variant="outline"
                                title="Edit plot"
                                onClick={() => void loadPlotForEdit(plot.id)}
                              >
                                <IconEdit />
                              </Button>
                              <Button
                                size="icon-sm"
                                variant="destructive"
                                title="Delete plot"
                                onClick={() => void handleDeletePlot(plot.id)}
                              >
                                <IconTrash />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <EmptyRow colSpan={5} label="No plots found." />
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </section>
        ) : null}

        {section === "clients" ? (
          <section className="grid gap-5 xl:grid-cols-[360px_1fr]">
            <div className="grid gap-5">
              <Card className="rounded-lg">
                <CardHeader>
                  <CardTitle>Add client</CardTitle>
                  <CardDescription>
                    Creates a client with `/add-client`.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="grid gap-3" onSubmit={handleAddClient}>
                    <div className="grid gap-1.5">
                      <Label htmlFor="client-name">Name</Label>
                      <Input
                        id="client-name"
                        value={clientName}
                        onChange={(event) => setClientName(event.target.value)}
                        required
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="client-last-name">Last name</Label>
                      <Input
                        id="client-last-name"
                        value={clientLastName}
                        onChange={(event) =>
                          setClientLastName(event.target.value)
                        }
                        required
                      />
                    </div>
                    <Button disabled={busy !== null}>
                      <IconPlus />
                      Add client
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <EditClientCard
                key={selectedClientId ?? "empty-client"}
                client={selectedClient}
                busy={busy !== null}
                onSave={handleUpdateClient}
              />
            </div>

            <Card className="rounded-lg">
              <CardHeader>
                <CardTitle>Clients</CardTitle>
                <CardDescription>All clients from `/clients`.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clients.length ? (
                      clients.map((client) => (
                        <TableRow
                          key={client.id}
                          className={cn(
                            client.id === selectedClientId && "bg-muted/60"
                          )}
                        >
                          <TableCell>#{client.id}</TableCell>
                          <TableCell>
                            {client.name} {client.last_name}
                          </TableCell>
                          <TableCell>{money(client.balance)}</TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  void setSelectedClientId(client.id)
                                }
                              >
                                Select
                              </Button>
                              <Button
                                size="icon-sm"
                                variant="destructive"
                                title="Delete client"
                                onClick={() =>
                                  void handleDeleteClient(client.id)
                                }
                              >
                                <IconTrash />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <EmptyRow colSpan={4} label="No clients found." />
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </section>
        ) : null}
      </div>
    </main>
  )
}

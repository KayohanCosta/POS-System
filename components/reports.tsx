"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

// Adicionar importação para o Dialog e useToast no topo do arquivo
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { cancelTransaction } from "@/lib/data-utils"

export default function Reports() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [serviceOrders, setServiceOrders] = useState<any[]>([])
  const [reportPeriod, setReportPeriod] = useState("daily")
  const [reportData, setReportData] = useState<any>({
    sales: [],
    totalSales: 0,
    paymentMethods: {},
    topProducts: [],
  })

  // Adicionar o hook useToast no início da função Reports
  const { toast } = useToast()

  // Alterar o useCallback de generateReport para não depender de transactions
  const generateReport = useCallback((period: string, transactionsData: any[]) => {
    setReportPeriod(period)

    // Filter transactions based on period
    const filteredTransactions = filterByPeriod(transactionsData, period)

    // Calculate total sales (excluindo vendas canceladas)
    const validTransactions = filteredTransactions.filter((t) => !t.canceled)
    const totalSales = validTransactions.reduce((sum, t) => sum + t.total, 0)

    // Count payment methods (apenas para vendas não canceladas)
    const paymentMethods: Record<string, number> = {}
    validTransactions.forEach((t) => {
      paymentMethods[t.paymentMethod] = (paymentMethods[t.paymentMethod] || 0) + 1
    })

    // Get top products (apenas de vendas não canceladas)
    const productCounts: Record<string, { count: number; revenue: number }> = {}
    validTransactions.forEach((t) => {
      t.products.forEach((p: any) => {
        if (!productCounts[p.name]) {
          productCounts[p.name] = { count: 0, revenue: 0 }
        }
        productCounts[p.name].count += p.quantity
        productCounts[p.name].revenue += p.price * p.quantity
      })
    })

    const topProducts = Object.entries(productCounts)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    setReportData({
      sales: filteredTransactions, // Mantemos todas as vendas na lista, mas os cálculos consideram apenas as não canceladas
      totalSales,
      paymentMethods,
      topProducts,
    })
  }, [])

  // Modificar o useEffect para carregar dados e chamar generateReport
  useEffect(() => {
    // Load data from localStorage
    const storedTransactions = JSON.parse(localStorage.getItem("transactions") || "[]")
    const storedServiceOrders = JSON.parse(localStorage.getItem("serviceOrders") || "[]")

    setTransactions(storedTransactions)
    setServiceOrders(storedServiceOrders)

    // Generate initial report
    generateReport("daily", storedTransactions)
  }, [generateReport])

  const filterByPeriod = (data: any[], period: string) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    return data.filter((item) => {
      const itemDate = new Date(item.date)

      if (period === "daily") {
        // Today
        return itemDate >= today
      } else if (period === "weekly") {
        // Last 7 days
        const weekAgo = new Date(now)
        weekAgo.setDate(now.getDate() - 7)
        return itemDate >= weekAgo
      } else if (period === "monthly") {
        // Current month
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        return itemDate >= startOfMonth
      }

      return true
    })
  }

  const handlePrintReport = () => {
    window.print()
  }

  const currencyFormatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  })

  // Modificar a função handleCancelSale para evitar loops
  const handleCancelSale = (saleId: string) => {
    try {
      // Chamar a função de cancelamento
      cancelTransaction(saleId)

      // Buscar as transações atualizadas do localStorage
      const updatedTransactions = JSON.parse(localStorage.getItem("transactions") || "[]")

      // Atualizar o estado com as novas transações
      setTransactions(updatedTransactions)

      // Gerar o relatório novamente com os dados atualizados
      generateReport(reportPeriod, updatedTransactions)

      toast({
        title: "Venda cancelada",
        description: "A venda foi cancelada com sucesso e os produtos foram devolvidos ao estoque.",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description:
          "Não foi possível cancelar a venda: " + (error instanceof Error ? error.message : "Erro desconhecido"),
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Relatórios</h2>
          <p className="text-muted-foreground">Visualize os relatórios de vendas e serviços</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <Select value={reportPeriod} onValueChange={(value) => generateReport(value, transactions)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Diário</SelectItem>
              <SelectItem value="weekly">Semanal</SelectItem>
              <SelectItem value="monthly">Mensal</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handlePrintReport}>
            Imprimir
          </Button>
        </div>
      </div>

      <Tabs defaultValue="sales">
        <TabsList className="grid w-full grid-cols-2 overflow-y-hidden">
          <TabsTrigger value="sales">Vendas</TabsTrigger>
          <TabsTrigger value="services">Serviços</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Total de Vendas</CardTitle>
                <CardDescription>
                  {reportPeriod === "daily" ? "Hoje" : reportPeriod === "weekly" ? "Últimos 7 dias" : "Mês atual"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{currencyFormatter.format(reportData.totalSales)}</div>
                <p className="text-xs text-muted-foreground mt-1">{reportData.sales.length} vendas realizadas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Métodos de Pagamento</CardTitle>
                <CardDescription>Distribuição por método</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(reportData.paymentMethods).length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma venda no período</p>
                  ) : (
                    Object.entries(reportData.paymentMethods).map(([method, count]: [string, any]) => (
                      <div key={method} className="flex justify-between items-center">
                        <span>{method}</span>
                        <span className="font-medium">
                          {count} ({Math.round((count / reportData.sales.length) * 100)}%)
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Produtos Mais Vendidos</CardTitle>
                <CardDescription>Top 5 produtos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {reportData.topProducts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma venda no período</p>
                  ) : (
                    reportData.topProducts.map((product: any, index: number) => (
                      <div key={product.name} className="flex justify-between items-center">
                        <span>
                          {index + 1}. {product.name}
                        </span>
                        <span className="font-medium">{product.count} un.</span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Detalhamento de Vendas</CardTitle>
              <CardDescription>
                {reportPeriod === "daily"
                  ? "Vendas de hoje"
                  : reportPeriod === "weekly"
                    ? "Vendas dos últimos 7 dias"
                    : "Vendas do mês atual"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reportData.sales.length === 0 ? (
                <p className="text-center text-muted-foreground">Nenhuma venda no período selecionado</p>
              ) : (
                <div className="overflow-x-auto -mx-3 px-3 w-full bottom-spacing">
                  <Table className="min-w-[650px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead className="hidden sm:table-cell">Cliente</TableHead>
                        <TableHead>Itens</TableHead>
                        <TableHead className="hidden sm:table-cell">Método</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead className="w-[100px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.sales.map((sale: any) => (
                        <TableRow key={sale.id}>
                          <TableCell>{new Date(sale.date).toLocaleString()}</TableCell>
                          <TableCell className="hidden sm:table-cell">{sale.customer}</TableCell>
                          <TableCell>{sale.products.length} itens</TableCell>
                          <TableCell className="hidden sm:table-cell">{sale.paymentMethod}</TableCell>
                          <TableCell className={sale.canceled ? "line-through text-muted-foreground" : ""}>
                            {currencyFormatter.format(sale.total)}
                            {sale.canceled && <span className="ml-2 text-xs text-red-500">(Cancelada)</span>}
                          </TableCell>
                          <TableCell>
                            {!sale.canceled && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="destructive" size="sm" className="h-7 px-2 text-xs">
                                    Cancelar
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-[90vw] sm:max-w-md">
                                  <DialogHeader>
                                    <DialogTitle>Confirmar cancelamento</DialogTitle>
                                    <DialogDescription>
                                      Tem certeza que deseja cancelar esta venda? Esta ação irá:
                                      <ul className="list-disc pl-5 mt-2">
                                        <li>Marcar a venda como cancelada</li>
                                        <li>Devolver os produtos ao estoque</li>
                                        {sale.paymentMethod === "Dinheiro" && <li>Ajustar o saldo do caixa</li>}
                                      </ul>
                                    </DialogDescription>
                                  </DialogHeader>
                                  <DialogFooter>
                                    <Button variant="outline" type="button">
                                      Não
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      type="button"
                                      onClick={() => handleCancelSale(sale.id)}
                                    >
                                      Sim, cancelar venda
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            )}
                            {sale.canceled && (
                              <span className="text-xs text-muted-foreground">
                                Cancelada em {new Date(sale.canceledAt).toLocaleString()}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Ordens de Serviço</CardTitle>
                <CardDescription>
                  {reportPeriod === "daily" ? "Hoje" : reportPeriod === "weekly" ? "Últimos 7 dias" : "Mês atual"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const filteredOrders = filterByPeriod(serviceOrders, reportPeriod)
                  const totalRevenue = filteredOrders.reduce((sum, order) => sum + (order.price || 0), 0)

                  return (
                    <>
                      <div className="text-2xl font-bold">{filteredOrders.length} ordens</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Receita: {currencyFormatter.format(totalRevenue)}
                      </p>
                    </>
                  )
                })()}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Status das Ordens</CardTitle>
                <CardDescription>Distribuição por status</CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const filteredOrders = filterByPeriod(serviceOrders, reportPeriod)
                  const statusCounts: Record<string, number> = {}

                  filteredOrders.forEach((order) => {
                    statusCounts[order.status] = (statusCounts[order.status] || 0) + 1
                  })

                  return (
                    <div className="space-y-2">
                      {Object.entries(statusCounts).length === 0 ? (
                        <p className="text-sm text-muted-foreground">Nenhuma ordem no período</p>
                      ) : (
                        Object.entries(statusCounts).map(([status, count]: [string, any]) => (
                          <div key={status} className="flex justify-between items-center">
                            <span>{status}</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )
                })()}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Tipos de Dispositivos</CardTitle>
                <CardDescription>Distribuição por tipo</CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const filteredOrders = filterByPeriod(serviceOrders, reportPeriod)
                  const deviceCounts: Record<string, number> = {}

                  filteredOrders.forEach((order) => {
                    deviceCounts[order.deviceType] = (deviceCounts[order.deviceType] || 0) + 1
                  })

                  return (
                    <div className="space-y-2">
                      {Object.entries(deviceCounts).length === 0 ? (
                        <p className="text-sm text-muted-foreground">Nenhuma ordem no período</p>
                      ) : (
                        Object.entries(deviceCounts).map(([type, count]: [string, any]) => (
                          <div key={type} className="flex justify-between items-center">
                            <span>{type}</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )
                })()}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Detalhamento de Ordens de Serviço</CardTitle>
              <CardDescription>
                {reportPeriod === "daily"
                  ? "Ordens de hoje"
                  : reportPeriod === "weekly"
                    ? "Ordens dos últimos 7 dias"
                    : "Ordens do mês atual"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                const filteredOrders = filterByPeriod(serviceOrders, reportPeriod)

                return filteredOrders.length === 0 ? (
                  <p className="text-center text-muted-foreground">Nenhuma ordem no período selecionado</p>
                ) : (
                  <div className="no-scroll-table bottom-spacing">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>ID</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Dispositivo</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Valor</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredOrders.map((order: any) => (
                          <TableRow key={order.id}>
                            <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell>#{order.id.slice(-4)}</TableCell>
                            <TableCell>{order.customerName}</TableCell>
                            <TableCell>{`${order.deviceType} ${order.deviceBrand}`}</TableCell>
                            <TableCell>{order.status}</TableCell>
                            <TableCell>{order.price ? currencyFormatter.format(order.price) : "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )
              })()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}


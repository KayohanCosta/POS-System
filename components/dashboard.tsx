"use client"

import { useEffect, useState } from "react"
import { DashboardCard } from "@/components/ui/dashboard-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getWeekSales, getMonthSales, getCashRegisterStatus } from "@/lib/data-utils"
import {
  DollarSign,
  Package,
  ClipboardList,
  TrendingUp,
  AlertCircle,
  Users,
  Coffee,
  Utensils,
  Truck,
} from "lucide-react"
import { Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend)

export default function Dashboard() {
  const [todaySales, setTodaySales] = useState(0)
  const [weekSales, setWeekSales] = useState(0)
  const [monthSales, setMonthSales] = useState(0)
  const [cashStatus, setCashStatus] = useState({ isOpen: false, balance: 0 })
  const [productCount, setProductCount] = useState(0)
  const [pendingOrders, setPendingOrders] = useState(0)
  const [lowStockCount, setLowStockCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [salesData, setSalesData] = useState<any>(null)
  const [recentTransactions, setRecentTransactions] = useState<any[]>([])
  const [businessType, setBusinessType] = useState<string>("retail")
  const [tableCount, setTableCount] = useState({ total: 0, occupied: 0 })
  const [pendingDeliveries, setPendingDeliveries] = useState(0)
  const [pendingKitchenOrders, setPendingKitchenOrders] = useState(0)

  useEffect(() => {
    // Obter dados de vendas do localStorage
    const transactions = JSON.parse(localStorage.getItem("transactions") || "[]")

    // Carregar tipo de negócio
    const companySettings = JSON.parse(localStorage.getItem("companySettings") || "null")
    if (companySettings && companySettings.businessType) {
      setBusinessType(companySettings.businessType)
    }

    // Calcular vendas do dia (excluindo canceladas)
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    const vendasHoje = transactions.filter((venda: any) => {
      const dataVenda = new Date(venda.date)
      return dataVenda >= hoje && !venda.canceled
    })

    const totalVendasHoje = vendasHoje.reduce((total: number, venda: any) => total + venda.total, 0)

    setTodaySales(totalVendasHoje)
    setWeekSales(getWeekSales())
    setMonthSales(getMonthSales())

    // Get cash register status
    setCashStatus(getCashRegisterStatus())

    // Get product count and low stock
    const products = JSON.parse(localStorage.getItem("products") || "[]")
    setProductCount(products.length)

    // Count products with low stock
    const lowStock = products.filter((product: any) => {
      const minStock = product.stockMin || 5
      return product.stock <= minStock
    }).length
    setLowStockCount(lowStock)

    // Get pending service orders
    const serviceOrders = JSON.parse(localStorage.getItem("serviceOrders") || "[]")
    setPendingOrders(serviceOrders.filter((order: any) => order.status !== "Concluído").length)

    // Get recent transactions
    setRecentTransactions(
      transactions
        .filter((t: any) => !t.canceled)
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5),
    )

    // Prepare sales data for chart
    prepareSalesData(transactions)

    // Carregar dados específicos para restaurante/bar
    if (companySettings && (companySettings.businessType === "restaurant" || companySettings.businessType === "bar")) {
      // Carregar dados de mesas
      const tables = JSON.parse(localStorage.getItem("tables") || "[]")
      const occupiedTables = tables.filter((table: any) => table.status === "occupied").length
      setTableCount({
        total: tables.length,
        occupied: occupiedTables,
      })

      // Carregar pedidos de delivery pendentes
      const deliveryOrders = JSON.parse(localStorage.getItem("deliveryOrders") || "[]")
      setPendingDeliveries(deliveryOrders.filter((order: any) => order.status !== "delivered").length)

      // Carregar pedidos de cozinha pendentes
      const kitchenOrders = JSON.parse(localStorage.getItem("kitchenOrders") || "[]")
      setPendingKitchenOrders(kitchenOrders.filter((order: any) => order.status !== "completed").length)
    }

    setIsLoading(false)
  }, [])

  const prepareSalesData = (transactions: any[]) => {
    // Get last 7 days
    const dates = []
    const values = []

    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)

      dates.push(date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }))

      // Sum transactions for this day
      const dayTotal = transactions
        .filter((t: any) => {
          const tDate = new Date(t.date)
          return tDate.setHours(0, 0, 0, 0) === date.getTime() && !t.canceled
        })
        .reduce((sum: number, t: any) => sum + t.total, 0)

      values.push(dayTotal)
    }

    setSalesData({
      labels: dates,
      datasets: [
        {
          label: "Vendas diárias",
          data: values,
          backgroundColor: "rgba(59, 130, 246, 0.5)",
          borderColor: "rgb(59, 130, 246)",
          borderWidth: 2,
          tension: 0.3,
          pointBackgroundColor: "rgb(59, 130, 246)",
        },
      ],
    })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  // Renderizar dashboard específico para varejo
  const renderRetailDashboard = () => {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <DashboardCard
            title="Vendas Hoje"
            value={formatCurrency(todaySales)}
            description="Total de vendas do dia"
            icon={DollarSign}
          />

          <DashboardCard
            title="Caixa"
            value={cashStatus.isOpen ? "Aberto" : "Fechado"}
            description={`Saldo: ${formatCurrency(cashStatus.balance)}`}
            icon={TrendingUp}
          />

          <DashboardCard
            title="Produtos"
            value={productCount}
            description={lowStockCount > 0 ? `${lowStockCount} com estoque baixo` : "Estoque adequado"}
            icon={Package}
            trend={lowStockCount > 0 ? "down" : "neutral"}
            trendValue={lowStockCount > 0 ? `${lowStockCount}` : ""}
          />

          <DashboardCard
            title="Ordens de Serviço"
            value={pendingOrders}
            description="Ordens pendentes"
            icon={ClipboardList}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-medium">Vendas da Semana</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {salesData ? (
                <div className="h-[250px]">
                  <Line
                    data={salesData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            callback: (value) => formatCurrency(Number(value)),
                          },
                        },
                      },
                      plugins: {
                        legend: {
                          display: false,
                        },
                        tooltip: {
                          callbacks: {
                            label: (context) => formatCurrency(context.parsed.y),
                          },
                        },
                      },
                    }}
                  />
                </div>
              ) : (
                <div className="flex h-[250px] items-center justify-center">
                  <p className="text-muted-foreground">Carregando dados...</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-medium">Transações Recentes</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {recentTransactions.length > 0 ? (
                <div className="space-y-4">
                  {recentTransactions.map((transaction, index) => (
                    <div key={transaction.id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="mr-4 rounded-full bg-primary/10 p-2">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{transaction.customer || "Cliente não identificado"}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(transaction.date).toLocaleString("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm font-medium">{formatCurrency(transaction.total)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-[250px] items-center justify-center">
                  <p className="text-muted-foreground text-center">Nenhuma transação recente</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">Resumo Financeiro</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Vendas da semana:</span>
                  <span className="font-medium">{formatCurrency(weekSales)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Vendas do mês:</span>
                  <span className="font-medium">{formatCurrency(monthSales)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Média diária:</span>
                  <span className="font-medium">{formatCurrency(monthSales / new Date().getDate())}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Renderizar dashboard específico para restaurante/bar
  const renderRestaurantDashboard = () => {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <DashboardCard
            title="Vendas Hoje"
            value={formatCurrency(todaySales)}
            description="Total de vendas do dia"
            icon={DollarSign}
          />

          <DashboardCard
            title="Caixa"
            value={cashStatus.isOpen ? "Aberto" : "Fechado"}
            description={`Saldo: ${formatCurrency(cashStatus.balance)}`}
            icon={TrendingUp}
          />

          <DashboardCard
            title="Mesas"
            value={`${tableCount.occupied}/${tableCount.total}`}
            description={`${tableCount.occupied} mesas ocupadas`}
            icon={Coffee}
            trend={tableCount.occupied > tableCount.total / 2 ? "up" : "neutral"}
          />

          <DashboardCard
            title="Cozinha"
            value={pendingKitchenOrders}
            description="Pedidos pendentes"
            icon={Utensils}
            trend={pendingKitchenOrders > 5 ? "up" : "neutral"}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <DashboardCard
            title="Delivery"
            value={pendingDeliveries}
            description="Entregas pendentes"
            icon={Truck}
            trend={pendingDeliveries > 3 ? "up" : "neutral"}
          />

          <DashboardCard
            title="Cardápio"
            value={productCount}
            description={lowStockCount > 0 ? `${lowStockCount} itens com estoque baixo` : "Estoque adequado"}
            icon={Package}
            trend={lowStockCount > 0 ? "down" : "neutral"}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-medium">Vendas da Semana</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {salesData ? (
                <div className="h-[250px]">
                  <Line
                    data={salesData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            callback: (value) => formatCurrency(Number(value)),
                          },
                        },
                      },
                      plugins: {
                        legend: {
                          display: false,
                        },
                        tooltip: {
                          callbacks: {
                            label: (context) => formatCurrency(context.parsed.y),
                          },
                        },
                      },
                    }}
                  />
                </div>
              ) : (
                <div className="flex h-[250px] items-center justify-center">
                  <p className="text-muted-foreground">Carregando dados...</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-medium">Pedidos Recentes</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {recentTransactions.length > 0 ? (
                <div className="space-y-4">
                  {recentTransactions.map((transaction, index) => (
                    <div key={transaction.id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="mr-4 rounded-full bg-primary/10 p-2">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{transaction.customer || "Cliente não identificado"}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(transaction.date).toLocaleString("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm font-medium">{formatCurrency(transaction.total)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-[250px] items-center justify-center">
                  <p className="text-muted-foreground text-center">Nenhum pedido recente</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">Resumo Financeiro</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Vendas da semana:</span>
                  <span className="font-medium">{formatCurrency(weekSales)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Vendas do mês:</span>
                  <span className="font-medium">{formatCurrency(monthSales)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Média diária:</span>
                  <span className="font-medium">{formatCurrency(monthSales / new Date().getDate())}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Renderizar o dashboard apropriado com base no tipo de negócio
  return businessType === "retail" ? renderRetailDashboard() : renderRestaurantDashboard()
}


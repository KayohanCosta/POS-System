"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { Clock, CheckCircle } from "lucide-react"

type KitchenOrder = {
  id: string
  tableId?: string
  deliveryId?: string
  items: {
    id: string
    name: string
    quantity: number
    notes?: string
    status: "pending" | "preparing" | "ready" | "delivered"
  }[]
  status: "pending" | "preparing" | "ready" | "completed"
  priority: "normal" | "high"
  createdAt: string
  updatedAt: string
}

export default function Kitchen() {
  const { toast } = useToast()
  const [orders, setOrders] = useState<KitchenOrder[]>([])
  const [activeTab, setActiveTab] = useState("pending")

  useEffect(() => {
    // Carregar pedidos do localStorage
    const storedOrders = JSON.parse(localStorage.getItem("kitchenOrders") || "[]")
    setOrders(storedOrders)

    // Configurar atualização periódica
    const interval = setInterval(() => {
      const updatedOrders = JSON.parse(localStorage.getItem("kitchenOrders") || "[]")
      setOrders(updatedOrders)
    }, 10000) // Atualizar a cada 10 segundos

    return () => clearInterval(interval)
  }, [])

  const handleUpdateItemStatus = (
    orderId: string,
    itemId: string,
    newStatus: "pending" | "preparing" | "ready" | "delivered",
  ) => {
    const updatedOrders = orders.map((order) => {
      if (order.id === orderId) {
        const updatedItems = order.items.map((item) => {
          if (item.id === itemId) {
            return { ...item, status: newStatus }
          }
          return item
        })

        // Verificar se todos os itens estão prontos
        const allItemsReady = updatedItems.every((item) => item.status === "ready" || item.status === "delivered")
        const anyItemPreparing = updatedItems.some((item) => item.status === "preparing")

        let orderStatus = order.status
        if (allItemsReady) {
          orderStatus = "ready"
        } else if (anyItemPreparing) {
          orderStatus = "preparing"
        }

        return {
          ...order,
          items: updatedItems,
          status: orderStatus,
          updatedAt: new Date().toISOString(),
        }
      }
      return order
    })

    setOrders(updatedOrders)
    localStorage.setItem("kitchenOrders", JSON.stringify(updatedOrders))

    toast({
      title: "Status atualizado",
      description: `Item atualizado para ${getStatusLabel(newStatus)}`,
    })
  }

  const handleCompleteOrder = (orderId: string) => {
    const updatedOrders = orders.map((order) => {
      if (order.id === orderId) {
        return {
          ...order,
          status: "completed",
          updatedAt: new Date().toISOString(),
        }
      }
      return order
    })

    setOrders(updatedOrders)
    localStorage.setItem("kitchenOrders", JSON.stringify(updatedOrders))

    toast({
      title: "Pedido concluído",
      description: "Pedido marcado como concluído e enviado para entrega",
    })
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendente"
      case "preparing":
        return "Preparando"
      case "ready":
        return "Pronto"
      case "completed":
        return "Concluído"
      case "delivered":
        return "Entregue"
      default:
        return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "preparing":
        return "bg-blue-100 text-blue-800"
      case "ready":
        return "bg-green-100 text-green-800"
      case "completed":
        return "bg-gray-100 text-gray-800"
      case "delivered":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    return priority === "high" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const getTimeSince = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return "Agora"
    if (diffMins === 1) return "1 minuto"
    return `${diffMins} minutos`
  }

  const getOrderSource = (order: KitchenOrder) => {
    if (order.tableId) return `Mesa ${order.tableId}`
    if (order.deliveryId) return "Delivery"
    return "Balcão"
  }

  const filteredOrders = orders.filter((order) => {
    if (activeTab === "pending") return order.status === "pending" || order.status === "preparing"
    if (activeTab === "ready") return order.status === "ready"
    return order.status === "completed"
  })

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Controle de Cozinha</h1>
        <Badge className="px-2 py-1">
          {orders.filter((o) => o.status === "pending" || o.status === "preparing").length} pedidos pendentes
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" className="relative">
            Pendentes
            {orders.filter((o) => o.status === "pending" || o.status === "preparing").length > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center rounded-full bg-red-500 text-white text-xs">
                {orders.filter((o) => o.status === "pending" || o.status === "preparing").length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="ready">
            Prontos
            {orders.filter((o) => o.status === "ready").length > 0 && (
              <Badge className="ml-2 bg-green-100 text-green-800">
                {orders.filter((o) => o.status === "ready").length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed">Concluídos</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          {filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">Não há pedidos pendentes</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOrders.map((order) => (
                <Card key={order.id} className={order.priority === "high" ? "border-red-300" : ""}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          Pedido #{order.id.slice(-4)}
                          <Badge className={getPriorityColor(order.priority)}>
                            {order.priority === "high" ? "Prioritário" : "Normal"}
                          </Badge>
                        </CardTitle>
                        <CardDescription>{getOrderSource(order)}</CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {getTimeSince(order.createdAt)}
                        </div>
                        <Badge className={getStatusColor(order.status)}>{getStatusLabel(order.status)}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <ul className="space-y-2">
                      {order.items.map((item) => (
                        <li key={item.id} className="flex justify-between items-center">
                          <div>
                            <span className="font-medium">
                              {item.quantity}x {item.name}
                            </span>
                            {item.notes && <p className="text-xs text-muted-foreground">{item.notes}</p>}
                          </div>
                          <div className="flex gap-2">
                            <Badge className={getStatusColor(item.status)}>{getStatusLabel(item.status)}</Badge>
                            <div className="flex gap-1">
                              {item.status === "pending" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2 text-xs"
                                  onClick={() => handleUpdateItemStatus(order.id, item.id, "preparing")}
                                >
                                  Preparar
                                </Button>
                              )}
                              {item.status === "preparing" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2 text-xs"
                                  onClick={() => handleUpdateItemStatus(order.id, item.id, "ready")}
                                >
                                  Pronto
                                </Button>
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    {order.status === "ready" && (
                      <Button className="w-full" onClick={() => handleCompleteOrder(order.id)}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Concluir Pedido
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="ready" className="mt-4">
          {filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">Não há pedidos prontos para entrega</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOrders.map((order) => (
                <Card key={order.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">Pedido #{order.id.slice(-4)}</CardTitle>
                        <CardDescription>{getOrderSource(order)}</CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {getTimeSince(order.createdAt)}
                        </div>
                        <Badge className={getStatusColor(order.status)}>{getStatusLabel(order.status)}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <ul className="space-y-2">
                      {order.items.map((item) => (
                        <li key={item.id} className="flex justify-between items-center">
                          <div>
                            <span className="font-medium">
                              {item.quantity}x {item.name}
                            </span>
                            {item.notes && <p className="text-xs text-muted-foreground">{item.notes}</p>}
                          </div>
                          <Badge className={getStatusColor(item.status)}>{getStatusLabel(item.status)}</Badge>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" onClick={() => handleCompleteOrder(order.id)}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Concluir Pedido
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          {filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">Não há pedidos concluídos</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOrders.slice(0, 9).map((order) => (
                <Card key={order.id} className="opacity-80">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">Pedido #{order.id.slice(-4)}</CardTitle>
                        <CardDescription>{getOrderSource(order)}</CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatTime(order.updatedAt)}
                        </div>
                        <Badge className={getStatusColor(order.status)}>{getStatusLabel(order.status)}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {order.items.map((item) => (
                        <li key={item.id} className="text-sm">
                          {item.quantity}x {item.name}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}


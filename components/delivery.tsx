"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Phone, MapPin, Clock, Truck, CheckCircle, Plus, User } from "lucide-react"

type DeliveryOrder = {
  id: string
  customer: {
    name: string
    phone: string
    address: string
  }
  items: {
    id: string
    productId: string
    name: string
    price: number
    quantity: number
    notes?: string
  }[]
  total: number
  status: "pending" | "preparing" | "ready" | "out_for_delivery" | "delivered" | "canceled"
  paymentMethod: string
  paymentStatus: "pending" | "paid"
  createdAt: string
  updatedAt: string
  deliveryFee: number
  estimatedTime?: string
  deliveryNotes?: string
}

export default function Delivery() {
  const { toast } = useToast()
  const [orders, setOrders] = useState<DeliveryOrder[]>([])
  const [activeTab, setActiveTab] = useState("pending")
  const [isAddingOrder, setIsAddingOrder] = useState(false)
  const [products, setProducts] = useState<any[]>([])

  // Estado para novo pedido
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [customerAddress, setCustomerAddress] = useState("")
  const [deliveryNotes, setDeliveryNotes] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("money")
  const [deliveryFee, setDeliveryFee] = useState("5")
  const [selectedItems, setSelectedItems] = useState<any[]>([])
  const [currentProduct, setCurrentProduct] = useState("")
  const [productQuantity, setProductQuantity] = useState(1)
  const [productNote, setProductNote] = useState("")

  useEffect(() => {
    // Carregar pedidos do localStorage
    const storedOrders = JSON.parse(localStorage.getItem("deliveryOrders") || "[]")
    setOrders(storedOrders)

    // Carregar produtos
    const storedProducts = JSON.parse(localStorage.getItem("products") || "[]")
    setProducts(storedProducts)

    // Configurar atualização periódica
    const interval = setInterval(() => {
      const updatedOrders = JSON.parse(localStorage.getItem("deliveryOrders") || "[]")
      setOrders(updatedOrders)
    }, 10000) // Atualizar a cada 10 segundos

    return () => clearInterval(interval)
  }, [])

  const handleAddItem = () => {
    if (!currentProduct) {
      toast({
        title: "Erro",
        description: "Selecione um produto",
        variant: "destructive",
      })
      return
    }

    const product = products.find((p) => p.id === currentProduct)
    if (!product) return

    const newItem = {
      id: `item-${Date.now()}`,
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: productQuantity,
      notes: productNote || undefined,
    }

    setSelectedItems([...selectedItems, newItem])
    setCurrentProduct("")
    setProductQuantity(1)
    setProductNote("")

    toast({
      title: "Item adicionado",
      description: `${product.name} adicionado ao pedido`,
    })
  }

  const handleRemoveItem = (itemId: string) => {
    setSelectedItems(selectedItems.filter((item) => item.id !== itemId))
  }

  const calculateTotal = () => {
    const itemsTotal = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    return itemsTotal + Number.parseFloat(deliveryFee || "0")
  }

  const handleCreateOrder = () => {
    // Validar campos obrigatórios
    if (!customerName || !customerPhone || !customerAddress) {
      toast({
        title: "Erro",
        description: "Preencha todos os dados do cliente",
        variant: "destructive",
      })
      return
    }

    if (selectedItems.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um item ao pedido",
        variant: "destructive",
      })
      return
    }

    // Criar novo pedido
    const newOrder: DeliveryOrder = {
      id: `delivery-${Date.now()}`,
      customer: {
        name: customerName,
        phone: customerPhone,
        address: customerAddress,
      },
      items: selectedItems,
      total: calculateTotal(),
      status: "pending",
      paymentMethod,
      paymentStatus: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deliveryFee: Number.parseFloat(deliveryFee || "0"),
      deliveryNotes: deliveryNotes || undefined,
    }

    // Salvar pedido
    const updatedOrders = [...orders, newOrder]
    localStorage.setItem("deliveryOrders", JSON.stringify(updatedOrders))
    setOrders(updatedOrders)

    // Criar pedido para a cozinha
    const foodItems = selectedItems.filter((item) => {
      const product = products.find((p) => p.id === item.productId)
      return product && (product.category === "food" || product.category === "meal")
    })

    if (foodItems.length > 0) {
      const kitchenOrder = {
        id: `kitchen-${Date.now()}`,
        deliveryId: newOrder.id,
        items: foodItems.map((item) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          notes: item.notes,
          status: "pending",
        })),
        status: "pending",
        priority: "high", // Delivery tem prioridade alta
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const kitchenOrders = JSON.parse(localStorage.getItem("kitchenOrders") || "[]")
      localStorage.setItem("kitchenOrders", JSON.stringify([...kitchenOrders, kitchenOrder]))
    }

    // Limpar formulário
    setCustomerName("")
    setCustomerPhone("")
    setCustomerAddress("")
    setDeliveryNotes("")
    setPaymentMethod("money")
    setDeliveryFee("5")
    setSelectedItems([])
    setIsAddingOrder(false)

    toast({
      title: "Pedido criado",
      description: "Pedido de delivery criado com sucesso",
    })
  }

  const handleUpdateOrderStatus = (orderId: string, newStatus: DeliveryOrder["status"]) => {
    const updatedOrders = orders.map((order) => {
      if (order.id === orderId) {
        return {
          ...order,
          status: newStatus,
          updatedAt: new Date().toISOString(),
        }
      }
      return order
    })

    localStorage.setItem("deliveryOrders", JSON.stringify(updatedOrders))
    setOrders(updatedOrders)

    // Se o pedido foi entregue, registrar a venda
    if (newStatus === "delivered") {
      const order = orders.find((o) => o.id === orderId)
      if (order) {
        const transaction = {
          id: `transaction-${Date.now()}`,
          date: new Date().toISOString(),
          customer: order.customer.name,
          products: order.items,
          total: order.total,
          paymentMethod: order.paymentMethod,
          canceled: false,
        }

        const transactions = JSON.parse(localStorage.getItem("transactions") || "[]")
        localStorage.setItem("transactions", JSON.stringify([...transactions, transaction]))
      }
    }

    toast({
      title: "Status atualizado",
      description: `Pedido atualizado para ${getStatusLabel(newStatus)}`,
    })
  }

  const handleUpdatePaymentStatus = (orderId: string, newStatus: "pending" | "paid") => {
    const updatedOrders = orders.map((order) => {
      if (order.id === orderId) {
        return {
          ...order,
          paymentStatus: newStatus,
          updatedAt: new Date().toISOString(),
        }
      }
      return order
    })

    localStorage.setItem("deliveryOrders", JSON.stringify(updatedOrders))
    setOrders(updatedOrders)

    toast({
      title: "Pagamento atualizado",
      description: `Pagamento marcado como ${newStatus === "paid" ? "pago" : "pendente"}`,
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
      case "out_for_delivery":
        return "Em entrega"
      case "delivered":
        return "Entregue"
      case "canceled":
        return "Cancelado"
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
      case "out_for_delivery":
        return "bg-purple-100 text-purple-800"
      case "delivered":
        return "bg-gray-100 text-gray-800"
      case "canceled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPaymentStatusColor = (status: string) => {
    return status === "paid" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
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

  const filteredOrders = orders.filter((order) => {
    if (activeTab === "pending") {
      return order.status === "pending" || order.status === "preparing"
    }
    if (activeTab === "ready") {
      return order.status === "ready"
    }
    if (activeTab === "out_for_delivery") {
      return order.status === "out_for_delivery"
    }
    if (activeTab === "delivered") {
      return order.status === "delivered"
    }
    return order.status === "canceled"
  })

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Delivery</h1>
        <Button onClick={() => setIsAddingOrder(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Pedido
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
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
          <TabsTrigger value="out_for_delivery">
            Em Entrega
            {orders.filter((o) => o.status === "out_for_delivery").length > 0 && (
              <Badge className="ml-2 bg-purple-100 text-purple-800">
                {orders.filter((o) => o.status === "out_for_delivery").length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="delivered">Entregues</TabsTrigger>
          <TabsTrigger value="canceled">Cancelados</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">Não há pedidos nesta categoria</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOrders.map((order) => (
                <Card key={order.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          Pedido #{order.id.slice(-4)}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {order.customer.name}
                        </CardDescription>
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
                    <div className="space-y-2">
                      <div className="flex items-start gap-1 text-xs">
                        <Phone className="h-3 w-3 mt-0.5" />
                        <span>{order.customer.phone}</span>
                      </div>
                      <div className="flex items-start gap-1 text-xs">
                        <MapPin className="h-3 w-3 mt-0.5" />
                        <span>{order.customer.address}</span>
                      </div>
                      {order.deliveryNotes && (
                        <div className="text-xs text-muted-foreground">
                          <span className="font-medium">Obs:</span> {order.deliveryNotes}
                        </div>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t">
                      <h4 className="text-xs font-medium mb-1">Itens do pedido:</h4>
                      <ul className="space-y-1">
                        {order.items.map((item) => (
                          <li key={item.id} className="text-xs flex justify-between">
                            <span>
                              {item.quantity}x {item.name}
                            </span>
                            <span>{formatCurrency(item.price * item.quantity)}</span>
                          </li>
                        ))}
                        <li className="text-xs flex justify-between text-muted-foreground">
                          <span>Taxa de entrega</span>
                          <span>{formatCurrency(order.deliveryFee)}</span>
                        </li>
                        <li className="text-sm flex justify-between font-medium pt-1">
                          <span>Total</span>
                          <span>{formatCurrency(order.total)}</span>
                        </li>
                      </ul>
                    </div>

                    <div className="mt-3 pt-2 border-t flex justify-between items-center">
                      <div className="flex items-center gap-1">
                        <span className="text-xs">Pagamento:</span>
                        <Badge className={getPaymentStatusColor(order.paymentStatus)}>
                          {order.paymentStatus === "paid" ? "Pago" : "Pendente"}
                        </Badge>
                      </div>
                      <span className="text-xs">{order.paymentMethod}</span>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <div className="w-full space-y-2">
                      {(order.status === "pending" || order.status === "preparing") && (
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            size="sm"
                            className="w-full"
                            onClick={() => handleUpdateOrderStatus(order.id, "ready")}
                          >
                            Pronto
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="w-full"
                            onClick={() => handleUpdateOrderStatus(order.id, "canceled")}
                          >
                            Cancelar
                          </Button>
                        </div>
                      )}

                      {order.status === "ready" && (
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => handleUpdateOrderStatus(order.id, "out_for_delivery")}
                        >
                          <Truck className="h-4 w-4 mr-2" />
                          Saiu para Entrega
                        </Button>
                      )}

                      {order.status === "out_for_delivery" && (
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            size="sm"
                            className="w-full"
                            onClick={() => handleUpdateOrderStatus(order.id, "delivered")}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Entregue
                          </Button>
                          {order.paymentStatus === "pending" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full"
                              onClick={() => handleUpdatePaymentStatus(order.id, "paid")}
                            >
                              Marcar como Pago
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal para adicionar pedido */}
      <Dialog open={isAddingOrder} onOpenChange={setIsAddingOrder}>
        <DialogContent className="max-w-[90vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Pedido de Delivery</DialogTitle>
            <DialogDescription>Preencha as informações para criar um novo pedido</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="customerName">Nome do Cliente</Label>
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nome completo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerPhone">Telefone</Label>
              <Input
                id="customerPhone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerAddress">Endereço de Entrega</Label>
              <Textarea
                id="customerAddress"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="Endereço completo com referências"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliveryNotes">Observações da Entrega</Label>
              <Input
                id="deliveryNotes"
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                placeholder="Ex: Deixar na portaria, ligar ao chegar, etc."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger id="paymentMethod">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="money">Dinheiro</SelectItem>
                    <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                    <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deliveryFee">Taxa de Entrega (R$)</Label>
                <Input
                  id="deliveryFee"
                  type="number"
                  min="0"
                  step="0.5"
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2 border-t pt-4">
              <div className="flex justify-between items-center">
                <Label>Itens do Pedido</Label>
                <span className="text-xs text-muted-foreground">
                  {selectedItems.length} itens | Total: {formatCurrency(calculateTotal())}
                </span>
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="product" className="text-xs">
                      Produto
                    </Label>
                    <Select value={currentProduct} onValueChange={setCurrentProduct}>
                      <SelectTrigger id="product">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} - {formatCurrency(product.price)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="quantity" className="text-xs">
                      Quantidade
                    </Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={productQuantity}
                      onChange={(e) => setProductQuantity(Number.parseInt(e.target.value) || 1)}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="note" className="text-xs">
                    Observação
                  </Label>
                  <Input
                    id="note"
                    value={productNote}
                    onChange={(e) => setProductNote(e.target.value)}
                    placeholder="Ex: Sem cebola, bem passado, etc."
                  />
                </div>
                <Button size="sm" className="w-full" onClick={handleAddItem}>
                  Adicionar Item
                </Button>
              </div>

              {selectedItems.length > 0 && (
                <div className="mt-2 space-y-2">
                  <h4 className="text-xs font-medium">Itens adicionados:</h4>
                  <ul className="space-y-2">
                    {selectedItems.map((item) => (
                      <li key={item.id} className="flex justify-between items-center border-b pb-2">
                        <div>
                          <div className="text-sm">
                            {item.quantity}x {item.name}
                          </div>
                          {item.notes && <div className="text-xs text-muted-foreground">{item.notes}</div>}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{formatCurrency(item.price * item.quantity)}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => handleRemoveItem(item.id)}
                          >
                            <span className="sr-only">Remover</span>×
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingOrder(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateOrder}>Criar Pedido</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { getCashRegisterStatus, openCashRegister, closeCashRegister, addTransaction } from "@/lib/data-utils"
import { useLoyalty } from "@/lib/loyalty-service"

export default function CashRegister() {
  const { toast } = useToast()
  const [cashStatus, setCashStatus] = useState({ isOpen: false, balance: 0, openedAt: null })
  const [initialAmount, setInitialAmount] = useState("")
  const [closingAmount, setClosingAmount] = useState("")
  const [transactions, setTransactions] = useState<any[]>([])

  // Sale state
  const [products, setProducts] = useState<any[]>([])
  const [selectedProducts, setSelectedProducts] = useState<any[]>([])
  const [currentProduct, setCurrentProduct] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [paymentMethod, setPaymentMethod] = useState("Dinheiro")
  const [customerName, setCustomerName] = useState("")
  const [totalAmount, setTotalAmount] = useState(0)
  const [filteredProducts, setFilteredProducts] = useState<any[]>([])
  const [searchText, setSearchText] = useState("")

  // Table selection
  const [tables, setTables] = useState<any[]>([])
  const [selectedTable, setSelectedTable] = useState("")
  const [checkoutTable, setCheckoutTable] = useState<any>(null)

  const [paymentMethods, setPaymentMethods] = useState<Array<{ method: string; amount: string }>>([])
  const [totalPaid, setTotalPaid] = useState(0)
  const [remainingAmount, setRemainingAmount] = useState(0)

  const { customers, registerSalePoints } = useLoyalty()
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("")

  // Calcular o total pago e o valor restante quando os métodos de pagamento mudam
  useEffect(() => {
    const total = paymentMethods.reduce((sum, method) => {
      return sum + (Number.parseFloat(method.amount) || 0)
    }, 0)

    setTotalPaid(total)
    setRemainingAmount(totalAmount - total)
  }, [paymentMethods, totalAmount])

  // Função para adicionar/remover método de pagamento
  const handlePaymentMethodToggle = (method: string, checked: boolean) => {
    if (checked) {
      // Se o método for o primeiro a ser adicionado, atribuir o valor total
      const amount = paymentMethods.length === 0 ? totalAmount.toString() : "0"
      setPaymentMethods([...paymentMethods, { method, amount }])
    } else {
      setPaymentMethods(paymentMethods.filter((p) => p.method !== method))
    }
  }

  // Função para atualizar o valor de um método de pagamento
  const handlePaymentMethodAmountChange = (method: string, amount: string) => {
    setPaymentMethods(
      paymentMethods.map((p) => {
        if (p.method === method) {
          return { ...p, amount }
        }
        return p
      }),
    )
  }

  useEffect(() => {
    // Get cash register status
    const status = getCashRegisterStatus()
    setCashStatus(status)

    // Get products
    const storedProducts = JSON.parse(localStorage.getItem("products") || "[]")
    setProducts(storedProducts)
    setFilteredProducts([]) // Inicializar como array vazio

    // Get transactions
    const storedTransactions = JSON.parse(localStorage.getItem("transactions") || "[]")
    setTransactions(storedTransactions)

    // Get tables
    const storedTables = JSON.parse(localStorage.getItem("tables") || "[]")
    setTables(storedTables)

    // Check if there's a table checkout in progress
    const tableCheckout = localStorage.getItem("checkoutTable")
    if (tableCheckout) {
      const parsedCheckout = JSON.parse(tableCheckout)
      setCheckoutTable(parsedCheckout)

      // Pre-populate the sale with the table items
      setSelectedProducts(parsedCheckout.items)
      setCustomerName(`Mesa ${parsedCheckout.tableNumber}`)
      setTotalAmount(parsedCheckout.total)

      // Automatically switch to sales tab
      document.querySelector('[data-value="sales"]')?.click()

      // Clear the checkout data to prevent reloading it on refresh
      // We'll keep it in state but remove from localStorage
      localStorage.removeItem("checkoutTable")

      toast({
        title: "Conta da mesa carregada",
        description: `Itens da Mesa ${parsedCheckout.tableNumber} carregados para fechamento`,
      })
    }
  }, [])

  useEffect(() => {
    // Calculate total amount
    let total = 0
    selectedProducts.forEach((product) => {
      total += product.price * product.quantity
    })
    setTotalAmount(total)
  }, [selectedProducts])

  const handleOpenCashRegister = () => {
    if (!initialAmount || isNaN(Number.parseFloat(initialAmount))) {
      toast({
        title: "Erro",
        description: "Informe um valor inicial válido",
        variant: "destructive",
      })
      return
    }

    const amount = Number.parseFloat(initialAmount)
    const status = openCashRegister(amount)
    setCashStatus(status)
    setInitialAmount("")

    toast({
      title: "Caixa aberto",
      description: `Caixa aberto com saldo inicial de R$ ${amount.toFixed(2)}`,
    })
  }

  const handleCloseCashRegister = () => {
    if (!closingAmount || isNaN(Number.parseFloat(closingAmount))) {
      toast({
        title: "Erro",
        description: "Informe um valor de fechamento válido",
        variant: "destructive",
      })
      return
    }

    const amount = Number.parseFloat(closingAmount)
    const status = closeCashRegister(amount)
    setCashStatus(status)
    setClosingAmount("")

    toast({
      title: "Caixa fechado",
      description: `Caixa fechado com saldo final de R$ ${cashStatus.balance.toFixed(2)}`,
    })
  }

  const handleAddProduct = () => {
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

    // Verificar se uma mesa foi selecionada para restaurantes
    const businessType = localStorage.getItem("businessType") || "retail"
    if (businessType === "restaurant" && !selectedTable && !checkoutTable) {
      toast({
        title: "Erro",
        description: "Selecione uma mesa para adicionar o produto",
        variant: "destructive",
      })
      return
    }

    // Se for um produto para uma mesa específica, adicionar à mesa
    if (businessType === "restaurant" && selectedTable && !checkoutTable) {
      const updatedTables = tables.map((table) => {
        if (table.id === selectedTable && table.status === "occupied" && table.currentOrder) {
          const orderItem = {
            id: `item-${Date.now()}`,
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: quantity,
            notes: "",
            addedAt: new Date().toISOString(),
          }

          const updatedItems = [...table.currentOrder.items, orderItem]
          const total = updatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

          // Criar pedido para a cozinha se for um item de comida
          if (product.category === "food" || product.category === "meal") {
            const kitchenOrders = JSON.parse(localStorage.getItem("kitchenOrders") || "[]")

            // Verificar se já existe um pedido para esta mesa
            const kitchenOrder = kitchenOrders.find(
              (order: any) =>
                order.tableId === table.id && (order.status === "pending" || order.status === "preparing"),
            )

            if (kitchenOrder) {
              // Adicionar item ao pedido existente
              kitchenOrder.items.push({
                id: orderItem.id,
                name: product.name,
                quantity: quantity,
                notes: "",
                status: "pending",
              })

              const updatedKitchenOrders = kitchenOrders.map((order: any) =>
                order.id === kitchenOrder.id ? kitchenOrder : order,
              )

              localStorage.setItem("kitchenOrders", JSON.stringify(updatedKitchenOrders))
            } else {
              // Criar novo pedido
              const newKitchenOrder = {
                id: `kitchen-${Date.now()}`,
                tableId: table.id,
                items: [
                  {
                    id: orderItem.id,
                    name: product.name,
                    quantity: quantity,
                    notes: "",
                    status: "pending",
                  },
                ],
                status: "pending",
                priority: "normal",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }

              localStorage.setItem("kitchenOrders", JSON.stringify([...kitchenOrders, newKitchenOrder]))
            }
          }

          return {
            ...table,
            currentOrder: {
              ...table.currentOrder,
              items: updatedItems,
              total: total,
            },
          }
        }
        return table
      })

      localStorage.setItem("tables", JSON.stringify(updatedTables))
      setTables(updatedTables)

      toast({
        title: "Produto adicionado",
        description: `${product.name} adicionado à mesa ${tables.find((t) => t.id === selectedTable)?.number}`,
      })

      setCurrentProduct("")
      setQuantity(1)
      setSearchText("")
      return
    }

    const existingProduct = selectedProducts.find((p) => p.id === product.id)
    if (existingProduct) {
      const updatedProducts = selectedProducts.map((p) => {
        if (p.id === product.id) {
          return { ...p, quantity: p.quantity + quantity }
        }
        return p
      })
      setSelectedProducts(updatedProducts)
    } else {
      setSelectedProducts([...selectedProducts, { ...product, quantity }])
    }

    setCurrentProduct("")
    setQuantity(1)
    setSearchText("")
  }

  const handleRemoveProduct = (id: string) => {
    setSelectedProducts(selectedProducts.filter((p) => p.id !== id))
  }

  const handleCompleteSale = () => {
    if (selectedProducts.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione produtos à venda",
        variant: "destructive",
      })
      return
    }

    // Create transaction
    const transaction = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      customer: customerName || "Cliente não identificado",
      customerId: selectedCustomerId,
      products: selectedProducts,
      total: totalAmount,
      paymentMethod,
      canceled: false,
    }

    // Add transaction
    addTransaction(transaction)

    // Registrar pontos de fidelidade se cliente selecionado
    if (selectedCustomerId) {
      registerSalePoints(selectedCustomerId, totalAmount, transaction.id)
    }

    // Update state
    setTransactions([transaction, ...transactions])

    // Se for um checkout de mesa, liberar a mesa
    if (checkoutTable) {
      const updatedTables = tables.map((table) => {
        if (table.id === checkoutTable.tableId) {
          return {
            ...table,
            status: "free",
            occupiedAt: undefined,
            currentOrder: undefined,
          }
        }
        return table
      })

      localStorage.setItem("tables", JSON.stringify(updatedTables))
      setTables(updatedTables)
      setCheckoutTable(null)

      toast({
        title: "Mesa liberada",
        description: `Mesa ${checkoutTable.tableNumber} foi liberada após pagamento`,
      })
    }

    // Limpar dados
    setSelectedProducts([])
    setCustomerName("")
    setPaymentMethod("Dinheiro")
    setSelectedTable("")
    setSelectedCustomerId("")

    toast({
      title: "Venda realizada",
      description: `Venda de R$ ${totalAmount.toFixed(2)} concluída com sucesso`,
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(amount)
  }

  const handleCheckout = () => {
    if (selectedProducts.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione produtos ao carrinho para finalizar a venda",
        variant: "destructive",
      })
      return
    }

    // Verificar se há métodos de pagamento selecionados
    if (paymentMethods.length === 0) {
      toast({
        title: "Forma de pagamento não selecionada",
        description: "Selecione pelo menos uma forma de pagamento",
        variant: "destructive",
      })
      return
    }

    // Verificar se o valor total pago é suficiente
    if (totalPaid < totalAmount) {
      toast({
        title: "Valor insuficiente",
        description: `Faltam R$ ${remainingAmount.toFixed(2)} para completar o pagamento`,
        variant: "destructive",
      })
      return
    }

    // Criar transação
    const transaction = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      customer: customerName || "Cliente não identificado",
      customerId: selectedCustomerId,
      products: selectedProducts.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
      total: totalAmount,
      paymentMethods: paymentMethods.map((p) => ({
        method: p.method,
        amount: Number.parseFloat(p.amount) || 0,
      })),
      canceled: false,
    }

    // Adicionar transação
    addTransaction(transaction)

    // Registrar pontos de fidelidade se cliente selecionado
    if (selectedCustomerId) {
      registerSalePoints(selectedCustomerId, totalAmount, transaction.id)
    }

    // Limpar dados
    setSelectedProducts([])
    setCustomerName("")
    setPaymentMethod("Dinheiro")
    setPaymentMethods([])
    setSelectedCustomerId("")

    // Update state
    setTransactions([transaction, ...transactions])

    // Se for um checkout de mesa, liberar a mesa
    if (checkoutTable) {
      const updatedTables = tables.map((table) => {
        if (table.id === checkoutTable.tableId) {
          return {
            ...table,
            status: "free",
            occupiedAt: undefined,
            currentOrder: undefined,
          }
        }
        return table
      })

      localStorage.setItem("tables", JSON.stringify(updatedTables))
      setTables(updatedTables)
      setCheckoutTable(null)

      toast({
        title: "Mesa liberada",
        description: `Mesa ${checkoutTable.tableNumber} foi liberada após pagamento`,
      })
    }

    toast({
      title: "Venda finalizada",
      description: `Pagamento de R$ ${totalAmount.toFixed(2)} realizado com sucesso`,
    })
  }

  // Filtrar apenas mesas ocupadas
  const occupiedTables = tables.filter((table) => table.status === "occupied")

  return (
    <div className="h-full overflow-auto">
      <Tabs defaultValue={cashStatus.isOpen ? "sales" : "register"} className="h-full">
        <TabsList className="w-full grid grid-cols-2 h-auto py-1 mb-2">
          <TabsTrigger value="register" className="text-xs sm:text-sm py-1 px-2 h-auto">
            Abertura/Fechamento
          </TabsTrigger>
          <TabsTrigger value="sales" disabled={!cashStatus.isOpen} className="text-xs sm:text-sm py-1 px-2 h-auto">
            Vendas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="register" className="mt-0">
          <Card className="card-compact w-full">
            <CardHeader className="pb-1">
              <CardTitle className="text-sm">Controle de Caixa</CardTitle>
              <CardDescription className="text-xs">
                {cashStatus.isOpen
                  ? `Caixa aberto em ${new Date(cashStatus.openedAt as string).toLocaleString()}`
                  : "Caixa fechado"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 py-1">
              {!cashStatus.isOpen ? (
                <div className="space-y-2">
                  <div className="space-y-1">
                    <Label htmlFor="initialAmount" className="text-xs">
                      Valor Inicial (R$)
                    </Label>
                    <Input
                      id="initialAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={initialAmount}
                      onChange={(e) => setInitialAmount(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <Button onClick={handleOpenCashRegister} className="h-8 text-xs py-0 w-full">
                    Abrir Caixa
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="p-2 border rounded-md">
                    <h3 className="text-xs font-medium">Resumo do Caixa</h3>
                    <p className="mt-1 text-xs">Saldo atual: R$ {cashStatus.balance.toFixed(2)}</p>
                    <p className="text-xs">
                      Total de vendas:{" "}
                      {
                        transactions.filter((t) => {
                          const transactionDate = new Date(t.date)
                          const openedAt = new Date(cashStatus.openedAt as string)
                          return transactionDate >= openedAt
                        }).length
                      }
                    </p>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="closingAmount" className="text-xs">
                      Valor em Caixa (R$)
                    </Label>
                    <Input
                      id="closingAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={closingAmount}
                      onChange={(e) => setClosingAmount(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <Button variant="destructive" onClick={handleCloseCashRegister} className="h-8 text-xs py-0 w-full">
                    Fechar Caixa
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales" className="mt-0 h-full overflow-visible">
          <div className="w-full">
            <Card className="card-compact h-auto">
              <CardHeader className="pb-1">
                <CardTitle className="text-sm">
                  {checkoutTable ? `Finalizar Conta - Mesa ${checkoutTable.tableNumber}` : "Nova Venda"}
                </CardTitle>
                <CardDescription className="text-xs">
                  {checkoutTable ? `Total: R$ ${totalAmount.toFixed(2)}` : "Adicione produtos à venda"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 py-1">
                <div className="space-y-1">
                  <Label htmlFor="customerName" className="text-xs">
                    Nome do Cliente
                  </Label>
                  <Input
                    id="customerName"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Cliente não identificado"
                    className="h-8 text-xs"
                    disabled={!!checkoutTable}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="customerSelect" className="text-xs">
                    Cliente Fidelidade
                  </Label>
                  <select
                    id="customerSelect"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
                    value={selectedCustomerId}
                    onChange={(e) => {
                      setSelectedCustomerId(e.target.value)
                      if (e.target.value) {
                        const customer = customers.find((c) => c.id === e.target.value)
                        if (customer) {
                          setCustomerName(customer.name)
                        }
                      }
                    }}
                  >
                    <option value="">Selecione um cliente (opcional)</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} - {customer.phone}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Seleção de mesa para restaurantes */}
                {localStorage.getItem("businessType") === "restaurant" && !checkoutTable && (
                  <div className="space-y-1">
                    <Label htmlFor="tableSelect" className="text-xs">
                      Mesa
                    </Label>
                    <Select value={selectedTable} onValueChange={setSelectedTable}>
                      <SelectTrigger id="tableSelect" className="h-8 text-xs">
                        <SelectValue placeholder="Selecione uma mesa" />
                      </SelectTrigger>
                      <SelectContent>
                        {occupiedTables.map((table) => (
                          <SelectItem key={table.id} value={table.id} className="text-xs">
                            Mesa {table.number}{" "}
                            {table.currentOrder?.total > 0 ? `- R$ ${table.currentOrder.total.toFixed(2)}` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid gap-1 grid-cols-3">
                  <div className="col-span-2">
                    <Label htmlFor="productSearch" className="text-xs">
                      Buscar Produto
                    </Label>
                    <div className="relative">
                      <Input
                        id="productSearch"
                        placeholder="Digite para buscar produtos"
                        className="h-8 text-xs pr-8"
                        value={searchText}
                        onChange={(e) => {
                          const searchTerm = e.target.value.toLowerCase()
                          setSearchText(e.target.value)

                          if (searchTerm === "") {
                            setFilteredProducts([])
                            setCurrentProduct("")
                            return
                          }

                          // Filter products based on search term
                          const filtered = products.filter(
                            (p) =>
                              p.name.toLowerCase().includes(searchTerm) ||
                              (p.description && p.description.toLowerCase().includes(searchTerm)),
                          )

                          // If only one product matches and it's an exact match, select it
                          if (filtered.length === 1 && filtered[0].name.toLowerCase() === searchTerm) {
                            setCurrentProduct(filtered[0].id)
                            setFilteredProducts([])
                          } else if (filtered.length > 0) {
                            // Show dropdown with matches
                            setFilteredProducts(filtered)
                            setCurrentProduct("")
                          } else {
                            // No matches
                            setFilteredProducts([])
                            setCurrentProduct("")
                          }
                        }}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-muted-foreground"
                        >
                          <circle cx="11" cy="11" r="8" />
                          <path d="m21 21-4.3-4.3" />
                        </svg>
                      </div>
                    </div>
                    <div className="border rounded-md bg-background shadow-md w-full mt-1 max-h-28 overflow-y-auto z-50 absolute left-0 right-0">
                      {filteredProducts.map((product) => (
                        <div
                          key={product.id}
                          className="px-2 py-1 text-xs hover:bg-accent cursor-pointer flex items-center justify-between"
                          onClick={() => {
                            setCurrentProduct(product.id)
                            setSearchText(product.name)
                            setFilteredProducts([])
                          }}
                        >
                          <span className="truncate inline-block max-w-[60%]">{product.name}</span>
                          <span className="text-muted-foreground text-right whitespace-nowrap">
                            R$ {product.price.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="quantity" className="text-xs">
                      Qtd
                    </Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Number.parseInt(e.target.value) || 1)}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <Button onClick={handleAddProduct} className="h-8 text-xs py-0 w-full">
                  Adicionar
                </Button>

                <div className="overflow-auto max-h-[120px]">
                  <h3 className="text-xs font-medium mb-1">Produtos Selecionados</h3>
                  {selectedProducts.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Nenhum produto selecionado</p>
                  ) : (
                    <div className="overflow-x-auto w-full">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs p-1">Produto</TableHead>
                            <TableHead className="text-xs p-1 w-[40px]">Qtd</TableHead>
                            <TableHead className="text-xs p-1">Preço</TableHead>
                            <TableHead className="text-xs p-1 w-[30px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedProducts.map((product) => (
                            <TableRow key={product.id}>
                              <TableCell className="text-xs py-0.5 px-1 max-w-[120px] truncate">
                                {product.name}
                              </TableCell>
                              <TableCell className="text-xs py-0.5 px-1">{product.quantity}</TableCell>
                              <TableCell className="text-xs py-0.5 px-1">R$ {product.price.toFixed(2)}</TableCell>
                              <TableCell className="text-xs py-0.5 px-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveProduct(product.id)}
                                  className="h-6 w-6 p-0 min-h-0 flex items-center justify-center"
                                >
                                  X
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex-col items-start space-y-2 pt-1 pb-2 px-3">
                <div className="w-full">
                  <h3 className="text-sm font-semibold mb-2">Pagamento</h3>

                  <div className="space-y-1 mb-2">
                    <Label htmlFor="customerName" className="text-xs">
                      Nome do Cliente
                    </Label>
                    <Input
                      id="customerName"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Cliente não identificado"
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs font-medium">Formas de Pagamento</Label>
                      <p className="text-xs text-muted-foreground mb-2">Selecione uma ou mais formas de pagamento</p>
                    </div>
                    <div className="space-y-3">
                      {/* Pagamento em Dinheiro */}
                      <div className="border rounded-md p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="cashPayment"
                              className="w-4 h-4 text-xs"
                              checked={paymentMethods.some((p) => p.method === "Dinheiro")}
                              onChange={(e) => handlePaymentMethodToggle("Dinheiro", e.target.checked)}
                            />
                            <Label htmlFor="cashPayment" className="font-medium text-xs">
                              Dinheiro
                            </Label>
                          </div>
                          {paymentMethods.some((p) => p.method === "Dinheiro") && (
                            <div className="flex items-center space-x-2">
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                className="w-24 h-8 text-xs"
                                value={paymentMethods.find((p) => p.method === "Dinheiro")?.amount || ""}
                                onChange={(e) => handlePaymentMethodAmountChange("Dinheiro", e.target.value)}
                                placeholder="0.00"
                              />
                              <span className="text-xs">R$</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Pagamento com Cartão de Crédito */}
                      <div className="border rounded-md p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="creditCardPayment"
                              className="w-4 h-4 text-xs"
                              checked={paymentMethods.some((p) => p.method === "Cartão de Crédito")}
                              onChange={(e) => handlePaymentMethodToggle("Cartão de Crédito", e.target.checked)}
                            />
                            <Label htmlFor="creditCardPayment" className="font-medium text-xs">
                              Cartão de Crédito
                            </Label>
                          </div>
                          {paymentMethods.some((p) => p.method === "Cartão de Crédito") && (
                            <div className="flex items-center space-x-2">
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                className="w-24 h-8 text-xs"
                                value={paymentMethods.find((p) => p.method === "Cartão de Crédito")?.amount || ""}
                                onChange={(e) => handlePaymentMethodAmountChange("Cartão de Crédito", e.target.value)}
                                placeholder="0.00"
                              />
                              <span className="text-xs">R$</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Pagamento com Cartão de Débito */}
                      <div className="border rounded-md p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="debitCardPayment"
                              className="w-4 h-4 text-xs"
                              checked={paymentMethods.some((p) => p.method === "Cartão de Débito")}
                              onChange={(e) => handlePaymentMethodToggle("Cartão de Débito", e.target.checked)}
                            />
                            <Label htmlFor="debitCardPayment" className="font-medium text-xs">
                              Cartão de Débito
                            </Label>
                          </div>
                          {paymentMethods.some((p) => p.method === "Cartão de Débito") && (
                            <div className="flex items-center space-x-2">
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                className="w-24 h-8 text-xs"
                                value={paymentMethods.find((p) => p.method === "Cartão de Débito")?.amount || ""}
                                onChange={(e) => handlePaymentMethodAmountChange("Cartão de Débito", e.target.value)}
                                placeholder="0.00"
                              />
                              <span className="text-xs">R$</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Pagamento com PIX */}
                      <div className="border rounded-md p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="pixPayment"
                              className="w-4 h-4 text-xs"
                              checked={paymentMethods.some((p) => p.method === "PIX")}
                              onChange={(e) => handlePaymentMethodToggle("PIX", e.target.checked)}
                            />
                            <Label htmlFor="pixPayment" className="font-medium text-xs">
                              PIX
                            </Label>
                          </div>
                          {paymentMethods.some((p) => p.method === "PIX") && (
                            <div className="flex items-center space-x-2">
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                className="w-24 h-8 text-xs"
                                value={paymentMethods.find((p) => p.method === "PIX")?.amount || ""}
                                onChange={(e) => handlePaymentMethodAmountChange("PIX", e.target.value)}
                                placeholder="0.00"
                              />
                              <span className="text-xs">R$</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Resumo do pagamento */}
                      <div className="bg-muted p-3 rounded-md space-y-2">
                        <div className="flex justify-between text-xs">
                          <span>Total a pagar:</span>
                          <span className="font-bold">{formatCurrency(totalAmount)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>Total informado:</span>
                          <span
                            className={`font-medium ${totalPaid < totalAmount ? "text-red-500" : totalPaid > totalAmount ? "text-green-500" : ""}`}
                          >
                            {formatCurrency(totalPaid)}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>Diferença:</span>
                          <span className={`font-bold ${remainingAmount > 0 ? "text-red-500" : "text-red-500"}`}>
                            {formatCurrency(Math.abs(remainingAmount))}{" "}
                            {remainingAmount > 0 ? "(faltando)" : remainingAmount < 0 ? "(troco)" : ""}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}


"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Clock, Plus, Edit, Users, DollarSign, Search, Printer } from "lucide-react"
import { useRouter } from "next/navigation"

type Table = {
  id: string
  number: string
  capacity: number
  status: "free" | "occupied" | "reserved"
  occupiedAt?: string
  reservedFor?: string
  reservedAt?: string
  currentOrder?: {
    id: string
    items: any[]
    total: number
    startedAt: string
  }
}

export default function Tables() {
  const router = useRouter()
  const { toast } = useToast()
  const [tables, setTables] = useState<Table[]>([])
  const [isAddingTable, setIsAddingTable] = useState(false)
  const [isEditingTable, setIsEditingTable] = useState(false)
  const [currentTable, setCurrentTable] = useState<Table | null>(null)
  const [tableNumber, setTableNumber] = useState("")
  const [tableCapacity, setTableCapacity] = useState("4")
  const [products, setProducts] = useState<any[]>([])
  const [selectedProduct, setSelectedProduct] = useState("")
  const [productQuantity, setProductQuantity] = useState(1)
  const [productNote, setProductNote] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const tablesPerPage = 24
  const [showTableDetails, setShowTableDetails] = useState(false)

  useEffect(() => {
    // Carregar mesas do localStorage
    const storedTables = JSON.parse(localStorage.getItem("tables") || "[]")
    if (storedTables.length === 0) {
      // Criar mesas padrão se não existirem
      const defaultTables = Array.from({ length: 12 }, (_, i) => ({
        id: `table-${i + 1}`,
        number: `${i + 1}`,
        capacity: 4,
        status: "free",
      }))
      localStorage.setItem("tables", JSON.stringify(defaultTables))
      setTables(defaultTables)
    } else {
      setTables(storedTables)
    }

    // Carregar produtos
    const storedProducts = JSON.parse(localStorage.getItem("products") || "[]")
    setProducts(storedProducts)
  }, [])

  const handleAddTable = () => {
    if (!tableNumber) {
      toast({
        title: "Erro",
        description: "Informe o número da mesa",
        variant: "destructive",
      })
      return
    }

    // Verificar se já existe mesa com este número
    if (tables.some((table) => table.number === tableNumber)) {
      toast({
        title: "Erro",
        description: "Já existe uma mesa com este número",
        variant: "destructive",
      })
      return
    }

    // Verificar se já atingiu o limite de 500 mesas
    if (tables.length >= 500) {
      toast({
        title: "Limite atingido",
        description: "O sistema suporta no máximo 500 mesas",
        variant: "destructive",
      })
      return
    }

    const newTable: Table = {
      id: `table-${Date.now()}`,
      number: tableNumber,
      capacity: Number.parseInt(tableCapacity) || 4,
      status: "free",
    }

    const updatedTables = [...tables, newTable]
    localStorage.setItem("tables", JSON.stringify(updatedTables))
    setTables(updatedTables)

    setTableNumber("")
    setTableCapacity("4")
    setIsAddingTable(false)

    toast({
      title: "Mesa adicionada",
      description: `Mesa ${newTable.number} adicionada com sucesso`,
    })
  }

  const handleEditTable = () => {
    if (!currentTable) return

    if (!tableNumber) {
      toast({
        title: "Erro",
        description: "Informe o número da mesa",
        variant: "destructive",
      })
      return
    }

    // Verificar se já existe outra mesa com este número
    if (tables.some((table) => table.number === tableNumber && table.id !== currentTable.id)) {
      toast({
        title: "Erro",
        description: "Já existe uma mesa com este número",
        variant: "destructive",
      })
      return
    }

    const updatedTables = tables.map((table) => {
      if (table.id === currentTable.id) {
        return {
          ...table,
          number: tableNumber,
          capacity: Number.parseInt(tableCapacity) || 4,
        }
      }
      return table
    })

    localStorage.setItem("tables", JSON.stringify(updatedTables))
    setTables(updatedTables)

    setCurrentTable(null)
    setTableNumber("")
    setTableCapacity("4")
    setIsEditingTable(false)

    toast({
      title: "Mesa atualizada",
      description: `Mesa ${tableNumber} atualizada com sucesso`,
    })
  }

  const handleDeleteTable = (tableId: string) => {
    const tableToDelete = tables.find((table) => table.id === tableId)
    if (!tableToDelete) return

    if (tableToDelete.status === "occupied") {
      toast({
        title: "Operação não permitida",
        description: "Não é possível excluir uma mesa ocupada",
        variant: "destructive",
      })
      return
    }

    const updatedTables = tables.filter((table) => table.id !== tableId)
    localStorage.setItem("tables", JSON.stringify(updatedTables))
    setTables(updatedTables)

    toast({
      title: "Mesa removida",
      description: `Mesa ${tableToDelete.number} removida com sucesso`,
    })
  }

  const handleOccupyTable = (tableId: string) => {
    const updatedTables = tables.map((table) => {
      if (table.id === tableId) {
        return {
          ...table,
          status: "occupied",
          occupiedAt: new Date().toISOString(),
          currentOrder: {
            id: `order-${Date.now()}`,
            items: [],
            total: 0,
            startedAt: new Date().toISOString(),
          },
        }
      }
      return table
    })

    localStorage.setItem("tables", JSON.stringify(updatedTables))
    setTables(updatedTables)

    toast({
      title: "Mesa ocupada",
      description: "Mesa marcada como ocupada",
    })
  }

  // Modificar a função handleFreeTable para mostrar detalhes da mesa
  const handleFreeTable = (tableId: string) => {
    const tableToFree = tables.find((table) => table.id === tableId)
    if (!tableToFree || !tableToFree.currentOrder) return

    // Se houver itens no pedido, mostrar detalhes da mesa
    if (tableToFree.currentOrder.items.length > 0) {
      setCurrentTable(tableToFree)
      setShowTableDetails(true)
      return
    }

    // Se não houver itens, apenas liberar a mesa
    const updatedTables = tables.map((table) => {
      if (table.id === tableId) {
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

    toast({
      title: "Mesa liberada",
      description: "Mesa marcada como livre",
    })
  }

  // Adicionar função para imprimir comanda
  const printTableNote = (table: Table) => {
    if (!table.currentOrder || table.currentOrder.items.length === 0) {
      toast({
        title: "Sem itens",
        description: "Não há itens para imprimir na comanda",
        variant: "destructive",
      })
      return
    }

    // Obter configurações da comanda
    const companySettings = JSON.parse(localStorage.getItem("companySettings") || "{}")
    const receiptSettings = companySettings.receipt || {
      header: "Obrigado pela preferência!",
      footer: "Volte sempre!",
      showLogo: true,
      showAddress: true,
      showPhone: true,
      fontSize: "medium",
    }

    // Criar uma nova janela para a comanda
    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      toast({
        title: "Erro",
        description:
          "Não foi possível abrir a janela de impressão. Verifique se o bloqueador de pop-ups está desativado.",
        variant: "destructive",
      })
      return
    }

    // Formatar a data atual
    const now = new Date()
    const dateFormatted = now.toLocaleDateString()
    const timeFormatted = now.toLocaleTimeString()

    // Calcular o total
    const total = table.currentOrder.items.reduce((sum, item) => sum + item.price * item.quantity, 0)

    // Definir tamanho da fonte com base nas configurações
    let fontSize = "12px"
    if (receiptSettings.fontSize === "small") fontSize = "10px"
    if (receiptSettings.fontSize === "large") fontSize = "14px"

    // Modifique a linha que usa localStorage
    const currentUser =
      typeof window !== "undefined" ? localStorage.getItem("currentUser") || "Não identificado" : "Não identificado"

    // Criar o conteúdo HTML da comanda
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Comanda - Mesa ${table.number}</title>
        <style>
          body {
            font-family: 'Courier New', monospace;
            font-size: ${fontSize};
            width: 80mm;
            margin: 0 auto;
            padding: 5mm;
          }
          .header {
            text-align: center;
            margin-bottom: 10px;
            border-bottom: 1px dashed #000;
            padding-bottom: 10px;
          }
          .title {
            font-size: ${Number.parseInt(fontSize) + 2}px;
            font-weight: bold;
          }
          .info {
            margin: 5px 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            text-align: left;
            padding: 3px 0;
          }
          .quantity {
            text-align: center;
            width: 15%;
          }
          .price {
            text-align: right;
            width: 25%;
          }
          .total-row {
            border-top: 1px dashed #000;
            font-weight: bold;
          }
          .footer {
            margin-top: 10px;
            text-align: center;
            border-top: 1px dashed #000;
            padding-top: 10px;
          }
          @media print {
            body {
              width: 80mm;
              margin: 0;
              padding: 0;
            }
            button {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${companySettings.name || "COMANDA"}</div>
          ${receiptSettings.showLogo ? `<img src="${companySettings.logoUrl}" alt="Logo" style="max-width: 60px; max-height: 60px; margin: 5px auto; display: block;">` : ""}
          <div class="info">Mesa: ${table.number}</div>
          <div class="info">Data: ${dateFormatted} - ${timeFormatted}</div>
          <div class="info">Atendente: Colaborador</div>
          ${receiptSettings.showAddress && companySettings.address ? `<div class="info">${companySettings.address}</div>` : ""}
          ${receiptSettings.showPhone && companySettings.phone ? `<div class="info">${companySettings.phone}</div>` : ""}
          ${receiptSettings.header ? `<div class="info">${receiptSettings.header}</div>` : ""}
        </div>
        
        <table>
          <thead>
            <tr>
              <th class="quantity">Qtd</th>
              <th>Item</th>
              <th class="price">Valor</th>
            </tr>
          </thead>
          <tbody>
            ${table.currentOrder.items
              .map(
                (item) => `
              <tr>
                <td class="quantity">${item.quantity}x</td>
                <td>${item.name}</td>
                <td class="price">R$ ${(item.price * item.quantity).toFixed(2)}</td>
              </tr>
              ${item.notes ? `<tr><td></td><td colspan="2" style="font-size: ${Number.parseInt(fontSize) - 2}px; font-style: italic;">${item.notes}</td></tr>` : ""}
            `,
              )
              .join("")}
            <tr class="total-row">
              <td colspan="2">TOTAL</td>
              <td class="price">R$ ${total.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
        
        <div class="footer">
          ${receiptSettings.footer || "Obrigado pela preferência!"}
        </div>
        
        <div style="text-align: center; margin-top: 20px;">
          <button onclick="window.print();" style="padding: 5px 10px;">Imprimir</button>
        </div>
      </body>
      </html>
    `)

    printWindow.document.close()

    toast({
      title: "Comanda gerada",
      description: "A comanda foi gerada e está pronta para impressão",
    })
  }

  const handleAddProductToTable = (tableId: string) => {
    if (!selectedProduct) {
      toast({
        title: "Erro",
        description: "Selecione um produto",
        variant: "destructive",
      })
      return
    }

    const product = products.find((p) => p.id === selectedProduct)
    if (!product) return

    const updatedTables = tables.map((table) => {
      if (table.id === tableId && table.currentOrder) {
        const orderItem = {
          id: `item-${Date.now()}`,
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: productQuantity,
          notes: productNote,
          addedAt: new Date().toISOString(),
        }

        const updatedItems = [...table.currentOrder.items, orderItem]
        const total = updatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

        // Criar pedido para a cozinha se for um item de comida
        if (product.category === "food" || product.category === "meal") {
          const kitchenOrders = JSON.parse(localStorage.getItem("kitchenOrders") || "[]")

          // Verificar se já existe um pedido para esta mesa
          const kitchenOrder = kitchenOrders.find(
            (order: any) => order.tableId === table.id && (order.status === "pending" || order.status === "preparing"),
          )

          if (kitchenOrder) {
            // Adicionar item ao pedido existente
            kitchenOrder.items.push({
              id: orderItem.id,
              name: product.name,
              quantity: productQuantity,
              notes: productNote,
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
                  quantity: productQuantity,
                  notes: productNote,
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

    setSelectedProduct("")
    setProductQuantity(1)
    setProductNote("")

    toast({
      title: "Produto adicionado",
      description: `${product.name} adicionado ao pedido`,
    })
  }

  const handleRemoveProductFromTable = (tableId: string, itemId: string) => {
    const updatedTables = tables.map((table) => {
      if (table.id === tableId && table.currentOrder) {
        const updatedItems = table.currentOrder.items.filter((item) => item.id !== itemId)
        const total = updatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

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
      title: "Produto removido",
      description: "Item removido do pedido",
    })
  }

  // Na função handleCheckout, altere o redirecionamento para a página de checkout
  const handleCheckout = (tableId: string) => {
    const table = tables.find((t) => t.id === tableId)
    if (!table || !table.currentOrder) return

    // Salvar a ordem atual no localStorage para o caixa acessar
    localStorage.setItem(
      "checkoutTable",
      JSON.stringify({
        tableId: table.id,
        tableNumber: table.number,
        items: table.currentOrder.items,
        total: table.currentOrder.total,
      }),
    )

    // Redirecionar para a página de checkout
    router.push("/checkout")
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const formatTime = (dateString?: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const getTimeSince = (dateString?: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return "Agora"
    if (diffMins === 1) return "1 minuto"
    return `${diffMins} minutos`
  }

  // Filtrar e paginar mesas
  const filteredTables = tables
    .filter((table) => searchTerm === "" || table.number.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      // Ordenar por número (considerando que podem ser strings com letras)
      return a.number.localeCompare(b.number, undefined, { numeric: true })
    })

  const totalPages = Math.ceil(filteredTables.length / tablesPerPage)
  const paginatedTables = filteredTables.slice((currentPage - 1) * tablesPerPage, currentPage * tablesPerPage)

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h1 className="text-2xl font-bold">Controle de Mesas</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Input
              placeholder="Buscar mesa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          </div>
          <Button onClick={() => setIsAddingTable(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Mesa
          </Button>
        </div>
      </div>

      {/* Paginação superior */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            Mostrando {(currentPage - 1) * tablesPerPage + 1}-
            {Math.min(currentPage * tablesPerPage, filteredTables.length)} de {filteredTables.length} mesas
          </div>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {paginatedTables.map((table) => (
          <Card
            key={table.id}
            className={`
              ${table.status === "free" ? "bg-green-50 border-green-300" : "bg-red-50 border-red-300"}
              cursor-pointer transition-all hover:shadow-md
            `}
            onClick={() => {
              if (table.status === "occupied") {
                setCurrentTable(table)
                setShowTableDetails(true)
              } else {
                handleOccupyTable(table.id)
              }
            }}
          >
            <CardHeader className="p-2 pb-0">
              <div className="flex justify-between items-start">
                <CardTitle className="text-base">Mesa {table.number}</CardTitle>
                <Badge className={table.status === "free" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                  {table.status === "free" ? "Livre" : "Ocupada"}
                </Badge>
              </div>
              <CardDescription className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {table.capacity} lugares
              </CardDescription>
            </CardHeader>
            <CardContent className="p-2 pt-1">
              {table.status === "occupied" && table.occupiedAt && (
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Ocupada há {getTimeSince(table.occupiedAt)}
                </div>
              )}
              {table.status === "occupied" && table.currentOrder && (
                <div className="text-xs font-medium mt-1 flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  {formatCurrency(table.currentOrder.total)}
                </div>
              )}
            </CardContent>
            <CardFooter className="p-2 pt-0 flex gap-2">
              {table.status === "free" ? (
                <>
                  <Button
                    size="sm"
                    className="h-7 text-xs flex-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleOccupyTable(table.id)
                    }}
                  >
                    Ocupar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 w-7 p-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      setCurrentTable(table)
                      setTableNumber(table.number)
                      setTableCapacity(table.capacity.toString())
                      setIsEditingTable(true)
                    }}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="sm"
                    className="h-7 text-xs flex-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      setCurrentTable(table)
                      setShowTableDetails(true)
                    }}
                  >
                    Detalhes
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleFreeTable(table.id)
                    }}
                  >
                    Liberar
                  </Button>
                </>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Paginação inferior */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
              Primeira
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>

            <div className="flex items-center px-2">
              <span className="text-sm">
                {currentPage} de {totalPages}
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Próxima
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              Última
            </Button>
          </div>
        </div>
      )}

      {/* Modal para adicionar mesa */}
      <Dialog open={isAddingTable} onOpenChange={setIsAddingTable}>
        <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Nova Mesa</DialogTitle>
            <DialogDescription>Preencha as informações para adicionar uma nova mesa</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="tableNumber">Número da Mesa</Label>
              <Input
                id="tableNumber"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="Ex: 1, 2, 3..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tableCapacity">Capacidade (lugares)</Label>
              <Input
                id="tableCapacity"
                type="number"
                min="1"
                value={tableCapacity}
                onChange={(e) => setTableCapacity(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingTable(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddTable}>Adicionar Mesa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para editar mesa */}
      <Dialog open={isEditingTable} onOpenChange={setIsEditingTable}>
        <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Mesa</DialogTitle>
            <DialogDescription>Atualize as informações da mesa</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="editTableNumber">Número da Mesa</Label>
              <Input
                id="editTableNumber"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="Ex: 1, 2, 3..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editTableCapacity">Capacidade (lugares)</Label>
              <Input
                id="editTableCapacity"
                type="number"
                min="1"
                value={tableCapacity}
                onChange={(e) => setTableCapacity(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsEditingTable(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditTable}>Salvar Alterações</Button>
            {currentTable && (
              <Button
                variant="destructive"
                onClick={() => {
                  handleDeleteTable(currentTable.id)
                  setIsEditingTable(false)
                }}
              >
                Excluir Mesa
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de detalhes da mesa */}
      <Dialog
        open={!!currentTable && showTableDetails}
        onOpenChange={(open) => {
          if (!open) {
            setCurrentTable(null)
            setShowTableDetails(false)
          }
        }}
      >
        <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
          {currentTable && (
            <>
              <DialogHeader>
                <DialogTitle>Mesa {currentTable.number}</DialogTitle>
                <DialogDescription>
                  {currentTable.status === "occupied" && currentTable.occupiedAt
                    ? `Ocupada há ${getTimeSince(currentTable.occupiedAt)}`
                    : "Detalhes da mesa"}
                </DialogDescription>
              </DialogHeader>

              {currentTable.status === "occupied" && currentTable.currentOrder && (
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Pedido atual</h3>
                    {currentTable.currentOrder.items.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nenhum item adicionado</p>
                    ) : (
                      <div className="space-y-2">
                        {currentTable.currentOrder.items.map((item) => (
                          <div key={item.id} className="flex justify-between items-start border-b pb-2">
                            <div>
                              <div className="flex items-center gap-1">
                                <span className="font-medium text-sm">{item.quantity}x</span>
                                <span className="text-sm">{item.name}</span>
                              </div>
                              {item.notes && <p className="text-xs text-muted-foreground">{item.notes}</p>}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{formatCurrency(item.price * item.quantity)}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => handleRemoveProductFromTable(currentTable.id, item.id)}
                              >
                                <span className="sr-only">Remover</span>×
                              </Button>
                            </div>
                          </div>
                        ))}
                        <div className="flex justify-between font-medium pt-2">
                          <span>Total</span>
                          <span>{formatCurrency(currentTable.currentOrder.total)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 border-t pt-4">
                    <h3 className="text-sm font-medium">Adicionar item</h3>
                    <div className="space-y-2">
                      <Label htmlFor="product" className="text-xs">
                        Produto
                      </Label>
                      <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                        <SelectTrigger id="product" className="h-8">
                          <SelectValue placeholder="Selecione um produto" />
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
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label htmlFor="quantity" className="text-xs">
                          Quantidade
                        </Label>
                        <Input
                          id="quantity"
                          type="number"
                          min="1"
                          className="h-8"
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
                        className="h-8"
                        value={productNote}
                        onChange={(e) => setProductNote(e.target.value)}
                        placeholder="Ex: Sem cebola, bem passado, etc."
                      />
                    </div>
                    <Button className="w-full mt-2" size="sm" onClick={() => handleAddProductToTable(currentTable.id)}>
                      Adicionar Item
                    </Button>
                  </div>
                </div>
              )}

              <DialogFooter className="flex flex-col sm:flex-row gap-2">
                {currentTable.status === "occupied" && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        printTableNote(currentTable)
                      }}
                      className="flex items-center gap-1"
                    >
                      <Printer className="h-4 w-4" />
                      Imprimir Comanda
                    </Button>
                    <Button
                      variant="default"
                      onClick={() => {
                        handleCheckout(currentTable.id)
                        setCurrentTable(null)
                        setShowTableDetails(false)
                      }}
                    >
                      Encerrar Conta
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        // Liberar a mesa diretamente
                        const updatedTables = tables.map((table) => {
                          if (table.id === currentTable.id) {
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

                        toast({
                          title: "Mesa liberada",
                          description: "Mesa marcada como livre",
                        })

                        setCurrentTable(null)
                        setShowTableDetails(false)
                      }}
                    >
                      Liberar Mesa
                    </Button>
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}


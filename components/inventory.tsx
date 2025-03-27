"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"

// Tipo para movimentação de estoque
type InventoryMovement = {
  id: string
  productId: string
  type: "entrada" | "saida" | "ajuste"
  quantity: number
  reason: string
  date: string
  userId: string
}

export default function Inventory() {
  const { toast } = useToast()
  const [products, setProducts] = useState<any[]>([])
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [filteredProducts, setFilteredProducts] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterLowStock, setFilterLowStock] = useState(false)

  // Estado para o modal de movimentação
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [movementType, setMovementType] = useState<"entrada" | "saida" | "ajuste">("entrada")
  const [movementQuantity, setMovementQuantity] = useState("1")
  const [movementReason, setMovementReason] = useState("")

  useEffect(() => {
    // Carregar produtos do localStorage
    const storedProducts = JSON.parse(localStorage.getItem("products") || "[]")
    setProducts(storedProducts)
    setFilteredProducts(storedProducts)

    // Carregar movimentações do localStorage
    const storedMovements = JSON.parse(localStorage.getItem("inventoryMovements") || "[]")
    setMovements(storedMovements)
  }, [])

  useEffect(() => {
    // Filtrar produtos com base no termo de busca e filtro de estoque baixo
    let filtered = [...products]

    if (searchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.description?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (filterLowStock) {
      filtered = filtered.filter((product) => product.stock <= (product.stockMin || 5))
    }

    setFilteredProducts(filtered)
  }, [products, searchTerm, filterLowStock])

  const handleAddMovement = () => {
    if (!selectedProduct) {
      toast({
        title: "Erro",
        description: "Selecione um produto",
        variant: "destructive",
      })
      return
    }

    const quantity = Number.parseInt(movementQuantity)
    if (isNaN(quantity) || quantity <= 0) {
      toast({
        title: "Erro",
        description: "Informe uma quantidade válida",
        variant: "destructive",
      })
      return
    }

    if (!movementReason) {
      toast({
        title: "Erro",
        description: "Informe um motivo para a movimentação",
        variant: "destructive",
      })
      return
    }

    // Verificar se há estoque suficiente para saída
    if (movementType === "saida" && selectedProduct.stock < quantity) {
      toast({
        title: "Erro",
        description: "Estoque insuficiente para esta saída",
        variant: "destructive",
      })
      return
    }

    // Criar nova movimentação
    const newMovement: InventoryMovement = {
      id: Date.now().toString(),
      productId: selectedProduct.id,
      type: movementType,
      quantity,
      reason: movementReason,
      date: new Date().toISOString(),
      userId: JSON.parse(localStorage.getItem("currentUser") || "{}").id || "unknown",
    }

    // Atualizar estoque do produto
    const updatedProducts = products.map((product) => {
      if (product.id === selectedProduct.id) {
        let newStock = product.stock

        if (movementType === "entrada") {
          newStock += quantity
        } else if (movementType === "saida") {
          newStock -= quantity
        } else if (movementType === "ajuste") {
          newStock = quantity // Ajuste direto
        }

        return { ...product, stock: newStock }
      }
      return product
    })

    // Salvar movimentação e produtos atualizados
    const updatedMovements = [...movements, newMovement]
    localStorage.setItem("inventoryMovements", JSON.stringify(updatedMovements))
    localStorage.setItem("products", JSON.stringify(updatedProducts))

    setMovements(updatedMovements)
    setProducts(updatedProducts)

    // Limpar formulário
    setSelectedProduct(null)
    setMovementQuantity("1")
    setMovementReason("")

    toast({
      title: "Movimentação registrada",
      description: `${movementType.charAt(0).toUpperCase() + movementType.slice(1)} de ${quantity} unidades registrada com sucesso`,
    })
  }

  const getStockStatus = (product: any) => {
    const minStock = product.stockMin || 5

    if (product.stock <= 0) {
      return { label: "Sem estoque", class: "bg-red-100 text-red-800" }
    } else if (product.stock <= minStock) {
      return { label: "Estoque baixo", class: "bg-yellow-100 text-yellow-800" }
    } else {
      return { label: "Estoque ok", class: "bg-green-100 text-green-800" }
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + " " + date.toLocaleTimeString()
  }

  const getMovementTypeLabel = (type: string) => {
    switch (type) {
      case "entrada":
        return "Entrada"
      case "saida":
        return "Saída"
      case "ajuste":
        return "Ajuste"
      default:
        return type
    }
  }

  const getProductName = (productId: string) => {
    const product = products.find((p) => p.id === productId)
    return product ? product.name : "Produto não encontrado"
  }

  const getUserName = (userId: string) => {
    const users = JSON.parse(localStorage.getItem("users") || "[]")
    const user = users.find((u: any) => u.id === userId)
    return user ? user.name : "Usuário desconhecido"
  }

  // Função para regular o espaçamento das colunas da tabela
  const getColumnClass = (columnName: string): string => {
    switch (columnName) {
      case "produto":
        return "w-[25%] truncate-cell"
      case "descricao":
        return "w-[30%] truncate-cell hidden md:table-cell"
      case "estoque":
        return "w-[15%] text-center"
      case "status":
        return "w-[20%]"
      case "acoes":
        return "w-[15%] text-right"
      case "data":
        return "w-[20%]"
      case "tipo":
        return "w-[15%]"
      case "quantidade":
        return "w-[15%] text-center"
      case "motivo":
        return "w-[25%] truncate-cell hidden md:table-cell"
      case "usuario":
        return "w-[20%] truncate-cell hidden md:table-cell"
      default:
        return ""
    }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="inventory" className="w-full">
        <TabsList className="w-full grid grid-cols-2 h-auto py-1 mb-2">
          <TabsTrigger value="inventory" className="text-xs sm:text-sm py-1 px-2 h-auto">
            Estoque
          </TabsTrigger>
          <TabsTrigger value="movements" className="text-xs sm:text-sm py-1 px-2 h-auto">
            Movimentações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="mt-0">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <CardTitle>Controle de Estoque</CardTitle>
                  <CardDescription>Gerencie o estoque de produtos</CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <div className="relative w-full sm:w-auto">
                    <Input
                      placeholder="Buscar produtos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full sm:w-[200px]"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="filterLowStock"
                      checked={filterLowStock}
                      onChange={(e) => setFilterLowStock(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="filterLowStock" className="text-xs cursor-pointer">
                      Mostrar apenas estoque baixo
                    </Label>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredProducts.length === 0 ? (
                <p className="text-center text-muted-foreground">Nenhum produto encontrado</p>
              ) : (
                <div className="w-full overflow-x-auto -mx-3 px-3">
                  <Table className="table-fixed w-full min-w-[600px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead className={getColumnClass("produto")}>Produto</TableHead>
                        <TableHead className={getColumnClass("descricao")}>Descrição</TableHead>
                        <TableHead className={getColumnClass("estoque")}>Estoque</TableHead>
                        <TableHead className={getColumnClass("status")}>Status</TableHead>
                        <TableHead className={getColumnClass("acoes")}>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.map((product) => {
                        const status = getStockStatus(product)
                        return (
                          <TableRow key={product.id}>
                            <TableCell className={`font-medium truncate ${getColumnClass("produto")}`}>
                              {product.name}
                            </TableCell>
                            <TableCell className={`truncate ${getColumnClass("descricao")}`}>
                              {product.description || "-"}
                            </TableCell>
                            <TableCell className={getColumnClass("estoque")}>{product.stock}</TableCell>
                            <TableCell>
                              <Badge className={`${status.class} px-2 py-1 text-xs font-medium`}>{status.label}</Badge>
                            </TableCell>
                            <TableCell>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-2 text-xs"
                                    onClick={() => setSelectedProduct(product)}
                                  >
                                    Movimentar
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-[90vw] sm:max-w-md">
                                  <DialogHeader>
                                    <DialogTitle>Movimentação de Estoque</DialogTitle>
                                    <DialogDescription>
                                      Registre entrada, saída ou ajuste de estoque para {product.name}
                                    </DialogDescription>
                                  </DialogHeader>

                                  <div className="space-y-4 py-2">
                                    <div className="space-y-2">
                                      <Label htmlFor="movementType">Tipo de Movimentação</Label>
                                      <Select
                                        value={movementType}
                                        onValueChange={(value: "entrada" | "saida" | "ajuste") =>
                                          setMovementType(value)
                                        }
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Selecione o tipo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="entrada">Entrada</SelectItem>
                                          <SelectItem value="saida">Saída</SelectItem>
                                          <SelectItem value="ajuste">Ajuste</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    <div className="space-y-2">
                                      <Label htmlFor="quantity">
                                        {movementType === "ajuste" ? "Novo valor do estoque" : "Quantidade"}
                                      </Label>
                                      <Input
                                        id="quantity"
                                        type="number"
                                        min="1"
                                        value={movementQuantity}
                                        onChange={(e) => setMovementQuantity(e.target.value)}
                                      />
                                    </div>

                                    <div className="space-y-2">
                                      <Label htmlFor="reason">Motivo</Label>
                                      <Input
                                        id="reason"
                                        value={movementReason}
                                        onChange={(e) => setMovementReason(e.target.value)}
                                        placeholder="Informe o motivo da movimentação"
                                      />
                                    </div>
                                  </div>

                                  <DialogFooter>
                                    <Button onClick={handleAddMovement}>Confirmar</Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Movimentações</CardTitle>
              <CardDescription>Registro de todas as movimentações de estoque</CardDescription>
            </CardHeader>
            <CardContent>
              {movements.length === 0 ? (
                <p className="text-center text-muted-foreground">Nenhuma movimentação registrada</p>
              ) : (
                <div className="w-full overflow-x-auto -mx-3 px-3 bottom-spacing">
                  <Table className="table-fixed w-full min-w-[600px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead className={getColumnClass("data")}>Data</TableHead>
                        <TableHead className={getColumnClass("produto")}>Produto</TableHead>
                        <TableHead className={getColumnClass("tipo")}>Tipo</TableHead>
                        <TableHead className={getColumnClass("quantidade")}>Quantidade</TableHead>
                        <TableHead className={getColumnClass("motivo")}>Motivo</TableHead>
                        <TableHead className={getColumnClass("usuario")}>Usuário</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {movements
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((movement) => (
                          <TableRow key={movement.id}>
                            <TableCell className={getColumnClass("data")}>{formatDate(movement.date)}</TableCell>
                            <TableCell className={getColumnClass("produto")}>
                              {getProductName(movement.productId)}
                            </TableCell>
                            <TableCell className={getColumnClass("tipo")}>
                              {getMovementTypeLabel(movement.type)}
                            </TableCell>
                            <TableCell className={getColumnClass("quantidade")}>{movement.quantity}</TableCell>
                            <TableCell className={getColumnClass("motivo")}>{movement.reason}</TableCell>
                            <TableCell className={getColumnClass("usuario")}>{getUserName(movement.userId)}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}


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

export default function RestaurantInventory() {
  const { toast } = useToast()
  const [products, setProducts] = useState<any[]>([])
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [filteredProducts, setFilteredProducts] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterLowStock, setFilterLowStock] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [filterCategory, setFilterCategory] = useState("")

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
    const storedMovements = JSON.parse(localStorage.getItem("restaurantInventoryMovements") || "[]")
    setMovements(storedMovements)

    // Carregar categorias
    const storedCategories = JSON.parse(localStorage.getItem("productCategories") || "[]")
    setCategories(storedCategories)
  }, [])

  useEffect(() => {
    // Filtrar produtos com base no termo de busca, filtro de estoque baixo e categoria
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

    if (filterCategory) {
      filtered = filtered.filter((product) => product.category === filterCategory)
    }

    setFilteredProducts(filtered)
  }, [products, searchTerm, filterLowStock, filterCategory])

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
    localStorage.setItem("restaurantInventoryMovements", JSON.stringify(updatedMovements))
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

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId)
    return category ? category.name : "Sem categoria"
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="inventory" className="w-full">
        <TabsList className="w-full grid grid-cols-2 h-auto py-1 mb-2">
          <TabsTrigger value="inventory" className="text-xs sm:text-sm py-1 px-2 h-auto">
            Estoque de Insumos
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
                  <CardTitle>Controle de Estoque de Insumos</CardTitle>
                  <CardDescription>Gerencie o estoque de insumos para a cozinha</CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <div className="relative w-full sm:w-auto">
                    <Input
                      placeholder="Buscar insumos..."
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
              <div className="mb-4">
                <Label htmlFor="filterCategory" className="text-xs">
                  Filtrar por categoria
                </Label>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="h-8 mt-1">
                    <SelectValue placeholder="Todas as categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {filteredProducts.length === 0 ? (
                <p className="text-center text-muted-foreground">Nenhum insumo encontrado</p>
              ) : (
                <div className="overflow-x-auto w-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Insumo</TableHead>
                        <TableHead className="hidden md:table-cell">Categoria</TableHead>
                        <TableHead>Estoque</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.map((product) => {
                        const status = getStockStatus(product)
                        return (
                          <TableRow key={product.id}>
                            <TableCell className="font-medium max-w-[150px] truncate">{product.name}</TableCell>
                            <TableCell className="hidden md:table-cell">{getCategoryName(product.category)}</TableCell>
                            <TableCell>{product.stock}</TableCell>
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
                <div className="no-scroll-table bottom-spacing">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Insumo</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Quantidade</TableHead>
                        <TableHead className="hidden md:table-cell">Motivo</TableHead>
                        <TableHead className="hidden md:table-cell">Usuário</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {movements
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((movement) => (
                          <TableRow key={movement.id}>
                            <TableCell>{formatDate(movement.date)}</TableCell>
                            <TableCell>{getProductName(movement.productId)}</TableCell>
                            <TableCell>{getMovementTypeLabel(movement.type)}</TableCell>
                            <TableCell>{movement.quantity}</TableCell>
                            <TableCell className="hidden md:table-cell">{movement.reason}</TableCell>
                            <TableCell className="hidden md:table-cell">{getUserName(movement.userId)}</TableCell>
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


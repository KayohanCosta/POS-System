"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"

export default function Products() {
  const { toast } = useToast()
  const [products, setProducts] = useState<any[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [currentProduct, setCurrentProduct] = useState({
    id: "",
    name: "",
    description: "",
    price: "",
    stock: "",
    onlineStore: true,
    category: "other",
  })

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 4 // Número de itens por página reduzido para evitar scroll

  // Calcular produtos paginados
  const paginatedProducts = products.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  useEffect(() => {
    // Load products from localStorage
    const storedProducts = JSON.parse(localStorage.getItem("products") || "[]")
    setProducts(storedProducts)

    // Add this to the useEffect that loads initial data
    const storedCategories = JSON.parse(localStorage.getItem("productCategories") || "[]")
    if (storedCategories.length > 0) {
      setCategories(storedCategories)
    } else {
      // Default categories
      const defaultCategories = [
        { id: "hardware", name: "Hardware", color: "bg-blue-500" },
        { id: "perifericos", name: "Periféricos", color: "bg-green-500" },
        { id: "acessorios", name: "Acessórios", color: "bg-yellow-500" },
        { id: "celulares", name: "Celulares", color: "bg-purple-500" },
        { id: "other", name: "Outros", color: "bg-gray-500" },
      ]
      setCategories(defaultCategories)
    }
  }, [])

  const saveProducts = (updatedProducts: any[]) => {
    localStorage.setItem("products", JSON.stringify(updatedProducts))
    setProducts(updatedProducts)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setCurrentProduct({
      ...currentProduct,
      [name]: name === "price" || name === "stock" ? value : value,
    })
  }

  const handleAddProduct = () => {
    // Validate inputs
    if (!currentProduct.name || !currentProduct.price || !currentProduct.stock) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      })
      return
    }

    const price = Number.parseFloat(currentProduct.price)
    const stock = Number.parseInt(currentProduct.stock)

    if (isNaN(price) || isNaN(stock)) {
      toast({
        title: "Erro",
        description: "Preço e estoque devem ser números válidos",
        variant: "destructive",
      })
      return
    }

    const newProduct = {
      id: isEditing ? currentProduct.id : Date.now().toString(),
      name: currentProduct.name,
      description: currentProduct.description,
      price,
      stock,
      onlineStore: currentProduct.onlineStore,
      category: currentProduct.category,
    }

    let updatedProducts
    if (isEditing) {
      updatedProducts = products.map((product) => (product.id === currentProduct.id ? newProduct : product))
      toast({
        title: "Produto atualizado",
        description: `${newProduct.name} foi atualizado com sucesso`,
      })
    } else {
      updatedProducts = [...products, newProduct]
      toast({
        title: "Produto adicionado",
        description: `${newProduct.name} foi adicionado com sucesso`,
      })
    }

    saveProducts(updatedProducts)
    resetForm()
  }

  const handleEditProduct = (product: any) => {
    setIsEditing(true)
    setCurrentProduct({
      id: product.id,
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      stock: product.stock.toString(),
      onlineStore: product.onlineStore !== false, // Default to true if not set
      category: product.category || "other",
    })
  }

  const handleDeleteProduct = (id: string) => {
    const updatedProducts = products.filter((product) => product.id !== id)
    saveProducts(updatedProducts)
    toast({
      title: "Produto removido",
      description: "O produto foi removido com sucesso",
    })
  }

  const resetForm = () => {
    setIsEditing(false)
    setCurrentProduct({
      id: "",
      name: "",
      description: "",
      price: "",
      stock: "",
      onlineStore: true,
      category: "other",
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? "Editar Produto" : "Adicionar Produto"}</CardTitle>
          <CardDescription>
            {isEditing ? "Atualize as informações do produto" : "Preencha os dados para adicionar um novo produto"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Produto *</Label>
              <Input
                id="name"
                name="name"
                value={currentProduct.name}
                onChange={handleInputChange}
                placeholder="Nome do produto"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                name="description"
                value={currentProduct.description}
                onChange={handleInputChange}
                placeholder="Descrição do produto"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Preço (R$) *</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="0"
                value={currentProduct.price}
                onChange={handleInputChange}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock">Estoque *</Label>
              <Input
                id="stock"
                name="stock"
                type="number"
                min="0"
                value={currentProduct.stock}
                onChange={handleInputChange}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <select
                id="category"
                name="category"
                value={currentProduct.category || "other"}
                onChange={handleInputChange}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="onlineStore"
                  checked={currentProduct.onlineStore !== false}
                  onCheckedChange={(checked) => setCurrentProduct((prev) => ({ ...prev, onlineStore: checked }))}
                />
                <Label htmlFor="onlineStore" className="cursor-pointer">
                  Disponível na Loja Online
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">Desative esta opção para ocultar o produto na loja online</p>
            </div>
          </div>

          <div className="flex justify-end mt-4 space-x-2">
            {isEditing && (
              <Button variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
            )}
            <Button onClick={handleAddProduct}>{isEditing ? "Atualizar Produto" : "Adicionar Produto"}</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Produtos Cadastrados</CardTitle>
          <CardDescription>Total de produtos: {products.length}</CardDescription>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <p className="text-center text-muted-foreground">Nenhum produto cadastrado</p>
          ) : (
            <>
              <div className="overflow-x-auto w-full table-responsive bottom-spacing">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">Nome</TableHead>
                      <TableHead className="hidden md:table-cell">Descrição</TableHead>
                      <TableHead className="w-[80px]">Preço</TableHead>
                      <TableHead className="w-[60px]">Estoque</TableHead>
                      <TableHead className="w-[100px]">Loja Online</TableHead>
                      <TableHead className="w-[100px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="truncate max-w-[150px]">{product.name}</TableCell>
                        <TableCell className="hidden md:table-cell truncate max-w-[200px]">
                          {product.description || "-"}
                        </TableCell>
                        <TableCell>R$ {product.price.toFixed(2)}</TableCell>
                        <TableCell>{product.stock}</TableCell>
                        <TableCell>
                          {product.onlineStore !== false ? (
                            <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
                              Loja Online
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">
                              Oculto
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-row gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditProduct(product)}
                              className="h-7 px-2 text-xs"
                            >
                              Editar
                            </Button>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="destructive" size="sm" className="h-7 px-2 text-xs">
                                  Excluir
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-[90vw] sm:max-w-md">
                                <DialogHeader>
                                  <DialogTitle>Confirmar exclusão</DialogTitle>
                                  <DialogDescription>
                                    Tem certeza que deseja excluir o produto "{product.name}"? Esta ação não pode ser
                                    desfeita.
                                  </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                  <Button variant="destructive" onClick={() => handleDeleteProduct(product.id)}>
                                    Excluir
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


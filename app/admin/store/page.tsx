"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"

// Função utilitária para verificar se estamos no navegador
const isBrowser = () => typeof window !== "undefined"

// Funções seguras para localStorage
const getLocalStorage = (key: string, defaultValue: any = null) => {
  if (isBrowser()) {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : defaultValue
  }
  return defaultValue
}

const setLocalStorage = (key: string, value: any) => {
  if (isBrowser()) {
    localStorage.setItem(key, JSON.stringify(value))
  }
}

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { AppLayout } from "@/components/ui/layout"
import { getCurrentUser, logout } from "@/lib/auth-utils"
import { Camera, Plus, Store, ExternalLink, Trash, Edit } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function StoreAdminPage() {
  const { toast } = useToast()
  const [products, setProducts] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("store")
  const [companySettings, setCompanySettings] = useState({
    name: "Tecno Mania",
    logoUrl: "/images/logo.png",
    whatsapp: "",
  })
  const [isEditing, setIsEditing] = useState(false)
  const [currentProduct, setCurrentProduct] = useState<any>({
    id: "",
    name: "",
    description: "",
    price: "",
    stock: "",
    onlineStore: true,
    imageUrl: "",
  })

  // Category management
  const [categories, setCategories] = useState<any[]>([])
  const [currentCategory, setCurrentCategory] = useState({
    id: "",
    name: "",
    color: "bg-blue-500",
  })
  const [isEditingCategory, setIsEditingCategory] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  useEffect(() => {
    // Check if user is logged in
    const user = getCurrentUser()
    if (user) {
      setCurrentUser(user)
    } else {
      // Redirect to login if not logged in
      window.location.href = "/"
    }

    // Load products
    const storedProducts = getLocalStorage("products", [])
    setProducts(storedProducts)

    // Load company settings
    const storedSettings = getLocalStorage("companySettings", null)
    if (storedSettings) {
      setCompanySettings(storedSettings)
    }

    // Load categories
    loadCategories()
  }, [])

  const loadCategories = () => {
    // Get categories from localStorage or use default ones
    const storedCategories = getLocalStorage("productCategories", [])

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
      if (isBrowser()) {
        localStorage.setItem("productCategories", JSON.stringify(defaultCategories))
      }
    }
  }

  const handleLogout = () => {
    logout()
    window.location.href = "/"
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setCurrentProduct((prev) => ({
      ...prev,
      [name]: name === "price" || name === "stock" ? value : value,
    }))
  }

  const handleCategoryInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setCurrentCategory((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleCategoryColorChange = (color: string) => {
    setCurrentCategory((prev) => ({
      ...prev,
      color,
    }))
  }

  const handleOnlineStoreChange = (checked: boolean) => {
    setCurrentProduct((prev) => ({
      ...prev,
      onlineStore: checked,
    }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Create a preview URL
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setPreviewImage(result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveProduct = () => {
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

    // Create updated product object
    const updatedProduct = {
      ...currentProduct,
      price,
      stock,
      imageUrl: previewImage || currentProduct.imageUrl,
    }

    let updatedProducts
    if (isEditing) {
      // Update existing product
      updatedProducts = products.map((product) => (product.id === currentProduct.id ? updatedProduct : product))
      toast({
        title: "Produto atualizado",
        description: `${updatedProduct.name} foi atualizado com sucesso`,
      })
    } else {
      // Add new product
      const newProduct = {
        ...updatedProduct,
        id: Date.now().toString(),
      }
      updatedProducts = [...products, newProduct]
      toast({
        title: "Produto adicionado",
        description: `${newProduct.name} foi adicionado com sucesso`,
      })
    }

    // Save to localStorage
    setLocalStorage("products", updatedProducts)
    setProducts(updatedProducts)
    resetForm()
  }

  const handleSaveCategory = () => {
    // Validate inputs
    if (!currentCategory.name) {
      toast({
        title: "Erro",
        description: "Informe um nome para a categoria",
        variant: "destructive",
      })
      return
    }

    // Generate ID from name if not editing
    let categoryId = currentCategory.id
    if (!isEditingCategory) {
      categoryId = currentCategory.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\s]/g, "")
        .replace(/\s+/g, "_")
    }

    // Create updated category object
    const updatedCategory = {
      ...currentCategory,
      id: categoryId,
    }

    let updatedCategories
    if (isEditingCategory) {
      // Update existing category
      updatedCategories = categories.map((category) =>
        category.id === currentCategory.id ? updatedCategory : category,
      )
      toast({
        title: "Categoria atualizada",
        description: `${updatedCategory.name} foi atualizada com sucesso`,
      })
    } else {
      // Check if category with same ID already exists
      if (categories.some((cat) => cat.id === categoryId)) {
        toast({
          title: "Erro",
          description: "Já existe uma categoria com este nome",
          variant: "destructive",
        })
        return
      }

      // Add new category
      updatedCategories = [...categories, updatedCategory]
      toast({
        title: "Categoria adicionada",
        description: `${updatedCategory.name} foi adicionada com sucesso`,
      })
    }

    // Save to localStorage
    setLocalStorage("productCategories", updatedCategories)
    setCategories(updatedCategories)
    resetCategoryForm()
  }

  const handleEditCategory = (category: any) => {
    setCurrentCategory({
      id: category.id,
      name: category.name,
      color: category.color,
    })
    setIsEditingCategory(true)
  }

  const handleDeleteCategory = (categoryId: string) => {
    // Check if category is being used by any product
    const isInUse = products.some((product) => product.category === categoryId)

    if (isInUse) {
      toast({
        title: "Não é possível excluir",
        description: "Esta categoria está sendo usada por produtos",
        variant: "destructive",
      })
      return
    }

    // Remove category
    const updatedCategories = categories.filter((category) => category.id !== categoryId)
    localStorage.setItem("productCategories", JSON.stringify(updatedCategories))
    setCategories(updatedCategories)

    toast({
      title: "Categoria excluída",
      description: "A categoria foi excluída com sucesso",
    })
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
      imageUrl: product.imageUrl || "",
      category: product.category || "other",
    })
    setPreviewImage(product.imageUrl || null)
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
      imageUrl: "",
      category: "other",
    })
    setPreviewImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const resetCategoryForm = () => {
    setIsEditingCategory(false)
    setCurrentCategory({
      id: "",
      name: "",
      color: "bg-blue-500",
    })
  }

  const handleSaveSettings = () => {
    // Validate WhatsApp number
    if (!companySettings.whatsapp) {
      toast({
        title: "Erro",
        description: "Informe o número de WhatsApp da loja",
        variant: "destructive",
      })
      return
    }

    // Save settings to localStorage
    setLocalStorage("companySettings", companySettings)

    toast({
      title: "Configurações salvas",
      description: "As configurações da loja online foram atualizadas com sucesso",
    })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  return (
    <AppLayout onLogout={handleLogout} currentUser={currentUser} onTabChange={setActiveTab}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Loja Online</h1>
            <p className="text-muted-foreground">Gerencie os produtos e configurações da sua loja online</p>
          </div>
          <a
            href="/store"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-600 hover:underline"
          >
            <Store className="h-4 w-4" />
            <span>Visualizar Loja</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Configurações da Loja</CardTitle>
            <CardDescription>Configure as informações básicas da sua loja online</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="whatsapp">Número de WhatsApp da Loja*</Label>
                <Input
                  id="whatsapp"
                  value={companySettings.whatsapp}
                  onChange={(e) => setCompanySettings((prev) => ({ ...prev, whatsapp: e.target.value }))}
                  placeholder="5511999999999 (apenas números)"
                />
                <p className="text-xs text-muted-foreground">
                  Informe o número completo com código do país e DDD, sem espaços ou caracteres especiais. Ex:
                  5511999999999
                </p>
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <Button onClick={handleSaveSettings}>Salvar Configurações</Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="products">
          <TabsList>
            <TabsTrigger value="products">Produtos</TabsTrigger>
            <TabsTrigger value="categories">Categorias</TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle>{isEditing ? "Editar Produto" : "Adicionar Produto"}</CardTitle>
                <CardDescription>
                  {isEditing
                    ? "Atualize as informações do produto na loja online"
                    : "Adicione um novo produto à sua loja online"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome do Produto*</Label>
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
                    <Textarea
                      id="description"
                      name="description"
                      value={currentProduct.description}
                      onChange={handleInputChange}
                      placeholder="Descrição do produto"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Preço (R$)*</Label>
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
                    <Label htmlFor="stock">Estoque*</Label>
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
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="productImage">Imagem do Produto</Label>
                    <div className="flex items-center gap-4">
                      <div className="h-24 w-24 border rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                        {previewImage || currentProduct.imageUrl ? (
                          <img
                            src={previewImage || currentProduct.imageUrl}
                            alt="Preview"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Camera className="h-8 w-8 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <Button variant="outline" type="button" onClick={() => fileInputRef.current?.click()}>
                          Selecionar Imagem
                        </Button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Recomendado: imagem quadrada de pelo menos 500x500 pixels
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="onlineStore"
                        checked={currentProduct.onlineStore}
                        onCheckedChange={handleOnlineStoreChange}
                      />
                      <Label htmlFor="onlineStore">Disponível na Loja Online</Label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Desative esta opção para ocultar o produto na loja online
                    </p>
                  </div>
                </div>

                <div className="flex justify-end mt-4 space-x-2">
                  {isEditing && (
                    <Button variant="outline" onClick={resetForm}>
                      Cancelar
                    </Button>
                  )}
                  <Button onClick={handleSaveProduct}>{isEditing ? "Atualizar Produto" : "Adicionar Produto"}</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Produtos na Loja Online</CardTitle>
                <CardDescription>Gerencie os produtos disponíveis na sua loja online</CardDescription>
              </CardHeader>
              <CardContent>
                {products.length === 0 ? (
                  <div className="text-center py-12">
                    <Store className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium">Nenhum produto cadastrado</h3>
                    <p className="mt-1 text-gray-500">Adicione produtos para exibi-los na sua loja online.</p>
                    <Button
                      className="mt-4"
                      onClick={() => document.getElementById("add-product-section")?.scrollIntoView()}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Produto
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto w-full">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Imagem</TableHead>
                          <TableHead>Nome</TableHead>
                          <TableHead>Categoria</TableHead>
                          <TableHead>Preço</TableHead>
                          <TableHead>Estoque</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products.map((product) => (
                          <TableRow key={product.id}>
                            <TableCell>
                              <div className="h-10 w-10 rounded-md overflow-hidden bg-gray-100">
                                {product.imageUrl ? (
                                  <img
                                    src={product.imageUrl || "/placeholder.svg"}
                                    alt={product.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center">
                                    <Camera className="h-4 w-4 text-gray-400" />
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell>{categories.find((c) => c.id === product.category)?.name || "Outros"}</TableCell>
                            <TableCell>{formatCurrency(product.price)}</TableCell>
                            <TableCell>{product.stock}</TableCell>
                            <TableCell>
                              {product.onlineStore !== false ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Disponível
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  Oculto
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="outline" size="sm" onClick={() => handleEditProduct(product)}>
                                Editar
                              </Button>
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

          <TabsContent value="categories">
            <Card>
              <CardHeader>
                <CardTitle>{isEditingCategory ? "Editar Categoria" : "Adicionar Categoria"}</CardTitle>
                <CardDescription>
                  {isEditingCategory
                    ? "Atualize as informações da categoria"
                    : "Adicione uma nova categoria para organizar seus produtos"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="categoryName">Nome da Categoria*</Label>
                    <Input
                      id="categoryName"
                      name="name"
                      value={currentCategory.name}
                      onChange={handleCategoryInputChange}
                      placeholder="Ex: Smartphones"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Cor da Categoria</Label>
                    <div className="grid grid-cols-5 gap-2">
                      {[
                        "bg-blue-500",
                        "bg-green-500",
                        "bg-red-500",
                        "bg-yellow-500",
                        "bg-purple-500",
                        "bg-pink-500",
                        "bg-indigo-500",
                        "bg-gray-500",
                        "bg-orange-500",
                        "bg-teal-500",
                      ].map((color) => (
                        <div
                          key={color}
                          className={`h-8 w-8 rounded-full cursor-pointer ${color} ${currentCategory.color === color ? "ring-2 ring-offset-2 ring-black" : ""}`}
                          onClick={() => handleCategoryColorChange(color)}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end mt-4 space-x-2">
                  {isEditingCategory && (
                    <Button variant="outline" onClick={resetCategoryForm}>
                      Cancelar
                    </Button>
                  )}
                  <Button onClick={handleSaveCategory}>
                    {isEditingCategory ? "Atualizar Categoria" : "Adicionar Categoria"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Categorias</CardTitle>
                <CardDescription>Gerencie as categorias de produtos da sua loja</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cor</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>ID</TableHead>
                        <TableHead>Produtos</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories.map((category) => {
                        const productCount = products.filter((p) => p.category === category.id).length
                        return (
                          <TableRow key={category.id}>
                            <TableCell>
                              <div className={`h-6 w-6 rounded-full ${category.color}`}></div>
                            </TableCell>
                            <TableCell className="font-medium">{category.name}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{category.id}</TableCell>
                            <TableCell>{productCount}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" size="sm" onClick={() => handleEditCategory(category)}>
                                  <Edit className="h-4 w-4 mr-1" />
                                  Editar
                                </Button>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 border-red-200 hover:bg-red-50"
                                  onClick={() => handleDeleteCategory(category.id)}
                                  disabled={productCount > 0}
                                >
                                  <Trash className="h-4 w-4 mr-1" />
                                  Excluir
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}


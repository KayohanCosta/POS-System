"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { ShoppingCart, Plus, Minus, Search, X, ShoppingBag, Tag, ChevronDown, Settings, User } from "lucide-react"
import StoreInitializer from "@/components/store-initializer"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function StorePage() {
  const { toast } = useToast()
  const [products, setProducts] = useState<any[]>([])
  const [filteredProducts, setFilteredProducts] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [cart, setCart] = useState<any[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [companySettings, setCompanySettings] = useState({
    name: "Tecno Mania",
    logoUrl: "/images/logo.png",
    whatsapp: "5511999999999", // Default WhatsApp number
  })

  // Customer information for checkout
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    address: "",
    paymentMethod: "pix",
  })

  useEffect(() => {
    // Load products from localStorage
    const storedProducts = JSON.parse(localStorage.getItem("products") || "[]")

    // Filter only products that are enabled for online store
    const onlineProducts = storedProducts.filter((product: any) => product.onlineStore !== false && product.stock > 0)

    setProducts(onlineProducts)

    // Load categories
    const storedCategories = JSON.parse(localStorage.getItem("productCategories") || "[]")
    if (storedCategories.length > 0) {
      setCategories(storedCategories)
    } else {
      // Default categories if none exist
      const defaultCategories = [
        { id: "hardware", name: "Hardware", color: "bg-blue-500" },
        { id: "perifericos", name: "Periféricos", color: "bg-green-500" },
        { id: "acessorios", name: "Acessórios", color: "bg-yellow-500" },
        { id: "celulares", name: "Celulares", color: "bg-purple-500" },
        { id: "other", name: "Outros", color: "bg-gray-500" },
      ]
      setCategories(defaultCategories)
    }

    // Load company settings
    const storedSettings = JSON.parse(localStorage.getItem("companySettings") || "null")
    if (storedSettings) {
      setCompanySettings(storedSettings)
    }

    // Load cart from localStorage
    const storedCart = JSON.parse(localStorage.getItem("storeCart") || "[]")
    setCart(storedCart)
  }, [])

  // Filter products based on search term and selected category
  useEffect(() => {
    let filtered = [...products]

    // Apply category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter((product) => product.category === selectedCategory)
    }

    // Apply search filter
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(term) ||
          (product.description && product.description.toLowerCase().includes(term)),
      )
    }

    setFilteredProducts(filtered)
  }, [searchTerm, selectedCategory, products])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("storeCart", JSON.stringify(cart))
  }, [cart])

  const addToCart = (product: any) => {
    const existingItem = cart.find((item) => item.id === product.id)

    if (existingItem) {
      // Check if adding one more would exceed stock
      if (existingItem.quantity >= product.stock) {
        toast({
          title: "Estoque insuficiente",
          description: "Não há mais unidades disponíveis deste produto",
          variant: "destructive",
        })
        return
      }

      // Update quantity
      const updatedCart = cart.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item))
      setCart(updatedCart)
    } else {
      // Add new item
      setCart([...cart, { ...product, quantity: 1 }])
    }

    toast({
      title: "Produto adicionado",
      description: `${product.name} foi adicionado ao carrinho`,
    })
  }

  const removeFromCart = (productId: string) => {
    const updatedCart = cart.filter((item) => item.id !== productId)
    setCart(updatedCart)
  }

  const updateQuantity = (productId: string, delta: number) => {
    const updatedCart = cart.map((item) => {
      if (item.id === productId) {
        const newQuantity = item.quantity + delta

        // Find the product to check stock
        const product = products.find((p) => p.id === productId)

        // Ensure quantity is between 1 and available stock
        if (newQuantity < 1) return item
        if (product && newQuantity > product.stock) {
          toast({
            title: "Estoque insuficiente",
            description: "Não há mais unidades disponíveis deste produto",
            variant: "destructive",
          })
          return item
        }

        return { ...item, quantity: newQuantity }
      }
      return item
    })

    setCart(updatedCart)
  }

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setCustomerInfo((prev) => ({ ...prev, [name]: value }))
  }

  const handlePaymentMethodChange = (value: string) => {
    setCustomerInfo((prev) => ({ ...prev, paymentMethod: value }))
  }

  const sendToWhatsApp = () => {
    // Validate form
    if (!customerInfo.name || !customerInfo.phone || !customerInfo.address) {
      toast({
        title: "Informações incompletas",
        description: "Por favor, preencha todos os campos obrigatórios",
        variant: "destructive",
      })
      return
    }

    // Format the message
    let message = `*Novo Pedido - ${companySettings.name}*\n\n`
    message += `*Cliente:* ${customerInfo.name}\n`
    message += `*Telefone:* ${customerInfo.phone}\n`
    message += `*Endereço:* ${customerInfo.address}\n\n`

    message += `*Itens do Pedido:*\n`
    cart.forEach((item) => {
      message += `- ${item.quantity}x ${item.name} (${formatCurrency(item.price)} cada) = ${formatCurrency(item.price * item.quantity)}\n`
    })

    message += `\n*Total:* ${formatCurrency(calculateTotal())}\n`
    message += `*Forma de Pagamento:* ${formatPaymentMethod(customerInfo.paymentMethod)}\n\n`

    message += `Obrigado pela preferência!`

    // Encode the message for WhatsApp
    const encodedMessage = encodeURIComponent(message)

    // Create WhatsApp URL
    const whatsappUrl = `https://wa.me/${companySettings.whatsapp}?text=${encodedMessage}`

    // Open WhatsApp in a new tab
    window.open(whatsappUrl, "_blank")

    // Clear cart and reset checkout
    setCart([])
    setIsCheckoutOpen(false)
    setIsCartOpen(false)

    toast({
      title: "Pedido enviado!",
      description: "Seu pedido foi enviado para o WhatsApp da loja",
    })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const formatPaymentMethod = (method: string) => {
    switch (method) {
      case "cash":
        return "Dinheiro"
      case "credit":
        return "Cartão de Crédito"
      case "debit":
        return "Cartão de Débito"
      case "pix":
        return "PIX"
      default:
        return method
    }
  }

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((cat) => cat.id === categoryId)
    return category ? category.name : categoryId
  }

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find((cat) => cat.id === categoryId)
    return category ? category.color : "bg-gray-500"
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Initialize store with additional products */}
      <StoreInitializer />

      {/* Header */}
      <header className="bg-white shadow-sm py-4 px-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <img
              src={companySettings.logoUrl || "/placeholder.svg"}
              alt={companySettings.name}
              className="h-8 w-auto mr-2 rounded-lg shadow-sm"
              onError={(e) => {
                e.currentTarget.src =
                  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100%" height="100%" fill="%233b82f6"/><text x="50%" y="50%" fontFamily="Arial" fontSize="24" fill="white" textAnchor="middle" dominantBaseline="middle">TM</text></svg>'
              }}
            />
            <h1 className="text-lg font-bold truncate max-w-[150px] sm:max-w-none">{companySettings.name}</h1>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Button variant="outline" size="sm" className="relative" onClick={() => setIsCartOpen(true)}>
                <ShoppingCart className="h-5 w-5" />
                {cart.length > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0">
                    {cart.reduce((total, item) => total + item.quantity, 0)}
                  </Badge>
                )}
              </Button>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  <User className="h-4 w-4" />
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Menu</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <a href="/" className="flex items-center cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Área Administrativa</span>
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content with Vertical Scroll */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 flex flex-col">
        {/* Search Bar */}
        <div className="mb-4 relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setSearchTerm("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Categories - Styled Horizontal Scroll */}
        <div className="mb-6 relative">
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent pb-2 -mx-4 px-4">
            <div className="flex space-x-2 min-w-max">
              <Button
                variant={selectedCategory === "all" ? "default" : "outline"}
                size="sm"
                className="whitespace-nowrap"
                onClick={() => setSelectedCategory("all")}
              >
                <Tag className="h-4 w-4 mr-1" />
                Todas Categorias
              </Button>

              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  className="whitespace-nowrap"
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <div className={`w-2 h-2 rounded-full ${category.color} mr-1`}></div>
                  {category.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Fade effect for horizontal scroll */}
          <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-l from-gray-50 to-transparent pointer-events-none"></div>
          <div className="absolute top-0 left-0 bottom-0 w-8 bg-gradient-to-r from-gray-50 to-transparent pointer-events-none"></div>
        </div>

        {/* Products with Vertical Scroll */}
        <div className="flex-1">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium">Nenhum produto encontrado</h3>
              <p className="mt-1 text-gray-500">Tente buscar por outro termo ou verifique mais tarde.</p>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-medium mb-3">
                {selectedCategory === "all" ? "Todos os Produtos" : getCategoryName(selectedCategory)}
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({filteredProducts.length} {filteredProducts.length === 1 ? "produto" : "produtos"})
                </span>
              </h2>

              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {filteredProducts.map((product) => (
                  <Card key={product.id} className="overflow-hidden flex flex-col">
                    <div className="aspect-square h-28 xs:h-32 sm:h-36 bg-gray-100 relative overflow-hidden">
                      <img
                        src={product.imageUrl || "/placeholder.svg?height=200&width=200"}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg?height=200&width=200"
                        }}
                      />
                      {product.category && (
                        <div className="absolute top-1 left-1">
                          <Badge variant="secondary" className="text-xs bg-white/80 backdrop-blur-sm">
                            {getCategoryName(product.category)}
                          </Badge>
                        </div>
                      )}
                    </div>
                    <CardHeader className="p-2 pb-0">
                      <CardTitle className="text-sm truncate">{product.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-2 pt-1 flex-1">
                      <p className="text-xs text-gray-500 line-clamp-2 h-8">
                        {product.description || "Sem descrição disponível"}
                      </p>
                      <p className="mt-1 text-sm font-bold">{formatCurrency(product.price)}</p>
                      <p className="text-xs text-gray-500">
                        {product.stock > 10
                          ? "Disponível"
                          : product.stock > 0
                            ? `Apenas ${product.stock} unidades`
                            : "Indisponível"}
                      </p>
                    </CardContent>
                    <CardFooter className="p-2 pt-0">
                      <Button
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => addToCart(product)}
                        disabled={product.stock <= 0}
                      >
                        Adicionar
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Shopping Cart Sidebar */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setIsCartOpen(false)}></div>
          <div className="absolute inset-y-0 right-0 max-w-full flex">
            <div className="relative w-screen max-w-md">
              <div className="h-full flex flex-col bg-white shadow-xl">
                <div className="flex-1 overflow-y-auto py-6 px-4 sm:px-6">
                  <div className="flex items-start justify-between">
                    <h2 className="text-lg font-medium text-gray-900">Carrinho de Compras</h2>
                    <button
                      type="button"
                      className="ml-3 h-7 flex items-center justify-center"
                      onClick={() => setIsCartOpen(false)}
                    >
                      <X className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>

                  <div className="mt-8">
                    {cart.length === 0 ? (
                      <div className="text-center py-12">
                        <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Seu carrinho está vazio</h3>
                        <p className="mt-1 text-sm text-gray-500">Adicione produtos para continuar suas compras</p>
                      </div>
                    ) : (
                      <div className="flow-root">
                        <ul className="-my-6 divide-y divide-gray-200">
                          {cart.map((item) => (
                            <li key={item.id} className="py-6 flex">
                              <div className="flex-shrink-0 w-24 h-24 border border-gray-200 rounded-md overflow-hidden">
                                <img
                                  src={item.imageUrl || "/placeholder.svg?height=100&width=100"}
                                  alt={item.name}
                                  className="w-full h-full object-center object-cover"
                                  onError={(e) => {
                                    e.currentTarget.src = "/placeholder.svg?height=100&width=100"
                                  }}
                                />
                              </div>

                              <div className="ml-4 flex-1 flex flex-col">
                                <div>
                                  <div className="flex justify-between text-base font-medium text-gray-900">
                                    <h3 className="line-clamp-1">{item.name}</h3>
                                    <p className="ml-4">{formatCurrency(item.price * item.quantity)}</p>
                                  </div>
                                  <p className="mt-1 text-sm text-gray-500 line-clamp-1">
                                    {formatCurrency(item.price)} cada
                                  </p>
                                </div>
                                <div className="flex-1 flex items-end justify-between text-sm">
                                  <div className="flex items-center border rounded-md">
                                    <button type="button" className="p-1" onClick={() => updateQuantity(item.id, -1)}>
                                      <Minus className="h-4 w-4" />
                                    </button>
                                    <span className="px-2">{item.quantity}</span>
                                    <button type="button" className="p-1" onClick={() => updateQuantity(item.id, 1)}>
                                      <Plus className="h-4 w-4" />
                                    </button>
                                  </div>

                                  <button
                                    type="button"
                                    className="font-medium text-red-600 hover:text-red-500"
                                    onClick={() => removeFromCart(item.id)}
                                  >
                                    Remover
                                  </button>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {cart.length > 0 && (
                  <div className="border-t border-gray-200 py-6 px-4 sm:px-6">
                    <div className="flex justify-between text-base font-medium text-gray-900">
                      <p>Subtotal</p>
                      <p>{formatCurrency(calculateTotal())}</p>
                    </div>
                    <p className="mt-0.5 text-sm text-gray-500">Frete e taxas calculados na finalização.</p>
                    <div className="mt-6">
                      <Button
                        className="w-full"
                        onClick={() => {
                          setIsCartOpen(false)
                          setIsCheckoutOpen(true)
                        }}
                      >
                        Finalizar Compra
                      </Button>
                    </div>
                    <div className="mt-6 flex justify-center text-sm text-center text-gray-500">
                      <p>
                        ou{" "}
                        <button
                          type="button"
                          className="text-blue-600 font-medium hover:text-blue-500"
                          onClick={() => setIsCartOpen(false)}
                        >
                          Continuar Comprando<span aria-hidden="true"> &rarr;</span>
                        </button>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setIsCheckoutOpen(false)}></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full w-full max-w-[95vw] mx-auto">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Finalizar Pedido</h3>
                    <div className="mt-4 space-y-4">
                      <div>
                        <Label htmlFor="name">Nome Completo*</Label>
                        <Input
                          id="name"
                          name="name"
                          value={customerInfo.name}
                          onChange={handleInputChange}
                          placeholder="Seu nome completo"
                          className="mt-1"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="phone">Telefone de Contato*</Label>
                        <Input
                          id="phone"
                          name="phone"
                          value={customerInfo.phone}
                          onChange={handleInputChange}
                          placeholder="(00) 00000-0000"
                          className="mt-1"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="address">Endereço de Entrega*</Label>
                        <Textarea
                          id="address"
                          name="address"
                          value={customerInfo.address}
                          onChange={handleInputChange}
                          placeholder="Rua, número, bairro, cidade, CEP"
                          className="mt-1"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="paymentMethod">Forma de Pagamento*</Label>
                        <Select value={customerInfo.paymentMethod} onValueChange={handlePaymentMethodChange}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Selecione a forma de pagamento" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pix">PIX</SelectItem>
                            <SelectItem value="credit">Cartão de Crédito</SelectItem>
                            <SelectItem value="debit">Cartão de Débito</SelectItem>
                            <SelectItem value="cash">Dinheiro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="border-t pt-4">
                        <h4 className="font-medium">Resumo do Pedido</h4>
                        <div className="mt-2 space-y-1 max-h-[30vh] overflow-y-auto pr-1">
                          {cart.map((item) => (
                            <div key={item.id} className="flex justify-between text-sm">
                              <span className="truncate max-w-[70%]">
                                {item.quantity}x {item.name}
                              </span>
                              <span>{formatCurrency(item.price * item.quantity)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 pt-2 border-t flex justify-between font-medium">
                          <span>Total</span>
                          <span>{formatCurrency(calculateTotal())}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <Button onClick={sendToWhatsApp} className="w-full sm:w-auto">
                  Enviar Pedido via WhatsApp
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsCheckoutOpen(false)}
                  className="mt-3 w-full sm:mt-0 sm:ml-3 sm:w-auto"
                >
                  Voltar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t py-6 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} {companySettings.name} - Todos os direitos reservados
          </p>
        </div>
      </footer>
    </div>
  )
}


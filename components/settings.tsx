"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
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
import { Camera, ShoppingBag, Utensils, Beer, Receipt } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"

// Adicionar as novas importações no topo do arquivo:
import CloudSyncComponent from "@/components/cloud-sync"
import PaymentSettings from "@/components/payment-settings"
import LoyaltyProgramComponent from "@/components/loyalty-program"
import CustomerManagement from "@/components/customer-management"

// Definição dos tipos
type Permission = {
  id: string
  name: string
  description: string
}

type Role = {
  id: string
  name: string
  description: string
  permissions: string[]
}

type User = {
  id: string
  username: string
  password: string
  name: string
  email: string
  role: string
  active: boolean
  lastLogin?: string
}

type CompanySettings = {
  name: string
  logoUrl: string
  whatsapp?: string
  businessType?: "retail" | "restaurant" | "bar"
  features?: {
    inventory?: boolean
    kitchen?: boolean
    tables?: boolean
    delivery?: boolean
    serviceOrders?: boolean
  }
  receipt?: {
    header?: string
    footer?: string
    showLogo?: boolean
    showAddress?: boolean
    showPhone?: boolean
    fontSize?: "small" | "medium" | "large"
  }
  address?: string
  phone?: string
}

type Category = {
  id: string
  name: string
  color: string
}

export default function Settings() {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Estados para usuários
  const [users, setUsers] = useState<User[]>([])
  const [currentUser, setCurrentUser] = useState<User>({
    id: "",
    username: "",
    password: "",
    name: "",
    email: "",
    role: "",
    active: true,
  })
  const [isEditingUser, setIsEditingUser] = useState(false)

  // Estados para perfis
  const [roles, setRoles] = useState<Role[]>([])
  const [currentRole, setCurrentRole] = useState<Role>({
    id: "",
    name: "",
    description: "",
    permissions: [],
  })
  const [isEditingRole, setIsEditingRole] = useState(false)

  // Estado para configurações da empresa
  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    name: "Tecno Mania",
    logoUrl: "/images/logo.png",
    whatsapp: "",
    businessType: "retail",
    features: {
      inventory: true,
      kitchen: false,
      tables: false,
      delivery: false,
      serviceOrders: true,
    },
    receipt: {
      header: "Obrigado pela preferência!",
      footer: "Volte sempre!",
      showLogo: true,
      showAddress: true,
      showPhone: true,
      fontSize: "medium",
    },
    address: "Rua Exemplo, 123 - Centro",
    phone: "(11) 99999-9999",
  })
  const [previewLogo, setPreviewLogo] = useState<string | null>(null)

  // Estado para categorias
  const [categories, setCategories] = useState<Category[]>([])
  const [currentCategory, setCurrentCategory] = useState<Category>({
    id: "",
    name: "",
    color: "bg-blue-500",
  })
  const [isEditingCategory, setIsEditingCategory] = useState(false)

  // Lista de permissões disponíveis no sistema
  const [permissions, setPermissions] = useState<Permission[]>([
    { id: "dashboard_view", name: "Visualizar Dashboard", description: "Permite visualizar o dashboard" },
    { id: "cash_register_view", name: "Visualizar Caixa", description: "Permite visualizar o módulo de caixa" },
    { id: "cash_register_open", name: "Abrir/Fechar Caixa", description: "Permite abrir e fechar o caixa" },
    { id: "cash_register_sell", name: "Realizar Vendas", description: "Permite realizar vendas no caixa" },
    { id: "products_view", name: "Visualizar Produtos", description: "Permite visualizar produtos" },
    { id: "products_manage", name: "Gerenciar Produtos", description: "Permite adicionar, editar e excluir produtos" },
    { id: "service_orders_view", name: "Visualizar Ordens", description: "Permite visualizar ordens de serviço" },
    {
      id: "service_orders_manage",
      name: "Gerenciar Ordens",
      description: "Permite adicionar, editar e excluir ordens de serviço",
    },
    { id: "reports_view", name: "Visualizar Relatórios", description: "Permite visualizar relatórios" },
    { id: "settings_view", name: "Visualizar Configurações", description: "Permite visualizar configurações" },
    { id: "users_manage", name: "Gerenciar Usuários", description: "Permite gerenciar usuários" },
    { id: "roles_manage", name: "Gerenciar Perfis", description: "Permite gerenciar perfis de acesso" },
  ])

  // Carregar dados do localStorage
  useEffect(() => {
    const storedUsers = JSON.parse(localStorage.getItem("users") || "[]")
    const storedRoles = JSON.parse(localStorage.getItem("roles") || "[]")
    const storedCompanySettings = JSON.parse(localStorage.getItem("companySettings") || "null")
    const storedCategories = JSON.parse(localStorage.getItem("productCategories") || "[]")

    // Se não existirem usuários, criar um admin padrão
    if (storedUsers.length === 0) {
      const defaultAdmin = {
        id: "1",
        username: "admin",
        password: "admin", // Em produção, usar hash
        name: "Administrador",
        email: "admin@example.com",
        role: "admin",
        active: true,
        lastLogin: new Date().toISOString(),
      }
      localStorage.setItem("users", JSON.stringify([defaultAdmin]))
      setUsers([defaultAdmin])
    } else {
      setUsers(storedUsers)
    }

    // Se não existirem perfis, criar perfis padrão
    if (storedRoles.length === 0) {
      const defaultRoles = [
        {
          id: "admin",
          name: "Administrador",
          description: "Acesso completo ao sistema",
          permissions: permissions.map((p) => p.id),
        },
        {
          id: "manager",
          name: "Gerente",
          description: "Gerencia operações, sem acesso a configurações",
          permissions: [
            "dashboard_view",
            "cash_register_view",
            "cash_register_open",
            "cash_register_sell",
            "products_view",
            "products_manage",
            "service_orders_view",
            "service_orders_manage",
            "reports_view",
          ],
        },
        {
          id: "cashier",
          name: "Caixa",
          description: "Operador de caixa",
          permissions: ["dashboard_view", "cash_register_view", "cash_register_sell"],
        },
      ]
      localStorage.setItem("roles", JSON.stringify(defaultRoles))
      setRoles(defaultRoles)
    } else {
      setRoles(storedRoles)
    }

    // Carregar configurações da empresa
    if (storedCompanySettings) {
      // Garantir que as configurações de comanda existam
      if (!storedCompanySettings.receipt) {
        storedCompanySettings.receipt = {
          header: "Obrigado pela preferência!",
          footer: "Volte sempre!",
          showLogo: true,
          showAddress: true,
          showPhone: true,
          fontSize: "medium",
        }
      }
      setCompanySettings(storedCompanySettings)
    }

    // Carregar categorias
    if (storedCategories.length > 0) {
      setCategories(storedCategories)
    } else {
      // Categorias padrão
      const defaultCategories = [
        { id: "hardware", name: "Hardware", color: "bg-blue-500" },
        { id: "perifericos", name: "Periféricos", color: "bg-green-500" },
        { id: "acessorios", name: "Acessórios", color: "bg-yellow-500" },
        { id: "celulares", name: "Celulares", color: "bg-purple-500" },
        { id: "other", name: "Outros", color: "bg-gray-500" },
      ]
      setCategories(defaultCategories)
      localStorage.setItem("productCategories", JSON.stringify(defaultCategories))
    }
  }, [])

  // Funções para gerenciar usuários
  const handleUserInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setCurrentUser((prev) => ({ ...prev, [name]: value }))
  }

  const handleUserRoleChange = (value: string) => {
    setCurrentUser((prev) => ({ ...prev, role: value }))
  }

  const handleUserActiveChange = (checked: boolean) => {
    setCurrentUser((prev) => ({ ...prev, active: checked }))
  }

  const handleAddUser = () => {
    // Validar campos obrigatórios
    if (!currentUser.username || !currentUser.password || !currentUser.name || !currentUser.role) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      })
      return
    }

    // Verificar se username já existe
    if (!isEditingUser && users.some((user) => user.username === currentUser.username)) {
      toast({
        title: "Erro",
        description: "Nome de usuário já existe",
        variant: "destructive",
      })
      return
    }

    let updatedUsers
    if (isEditingUser) {
      // Atualizar usuário existente
      updatedUsers = users.map((user) => (user.id === currentUser.id ? currentUser : user))
      toast({
        title: "Usuário atualizado",
        description: `${currentUser.name} foi atualizado com sucesso`,
      })
    } else {
      // Adicionar novo usuário
      const newUser = {
        ...currentUser,
        id: Date.now().toString(),
      }
      updatedUsers = [...users, newUser]
      toast({
        title: "Usuário adicionado",
        description: `${newUser.name} foi adicionado com sucesso`,
      })
    }

    // Salvar no localStorage e atualizar estado
    localStorage.setItem("users", JSON.stringify(updatedUsers))
    setUsers(updatedUsers)
    resetUserForm()
  }

  const handleEditUser = (user: User) => {
    setCurrentUser(user)
    setIsEditingUser(true)
  }

  const handleDeleteUser = (id: string) => {
    // Não permitir excluir o último administrador
    const adminUsers = users.filter((user) => user.role === "admin")
    const userToDelete = users.find((user) => user.id === id)

    if (adminUsers.length === 1 && userToDelete?.role === "admin") {
      toast({
        title: "Operação não permitida",
        description: "Não é possível excluir o último administrador do sistema",
        variant: "destructive",
      })
      return
    }

    const updatedUsers = users.filter((user) => user.id !== id)
    localStorage.setItem("users", JSON.stringify(updatedUsers))
    setUsers(updatedUsers)

    toast({
      title: "Usuário removido",
      description: "O usuário foi removido com sucesso",
    })
  }

  const resetUserForm = () => {
    setCurrentUser({
      id: "",
      username: "",
      password: "",
      name: "",
      email: "",
      role: "",
      active: true,
    })
    setIsEditingUser(false)
  }

  // Funções para gerenciar perfis
  const handleRoleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setCurrentRole((prev) => ({ ...prev, [name]: value }))
  }

  const handlePermissionToggle = (permissionId: string) => {
    setCurrentRole((prev) => {
      const permissions = [...prev.permissions]

      if (permissions.includes(permissionId)) {
        return { ...prev, permissions: permissions.filter((id) => id !== permissionId) }
      } else {
        return { ...prev, permissions: [...permissions, permissionId] }
      }
    })
  }

  const handleAddRole = () => {
    // Validar campos obrigatórios
    if (!currentRole.name || !currentRole.id) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      })
      return
    }

    // Verificar se ID já existe
    if (!isEditingRole && roles.some((role) => role.id === currentRole.id)) {
      toast({
        title: "Erro",
        description: "ID do perfil já existe",
        variant: "destructive",
      })
      return
    }

    let updatedRoles
    if (isEditingRole) {
      // Atualizar perfil existente
      updatedRoles = roles.map((role) => (role.id === currentRole.id ? currentRole : role))
      toast({
        title: "Perfil atualizado",
        description: `${currentRole.name} foi atualizado com sucesso`,
      })
    } else {
      // Adicionar novo perfil
      updatedRoles = [...roles, currentRole]
      toast({
        title: "Perfil adicionado",
        description: `${currentRole.name} foi adicionado com sucesso`,
      })
    }

    // Salvar no localStorage e atualizar estado
    localStorage.setItem("roles", JSON.stringify(updatedRoles))
    setRoles(updatedRoles)
    resetRoleForm()
  }

  const handleEditRole = (role: Role) => {
    setCurrentRole(role)
    setIsEditingRole(true)
  }

  const handleDeleteRole = (id: string) => {
    // Verificar se existem usuários com este perfil
    if (users.some((user) => user.role === id)) {
      toast({
        title: "Operação não permitida",
        description: "Existem usuários com este perfil. Altere o perfil dos usuários antes de excluir.",
        variant: "destructive",
      })
      return
    }

    // Não permitir excluir o perfil de administrador
    if (id === "admin") {
      toast({
        title: "Operação não permitida",
        description: "Não é possível excluir o perfil de administrador",
        variant: "destructive",
      })
      return
    }

    const updatedRoles = roles.filter((role) => role.id !== id)
    localStorage.setItem("roles", JSON.stringify(updatedRoles))
    setRoles(updatedRoles)

    toast({
      title: "Perfil removido",
      description: "O perfil foi removido com sucesso",
    })
  }

  const resetRoleForm = () => {
    setCurrentRole({
      id: "",
      name: "",
      description: "",
      permissions: [],
    })
    setIsEditingRole(false)
  }

  // Funções para gerenciar categorias
  const handleCategoryInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setCurrentCategory((prev) => ({ ...prev, [name]: value }))
  }

  const handleCategoryColorChange = (color: string) => {
    setCurrentCategory((prev) => ({ ...prev, color }))
  }

  const handleAddCategory = () => {
    // Validar campos obrigatórios
    if (!currentCategory.name) {
      toast({
        title: "Erro",
        description: "Informe um nome para a categoria",
        variant: "destructive",
      })
      return
    }

    // Gerar ID a partir do nome se não estiver editando
    let categoryId = currentCategory.id
    if (!isEditingCategory) {
      categoryId = currentCategory.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\s]/g, "")
        .replace(/\s+/g, "_")
    }

    // Verificar se já existe categoria com este ID
    if (!isEditingCategory && categories.some((cat) => cat.id === categoryId)) {
      toast({
        title: "Erro",
        description: "Já existe uma categoria com este nome",
        variant: "destructive",
      })
      return
    }

    // Criar objeto da categoria atualizada
    const updatedCategory = {
      ...currentCategory,
      id: categoryId,
    }

    let updatedCategories
    if (isEditingCategory) {
      // Atualizar categoria existente
      updatedCategories = categories.map((cat) => (cat.id === currentCategory.id ? updatedCategory : cat))
      toast({
        title: "Categoria atualizada",
        description: `${updatedCategory.name} foi atualizada com sucesso`,
      })
    } else {
      // Adicionar nova categoria
      updatedCategories = [...categories, updatedCategory]
      toast({
        title: "Categoria adicionada",
        description: `${updatedCategory.name} foi adicionada com sucesso`,
      })
    }

    // Salvar no localStorage e atualizar estado
    localStorage.setItem("productCategories", JSON.stringify(updatedCategories))
    setCategories(updatedCategories)
    resetCategoryForm()
  }

  const handleEditCategory = (category: Category) => {
    setCurrentCategory(category)
    setIsEditingCategory(true)
  }

  const handleDeleteCategory = (id: string) => {
    // Verificar se a categoria está sendo usada por produtos
    const products = JSON.parse(localStorage.getItem("products") || "[]")
    const isInUse = products.some((product: any) => product.category === id)

    if (isInUse) {
      toast({
        title: "Operação não permitida",
        description: "Esta categoria está sendo usada por produtos. Altere a categoria dos produtos antes de excluir.",
        variant: "destructive",
      })
      return
    }

    const updatedCategories = categories.filter((cat) => cat.id !== id)
    localStorage.setItem("productCategories", JSON.stringify(updatedCategories))
    setCategories(updatedCategories)

    toast({
      title: "Categoria removida",
      description: "A categoria foi removida com sucesso",
    })
  }

  const resetCategoryForm = () => {
    setCurrentCategory({
      id: "",
      name: "",
      color: "bg-blue-500",
    })
    setIsEditingCategory(false)
  }

  // Função para obter o nome do perfil pelo ID
  const getRoleName = (roleId: string) => {
    const role = roles.find((r) => r.id === roleId)
    return role ? role.name : roleId
  }

  // Funções para gerenciar configurações da empresa
  const handleCompanyNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCompanySettings((prev) => ({
      ...prev,
      name: e.target.value,
    }))
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Criar URL para preview
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setPreviewLogo(result)
      }
      reader.readAsDataURL(file)
    }
  }

  // Modificar a função handleBusinessTypeChange para garantir que as funcionalidades sejam atualizadas corretamente
  const handleBusinessTypeChange = (value: string) => {
    // Atualizar tipo de negócio e configurar recursos padrão com base no tipo
    let defaultFeatures = {}

    if (value === "retail") {
      defaultFeatures = {
        inventory: true,
        kitchen: false,
        tables: false,
        delivery: true,
        serviceOrders: true,
      }
    } else if (value === "restaurant") {
      defaultFeatures = {
        inventory: true,
        kitchen: true,
        tables: true,
        delivery: true,
        serviceOrders: false,
      }
    } else if (value === "bar") {
      defaultFeatures = {
        inventory: true,
        kitchen: true,
        tables: true,
        delivery: false,
        serviceOrders: false,
      }
    }

    // Atualizar o estado e salvar no localStorage imediatamente
    const updatedSettings = {
      ...companySettings,
      businessType: value as "retail" | "restaurant" | "bar",
      features: defaultFeatures,
    }

    setCompanySettings(updatedSettings)
    localStorage.setItem("companySettings", JSON.stringify(updatedSettings))

    // Mostrar notificação de sucesso
    toast({
      title: "Tipo de estabelecimento atualizado",
      description: "As funcionalidades foram ajustadas de acordo com o tipo selecionado",
    })
  }

  // Modificar a função handleFeatureToggle para salvar imediatamente no localStorage
  const handleFeatureToggle = (feature: string, checked: boolean) => {
    const updatedSettings = {
      ...companySettings,
      features: {
        ...companySettings.features,
        [feature]: checked,
      },
    }

    setCompanySettings(updatedSettings)
    localStorage.setItem("companySettings", JSON.stringify(updatedSettings))

    // Mostrar notificação de sucesso
    toast({
      title: "Funcionalidade atualizada",
      description: `A funcionalidade ${feature} foi ${checked ? "ativada" : "desativada"} com sucesso`,
    })
  }

  // Função para atualizar configurações da comanda
  const handleReceiptChange = (field: string, value: any) => {
    const updatedSettings = {
      ...companySettings,
      receipt: {
        ...companySettings.receipt,
        [field]: value,
      },
    }

    setCompanySettings(updatedSettings)
  }

  const handleSaveCompanySettings = () => {
    // Atualizar as configurações com o novo logo se houver
    const updatedSettings = {
      ...companySettings,
      logoUrl: previewLogo || companySettings.logoUrl,
    }

    // Salvar no localStorage
    localStorage.setItem("companySettings", JSON.stringify(updatedSettings))
    setCompanySettings(updatedSettings)
    setPreviewLogo(null)

    toast({
      title: "Configurações salvas",
      description: "As configurações da empresa foram atualizadas com sucesso",
    })
  }

  return (
    <div className="space-y-4 max-w-full overflow-x-hidden">
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="w-full grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-1 h-auto py-2 mb-3 bg-muted/20 rounded-lg p-1">
          <TabsTrigger value="profile" className="text-xs sm:text-sm py-1.5 px-2 h-9 text-center rounded-md">
            Perfil
          </TabsTrigger>
          <TabsTrigger value="users" className="text-xs sm:text-sm py-1.5 px-2 h-9 text-center rounded-md">
            Usuários
          </TabsTrigger>
          <TabsTrigger value="roles" className="text-xs sm:text-sm py-1.5 px-2 h-9 text-center rounded-md">
            Perfis de Acesso
          </TabsTrigger>
          <TabsTrigger value="receipt" className="text-xs sm:text-sm py-1.5 px-2 h-9 text-center rounded-md">
            Comanda
          </TabsTrigger>
          <TabsTrigger value="store" className="text-xs sm:text-sm py-1.5 px-2 h-9 text-center rounded-md">
            Loja Online
          </TabsTrigger>
          <TabsTrigger value="sync" className="text-xs sm:text-sm py-1.5 px-2 h-9 text-center rounded-md">
            Sincronização
          </TabsTrigger>
          <TabsTrigger value="payment" className="text-xs sm:text-sm py-1.5 px-2 h-9 text-center rounded-md">
            Pagamentos
          </TabsTrigger>
          <TabsTrigger value="loyalty" className="text-xs sm:text-sm py-1.5 px-2 h-9 text-center rounded-md">
            Fidelidade
          </TabsTrigger>
        </TabsList>

        {/* Aba de Perfil */}
        <TabsContent value="profile" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Configurações da Empresa</CardTitle>
              <CardDescription>Personalize as informações da sua empresa</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Nome da Empresa</Label>
                  <Input
                    id="companyName"
                    value={companySettings.name}
                    onChange={handleCompanyNameChange}
                    placeholder="Nome da sua empresa"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyAddress">Endereço</Label>
                    <Input
                      id="companyAddress"
                      value={companySettings.address || ""}
                      onChange={(e) => setCompanySettings((prev) => ({ ...prev, address: e.target.value }))}
                      placeholder="Endereço completo"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyPhone">Telefone</Label>
                    <Input
                      id="companyPhone"
                      value={companySettings.phone || ""}
                      onChange={(e) => setCompanySettings((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Logo da Empresa</Label>
                  <div className="flex flex-col items-center gap-4 sm:flex-row">
                    <div className="relative h-24 w-24 overflow-hidden rounded-full border border-border">
                      <img
                        src={previewLogo || companySettings.logoUrl}
                        alt="Logo da empresa"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src =
                            'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100%" height="100%" fill="%233b82f6"/><text x="50%" y="50%" fontFamily="Arial" fontSize="24" fill="white" textAnchor="middle" dominantBaseline="middle">TM</text></svg>'
                        }}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        className="flex items-center gap-2"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Camera className="h-4 w-4" />
                        <span>Alterar Logo</span>
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="hidden"
                      />
                      <p className="text-xs text-muted-foreground">
                        Recomendado: imagem quadrada de pelo menos 200x200 pixels
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tipo de Estabelecimento */}
                <div className="space-y-4">
                  <Label>Tipo de Estabelecimento</Label>
                  <RadioGroup
                    value={companySettings.businessType || "retail"}
                    onValueChange={handleBusinessTypeChange}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                  >
                    <div className="flex items-center space-x-2 border rounded-md p-4 hover:bg-muted/50 cursor-pointer">
                      <RadioGroupItem value="retail" id="retail" />
                      <Label htmlFor="retail" className="flex items-center cursor-pointer">
                        <ShoppingBag className="h-5 w-5 mr-2 text-blue-500" />
                        <div>
                          <span className="font-medium">Varejo</span>
                          <p className="text-xs text-muted-foreground">Lojas, mercados e comércio em geral</p>
                        </div>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2 border rounded-md p-4 hover:bg-muted/50 cursor-pointer">
                      <RadioGroupItem value="restaurant" id="restaurant" />
                      <Label htmlFor="restaurant" className="flex items-center cursor-pointer">
                        <Utensils className="h-5 w-5 mr-2 text-green-500" />
                        <div>
                          <span className="font-medium">Restaurante</span>
                          <p className="text-xs text-muted-foreground">Restaurantes, lanchonetes e similares</p>
                        </div>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2 border rounded-md p-4 hover:bg-muted/50 cursor-pointer">
                      <RadioGroupItem value="bar" id="bar" />
                      <Label htmlFor="bar" className="flex items-center cursor-pointer">
                        <Beer className="h-5 w-5 mr-2 text-amber-500" />
                        <div>
                          <span className="font-medium">Bar</span>
                          <p className="text-xs text-muted-foreground">Bares, pubs e casas noturnas</p>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Funcionalidades */}
                <div className="space-y-4">
                  <Label>Funcionalidades Ativas</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2 border rounded-md p-4">
                      <Switch
                        id="inventory"
                        checked={companySettings.features?.inventory || false}
                        onCheckedChange={(checked) => handleFeatureToggle("inventory", checked)}
                      />
                      <Label htmlFor="inventory" className="flex flex-col cursor-pointer">
                        <span className="font-medium">Controle de Estoque</span>
                        <span className="text-xs text-muted-foreground">Gerenciamento de produtos e estoque</span>
                      </Label>
                    </div>

                    {(companySettings.businessType === "restaurant" || companySettings.businessType === "bar") && (
                      <div className="flex items-center space-x-2 border rounded-md p-4">
                        <Switch
                          id="kitchen"
                          checked={companySettings.features?.kitchen || false}
                          onCheckedChange={(checked) => handleFeatureToggle("kitchen", checked)}
                        />
                        <Label htmlFor="kitchen" className="flex flex-col cursor-pointer">
                          <span className="font-medium">Controle de Cozinha</span>
                          <span className="text-xs text-muted-foreground">Gerenciamento de pedidos na cozinha</span>
                        </Label>
                      </div>
                    )}

                    {(companySettings.businessType === "restaurant" || companySettings.businessType === "bar") && (
                      <div className="flex items-center space-x-2 border rounded-md p-4">
                        <Switch
                          id="tables"
                          checked={companySettings.features?.tables || false}
                          onCheckedChange={(checked) => handleFeatureToggle("tables", checked)}
                        />
                        <Label htmlFor="tables" className="flex flex-col cursor-pointer">
                          <span className="font-medium">Controle de Mesas</span>
                          <span className="text-xs text-muted-foreground">Gerenciamento de mesas e comandas</span>
                        </Label>
                      </div>
                    )}

                    {(companySettings.businessType === "retail" || companySettings.businessType === "restaurant") && (
                      <div className="flex items-center space-x-2 border rounded-md p-4">
                        <Switch
                          id="delivery"
                          checked={companySettings.features?.delivery || false}
                          onCheckedChange={(checked) => handleFeatureToggle("delivery", checked)}
                        />
                        <Label htmlFor="delivery" className="flex flex-col cursor-pointer">
                          <span className="font-medium">Delivery</span>
                          <span className="text-xs text-muted-foreground">Gerenciamento de entregas</span>
                        </Label>
                      </div>
                    )}

                    {companySettings.businessType === "retail" && (
                      <div className="flex items-center space-x-2 border rounded-md p-4">
                        <Switch
                          id="serviceOrders"
                          checked={companySettings.features?.serviceOrders || false}
                          onCheckedChange={(checked) => handleFeatureToggle("serviceOrders", checked)}
                        />
                        <Label htmlFor="serviceOrders" className="flex flex-col cursor-pointer">
                          <span className="font-medium">Ordens de Serviço</span>
                          <span className="text-xs text-muted-foreground">Gerenciamento de ordens de serviço</span>
                        </Label>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveCompanySettings}>Salvar Configurações</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de Usuários */}
        <TabsContent value="users" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>{isEditingUser ? "Editar Usuário" : "Adicionar Usuário"}</CardTitle>
              <CardDescription>
                {isEditingUser
                  ? "Atualize as informações do usuário"
                  : "Preencha os dados para adicionar um novo usuário"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-xs sm:text-sm">
                    Nome de Usuário *
                  </Label>
                  <Input
                    id="username"
                    name="username"
                    value={currentUser.username}
                    onChange={handleUserInputChange}
                    placeholder="Nome de usuário"
                    disabled={isEditingUser}
                    className="h-8 sm:h-9 text-xs sm:text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs sm:text-sm">
                    Senha *
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={currentUser.password}
                    onChange={handleUserInputChange}
                    placeholder={isEditingUser ? "••••••••" : "Senha"}
                    className="h-8 sm:h-9 text-xs sm:text-sm"
                  />
                  {isEditingUser && (
                    <p className="text-xs text-muted-foreground">Deixe em branco para manter a senha atual</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs sm:text-sm">
                    Nome Completo *
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={currentUser.name}
                    onChange={handleUserInputChange}
                    placeholder="Nome completo"
                    className="h-8 sm:h-9 text-xs sm:text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs sm:text-sm">
                    E-mail
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={currentUser.email}
                    onChange={handleUserInputChange}
                    placeholder="email@exemplo.com"
                    className="h-8 sm:h-9 text-xs sm:text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role" className="text-xs sm:text-sm">
                    Perfil de Acesso *
                  </Label>
                  <Select value={currentUser.role} onValueChange={handleUserRoleChange}>
                    <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
                      <SelectValue placeholder="Selecione um perfil" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center pt-4">
                  <div className="flex items-center space-x-2">
                    <Switch id="active" checked={currentUser.active} onCheckedChange={handleUserActiveChange} />
                    <Label htmlFor="active" className="text-sm">
                      Usuário Ativo
                    </Label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-4 space-x-2">
                {isEditingUser && (
                  <Button variant="outline" onClick={resetUserForm}>
                    Cancelar
                  </Button>
                )}
                <Button onClick={handleAddUser}>{isEditingUser ? "Atualizar Usuário" : "Adicionar Usuário"}</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Usuários Cadastrados</CardTitle>
              <CardDescription>Total de usuários: {users.length}</CardDescription>
            </CardHeader>
            <CardContent className="no-scroll-table bottom-spacing">
              {users.length === 0 ? (
                <p className="text-center text-muted-foreground">Nenhum usuário cadastrado</p>
              ) : (
                <div className="overflow-x-auto w-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Usuário</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead className="hidden md:table-cell">E-mail</TableHead>
                        <TableHead className="w-[100px]">Perfil</TableHead>
                        <TableHead className="w-[80px]">Status</TableHead>
                        <TableHead className="w-[120px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.username}</TableCell>
                          <TableCell>{user.name}</TableCell>
                          <TableCell className="hidden md:table-cell">{user.email || "-"}</TableCell>
                          <TableCell>{getRoleName(user.role)}</TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                user.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                              }`}
                            >
                              {user.active ? "Ativo" : "Inativo"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-row gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditUser(user)}
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
                                      Tem certeza que deseja excluir o usuário "{user.name}"? Esta ação não pode ser
                                      desfeita.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <DialogFooter>
                                    <Button variant="destructive" onClick={() => handleDeleteUser(user.id)}>
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
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de Perfis de Acesso */}
        <TabsContent value="roles" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>{isEditingRole ? "Editar Perfil" : "Adicionar Perfil"}</CardTitle>
              <CardDescription>
                {isEditingRole
                  ? "Atualize as informações do perfil de acesso"
                  : "Preencha os dados para adicionar um novo perfil de acesso"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="roleId" className="text-xs sm:text-sm">
                    ID do Perfil *
                  </Label>
                  <Input
                    id="roleId"
                    name="id"
                    value={currentRole.id}
                    onChange={handleRoleInputChange}
                    placeholder="ID único do perfil"
                    disabled={isEditingRole}
                    className="h-8 sm:h-9 text-xs sm:text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="roleName" className="text-xs sm:text-sm">
                    Nome do Perfil *
                  </Label>
                  <Input
                    id="roleName"
                    name="name"
                    value={currentRole.name}
                    onChange={handleRoleInputChange}
                    placeholder="Nome do perfil"
                    className="h-8 sm:h-9 text-xs sm:text-sm"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="roleDescription" className="text-xs sm:text-sm">
                    Descrição
                  </Label>
                  <Input
                    id="roleDescription"
                    name="description"
                    value={currentRole.description}
                    onChange={handleRoleInputChange}
                    placeholder="Descrição do perfil"
                    className="h-8 sm:h-9 text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div className="mt-4">
                <Label className="text-xs sm:text-sm">Permissões</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  {permissions.map((permission) => (
                    <div key={permission.id} className="flex items-center space-x-2 border rounded-md p-2">
                      <Switch
                        id={`permission-${permission.id}`}
                        checked={currentRole.permissions.includes(permission.id)}
                        onCheckedChange={() => handlePermissionToggle(permission.id)}
                      />
                      <Label htmlFor={`permission-${permission.id}`} className="flex flex-col cursor-pointer">
                        <span className="font-medium text-xs sm:text-sm">{permission.name}</span>
                        <span className="text-xs text-muted-foreground">{permission.description}</span>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end mt-4 space-x-2">
                {isEditingRole && (
                  <Button variant="outline" onClick={resetRoleForm}>
                    Cancelar
                  </Button>
                )}
                <Button onClick={handleAddRole}>{isEditingRole ? "Atualizar Perfil" : "Adicionar Perfil"}</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Perfis de Acesso</CardTitle>
              <CardDescription>Total de perfis: {roles.length}</CardDescription>
            </CardHeader>
            <CardContent className="no-scroll-table bottom-spacing">
              {roles.length === 0 ? (
                <p className="text-center text-muted-foreground">Nenhum perfil cadastrado</p>
              ) : (
                <div className="overflow-x-auto w-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">ID</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead className="hidden md:table-cell">Descrição</TableHead>
                        <TableHead className="w-[100px]">Permissões</TableHead>
                        <TableHead className="w-[120px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {roles.map((role) => (
                        <TableRow key={role.id}>
                          <TableCell className="font-medium">{role.id}</TableCell>
                          <TableCell>{role.name}</TableCell>
                          <TableCell className="hidden md:table-cell">{role.description || "-"}</TableCell>
                          <TableCell>{role.permissions.length}</TableCell>
                          <TableCell>
                            <div className="flex flex-row gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditRole(role)}
                                className="h-7 px-2 text-xs"
                              >
                                Editar
                              </Button>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    className="h-7 px-2 text-xs"
                                    disabled={role.id === "admin"}
                                  >
                                    Excluir
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-[90vw] sm:max-w-md">
                                  <DialogHeader>
                                    <DialogTitle>Confirmar exclusão</DialogTitle>
                                    <DialogDescription>
                                      Tem certeza que deseja excluir o perfil "{role.name}"? Esta ação não pode ser
                                      desfeita.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <DialogFooter>
                                    <Button variant="destructive" onClick={() => handleDeleteRole(role.id)}>
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
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Nova aba de Comanda */}
        <TabsContent value="receipt" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Configurações da Comanda
              </CardTitle>
              <CardDescription>Personalize as informações que aparecem nas comandas impressas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="space-y-2">
                  <Label htmlFor="receiptHeader">Cabeçalho da Comanda</Label>
                  <Textarea
                    id="receiptHeader"
                    value={companySettings.receipt?.header || ""}
                    onChange={(e) => handleReceiptChange("header", e.target.value)}
                    placeholder="Texto que aparecerá no topo da comanda"
                    className="min-h-[80px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    Você pode incluir mensagens de boas-vindas ou informações importantes.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="receiptFooter">Rodapé da Comanda</Label>
                  <Textarea
                    id="receiptFooter"
                    value={companySettings.receipt?.footer || ""}
                    onChange={(e) => handleReceiptChange("footer", e.target.value)}
                    placeholder="Texto que aparecerá no final da comanda"
                    className="min-h-[80px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    Você pode incluir agradecimentos, redes sociais ou informações adicionais.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <Label>Informações Exibidas</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="showLogo"
                          checked={companySettings.receipt?.showLogo || false}
                          onCheckedChange={(checked) => handleReceiptChange("showLogo", !!checked)}
                        />
                        <Label htmlFor="showLogo">Exibir Logo da Empresa</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="showAddress"
                          checked={companySettings.receipt?.showAddress || false}
                          onCheckedChange={(checked) => handleReceiptChange("showAddress", !!checked)}
                        />
                        <Label htmlFor="showAddress">Exibir Endereço</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="showPhone"
                          checked={companySettings.receipt?.showPhone || false}
                          onCheckedChange={(checked) => handleReceiptChange("showPhone", !!checked)}
                        />
                        <Label htmlFor="showPhone">Exibir Telefone</Label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label htmlFor="fontSize">Tamanho da Fonte</Label>
                    <Select
                      value={companySettings.receipt?.fontSize || "medium"}
                      onValueChange={(value) => handleReceiptChange("fontSize", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tamanho da fonte" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Pequena</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="large">Grande</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Escolha o tamanho da fonte que melhor se adapta à sua impressora.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveCompanySettings}>Salvar Configurações</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de Loja Online */}
        <TabsContent value="store" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Configurações da Loja Online</CardTitle>
              <CardDescription>Configure as informações básicas da sua loja online</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">Número de WhatsApp da Loja*</Label>
                  <Input
                    id="whatsapp"
                    value={companySettings.whatsapp || ""}
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
                <Button onClick={handleSaveCompanySettings}>Salvar Configurações</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Categorias de Produtos</CardTitle>
              <CardDescription>Gerencie as categorias de produtos da sua loja</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 mb-4">
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
                        className={`h-8 w-8 rounded-full cursor-pointer ${color} ${
                          currentCategory.color === color ? "ring-2 ring-offset-2 ring-black" : ""
                        }`}
                        onClick={() => handleCategoryColorChange(color)}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 mb-6">
                {isEditingCategory && (
                  <Button variant="outline" onClick={resetCategoryForm}>
                    Cancelar
                  </Button>
                )}
                <Button onClick={handleAddCategory}>
                  {isEditingCategory ? "Atualizar Categoria" : "Adicionar Categoria"}
                </Button>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cor</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell>
                          <div className={`h-6 w-6 rounded-full ${category.color}`}></div>
                        </TableCell>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{category.id}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditCategory(category)}>
                              Editar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => handleDeleteCategory(category.id)}
                            >
                              Excluir
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <div className="mt-4 flex justify-end">
            <Button variant="outline" asChild>
              <a href="/admin/store" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                Gerenciar Produtos da Loja
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
              </a>
            </Button>
          </div>
        </TabsContent>

        {/* Aba de Sincronização */}
        <TabsContent value="sync" className="mt-0">
          <CloudSyncComponent />
        </TabsContent>

        {/* Aba de Pagamentos */}
        <TabsContent value="payment" className="mt-0">
          <PaymentSettings />
        </TabsContent>

        {/* Aba de Fidelidade */}
        <TabsContent value="loyalty" className="mt-0">
          <div className="space-y-4">
            <LoyaltyProgramComponent />
            <CustomerManagement />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}


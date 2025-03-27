// Tipos
export type Permission = {
  id: string
  name: string
  description: string
}

export type Role = {
  id: string
  name: string
  description: string
  permissions: string[]
}

export type User = {
  id: string
  username: string
  password: string
  name: string
  email: string
  role: string
  active: boolean
  lastLogin?: string
}

// Adicione esta função no início do arquivo
const isBrowser = () => typeof window !== "undefined"

// Função para autenticar usuário
export const authenticateUser = (username: string, password: string): User | null => {
  const users = JSON.parse(localStorage.getItem("users") || "[]") as User[]

  const user = users.find((u) => u.username === username && u.password === password && u.active)

  if (user) {
    // Atualizar último login
    const updatedUsers = users.map((u) => {
      if (u.id === user.id) {
        return { ...u, lastLogin: new Date().toISOString() }
      }
      return u
    })

    localStorage.setItem("users", JSON.stringify(updatedUsers))

    // Salvar usuário atual na sessão
    localStorage.setItem("currentUser", JSON.stringify(user))

    return user
  }

  return null
}

// Função para obter usuário atual
export function getCurrentUser() {
  if (!isBrowser()) return null

  const userJson = localStorage.getItem("currentUser")
  if (!userJson) return null

  try {
    return JSON.parse(userJson)
  } catch (e) {
    console.error("Error parsing user data", e)
    return null
  }
}

// Garantir que o administrador tenha permissão para cancelar vendas
export const hasPermission = (permissionId: string): boolean => {
  const user = getCurrentUser()
  if (!user) return false

  // Admin sempre tem todas as permissões
  if (user.role === "admin") return true

  // Obter perfil do usuário
  const roles = JSON.parse(localStorage.getItem("roles") || "[]") as Role[]
  const userRole = roles.find((r) => r.id === user.role)

  if (!userRole) return false

  return userRole.permissions.includes(permissionId)
}

// Função para fazer logout
export function logout() {
  if (isBrowser()) {
    localStorage.removeItem("currentUser")
  }
}

// Lista de permissões disponíveis no sistema
const permissions: Permission[] = [
  { id: "dashboard_view", name: "Visualizar Dashboard", description: "Permite visualizar o dashboard" },
  { id: "cash_register_view", name: "Visualizar Caixa", description: "Permite visualizar o módulo de caixa" },
  { id: "cash_register_open", name: "Abrir/Fechar Caixa", description: "Permite abrir e fechar o caixa" },
  { id: "cash_register_sell", name: "Realizar Vendas", description: "Permite realizar vendas no caixa" },
  { id: "products_view", name: "Visualizar Produtos", description: "Permite visualizar produtos" },
  { id: "products_manage", name: "Gerenciar Produtos", description: "Permite adicionar, editar e excluir produtos" },
  { id: "inventory_manage", name: "Gerenciar Estoque", description: "Permite gerenciar o estoque de produtos" },
  { id: "service_orders_view", name: "Visualizar Ordens", description: "Permite visualizar ordens de serviço" },
  { id: "expenses_manage", name: "Gerenciar Despesas", description: "Permite gerenciar contas e despesas" },
]


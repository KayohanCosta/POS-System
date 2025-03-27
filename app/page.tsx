"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { AppLayout } from "@/components/ui/layout"
import Dashboard from "@/components/dashboard"
import CashRegister from "@/components/cash-register"
import Products from "@/components/products"
import ServiceOrders from "@/components/service-orders"
import Reports from "@/components/reports"
import Settings from "@/components/settings"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { initializeData } from "@/lib/data-utils"
import { authenticateUser, getCurrentUser, logout } from "@/lib/auth-utils"
import Inventory from "@/components/inventory"
import Expenses from "@/components/expenses"
import Tables from "@/components/tables"
import Kitchen from "@/components/kitchen"
import Delivery from "@/components/delivery"

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("dashboard")
  const { toast } = useToast()
  const [companySettings, setCompanySettings] = useState({
    name: "Tecno Mania",
    logoUrl: "/images/logo.png",
  })
  const [loginError, setLoginError] = useState(false)

  useEffect(() => {
    // Add global style to remove blue outline
    const style = document.createElement("style")
    style.innerHTML = `
    input:focus, button:focus {
      outline: none !important;
      box-shadow: none !important;
    }
  `
    document.head.appendChild(style)
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  useEffect(() => {
    // Precarregar a imagem do logo
    const imgPreload = new Image()
    imgPreload.src = "/images/logo.png"
  }, [])

  useEffect(() => {
    // Initialize data if it doesn't exist
    initializeData()

    // Check if user is already logged in
    const user = getCurrentUser()
    if (user) {
      setIsLoggedIn(true)
      setCurrentUser(user)
    }

    // Carregar configurações da empresa
    const storedCompanySettings = JSON.parse(localStorage.getItem("companySettings") || "null")
    if (storedCompanySettings) {
      setCompanySettings(storedCompanySettings)
    }
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError(false) // Reset error state on each attempt

    // Para garantir que o login admin/admin sempre funcione
    if (username === "admin" && password === "admin") {
      // Verificar se o usuário admin existe
      const users = JSON.parse(localStorage.getItem("users") || "[]")
      const adminExists = users.some((u: any) => u.username === "admin")

      if (!adminExists) {
        // Criar usuário admin se não existir
        const defaultAdmin = {
          id: "1",
          username: "admin",
          password: "admin",
          name: "Administrador",
          email: "admin@example.com",
          role: "admin",
          active: true,
          lastLogin: new Date().toISOString(),
        }

        users.push(defaultAdmin)
        localStorage.setItem("users", JSON.stringify(users))

        // Verificar se o perfil admin existe
        const roles = JSON.parse(localStorage.getItem("roles") || "[]")
        const adminRoleExists = roles.some((r: any) => r.id === "admin")

        if (!adminRoleExists) {
          // Criar perfil admin se não existir
          const adminRole = {
            id: "admin",
            name: "Administrador",
            description: "Acesso completo ao sistema",
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
              "settings_view",
              "users_manage",
              "roles_manage",
            ],
          }

          roles.push(adminRole)
          localStorage.setItem("roles", JSON.stringify(roles))
        }
      }

      // Login direto como admin
      const adminUser = {
        id: "1",
        username: "admin",
        password: "admin",
        name: "Administrador",
        email: "admin@example.com",
        role: "admin",
        active: true,
        lastLogin: new Date().toISOString(),
      }

      localStorage.setItem("currentUser", JSON.stringify(adminUser))
      setIsLoggedIn(true)
      setCurrentUser(adminUser)

      toast({
        title: "Login bem-sucedido",
        description: "Bem-vindo, Administrador!",
      })
      return
    }

    // Autenticar outros usuários
    const user = authenticateUser(username, password)

    if (user) {
      setIsLoggedIn(true)
      setCurrentUser(user)
      toast({
        title: "Login bem-sucedido",
        description: `Bem-vindo, ${user.name}!`,
      })
    } else {
      // Only set error if both fields have values
      if (username && password) {
        setLoginError(true)
      }
      toast({
        title: "Erro de login",
        description: "Usuário ou senha incorretos",
        variant: "destructive",
      })
    }
  }

  const handleLogout = () => {
    logout()
    setIsLoggedIn(false)
    setUsername("")
    setPassword("")
    setCurrentUser(null)
    toast({
      title: "Logout realizado",
      description: "Você saiu do sistema",
    })
  }

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />
      case "cash-register":
        return <CashRegister />
      case "products":
        return <Products />
      case "inventory":
        return <Inventory />
      case "service-orders":
        return <ServiceOrders />
      case "expenses":
        return <Expenses />
      case "reports":
        return <Reports />
      case "settings":
        return <Settings />
      case "tables":
        return <Tables />
      case "kitchen":
        return <Kitchen />
      case "delivery":
        return <Delivery />
      case "restaurant-inventory":
        return <Inventory /> // Usando o mesmo componente de inventário para restaurantes
      default:
        return <Dashboard />
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="flex min-h-screen bg-background items-center justify-center">
        <div className="w-full max-w-md px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary">
              <img
                src={companySettings.logoUrl || "/placeholder.svg"}
                alt={companySettings.name}
                className="h-full w-full object-cover rounded-full"
                onError={(e) => {
                  e.currentTarget.src =
                    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100%" height="100%" fill="%233b82f6"/><text x="50%" y="50%" fontFamily="Arial" fontSize="24" fill="white" textAnchor="middle" dominantBaseline="middle">TM</text></svg>'
                }}
              />
            </div>
            <h1 className="text-center text-2xl font-bold">{companySettings.name}</h1>
            <p className="text-center text-sm text-muted-foreground mb-8">Sistema de gerenciamento para lojistas</p>

            <div className="w-full">
              <h2 className="text-center text-xl font-bold tracking-tight mb-4">Acesse sua conta</h2>
              <p className="text-center text-sm text-muted-foreground mb-6">
                Entre com suas credenciais para acessar o sistema
              </p>

              <form className="space-y-6" onSubmit={handleLogin}>
                <div>
                  <Label htmlFor="username">Usuário</Label>
                  <div className="mt-1">
                    <Input
                      id="username"
                      name="username"
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className={`focus:outline-none focus:ring-0 border-gray-300 focus:border-gray-400 ${loginError ? "border-red-500" : ""}`}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="password">Senha</Label>
                  <div className="mt-1">
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`focus:outline-none focus:ring-0 border-gray-300 focus:border-gray-400 ${loginError ? "border-red-500" : ""}`}
                    />
                  </div>
                </div>

                <div>
                  <Button type="submit" className="w-full">
                    Entrar
                  </Button>
                </div>
              </form>

              <div className="mt-6 text-center text-sm text-muted-foreground">
                <p className="mt-2">
                  Cliente de ordem de serviço?{" "}
                  <a href="/client" className="text-primary hover:underline">
                    Acesse aqui
                  </a>
                </p>
                <p className="mt-2">
                  Loja online?{" "}
                  <a href="/store" className="text-primary hover:underline">
                    Acesse aqui
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <AppLayout onLogout={handleLogout} currentUser={currentUser} onTabChange={setActiveTab}>
      {renderContent()}
    </AppLayout>
  )
}


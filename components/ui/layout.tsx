"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  DollarSign,
  PackageOpen,
  FileText,
  Utensils,
  Coffee,
  Truck,
} from "lucide-react"
import { hasPermission } from "@/lib/auth-utils"

interface LayoutProps {
  children: React.ReactNode
  onLogout: () => void
  currentUser: any
  onTabChange: (tab: string) => void
}

export function AppLayout({ children, onLogout, currentUser, onTabChange }: LayoutProps) {
  const [activeTab, setActiveTab] = useState("cash-register")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const [companySettings, setCompanySettings] = useState({
    name: "Tecno Mania",
    logoUrl: "/images/logo.png",
    businessType: "retail",
  })

  // Add global styles for scrolling and responsiveness
  useEffect(() => {
    // Force scrolling to work by adding inline styles to critical elements
    document.documentElement.style.height = "100%"
    document.documentElement.style.overflow = "hidden"

    document.body.style.height = "100%"
    document.body.style.overflow = "hidden"

    // Remove any overflow:hidden that might be preventing scrolling
    const style = document.createElement("style")
    style.innerHTML = `
      #__next, main {
        height: 100% !important;
        overflow-y: auto !important;
        overflow-x: hidden !important;
        max-width: 100vw !important;
      }
      
      .overflow-hidden {
        overflow: visible !important;
      }
      
      .max-h-screen {
        max-height: none !important;
      }

      /* Fix horizontal scrolling */
      body, div, main {
        max-width: 100vw;
        overflow-x: hidden;
      }

      /* Ensure tables don't cause horizontal scroll */
      table {
        width: 100%;
        table-layout: fixed;
      }
    `
    document.head.appendChild(style)

    return () => {
      document.head.removeChild(style)
      document.documentElement.style.height = ""
      document.documentElement.style.overflow = ""
      document.body.style.height = ""
      document.body.style.overflow = ""
    }
  }, [])

  // Set active tab based on URL path
  useEffect(() => {
    const path = pathname.split("/")[1] || "cash-register"
    setActiveTab(path)
  }, [pathname])

  // Carregar configurações da empresa
  useEffect(() => {
    const storedCompanySettings = JSON.parse(localStorage.getItem("companySettings") || "null")
    if (storedCompanySettings) {
      setCompanySettings(storedCompanySettings)
    }
  }, [])

  const getRoleName = (roleId: string | undefined) => {
    if (!roleId) return ""
    const roles = JSON.parse(localStorage.getItem("roles") || "[]")
    const role = roles.find((r: any) => r.id === roleId)
    return role ? role.name : roleId
  }

  // Carregar configurações de negócio para mostrar/esconder itens de menu
  const [businessFeatures, setBusinessFeatures] = useState<any>({
    inventory: true,
    kitchen: false,
    tables: false,
    delivery: false,
    serviceOrders: true,
  })

  useEffect(() => {
    const storedSettings = JSON.parse(localStorage.getItem("companySettings") || "null")
    if (storedSettings) {
      setCompanySettings(storedSettings)
      if (storedSettings.features) {
        setBusinessFeatures(storedSettings.features)
      }
    }
  }, [])

  // Adicionar um novo useEffect para monitorar mudanças nas configurações
  useEffect(() => {
    const handleStorageChange = () => {
      const storedSettings = JSON.parse(localStorage.getItem("companySettings") || "null")
      if (storedSettings) {
        setCompanySettings(storedSettings)
        if (storedSettings.features) {
          setBusinessFeatures(storedSettings.features)
        }
      }
    }

    window.addEventListener("storage", handleStorageChange)

    // Verificar a cada 2 segundos se houve mudanças nas configurações
    const interval = setInterval(() => {
      const storedSettings = JSON.parse(localStorage.getItem("companySettings") || "null")
      if (storedSettings) {
        setCompanySettings(storedSettings)
        if (storedSettings.features) {
          setBusinessFeatures(storedSettings.features)
        }
      }
    }, 2000)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      clearInterval(interval)
    }
  }, [])

  // Caixa como primeiro item
  const cashRegisterItem = [
    {
      id: "cash-register",
      label: "Caixa",
      icon: <DollarSign className="h-4 w-4" />,
      permission: "cash_register_view",
      alwaysShow: true,
    },
  ]

  // Itens de navegação específicos para varejo
  const retailNavItems = [
    {
      id: "products",
      label: "Produtos",
      icon: <Package className="h-4 w-4" />,
      permission: "products_view",
      alwaysShow: true,
    },
    {
      id: "inventory",
      label: "Estoque",
      icon: <PackageOpen className="h-4 w-4" />,
      permission: "products_view",
      feature: "inventory",
    },
    {
      id: "service-orders",
      label: "Ordens",
      icon: <ClipboardList className="h-4 w-4" />,
      permission: "service_orders_view",
      feature: "serviceOrders",
    },
  ]

  // Itens de navegação específicos para restaurante/bar
  const restaurantNavItems = [
    {
      id: "products",
      label: "Cardápio",
      icon: <Package className="h-4 w-4" />,
      permission: "products_view",
      alwaysShow: true,
    },
    {
      id: "restaurant-inventory",
      label: "Estoque",
      icon: <PackageOpen className="h-4 w-4" />,
      permission: "products_view",
      feature: "inventory",
    },
    {
      id: "kitchen",
      label: "Cozinha",
      icon: <Utensils className="h-4 w-4" />,
      permission: "products_view",
      feature: "kitchen",
    },
    {
      id: "tables",
      label: "Mesas",
      icon: <Coffee className="h-4 w-4" />,
      permission: "products_view",
      feature: "tables",
    },
    {
      id: "delivery",
      label: "Delivery",
      icon: <Truck className="h-4 w-4" />,
      permission: "products_view",
      feature: "delivery",
    },
  ]

  // Item de despesas
  const expensesItem = [
    {
      id: "expenses",
      label: "Despesas",
      icon: <FileText className="h-4 w-4" />,
      permission: "reports_view",
      alwaysShow: true,
    },
  ]

  // Dashboard, relatórios e configurações
  const finalItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard className="h-4 w-4" />,
      permission: "dashboard_view",
      alwaysShow: true,
    },
    {
      id: "reports",
      label: "Relatórios",
      icon: <BarChart3 className="h-4 w-4" />,
      permission: "reports_view",
      alwaysShow: true,
    },
    {
      id: "settings",
      label: "Config.",
      icon: <Settings className="h-4 w-4" />,
      permission: "settings_view",
      alwaysShow: true,
    },
  ]

  // Selecionar os itens de navegação com base no tipo de negócio
  let businessSpecificNavItems: any[] = []

  if (companySettings.businessType === "retail") {
    businessSpecificNavItems = retailNavItems
  } else if (companySettings.businessType === "restaurant" || companySettings.businessType === "bar") {
    businessSpecificNavItems = restaurantNavItems
  }

  // Combinar todos os itens de navegação na ordem correta:
  // 1. Caixa
  // 2. Itens específicos do negócio
  // 3. Despesas
  // 4. Dashboard, Relatórios e Configurações
  const navigationItems = [...cashRegisterItem, ...businessSpecificNavItems, ...expensesItem, ...finalItems]

  const filteredNavItems = navigationItems.filter((item) => {
    // Verificar permissão
    const hasPermissionResult = hasPermission(item.permission)

    // Verificar se o item deve ser mostrado com base nas configurações de negócio
    const shouldShowByFeature = item.alwaysShow || (item.feature && businessFeatures[item.feature])

    return hasPermissionResult && shouldShowByFeature
  })

  // Função para lidar com a mudança de tab
  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    onTabChange(tab)
  }

  return (
    <div className="flex flex-col h-full" style={{ height: "100vh", overflow: "hidden", maxWidth: "100vw" }}>
      {/* Header */}
      <header className="app-header" style={{ flexShrink: 0 }}>
        <div className="app-logo" onClick={() => handleTabChange("cash-register")} style={{ cursor: "pointer" }}>
          <img
            src={companySettings.logoUrl || "/placeholder.svg"}
            alt={companySettings.name}
            className="app-logo-image"
            onError={(e) => {
              e.currentTarget.src =
                'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100%" height="100%" fill="%233b82f6"/><text x="50%" y="50%" fontFamily="Arial" fontSize="24" fill="white" textAnchor="middle" dominantBaseline="middle">TM</text></svg>'
            }}
          />
          <span className="app-logo-text hidden sm:block">{companySettings.name}</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="user-menu hidden sm:flex">
            <div className="user-avatar">
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
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-medium">{currentUser?.name}</span>
              <span className="text-xs text-muted-foreground">{getRoleName(currentUser?.role)}</span>
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={onLogout} className="hidden sm:flex items-center gap-1">
            <LogOut className="h-4 w-4" />
            <span>Sair</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm md:hidden transition-opacity",
          isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
      >
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-3/4 max-w-xs bg-background p-6 shadow-lg transition-transform duration-300 ease-in-out",
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <div
                className="app-logo"
                onClick={() => {
                  handleTabChange("cash-register")
                  setIsMobileMenuOpen(false)
                }}
                style={{ cursor: "pointer" }}
              >
                <img
                  src={companySettings.logoUrl || "/placeholder.svg"}
                  alt={companySettings.name}
                  className="app-logo-image"
                />
                <span className="app-logo-text">{companySettings.name}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="user-menu flex items-center mb-6 pb-4 border-b">
              <div className="user-avatar mr-3">
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
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="font-medium">{currentUser?.name}</span>
                <span className="text-xs text-muted-foreground">{getRoleName(currentUser?.role)}</span>
              </div>
            </div>

            <nav className="flex-1 space-y-1">
              {filteredNavItems.map((item) => (
                <Button
                  key={item.id}
                  variant={activeTab === item.id ? "default" : "ghost"}
                  className="w-full justify-start mb-1"
                  onClick={() => {
                    handleTabChange(item.id)
                    setIsMobileMenuOpen(false)
                  }}
                >
                  {item.icon}
                  <span className="ml-2">{item.label}</span>
                </Button>
              ))}
            </nav>

            <Button variant="outline" className="mt-auto flex items-center gap-2" onClick={onLogout}>
              <LogOut className="h-4 w-4" />
              <span>Sair</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden md:block px-4 pt-4" style={{ flexShrink: 0 }}>
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="w-full flex flex-wrap h-auto py-1">
            {filteredNavItems.map((item) => (
              <TabsTrigger key={item.id} value={item.id} className="flex items-center gap-1 py-1.5 px-3 h-auto">
                {item.icon}
                <span>{item.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Main Content */}
      <main
        style={{
          flex: "1 1 auto",
          height: "calc(100vh - 120px)",
          overflowY: "auto",
          overflowX: "hidden",
          padding: "1rem",
          maxWidth: "100vw",
        }}
      >
        {children}
      </main>
    </div>
  )
}


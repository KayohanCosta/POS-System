"use client"

import { useState, useEffect } from "react"
import ClientLogin from "@/components/client-login"
import OrderTracking from "@/components/order-tracking"

export default function ClientPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [orderId, setOrderId] = useState("")
  const [phone, setPhone] = useState("")

  // Verificar se o cliente já está logado
  useEffect(() => {
    const storedOrderId = localStorage.getItem("clientOrderId")
    const storedPhone = localStorage.getItem("clientPhone")

    if (storedOrderId && storedPhone) {
      setOrderId(storedOrderId)
      setPhone(storedPhone)
      setIsLoggedIn(true)
    }
  }, [])

  const handleLogin = (clientOrderId: string, clientPhone: string) => {
    // Salvar dados do cliente no localStorage
    localStorage.setItem("clientOrderId", clientOrderId)
    localStorage.setItem("clientPhone", clientPhone)

    setOrderId(clientOrderId)
    setPhone(clientPhone)
    setIsLoggedIn(true)
  }

  const handleLogout = () => {
    // Remover dados do cliente do localStorage
    localStorage.removeItem("clientOrderId")
    localStorage.removeItem("clientPhone")

    setOrderId("")
    setPhone("")
    setIsLoggedIn(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm py-4 px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <img src="/images/logo.png" alt="TECNO MANIA" className="h-8 w-auto mr-2 rounded-lg shadow-sm" />
            <h1 className="text-lg font-bold">Acompanhamento de Serviços</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center p-4 pt-8">
        <div className="w-full max-w-4xl">
          {isLoggedIn ? (
            <OrderTracking orderId={orderId} onLogout={handleLogout} />
          ) : (
            <ClientLogin onLogin={handleLogin} />
          )}
        </div>
      </main>

      <footer className="bg-white py-4 border-t">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} TECNO MANIA - Todos os direitos reservados</p>
        </div>
      </footer>
    </div>
  )
}


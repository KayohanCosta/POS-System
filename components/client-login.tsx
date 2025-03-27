"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"

interface ClientLoginProps {
  onLogin: (clientId: string, phone: string) => void
}

export default function ClientLogin({ onLogin }: ClientLoginProps) {
  const { toast } = useToast()
  const [orderId, setOrderId] = useState("")
  const [phone, setPhone] = useState("")

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()

    if (!orderId || !phone) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos",
        variant: "destructive",
      })
      return
    }

    // Verificar se a ordem existe e o telefone corresponde
    const serviceOrders = JSON.parse(localStorage.getItem("serviceOrders") || "[]")
    const order = serviceOrders.find(
      (order: any) =>
        order.id.slice(-4) === orderId.trim() && order.customerPhone.replace(/\D/g, "") === phone.replace(/\D/g, ""),
    )

    if (order) {
      toast({
        title: "Login bem-sucedido",
        description: "Você será redirecionado para o acompanhamento da sua ordem",
      })
      onLogin(order.id, phone)
    } else {
      toast({
        title: "Erro",
        description: "Número da ordem ou telefone incorretos",
        variant: "destructive",
      })
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>
          <img
            src="/images/logo.png"
            alt="TECNO MANIA"
            className="h-8 w-auto mr-2 rounded-lg shadow-sm"
            style={{ display: "block" }}
            onError={(e) => {
              console.error("Erro ao carregar a logo")
              e.currentTarget.src =
                'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100%" height="100%" fill="%23007bff"/><text x="50%" y="50%" fontFamily="Arial" fontSize="24" fill="white" textAnchor="middle" dominantBaseline="middle">TM</text></svg>'
            }}
          />
          Acompanhamento de Ordem
        </CardTitle>
        <CardDescription>Informe o número da ordem e o telefone cadastrado para acompanhar o status</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="orderId">Número da Ordem</Label>
            <Input id="orderId" placeholder="Ex: 1234" value={orderId} onChange={(e) => setOrderId(e.target.value)} />
            <p className="text-xs text-muted-foreground">Informe apenas os 4 últimos dígitos do número da ordem</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input id="phone" placeholder="(00) 00000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <p className="text-xs text-muted-foreground">Informe o telefone cadastrado na ordem de serviço</p>
          </div>

          <Button type="submit" className="w-full">
            Acessar
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}


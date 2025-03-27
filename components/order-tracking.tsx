"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"

interface OrderTrackingProps {
  orderId: string
  onLogout: () => void
}

export default function OrderTracking({ orderId, onLogout }: OrderTrackingProps) {
  const { toast } = useToast()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Carregar dados da ordem
    const serviceOrders = JSON.parse(localStorage.getItem("serviceOrders") || "[]")
    const foundOrder = serviceOrders.find((o: any) => o.id === orderId)

    if (foundOrder) {
      setOrder(foundOrder)
    } else {
      toast({
        title: "Erro",
        description: "Ordem não encontrada",
        variant: "destructive",
      })
    }

    setLoading(false)
  }, [orderId, toast])

  // Função para obter a cor do status
  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      Recebido: "bg-blue-100 text-blue-800",
      "Em análise": "bg-yellow-100 text-yellow-800",
      "Orçamento aprovado": "bg-purple-100 text-purple-800",
      "Em reparo": "bg-orange-100 text-orange-800",
      Concluído: "bg-green-100 text-green-800",
      Entregue: "bg-gray-100 text-gray-800",
    }

    return statusColors[status] || "bg-gray-100 text-gray-800"
  }

  // Função para obter a descrição do status
  const getStatusDescription = (status: string) => {
    const descriptions: Record<string, string> = {
      Recebido: "Seu dispositivo foi recebido e está aguardando análise técnica.",
      "Em análise": "Nossos técnicos estão analisando seu dispositivo para identificar o problema.",
      "Orçamento aprovado": "O orçamento foi aprovado e seu dispositivo está na fila para reparo.",
      "Em reparo": "Seu dispositivo está sendo reparado neste momento.",
      Concluído: "O reparo foi concluído e seu dispositivo está pronto para retirada.",
      Entregue: "Seu dispositivo foi entregue. Obrigado pela confiança!",
    }

    return descriptions[status] || "Status não disponível."
  }

  // Add this function after the getStatusDescription function
  const handlePrintOrder = () => {
    const printContent = `
    <html>
      <head>
        <title>Ordem de Serviço #${order.id.slice(-4)} - TECNO MANIA</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { text-align: center; margin-bottom: 20px; }
          .header { display: flex; justify-content: center; margin-bottom: 20px; align-items: center; }
          .logo { height: 60px; border-radius: 10px; margin-right: 20px; }
          .order-details { margin-bottom: 20px; }
          .section { margin-bottom: 15px; border: 1px solid #ddd; padding: 10px; border-radius: 5px; }
          .section-title { font-weight: bold; margin-bottom: 5px; }
          .status { display: inline-block; padding: 5px 10px; border-radius: 4px; font-weight: bold; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="/images/logo.png" alt="TECNO MANIA" class="logo">
          <h1>Ordem de Serviço #${order.id.slice(-4)}</h1>
        </div>
        
        <div class="order-details">
          <p><strong>Cliente:</strong> ${order.customerName}</p>
          <p><strong>Telefone:</strong> ${order.customerPhone || "-"}</p>
          <p><strong>Data de criação:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
        </div>
        
        <div class="section">
          <div class="section-title">Status atual:</div>
          <div class="status" style="background-color: ${
            order.status === "Concluído"
              ? "#d1fae5"
              : order.status === "Em reparo"
                ? "#ffedd5"
                : order.status === "Recebido"
                  ? "#dbeafe"
                  : "#f3f4f6"
          }; color: ${
            order.status === "Concluído"
              ? "#065f46"
              : order.status === "Em reparo"
                ? "#9a3412"
                : order.status === "Recebido"
                  ? "#1e40af"
                  : "#374151"
          };">${order.status}</div>
          <p>${getStatusDescription(order.status)}</p>
        </div>
        
        <div class="section">
          <div class="section-title">Detalhes do dispositivo:</div>
          <p><strong>Tipo:</strong> ${order.deviceType}</p>
          <p><strong>Marca/Modelo:</strong> ${order.deviceBrand} ${order.deviceModel}</p>
        </div>
        
        <div class="section">
          <div class="section-title">Problema relatado:</div>
          <p>${order.problem}</p>
        </div>
        
        ${
          order.status !== "Recebido"
            ? `
        <div class="section">
          <div class="section-title">Diagnóstico técnico:</div>
          <p>${order.observations || "Diagnóstico em andamento..."}</p>
        </div>
        `
            : ""
        }
        
        ${
          order.status === "Orçamento aprovado" ||
          order.status === "Em reparo" ||
          order.status === "Concluído" ||
          order.status === "Entregue"
            ? `
        <div class="section">
          <div class="section-title">Valor do serviço:</div>
          <p>R$ ${order.price ? order.price.toFixed(2) : "0.00"}</p>
        </div>
        `
            : ""
        }
        
        <div class="footer">
          <p>TECNO MANIA - Assistência Técnica Especializada</p>
          <p>Este documento é um comprovante da ordem de serviço.</p>
        </div>
      </body>
    </html>
  `

    const printWindow = window.open("", "_blank")
    printWindow?.document.write(printContent)
    printWindow?.document.close()
    printWindow?.focus()
    printWindow?.print()
  }

  if (loading) {
    return <div className="text-center">Carregando...</div>
  }

  if (!order) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="mb-4">Ordem não encontrada</p>
            <Button onClick={onLogout}>Voltar</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Add a print button to the card header
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Ordem de Serviço #{order.id.slice(-4)}</CardTitle>
            <CardDescription>Cliente: {order.customerName}</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrintOrder}>
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
                className="lucide lucide-printer mr-1"
              >
                <polyline points="6 9 6 2 18 2 18 9"></polyline>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                <rect width="12" height="8" x="6" y="14"></rect>
              </svg>
              Imprimir
            </Button>
            <Button variant="outline" size="sm" onClick={onLogout}>
              Sair
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Status atual:</h3>
          <Badge className={`${getStatusColor(order.status)} px-3 py-1 text-sm font-medium`}>{order.status}</Badge>
          <p className="text-sm text-muted-foreground mt-1">{getStatusDescription(order.status)}</p>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium">Detalhes do dispositivo:</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="font-medium">Tipo:</p>
              <p>{order.deviceType}</p>
            </div>
            <div>
              <p className="font-medium">Marca/Modelo:</p>
              <p>
                {order.deviceBrand} {order.deviceModel}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium">Problema relatado:</h3>
          <p className="text-sm">{order.problem}</p>
        </div>

        {order.status !== "Recebido" && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Diagnóstico técnico:</h3>
            <p className="text-sm">{order.observations || "Diagnóstico em andamento..."}</p>
          </div>
        )}

        {(order.status === "Orçamento aprovado" ||
          order.status === "Em reparo" ||
          order.status === "Concluído" ||
          order.status === "Entregue") && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Valor do serviço:</h3>
            <p className="text-sm">R$ {order.price ? order.price.toFixed(2) : "0.00"}</p>
          </div>
        )}

        {(order.status === "Concluído" || order.status === "Entregue") && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800">
              Seu dispositivo está pronto para retirada. Por favor, compareça à loja com um documento de identificação.
            </p>
          </div>
        )}

        <div className="pt-4">
          <p className="text-xs text-center text-muted-foreground">
            Esta página é atualizada automaticamente conforme o status da sua ordem é alterado.
            <br />
            Data de criação: {new Date(order.createdAt).toLocaleDateString()}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}


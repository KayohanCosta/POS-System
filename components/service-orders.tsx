"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

export default function ServiceOrders() {
  const { toast } = useToast()
  const [serviceOrders, setServiceOrders] = useState<any[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [currentOrder, setCurrentOrder] = useState({
    id: "",
    customerName: "",
    customerPhone: "",
    deviceType: "Celular",
    deviceBrand: "",
    deviceModel: "",
    problem: "",
    observations: "",
    status: "Recebido",
    createdAt: "",
    price: "",
  })
  const [orderLink, setOrderLink] = useState("")

  useEffect(() => {
    // Load service orders from localStorage
    const storedOrders = JSON.parse(localStorage.getItem("serviceOrders") || "[]")
    setServiceOrders(storedOrders)
  }, [])

  const saveServiceOrders = (updatedOrders: any[]) => {
    localStorage.setItem("serviceOrders", JSON.stringify(updatedOrders))
    setServiceOrders(updatedOrders)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setCurrentOrder({
      ...currentOrder,
      [name]: value,
    })
  }

  const handleSelectChange = (name: string, value: string) => {
    setCurrentOrder({
      ...currentOrder,
      [name]: value,
    })
  }

  const handleAddOrder = () => {
    // Validate inputs
    if (!currentOrder.customerName || !currentOrder.deviceBrand || !currentOrder.deviceModel || !currentOrder.problem) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      })
      return
    }

    const price = currentOrder.price ? Number.parseFloat(currentOrder.price) : 0
    if (currentOrder.price && isNaN(price)) {
      toast({
        title: "Erro",
        description: "O preço deve ser um número válido",
        variant: "destructive",
      })
      return
    }

    const newOrder = {
      id: isEditing ? currentOrder.id : Date.now().toString(),
      customerName: currentOrder.customerName,
      customerPhone: currentOrder.customerPhone,
      deviceType: currentOrder.deviceType,
      deviceBrand: currentOrder.deviceBrand,
      deviceModel: currentOrder.deviceModel,
      problem: currentOrder.problem,
      observations: currentOrder.observations,
      status: currentOrder.status,
      createdAt: isEditing ? currentOrder.createdAt : new Date().toISOString(),
      price,
    }

    let updatedOrders
    if (isEditing) {
      updatedOrders = serviceOrders.map((order) => (order.id === currentOrder.id ? newOrder : order))
      toast({
        title: "Ordem atualizada",
        description: `Ordem de serviço #${newOrder.id.slice(-4)} foi atualizada com sucesso`,
      })
    } else {
      updatedOrders = [...serviceOrders, newOrder]
      toast({
        title: "Ordem criada",
        description: `Ordem de serviço #${newOrder.id.slice(-4)} foi criada com sucesso`,
      })

      // Gerar link para acompanhamento
      const baseUrl = window.location.origin
      setOrderLink(`${baseUrl}/client`)
    }

    saveServiceOrders(updatedOrders)
    resetForm()
  }

  const handleEditOrder = (order: any) => {
    setIsEditing(true)
    setCurrentOrder({
      id: order.id,
      customerName: order.customerName,
      customerPhone: order.customerPhone || "",
      deviceType: order.deviceType,
      deviceBrand: order.deviceBrand,
      deviceModel: order.deviceModel,
      problem: order.problem,
      observations: order.observations || "",
      status: order.status,
      createdAt: order.createdAt,
      price: order.price ? order.price.toString() : "",
    })
  }

  const handleDeleteOrder = (id: string) => {
    const updatedOrders = serviceOrders.filter((order) => order.id !== id)
    saveServiceOrders(updatedOrders)
    toast({
      title: "Ordem removida",
      description: "A ordem de serviço foi removida com sucesso",
    })
  }

  const resetForm = () => {
    setIsEditing(false)
    setCurrentOrder({
      id: "",
      customerName: "",
      customerPhone: "",
      deviceType: "Celular",
      deviceBrand: "",
      deviceModel: "",
      problem: "",
      observations: "",
      status: "Recebido",
      createdAt: "",
      price: "",
    })
  }

  const handlePrintOrders = () => {
    // Create a printable version of the orders
    let printContent = `
    <html>
      <head>
        <title>Ordens de Serviço - TECNO MANIA</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { text-align: center; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .header { display: flex; justify-content: center; margin-bottom: 20px; }
          .logo { height: 60px; border-radius: 10px; margin-right: 20px; }
          .date { text-align: right; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="/images/logo.png" alt="TECNO MANIA" class="logo">
          <h1>Relatório de Ordens de Serviço</h1>
        </div>
        <div class="date">Data: ${new Date().toLocaleDateString()}</div>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Cliente</th>
              <th>Telefone</th>
              <th>Dispositivo</th>
              <th>Status</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody>
  `

    serviceOrders.forEach((order) => {
      printContent += `
      <tr>
        <td>#${order.id.slice(-4)}</td>
        <td>${order.customerName}</td>
        <td>${order.customerPhone || "-"}</td>
        <td>${order.deviceBrand} ${order.deviceModel}</td>
        <td>${order.status}</td>
        <td>${new Date(order.createdAt).toLocaleDateString()}</td>
      </tr>
    `
    })

    printContent += `
          </tbody>
        </table>
        <p>Total de ordens: ${serviceOrders.length}</p>
      </body>
    </html>
  `

    // Open a new window and print
    const printWindow = window.open("", "_blank")
    printWindow?.document.write(printContent)
    printWindow?.document.close()
    printWindow?.focus()
    printWindow?.print()
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? "Editar Ordem de Serviço" : "Nova Ordem de Serviço"}</CardTitle>
          <CardDescription>
            {isEditing
              ? "Atualize as informações da ordem de serviço"
              : "Preencha os dados para criar uma nova ordem de serviço"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="customerName">Nome do Cliente *</Label>
              <Input
                id="customerName"
                name="customerName"
                value={currentOrder.customerName}
                onChange={handleInputChange}
                placeholder="Nome do cliente"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerPhone">Telefone *</Label>
              <Input
                id="customerPhone"
                name="customerPhone"
                value={currentOrder.customerPhone}
                onChange={handleInputChange}
                placeholder="(00) 00000-0000"
              />
              <p className="text-xs text-muted-foreground">O cliente usará este telefone para acompanhar a ordem</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deviceType">Tipo de Dispositivo *</Label>
              <Select
                value={currentOrder.deviceType}
                onValueChange={(value) => handleSelectChange("deviceType", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Celular">Celular</SelectItem>
                  <SelectItem value="Tablet">Tablet</SelectItem>
                  <SelectItem value="Notebook">Notebook</SelectItem>
                  <SelectItem value="Computador">Computador</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deviceBrand">Marca *</Label>
              <Input
                id="deviceBrand"
                name="deviceBrand"
                value={currentOrder.deviceBrand}
                onChange={handleInputChange}
                placeholder="Marca do dispositivo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deviceModel">Modelo *</Label>
              <Input
                id="deviceModel"
                name="deviceModel"
                value={currentOrder.deviceModel}
                onChange={handleInputChange}
                placeholder="Modelo do dispositivo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select value={currentOrder.status} onValueChange={(value) => handleSelectChange("status", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Recebido">Recebido</SelectItem>
                  <SelectItem value="Em análise">Em análise</SelectItem>
                  <SelectItem value="Orçamento aprovado">Orçamento aprovado</SelectItem>
                  <SelectItem value="Em reparo">Em reparo</SelectItem>
                  <SelectItem value="Concluído">Concluído</SelectItem>
                  <SelectItem value="Entregue">Entregue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Preço (R$)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="0"
                value={currentOrder.price}
                onChange={handleInputChange}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2 mt-4">
            <Label htmlFor="problem">Problema/Defeito *</Label>
            <Textarea
              id="problem"
              name="problem"
              value={currentOrder.problem}
              onChange={handleInputChange}
              placeholder="Descreva o problema relatado pelo cliente"
              rows={3}
            />
          </div>

          <div className="space-y-2 mt-4">
            <Label htmlFor="observations">Observações</Label>
            <Textarea
              id="observations"
              name="observations"
              value={currentOrder.observations}
              onChange={handleInputChange}
              placeholder="Observações adicionais"
              rows={3}
            />
          </div>

          <div className="flex justify-end mt-4 space-x-2">
            {isEditing && (
              <Button variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
            )}
            <Button onClick={handleAddOrder}>{isEditing ? "Atualizar Ordem" : "Criar Ordem"}</Button>
          </div>

          {orderLink && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <h3 className="text-sm font-medium text-green-800 mb-2">Ordem criada com sucesso!</h3>
              <p className="text-sm text-green-700 mb-2">O cliente pode acompanhar o status da ordem usando:</p>
              <ul className="text-sm text-green-700 mb-2 list-disc pl-5">
                <li>
                  Número da ordem: <strong>{currentOrder.id.slice(-4)}</strong>
                </li>
                <li>Telefone cadastrado</li>
              </ul>
              <p className="text-sm text-green-700">
                Link para acompanhamento:{" "}
                <a href={orderLink} target="_blank" rel="noopener noreferrer" className="underline">
                  {orderLink}
                </a>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Ordens de Serviço</CardTitle>
              <CardDescription>Total de ordens: {serviceOrders.length}</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => handlePrintOrders()} className="h-8 gap-1">
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
                className="lucide lucide-printer"
              >
                <polyline points="6 9 6 2 18 2 18 9"></polyline>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                <rect width="12" height="8" x="6" y="14"></rect>
              </svg>
              Imprimir
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {serviceOrders.length === 0 ? (
            <p className="text-center text-muted-foreground">Nenhuma ordem de serviço cadastrada</p>
          ) : (
            <div className="overflow-x-auto -mx-3 px-3 w-full table-responsive bottom-spacing">
              <Table className="min-w-[700px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">ID</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="hidden md:table-cell">Dispositivo</TableHead>
                    <TableHead className="hidden sm:table-cell">Status</TableHead>
                    <TableHead className="w-[80px]">Data</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {serviceOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>#{order.id.slice(-4)}</TableCell>
                      <TableCell>{order.customerName}</TableCell>
                      <TableCell className="hidden md:table-cell">{`${order.deviceBrand} ${order.deviceModel}`}</TableCell>
                      <TableCell className="hidden sm:table-cell">{order.status}</TableCell>
                      <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex flex-row gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditOrder(order)}
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
                                  Tem certeza que deseja excluir a ordem de serviço #{order.id.slice(-4)}? Esta ação não
                                  pode ser desfeita.
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                <Button variant="destructive" onClick={() => handleDeleteOrder(order.id)}>
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
    </div>
  )
}


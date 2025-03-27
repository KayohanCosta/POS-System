"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { addTransaction } from "@/lib/data-utils"
import { useRouter } from "next/navigation"

// Adicionar integração com o sistema de pagamento e fidelidade
import {
  usePaymentProcessor,
  type PaymentRequest,
  type PaymentResponse,
  generateTextReceipt,
} from "@/lib/payment-service"
import { useLoyalty } from "@/lib/loyalty-service"
import { Badge } from "@/components/ui/badge"
import { Printer, Download, Copy, CheckCircle, BanknoteIcon } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { useBankConnections } from "@/lib/bank-connections-service"

export default function PaymentCheckout() {
  const router = useRouter()
  const { toast } = useToast()
  const [checkoutTable, setCheckoutTable] = useState<any>(null)
  const [selectedProducts, setSelectedProducts] = useState<any[]>([])
  const [customerName, setCustomerName] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("Dinheiro")
  const [totalAmount, setTotalAmount] = useState(0)
  const [changeAmount, setChangeAmount] = useState<string>("")
  const [receivedAmount, setReceivedAmount] = useState<string>("")
  const [discount, setDiscount] = useState<string>("0")
  const [finalTotal, setFinalTotal] = useState(0)

  const [paymentMethods, setPaymentMethods] = useState<Array<{ method: string; amount: string }>>([])
  const [totalPaid, setTotalPaid] = useState(0)
  const [remainingAmount, setRemainingAmount] = useState(0)

  const { processTransaction, processing } = usePaymentProcessor()
  const { customers, registerSalePoints } = useLoyalty()
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("")
  const [paymentResponse, setPaymentResponse] = useState<PaymentResponse | null>(null)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [manualNotes, setManualNotes] = useState("")
  const [receiptText, setReceiptText] = useState("")
  const [showReceipt, setShowReceipt] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const receiptRef = useRef<HTMLDivElement>(null)

  // Adicione este código na seção de métodos de pagamento

  // Verificar se há conexões bancárias ativas
  const { connections } = useBankConnections()
  const activeConnections = connections.filter((c) => c.connected && new Date(c.expiresAt || "") > new Date())

  // Calcular o total pago e o valor restante quando os métodos de pagamento mudam
  useEffect(() => {
    const total = paymentMethods.reduce((sum, method) => {
      return sum + (Number.parseFloat(method.amount) || 0)
    }, 0)

    setTotalPaid(total)
    setRemainingAmount(finalTotal - total)
  }, [paymentMethods, finalTotal])

  // Função para adicionar/remover método de pagamento
  const handlePaymentMethodToggle = (method: string, checked: boolean) => {
    if (checked) {
      // Se o método for o primeiro a ser adicionado, atribuir o valor total
      const amount = paymentMethods.length === 0 ? finalTotal.toString() : "0"
      setPaymentMethods([...paymentMethods, { method, amount }])
    } else {
      setPaymentMethods(paymentMethods.filter((p) => p.method !== method))
    }
  }

  // Função para atualizar o valor de um método de pagamento
  const handlePaymentMethodAmountChange = (method: string, amount: string) => {
    setPaymentMethods(
      paymentMethods.map((p) => {
        if (p.method === method) {
          return { ...p, amount }
        }
        return p
      }),
    )
  }

  useEffect(() => {
    // Verificar se há uma mesa para checkout
    const tableCheckout = localStorage.getItem("checkoutTable")
    if (tableCheckout) {
      const parsedCheckout = JSON.parse(tableCheckout)
      setCheckoutTable(parsedCheckout)
      setSelectedProducts(parsedCheckout.items || [])
      setCustomerName(`Mesa ${parsedCheckout.tableNumber}`)
      setTotalAmount(parsedCheckout.total || 0)
      setFinalTotal(parsedCheckout.total || 0)
    } else {
      // Se não houver mesa para checkout, redirecionar para a página de mesas
      toast({
        title: "Nenhuma mesa selecionada",
        description: "Selecione uma mesa para finalizar o pagamento",
        variant: "destructive",
      })
      router.push("/")
    }
  }, [router, toast])

  // Calcular troco quando o valor recebido muda
  useEffect(() => {
    if (receivedAmount && !isNaN(Number(receivedAmount))) {
      const received = Number.parseFloat(receivedAmount)
      const change = received - finalTotal
      setChangeAmount(change > 0 ? change.toFixed(2) : "0.00")
    } else {
      setChangeAmount("0.00")
    }
  }, [receivedAmount, finalTotal])

  // Calcular total final quando o desconto muda
  useEffect(() => {
    if (discount && !isNaN(Number(discount))) {
      const discountValue = Number.parseFloat(discount)
      const newTotal = totalAmount - discountValue
      setFinalTotal(newTotal > 0 ? newTotal : 0)
    } else {
      setFinalTotal(totalAmount)
    }
  }, [discount, totalAmount])

  const handleCompleteSale = () => {
    if (selectedProducts.length === 0) {
      toast({
        title: "Erro",
        description: "Não há produtos para finalizar a venda",
        variant: "destructive",
      })
      return
    }

    // Verificar se há métodos de pagamento selecionados
    if (paymentMethods.length === 0) {
      toast({
        title: "Forma de pagamento não selecionada",
        description: "Selecione pelo menos uma forma de pagamento",
        variant: "destructive",
      })
      return
    }

    // Verificar se o valor total pago é suficiente
    if (totalPaid < finalTotal) {
      toast({
        title: "Valor insuficiente",
        description: `Faltam R$ ${remainingAmount.toFixed(2)} para completar o pagamento`,
        variant: "destructive",
      })
      return
    }

    // Verificar se o valor recebido em dinheiro é suficiente para o troco
    const cashPayment = paymentMethods.find((p) => p.method === "Dinheiro")
    if (cashPayment && receivedAmount) {
      const received = Number.parseFloat(receivedAmount)
      const cashAmount = Number.parseFloat(cashPayment.amount) || 0

      if (received < cashAmount) {
        toast({
          title: "Valor em dinheiro insuficiente",
          description: "O valor recebido em dinheiro é menor que o valor a ser pago em dinheiro",
          variant: "destructive",
        })
        return
      }
    }

    // Criar transação
    const transaction = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      customer: customerName || "Cliente não identificado",
      customerId: selectedCustomerId,
      products: selectedProducts,
      total: finalTotal,
      originalTotal: totalAmount,
      discount: Number.parseFloat(discount) || 0,
      paymentMethods: paymentMethods.map((p) => ({
        method: p.method,
        amount: Number.parseFloat(p.amount) || 0,
      })),
      receivedAmount: receivedAmount ? Number.parseFloat(receivedAmount) : 0,
      changeAmount: changeAmount ? Number.parseFloat(changeAmount) : 0,
      canceled: false,
      tableId: checkoutTable?.tableId,
      tableNumber: checkoutTable?.tableNumber,
      manualNotes: manualNotes,
    }

    // Adicionar transação
    addTransaction(transaction)

    // Registrar pontos de fidelidade se cliente selecionado
    if (selectedCustomerId) {
      registerSalePoints(selectedCustomerId, finalTotal, transaction.id)
    }

    // Se for um checkout de mesa, liberar a mesa
    if (checkoutTable) {
      const tables = JSON.parse(localStorage.getItem("tables") || "[]")
      const updatedTables = tables.map((table: any) => {
        if (table.id === checkoutTable.tableId) {
          return {
            ...table,
            status: "free",
            occupiedAt: undefined,
            currentOrder: undefined,
          }
        }
        return table
      })

      localStorage.setItem("tables", JSON.stringify(updatedTables))
      localStorage.removeItem("checkoutTable")
    }

    // Gerar recibo em texto
    const customerInfo = {
      name: customerName,
      document: "",
      email: "",
      phone: "",
    }

    if (selectedCustomerId) {
      const customer = customers.find((c) => c.id === selectedCustomerId)
      if (customer) {
        customerInfo.document = customer.document || ""
        customerInfo.email = customer.email || ""
        customerInfo.phone = customer.phone || ""
      }
    }

    // Criar um objeto de resposta de pagamento para o recibo
    const paymentForReceipt: PaymentResponse = {
      id: transaction.id,
      status: "approved",
      amount: finalTotal,
      method: (paymentMethods[0]?.method as any) || "manual",
      transactionId: transaction.id,
      processingDate: transaction.date,
      manualNotes: manualNotes,
    }

    const receipt = generateTextReceipt(paymentForReceipt, customerInfo)
    setReceiptText(receipt)
    setShowReceipt(true)

    toast({
      title: "Venda finalizada",
      description: `Pagamento de R$ ${finalTotal.toFixed(2)} realizado com sucesso`,
    })
  }

  const handleProcessPayment = async (method: string) => {
    if (selectedProducts.length === 0) {
      toast({
        title: "Erro",
        description: "Não há produtos para finalizar a venda",
        variant: "destructive",
      })
      return
    }

    // Verificar se há um método de pagamento selecionado
    const paymentMethod = paymentMethods.find((p) => p.method === method)
    if (!paymentMethod) {
      toast({
        title: "Método de pagamento não selecionado",
        description: "Selecione um método de pagamento",
        variant: "destructive",
      })
      return
    }

    setProcessingPayment(true)

    try {
      // Preparar requisição de pagamento
      const paymentRequest: PaymentRequest = {
        amount: Number.parseFloat(paymentMethod.amount),
        method:
          method === "Cartão de Crédito"
            ? "credit"
            : method === "Cartão de Débito"
              ? "debit"
              : method === "PIX"
                ? "pix"
                : method === "Transferência"
                  ? "transfer"
                  : method === "Boleto"
                    ? "bank_slip"
                    : "cash",
        description: `Venda ${checkoutTable ? `Mesa ${checkoutTable.tableNumber}` : ""}`,
        customerName: customerName,
        reference: `sale_${Date.now()}`,
        customerDocument: "",
        customerEmail: "",
        customerPhone: "",
      }

      // Se tiver cliente selecionado, adicionar informações
      if (selectedCustomerId) {
        const customer = customers.find((c) => c.id === selectedCustomerId)
        if (customer) {
          paymentRequest.customerDocument = customer.document || ""
          paymentRequest.customerEmail = customer.email || ""
          paymentRequest.customerPhone = customer.phone || ""
        }
      }

      // Processar pagamento
      const response = await processTransaction(paymentRequest)
      setPaymentResponse(response)

      // Se aprovado, finalizar a venda
      if (response.status === "approved") {
        // Criar transação
        const transaction = {
          id: Date.now().toString(),
          date: new Date().toISOString(),
          customer: customerName || "Cliente não identificado",
          customerId: selectedCustomerId,
          products: selectedProducts,
          total: finalTotal,
          originalTotal: totalAmount,
          discount: Number.parseFloat(discount) || 0,
          paymentMethods: paymentMethods.map((p) => ({
            method: p.method,
            amount: Number.parseFloat(p.amount) || 0,
          })),
          receivedAmount: receivedAmount ? Number.parseFloat(receivedAmount) : 0,
          changeAmount: changeAmount ? Number.parseFloat(changeAmount) : 0,
          canceled: false,
          tableId: checkoutTable?.tableId,
          tableNumber: checkoutTable?.tableNumber,
          paymentResponse: response,
          manualNotes: manualNotes || response.manualNotes,
        }

        // Adicionar transação
        addTransaction(transaction)

        // Registrar pontos de fidelidade se cliente selecionado
        if (selectedCustomerId) {
          registerSalePoints(selectedCustomerId, finalTotal, transaction.id)
        }

        // Se for um checkout de mesa, liberar a mesa
        if (checkoutTable) {
          const tables = JSON.parse(localStorage.getItem("tables") || "[]")
          const updatedTables = tables.map((table: any) => {
            if (table.id === checkoutTable.tableId) {
              return {
                ...table,
                status: "free",
                occupiedAt: undefined,
                currentOrder: undefined,
              }
            }
            return table
          })

          localStorage.setItem("tables", JSON.stringify(updatedTables))
          localStorage.removeItem("checkoutTable")
        }

        // Gerar recibo em texto
        const customerInfo = {
          name: customerName,
          document: paymentRequest.customerDocument,
          email: paymentRequest.customerEmail,
          phone: paymentRequest.customerPhone,
        }

        const receipt = generateTextReceipt(response, customerInfo)
        setReceiptText(receipt)
        setShowReceipt(true)

        toast({
          title: "Venda finalizada",
          description: `Pagamento de R$ ${finalTotal.toFixed(2)} realizado com sucesso`,
        })

        // Redirecionar para a página de mesas após 5 segundos
        setTimeout(() => {
          router.push("/")
        }, 5000)
      } else {
        toast({
          title: "Pagamento recusado",
          description: "O pagamento não foi aprovado. Tente novamente.",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Erro no processamento",
        description: error.message || "Erro ao processar pagamento",
        variant: "destructive",
      })
    } finally {
      setProcessingPayment(false)
    }
  }

  const handlePrintReceipt = () => {
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Recibo de Pagamento</title>
            <style>
              body { font-family: monospace; white-space: pre; padding: 20px; }
            </style>
          </head>
          <body>
            ${receiptText.replace(/\n/g, "<br>")}
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const handleDownloadReceipt = () => {
    const element = document.createElement("a")
    const file = new Blob([receiptText], { type: "text/plain" })
    element.href = URL.createObjectURL(file)
    element.download = `recibo_${Date.now()}.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const handleCopyReceipt = () => {
    navigator.clipboard.writeText(receiptText)
    setCopySuccess(true)
    setTimeout(() => setCopySuccess(false), 2000)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Finalizar Pagamento</h1>

      {showReceipt ? (
        <Card>
          <CardHeader>
            <CardTitle>Recibo de Pagamento</CardTitle>
            <CardDescription>Venda finalizada com sucesso</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              ref={receiptRef}
              className="bg-gray-100 p-4 rounded-md font-mono text-sm whitespace-pre-wrap overflow-auto max-h-[400px]"
            >
              {receiptText}
            </div>
            <div className="flex gap-2 mt-4 justify-end">
              <Button variant="outline" size="sm" onClick={handlePrintReceipt}>
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadReceipt}>
                <Download className="h-4 w-4 mr-2" />
                Baixar
              </Button>
              <Button variant="outline" size="sm" onClick={handleCopyReceipt}>
                {copySuccess ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar
                  </>
                )}
              </Button>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={() => router.push("/")}>
              Voltar para o Início
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          {/* Resumo do pedido */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {checkoutTable ? `Mesa ${checkoutTable.tableNumber}` : "Resumo do Pedido"}
              </CardTitle>
              <CardDescription>
                {selectedProducts.length} {selectedProducts.length === 1 ? "item" : "itens"} no pedido
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto max-h-[300px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead className="w-[80px] text-right">Qtd</TableHead>
                      <TableHead className="w-[100px] text-right">Preço</TableHead>
                      <TableHead className="w-[100px] text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell className="text-right">{product.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(product.price)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(product.price * product.quantity)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Desconto:</span>
                  <span>-{formatCurrency(Number.parseFloat(discount) || 0)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>{formatCurrency(finalTotal)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Opções de pagamento */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Opções de Pagamento</CardTitle>
              <CardDescription>Selecione a forma de pagamento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Nome do Cliente</Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Cliente não identificado"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerSelect">Cliente</Label>
                <select
                  id="customerSelect"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={selectedCustomerId}
                  onChange={(e) => {
                    setSelectedCustomerId(e.target.value)
                    if (e.target.value) {
                      const customer = customers.find((c) => c.id === e.target.value)
                      if (customer) {
                        setCustomerName(customer.name)
                      }
                    }
                  }}
                >
                  <option value="">Selecione um cliente (opcional)</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} - {customer.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="discount">Desconto (R$)</Label>
                <Input
                  id="discount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Formas de Pagamento</Label>
                  <p className="text-sm text-muted-foreground mb-2">Selecione uma ou mais formas de pagamento</p>
                </div>

                {/* Pagamento em Dinheiro */}
                <div className="border rounded-md p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="cashPayment"
                        className="w-4 h-4"
                        checked={paymentMethods.some((p) => p.method === "Dinheiro")}
                        onChange={(e) => handlePaymentMethodToggle("Dinheiro", e.target.checked)}
                      />
                      <Label htmlFor="cashPayment" className="font-medium">
                        Dinheiro
                      </Label>
                    </div>
                    {paymentMethods.some((p) => p.method === "Dinheiro") && (
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          className="w-24"
                          value={paymentMethods.find((p) => p.method === "Dinheiro")?.amount || ""}
                          onChange={(e) => handlePaymentMethodAmountChange("Dinheiro", e.target.value)}
                          placeholder="0.00"
                        />
                        <span>R$</span>
                      </div>
                    )}
                  </div>

                  {paymentMethods.some((p) => p.method === "Dinheiro") && (
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="receivedAmount">Valor Recebido:</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            id="receivedAmount"
                            type="number"
                            min="0"
                            step="0.01"
                            className="w-24"
                            value={receivedAmount}
                            onChange={(e) => setReceivedAmount(e.target.value)}
                            placeholder="0.00"
                          />
                          <span>R$</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between bg-muted p-2 rounded-md">
                        <span>Troco:</span>
                        <span className="font-bold">{formatCurrency(Number.parseFloat(changeAmount) || 0)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Pagamento com Cartão de Crédito */}
                <div className="border rounded-md p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="creditCardPayment"
                        className="w-4 h-4"
                        checked={paymentMethods.some((p) => p.method === "Cartão de Crédito")}
                        onChange={(e) => handlePaymentMethodToggle("Cartão de Crédito", e.target.checked)}
                      />
                      <Label htmlFor="creditCardPayment" className="font-medium">
                        Cartão de Crédito
                      </Label>
                    </div>
                    {paymentMethods.some((p) => p.method === "Cartão de Crédito") && (
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          className="w-24"
                          value={paymentMethods.find((p) => p.method === "Cartão de Crédito")?.amount || ""}
                          onChange={(e) => handlePaymentMethodAmountChange("Cartão de Crédito", e.target.value)}
                          placeholder="0.00"
                        />
                        <span>R$</span>
                      </div>
                    )}
                  </div>
                  {paymentMethods.some((p) => p.method === "Cartão de Crédito") && (
                    <div className="mt-2 space-y-2">
                      <Label htmlFor="creditCardNotes">Observações (opcional)</Label>
                      <Textarea
                        id="creditCardNotes"
                        placeholder="Número de autorização, últimos dígitos do cartão, etc."
                        value={manualNotes}
                        onChange={(e) => setManualNotes(e.target.value)}
                        className="h-20"
                      />
                    </div>
                  )}
                </div>

                {/* Pagamento com Cartão de Débito */}
                <div className="border rounded-md p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="debitCardPayment"
                        className="w-4 h-4"
                        checked={paymentMethods.some((p) => p.method === "Cartão de Débito")}
                        onChange={(e) => handlePaymentMethodToggle("Cartão de Débito", e.target.checked)}
                      />
                      <Label htmlFor="debitCardPayment" className="font-medium">
                        Cartão de Débito
                      </Label>
                    </div>
                    {paymentMethods.some((p) => p.method === "Cartão de Débito") && (
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          className="w-24"
                          value={paymentMethods.find((p) => p.method === "Cartão de Débito")?.amount || ""}
                          onChange={(e) => handlePaymentMethodAmountChange("Cartão de Débito", e.target.value)}
                          placeholder="0.00"
                        />
                        <span>R$</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pagamento com PIX */}
                <div className="border rounded-md p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="pixPayment"
                        className="w-4 h-4"
                        checked={paymentMethods.some((p) => p.method === "PIX")}
                        onChange={(e) => handlePaymentMethodToggle("PIX", e.target.checked)}
                      />
                      <Label htmlFor="pixPayment" className="font-medium">
                        PIX
                      </Label>
                    </div>
                    {paymentMethods.some((p) => p.method === "PIX") && (
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          className="w-24"
                          value={paymentMethods.find((p) => p.method === "PIX")?.amount || ""}
                          onChange={(e) => handlePaymentMethodAmountChange("PIX", e.target.value)}
                          placeholder="0.00"
                        />
                        <span>R$</span>
                      </div>
                    )}
                  </div>

                  {/* Na seção de PIX, adicione: */}
                  {paymentMethods.some((p) => p.method === "PIX") && activeConnections.length > 0 && (
                    <div className="mt-2 p-3 bg-gray-100 rounded-md">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          <BanknoteIcon className="h-3 w-3 mr-1" />
                          Via Banco
                        </Badge>
                        <span className="text-sm font-medium">{activeConnections[0].name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        Pagamento processado diretamente via API bancária
                      </p>
                    </div>
                  )}

                  {paymentMethods.some((p) => p.method === "PIX") && (
                    <div className="mt-2 p-3 bg-gray-100 rounded-md text-center">
                      <p className="text-sm mb-2">Escaneie o QR Code ou use a chave abaixo</p>
                      <div className="bg-gray-200 p-4 rounded-md mx-auto w-32 h-32 mb-2 flex items-center justify-center">
                        <span className="text-xs text-gray-500">QR Code PIX</span>
                      </div>
                      <p className="text-xs font-mono bg-gray-50 p-1 rounded">exemplo@chave.pix</p>
                    </div>
                  )}
                  {paymentMethods.some((p) => p.method === "PIX") && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => handleProcessPayment("PIX")}
                      disabled={processingPayment}
                    >
                      {processingPayment ? "Processando..." : "Gerar QR Code PIX"}
                    </Button>
                  )}
                </div>

                {/* Transferência Bancária */}
                <div className="border rounded-md p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="transferPayment"
                        className="w-4 h-4"
                        checked={paymentMethods.some((p) => p.method === "Transferência")}
                        onChange={(e) => handlePaymentMethodToggle("Transferência", e.target.checked)}
                      />
                      <Label htmlFor="transferPayment" className="font-medium">
                        Transferência Bancária
                      </Label>
                    </div>
                    {paymentMethods.some((p) => p.method === "Transferência") && (
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          className="w-24"
                          value={paymentMethods.find((p) => p.method === "Transferência")?.amount || ""}
                          onChange={(e) => handlePaymentMethodAmountChange("Transferência", e.target.value)}
                          placeholder="0.00"
                        />
                        <span>R$</span>
                      </div>
                    )}
                  </div>

                  {paymentMethods.some((p) => p.method === "Transferência") && (
                    <div className="mt-2 p-3 bg-gray-100 rounded-md">
                      <p className="text-sm mb-2">Dados bancários para transferência:</p>
                      <div className="space-y-1 text-sm">
                        <p>
                          <strong>Banco:</strong> Banco do Brasil
                        </p>
                        <p>
                          <strong>Agência:</strong> 0001
                        </p>
                        <p>
                          <strong>Conta:</strong> 12345-6
                        </p>
                        <p>
                          <strong>Tipo:</strong> Corrente
                        </p>
                        <p>
                          <strong>Nome:</strong> Minha Empresa
                        </p>
                        <p>
                          <strong>CNPJ:</strong> 00.000.000/0001-00
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Pagamento Manual */}
                <div className="border rounded-md p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="manualPayment"
                        className="w-4 h-4"
                        checked={paymentMethods.some((p) => p.method === "Manual")}
                        onChange={(e) => handlePaymentMethodToggle("Manual", e.target.checked)}
                      />
                      <Label htmlFor="manualPayment" className="font-medium">
                        Outro / Manual
                      </Label>
                    </div>
                    {paymentMethods.some((p) => p.method === "Manual") && (
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          className="w-24"
                          value={paymentMethods.find((p) => p.method === "Manual")?.amount || ""}
                          onChange={(e) => handlePaymentMethodAmountChange("Manual", e.target.value)}
                          placeholder="0.00"
                        />
                        <span>R$</span>
                      </div>
                    )}
                  </div>

                  {paymentMethods.some((p) => p.method === "Manual") && (
                    <div className="mt-2 space-y-2">
                      <Label htmlFor="manualNotes">Observações</Label>
                      <Textarea
                        id="manualNotes"
                        placeholder="Descreva o método de pagamento utilizado"
                        value={manualNotes}
                        onChange={(e) => setManualNotes(e.target.value)}
                        className="h-20"
                      />
                    </div>
                  )}
                </div>

                {/* Resumo do pagamento */}
                <div className="bg-muted p-3 rounded-md space-y-2">
                  <div className="flex justify-between">
                    <span>Total a pagar:</span>
                    <span className="font-bold">{formatCurrency(finalTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total informado:</span>
                    <span
                      className={`font-medium ${totalPaid < finalTotal ? "text-red-500" : totalPaid > finalTotal ? "text-green-500" : ""}`}
                    >
                      {formatCurrency(totalPaid)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Diferença:</span>
                    <span
                      className={`font-bold ${remainingAmount > 0 ? "text-red-500" : remainingAmount < 0 ? "text-green-500" : ""}`}
                    >
                      {formatCurrency(Math.abs(remainingAmount))}{" "}
                      {remainingAmount > 0 ? "(faltando)" : remainingAmount < 0 ? "(sobra)" : ""}
                    </span>
                  </div>
                </div>
              </div>
              {paymentResponse && (
                <div className="mt-4 p-4 border rounded-md">
                  <h3 className="font-medium mb-2">Resposta do Pagamento</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant={paymentResponse.status === "approved" ? "success" : "destructive"}>
                        {paymentResponse.status === "approved" ? "Aprovado" : "Recusado"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Valor:</span>
                      <span>{formatCurrency(paymentResponse.amount)}</span>
                    </div>
                    {paymentResponse.authorizationCode && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Código de Autorização:</span>
                        <span>{paymentResponse.authorizationCode}</span>
                      </div>
                    )}
                    {paymentResponse.transactionId && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">ID da Transação:</span>
                        <span>{paymentResponse.transactionId}</span>
                      </div>
                    )}
                    {paymentResponse.qrCodeUrl && (
                      <div className="mt-2 flex flex-col items-center">
                        <img
                          src={paymentResponse.qrCodeUrl || "/placeholder.svg"}
                          alt="QR Code PIX"
                          className="w-48 h-48"
                        />
                        <p className="text-xs text-center mt-1">Escaneie o QR Code para pagar</p>
                      </div>
                    )}
                    {paymentResponse.bankSlipUrl && (
                      <div className="mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => window.open(paymentResponse.bankSlipUrl, "_blank")}
                        >
                          Abrir Boleto
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button className="w-full" onClick={handleCompleteSale}>
                Finalizar Pagamento
              </Button>
              <Button variant="outline" className="w-full" onClick={() => router.push("/")}>
                Cancelar
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  )
}


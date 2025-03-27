"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { addTransaction } from "@/lib/data-utils"
import { useRouter } from "next/navigation"

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
    }

    // Adicionar transação
    addTransaction(transaction)

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

    toast({
      title: "Venda finalizada",
      description: `Pagamento de R$ ${finalTotal.toFixed(2)} realizado com sucesso`,
    })

    // Redirecionar para a página de mesas
    router.push("/")
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

                {paymentMethods.some((p) => p.method === "PIX") && (
                  <div className="mt-2 p-3 bg-gray-100 rounded-md text-center">
                    <p className="text-sm mb-2">Escaneie o QR Code ou use a chave abaixo</p>
                    <div className="bg-gray-200 p-4 rounded-md mx-auto w-32 h-32 mb-2 flex items-center justify-center">
                      <span className="text-xs text-gray-500">QR Code PIX</span>
                    </div>
                    <p className="text-xs font-mono bg-gray-50 p-1 rounded">exemplo@chave.pix</p>
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
    </div>
  )
}


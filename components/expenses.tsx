"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
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
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, PlusCircle, Search, FileText, AlertCircle } from "lucide-react"

// Tipos
type ExpenseCategory = {
  id: string
  name: string
  color: string
}

type Expense = {
  id: string
  description: string
  amount: number
  dueDate: string
  category: string
  status: "pending" | "paid"
  paymentDate?: string
  notes?: string
  recurrent?: boolean
  recurrenceInterval?: "monthly" | "biweekly" | "weekly"
  createdAt: string
}

// Categorias padrão
const defaultCategories: ExpenseCategory[] = [
  { id: "utilities", name: "Serviços Públicos", color: "bg-blue-500" },
  { id: "rent", name: "Aluguel", color: "bg-red-500" },
  { id: "supplies", name: "Suprimentos", color: "bg-green-500" },
  { id: "salaries", name: "Salários", color: "bg-purple-500" },
  { id: "maintenance", name: "Manutenção", color: "bg-yellow-500" },
  { id: "taxes", name: "Impostos", color: "bg-orange-500" },
  { id: "marketing", name: "Marketing", color: "bg-pink-500" },
  { id: "other", name: "Outros", color: "bg-gray-500" },
]

export default function Expenses() {
  const { toast } = useToast()

  // Estados
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<ExpenseCategory[]>(defaultCategories)
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "paid">("all")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [filterPeriod, setFilterPeriod] = useState<"all" | "thisMonth" | "nextMonth" | "overdue">("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([])

  // Estado para nova despesa
  const [newExpense, setNewExpense] = useState<Omit<Expense, "id" | "createdAt">>({
    description: "",
    amount: 0,
    dueDate: new Date().toISOString(),
    category: "other",
    status: "pending",
    notes: "",
    recurrent: false,
  })

  // Estado para edição
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Estado para nova categoria
  const [newCategory, setNewCategory] = useState<Omit<ExpenseCategory, "id">>({
    name: "",
    color: "bg-gray-500",
  })

  // Carregar dados do localStorage
  useEffect(() => {
    const storedExpenses = JSON.parse(localStorage.getItem("expenses") || "[]")
    const storedCategories = JSON.parse(localStorage.getItem("expenseCategories") || "[]")

    if (storedExpenses.length > 0) {
      setExpenses(storedExpenses)
    }

    if (storedCategories.length > 0) {
      setCategories(storedCategories)
    } else {
      // Se não houver categorias salvas, usar as padrão e salvá-las
      localStorage.setItem("expenseCategories", JSON.stringify(defaultCategories))
    }
  }, [])

  // Filtrar despesas
  useEffect(() => {
    let filtered = [...expenses]

    // Filtrar por status
    if (filterStatus !== "all") {
      filtered = filtered.filter((expense) => expense.status === filterStatus)
    }

    // Filtrar por categoria
    if (filterCategory !== "all") {
      filtered = filtered.filter((expense) => expense.category === filterCategory)
    }

    // Filtrar por período
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    const nextMonthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1)
    const nextMonthEnd = new Date(today.getFullYear(), today.getMonth() + 2, 0)

    if (filterPeriod === "thisMonth") {
      filtered = filtered.filter((expense) => {
        const dueDate = new Date(expense.dueDate)
        return dueDate >= thisMonthStart && dueDate < nextMonthStart
      })
    } else if (filterPeriod === "nextMonth") {
      filtered = filtered.filter((expense) => {
        const dueDate = new Date(expense.dueDate)
        return dueDate >= nextMonthStart && dueDate <= nextMonthEnd
      })
    } else if (filterPeriod === "overdue") {
      filtered = filtered.filter((expense) => {
        const dueDate = new Date(expense.dueDate)
        return dueDate < today && expense.status === "pending"
      })
    }

    // Filtrar por termo de busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (expense) => expense.description.toLowerCase().includes(term) || expense.notes?.toLowerCase().includes(term),
      )
    }

    // Ordenar por data de vencimento
    filtered.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())

    setFilteredExpenses(filtered)
  }, [expenses, filterStatus, filterCategory, filterPeriod, searchTerm])

  // Salvar despesas no localStorage
  const saveExpenses = (updatedExpenses: Expense[]) => {
    localStorage.setItem("expenses", JSON.stringify(updatedExpenses))
    setExpenses(updatedExpenses)
  }

  // Salvar categorias no localStorage
  const saveCategories = (updatedCategories: ExpenseCategory[]) => {
    localStorage.setItem("expenseCategories", JSON.stringify(updatedCategories))
    setCategories(updatedCategories)
  }

  // Manipular mudanças no formulário de nova despesa
  const handleExpenseChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setNewExpense((prev) => ({
      ...prev,
      [name]: name === "amount" ? Number.parseFloat(value) || 0 : value,
    }))
  }

  // Manipular mudança de data
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setNewExpense((prev) => ({
        ...prev,
        dueDate: date.toISOString(),
      }))
    }
  }

  // Manipular mudança de recorrência
  const handleRecurrentChange = (checked: boolean) => {
    setNewExpense((prev) => ({
      ...prev,
      recurrent: checked,
      recurrenceInterval: checked ? prev.recurrenceInterval || "monthly" : undefined,
    }))
  }

  // Manipular mudança de intervalo de recorrência
  const handleRecurrenceIntervalChange = (value: string) => {
    setNewExpense((prev) => ({
      ...prev,
      recurrenceInterval: value as "monthly" | "biweekly" | "weekly",
    }))
  }

  // Adicionar ou atualizar despesa
  const handleSaveExpense = () => {
    // Validar campos obrigatórios
    if (!newExpense.description || newExpense.amount <= 0 || !newExpense.dueDate) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios corretamente",
        variant: "destructive",
      })
      return
    }

    if (isEditing && editingId) {
      // Atualizar despesa existente
      const updatedExpenses = expenses.map((expense) =>
        expense.id === editingId
          ? {
              ...expense,
              description: newExpense.description,
              amount: newExpense.amount,
              dueDate: newExpense.dueDate,
              category: newExpense.category,
              notes: newExpense.notes,
              recurrent: newExpense.recurrent,
              recurrenceInterval: newExpense.recurrenceInterval,
            }
          : expense,
      )

      saveExpenses(updatedExpenses)
      toast({
        title: "Despesa atualizada",
        description: "A despesa foi atualizada com sucesso",
      })
    } else {
      // Adicionar nova despesa
      const newExpenseItem: Expense = {
        id: Date.now().toString(),
        description: newExpense.description,
        amount: newExpense.amount,
        dueDate: newExpense.dueDate,
        category: newExpense.category,
        status: "pending",
        notes: newExpense.notes,
        recurrent: newExpense.recurrent,
        recurrenceInterval: newExpense.recurrenceInterval,
        createdAt: new Date().toISOString(),
      }

      const updatedExpenses = [...expenses, newExpenseItem]
      saveExpenses(updatedExpenses)
      toast({
        title: "Despesa adicionada",
        description: "A despesa foi adicionada com sucesso",
      })
    }

    // Resetar formulário
    resetExpenseForm()
  }

  // Editar despesa
  const handleEditExpense = (expense: Expense) => {
    setIsEditing(true)
    setEditingId(expense.id)
    setNewExpense({
      description: expense.description,
      amount: expense.amount,
      dueDate: expense.dueDate,
      category: expense.category,
      status: expense.status,
      notes: expense.notes || "",
      recurrent: expense.recurrent || false,
      recurrenceInterval: expense.recurrenceInterval,
    })
  }

  // Excluir despesa
  const handleDeleteExpense = (id: string) => {
    const updatedExpenses = expenses.filter((expense) => expense.id !== id)
    saveExpenses(updatedExpenses)
    toast({
      title: "Despesa excluída",
      description: "A despesa foi excluída com sucesso",
    })
  }

  // Marcar despesa como paga
  const handleMarkAsPaid = (id: string) => {
    const updatedExpenses = expenses.map((expense) =>
      expense.id === id
        ? {
            ...expense,
            status: "paid",
            paymentDate: new Date().toISOString(),
          }
        : expense,
    )

    saveExpenses(updatedExpenses)
    toast({
      title: "Despesa paga",
      description: "A despesa foi marcada como paga",
    })
  }

  // Adicionar nova categoria
  const handleAddCategory = () => {
    if (!newCategory.name) {
      toast({
        title: "Erro",
        description: "Informe um nome para a categoria",
        variant: "destructive",
      })
      return
    }

    const newCategoryItem: ExpenseCategory = {
      id: newCategory.name.toLowerCase().replace(/\s+/g, "-"),
      name: newCategory.name,
      color: newCategory.color,
    }

    const updatedCategories = [...categories, newCategoryItem]
    saveCategories(updatedCategories)

    setNewCategory({
      name: "",
      color: "bg-gray-500",
    })

    toast({
      title: "Categoria adicionada",
      description: "A categoria foi adicionada com sucesso",
    })
  }

  // Resetar formulário de despesa
  const resetExpenseForm = () => {
    setNewExpense({
      description: "",
      amount: 0,
      dueDate: new Date().toISOString(),
      category: "other",
      status: "pending",
      notes: "",
      recurrent: false,
    })
    setIsEditing(false)
    setEditingId(null)
  }

  // Gerar relatório
  const handleGenerateReport = () => {
    // Criar um relatório simples em formato de texto
    let reportContent = `RELATÓRIO DE DESPESAS - ${format(new Date(), "dd/MM/yyyy")}\n\n`

    // Resumo
    const totalPending = expenses
      .filter((expense) => expense.status === "pending")
      .reduce((sum, expense) => sum + expense.amount, 0)

    const totalPaid = expenses
      .filter((expense) => expense.status === "paid")
      .reduce((sum, expense) => sum + expense.amount, 0)

    reportContent += `RESUMO:\n`
    reportContent += `Total de despesas pendentes: R$ ${totalPending.toFixed(2)}\n`
    reportContent += `Total de despesas pagas: R$ ${totalPaid.toFixed(2)}\n`
    reportContent += `Total geral: R$ ${(totalPending + totalPaid).toFixed(2)}\n\n`

    // Despesas por categoria
    reportContent += `DESPESAS POR CATEGORIA:\n`
    categories.forEach((category) => {
      const categoryExpenses = expenses.filter((expense) => expense.category === category.id)
      const categoryTotal = categoryExpenses.reduce((sum, expense) => sum + expense.amount, 0)

      if (categoryExpenses.length > 0) {
        reportContent += `${category.name}: R$ ${categoryTotal.toFixed(2)}\n`
      }
    })

    reportContent += `\nDESPESAS PENDENTES:\n`
    expenses
      .filter((expense) => expense.status === "pending")
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .forEach((expense) => {
        const category = categories.find((c) => c.id === expense.category)
        reportContent += `- ${expense.description} (${category?.name || "Sem categoria"}): R$ ${expense.amount.toFixed(2)} - Vencimento: ${format(new Date(expense.dueDate), "dd/MM/yyyy")}\n`
      })

    // Abrir uma nova janela com o relatório
    const reportWindow = window.open("", "_blank")
    if (reportWindow) {
      reportWindow.document.write(`
        <html>
          <head>
            <title>Relatório de Despesas</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.5; }
              h1 { color: #333; }
              pre { background-color: #f5f5f5; padding: 15px; border-radius: 5px; white-space: pre-wrap; }
              .print-btn { background-color: #4CAF50; color: white; padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer; margin-bottom: 20px; }
            </style>
          </head>
          <body>
            <h1>Relatório de Despesas</h1>
            <button class="print-btn" onclick="window.print()">Imprimir Relatório</button>
            <pre>${reportContent}</pre>
          </body>
        </html>
      `)
      reportWindow.document.close()
    }
  }

  // Obter nome da categoria
  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId)
    return category ? category.name : "Sem categoria"
  }

  // Obter cor da categoria
  const getCategoryColor = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId)
    return category ? category.color : "bg-gray-500"
  }

  // Calcular totais
  const totalPending = filteredExpenses
    .filter((expense) => expense.status === "pending")
    .reduce((sum, expense) => sum + expense.amount, 0)

  const totalPaid = filteredExpenses
    .filter((expense) => expense.status === "paid")
    .reduce((sum, expense) => sum + expense.amount, 0)

  // Verificar despesas vencidas
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const overdueCount = expenses.filter(
    (expense) => expense.status === "pending" && new Date(expense.dueDate) < today,
  ).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Contas e Despesas</h2>
          <p className="text-muted-foreground">Gerencie suas contas a pagar e despesas</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <Button
            onClick={handleGenerateReport}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
          >
            <FileText className="h-4 w-4" />
            Gerar Relatório
          </Button>
          {overdueCount > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {overdueCount} vencida{overdueCount > 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      </div>

      <Tabs defaultValue="expenses" className="w-full">
        <TabsList className="w-full grid grid-cols-2 h-auto py-1 mb-2">
          <TabsTrigger value="expenses" className="text-xs sm:text-sm py-1 px-2 h-auto">
            Despesas
          </TabsTrigger>
          <TabsTrigger value="categories" className="text-xs sm:text-sm py-1 px-2 h-auto">
            Categorias
          </TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="mt-0 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{isEditing ? "Editar Despesa" : "Nova Despesa"}</CardTitle>
              <CardDescription>
                {isEditing ? "Atualize as informações da despesa" : "Preencha os dados para adicionar uma nova despesa"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição *</Label>
                  <Input
                    id="description"
                    name="description"
                    value={newExpense.description}
                    onChange={handleExpenseChange}
                    placeholder="Ex: Conta de luz"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Valor (R$) *</Label>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={newExpense.amount || ""}
                    onChange={handleExpenseChange}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueDate">Data de Vencimento *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newExpense.dueDate
                          ? format(new Date(newExpense.dueDate), "dd/MM/yyyy", { locale: ptBR })
                          : "Selecione uma data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={newExpense.dueDate ? new Date(newExpense.dueDate) : undefined}
                        onSelect={handleDateChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Categoria *</Label>
                  <Select
                    value={newExpense.category}
                    onValueChange={(value) => setNewExpense((prev) => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${category.color}`}></div>
                            <span>{category.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={newExpense.notes || ""}
                    onChange={handleExpenseChange}
                    placeholder="Observações adicionais"
                    rows={3}
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="recurrent"
                      checked={newExpense.recurrent || false}
                      onChange={(e) => handleRecurrentChange(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="recurrent" className="cursor-pointer">
                      Despesa recorrente
                    </Label>
                  </div>

                  {newExpense.recurrent && (
                    <div className="mt-2">
                      <Label htmlFor="recurrenceInterval">Intervalo de Recorrência</Label>
                      <Select
                        value={newExpense.recurrenceInterval || "monthly"}
                        onValueChange={handleRecurrenceIntervalChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o intervalo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Mensal</SelectItem>
                          <SelectItem value="biweekly">Quinzenal</SelectItem>
                          <SelectItem value="weekly">Semanal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end mt-4 space-x-2">
                {isEditing && (
                  <Button variant="outline" onClick={resetExpenseForm} className="border-gray-300 hover:bg-gray-100">
                    Cancelar
                  </Button>
                )}
                <Button onClick={handleSaveExpense} className="bg-blue-600 hover:bg-blue-700 text-white">
                  {isEditing ? "Atualizar Despesa" : "Adicionar Despesa"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <CardTitle>Lista de Despesas</CardTitle>
                  <CardDescription>
                    Total pendente:{" "}
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalPending)} |
                    Total pago:{" "}
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalPaid)}
                  </CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <div className="relative w-full sm:w-auto">
                    <Input
                      placeholder="Buscar despesas..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full sm:w-[200px] pl-8"
                    />
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  </div>
                  <Select
                    value={filterStatus}
                    onValueChange={(value: "all" | "pending" | "paid") => setFilterStatus(value)}
                  >
                    <SelectTrigger className="w-full sm:w-[130px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="pending">Pendentes</SelectItem>
                      <SelectItem value="paid">Pagas</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-full sm:w-[150px]">
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={filterPeriod}
                    onValueChange={(value: "all" | "thisMonth" | "nextMonth" | "overdue") => setFilterPeriod(value)}
                  >
                    <SelectTrigger className="w-full sm:w-[150px]">
                      <SelectValue placeholder="Período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="thisMonth">Este mês</SelectItem>
                      <SelectItem value="nextMonth">Próximo mês</SelectItem>
                      <SelectItem value="overdue">Vencidas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredExpenses.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">Nenhuma despesa encontrada</p>
              ) : (
                <div className="overflow-x-auto w-full bottom-spacing">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredExpenses.map((expense) => {
                        const dueDate = new Date(expense.dueDate)
                        const isOverdue = dueDate < today && expense.status === "pending"

                        return (
                          <TableRow key={expense.id}>
                            <TableCell className="font-medium">
                              <div className="flex flex-col">
                                {expense.description}
                                {expense.recurrent && (
                                  <span className="text-xs text-muted-foreground">
                                    Recorrente (
                                    {expense.recurrenceInterval === "monthly"
                                      ? "Mensal"
                                      : expense.recurrenceInterval === "biweekly"
                                        ? "Quinzenal"
                                        : expense.recurrenceInterval === "weekly"
                                          ? "Semanal"
                                          : ""}
                                    )
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${getCategoryColor(expense.category)}`}></div>
                                <span>{getCategoryName(expense.category)}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className={isOverdue ? "text-red-500 font-medium" : ""}>
                                {format(dueDate, "dd/MM/yyyy")}
                              </span>
                            </TableCell>
                            <TableCell>
                              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                                expense.amount,
                              )}
                            </TableCell>
                            <TableCell>
                              {expense.status === "pending" ? (
                                <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
                                  Pendente
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
                                  Pago
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                {expense.status === "pending" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-2 text-xs bg-green-500 hover:bg-green-600 text-white"
                                    onClick={() => handleMarkAsPaid(expense.id)}
                                  >
                                    Pagar
                                  </Button>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2 text-xs border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                                  onClick={() => handleEditExpense(expense)}
                                >
                                  Editar
                                </Button>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      className="h-7 px-2 text-xs bg-red-500 hover:bg-red-600 text-white"
                                    >
                                      Excluir
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-[90vw] sm:max-w-md">
                                    <DialogHeader>
                                      <DialogTitle>Confirmar exclusão</DialogTitle>
                                      <DialogDescription>
                                        Tem certeza que deseja excluir esta despesa? Esta ação não pode ser desfeita.
                                      </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter>
                                      <Button variant="destructive" onClick={() => handleDeleteExpense(expense.id)}>
                                        Excluir
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Nova Categoria</CardTitle>
              <CardDescription>Adicione categorias para organizar suas despesas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="categoryName">Nome da Categoria *</Label>
                  <Input
                    id="categoryName"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Fornecedores"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="categoryColor">Cor</Label>
                  <Select
                    value={newCategory.color}
                    onValueChange={(value) => setNewCategory((prev) => ({ ...prev, color: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma cor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bg-red-500">Vermelho</SelectItem>
                      <SelectItem value="bg-blue-500">Azul</SelectItem>
                      <SelectItem value="bg-green-500">Verde</SelectItem>
                      <SelectItem value="bg-yellow-500">Amarelo</SelectItem>
                      <SelectItem value="bg-purple-500">Roxo</SelectItem>
                      <SelectItem value="bg-pink-500">Rosa</SelectItem>
                      <SelectItem value="bg-orange-500">Laranja</SelectItem>
                      <SelectItem value="bg-gray-500">Cinza</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end mt-4">
                <Button
                  onClick={handleAddCategory}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <PlusCircle className="h-4 w-4" />
                  Adicionar Categoria
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Categorias Cadastradas</CardTitle>
              <CardDescription>Total de categorias: {categories.length}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {categories.map((category) => (
                  <div key={category.id} className="border rounded-md p-4 flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full ${category.color}`}></div>
                    <div className="flex-1">
                      <p className="font-medium">{category.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {expenses.filter((e) => e.category === category.id).length} despesas
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}


"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Users, UserPlus, Search, Award, Gift, User, FileText, Edit } from "lucide-react"
import { useLoyalty, type Customer, type LoyaltyTransaction } from "@/lib/loyalty-service"

export default function CustomerManagement() {
  const { toast } = useToast()
  const { customers, program, transactions, upsertCustomer, redeem, calculateRedemptionValue } = useLoyalty()

  const [searchTerm, setSearchTerm] = useState("")
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerTransactions, setCustomerTransactions] = useState<LoyaltyTransaction[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [isRedeemDialogOpen, setIsRedeemDialogOpen] = useState(false)
  const [redeemPoints, setRedeemPoints] = useState<string>("")
  const [redeemDescription, setRedeemDescription] = useState<string>("")

  // Formulário de cliente
  const [formData, setFormData] = useState<Partial<Customer>>({
    name: "",
    email: "",
    phone: "",
    document: "",
    birthDate: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    notes: "",
    tags: [],
    status: "active",
  })

  // Filtrar clientes quando o termo de busca mudar
  useEffect(() => {
    if (!searchTerm) {
      setFilteredCustomers(customers)
      return
    }

    const term = searchTerm.toLowerCase()
    const filtered = customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(term) ||
        customer.email.toLowerCase().includes(term) ||
        customer.phone.includes(term) ||
        (customer.document && customer.document.includes(term)),
    )

    setFilteredCustomers(filtered)
  }, [searchTerm, customers])

  // Carregar transações do cliente selecionado
  useEffect(() => {
    if (!selectedCustomer) {
      setCustomerTransactions([])
      return
    }

    const customerTx = transactions.filter((tx) => tx.customerId === selectedCustomer.id)
    setCustomerTransactions(customerTx)
  }, [selectedCustomer, transactions])

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    setFormData(customer)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleStatusChange = (status: boolean) => {
    setFormData((prev) => ({ ...prev, status: status ? "active" : "inactive" }))
  }

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tagsString = e.target.value
    const tagsArray = tagsString
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag)
    setFormData((prev) => ({ ...prev, tags: tagsArray }))
  }

  const handleSaveCustomer = () => {
    if (!formData.name || !formData.email || !formData.phone) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome, e-mail e telefone são obrigatórios",
        variant: "destructive",
      })
      return
    }

    try {
      const savedCustomer = upsertCustomer({
        ...formData,
        id: isEditing ? selectedCustomer!.id : undefined,
        points: isEditing ? selectedCustomer!.points : 0,
        totalSpent: isEditing ? selectedCustomer!.totalSpent : 0,
        purchaseCount: isEditing ? selectedCustomer!.purchaseCount : 0,
        createdAt: isEditing ? selectedCustomer!.createdAt : undefined,
        updatedAt: new Date().toISOString(),
      } as Customer)

      setSelectedCustomer(savedCustomer)
      setIsEditing(false)

      toast({
        title: isEditing ? "Cliente atualizado" : "Cliente adicionado",
        description: `${savedCustomer.name} foi ${isEditing ? "atualizado" : "adicionado"} com sucesso`,
      })
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar cliente",
        variant: "destructive",
      })
    }
  }

  const handleNewCustomer = () => {
    setSelectedCustomer(null)
    setIsEditing(true)
    setFormData({
      name: "",
      email: "",
      phone: "",
      document: "",
      birthDate: "",
      address: "",
      city: "",
      state: "",
      postalCode: "",
      notes: "",
      tags: [],
      status: "active",
    })
  }

  const handleEditCustomer = () => {
    if (!selectedCustomer) return
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    if (selectedCustomer) {
      setFormData(selectedCustomer)
    } else {
      setFormData({
        name: "",
        email: "",
        phone: "",
        document: "",
        birthDate: "",
        address: "",
        city: "",
        state: "",
        postalCode: "",
        notes: "",
        tags: [],
        status: "active",
      })
    }
    setIsEditing(false)
  }

  const handleOpenRedeemDialog = () => {
    if (!selectedCustomer) return
    setRedeemPoints("")
    setRedeemDescription("")
    setIsRedeemDialogOpen(true)
  }

  const handleRedeemPoints = () => {
    if (!selectedCustomer) return

    const points = Number.parseInt(redeemPoints, 10)
    if (isNaN(points) || points <= 0) {
      toast({
        title: "Pontos inválidos",
        description: "Informe um valor válido de pontos para resgate",
        variant: "destructive",
      })
      return
    }

    if (points > selectedCustomer.points) {
      toast({
        title: "Pontos insuficientes",
        description: `O cliente possui apenas ${selectedCustomer.points} pontos`,
        variant: "destructive",
      })
      return
    }

    try {
      redeem(selectedCustomer.id, points, redeemDescription || "Resgate de pontos")

      toast({
        title: "Pontos resgatados",
        description: `${points} pontos foram resgatados com sucesso`,
      })

      setIsRedeemDialogOpen(false)
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao resgatar pontos",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gerenciamento de Clientes
          </CardTitle>
          <CardDescription>Cadastre e gerencie seus clientes e o programa de fidelidade</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar clientes..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={handleNewCustomer}>
              <UserPlus className="mr-2 h-4 w-4" />
              Novo Cliente
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1 border rounded-md overflow-hidden">
              <div className="bg-muted p-2 font-medium">Clientes ({filteredCustomers.length})</div>
              <div className="h-[400px] overflow-y-auto">
                {filteredCustomers.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    {searchTerm ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredCustomers.map((customer) => (
                      <div
                        key={customer.id}
                        className={`p-3 cursor-pointer hover:bg-muted/50 ${selectedCustomer?.id === customer.id ? "bg-muted" : ""}`}
                        onClick={() => handleSelectCustomer(customer)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{customer.name}</div>
                            <div className="text-sm text-muted-foreground">{customer.email}</div>
                            <div className="text-sm">{customer.phone}</div>
                          </div>
                          <Badge variant={customer.status === "active" ? "default" : "secondary"}>
                            {customer.status === "active" ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                        {program.enabled && (
                          <div className="mt-2 flex items-center gap-2 text-sm">
                            <Award className="h-4 w-4 text-amber-500" />
                            <span>{customer.points} pontos</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-2">
              {selectedCustomer || isEditing ? (
                <Tabs defaultValue="details">
                  <TabsList className="w-full">
                    <TabsTrigger value="details">Detalhes</TabsTrigger>
                    {program.enabled && selectedCustomer && <TabsTrigger value="loyalty">Fidelidade</TabsTrigger>}
                  </TabsList>

                  <TabsContent value="details" className="space-y-4 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome*</Label>
                        <Input
                          id="name"
                          name="name"
                          value={formData.name || ""}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">E-mail*</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email || ""}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefone*</Label>
                        <Input
                          id="phone"
                          name="phone"
                          value={formData.phone || ""}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="document">Documento (CPF/CNPJ)</Label>
                        <Input
                          id="document"
                          name="document"
                          value={formData.document || ""}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="birthDate">Data de Nascimento</Label>
                        <Input
                          id="birthDate"
                          name="birthDate"
                          type="date"
                          value={formData.birthDate || ""}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="status"
                            checked={formData.status === "active"}
                            onCheckedChange={handleStatusChange}
                            disabled={!isEditing}
                          />
                          <Label htmlFor="status">{formData.status === "active" ? "Ativo" : "Inativo"}</Label>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="address">Endereço</Label>
                        <Input
                          id="address"
                          name="address"
                          value={formData.address || ""}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-2">
                          <Label htmlFor="city">Cidade</Label>
                          <Input
                            id="city"
                            name="city"
                            value={formData.city || ""}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="state">Estado</Label>
                          <Input
                            id="state"
                            name="state"
                            value={formData.state || ""}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="postalCode">CEP</Label>
                          <Input
                            id="postalCode"
                            name="postalCode"
                            value={formData.postalCode || ""}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                          />
                        </div>
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
                        <Input
                          id="tags"
                          name="tags"
                          value={(formData.tags || []).join(", ")}
                          onChange={handleTagsChange}
                          disabled={!isEditing}
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="notes">Observações</Label>
                        <Textarea
                          id="notes"
                          name="notes"
                          value={formData.notes || ""}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          rows={3}
                        />
                      </div>
                    </div>

                    {selectedCustomer && !isEditing && (
                      <div className="rounded-md border p-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-500" />
                          <span className="font-medium">Informações adicionais</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Cliente desde:</span>
                            <p>{formatDate(selectedCustomer.createdAt)}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Última atualização:</span>
                            <p>{formatDate(selectedCustomer.updatedAt)}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Total gasto:</span>
                            <p>R$ {selectedCustomer.totalSpent.toFixed(2)}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Número de compras:</span>
                            <p>{selectedCustomer.purchaseCount}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Última compra:</span>
                            <p>{formatDate(selectedCustomer.lastPurchaseDate)}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end space-x-2">
                      {isEditing ? (
                        <>
                          <Button variant="outline" onClick={handleCancelEdit}>
                            Cancelar
                          </Button>
                          <Button onClick={handleSaveCustomer}>
                            {selectedCustomer ? "Atualizar Cliente" : "Adicionar Cliente"}
                          </Button>
                        </>
                      ) : (
                        selectedCustomer && (
                          <Button onClick={handleEditCustomer}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar Cliente
                          </Button>
                        )
                      )}
                    </div>
                  </TabsContent>

                  {program.enabled && selectedCustomer && (
                    <TabsContent value="loyalty" className="space-y-4 pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                          <CardContent className="pt-6">
                            <div className="flex flex-col items-center">
                              <Award className="h-8 w-8 text-amber-500 mb-2" />
                              <div className="text-2xl font-bold">{selectedCustomer.points}</div>
                              <div className="text-sm text-muted-foreground">Pontos disponíveis</div>

                              {selectedCustomer.points > 0 && (
                                <div className="mt-2 text-sm text-center">
                                  Equivalente a R$ {calculateRedemptionValue(selectedCustomer.points).toFixed(2)} em
                                  compras
                                </div>
                              )}

                              <Button
                                className="mt-4 w-full"
                                onClick={handleOpenRedeemDialog}
                                disabled={selectedCustomer.points < program.minimumRedemption}
                              >
                                <Gift className="mr-2 h-4 w-4" />
                                Resgatar Pontos
                              </Button>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="md:col-span-2">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base">Histórico de Pontos</CardTitle>
                          </CardHeader>
                          <CardContent>
                            {customerTransactions.length === 0 ? (
                              <div className="text-center py-4 text-muted-foreground">Nenhuma transação de pontos</div>
                            ) : (
                              <div className="max-h-[300px] overflow-y-auto">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Data</TableHead>
                                      <TableHead>Tipo</TableHead>
                                      <TableHead>Pontos</TableHead>
                                      <TableHead>Descrição</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {customerTransactions.map((tx) => (
                                      <TableRow key={tx.id}>
                                        <TableCell>{formatDate(tx.createdAt)}</TableCell>
                                        <TableCell>
                                          <Badge
                                            variant={
                                              tx.type === "earn"
                                                ? "default"
                                                : tx.type === "redeem"
                                                  ? "destructive"
                                                  : "secondary"
                                            }
                                          >
                                            {tx.type === "earn"
                                              ? "Ganho"
                                              : tx.type === "redeem"
                                                ? "Resgate"
                                                : tx.type === "expire"
                                                  ? "Expirado"
                                                  : "Ajuste"}
                                          </Badge>
                                        </TableCell>
                                        <TableCell
                                          className={
                                            tx.type === "earn" || tx.type === "adjust"
                                              ? "text-green-600"
                                              : "text-red-600"
                                          }
                                        >
                                          {tx.type === "earn" || tx.type === "adjust" ? "+" : "-"}
                                          {tx.points}
                                        </TableCell>
                                        <TableCell>{tx.description}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>
                  )}
                </Tabs>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center border rounded-md">
                  <User className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">Nenhum cliente selecionado</h3>
                  <p className="text-muted-foreground mt-2">
                    Selecione um cliente da lista ou adicione um novo cliente
                  </p>
                  <Button className="mt-4" onClick={handleNewCustomer}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Novo Cliente
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isRedeemDialogOpen} onOpenChange={setIsRedeemDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resgatar Pontos</DialogTitle>
            <DialogDescription>
              {selectedCustomer?.name} possui {selectedCustomer?.points} pontos disponíveis.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="redeemPoints">Pontos a resgatar</Label>
              <Input
                id="redeemPoints"
                type="number"
                min={program.minimumRedemption}
                max={selectedCustomer?.points}
                value={redeemPoints}
                onChange={(e) => setRedeemPoints(e.target.value)}
              />
              {redeemPoints && !isNaN(Number.parseInt(redeemPoints, 10)) && (
                <p className="text-sm text-muted-foreground">
                  Equivalente a R$ {calculateRedemptionValue(Number.parseInt(redeemPoints, 10)).toFixed(2)} em compras
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="redeemDescription">Descrição</Label>
              <Input
                id="redeemDescription"
                value={redeemDescription}
                onChange={(e) => setRedeemDescription(e.target.value)}
                placeholder="Resgate de pontos"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRedeemDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleRedeemPoints}>Confirmar Resgate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


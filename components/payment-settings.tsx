"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import {
  CreditCard,
  QrCode,
  Receipt,
  AlertCircle,
  BanknoteIcon,
  ArrowDownUp,
  Settings2,
  Link2OffIcon as LinkOff,
  Check,
} from "lucide-react"
import {
  getPaymentGateways,
  savePaymentGateways,
  type PaymentGateway,
  type BankOAuthProvider,
  useBankConnections,
} from "@/lib/payment-service"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import Link from "next/link"
import Image from "next/image"

export default function PaymentSettings() {
  const { toast } = useToast()
  const [gateways, setGateways] = useState<PaymentGateway[]>([])
  const [activeTab, setActiveTab] = useState("")
  const [showBankDialog, setShowBankDialog] = useState(false)
  const { connections, connecting, connectBank, disconnectBankConnection, refreshConnections } = useBankConnections()

  useEffect(() => {
    const loadedGateways = getPaymentGateways()
    setGateways(loadedGateways)

    // Filtrar apenas os gateways que queremos mostrar
    const filteredGateways = loadedGateways.filter(
      (g) => g.id === "local_manual" || g.id === "local_pix" || g.id === "local_transfer",
    )

    // Set the first enabled gateway as active tab, or the first gateway if none is enabled
    const enabledGateway = filteredGateways.find((g) => g.enabled)
    setActiveTab(enabledGateway?.id || filteredGateways[0]?.id || "")
  }, [])

  const handleSaveGateways = () => {
    savePaymentGateways(gateways)

    toast({
      title: "Configurações salvas",
      description: "As configurações de pagamento foram atualizadas com sucesso",
    })
  }

  const handleToggleGateway = (id: string, enabled: boolean) => {
    setGateways(gateways.map((gateway) => (gateway.id === id ? { ...gateway, enabled } : gateway)))
  }

  const handleToggleTestMode = (id: string, testMode: boolean) => {
    setGateways(gateways.map((gateway) => (gateway.id === id ? { ...gateway, testMode } : gateway)))
  }

  const handleApiKeyChange = (id: string, apiKey: string) => {
    setGateways(gateways.map((gateway) => (gateway.id === id ? { ...gateway, apiKey } : gateway)))
  }

  const handleMerchantIdChange = (id: string, merchantId: string) => {
    setGateways(gateways.map((gateway) => (gateway.id === id ? { ...gateway, merchantId } : gateway)))
  }

  const handleLocalConfigChange = (id: string, field: string, value: string) => {
    setGateways(
      gateways.map((gateway) => {
        if (gateway.id === id) {
          const localConfig = { ...(gateway.localConfig || {}) }

          if (field.includes(".")) {
            // Handle nested fields like bankAccount.bank
            const [parent, child] = field.split(".")
            localConfig[parent] = {
              ...(localConfig[parent] || {}),
              [child]: value,
            }
          } else {
            // Handle top-level fields
            localConfig[field] = value
          }

          return { ...gateway, localConfig }
        }
        return gateway
      }),
    )
  }

  const handleBankConnectionChange = (gatewayId: string, connectionId: string) => {
    setGateways(
      gateways.map((gateway) => {
        if (gateway.id === gatewayId) {
          return { ...gateway, bankConnection: connectionId }
        }
        return gateway
      }),
    )
  }

  const handleConnectBank = async (provider: BankOAuthProvider) => {
    try {
      setShowBankDialog(false)

      toast({
        title: "Conectando ao banco",
        description: "Iniciando processo de autenticação...",
      })

      const connection = await connectBank(provider)

      // Atualizar gateway para usar esta conexão
      const bankGateway = gateways.find((g) => g.id === "bank_oauth")
      if (bankGateway) {
        handleBankConnectionChange("bank_oauth", connection.id)
        handleToggleGateway("bank_oauth", true)
      }

      toast({
        title: "Banco conectado com sucesso",
        description: `Conexão estabelecida com ${connection.name}`,
      })
    } catch (error: any) {
      toast({
        title: "Erro na conexão",
        description: error.message || "Não foi possível conectar ao banco",
        variant: "destructive",
      })
    }
  }

  const handleDisconnectBank = async (connectionId: string) => {
    try {
      const success = await disconnectBankConnection(connectionId)

      if (success) {
        toast({
          title: "Banco desconectado",
          description: "A conexão com o banco foi removida com sucesso",
        })
      } else {
        throw new Error("Não foi possível desconectar o banco")
      }
    } catch (error: any) {
      toast({
        title: "Erro ao desconectar",
        description: error.message || "Não foi possível desconectar o banco",
        variant: "destructive",
      })
    }
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "credit":
      case "debit":
        return <CreditCard className="h-4 w-4" />
      case "pix":
        return <QrCode className="h-4 w-4" />
      case "bank_slip":
        return <Receipt className="h-4 w-4" />
      case "cash":
        return <BanknoteIcon className="h-4 w-4" />
      case "transfer":
        return <ArrowDownUp className="h-4 w-4" />
      case "manual":
        return <Settings2 className="h-4 w-4" />
      default:
        return <CreditCard className="h-4 w-4" />
    }
  }

  const getPaymentMethodName = (method: string) => {
    const methods: Record<string, string> = {
      credit: "Cartão de Crédito",
      debit: "Cartão de Débito",
      pix: "PIX",
      cash: "Dinheiro",
      bank_slip: "Boleto Bancário",
      manual: "Pagamento Manual",
      transfer: "Transferência Bancária",
    }

    return methods[method] || method
  }

  const getBankProviderName = (provider: BankOAuthProvider) => {
    const providers: Record<BankOAuthProvider, string> = {
      "banco-do-brasil": "Banco do Brasil",
      itau: "Itaú",
      bradesco: "Bradesco",
      santander: "Santander",
      caixa: "Caixa Econômica Federal",
      nubank: "Nubank",
      inter: "Banco Inter",
      sicoob: "Sicoob",
      mercadopago: "Mercado Pago",
      pagseguro: "PagSeguro",
    }

    return providers[provider] || provider
  }

  const getBankProviderLogo = (provider: BankOAuthProvider) => {
    const logos: Record<BankOAuthProvider, string> = {
      "banco-do-brasil": "/banks/banco-do-brasil.png",
      itau: "/banks/itau.png",
      bradesco: "/banks/bradesco.png",
      santander: "/banks/santander.png",
      caixa: "/banks/caixa.png",
      nubank: "/banks/nubank.png",
      inter: "/banks/inter.png",
      sicoob: "/banks/sicoob.png",
      mercadopago: "/mercadopago.png",
      pagseguro: "/pagseguro.png",
    }

    return logos[provider] || null
  }

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A"

    const date = new Date(dateString)
    return date.toLocaleString()
  }

  const getConnectedBankInfo = (connectionId: string) => {
    const connection = connections.find((c) => c.id === connectionId)
    if (!connection) return null

    return connection
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Configurações de Pagamento
        </CardTitle>
        <CardDescription>Configure métodos de pagamento locais e integrações com bancos</CardDescription>
        <div className="mt-4">
          <Link href="/bank-connections">
            <Button variant="outline" className="flex items-center gap-2">
              <BanknoteIcon className="h-4 w-4" />
              Gerenciar Conexões Bancárias
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {gateways.length > 0 ? (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="flex flex-col mb-4 w-full gap-2 overflow-visible h-auto max-h-none">
              {gateways
                .filter(
                  (gateway) =>
                    gateway.id === "local_manual" || gateway.id === "local_pix" || gateway.id === "local_transfer",
                )
                .map((gateway) => (
                  <TabsTrigger
                    key={gateway.id}
                    value={gateway.id}
                    className="justify-start px-4 py-3 h-auto text-sm font-medium"
                  >
                    {gateway.name}
                  </TabsTrigger>
                ))}
            </TabsList>

            {gateways
              .filter(
                (gateway) =>
                  gateway.id === "local_manual" || gateway.id === "local_pix" || gateway.id === "local_transfer",
              )
              .map((gateway) => (
                <TabsContent key={gateway.id} value={gateway.id} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="font-medium">{gateway.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {gateway.enabled ? "Ativado" : "Desativado"}
                      </span>
                    </div>
                    <Switch
                      checked={gateway.enabled}
                      onCheckedChange={(enabled) => handleToggleGateway(gateway.id, enabled)}
                    />
                  </div>

                  {gateway.enabled && (
                    <>
                      {/* Configurações específicas para gateways bancários (OAuth) */}
                      {gateway.type === "bank" && (
                        <div className="space-y-4 border rounded-md p-4">
                          <h3 className="font-medium flex items-center gap-2">
                            <BanknoteIcon className="h-4 w-4" />
                            Conexão Bancária
                          </h3>

                          {gateway.bankConnection && getConnectedBankInfo(gateway.bankConnection) ? (
                            <div className="space-y-4">
                              <div className="bg-muted p-3 rounded-md">
                                {(() => {
                                  const connection = getConnectedBankInfo(gateway.bankConnection || "")
                                  if (!connection) return null

                                  return (
                                    <>
                                      <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center gap-2">
                                          <Check className="h-4 w-4 text-green-500" />
                                          <span className="font-medium">{connection.name}</span>
                                        </div>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleDisconnectBank(connection.id)}
                                          className="h-8 gap-1"
                                        >
                                          <LinkOff className="h-3 w-3" />
                                          Desconectar
                                        </Button>
                                      </div>

                                      <div className="text-sm space-y-1 mt-2">
                                        <p>
                                          <span className="text-muted-foreground">Conectado em:</span>{" "}
                                          {formatDate(connection.lastConnected)}
                                        </p>
                                        <p>
                                          <span className="text-muted-foreground">Expira em:</span>{" "}
                                          {formatDate(connection.expiresAt)}
                                        </p>

                                        {connection.accountInfo && (
                                          <Accordion type="single" collapsible className="mt-2">
                                            <AccordionItem value="account-info">
                                              <AccordionTrigger className="text-sm py-2">
                                                Informações da Conta
                                              </AccordionTrigger>
                                              <AccordionContent>
                                                <div className="space-y-1 text-sm">
                                                  <p>
                                                    <span className="text-muted-foreground">Banco:</span>{" "}
                                                    {connection.accountInfo.bankName}
                                                  </p>
                                                  <p>
                                                    <span className="text-muted-foreground">Tipo:</span>{" "}
                                                    {connection.accountInfo.accountType}
                                                  </p>
                                                  <p>
                                                    <span className="text-muted-foreground">Agência:</span>{" "}
                                                    {connection.accountInfo.agency}
                                                  </p>
                                                  <p>
                                                    <span className="text-muted-foreground">Conta:</span>{" "}
                                                    {connection.accountInfo.accountNumber}
                                                  </p>

                                                  {connection.accountInfo.pixKeys &&
                                                    connection.accountInfo.pixKeys.length > 0 && (
                                                      <div className="mt-2">
                                                        <p className="text-muted-foreground">Chaves PIX:</p>
                                                        <ul className="list-disc list-inside">
                                                          {connection.accountInfo.pixKeys.map((key, index) => (
                                                            <li key={index}>{key}</li>
                                                          ))}
                                                        </ul>
                                                      </div>
                                                    )}
                                                </div>
                                              </AccordionContent>
                                            </AccordionItem>
                                          </Accordion>
                                        )}
                                      </div>
                                    </>
                                  )
                                })()}
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center p-6 border border-dashed rounded-md">
                              <BanknoteIcon className="h-8 w-8 text-muted-foreground mb-2" />
                              <p className="text-muted-foreground mb-4">Nenhum banco conectado</p>
                              <Button onClick={() => setShowBankDialog(true)}>Conectar Banco</Button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Configurações específicas para gateways locais */}
                      {gateway.type === "local" && (
                        <div className="space-y-4 border rounded-md p-4">
                          <h3 className="font-medium">Configurações Locais</h3>

                          <div className="space-y-2">
                            <Label htmlFor={`${gateway.id}-companyName`}>Nome da Empresa</Label>
                            <Input
                              id={`${gateway.id}-companyName`}
                              value={gateway.localConfig?.companyName || ""}
                              onChange={(e) => handleLocalConfigChange(gateway.id, "companyName", e.target.value)}
                              placeholder="Nome da sua empresa"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`${gateway.id}-documentNumber`}>CNPJ</Label>
                            <Input
                              id={`${gateway.id}-documentNumber`}
                              value={gateway.localConfig?.documentNumber || ""}
                              onChange={(e) => handleLocalConfigChange(gateway.id, "documentNumber", e.target.value)}
                              placeholder="00.000.000/0001-00"
                            />
                          </div>

                          {/* Configurações específicas para PIX */}
                          {gateway.id === "local_pix" && (
                            <div className="space-y-2">
                              <Label htmlFor={`${gateway.id}-pixKey`}>Chave PIX</Label>
                              <Input
                                id={`${gateway.id}-pixKey`}
                                value={gateway.localConfig?.pixKey || ""}
                                onChange={(e) => handleLocalConfigChange(gateway.id, "pixKey", e.target.value)}
                                placeholder="CPF, CNPJ, E-mail, Telefone ou Chave Aleatória"
                              />
                            </div>
                          )}

                          {/* Configurações específicas para Transferência Bancária */}
                          {gateway.id === "local_transfer" && (
                            <div className="space-y-4">
                              <h4 className="font-medium text-sm">Dados Bancários</h4>

                              <div className="space-y-2">
                                <Label htmlFor={`${gateway.id}-bank`}>Banco</Label>
                                <Input
                                  id={`${gateway.id}-bank`}
                                  value={gateway.localConfig?.bankAccount?.bank || ""}
                                  onChange={(e) =>
                                    handleLocalConfigChange(gateway.id, "bankAccount.bank", e.target.value)
                                  }
                                  placeholder="Nome do banco"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor={`${gateway.id}-agency`}>Agência</Label>
                                <Input
                                  id={`${gateway.id}-agency`}
                                  value={gateway.localConfig?.bankAccount?.agency || ""}
                                  onChange={(e) =>
                                    handleLocalConfigChange(gateway.id, "bankAccount.agency", e.target.value)
                                  }
                                  placeholder="Número da agência"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor={`${gateway.id}-account`}>Conta</Label>
                                <Input
                                  id={`${gateway.id}-account`}
                                  value={gateway.localConfig?.bankAccount?.account || ""}
                                  onChange={(e) =>
                                    handleLocalConfigChange(gateway.id, "bankAccount.account", e.target.value)
                                  }
                                  placeholder="Número da conta"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor={`${gateway.id}-accountType`}>Tipo de Conta</Label>
                                <select
                                  id={`${gateway.id}-accountType`}
                                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                  value={gateway.localConfig?.bankAccount?.accountType || ""}
                                  onChange={(e) =>
                                    handleLocalConfigChange(gateway.id, "bankAccount.accountType", e.target.value)
                                  }
                                >
                                  <option value="">Selecione o tipo de conta</option>
                                  <option value="Corrente">Conta Corrente</option>
                                  <option value="Poupança">Conta Poupança</option>
                                </select>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Configurações para gateways externos (APIs) */}
                      {gateway.type === "external" && (
                        <>
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="font-medium">Modo de teste</span>
                              <span className="text-sm text-muted-foreground">
                                {gateway.testMode ? "Ativado" : "Desativado"}
                              </span>
                            </div>
                            <Switch
                              checked={gateway.testMode}
                              onCheckedChange={(testMode) => handleToggleTestMode(gateway.id, testMode)}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`${gateway.id}-apiKey`}>Chave de API</Label>
                            <Input
                              id={`${gateway.id}-apiKey`}
                              type="password"
                              value={gateway.apiKey || ""}
                              onChange={(e) => handleApiKeyChange(gateway.id, e.target.value)}
                              placeholder="Insira sua chave de API"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`${gateway.id}-merchantId`}>ID do Comerciante</Label>
                            <Input
                              id={`${gateway.id}-merchantId`}
                              value={gateway.merchantId || ""}
                              onChange={(e) => handleMerchantIdChange(gateway.id, e.target.value)}
                              placeholder="Insira seu ID de comerciante"
                            />
                          </div>
                        </>
                      )}

                      <div className="rounded-md border p-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-amber-500" />
                          <span className="font-medium">Métodos de pagamento suportados</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {gateway.supportedMethods.map((method) => (
                            <div key={method} className="flex items-center gap-2">
                              {getPaymentMethodIcon(method)}
                              <span>{getPaymentMethodName(method)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </TabsContent>
              ))}
          </Tabs>
        ) : (
          <div className="text-center py-8">
            <p>Nenhum método de pagamento configurado.</p>
          </div>
        )}

        {/* Dialog para conectar banco */}
        <Dialog open={showBankDialog} onOpenChange={setShowBankDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Conectar Banco</DialogTitle>
              <DialogDescription>
                Escolha o banco que deseja conectar via OAuth. Você será redirecionado para a página de autenticação do
                banco.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-3 py-4">
              {(
                ["banco-do-brasil", "itau", "bradesco", "santander", "caixa", "nubank", "inter"] as BankOAuthProvider[]
              ).map((provider) => (
                <Button
                  key={provider}
                  variant="outline"
                  className="flex flex-col items-center justify-center h-24 gap-2 p-2"
                  onClick={() => handleConnectBank(provider)}
                  disabled={connecting}
                >
                  <div className="w-12 h-12 flex items-center justify-center">
                    <Image
                      src={getBankProviderLogo(provider) || "/placeholder.svg"}
                      alt={getBankProviderName(provider)}
                      width={48}
                      height={48}
                      className="object-contain"
                    />
                  </div>
                  <span className="text-xs text-center">{getBankProviderName(provider)}</span>
                </Button>
              ))}
            </div>

            <DialogFooter className="sm:justify-start">
              <Button type="button" variant="secondary" onClick={() => setShowBankDialog(false)}>
                Cancelar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <Button onClick={handleSaveGateways} className="w-full">
          Salvar Configurações
        </Button>

        <div className="w-full flex justify-center mb-2">
          <Link href="/bank-connections">
            <Button variant="secondary" className="flex items-center gap-2">
              <BanknoteIcon className="h-4 w-4" />
              Gerenciar Conexões Bancárias
            </Button>
          </Link>
        </div>

        <div className="w-full p-4 border rounded-md">
          <h3 className="font-medium mb-2">Opções de Pagamento</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Configure os métodos de pagamento de acordo com suas necessidades:
          </p>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <BanknoteIcon className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Conexão Bancária (OAuth)</span>
            </div>
            <p className="text-xs text-muted-foreground ml-6 mb-2">
              Conecte-se diretamente à sua conta bancária para processar pagamentos de forma segura e automatizada.
              Ideal para empresas que precisam de integração direta com bancos.
            </p>

            <div className="flex items-center gap-2">
              <BanknoteIcon className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Processamento Local</span>
            </div>
            <p className="text-xs text-muted-foreground ml-6">
              Processe pagamentos localmente sem depender de APIs externas. Ideal para estabelecimentos com conexão
              limitada à internet ou que preferem controle manual.
            </p>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}


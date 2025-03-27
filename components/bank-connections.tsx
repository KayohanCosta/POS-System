"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { BanknoteIcon, Link, Link2OffIcon, Check, AlertCircle } from "lucide-react"
import { type BankOAuthProvider, useBankConnections, getBankProviderLogo } from "@/lib/payment-service"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"

export default function BankConnections() {
  const { toast } = useToast()
  const [showBankDialog, setShowBankDialog] = useState(false)
  const { connections, connecting, connectBank, disconnectBankConnection, refreshConnections } = useBankConnections()

  useEffect(() => {
    refreshConnections()
  }, [refreshConnections])

  const handleConnectBank = async (provider: BankOAuthProvider) => {
    try {
      setShowBankDialog(false)

      toast({
        title: "Conectando ao banco",
        description: "Iniciando processo de autenticação...",
      })

      const connection = await connectBank(provider)

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

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A"

    const date = new Date(dateString)
    return date.toLocaleString()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BanknoteIcon className="h-5 w-5" />
          Conexões Bancárias
        </CardTitle>
        <CardDescription>Gerencie suas conexões com bancos via OAuth</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {connections.length > 0 ? (
            connections.map((connection) => (
              <div key={connection.id} className="border rounded-md p-4">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center overflow-hidden">
                      {connection.provider ? (
                        <Image
                          src={getBankProviderLogo(connection.provider) || "/placeholder.svg"}
                          alt={connection.name}
                          width={48}
                          height={48}
                          className="object-contain"
                        />
                      ) : (
                        <BanknoteIcon className="h-6 w-6" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">{connection.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(connection.expiresAt || "") > new Date() ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <Check className="h-3 w-3 mr-1" /> Conectado
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                            <AlertCircle className="h-3 w-3 mr-1" /> Expirado
                          </Badge>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleDisconnectBank(connection.id)}>
                      <Link2OffIcon className="h-4 w-4 mr-1" />
                      Desconectar
                    </Button>
                  </div>
                </div>

                <div className="text-sm space-y-1 mt-2">
                  <p>
                    <span className="text-muted-foreground">Conectado em:</span> {formatDate(connection.lastConnected)}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Expira em:</span> {formatDate(connection.expiresAt)}
                  </p>

                  {connection.accountInfo && (
                    <div className="mt-3 pt-3 border-t">
                      <h4 className="font-medium mb-2">Informações da Conta</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-muted-foreground text-xs">Banco</p>
                          <p>{connection.accountInfo.bankName}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Tipo</p>
                          <p>{connection.accountInfo.accountType}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Agência</p>
                          <p>{connection.accountInfo.agency}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Conta</p>
                          <p>{connection.accountInfo.accountNumber}</p>
                        </div>
                      </div>

                      {connection.accountInfo.pixKeys && connection.accountInfo.pixKeys.length > 0 && (
                        <div className="mt-3">
                          <p className="text-muted-foreground text-xs mb-1">Chaves PIX</p>
                          <div className="flex flex-wrap gap-2">
                            {connection.accountInfo.pixKeys.map((key, index) => (
                              <Badge key={index} variant="secondary">
                                {key}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 border rounded-md">
              <BanknoteIcon className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <h3 className="font-medium mb-2">Nenhum banco conectado</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Conecte-se a um banco para processar pagamentos diretamente via API bancária
              </p>
              <Button onClick={() => setShowBankDialog(true)}>Conectar Banco</Button>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full" onClick={() => setShowBankDialog(true)}>
          <Link className="h-4 w-4 mr-2" />
          Adicionar Nova Conexão
        </Button>
      </CardFooter>

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
    </Card>
  )
}


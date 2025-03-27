"use client"

import { useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BanknoteIcon, LucideLink, ExternalLink } from "lucide-react"
import { useBankConnections, getBankProviderLogo } from "@/lib/payment-service"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import Image from "next/image"

export default function BankConnectionsSummary() {
  const { connections, refreshConnections } = useBankConnections()

  useEffect(() => {
    refreshConnections()
  }, [refreshConnections])

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <BanknoteIcon className="h-5 w-5" />
          Conexões Bancárias
        </CardTitle>
        <CardDescription>
          {connections.length > 0
            ? `${connections.length} ${connections.length === 1 ? "banco conectado" : "bancos conectados"}`
            : "Nenhum banco conectado"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {connections.length > 0 ? (
          <div className="space-y-3">
            {connections.slice(0, 3).map((connection) => (
              <div key={connection.id} className="flex justify-between items-center p-2 border rounded-md">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-muted rounded-md flex items-center justify-center overflow-hidden">
                    {connection.provider ? (
                      <Image
                        src={getBankProviderLogo(connection.provider) || "/placeholder.svg"}
                        alt={connection.name}
                        width={32}
                        height={32}
                        className="object-contain"
                      />
                    ) : (
                      <BanknoteIcon className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{connection.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {connection.accountInfo?.accountNumber
                        ? `Conta: ${connection.accountInfo.accountNumber}`
                        : "Conta conectada"}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Ativo
                </Badge>
              </div>
            ))}

            {connections.length > 3 && (
              <p className="text-xs text-center text-muted-foreground">+ {connections.length - 3} outras conexões</p>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <BanknoteIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-4">
              Conecte-se a um banco para processar pagamentos diretamente via API bancária
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full" asChild>
          <Link href="/bank-connections">
            {connections.length > 0 ? (
              <>
                <ExternalLink className="h-4 w-4 mr-2" />
                Gerenciar Conexões
              </>
            ) : (
              <>
                <LucideLink className="h-4 w-4 mr-2" />
                Conectar Banco
              </>
            )}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}


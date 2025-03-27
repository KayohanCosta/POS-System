"use client"

import { useState, useCallback } from "react"
import {
  type BankOAuthProvider,
  type BankConnection,
  getBankConnections,
  saveBankConnections,
} from "@/lib/payment-service"

// Hook para gerenciar conexões bancárias
export function useBankConnections() {
  const [connections, setConnections] = useState<BankConnection[]>(getBankConnections())
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshConnections = useCallback(() => {
    setConnections(getBankConnections())
  }, [])

  const connectBank = async (provider: BankOAuthProvider) => {
    setConnecting(true)
    setError(null)

    try {
      // Simular conexão bem-sucedida para fins de demonstração
      // Em um ambiente real, o usuário seria redirecionado para a página de autenticação do banco
      // e retornaria via callback OAuth

      // Criar conexão simulada
      const connection: BankConnection = {
        id: `conn_${Date.now()}`,
        provider,
        name: getBankProviderName(provider),
        connected: true,
        lastConnected: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(), // Expira em 1 hora
        accessToken: `access_${Math.random().toString(36).substring(2, 15)}`,
        refreshToken: `refresh_${Math.random().toString(36).substring(2, 15)}`,
        accountInfo: {
          bankName: getBankProviderName(provider),
          accountType: "Corrente",
          accountNumber: "12345-6",
          agency: "0001",
          pixKeys: ["exemplo@banco.com.br", "11999999999"],
        },
      }

      // Salvar conexão
      const currentConnections = getBankConnections()
      currentConnections.push(connection)
      saveBankConnections(currentConnections)

      // Atualizar estado
      setConnections(currentConnections)

      return connection
    } catch (err: any) {
      setError(err.message || "Erro ao conectar ao banco")
      throw err
    } finally {
      setConnecting(false)
    }
  }

  const disconnectBankConnection = (connectionId: string) => {
    try {
      const success = disconnectBank(connectionId)
      if (success) {
        refreshConnections()
        return true
      }
      return false
    } catch (err: any) {
      setError(err.message || "Erro ao desconectar banco")
      return false
    }
  }

  return {
    connections,
    connecting,
    error,
    connectBank,
    disconnectBankConnection,
    refreshConnections,
  }
}

// Função auxiliar para obter nome amigável do provedor bancário
const getBankProviderName = (provider: BankOAuthProvider): string => {
  const providers: Record<BankOAuthProvider, string> = {
    "banco-do-brasil": "Banco do Brasil",
    itau: "Itaú",
    bradesco: "Bradesco",
    santander: "Santander",
    caixa: "Caixa Econômica Federal",
    nubank: "Nubank",
    inter: "Banco Inter",
    sicoob: "Sicoob",
    mercadopago": \"Mercado Pago\",
    pagseguro": "PagSeguro",
  }

  return providers[provider] || provider
}

// Desconectar banco
const disconnectBank = (connectionId: string): boolean => {
  let connections = []
  if (typeof window !== "undefined") {
    connections = JSON.parse(localStorage.getItem("bankConnections") || "[]")
  }
  const updatedConnections = connections.filter((c: any) => c.id !== connectionId)

  if (updatedConnections.length === connections.length) {
    return false // Conexão não encontrada
  }

  if (typeof window !== "undefined") {
    localStorage.setItem("bankConnections", JSON.stringify(updatedConnections))
  }

  return true
}


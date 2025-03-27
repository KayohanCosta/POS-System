"use client"

// Serviço de pagamento com suporte a OAuth para bancos e processamento local
import { useState, useCallback } from "react"

// Tipos para pagamentos
export type PaymentMethod = "credit" | "debit" | "pix" | "cash" | "bank_slip" | "manual" | "transfer"
export type PaymentStatus = "pending" | "processing" | "approved" | "declined" | "refunded" | "cancelled"

// Tipos para OAuth e integração bancária
export type BankOAuthProvider =
  | "banco-do-brasil"
  | "itau"
  | "bradesco"
  | "santander"
  | "caixa"
  | "nubank"
  | "inter"
  | "sicoob"
  | "mercadopago"
  | "pagseguro"

export type BankConnection = {
  id: string
  provider: BankOAuthProvider
  name: string
  connected: boolean
  lastConnected?: string
  expiresAt?: string
  accessToken?: string
  refreshToken?: string
  accountInfo?: {
    bankName: string
    accountType: string
    accountNumber: string
    agency: string
    pixKeys?: string[]
  }
}

export type PaymentGateway = {
  id: string
  name: string
  enabled: boolean
  type: "local" | "bank" | "external"
  apiKey?: string
  merchantId?: string
  supportedMethods: PaymentMethod[]
  testMode: boolean
  bankConnection?: string // ID da conexão bancária
  localConfig?: {
    companyName: string
    documentNumber: string
    pixKey?: string
    bankAccount?: {
      bank: string
      agency: string
      account: string
      accountType: string
    }
  }
}

export type PaymentRequest = {
  amount: number
  method: PaymentMethod
  description: string
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  customerDocument?: string
  installments?: number
  reference?: string
}

export type PaymentResponse = {
  id: string
  status: PaymentStatus
  amount: number
  method: PaymentMethod
  authorizationCode?: string
  transactionId?: string
  receiptUrl?: string
  qrCodeUrl?: string
  bankSlipUrl?: string
  processingDate: string
  gatewayResponse?: any
  manualNotes?: string
}

// Função para verificar se estamos no navegador
const isBrowser = () => typeof window !== "undefined"

// Obter gateways de pagamento configurados
export const getPaymentGateways = (): PaymentGateway[] => {
  if (!isBrowser()) return []

  const stored = localStorage.getItem("paymentGateways")
  if (!stored) return defaultGateways

  try {
    return JSON.parse(stored)
  } catch (e) {
    console.error("Erro ao analisar gateways de pagamento", e)
    return defaultGateways
  }
}

// Salvar gateways de pagamento
export const savePaymentGateways = (gateways: PaymentGateway[]): void => {
  if (!isBrowser()) return
  localStorage.setItem("paymentGateways", JSON.stringify(gateways))
}

// Obter conexões bancárias
export const getBankConnections = (): BankConnection[] => {
  if (!isBrowser()) return []

  const stored = localStorage.getItem("bankConnections")
  if (!stored) return defaultBankConnections

  try {
    return JSON.parse(stored)
  } catch (e) {
    console.error("Erro ao analisar conexões bancárias", e)
    return defaultBankConnections
  }
}

// Salvar conexões bancárias
export const saveBankConnections = (connections: BankConnection[]): void => {
  if (!isBrowser()) return
  localStorage.setItem("bankConnections", JSON.stringify(connections))
}

// Conexões bancárias padrão (vazias)
const defaultBankConnections: BankConnection[] = []

// Gateways padrão (agora com opções locais e bancárias)
const defaultGateways: PaymentGateway[] = [
  {
    id: "local_manual",
    name: "Pagamento Manual",
    enabled: true,
    type: "local",
    supportedMethods: ["credit", "debit", "cash", "pix", "bank_slip", "transfer", "manual"],
    testMode: false,
    localConfig: {
      companyName: "Minha Empresa",
      documentNumber: "00.000.000/0001-00",
    },
  },
  {
    id: "local_pix",
    name: "PIX Local",
    enabled: true,
    type: "local",
    supportedMethods: ["pix"],
    testMode: false,
    localConfig: {
      companyName: "Minha Empresa",
      documentNumber: "00.000.000/0001-00",
      pixKey: "exemplo@chave.pix",
    },
  },
  {
    id: "local_transfer",
    name: "Transferência Bancária",
    enabled: true,
    type: "local",
    supportedMethods: ["transfer"],
    testMode: false,
    localConfig: {
      companyName: "Minha Empresa",
      documentNumber: "00.000.000/0001-00",
      bankAccount: {
        bank: "Banco do Brasil",
        agency: "0001",
        account: "12345-6",
        accountType: "Corrente",
      },
    },
  },
  {
    id: "bank_oauth",
    name: "Banco Conectado (OAuth)",
    enabled: false,
    type: "bank",
    supportedMethods: ["credit", "debit", "pix", "bank_slip", "transfer"],
    testMode: false,
    bankConnection: "",
  },
  {
    id: "mercadopago",
    name: "Mercado Pago",
    enabled: false,
    type: "external",
    supportedMethods: ["credit", "debit", "pix", "bank_slip"],
    testMode: true,
  },
  {
    id: "pagseguro",
    name: "PagSeguro",
    enabled: false,
    type: "external",
    supportedMethods: ["credit", "debit", "pix", "bank_slip"],
    testMode: true,
  },
]

// Gerar QR Code PIX estático (simulado)
export const generatePixQRCode = (value: number, description: string, pixKey: string): string => {
  // Em um ambiente real, você usaria uma biblioteca para gerar o QR Code
  // Aqui estamos apenas simulando com uma URL de exemplo
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=00020126580014BR.GOV.BCB.PIX0136${pixKey}5204000053039865802BR5913${encodeURIComponent(description)}6008Brasilia62070503***6304${Math.floor(Math.random() * 10000)}`
}

// Gerar boleto (simulado)
export const generateBankSlip = (value: number, customerName: string): string => {
  // Em um ambiente real, você usaria uma API ou biblioteca para gerar o boleto
  // Aqui estamos apenas simulando com uma URL de exemplo
  return `https://example.com/boleto/${Date.now()}`
}

// Obter logo do banco (simulado)
export const getBankProviderLogo = (provider: BankOAuthProvider): string => {
  const logos: Record<BankOAuthProvider, string> = {
    "banco-do-brasil": "/images/banks/banco-do-brasil.png",
    itau: "/images/banks/itau.png",
    bradesco: "/images/banks/bradesco.png",
    santander: "/images/banks/santander.png",
    caixa: "/images/banks/caixa.png",
    nubank: "/images/banks/nubank.png",
    inter: "/images/banks/inter.png",
    sicoob: "/placeholder.svg?height=80&width=80",
    mercadopago: "/placeholder.svg?height=80&width=80",
    pagseguro: "/placeholder.svg?height=80&width=80",
  }

  return logos[provider] || "/placeholder.svg?height=80&width=80"
}

// Iniciar fluxo de autenticação OAuth com banco (versão melhorada)
export const startBankOAuth = (provider: BankOAuthProvider): void => {
  // Em um ambiente real, você redirecionaria para a URL de autenticação do banco
  // Aqui estamos apenas simulando o processo

  // Gerar um estado para prevenir CSRF
  const state = Math.random().toString(36).substring(2, 15)
  localStorage.setItem("oauth_state", state)
  localStorage.setItem("oauth_provider", provider)

  // URLs de autenticação simuladas para diferentes bancos
  const authUrls: Record<BankOAuthProvider, string> = {
    "banco-do-brasil": "https://auth.bb.com.br/oauth/authorize",
    itau: "https://iti.itau/api/oauth/authorize",
    bradesco: "https://auth.bradesco.com.br/oauth/authorize",
    santander: "https://api.santander.com.br/auth/oauth/authorize",
    caixa: "https://oauth.caixa.gov.br/oauth/authorize",
    nubank: "https://auth.nubank.com.br/oauth/authorize",
    inter: "https://cdpj.partners.bancointer.com.br/oauth/authorize",
    sicoob: "https://auth.sicoob.com.br/auth/realms/cooperado/protocol/openid-connect/auth",
    mercadopago: "https://auth.mercadopago.com.br/authorization",
    pagseguro: "https://connect.pagseguro.uol.com.br/oauth2/authorize",
  }

  // Construir URL de autenticação
  const clientId = "YOUR_CLIENT_ID" // Em um ambiente real, você teria um ID de cliente registrado
  const redirectUri = encodeURIComponent(window.location.origin + "/oauth/callback")
  const scope = encodeURIComponent("payments accounts pix read write")

  const authUrl = `${authUrls[provider]}?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&state=${state}&scope=${scope}`

  // Em um ambiente real, redirecionaríamos para a URL de autenticação
  // Aqui vamos simular o processo para fins de demonstração

  // Simular redirecionamento
  console.log("Redirecionando para:", authUrl)

  // Simular callback de OAuth bem-sucedido após 2 segundos
  setTimeout(() => {
    const code = Math.random().toString(36).substring(2, 15)
    window.location.href = `/oauth/callback?code=${code}&state=${state}`
  }, 2000)
}

// Processar callback de OAuth (simulado)
export const processOAuthCallback = async (code: string, state: string): Promise<BankConnection | null> => {
  // Verificar estado para prevenir CSRF
  const savedState = localStorage.getItem("oauth_state")
  if (!savedState || savedState !== state) {
    throw new Error("Estado OAuth inválido")
  }

  // Obter o provedor salvo
  const provider = localStorage.getItem("oauth_provider") as BankOAuthProvider | null
  if (!provider) {
    throw new Error("Provedor OAuth não encontrado")
  }

  // Limpar estado e provedor
  localStorage.removeItem("oauth_state")
  localStorage.removeItem("oauth_provider")

  // Em um ambiente real, você trocaria o código por tokens de acesso
  // Aqui estamos apenas simulando o processo

  // Simular atraso de rede
  await new Promise((resolve) => setTimeout(resolve, 1500))

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
  const connections = getBankConnections()
  connections.push(connection)
  saveBankConnections(connections)

  return connection
}

// Renovar token de acesso (simulado)
export const refreshBankToken = async (connectionId: string): Promise<BankConnection | null> => {
  const connections = getBankConnections()
  const connection = connections.find((c) => c.id === connectionId)

  if (!connection || !connection.refreshToken) {
    return null
  }

  // Simular atraso de rede
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Atualizar tokens
  const updatedConnection: BankConnection = {
    ...connection,
    lastConnected: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(), // Expira em 1 hora
    accessToken: `access_${Math.random().toString(36).substring(2, 15)}`,
  }

  // Atualizar conexão
  const updatedConnections = connections.map((c) => (c.id === connectionId ? updatedConnection : c))
  saveBankConnections(updatedConnections)

  return updatedConnection
}

// Desconectar banco
export const disconnectBank = (connectionId: string): boolean => {
  const connections = getBankConnections()
  const updatedConnections = connections.filter((c) => c.id !== connectionId)

  if (updatedConnections.length === connections.length) {
    return false // Conexão não encontrada
  }

  saveBankConnections(updatedConnections)

  // Atualizar gateways que usam esta conexão
  const gateways = getPaymentGateways()
  const updatedGateways = gateways.map((g) => {
    if (g.bankConnection === connectionId) {
      return { ...g, enabled: false, bankConnection: "" }
    }
    return g
  })
  savePaymentGateways(updatedGateways)

  return true
}

// Processar pagamento
export const processPayment = async (request: PaymentRequest): Promise<PaymentResponse> => {
  // Obter gateways configurados
  const gateways = getPaymentGateways()
  const activeGateway = gateways.find((g) => g.enabled && g.supportedMethods.includes(request.method))

  if (!activeGateway) {
    throw new Error(`Nenhum gateway configurado para o método de pagamento ${request.method}`)
  }

  // Simular processamento de pagamento
  console.log(`Processando pagamento via ${activeGateway.name}:`, request)

  // Simular atraso de processamento
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Processar pagamento de acordo com o tipo de gateway
  let paymentResponse: PaymentResponse

  if (activeGateway.type === "bank") {
    // Processamento via banco conectado por OAuth
    const connections = getBankConnections()
    const connection = connections.find((c) => c.id === activeGateway.bankConnection)

    if (!connection || !connection.connected) {
      throw new Error("Banco não conectado ou conexão expirada")
    }

    // Verificar se o token expirou
    const expiresAt = new Date(connection.expiresAt || "")
    if (expiresAt < new Date()) {
      // Token expirado, tentar renovar
      const refreshed = await refreshBankToken(connection.id)
      if (!refreshed) {
        throw new Error("Não foi possível renovar a conexão com o banco")
      }
    }

    // Simular processamento via API do banco
    paymentResponse = {
      id: `payment_bank_${Date.now()}`,
      status: "approved", // Simulando aprovação
      amount: request.method === "pix" ? request.amount : request.amount,
      method: request.method,
      authorizationCode: `BANK${Math.floor(Math.random() * 1000000)
        .toString()
        .padStart(6, "0")}`,
      transactionId: `tx_bank_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      processingDate: new Date().toISOString(),
      gatewayResponse: {
        success: true,
        bank: connection.name,
        accountInfo: connection.accountInfo,
      },
    }

    // Adicionar URLs específicas por método
    if (request.method === "pix" && connection.accountInfo?.pixKeys?.length) {
      const pixKey = connection.accountInfo.pixKeys[0]
      paymentResponse.qrCodeUrl = generatePixQRCode(request.amount, request.description || "Pagamento PIX", pixKey)
    } else if (request.method === "bank_slip") {
      paymentResponse.bankSlipUrl = generateBankSlip(request.amount, request.customerName || "Cliente")
    } else {
      paymentResponse.receiptUrl = `https://receipts.example.com/${paymentResponse.id}`
    }
  } else if (activeGateway.type === "local") {
    // Processamento local (sem API)
    paymentResponse = {
      id: `payment_${Date.now()}`,
      status: "approved", // Pagamentos locais são sempre aprovados
      amount: request.amount,
      method: request.method,
      authorizationCode: `LOCAL${Math.floor(Math.random() * 1000000)
        .toString()
        .padStart(6, "0")}`,
      transactionId: `tx_local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      processingDate: new Date().toISOString(),
      gatewayResponse: { success: true, local: true },
      manualNotes: request.method === "manual" ? "Pagamento processado manualmente" : undefined,
    }

    // Adicionar URLs específicas por método
    if (request.method === "pix" && activeGateway.localConfig?.pixKey) {
      paymentResponse.qrCodeUrl = generatePixQRCode(
        request.amount,
        request.description || "Pagamento PIX",
        activeGateway.localConfig.pixKey,
      )
    } else if (request.method === "bank_slip") {
      paymentResponse.bankSlipUrl = generateBankSlip(request.amount, request.customerName || "Cliente")
    } else if (request.method === "transfer" && activeGateway.localConfig?.bankAccount) {
      // Não há URL para transferência, mas podemos adicionar informações adicionais
      paymentResponse.manualNotes = `Transferência para: ${activeGateway.localConfig.bankAccount.bank}, Agência: ${activeGateway.localConfig.bankAccount.agency}, Conta: ${activeGateway.localConfig.bankAccount.account}`
    } else {
      paymentResponse.receiptUrl = `https://receipts.example.com/${paymentResponse.id}`
    }
  } else {
    // Simulação de processamento externo (API)
    // Em um ambiente real, você faria uma chamada à API do gateway aqui
    paymentResponse = {
      id: `payment_${Date.now()}`,
      status: Math.random() > 0.1 ? "approved" : "declined", // 90% de chance de aprovação
      amount: request.amount,
      method: request.method,
      authorizationCode: Math.floor(Math.random() * 1000000)
        .toString()
        .padStart(6, "0"),
      transactionId: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      processingDate: new Date().toISOString(),
      gatewayResponse: { success: true },
    }

    // Adicionar URLs específicas por método
    if (request.method === "pix") {
      paymentResponse.qrCodeUrl =
        "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=00020126580014BR.GOV.BCB.PIX0136a629532e-7693-4846-b028-f142a1415b6f5204000053039865802BR5913Loja%20Exemplo6008Brasilia62070503***63041D14"
    } else if (request.method === "bank_slip") {
      paymentResponse.bankSlipUrl = "https://example.com/boleto/12345"
    } else {
      paymentResponse.receiptUrl = `https://receipts.example.com/${paymentResponse.id}`
    }
  }

  // Registrar histórico de transação
  const transactions = JSON.parse(localStorage.getItem("paymentTransactions") || "[]")
  transactions.unshift({
    ...paymentResponse,
    customerName: request.customerName,
    description: request.description,
    gateway: activeGateway.id,
  })
  localStorage.setItem("paymentTransactions", JSON.stringify(transactions))

  return paymentResponse
}

// Gerar recibo em formato texto
export const generateTextReceipt = (payment: PaymentResponse, customerInfo?: any): string => {
  const date = new Date(payment.processingDate)
  const formattedDate = `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()} ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`

  const gateways = getPaymentGateways()
  const gateway = gateways.find((g) => g.enabled && g.type === "local")
  const companyName = gateway?.localConfig?.companyName || "Minha Empresa"
  const documentNumber = gateway?.localConfig?.documentNumber || ""

  const receipt = `
======================================
            RECIBO DE PAGAMENTO
======================================
${companyName}
${documentNumber ? `CNPJ: ${documentNumber}` : ""}
Data: ${formattedDate}

--------------------------------------
DETALHES DO PAGAMENTO
--------------------------------------
Valor: R$ ${payment.amount.toFixed(2)}
Método: ${getPaymentMethodName(payment.method)}
Status: ${payment.status === "approved" ? "APROVADO" : payment.status.toUpperCase()}
ID Transação: ${payment.transactionId || payment.id}
${payment.authorizationCode ? `Código Autorização: ${payment.authorizationCode}` : ""}

${
  customerInfo
    ? `
--------------------------------------
CLIENTE
--------------------------------------
Nome: ${customerInfo.name || "N/A"}
${customerInfo.document ? `Documento: ${customerInfo.document}` : ""}
${customerInfo.email ? `Email: ${customerInfo.email}` : ""}
${customerInfo.phone ? `Telefone: ${customerInfo.phone}` : ""}
`
    : ""
}

${
  payment.manualNotes
    ? `
--------------------------------------
OBSERVAÇÕES
--------------------------------------
${payment.manualNotes}
`
    : ""
}

======================================
          OBRIGADO PELA PREFERÊNCIA
======================================
`

  return receipt
}

// Obter nome amigável do método de pagamento
function getPaymentMethodName(method: PaymentMethod): string {
  const methods: Record<PaymentMethod, string> = {
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

// Hook para gerenciar pagamentos
export function usePaymentProcessor() {
  const [processing, setProcessing] = useState(false)
  const [lastResponse, setLastResponse] = useState<PaymentResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const processTransaction = async (request: PaymentRequest) => {
    setProcessing(true)
    setError(null)

    try {
      const response = await processPayment(request)
      setLastResponse(response)
      return response
    } catch (err: any) {
      setError(err.message || "Erro ao processar pagamento")
      throw err
    } finally {
      setProcessing(false)
    }
  }

  const getTransactionHistory = () => {
    if (!isBrowser()) return []
    return JSON.parse(localStorage.getItem("paymentTransactions") || "[]")
  }

  return {
    processing,
    lastResponse,
    error,
    processTransaction,
    getTransactionHistory,
  }
}

// Função auxiliar para obter nome amigável do provedor bancário
export const getBankProviderName = (provider: BankOAuthProvider): string => {
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

// Versão melhorada do hook useBankConnections
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
      // Iniciar fluxo OAuth
      startBankOAuth(provider)

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


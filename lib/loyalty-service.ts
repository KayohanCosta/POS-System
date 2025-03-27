"use client"

// Serviço de fidelidade de clientes
import { useState, useEffect } from "react"

// Tipos para o sistema de fidelidade
export type Customer = {
  id: string
  name: string
  email: string
  phone: string
  document?: string
  birthDate?: string
  address?: string
  city?: string
  state?: string
  postalCode?: string
  notes?: string
  createdAt: string
  updatedAt: string
  points: number
  totalSpent: number
  purchaseCount: number
  lastPurchaseDate?: string
  tags: string[]
  status: "active" | "inactive"
}

export type LoyaltyTransaction = {
  id: string
  customerId: string
  type: "earn" | "redeem" | "expire" | "adjust"
  points: number
  balance: number
  description: string
  saleId?: string
  createdAt: string
  expiresAt?: string
}

export type LoyaltyProgram = {
  enabled: boolean
  pointsPerCurrency: number // Pontos por unidade monetária (ex: 1 ponto a cada R$ 1,00)
  minimumPurchase: number // Valor mínimo para ganhar pontos
  pointsValidity: number // Validade dos pontos em dias
  redemptionRate: number // Valor de cada ponto na hora de resgatar (ex: R$ 0,05 por ponto)
  minimumRedemption: number // Quantidade mínima de pontos para resgate
  welcomeBonus: number // Pontos de boas-vindas para novos clientes
  birthdayBonus: number // Pontos de aniversário
}

// Função para verificar se estamos no navegador
const isBrowser = () => typeof window !== "undefined"

// Obter configuração do programa de fidelidade
export const getLoyaltyProgram = (): LoyaltyProgram => {
  if (!isBrowser()) return defaultLoyaltyProgram

  const stored = localStorage.getItem("loyaltyProgram")
  if (!stored) return defaultLoyaltyProgram

  try {
    return JSON.parse(stored)
  } catch (e) {
    console.error("Erro ao analisar programa de fidelidade", e)
    return defaultLoyaltyProgram
  }
}

// Salvar configuração do programa de fidelidade
export const saveLoyaltyProgram = (program: LoyaltyProgram): void => {
  if (!isBrowser()) return
  localStorage.setItem("loyaltyProgram", JSON.stringify(program))
}

// Configuração padrão do programa de fidelidade
const defaultLoyaltyProgram: LoyaltyProgram = {
  enabled: false,
  pointsPerCurrency: 1,
  minimumPurchase: 10,
  pointsValidity: 365,
  redemptionRate: 0.05,
  minimumRedemption: 100,
  welcomeBonus: 50,
  birthdayBonus: 100,
}

// Obter clientes
export const getCustomers = (): Customer[] => {
  if (!isBrowser()) return []

  const stored = localStorage.getItem("customers")
  if (!stored) return []

  try {
    return JSON.parse(stored)
  } catch (e) {
    console.error("Erro ao analisar clientes", e)
    return []
  }
}

// Salvar clientes
export const saveCustomers = (customers: Customer[]): void => {
  if (!isBrowser()) return
  localStorage.setItem("customers", JSON.stringify(customers))
}

// Obter cliente por ID
export const getCustomerById = (id: string): Customer | undefined => {
  const customers = getCustomers()
  return customers.find((c) => c.id === id)
}

// Adicionar ou atualizar cliente
export const saveCustomer = (customer: Customer): Customer => {
  const customers = getCustomers()
  const now = new Date().toISOString()

  // Verificar se é um novo cliente ou atualização
  const isNew = !customer.id

  // Preparar cliente para salvar
  const customerToSave: Customer = {
    ...customer,
    id: customer.id || `customer_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    createdAt: customer.createdAt || now,
    updatedAt: now,
    points: isNew ? getLoyaltyProgram().welcomeBonus || 0 : customer.points,
    totalSpent: customer.totalSpent || 0,
    purchaseCount: customer.purchaseCount || 0,
    tags: customer.tags || [],
    status: customer.status || "active",
  }

  // Adicionar ou atualizar no array
  if (isNew) {
    customers.push(customerToSave)

    // Registrar transação de bônus de boas-vindas se aplicável
    if (getLoyaltyProgram().welcomeBonus > 0) {
      addLoyaltyTransaction({
        customerId: customerToSave.id,
        type: "earn",
        points: getLoyaltyProgram().welcomeBonus,
        balance: getLoyaltyProgram().welcomeBonus,
        description: "Bônus de boas-vindas",
      })
    }
  } else {
    const index = customers.findIndex((c) => c.id === customer.id)
    if (index >= 0) {
      customers[index] = customerToSave
    } else {
      customers.push(customerToSave)
    }
  }

  // Salvar clientes atualizados
  saveCustomers(customers)

  return customerToSave
}

// Obter transações de fidelidade
export const getLoyaltyTransactions = (): LoyaltyTransaction[] => {
  if (!isBrowser()) return []

  const stored = localStorage.getItem("loyaltyTransactions")
  if (!stored) return []

  try {
    return JSON.parse(stored)
  } catch (e) {
    console.error("Erro ao analisar transações de fidelidade", e)
    return []
  }
}

// Salvar transações de fidelidade
export const saveLoyaltyTransactions = (transactions: LoyaltyTransaction[]): void => {
  if (!isBrowser()) return
  localStorage.setItem("loyaltyTransactions", JSON.stringify(transactions))
}

// Adicionar transação de fidelidade
export const addLoyaltyTransaction = (transaction: Partial<LoyaltyTransaction>): LoyaltyTransaction => {
  const transactions = getLoyaltyTransactions()
  const now = new Date().toISOString()

  // Obter cliente
  const customer = getCustomerById(transaction.customerId!)
  if (!customer) {
    throw new Error(`Cliente não encontrado: ${transaction.customerId}`)
  }

  // Calcular novo saldo
  const currentBalance = customer.points
  const points = transaction.points || 0
  const newBalance =
    transaction.type === "earn" || transaction.type === "adjust" ? currentBalance + points : currentBalance - points

  // Calcular data de expiração se for uma transação de ganho de pontos
  let expiresAt: string | undefined = undefined
  if (transaction.type === "earn") {
    const program = getLoyaltyProgram()
    if (program.pointsValidity > 0) {
      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + program.pointsValidity)
      expiresAt = expiryDate.toISOString()
    }
  }

  // Criar transação completa
  const newTransaction: LoyaltyTransaction = {
    id: `loyalty_tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    customerId: transaction.customerId!,
    type: transaction.type || "earn",
    points,
    balance: newBalance,
    description: transaction.description || "",
    saleId: transaction.saleId,
    createdAt: now,
    expiresAt,
  }

  // Adicionar à lista de transações
  transactions.unshift(newTransaction)
  saveLoyaltyTransactions(transactions)

  // Atualizar saldo do cliente
  customer.points = newBalance
  saveCustomer(customer)

  return newTransaction
}

// Calcular pontos para uma venda
export const calculatePointsForSale = (saleAmount: number): number => {
  const program = getLoyaltyProgram()

  if (!program.enabled || saleAmount < program.minimumPurchase) {
    return 0
  }

  return Math.floor(saleAmount * program.pointsPerCurrency)
}

// Calcular valor de resgate para pontos
export const calculateRedemptionValue = (points: number): number => {
  const program = getLoyaltyProgram()

  if (!program.enabled || points < program.minimumRedemption) {
    return 0
  }

  return points * program.redemptionRate
}

// Registrar pontos para uma venda
export const registerPointsForSale = (
  customerId: string,
  saleAmount: number,
  saleId: string,
): LoyaltyTransaction | null => {
  const program = getLoyaltyProgram()

  if (!program.enabled || !customerId) {
    return null
  }

  const pointsEarned = calculatePointsForSale(saleAmount)
  if (pointsEarned <= 0) {
    return null
  }

  // Registrar transação de pontos
  return addLoyaltyTransaction({
    customerId,
    type: "earn",
    points: pointsEarned,
    description: `Pontos da compra #${saleId}`,
    saleId,
  })
}

// Resgatar pontos
export const redeemPoints = (customerId: string, points: number, description: string): LoyaltyTransaction => {
  const program = getLoyaltyProgram()

  if (!program.enabled) {
    throw new Error("Programa de fidelidade não está ativado")
  }

  const customer = getCustomerById(customerId)
  if (!customer) {
    throw new Error(`Cliente não encontrado: ${customerId}`)
  }

  if (points < program.minimumRedemption) {
    throw new Error(`Resgate mínimo é de ${program.minimumRedemption} pontos`)
  }

  if (customer.points < points) {
    throw new Error(`Cliente possui apenas ${customer.points} pontos`)
  }

  // Registrar transação de resgate
  return addLoyaltyTransaction({
    customerId,
    type: "redeem",
    points,
    description: description || "Resgate de pontos",
  })
}

// Hook para gerenciar clientes e fidelidade
export function useLoyalty() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [program, setProgram] = useState<LoyaltyProgram>(defaultLoyaltyProgram)
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([])

  // Carregar dados
  useEffect(() => {
    if (!isBrowser()) return

    setCustomers(getCustomers())
    setProgram(getLoyaltyProgram())
    setTransactions(getLoyaltyTransactions())
  }, [])

  // Atualizar programa de fidelidade
  const updateProgram = (newProgram: Partial<LoyaltyProgram>) => {
    const updatedProgram = { ...program, ...newProgram }
    setProgram(updatedProgram)
    saveLoyaltyProgram(updatedProgram)
  }

  // Adicionar ou atualizar cliente
  const upsertCustomer = (customer: Customer) => {
    const savedCustomer = saveCustomer(customer)
    setCustomers(getCustomers())
    return savedCustomer
  }

  // Registrar pontos para venda
  const registerSalePoints = (customerId: string, saleAmount: number, saleId: string) => {
    const transaction = registerPointsForSale(customerId, saleAmount, saleId)
    if (transaction) {
      setTransactions(getLoyaltyTransactions())
      setCustomers(getCustomers())
    }
    return transaction
  }

  // Resgatar pontos
  const redeem = (customerId: string, points: number, description: string) => {
    const transaction = redeemPoints(customerId, points, description)
    setTransactions(getLoyaltyTransactions())
    setCustomers(getCustomers())
    return transaction
  }

  // Verificar aniversariantes do dia e conceder bônus
  const checkBirthdayBonuses = () => {
    if (!program.enabled || program.birthdayBonus <= 0) return []

    const today = new Date()
    const todayMonth = today.getMonth() + 1
    const todayDay = today.getDate()

    const birthdayCustomers = customers.filter((customer) => {
      if (!customer.birthDate) return false

      const birthDate = new Date(customer.birthDate)
      return birthDate.getMonth() + 1 === todayMonth && birthDate.getDate() === todayDay
    })

    const transactions: LoyaltyTransaction[] = []

    birthdayCustomers.forEach((customer) => {
      // Verificar se já recebeu bônus de aniversário hoje
      const alreadyReceived = getLoyaltyTransactions().some(
        (tx) =>
          tx.customerId === customer.id &&
          tx.description.includes("Bônus de aniversário") &&
          new Date(tx.createdAt).toDateString() === today.toDateString(),
      )

      if (!alreadyReceived) {
        const transaction = addLoyaltyTransaction({
          customerId: customer.id,
          type: "earn",
          points: program.birthdayBonus,
          description: "Bônus de aniversário",
        })

        transactions.push(transaction)
      }
    })

    if (transactions.length > 0) {
      setTransactions(getLoyaltyTransactions())
      setCustomers(getCustomers())
    }

    return transactions
  }

  return {
    customers,
    program,
    transactions,
    updateProgram,
    upsertCustomer,
    registerSalePoints,
    redeem,
    checkBirthdayBonuses,
    getCustomerById,
    calculatePointsForSale,
    calculateRedemptionValue,
  }
}


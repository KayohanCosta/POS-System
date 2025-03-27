// Initialize data in localStorage if it doesn't exist
export const initializeData = () => {
  // Initialize products
  if (!localStorage.getItem("products")) {
    localStorage.setItem(
      "products",
      JSON.stringify([
        {
          id: "1",
          name: "Smartphone XYZ",
          description: "Smartphone de última geração",
          price: 1999.99,
          stock: 10,
        },
        {
          id: "2",
          name: "Carregador USB-C",
          description: "Carregador rápido para smartphones",
          price: 89.9,
          stock: 25,
        },
        {
          id: "3",
          name: "Película de Vidro",
          description: "Proteção para tela de smartphone",
          price: 29.9,
          stock: 50,
        },
      ]),
    )
  }

  // Initialize service orders
  if (!localStorage.getItem("serviceOrders")) {
    localStorage.setItem("serviceOrders", JSON.stringify([]))
  }

  // Initialize transactions
  if (!localStorage.getItem("transactions")) {
    localStorage.setItem("transactions", JSON.stringify([]))
  }

  // Initialize cash register
  if (!localStorage.getItem("cashRegister")) {
    localStorage.setItem(
      "cashRegister",
      JSON.stringify({
        isOpen: false,
        balance: 0,
        openedAt: null,
        closedAt: null,
      }),
    )
  }

  // Initialize users if they don't exist
  if (!localStorage.getItem("users")) {
    const defaultAdmin = {
      id: "1",
      username: "admin",
      password: "admin",
      name: "Administrador",
      email: "admin@example.com",
      role: "admin",
      active: true,
      lastLogin: new Date().toISOString(),
    }
    localStorage.setItem("users", JSON.stringify([defaultAdmin]))
  }

  // Initialize roles if they don't exist
  if (!localStorage.getItem("roles")) {
    const defaultPermissions = [
      "dashboard_view",
      "cash_register_view",
      "cash_register_open",
      "cash_register_sell",
      "products_view",
      "products_manage",
      "service_orders_view",
      "service_orders_manage",
      "reports_view",
      "settings_view",
      "users_manage",
      "roles_manage",
    ]

    const defaultRoles = [
      {
        id: "admin",
        name: "Administrador",
        description: "Acesso completo ao sistema",
        permissions: defaultPermissions,
      },
      {
        id: "manager",
        name: "Gerente",
        description: "Gerencia operações, sem acesso a configurações",
        permissions: [
          "dashboard_view",
          "cash_register_view",
          "cash_register_open",
          "cash_register_sell",
          "products_view",
          "products_manage",
          "service_orders_view",
          "service_orders_manage",
          "reports_view",
        ],
      },
      {
        id: "cashier",
        name: "Caixa",
        description: "Operador de caixa",
        permissions: ["dashboard_view", "cash_register_view", "cash_register_sell"],
      },
    ]
    localStorage.setItem("roles", JSON.stringify(defaultRoles))
  }

  // Initialize company settings
  const companySettings = JSON.parse(localStorage.getItem("companySettings") || "null")
  if (!companySettings) {
    localStorage.setItem(
      "companySettings",
      JSON.stringify({
        name: "Tecno Mania",
        logoUrl: "/images/logo.png",
        businessType: "retail",
        features: {
          inventory: true,
          kitchen: true,
          tables: true,
          delivery: true,
          serviceOrders: true,
        },
      }),
    )
  }
}

// Cash register functions
export const getCashRegisterStatus = () => {
  return JSON.parse(localStorage.getItem("cashRegister") || '{"isOpen": false, "balance": 0, "openedAt": null}')
}

export const openCashRegister = (initialAmount: number) => {
  const cashRegister = {
    isOpen: true,
    balance: initialAmount,
    openedAt: new Date().toISOString(),
    closedAt: null,
  }
  localStorage.setItem("cashRegister", JSON.stringify(cashRegister))
  return cashRegister
}

export const closeCashRegister = (closingAmount: number) => {
  const cashRegister = getCashRegisterStatus()
  const updatedCashRegister = {
    isOpen: false,
    balance: closingAmount,
    openedAt: cashRegister.openedAt,
    closedAt: new Date().toISOString(),
  }
  localStorage.setItem("cashRegister", JSON.stringify(updatedCashRegister))
  return updatedCashRegister
}

// Transaction functions
export const addTransaction = (transaction: any) => {
  const transactions = JSON.parse(localStorage.getItem("transactions") || "[]")
  transactions.unshift(transaction)
  localStorage.setItem("transactions", JSON.stringify(transactions))

  // Update cash register balance
  const cashRegister = getCashRegisterStatus()
  if (cashRegister.isOpen) {
    // Se tiver múltiplos métodos de pagamento
    if (transaction.paymentMethods) {
      // Adicionar apenas o valor pago em dinheiro ao caixa
      const cashPayment = transaction.paymentMethods.find((p: any) => p.method === "Dinheiro")
      if (cashPayment) {
        cashRegister.balance += cashPayment.amount
      }
    } else if (transaction.paymentMethod === "Dinheiro") {
      // Compatibilidade com o formato antigo
      cashRegister.balance += transaction.total
    }

    localStorage.setItem("cashRegister", JSON.stringify(cashRegister))
  }

  // Update product stock
  const products = JSON.parse(localStorage.getItem("products") || "[]")
  transaction.products.forEach((item: any) => {
    const productIndex = products.findIndex((p: any) => p.id === item.id)
    if (productIndex !== -1) {
      products[productIndex].stock -= item.quantity
    }
  })
  localStorage.setItem("products", JSON.stringify(products))

  return transaction
}

// Função para cancelar uma transação
export const cancelTransaction = (transactionId: string) => {
  const transactions = JSON.parse(localStorage.getItem("transactions") || "[]")
  const transactionIndex = transactions.findIndex((t: any) => t.id === transactionId)

  if (transactionIndex === -1) {
    throw new Error("Transação não encontrada")
  }

  const transaction = transactions[transactionIndex]

  // Verificar se a transação já foi cancelada
  if (transaction.canceled) {
    throw new Error("Esta venda já foi cancelada")
  }

  // Marcar a transação como cancelada
  transaction.canceled = true
  transaction.canceledAt = new Date().toISOString()

  // Atualizar a lista de transações
  transactions[transactionIndex] = transaction
  localStorage.setItem("transactions", JSON.stringify(transactions))

  // Atualizar o estoque dos produtos (devolver ao estoque)
  const products = JSON.parse(localStorage.getItem("products") || "[]")
  transaction.products.forEach((item: any) => {
    const productIndex = products.findIndex((p: any) => p.id === item.id)
    if (productIndex !== -1) {
      products[productIndex].stock += item.quantity
    }
  })

  localStorage.setItem("products", JSON.stringify(products))

  // Se a transação foi em dinheiro, atualizar o saldo do caixa
  const cashRegister = getCashRegisterStatus()
  if (cashRegister.isOpen) {
    // Se tiver múltiplos métodos de pagamento
    if (transaction.paymentMethods) {
      // Remover apenas o valor pago em dinheiro do caixa
      const cashPayment = transaction.paymentMethods.find((p: any) => p.method === "Dinheiro")
      if (cashPayment) {
        cashRegister.balance -= cashPayment.amount
      }
    } else if (transaction.paymentMethod === "Dinheiro") {
      // Compatibilidade com o formato antigo
      cashRegister.balance -= transaction.total
    }

    localStorage.setItem("cashRegister", JSON.stringify(cashRegister))
  }

  console.log("Transação cancelada com sucesso:", transaction)
  return transaction
}

// Sales report functions
export const getTodaySales = () => {
  const transactions = JSON.parse(localStorage.getItem("transactions") || "[]")
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return transactions
    .filter((t: any) => new Date(t.date) >= today && !t.canceled) // Excluir vendas canceladas
    .reduce((sum: number, t: any) => sum + t.total, 0)
}

export const getWeekSales = () => {
  const transactions = JSON.parse(localStorage.getItem("transactions") || "[]")
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  return transactions
    .filter((t: any) => new Date(t.date) >= weekAgo && !t.canceled) // Excluir vendas canceladas
    .reduce((sum: number, t: any) => sum + t.total, 0)
}

export const getMonthSales = () => {
  const transactions = JSON.parse(localStorage.getItem("transactions") || "[]")
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  return transactions
    .filter((t: any) => new Date(t.date) >= startOfMonth && !t.canceled) // Excluir vendas canceladas
    .reduce((sum: number, t: any) => sum + t.total, 0)
}


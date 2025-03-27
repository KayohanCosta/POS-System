import { Chart } from "@/components/ui/chart"
// Inicialização do aplicativo
document.addEventListener("DOMContentLoaded", () => {
  // Verificar suporte a localStorage
  if (!storageAvailable("localStorage")) {
    alert("Seu navegador não suporta localStorage. O sistema não funcionará corretamente.")
    return
  }

  // Inicializar data atual
  updateCurrentDate()

  // Carregar dados do localStorage
  loadAllData()

  // Inicializar navegação
  initNavigation()

  // Inicializar controle de caixa
  initCaixaControls()

  // Inicializar vendas
  initVendas()

  // Inicializar produtos
  initProdutos()

  // Inicializar ordens de serviço
  initOrdens()

  // Inicializar relatórios
  initRelatorios()

  // Atualizar dashboard
  updateDashboard()

  console.log("Sistema de Caixa inicializado com sucesso!")
})

// Verificar disponibilidade de localStorage
function storageAvailable(type) {
  try {
    var storage = window[type],
      x = "__storage_test__"
    storage.setItem(x, x)
    storage.removeItem(x)
    return true
  } catch (e) {
    return false
  }
}

// Funções de inicialização
function updateCurrentDate() {
  const now = new Date()
  document.getElementById("current-date").textContent = now.toLocaleDateString()

  // Definir valores padrão para inputs de data
  document.getElementById("data-relatorio-diario").valueAsDate = now

  const currentWeek = getWeekNumber(now)
  document.getElementById("semana-relatorio").value = `${now.getFullYear()}-W${currentWeek.toString().padStart(2, "0")}`

  document.getElementById("mes-relatorio").value =
    `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}`
}

function getWeekNumber(d) {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7)
}

function loadAllData() {
  // Verificar se é a primeira execução e inicializar dados
  if (!localStorage.getItem("produtos")) {
    initializeDefaultData()
  }
}

function initializeDefaultData() {
  // Produtos padrão
  const defaultProdutos = [
    {
      id: 1,
      codigo: "P001",
      nome: "Mouse Gamer RGB",
      categoria: "perifericos",
      preco: 89.9,
      estoque: 15,
      estoqueMinimo: 5,
      descricao: "Mouse gamer com iluminação RGB e 6 botões programáveis.",
    },
    {
      id: 2,
      codigo: "P002",
      nome: "Teclado Mecânico",
      categoria: "perifericos",
      preco: 249.9,
      estoque: 8,
      estoqueMinimo: 3,
      descricao: "Teclado mecânico com switches blue e iluminação RGB.",
    },
    {
      id: 3,
      codigo: "P003",
      nome: "SSD 240GB",
      categoria: "hardware",
      preco: 199.9,
      estoque: 12,
      estoqueMinimo: 4,
      descricao: "SSD com capacidade de 240GB, interface SATA III.",
    },
    {
      id: 4,
      codigo: "P004",
      nome: "Memória RAM 8GB DDR4",
      categoria: "hardware",
      preco: 219.9,
      estoque: 10,
      estoqueMinimo: 3,
      descricao: "Memória RAM 8GB DDR4 2666MHz.",
    },
    {
      id: 5,
      codigo: "P005",
      nome: "Cabo USB-C",
      categoria: "acessorios",
      preco: 29.9,
      estoque: 20,
      estoqueMinimo: 5,
      descricao: "Cabo USB-C de 1 metro com revestimento em nylon.",
    },
  ]

  // Salvar dados padrão
  localStorage.setItem("produtos", JSON.stringify(defaultProdutos))
  localStorage.setItem("vendas", JSON.stringify([]))
  localStorage.setItem("ordens", JSON.stringify([]))
  localStorage.setItem("caixa", JSON.stringify({ aberto: false, valorInicial: 0, dataAbertura: null }))
  localStorage.setItem("historicoCaixa", JSON.stringify([]))
}

function initNavigation() {
  // Navegação entre páginas
  document.querySelectorAll(".nav-link[data-page]").forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault()
      const targetPage = this.getAttribute("data-page")

      // Atualizar links ativos
      document.querySelectorAll(".nav-link").forEach((el) => el.classList.remove("active"))
      this.classList.add("active")

      // Mostrar página selecionada
      document.querySelectorAll(".page-container").forEach((page) => {
        page.classList.remove("active")
      })
      document.getElementById(targetPage).classList.add("active")

      // Atualizar título da página
      document.getElementById("page-title").textContent = this.textContent.trim()
    })
  })
}

// Controle de Caixa
function initCaixaControls() {
  const btnAbrirCaixa = document.getElementById("btn-abrir-caixa")
  const btnFecharCaixa = document.getElementById("btn-fechar-caixa")
  const statusCaixa = document.getElementById("status-caixa")
  const formAberturaCaixa = document.getElementById("form-abertura-caixa")
  const formFechamentoCaixa = document.getElementById("form-fechamento-caixa")

  // Verificar estado do caixa
  const caixa = JSON.parse(localStorage.getItem("caixa"))
  if (caixa && caixa.aberto) {
    statusCaixa.textContent = "Caixa Aberto"
    statusCaixa.classList.remove("bg-danger")
    statusCaixa.classList.add("bg-success")
    btnAbrirCaixa.disabled = true
    btnFecharCaixa.disabled = false

    // Atualizar valor no sistema para fechamento
    const valorSistema = calcularValorSistema()
    document.getElementById("valor-sistema").value = formatarMoeda(valorSistema)
  } else {
    statusCaixa.textContent = "Caixa Fechado"
    statusCaixa.classList.remove("bg-success")
    statusCaixa.classList.add("bg-danger")
    btnAbrirCaixa.disabled = false
    btnFecharCaixa.disabled = true
  }

  // Evento de abertura de caixa
  btnAbrirCaixa.addEventListener("click", () => {
    const navLinks = document.querySelectorAll(".nav-link")
    navLinks.forEach((link) => {
      if (link.getAttribute("data-page") === "caixa") {
        link.click()
      }
    })
  })

  // Evento de fechamento de caixa
  btnFecharCaixa.addEventListener("click", () => {
    const navLinks = document.querySelectorAll(".nav-link")
    navLinks.forEach((link) => {
      if (link.getAttribute("data-page") === "caixa") {
        link.click()
      }
    })

    // Atualizar valor no sistema para fechamento
    const valorSistema = calcularValorSistema()
    document.getElementById("valor-sistema").value = formatarMoeda(valorSistema)
  })

  // Formulário de abertura de caixa
  formAberturaCaixa.addEventListener("submit", (e) => {
    e.preventDefault()

    const valorInicial = Number.parseFloat(document.getElementById("valor-inicial").value)
    const observacao = document.getElementById("observacao-abertura").value

    // Validar valor inicial
    if (isNaN(valorInicial) || valorInicial < 0) {
      alert("Por favor, informe um valor inicial válido.")
      return
    }

    try {
      // Salvar abertura de caixa
      const dataAbertura = new Date()
      const caixa = {
        aberto: true,
        valorInicial: valorInicial,
        dataAbertura: dataAbertura.toISOString(),
      }

      localStorage.setItem("caixa", JSON.stringify(caixa))

      // Registrar no histórico
      const historico = JSON.parse(localStorage.getItem("historicoCaixa")) || []
      historico.push({
        data: dataAbertura.toISOString(),
        operacao: "abertura",
        valorInicial: valorInicial,
        valorFinal: null,
        diferenca: null,
        observacao: observacao,
      })

      localStorage.setItem("historicoCaixa", JSON.stringify(historico))

      // Atualizar UI
      statusCaixa.textContent = "Caixa Aberto"
      statusCaixa.classList.remove("bg-danger")
      statusCaixa.classList.add("bg-success")
      btnAbrirCaixa.disabled = true
      btnFecharCaixa.disabled = false

      // Limpar formulário
      formAberturaCaixa.reset()

      // Atualizar tabela de histórico
      carregarHistoricoCaixa()

      alert("Caixa aberto com sucesso!")
    } catch (e) {
      alert("Erro ao abrir caixa: " + e.message)
    }
  })

  // Formulário de fechamento de caixa
  formFechamentoCaixa.addEventListener("submit", (e) => {
    e.preventDefault()

    const valorSistema = Number.parseFloat(
      document.getElementById("valor-sistema").value.replace("R$", "").replace(".", "").replace(",", "."),
    )
    const valorContagem = Number.parseFloat(document.getElementById("valor-contagem").value)
    const diferenca = valorContagem - valorSistema
    const observacao = document.getElementById("observacao-fechamento").value

    // Salvar fechamento de caixa
    const dataFechamento = new Date()
    const caixa = {
      aberto: false,
      valorInicial: 0,
      dataAbertura: null,
    }

    localStorage.setItem("caixa", JSON.stringify(caixa))

    // Registrar no histórico
    const historico = JSON.parse(localStorage.getItem("historicoCaixa")) || []
    historico.push({
      data: dataFechamento.toISOString(),
      operacao: "fechamento",
      valorInicial: null,
      valorFinal: valorContagem,
      diferenca: diferenca,
      observacao: observacao,
    })

    localStorage.setItem("historicoCaixa", JSON.stringify(historico))

    // Atualizar UI
    statusCaixa.textContent = "Caixa Fechado"
    statusCaixa.classList.remove("bg-success")
    statusCaixa.classList.add("bg-danger")
    btnAbrirCaixa.disabled = false
    btnFecharCaixa.disabled = true

    // Limpar formulário
    formFechamentoCaixa.reset()

    // Atualizar tabela de histórico
    carregarHistoricoCaixa()

    alert("Caixa fechado com sucesso!")
  })

  // Calcular diferença ao digitar valor da contagem
  document.getElementById("valor-contagem").addEventListener("input", function () {
    const valorSistema = Number.parseFloat(
      document.getElementById("valor-sistema").value.replace("R$", "").replace(".", "").replace(",", "."),
    )
    const valorContagem = Number.parseFloat(this.value) || 0
    const diferenca = valorContagem - valorSistema

    document.getElementById("diferenca").value = formatarMoeda(diferenca)

    // Destacar diferença
    if (diferenca < 0) {
      document.getElementById("diferenca").classList.add("text-danger")
      document.getElementById("diferenca").classList.remove("text-success")
    } else if (diferenca > 0) {
      document.getElementById("diferenca").classList.add("text-success")
      document.getElementById("diferenca").classList.remove("text-danger")
    } else {
      document.getElementById("diferenca").classList.remove("text-danger")
      document.getElementById("diferenca").classList.remove("text-success")
    }
  })

  // Carregar histórico de caixa
  carregarHistoricoCaixa()
}

function calcularValorSistema() {
  const caixa = JSON.parse(localStorage.getItem("caixa"))
  const vendas = JSON.parse(localStorage.getItem("vendas")) || []

  let valorSistema = caixa.valorInicial

  // Somar vendas em dinheiro
  const dataAbertura = new Date(caixa.dataAbertura)

  vendas.forEach((venda) => {
    const dataVenda = new Date(venda.data)
    if (dataVenda >= dataAbertura && venda.metodoPagamento === "dinheiro") {
      valorSistema += venda.total
    }
  })

  return valorSistema
}

function carregarHistoricoCaixa() {
  const historico = JSON.parse(localStorage.getItem("historicoCaixa")) || []
  const tbody = document.getElementById("historico-caixa-table").getElementsByTagName("tbody")[0]

  // Limpar tabela
  tbody.innerHTML = ""

  // Adicionar registros em ordem cronológica inversa (mais recentes primeiro)
  historico
    .slice()
    .reverse()
    .forEach((registro) => {
      const tr = document.createElement("tr")

      const data = new Date(registro.data)

      tr.innerHTML = `
    <td>${data.toLocaleDateString()}</td>
    <td>${data.toLocaleTimeString()}</td>
    <td>${registro.operacao === "abertura" ? "Abertura" : "Fechamento"}</td>
    <td>${registro.valorInicial !== null ? formatarMoeda(registro.valorInicial) : "-"}</td>
    <td>${registro.valorFinal !== null ? formatarMoeda(registro.valorFinal) : "-"}</td>
    <td>${registro.diferenca !== null ? formatarMoeda(registro.diferenca) : "-"}</td>
    <td>${registro.observacao || "-"}</td>
  `

      tbody.appendChild(tr)
    })
}

// Vendas
function initVendas() {
  const btnBuscarProduto = document.getElementById("btn-buscar-produto")
  const inputBuscaProduto = document.getElementById("busca-produto")
  const btnLimparCarrinho = document.getElementById("limpar-carrinho")
  const selectMetodoPagamento = document.getElementById("metodo-pagamento")
  const inputValorRecebido = document.getElementById("valor-recebido")
  const btnFinalizarVenda = document.getElementById("btn-finalizar-venda")
  const btnCancelarVenda = document.getElementById("btn-cancelar-venda")
  const formPagamento = document.getElementById("form-pagamento")

  // Buscar produto
  btnBuscarProduto.addEventListener("click", buscarProdutos)
  inputBuscaProduto.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault()
      buscarProdutos()
    }
  })

  // Limpar carrinho
  btnLimparCarrinho.addEventListener("click", () => {
    if (confirm("Deseja realmente limpar o carrinho?")) {
      limparCarrinho()
    }
  })

  // Método de pagamento
  selectMetodoPagamento.addEventListener("change", function () {
    const metodoPagamento = this.value

    // Mostrar/esconder campos específicos
    if (metodoPagamento === "dinheiro") {
      document.getElementById("div-valor-recebido").style.display = "block"
      document.getElementById("div-troco").style.display = "block"
      document.getElementById("div-parcelas").style.display = "none"
      document.getElementById("div-pix").style.display = "none"
    } else if (metodoPagamento === "credito") {
      document.getElementById("div-valor-recebido").style.display = "none"
      document.getElementById("div-troco").style.display = "none"
      document.getElementById("div-parcelas").style.display = "block"
      document.getElementById("div-pix").style.display = "none"
    } else if (metodoPagamento === "pix") {
      document.getElementById("div-valor-recebido").style.display = "none"
      document.getElementById("div-troco").style.display = "none"
      document.getElementById("div-parcelas").style.display = "none"
      document.getElementById("div-pix").style.display = "block"
    } else {
      document.getElementById("div-valor-recebido").style.display = "none"
      document.getElementById("div-troco").style.display = "none"
      document.getElementById("div-parcelas").style.display = "none"
      document.getElementById("div-pix").style.display = "none"
    }

    // Habilitar botão de finalizar venda se tiver método selecionado e itens no carrinho
    const carrinho = obterCarrinho()
    btnFinalizarVenda.disabled = metodoPagamento === "" || carrinho.length === 0
  })

  // Calcular troco
  inputValorRecebido.addEventListener("input", function () {
    const valorRecebido = Number.parseFloat(this.value) || 0
    const totalCarrinho = calcularTotalCarrinho()
    const troco = valorRecebido - totalCarrinho

    document.getElementById("troco").value = formatarMoeda(troco >= 0 ? troco : 0)

    // Destacar troco
    const trocoElement = document.getElementById("troco")
    if (troco < 0) {
      trocoElement.classList.add("bg-danger", "text-white")
    } else {
      trocoElement.classList.remove("bg-danger", "text-white")
    }
  })

  // Finalizar venda
  formPagamento.addEventListener("submit", (e) => {
    e.preventDefault()

    // Verificar se o caixa está aberto
    const caixa = JSON.parse(localStorage.getItem("caixa"))
    if (!caixa || !caixa.aberto) {
      alert("O caixa precisa estar aberto para realizar vendas!")
      return
    }

    const metodoPagamento = selectMetodoPagamento.value
    const carrinho = obterCarrinho()

    if (carrinho.length === 0) {
      alert("Adicione produtos ao carrinho para finalizar a venda!")
      return
    }

    // Verificar valor recebido para pagamento em dinheiro
    if (metodoPagamento === "dinheiro") {
      const valorRecebido = Number.parseFloat(inputValorRecebido.value) || 0
      const totalCarrinho = calcularTotalCarrinho()

      if (valorRecebido < totalCarrinho) {
        alert("O valor recebido é menor que o total da venda!")
        return
      }
    }

    try {
      // Criar venda
      const vendas = JSON.parse(localStorage.getItem("vendas")) || []
      const novaVenda = {
        id: Date.now(),
        data: new Date().toISOString(),
        itens: carrinho,
        total: calcularTotalCarrinho(),
        metodoPagamento: metodoPagamento,
        parcelas: metodoPagamento === "credito" ? Number.parseInt(document.getElementById("parcelas").value) : null,
      }

      // Atualizar estoque
      const produtos = JSON.parse(localStorage.getItem("produtos"))
      carrinho.forEach((item) => {
        const produto = produtos.find((p) => p.id === item.produto.id)
        if (produto) {
          produto.estoque -= item.quantidade
        }
      })

      // Salvar alterações
      vendas.push(novaVenda)
      localStorage.setItem("vendas", JSON.stringify(vendas))
      localStorage.setItem("produtos", JSON.stringify(produtos))

      // Limpar carrinho e formulário
      limparCarrinho()
      formPagamento.reset()

      // Resetar campos
      document.getElementById("div-valor-recebido").style.display = "none"
      document.getElementById("div-troco").style.display = "none"
      document.getElementById("div-parcelas").style.display = "none"
      document.getElementById("div-pix").style.display = "none"

      // Desabilitar botão
      btnFinalizarVenda.disabled = true

      // Atualizar dashboard
      updateDashboard()

      // Mostrar mensagem de sucesso
      alert("Venda finalizada com sucesso!")

      // Perguntar se deseja imprimir comprovante
      if (confirm("Deseja imprimir o comprovante?")) {
        imprimirVenda(novaVenda)
      }
    } catch (e) {
      alert("Erro ao finalizar venda: " + e.message)
    }
  })

  // Cancelar venda
  btnCancelarVenda.addEventListener("click", () => {
    if (confirm("Deseja realmente cancelar a venda?")) {
      limparCarrinho()
      formPagamento.reset()

      // Resetar campos
      document.getElementById("div-valor-recebido").style.display = "none"
      document.getElementById("div-troco").style.display = "none"
      document.getElementById("div-parcelas").style.display = "none"
      document.getElementById("div-pix").style.display = "none"

      // Desabilitar botão
      btnFinalizarVenda.disabled = true
    }
  })

  // Inicializar carrinho
  atualizarTabelaCarrinho()
}

function buscarProdutos() {
  const termo = document.getElementById("busca-produto").value.toLowerCase()
  const produtos = JSON.parse(localStorage.getItem("produtos")) || []
  const tbody = document.getElementById("resultados-produtos").getElementsByTagName("tbody")[0]

  // Limpar resultados anteriores
  tbody.innerHTML = ""

  // Filtrar produtos
  const resultados = produtos.filter(
    (produto) => produto.nome.toLowerCase().includes(termo) || produto.codigo.toLowerCase().includes(termo),
  )

  // Exibir resultados
  resultados.forEach((produto) => {
    const tr = document.createElement("tr")

    tr.innerHTML = `
    <td>${produto.codigo}</td>
    <td>${produto.nome}</td>
    <td>${formatarMoeda(produto.preco)}</td>
    <td>${produto.estoque}</td>
    <td>
      <button class="btn btn-sm btn-primary btn-add-carrinho" data-id="${produto.id}">
        <i class="bi bi-cart-plus"></i>
      </button>
    </td>
  `

    tbody.appendChild(tr)
  })

  // Adicionar evento aos botões
  document.querySelectorAll(".btn-add-carrinho").forEach((btn) => {
    btn.addEventListener("click", function () {
      const produtoId = Number.parseInt(this.getAttribute("data-id"))
      adicionarAoCarrinho(produtoId)
    })
  })
}

function adicionarAoCarrinho(produtoId) {
  const produtos = JSON.parse(localStorage.getItem("produtos")) || []
  const produto = produtos.find((p) => p.id === produtoId)

  if (!produto) {
    alert("Produto não encontrado!")
    return
  }

  if (produto.estoque <= 0) {
    alert("Produto sem estoque disponível!")
    return
  }

  // Verificar se o caixa está aberto
  const caixa = JSON.parse(localStorage.getItem("caixa"))
  if (!caixa || !caixa.aberto) {
    alert("O caixa precisa estar aberto para realizar vendas!")
    return
  }

  // Obter carrinho atual
  const carrinho = obterCarrinho()

  // Verificar se o produto já está no carrinho
  const itemExistente = carrinho.find((item) => item.produto.id === produtoId)

  if (itemExistente) {
    // Verificar estoque
    if (itemExistente.quantidade >= produto.estoque) {
      alert("Quantidade máxima atingida para este produto!")
      return
    }

    // Incrementar quantidade
    itemExistente.quantidade++
  } else {
    // Adicionar novo item
    carrinho.push({
      produto: produto,
      quantidade: 1,
    })
  }

  // Salvar carrinho
  localStorage.setItem("carrinho", JSON.stringify(carrinho))

  // Atualizar tabela
  atualizarTabelaCarrinho()

  // Habilitar botão de finalizar venda se tiver método selecionado
  const metodoPagamento = document.getElementById("metodo-pagamento").value
  document.getElementById("btn-finalizar-venda").disabled = metodoPagamento === ""
}

function removerDoCarrinho(index) {
  const carrinho = obterCarrinho()

  // Remover item
  carrinho.splice(index, 1)

  // Salvar carrinho
  localStorage.setItem("carrinho", JSON.stringify(carrinho))

  // Atualizar tabela
  atualizarTabelaCarrinho()

  // Desabilitar botão de finalizar venda se carrinho vazio
  if (carrinho.length === 0) {
    document.getElementById("btn-finalizar-venda").disabled = true
  }
}

function atualizarQuantidadeCarrinho(index, delta) {
  const carrinho = obterCarrinho()
  const item = carrinho[index]

  // Verificar limites
  if (delta < 0 && item.quantidade <= 1) {
    if (confirm("Deseja remover este item do carrinho?")) {
      removerDoCarrinho(index)
    }
    return
  }

  // Verificar estoque
  if (delta > 0 && item.quantidade >= item.produto.estoque) {
    alert("Quantidade máxima atingida para este produto!")
    return
  }

  // Atualizar quantidade
  item.quantidade += delta

  // Salvar carrinho
  localStorage.setItem("carrinho", JSON.stringify(carrinho))

  // Atualizar tabela
  atualizarTabelaCarrinho()
}

function atualizarTabelaCarrinho() {
  const carrinho = obterCarrinho()
  const tbody = document.getElementById("carrinho-table").getElementsByTagName("tbody")[0]
  const totalElement = document.getElementById("carrinho-total")

  // Limpar tabela
  tbody.innerHTML = ""

  // Adicionar itens
  carrinho.forEach((item, index) => {
    const tr = document.createElement("tr")
    const subtotal = item.produto.preco * item.quantidade

    tr.innerHTML = `
    <td>${item.produto.nome}</td>
    <td>${formatarMoeda(item.produto.preco)}</td>
    <td>
      <div class="input-group input-group-sm">
        <button class="btn btn-outline-secondary btn-diminuir" data-index="${index}">-</button>
        <input type="text" class="form-control text-center" value="${item.quantidade}" readonly>
        <button class="btn btn-outline-secondary btn-aumentar" data-index="${index}">+</button>
      </div>
    </td>
    <td>${formatarMoeda(subtotal)}</td>
    <td>
      <button class="btn btn-sm btn-danger btn-remover" data-index="${index}">
        <i class="bi bi-trash"></i>
      </button>
    </td>
  `

    tbody.appendChild(tr)
  })

  // Atualizar total
  totalElement.textContent = formatarMoeda(calcularTotalCarrinho())

  // Adicionar eventos aos botões
  document.querySelectorAll(".btn-remover").forEach((btn) => {
    btn.addEventListener("click", function () {
      const index = Number.parseInt(this.getAttribute("data-index"))
      removerDoCarrinho(index)
    })
  })

  document.querySelectorAll(".btn-diminuir").forEach((btn) => {
    btn.addEventListener("click", function () {
      const index = Number.parseInt(this.getAttribute("data-index"))
      atualizarQuantidadeCarrinho(index, -1)
    })
  })

  document.querySelectorAll(".btn-aumentar").forEach((btn) => {
    btn.addEventListener("click", function () {
      const index = Number.parseInt(this.getAttribute("data-index"))
      atualizarQuantidadeCarrinho(index, 1)
    })
  })
}

function obterCarrinho() {
  return JSON.parse(localStorage.getItem("carrinho")) || []
}

function calcularTotalCarrinho() {
  const carrinho = obterCarrinho()
  return carrinho.reduce((total, item) => total + item.produto.preco * item.quantidade, 0)
}

function limparCarrinho() {
  localStorage.setItem("carrinho", JSON.stringify([]))
  atualizarTabelaCarrinho()
}

// Produtos
function initProdutos() {
  const btnSalvarProduto = document.getElementById("btn-salvar-produto")
  const modalProduto = new bootstrap.Modal(document.getElementById("modal-produto"))

  // Carregar tabela de produtos
  carregarTabelaProdutos()

  // Salvar produto
  btnSalvarProduto.addEventListener("click", () => {
    const form = document.getElementById("form-produto")

    // Validar formulário
    if (!form.checkValidity()) {
      form.reportValidity()
      return
    }

    // Obter dados do formulário
    const produtoId = document.getElementById("produto-id").value
    const codigo = document.getElementById("produto-codigo").value
    const nome = document.getElementById("produto-nome").value
    const categoria = document.getElementById("produto-categoria").value
    const preco = Number.parseFloat(document.getElementById("produto-preco").value)
    const estoque = Number.parseInt(document.getElementById("produto-estoque").value)
    const estoqueMinimo = Number.parseInt(document.getElementById("produto-estoque-minimo").value)
    const descricao = document.getElementById("produto-descricao").value

    // Validações adicionais
    if (isNaN(preco) || preco <= 0) {
      alert("Por favor, informe um preço válido.")
      return
    }

    if (isNaN(estoque) || estoque < 0) {
      alert("Por favor, informe um estoque válido.")
      return
    }

    if (isNaN(estoqueMinimo) || estoqueMinimo < 0) {
      alert("Por favor, informe um estoque mínimo válido.")
      return
    }

    // Obter produtos
    const produtos = JSON.parse(localStorage.getItem("produtos")) || []

    // Verificar se é edição ou novo produto
    if (produtoId) {
      // Editar produto existente
      const index = produtos.findIndex((p) => p.id === Number.parseInt(produtoId))
      if (index !== -1) {
        produtos[index] = {
          ...produtos[index],
          codigo,
          nome,
          categoria,
          preco,
          estoque,
          estoqueMinimo,
          descricao,
        }
      }
    } else {
      // Verificar se código já existe
      if (produtos.some((p) => p.codigo === codigo)) {
        alert("Já existe um produto com este código!")
        return
      }

      // Adicionar novo produto
      produtos.push({
        id: Date.now(),
        codigo,
        nome,
        categoria,
        preco,
        estoque,
        estoqueMinimo,
        descricao,
      })
    }

    // Salvar produtos
    try {
      localStorage.setItem("produtos", JSON.stringify(produtos))

      // Atualizar tabela
      carregarTabelaProdutos()

      // Fechar modal
      modalProduto.hide()

      // Limpar formulário
      form.reset()
      document.getElementById("produto-id").value = ""

      // Atualizar dashboard
      updateDashboard()

      // Mostrar mensagem de sucesso
      alert(produtoId ? "Produto atualizado com sucesso!" : "Produto adicionado com sucesso!")
    } catch (e) {
      alert("Erro ao salvar produto: " + e.message)
    }
  })

  // Resetar formulário ao abrir modal para novo produto
  document.getElementById("modal-produto").addEventListener("show.bs.modal", (event) => {
    const button = event.relatedTarget
    const form = document.getElementById("form-produto")

    if (!button || !button.hasAttribute("data-id")) {
      // Novo produto
      document.getElementById("modal-produto-titulo").textContent = "Novo Produto"
      form.reset()
      document.getElementById("produto-id").value = ""
    }
  })
}

function carregarTabelaProdutos() {
  const produtos = JSON.parse(localStorage.getItem("produtos")) || []
  const tbody = document.getElementById("produtos-table").getElementsByTagName("tbody")[0]

  // Limpar tabela
  tbody.innerHTML = ""

  // Adicionar produtos
  produtos.forEach((produto) => {
    const tr = document.createElement("tr")

    // Destacar produtos com estoque baixo
    if (produto.estoque <= produto.estoqueMinimo) {
      tr.classList.add("table-warning")
    }

    tr.innerHTML = `
    <td>${produto.codigo}</td>
    <td>${produto.nome}</td>
    <td>${formatarCategoria(produto.categoria)}</td>
    <td>${formatarMoeda(produto.preco)}</td>
    <td>${produto.estoque}</td>
    <td>
      <button class="btn btn-sm btn-primary btn-editar-produto" data-id="${produto.id}">
        <i class="bi bi-pencil"></i>
      </button>
      <button class="btn btn-sm btn-danger btn-excluir-produto" data-id="${produto.id}">
        <i class="bi bi-trash"></i>
      </button>
    </td>
  `

    tbody.appendChild(tr)
  })

  // Adicionar eventos aos botões
  document.querySelectorAll(".btn-editar-produto").forEach((btn) => {
    btn.addEventListener("click", function () {
      const produtoId = Number.parseInt(this.getAttribute("data-id"))
      editarProduto(produtoId)
    })
  })

  document.querySelectorAll(".btn-excluir-produto").forEach((btn) => {
    btn.addEventListener("click", function () {
      const produtoId = Number.parseInt(this.getAttribute("data-id"))
      excluirProduto(produtoId)
    })
  })
}

function editarProduto(produtoId) {
  const produtos = JSON.parse(localStorage.getItem("produtos")) || []
  const produto = produtos.find((p) => p.id === produtoId)

  if (!produto) {
    alert("Produto não encontrado!")
    return
  }

  // Preencher formulário
  document.getElementById("produto-id").value = produto.id
  document.getElementById("produto-codigo").value = produto.codigo
  document.getElementById("produto-nome").value = produto.nome
  document.getElementById("produto-categoria").value = produto.categoria
  document.getElementById("produto-preco").value = produto.preco
  document.getElementById("produto-estoque").value = produto.estoque
  document.getElementById("produto-estoque-minimo").value = produto.estoqueMinimo
  document.getElementById("produto-descricao").value = produto.descricao

  // Atualizar título do modal
  document.getElementById("modal-produto-titulo").textContent = "Editar Produto"

  // Abrir modal
  const modalProduto = new bootstrap.Modal(document.getElementById("modal-produto"))
  modalProduto.show()
}

function excluirProduto(produtoId) {
  if (!confirm("Deseja realmente excluir este produto?")) {
    return
  }

  const produtos = JSON.parse(localStorage.getItem("produtos")) || []
  const index = produtos.findIndex((p) => p.id === produtoId)

  if (index !== -1) {
    produtos.splice(index, 1)
    localStorage.setItem("produtos", JSON.stringify(produtos))
    carregarTabelaProdutos()

    // Atualizar dashboard
    updateDashboard()
  }
}

function formatarCategoria(categoria) {
  const categorias = {
    hardware: "Hardware",
    perifericos: "Periféricos",
    acessorios: "Acessórios",
    celulares: "Celulares",
    outros: "Outros",
  }

  return categorias[categoria] || categoria
}

// Ordens de Serviço
function initOrdens() {
  const btnSalvarOrdem = document.getElementById("btn-salvar-ordem")
  const modalOrdem = new bootstrap.Modal(document.getElementById("modal-ordem"))

  // Carregar tabelas de ordens
  carregarTabelasOrdens()

  // Salvar ordem
  btnSalvarOrdem.addEventListener("click", () => {
    const form = document.getElementById("form-ordem")

    // Validar formulário
    if (!form.checkValidity()) {
      form.reportValidity()
      return
    }

    // Obter dados do formulário
    const ordemId = document.getElementById("ordem-id").value
    const clienteNome = document.getElementById("ordem-cliente-nome").value
    const clienteTelefone = document.getElementById("ordem-cliente-telefone").value
    const tipoDispositivo = document.getElementById("ordem-tipo-dispositivo").value
    const marcaModelo = document.getElementById("ordem-marca-modelo").value
    const problema = document.getElementById("ordem-problema").value
    const observacoes = document.getElementById("ordem-observacoes").value
    const diagnostico = document.getElementById("ordem-diagnostico").value
    const servico = document.getElementById("ordem-servico").value
    const valor = Number.parseFloat(document.getElementById("ordem-valor").value) || 0
    const status = document.getElementById("ordem-status").value

    // Obter ordens
    const ordens = JSON.parse(localStorage.getItem("ordens")) || []

    // Verificar se é edição ou nova ordem
    if (ordemId) {
      // Editar ordem existente
      const index = ordens.findIndex((o) => o.id === Number.parseInt(ordemId))
      if (index !== -1) {
        const ordemAntiga = ordens[index]
        const dataAtualizacao = new Date().toISOString()

        ordens[index] = {
          ...ordemAntiga,
          clienteNome,
          clienteTelefone,
          tipoDispositivo,
          marcaModelo,
          problema,
          observacoes,
          diagnostico,
          servico,
          valor,
          status,
          dataAtualizacao,
        }

        // Se a ordem foi concluída agora, adicionar data de conclusão
        if (status === "concluida" && ordemAntiga.status !== "concluida") {
          ordens[index].dataConclusao = dataAtualizacao
        }
      }
    } else {
      // Adicionar nova ordem
      ordens.push({
        id: Date.now(),
        clienteNome,
        clienteTelefone,
        tipoDispositivo,
        marcaModelo,
        problema,
        observacoes,
        diagnostico,
        servico,
        valor,
        status,
        dataCriacao: new Date().toISOString(),
        dataAtualizacao: new Date().toISOString(),
        dataConclusao: status === "concluida" ? new Date().toISOString() : null,
      })
    }

    // Salvar ordens
    localStorage.setItem("ordens", JSON.stringify(ordens))

    // Atualizar tabelas
    carregarTabelasOrdens()

    // Fechar modal
    modalOrdem.hide()

    // Limpar formulário
    form.reset()
    document.getElementById("ordem-id").value = ""
    document.getElementById("ordem-diagnostico-div").style.display = "none"

    // Atualizar dashboard
    updateDashboard()
  })

  // Resetar formulário ao abrir modal para nova ordem
  document.getElementById("modal-ordem").addEventListener("show.bs.modal", (event) => {
    const button = event.relatedTarget
    const form = document.getElementById("form-ordem")

    if (!button || !button.hasAttribute("data-id")) {
      // Nova ordem
      document.getElementById("modal-ordem-titulo").textContent = "Nova Ordem de Serviço"
      form.reset()
      document.getElementById("ordem-id").value = ""
      document.getElementById("ordem-diagnostico-div").style.display = "none"
    }
  })
}

function carregarTabelasOrdens() {
  const ordens = JSON.parse(localStorage.getItem("ordens")) || []

  // Filtrar ordens por status
  const ordensAbertas = ordens.filter((o) => o.status === "aberta")
  const ordensAndamento = ordens.filter((o) => o.status === "andamento")
  const ordensConcluidas = ordens.filter((o) => o.status === "concluida")

  // Carregar tabelas
  carregarTabelaOrdens("ordens-abertas-table", ordensAbertas)
  carregarTabelaOrdens("ordens-andamento-table", ordensAndamento)
  carregarTabelaOrdensConcluidas("ordens-concluidas-table", ordensConcluidas)

  // Atualizar contador no dashboard
  document.getElementById("ordens-abertas").textContent = ordensAbertas.length + ordensAndamento.length
}

function carregarTabelaOrdens(tableId, ordens) {
  const tbody = document.getElementById(tableId).getElementsByTagName("tbody")[0]

  // Limpar tabela
  tbody.innerHTML = ""

  // Adicionar ordens
  ordens.forEach((ordem) => {
    const tr = document.createElement("tr")
    const dataCriacao = new Date(ordem.dataCriacao)

    tr.innerHTML = `
    <td>#${ordem.id}</td>
    <td>${ordem.clienteNome}</td>
    <td>${formatarTipoDispositivo(ordem.tipoDispositivo)} ${ordem.marcaModelo}</td>
    <td>${ordem.problema}</td>
    <td>${dataCriacao.toLocaleDateString()}</td>
    <td>
      <button class="btn btn-sm btn-primary btn-editar-ordem" data-id="${ordem.id}">
        <i class="bi bi-pencil"></i>
      </button>
      <button class="btn btn-sm btn-danger btn-excluir-ordem" data-id="${ordem.id}">
        <i class="bi bi-trash"></i>
      </button>
    </td>
  `

    tbody.appendChild(tr)
  })

  // Adicionar eventos aos botões
  document.querySelectorAll(".btn-editar-ordem").forEach((btn) => {
    btn.addEventListener("click", function () {
      const ordemId = Number.parseInt(this.getAttribute("data-id"))
      editarOrdem(ordemId)
    })
  })

  document.querySelectorAll(".btn-excluir-ordem").forEach((btn) => {
    btn.addEventListener("click", function () {
      const ordemId = Number.parseInt(this.getAttribute("data-id"))
      excluirOrdem(ordemId)
    })
  })
}

function carregarTabelaOrdensConcluidas(tableId, ordens) {
  const tbody = document.getElementById(tableId).getElementsByTagName("tbody")[0]

  // Limpar tabela
  tbody.innerHTML = ""

  // Adicionar ordens
  ordens.forEach((ordem) => {
    const tr = document.createElement("tr")
    const dataConclusao = new Date(ordem.dataConclusao)

    tr.innerHTML = `
    <td>#${ordem.id}</td>
    <td>${ordem.clienteNome}</td>
    <td>${formatarTipoDispositivo(ordem.tipoDispositivo)} ${ordem.marcaModelo}</td>
    <td>${ordem.problema}</td>
    <td>${dataConclusao.toLocaleDateString()}</td>
    <td>${formatarMoeda(ordem.valor)}</td>
    <td>
      <button class="btn btn-sm btn-info btn-ver-ordem" data-id="${ordem.id}">
        <i class="bi bi-eye"></i>
      </button>
      <button class="btn btn-sm btn-danger btn-excluir-ordem" data-id="${ordem.id}">
        <i class="bi bi-trash"></i>
      </button>
    </td>
  `

    tbody.appendChild(tr)
  })

  // Adicionar eventos aos botões
  document.querySelectorAll(".btn-ver-ordem, .btn-editar-ordem").forEach((btn) => {
    btn.addEventListener("click", function () {
      const ordemId = Number.parseInt(this.getAttribute("data-id"))
      editarOrdem(ordemId)
    })
  })

  document.querySelectorAll(".btn-excluir-ordem").forEach((btn) => {
    btn.addEventListener("click", function () {
      const ordemId = Number.parseInt(this.getAttribute("data-id"))
      excluirOrdem(ordemId)
    })
  })
}

function editarOrdem(ordemId) {
  const ordens = JSON.parse(localStorage.getItem("ordens")) || []
  const ordem = ordens.find((o) => o.id === ordemId)

  if (!ordem) {
    alert("Ordem não encontrada!")
    return
  }

  // Preencher formulário
  document.getElementById("ordem-id").value = ordem.id
  document.getElementById("ordem-cliente-nome").value = ordem.clienteNome
  document.getElementById("ordem-cliente-telefone").value = ordem.clienteTelefone
  document.getElementById("ordem-tipo-dispositivo").value = ordem.tipoDispositivo
  document.getElementById("ordem-marca-modelo").value = ordem.marcaModelo
  document.getElementById("ordem-problema").value = ordem.problema
  document.getElementById("ordem-observacoes").value = ordem.observacoes || ""
  document.getElementById("ordem-diagnostico").value = ordem.diagnostico || ""
  document.getElementById("ordem-servico").value = ordem.servico || ""
  document.getElementById("ordem-valor").value = ordem.valor || ""
  document.getElementById("ordem-status").value = ordem.status

  // Mostrar campos de diagnóstico
  document.getElementById("ordem-diagnostico-div").style.display = "block"

  // Atualizar título do modal
  document.getElementById("modal-ordem-titulo").textContent = "Editar Ordem de Serviço"

  // Abrir modal
  const modalOrdem = new bootstrap.Modal(document.getElementById("modal-ordem"))
  modalOrdem.show()
}

function excluirOrdem(ordemId) {
  if (!confirm("Deseja realmente excluir esta ordem de serviço?")) {
    return
  }

  const ordens = JSON.parse(localStorage.getItem("ordens")) || []
  const index = ordens.findIndex((o) => o.id === ordemId)

  if (index !== -1) {
    ordens.splice(index, 1)
    localStorage.setItem("ordens", JSON.stringify(ordens))
    carregarTabelasOrdens()

    // Atualizar dashboard
    updateDashboard()
  }
}

function formatarTipoDispositivo(tipo) {
  const tipos = {
    celular: "Celular",
    tablet: "Tablet",
    notebook: "Notebook",
    computador: "Computador",
    outro: "Outro",
  }

  return tipos[tipo] || tipo
}

// Relatórios
function initRelatorios() {
  // Definir data atual para relatório diário
  const dataAtual = new Date()
  document.getElementById("data-relatorio-diario").valueAsDate = dataAtual

  // Buscar relatório diário
  document.getElementById("btn-buscar-relatorio-diario").addEventListener("click", () => {
    const data = document.getElementById("data-relatorio-diario").value
    carregarRelatorioDiario(data)
  })

  // Buscar relatório semanal
  document.getElementById("btn-buscar-relatorio-semanal").addEventListener("click", () => {
    const semana = document.getElementById("semana-relatorio").value
    carregarRelatorioSemanal(semana)
  })

  // Buscar relatório mensal
  document.getElementById("btn-buscar-relatorio-mensal").addEventListener("click", () => {
    const mes = document.getElementById("mes-relatorio").value
    carregarRelatorioMensal(mes)
  })

  // Carregar relatório diário inicial
  carregarRelatorioDiario(document.getElementById("data-relatorio-diario").value)
}

function carregarRelatorioDiario(dataStr) {
  const data = new Date(dataStr)
  const vendas = JSON.parse(localStorage.getItem("vendas")) || []
  const ordens = JSON.parse(localStorage.getItem("ordens")) || []

  // Filtrar vendas do dia
  const vendasDia = vendas.filter((venda) => {
    const dataVenda = new Date(venda.data)
    return dataVenda.toDateString() === data.toDateString()
  })

  // Filtrar ordens finalizadas no dia
  const ordensFinalizadas = ordens.filter((ordem) => {
    if (!ordem.dataConclusao) return false
    const dataConclusao = new Date(ordem.dataConclusao)
    return dataConclusao.toDateString() === data.toDateString()
  })

  // Calcular totais
  const totalVendas = vendasDia.reduce((total, venda) => total + venda.total, 0)
  const ticketMedio = vendasDia.length > 0 ? totalVendas / vendasDia.length : 0

  // Atualizar resumo
  document.getElementById("total-vendas-dia").textContent = formatarMoeda(totalVendas)
  document.getElementById("qtd-vendas-dia").textContent = vendasDia.length
  document.getElementById("ticket-medio-dia").textContent = formatarMoeda(ticketMedio)
  document.getElementById("ordens-finalizadas-dia").textContent = ordensFinalizadas.length

  // Carregar tabela de vendas
  carregarTabelaVendasDia(vendasDia)

  // Gerar gráfico de métodos de pagamento
  gerarGraficoPagamentosDia(vendasDia)
}

function carregarTabelaVendasDia(vendas) {
  const tbody = document.getElementById("vendas-dia-table").getElementsByTagName("tbody")[0]

  // Limpar tabela
  tbody.innerHTML = ""

  // Adicionar vendas
  vendas.forEach((venda) => {
    const tr = document.createElement("tr")
    const dataVenda = new Date(venda.data)

    tr.innerHTML = `
    <td>#${venda.id}</td>
    <td>${dataVenda.toLocaleTimeString()}</td>
    <td>${venda.itens.length} itens</td>
    <td>${formatarMoeda(venda.total)}</td>
    <td>${formatarMetodoPagamento(venda.metodoPagamento, venda.parcelas)}</td>
    <td>
      <button class="btn btn-sm btn-info btn-detalhes-venda" data-id="${venda.id}">
        <i class="bi bi-eye"></i>
      </button>
    </td>
  `

    tbody.appendChild(tr)
  })

  // Adicionar eventos aos botões
  document.querySelectorAll(".btn-detalhes-venda").forEach((btn) => {
    btn.addEventListener("click", function () {
      const vendaId = Number.parseInt(this.getAttribute("data-id"))
      mostrarDetalhesVenda(vendaId)
    })
  })
}

function gerarGraficoPagamentosDia(vendas) {
  // Contar métodos de pagamento
  const metodos = {
    dinheiro: 0,
    credito: 0,
    debito: 0,
    pix: 0,
  }

  vendas.forEach((venda) => {
    if (metodos[venda.metodoPagamento] !== undefined) {
      metodos[venda.metodoPagamento] += venda.total
    }
  })

  // Gerar gráfico
  const ctx = document.getElementById("pagamentos-dia-chart").getContext("2d")

  // Destruir gráfico anterior se existir
  if (window.pagamentosDiaChart) {
    window.pagamentosDiaChart.destroy()
  }

  window.pagamentosDiaChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Dinheiro", "Crédito", "Débito", "PIX"],
      datasets: [
        {
          data: [metodos.dinheiro, metodos.credito, metodos.debito, metodos.pix],
          backgroundColor: ["#28a745", "#007bff", "#6c757d", "#17a2b8"],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom",
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const label = context.label || ""
              const value = context.raw || 0
              return `${label}: ${formatarMoeda(value)}`
            },
          },
        },
      },
    },
  })
}

function carregarRelatorioSemanal(semanaStr) {
  // Extrair ano e número da semana
  const [ano, semana] = semanaStr.split("-W").map(Number)

  // Calcular datas de início e fim da semana
  const dataInicio = getDateOfISOWeek(semana, ano)
  const dataFim = new Date(dataInicio)
  dataFim.setDate(dataInicio.getDate() + 6)

  const vendas = JSON.parse(localStorage.getItem("vendas")) || []

  // Filtrar vendas da semana
  const vendasSemana = vendas.filter((venda) => {
    const dataVenda = new Date(venda.data)
    return dataVenda >= dataInicio && dataVenda <= dataFim
  })

  // Calcular totais
  const totalVendas = vendasSemana.reduce((total, venda) => total + venda.total, 0)
  const ticketMedio = vendasSemana.length > 0 ? totalVendas / vendasSemana.length : 0

  // Atualizar resumo
  document.getElementById("total-vendas-semana").textContent = formatarMoeda(totalVendas)
  document.getElementById("qtd-vendas-semana").textContent = vendasSemana.length
  document.getElementById("ticket-medio-semana").textContent = formatarMoeda(ticketMedio)

  // Calcular vendas por dia da semana
  const vendasPorDia = Array(7).fill(0)
  const diasSemana = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"]

  vendasSemana.forEach((venda) => {
    const dataVenda = new Date(venda.data)
    const diaSemana = dataVenda.getDay()
    vendasPorDia[diaSemana] += venda.total
  })

  // Encontrar melhor dia
  let melhorDia = 0
  let valorMelhorDia = 0

  vendasPorDia.forEach((valor, index) => {
    if (valor > valorMelhorDia) {
      melhorDia = index
      valorMelhorDia = valor
    }
  })

  document.getElementById("melhor-dia-semana").textContent =
    `${diasSemana[melhorDia]} (${formatarMoeda(valorMelhorDia)})`

  // Gerar gráfico de vendas da semana
  gerarGraficoVendasSemana(vendasPorDia, diasSemana)

  // Calcular produtos mais vendidos
  const produtosMaisVendidos = calcularProdutosMaisVendidos(vendasSemana)
  carregarTabelaProdutosMaisVendidos(produtosMaisVendidos)
}

function getDateOfISOWeek(week, year) {
  const simple = new Date(year, 0, 1 + (week - 1) * 7)
  const dow = simple.getDay()
  const ISOweekStart = simple
  if (dow <= 4) {
    ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1)
  } else {
    ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay())
  }
  return ISOweekStart
}

function gerarGraficoVendasSemana(vendasPorDia, diasSemana) {
  const ctx = document.getElementById("vendas-semana-relatorio-chart").getContext("2d")

  // Destruir gráfico anterior se existir
  if (window.vendasSemanaRelatorioChart) {
    window.vendasSemanaRelatorioChart.destroy()
  }

  window.vendasSemanaRelatorioChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: diasSemana,
      datasets: [
        {
          label: "Vendas",
          data: vendasPorDia,
          backgroundColor: "#007bff",
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value) => "R$ " + value.toFixed(2),
          },
        },
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: (context) => "Vendas: " + formatarMoeda(context.raw),
          },
        },
      },
    },
  })
}

function calcularProdutosMaisVendidos(vendas) {
  const produtosVendidos = {}

  // Contar produtos vendidos
  vendas.forEach((venda) => {
    venda.itens.forEach((item) => {
      const produtoId = item.produto.id

      if (!produtosVendidos[produtoId]) {
        produtosVendidos[produtoId] = {
          nome: item.produto.nome,
          quantidade: 0,
          total: 0,
        }
      }

      produtosVendidos[produtoId].quantidade += item.quantidade
      produtosVendidos[produtoId].total += item.produto.preco * item.quantidade
    })
  })

  // Converter para array e ordenar
  return Object.values(produtosVendidos)
    .sort((a, b) => b.quantidade - a.quantidade)
    .slice(0, 5)
}

function carregarTabelaProdutosMaisVendidos(produtos) {
  const tbody = document.getElementById("produtos-mais-vendidos-semana").getElementsByTagName("tbody")[0]

  // Limpar tabela
  tbody.innerHTML = ""

  // Adicionar produtos
  produtos.forEach((produto) => {
    const tr = document.createElement("tr")

    tr.innerHTML = `
    <td>${produto.nome}</td>
    <td>${produto.quantidade}</td>
    <td>${formatarMoeda(produto.total)}</td>
  `

    tbody.appendChild(tr)
  })
}

function carregarRelatorioMensal(mesStr) {
  // Extrair ano e mês
  const [ano, mes] = mesStr.split("-").map(Number)

  // Calcular datas de início e fim do mês
  const dataInicio = new Date(ano, mes - 1, 1)
  const dataFim = new Date(ano, mes, 0)

  const vendas = JSON.parse(localStorage.getItem("vendas")) || []

  // Filtrar vendas do mês
  const vendasMes = vendas.filter((venda) => {
    const dataVenda = new Date(venda.data)
    return dataVenda >= dataInicio && dataVenda <= dataFim
  })

  // Calcular totais
  const totalVendas = vendasMes.reduce((total, venda) => total + venda.total, 0)
  const ticketMedio = vendasMes.length > 0 ? totalVendas / vendasMes.length : 0

  // Atualizar resumo
  document.getElementById("total-vendas-mes").textContent = formatarMoeda(totalVendas)
  document.getElementById("qtd-vendas-mes").textContent = vendasMes.length
  document.getElementById("ticket-medio-mes").textContent = formatarMoeda(ticketMedio)

  // Calcular vendas por dia do mês
  const diasNoMes = dataFim.getDate()
  const vendasPorDia = Array(diasNoMes).fill(0)

  vendasMes.forEach((venda) => {
    const dataVenda = new Date(venda.data)
    const dia = dataVenda.getDate() - 1 // Índice 0-based
    vendasPorDia[dia] += venda.total
  })

  // Encontrar melhor dia
  let melhorDia = 0
  let valorMelhorDia = 0

  vendasPorDia.forEach((valor, index) => {
    if (valor > valorMelhorDia) {
      melhorDia = index
      valorMelhorDia = valor
    }
  })

  document.getElementById("melhor-dia-mes").textContent = `Dia ${melhorDia + 1} (${formatarMoeda(valorMelhorDia)})`

  // Gerar gráfico de vendas do mês
  gerarGraficoVendasMes(vendasPorDia, diasNoMes)

  // Gerar gráfico de métodos de pagamento
  gerarGraficoPagamentosMes(vendasMes)
}

function gerarGraficoVendasMes(vendasPorDia, diasNoMes) {
  const ctx = document.getElementById("vendas-mes-chart").getContext("2d")

  // Criar labels para os dias do mês
  const labels = Array.from({ length: diasNoMes }, (_, i) => i + 1)

  // Destruir gráfico anterior se existir
  if (window.vendasMesChart) {
    window.vendasMesChart.destroy()
  }

  window.vendasMesChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Vendas",
          data: vendasPorDia,
          borderColor: "#007bff",
          backgroundColor: "rgba(0, 123, 255, 0.1)",
          fill: true,
          tension: 0.1,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value) => "R$ " + value.toFixed(2),
          },
        },
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: (context) => "Vendas: " + formatarMoeda(context.raw),
          },
        },
      },
    },
  })
}

function gerarGraficoPagamentosMes(vendas) {
  // Contar métodos de pagamento
  const metodos = {
    dinheiro: 0,
    credito: 0,
    debito: 0,
    pix: 0,
  }

  vendas.forEach((venda) => {
    if (metodos[venda.metodoPagamento] !== undefined) {
      metodos[venda.metodoPagamento] += venda.total
    }
  })

  // Gerar gráfico
  const ctx = document.getElementById("pagamentos-mes-chart").getContext("2d")

  // Destruir gráfico anterior se existir
  if (window.pagamentosMesChart) {
    window.pagamentosMesChart.destroy()
  }

  window.pagamentosMesChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Dinheiro", "Crédito", "Débito", "PIX"],
      datasets: [
        {
          data: [metodos.dinheiro, metodos.credito, metodos.debito, metodos.pix],
          backgroundColor: ["#28a745", "#007bff", "#6c757d", "#17a2b8"],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom",
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const label = context.label || ""
              const value = context.raw || 0
              const total = context.dataset.data.reduce((a, b) => a + b, 0)
              const percentage = Math.round((value / total) * 100)
              return `${label}: ${formatarMoeda(value)} (${percentage}%)`
            },
          },
        },
      },
    },
  })
}

function mostrarDetalhesVenda(vendaId) {
  const vendas = JSON.parse(localStorage.getItem("vendas")) || []
  const venda = vendas.find((v) => v.id === vendaId)

  if (!venda) {
    alert("Venda não encontrada!")
    return
  }

  // Preencher detalhes da venda
  document.getElementById("detalhe-venda-id").textContent = venda.id

  const dataVenda = new Date(venda.data)
  document.getElementById("detalhe-venda-data").textContent =
    `${dataVenda.toLocaleDateString()} ${dataVenda.toLocaleTimeString()}`

  document.getElementById("detalhe-venda-pagamento").textContent = formatarMetodoPagamento(
    venda.metodoPagamento,
    venda.parcelas,
  )

  // Preencher itens da venda
  const tbody = document.getElementById("detalhe-venda-itens").getElementsByTagName("tbody")[0]
  tbody.innerHTML = ""

  venda.itens.forEach((item) => {
    const tr = document.createElement("tr")
    const subtotal = item.produto.preco * item.quantidade

    tr.innerHTML = `
    <td>${item.produto.nome}</td>
    <td>${formatarMoeda(item.produto.preco)}</td>
    <td>${item.quantidade}</td>
    <td>${formatarMoeda(subtotal)}</td>
  `

    tbody.appendChild(tr)
  })

  // Atualizar total
  document.getElementById("detalhe-venda-total").textContent = formatarMoeda(venda.total)

  // Abrir modal
  const modalDetalhesVenda = new bootstrap.Modal(document.getElementById("modal-detalhes-venda"))
  modalDetalhesVenda.show()

  // Evento de impressão
  document.getElementById("btn-imprimir-venda").addEventListener("click", () => {
    imprimirVenda(venda)
  })
}

function imprimirVenda(venda) {
  const dataVenda = new Date(venda.data)

  // Criar conteúdo para impressão
  let conteudo = `
  <html>
  <head>
    <title>Comprovante de Venda #${venda.id}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
      h1 { text-align: center; font-size: 18px; }
      .info { margin-bottom: 15px; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
      th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
      th { font-weight: bold; }
      .total { font-weight: bold; text-align: right; }
      .footer { text-align: center; margin-top: 30px; font-size: 12px; }
    </style>
  </head>
  <body>
    <h1>Comprovante de Venda</h1>
    
    <div class="info">
      <p><strong>Nº da Venda:</strong> ${venda.id}</p>
      <p><strong>Data:</strong> ${dataVenda.toLocaleDateString()} ${dataVenda.toLocaleTimeString()}</p>
      <p><strong>Método de Pagamento:</strong> ${formatarMetodoPagamento(venda.metodoPagamento, venda.parcelas)}</p>
    </div>
    
    <table>
      <thead>
        <tr>
          <th>Produto</th>
          <th>Preço Unit.</th>
          <th>Qtd</th>
          <th>Subtotal</th>
        </tr>
      </thead>
      <tbody>
`

  venda.itens.forEach((item) => {
    const subtotal = item.produto.preco * item.quantidade
    conteudo += `
    <tr>
      <td>${item.produto.nome}</td>
      <td>${formatarMoeda(item.produto.preco)}</td>
      <td>${item.quantidade}</td>
      <td>${formatarMoeda(subtotal)}</td>
    </tr>
  `
  })

  conteudo += `
      </tbody>
    </table>
    
    <p class="total">Total: ${formatarMoeda(venda.total)}</p>
    
    <div class="footer">
      <p>Obrigado pela preferência!</p>
    </div>
  </body>
  </html>
`

  // Abrir janela de impressão
  const janelaImpressao = window.open("", "_blank")
  janelaImpressao.document.write(conteudo)
  janelaImpressao.document.close()
  janelaImpressao.print()
}

function formatarMetodoPagamento(metodo, parcelas) {
  const metodos = {
    dinheiro: "Dinheiro",
    credito: "Cartão de Crédito",
    debito: "Cartão de Débito",
    pix: "PIX",
  }

  let resultado = metodos[metodo] || metodo

  if (metodo === "credito" && parcelas > 1) {
    resultado += ` (${parcelas}x)`
  }

  return resultado
}

// Dashboard
function updateDashboard() {
  // Obter dados
  const vendas = JSON.parse(localStorage.getItem("vendas")) || []
  const produtos = JSON.parse(localStorage.getItem("produtos")) || []
  const ordens = JSON.parse(localStorage.getItem("ordens")) || []

  // Calcular vendas do dia
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  const vendasHoje = vendas.filter((venda) => {
    const dataVenda = new Date(venda.data)
    return dataVenda >= hoje
  })

  const totalVendasHoje = vendasHoje.reduce((total, venda) => total + venda.total, 0)

  // Contar ordens abertas
  const ordensAbertas = ordens.filter((ordem) => ordem.status !== "concluida").length

  // Contar produtos com estoque baixo
  const produtosBaixoEstoque = produtos.filter((produto) => produto.estoque <= produto.estoqueMinimo).length

  // Calcular balanço do dia
  const caixa = JSON.parse(localStorage.getItem("caixa")) || { valorInicial: 0 }
  let balancoDia = caixa.aberto ? caixa.valorInicial : 0

  if (caixa.aberto) {
    const dataAbertura = new Date(caixa.dataAbertura)
    dataAbertura.setHours(0, 0, 0, 0)

    // Somar vendas em dinheiro
    vendasHoje.forEach((venda) => {
      if (venda.metodoPagamento === "dinheiro") {
        balancoDia += venda.total
      }
    })
  }

  // Atualizar cards
  document.getElementById("vendas-hoje").textContent = formatarMoeda(totalVendasHoje)
  document.getElementById("ordens-abertas").textContent = ordensAbertas
  document.getElementById("produtos-baixo-estoque").textContent = produtosBaixoEstoque
  document.getElementById("balanco-dia").textContent = formatarMoeda(balancoDia)

  // Gerar gráfico de vendas da semana
  gerarGraficoVendasDashboard()

  // Carregar últimas vendas
  carregarUltimasVendas()
}

function gerarGraficoVendasDashboard() {
  const vendas = JSON.parse(localStorage.getItem("vendas")) || []

  // Calcular datas da semana atual
  const hoje = new Date()
  const diasSemana = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"]
  const vendasPorDia = Array(7).fill(0)

  // Obter o primeiro dia da semana (domingo)
  const primeiroDiaSemana = new Date(hoje)
  primeiroDiaSemana.setDate(hoje.getDate() - hoje.getDay())
  primeiroDiaSemana.setHours(0, 0, 0, 0)

  // Obter o último dia da semana (sábado)
  const ultimoDiaSemana = new Date(primeiroDiaSemana)
  ultimoDiaSemana.setDate(primeiroDiaSemana.getDate() + 6)

  // Filtrar vendas da semana atual
  vendas.forEach((venda) => {
    const dataVenda = new Date(venda.data)
    if (dataVenda >= primeiroDiaSemana && dataVenda <= ultimoDiaSemana) {
      const diaSemana = dataVenda.getDay()
      vendasPorDia[diaSemana] += venda.total
    }
  })

  // Gerar gráfico
  const ctx = document.getElementById("vendas-semana-chart").getContext("2d")

  // Destruir gráfico anterior se existir
  if (window.vendasSemanaChart) {
    window.vendasSemanaChart.destroy()
  }

  window.vendasSemanaChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: diasSemana,
      datasets: [
        {
          label: "Vendas",
          data: vendasPorDia,
          backgroundColor: "#007bff",
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value) => "R$ " + value.toFixed(2),
          },
        },
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: (context) => "Vendas: " + formatarMoeda(context.raw),
          },
        },
      },
    },
  })
}

function carregarUltimasVendas() {
  const vendas = JSON.parse(localStorage.getItem("vendas")) || []
  const tbody = document.getElementById("ultimas-vendas-table").getElementsByTagName("tbody")[0]

  // Limpar tabela
  tbody.innerHTML = ""

  // Adicionar últimas 5 vendas
  vendas
    .slice()
    .reverse()
    .slice(0, 5)
    .forEach((venda) => {
      const tr = document.createElement("tr")
      const dataVenda = new Date(venda.data)

      tr.innerHTML = `
    <td>#${venda.id}</td>
    <td>${dataVenda.toLocaleDateString()}</td>
    <td>${formatarMoeda(venda.total)}</td>
    <td>${formatarMetodoPagamento(venda.metodoPagamento, venda.parcelas)}</td>
  `

      tbody.appendChild(tr)
    })
}

// Funções utilitárias
function formatarMoeda(valor) {
  return "R$ " + valor.toFixed(2).replace(".", ",")
}

// Declaração da variável bootstrap
const bootstrap = window.bootstrap

// Função para inicializar todos os tooltips
function initTooltips() {
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
  tooltipTriggerList.map((tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl))
}

// Adicionar tooltips aos botões principais
document.addEventListener("DOMContentLoaded", () => {
  // Adicionar atributos de tooltip
  document.getElementById("btn-abrir-caixa").setAttribute("data-bs-toggle", "tooltip")
  document.getElementById("btn-abrir-caixa").setAttribute("data-bs-placement", "bottom")
  document.getElementById("btn-abrir-caixa").setAttribute("title", "Abrir o caixa para iniciar as vendas")

  document.getElementById("btn-fechar-caixa").setAttribute("data-bs-toggle", "tooltip")
  document.getElementById("btn-fechar-caixa").setAttribute("data-bs-placement", "bottom")
  document.getElementById("btn-fechar-caixa").setAttribute("title", "Fechar o caixa e finalizar as operações do dia")

  // Inicializar tooltips
  initTooltips()
})

// Função para backup dos dados
function backupDados() {
  try {
    const dados = {
      produtos: JSON.parse(localStorage.getItem("produtos") || "[]"),
      vendas: JSON.parse(localStorage.getItem("vendas") || "[]"),
      ordens: JSON.parse(localStorage.getItem("ordens") || "[]"),
      caixa: JSON.parse(localStorage.getItem("caixa") || "{}"),
      historicoCaixa: JSON.parse(localStorage.getItem("historicoCaixa") || "[]"),
    }

    const dataStr = JSON.stringify(dados)
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)

    const exportFileDefaultName = "backup_sistema_caixa_" + new Date().toISOString().slice(0, 10) + ".json"

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  } catch (e) {
    alert("Erro ao fazer backup: " + e.message)
  }
}

// Função para restaurar backup
function restaurarBackup(arquivo) {
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const dados = JSON.parse(e.target.result)

      // Validar dados
      if (!dados.produtos || !dados.vendas || !dados.ordens || !dados.historicoCaixa) {
        throw new Error("Arquivo de backup inválido")
      }

      // Restaurar dados
      localStorage.setItem("produtos", JSON.stringify(dados.produtos))
      localStorage.setItem("vendas", JSON.stringify(dados.vendas))
      localStorage.setItem("ordens", JSON.stringify(dados.ordens))
      localStorage.setItem("caixa", JSON.stringify(dados.caixa))
      localStorage.setItem("historicoCaixa", JSON.stringify(dados.historicoCaixa))

      alert("Backup restaurado com sucesso! A página será recarregada.")
      window.location.reload()
    } catch (e) {
      alert("Erro ao restaurar backup: " + e.message)
    }
  }
  reader.readAsText(arquivo)
}

// Adicionar funções de backup e restauração ao menu
document.addEventListener("DOMContentLoaded", () => {
  // Adicionar botões de backup e restauração ao final da sidebar
  const sidebar = document.querySelector(".sidebar .nav")

  const backupItem = document.createElement("li")
  backupItem.className = "nav-item mt-4"
  backupItem.innerHTML = `
  <a class="nav-link" href="#" id="btn-backup">
    <i class="bi bi-download me-2"></i>Backup de Dados
  </a>
`

  const restaurarItem = document.createElement("li")
  restaurarItem.className = "nav-item"
  restaurarItem.innerHTML = `
  <a class="nav-link" href="#" id="btn-restaurar">
    <i class="bi bi-upload me-2"></i>Restaurar Backup
  </a>
`

  sidebar.appendChild(backupItem)
  sidebar.appendChild(restaurarItem)

  // Adicionar eventos
  document.getElementById("btn-backup").addEventListener("click", (e) => {
    e.preventDefault()
    backupDados()
  })

  document.getElementById("btn-restaurar").addEventListener("click", (e) => {
    e.preventDefault()

    // Criar input de arquivo oculto
    const inputFile = document.createElement("input")
    inputFile.type = "file"
    inputFile.accept = ".json"
    inputFile.style.display = "none"

    inputFile.addEventListener("change", function () {
      if (this.files && this.files[0]) {
        if (confirm("Isso substituirá todos os dados atuais. Deseja continuar?")) {
          restaurarBackup(this.files[0])
        }
      }
    })

    document.body.appendChild(inputFile)
    inputFile.click()
    document.body.removeChild(inputFile)
  })
})


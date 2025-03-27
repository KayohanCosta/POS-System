# POS System - Sistema de Ponto de Venda

Um sistema completo de ponto de venda (PDV) desenvolvido por Kayohan Costa, com Next.js e React, projetado para atender diversos tipos de negócios como varejo, restaurantes e bares. O sistema funciona localmente no navegador, utilizando localStorage para armazenamento de dados e outros.

## 🌟 Características Principais

- **Funciona 100% no navegador** - Não requer servidor ou banco de dados externo
- **Responsivo** - Interface adaptável para desktop, tablet e dispositivos móveis
- **Personalizável** - Configurável para diferentes tipos de negócios
- **Multi-usuário** - Sistema de permissões e perfis de acesso
- **Offline-first** - Funciona sem conexão com internet
- **Otimizado para Mobile** - Interface adaptada para uso eficiente em smartphones e tablets

## 📋 Funcionalidades

### 🧮 Controle de Caixa

- Abertura e fechamento de caixa com registro de valores iniciais e finais
- Cálculo automático de diferenças (sobras/faltas)
- Histórico de operações de caixa
- Bloqueio de vendas quando o caixa está fechado

### 💰 Vendas

- Interface intuitiva para adição rápida de produtos
- Busca de produtos por nome ou código
- Suporte a múltiplos métodos de pagamento simultâneos:
  - Dinheiro (com cálculo automático de troco)
  - Cartão de crédito
  - Cartão de débito
  - PIX
- Aplicação de descontos
- Impressão de comprovantes personalizáveis
- Cancelamento de vendas com estorno automático ao estoque

### 📦 Gestão de Produtos

- Cadastro completo de produtos com:
  - Código, nome, descrição, preço, estoque
  - Categorias personalizáveis com cores
  - Estoque mínimo com alertas
- Controle de estoque automático
- Opção para disponibilizar produtos na loja online

### 📊 Controle de Estoque

- Movimentações de entrada, saída e ajuste
- Histórico completo de movimentações
- Alertas de estoque baixo
- Relatórios de produtos em estoque

### 🔧 Ordens de Serviço

- Cadastro de clientes e dispositivos
- Acompanhamento de status (aberta, em andamento, concluída)
- Registro de diagnóstico e serviços realizados
- Histórico de atendimentos por cliente

### 🍽️ Gestão de Mesas (Restaurantes/Bares)

- Visualização do status das mesas (livre, ocupada)
- Controle de comandas por mesa
- Transferência de itens entre mesas
- Divisão de contas
- Impressão de comanda por mesa

### 👨‍🍳 Controle de Cozinha

- Visualização de pedidos pendentes
- Atualização de status (pendente, preparando, pronto)
- Priorização de pedidos
- Notificações de pedidos prontos

### 🚚 Delivery

- Cadastro de pedidos para entrega
- Registro de endereços e contatos
- Cálculo de taxa de entrega
- Acompanhamento de status (pendente, em preparo, saiu para entrega, entregue)

### 📱 Loja Online

- Catálogo de produtos online
- Carrinho de compras
- Finalização de pedidos via WhatsApp
- Personalização de informações da loja

### 📈 Relatórios

- Vendas diárias, semanais e mensais
- Produtos mais vendidos
- Faturamento por método de pagamento
- Relatórios de ordens de serviço
- Exportação de dados

### 👥 Gestão de Usuários

- Cadastro de usuários com diferentes perfis
- Sistema de permissões granular
- Controle de acesso a funcionalidades
- Registro de atividades
- Perfis de acesso com layout responsivo para todos os dispositivos
- Visualização otimizada de permissões em telas pequenas
- Controle granular de funcionalidades por perfil de usuário

### ⚙️ Configurações

- Personalização de dados da empresa
- Configuração de tipos de negócio (varejo, restaurante, bar)
- Ativação/desativação de módulos
- Personalização de comprovantes e comandas

### 💸 Controle Financeiro

- Registro de despesas e contas a pagar
- Categorização de despesas
- Alertas de vencimento
- Relatórios financeiros

### 🏦 Conexões Bancárias

- Gerenciamento de conexões com instituições financeiras
- Suporte a principais bancos brasileiros (Bradesco, Itaú, Santander, Banco do Brasil, Caixa, Nubank, Inter)
- Visualização de conexões ativas no painel principal
- Autenticação via OAuth para conexão segura
- Resumo de conexões bancárias no dashboard

## 🔄 Fluxos de Trabalho

### Fluxo de Venda no Varejo

1. Abertura de caixa
2. Busca e adição de produtos
3. Seleção de método de pagamento
4. Finalização da venda
5. Impressão de comprovante (opcional)

### Fluxo de Restaurante

1. Abertura de caixa
2. Ocupação de mesa
3. Registro de pedidos
4. Envio para cozinha
5. Preparação e entrega
6. Fechamento de conta
7. Pagamento

### Fluxo de Ordem de Serviço

1. Cadastro do cliente e dispositivo
2. Registro do problema
3. Diagnóstico técnico
4. Execução do serviço
5. Registro de peças utilizadas
6. Finalização e cobrança

## 🛠️ Tecnologias Utilizadas

- **Next.js** - Framework React
- **React** - Biblioteca JavaScript para interfaces
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Framework CSS utilitário
- **shadcn/ui** - Componentes de UI
- **localStorage** - Armazenamento de dados no navegador

## 🛠️ Desenvolvedor

- Desenvolvido por Kayohan Costa


## 🚀 Live Demo
🔗 [Acesse o projeto ao vivo](https://pos-systeem.vercel.app/)


## 📥 Instalação e Uso

1. Clone o repositório:

```bash
git clone https://github.com/KayohanCosta/pos-system.git

2. Instale as dependências:


```shellscript
cd pos-system
npm install
```

3. Inicie o servidor de desenvolvimento:


```shellscript
npm run dev
```

4. Acesse o sistema em `http://localhost:3000`


## 🖥️ Requisitos de Sistema

- Navegador moderno (Chrome, Firefox, Safari, Edge)
- JavaScript habilitado
- Resolução mínima recomendada: 1024x768
- Tablet de 10 polegadas

## 📝 Notas Importantes

- **Armazenamento Local**: Todos os dados são armazenados no localStorage do navegador. Recomenda-se fazer backups regulares através da função de exportação disponível no sistema.
- **Compatibilidade**: O sistema foi testado nos principais navegadores modernos. Funcionalidades podem variar em navegadores mais antigos.
- **Impressão**: A funcionalidade de impressão utiliza os recursos nativos do navegador.


## 🔜 Próximos Passos

- Integração com sistemas de salvamentos em nuvens
- Aplicativo móvel com React Native
- Integração com sistemas de pagamento via Bancos 
  (Bradesco, Santander, inter, Nubank, Caixa Economica Federal, Itaú, Mercado Pago)
- Suporte a múltiplas filiais


## 📄 Licença

Este projeto está licenciado sob a [MIT License](LICENSE).

## 👨‍💻 Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou enviar pull requests com melhorias.

---

Desenvolvido com ❤️ para pequenos e médios negócios. Use é Grátis!

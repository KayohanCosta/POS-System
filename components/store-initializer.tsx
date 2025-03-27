"use client"

import { useEffect } from "react"

export default function StoreInitializer() {
  useEffect(() => {
    // Get existing products
    const existingProducts = JSON.parse(localStorage.getItem("products") || "[]")

    // Only add new products if there are fewer than 15 products
    if (existingProducts.length < 15) {
      // Create additional products
      const additionalProducts = [
        // Smartphones
        {
          id: "phone1",
          name: "Smartphone Galaxy X20",
          description: 'Smartphone com tela AMOLED de 6.5", 128GB de armazenamento e 8GB de RAM',
          price: 1899.9,
          stock: 15,
          category: "celulares",
          onlineStore: true,
          imageUrl: "/placeholder.svg?height=500&width=500",
        },
        {
          id: "phone2",
          name: "iPhone 13 Pro",
          description: "iPhone com processador A15 Bionic, 256GB de armazenamento e câmera tripla",
          price: 5499.9,
          stock: 8,
          category: "celulares",
          onlineStore: true,
          imageUrl: "/placeholder.svg?height=500&width=500",
        },
        {
          id: "phone3",
          name: "Redmi Note 11",
          description: 'Smartphone com tela de 6.43", processador Snapdragon 680 e bateria de 5000mAh',
          price: 1299.9,
          stock: 20,
          category: "celulares",
          onlineStore: true,
          imageUrl: "/placeholder.svg?height=500&width=500",
        },

        // Hardware
        {
          id: "hw1",
          name: "Processador Ryzen 7 5800X",
          description: "Processador AMD Ryzen 7 5800X, 8 núcleos, 16 threads, até 4.7GHz",
          price: 1899.9,
          stock: 12,
          category: "hardware",
          onlineStore: true,
          imageUrl: "/placeholder.svg?height=500&width=500",
        },
        {
          id: "hw2",
          name: "Placa de Vídeo RTX 3060",
          description: "Placa de vídeo NVIDIA GeForce RTX 3060, 12GB GDDR6, Ray Tracing",
          price: 2499.9,
          stock: 7,
          category: "hardware",
          onlineStore: true,
          imageUrl: "/placeholder.svg?height=500&width=500",
        },
        {
          id: "hw3",
          name: "Placa-mãe B550M",
          description: "Placa-mãe AMD B550M, Socket AM4, mATX, DDR4",
          price: 799.9,
          stock: 15,
          category: "hardware",
          onlineStore: true,
          imageUrl: "/placeholder.svg?height=500&width=500",
        },
        {
          id: "hw4",
          name: "Memória RAM DDR4 16GB",
          description: "Memória RAM 16GB (2x8GB) DDR4 3200MHz",
          price: 349.9,
          stock: 25,
          category: "hardware",
          onlineStore: true,
          imageUrl: "/placeholder.svg?height=500&width=500",
        },

        // Periféricos
        {
          id: "per1",
          name: "Mouse Gamer RGB",
          description: "Mouse gamer com sensor óptico de 16000 DPI, 6 botões programáveis e iluminação RGB",
          price: 149.9,
          stock: 30,
          category: "perifericos",
          onlineStore: true,
          imageUrl: "/placeholder.svg?height=500&width=500",
        },
        {
          id: "per2",
          name: "Teclado Mecânico",
          description: "Teclado mecânico com switches blue, iluminação RGB e layout ABNT2",
          price: 299.9,
          stock: 18,
          category: "perifericos",
          onlineStore: true,
          imageUrl: "/placeholder.svg?height=500&width=500",
        },
        {
          id: "per3",
          name: "Headset Gamer 7.1",
          description: "Headset gamer com som surround 7.1, microfone removível e almofadas de espuma memory foam",
          price: 249.9,
          stock: 22,
          category: "perifericos",
          onlineStore: true,
          imageUrl: "/placeholder.svg?height=500&width=500",
        },

        // Acessórios
        {
          id: "acc1",
          name: "Carregador Rápido USB-C",
          description: "Carregador USB-C de 25W com tecnologia de carregamento rápido",
          price: 89.9,
          stock: 40,
          category: "acessorios",
          onlineStore: true,
          imageUrl: "/placeholder.svg?height=500&width=500",
        },
        {
          id: "acc2",
          name: "Capa Protetora para Smartphone",
          description: "Capa protetora anti-impacto para smartphones, material TPU",
          price: 39.9,
          stock: 50,
          category: "acessorios",
          onlineStore: true,
          imageUrl: "/placeholder.svg?height=500&width=500",
        },
        {
          id: "acc3",
          name: "Película de Vidro Temperado",
          description: "Película de proteção em vidro temperado 9H para smartphones",
          price: 29.9,
          stock: 60,
          category: "acessorios",
          onlineStore: true,
          imageUrl: "/placeholder.svg?height=500&width=500",
        },
        {
          id: "acc4",
          name: "Suporte para Notebook",
          description: "Suporte ergonômico ajustável para notebook, material alumínio",
          price: 79.9,
          stock: 25,
          category: "acessorios",
          onlineStore: true,
          imageUrl: "/placeholder.svg?height=500&width=500",
        },
        {
          id: "acc5",
          name: "Mousepad Gamer XL",
          description: "Mousepad gamer tamanho XL (80x30cm) com base antiderrapante",
          price: 59.9,
          stock: 35,
          category: "acessorios",
          onlineStore: true,
          imageUrl: "/placeholder.svg?height=500&width=500",
        },
      ]

      // Merge existing and new products, avoiding duplicates by ID
      const existingIds = new Set(existingProducts.map((p: any) => p.id))
      const newProducts = additionalProducts.filter((p) => !existingIds.has(p.id))

      const mergedProducts = [...existingProducts, ...newProducts]

      // Save to localStorage
      localStorage.setItem("products", JSON.stringify(mergedProducts))

      console.log(`Added ${newProducts.length} new products to the store`)
    }

    // Adicione ou atualize a inicialização das features
    const defaultCompanySettings = {
      name: "Tecno Mania",
      logoUrl: "/images/logo.png",
      businessType: "retail", // ou "restaurant" para testar os recursos de restaurante
      features: {
        inventory: true,
        kitchen: true,
        tables: true,
        delivery: true,
        serviceOrders: true,
      },
    }

    // Certifique-se de que isso seja salvo no localStorage
    localStorage.setItem("companySettings", JSON.stringify(defaultCompanySettings))
  }, [])

  // This component doesn't render anything
  return null
}


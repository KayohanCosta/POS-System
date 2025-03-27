"use client"

// Serviço de sincronização com a nuvem
import { useState, useEffect } from "react"

// Tipos para sincronização
export type SyncStatus = "idle" | "syncing" | "success" | "error"
export type SyncStats = {
  lastSync: string | null
  pendingChanges: number
  syncedItems: number
}

// Modificar a definição de SyncConfig para incluir provedores de nuvem
export type CloudProvider = "google-drive" | "dropbox" | "mega" | "onedrive" | "custom-api"

export type SyncConfig = {
  enabled: boolean
  autoSync: boolean
  syncInterval: number // em minutos
  provider: CloudProvider
  folderPath?: string
  apiKey?: string
  endpoint?: string
  lastAuthTime?: string
  accessToken?: string
  refreshToken?: string
  tokenExpiry?: string
}

// Função para verificar se estamos no navegador
const isBrowser = () => typeof window !== "undefined"

// Obter configuração de sincronização
export const getSyncConfig = (): SyncConfig => {
  if (!isBrowser()) return defaultSyncConfig

  const stored = localStorage.getItem("syncConfig")
  if (!stored) return defaultSyncConfig

  try {
    return JSON.parse(stored)
  } catch (e) {
    console.error("Erro ao analisar configuração de sincronização", e)
    return defaultSyncConfig
  }
}

// Salvar configuração de sincronização
export const saveSyncConfig = (config: SyncConfig): void => {
  if (!isBrowser()) return
  localStorage.setItem("syncConfig", JSON.stringify(config))
}

// Atualizar a configuração padrão
const defaultSyncConfig: SyncConfig = {
  enabled: false,
  autoSync: true,
  syncInterval: 30,
  provider: "google-drive",
  folderPath: "POS-System-Backup",
  apiKey: "",
  endpoint: "https://api.example.com/sync",
}

// Obter estatísticas de sincronização
export const getSyncStats = (): SyncStats => {
  if (!isBrowser()) return { lastSync: null, pendingChanges: 0, syncedItems: 0 }

  const stored = localStorage.getItem("syncStats")
  if (!stored) return { lastSync: null, pendingChanges: 0, syncedItems: 0 }

  try {
    return JSON.parse(stored)
  } catch (e) {
    console.error("Erro ao analisar estatísticas de sincronização", e)
    return { lastSync: null, pendingChanges: 0, syncedItems: 0 }
  }
}

// Salvar estatísticas de sincronização
export const saveSyncStats = (stats: SyncStats): void => {
  if (!isBrowser()) return
  localStorage.setItem("syncStats", JSON.stringify(stats))
}

// Rastrear alterações para sincronização
export const trackChange = (entityType: string, entityId: string, action: "create" | "update" | "delete"): void => {
  if (!isBrowser()) return

  const pendingChanges = JSON.parse(localStorage.getItem("pendingChanges") || "[]")
  pendingChanges.push({
    entityType,
    entityId,
    action,
    timestamp: new Date().toISOString(),
  })

  localStorage.setItem("pendingChanges", JSON.stringify(pendingChanges))

  // Atualizar estatísticas
  const stats = getSyncStats()
  stats.pendingChanges = pendingChanges.length
  saveSyncStats(stats)
}

// Adicionar função para obter URL de autenticação
export const getAuthUrl = (provider: CloudProvider): string => {
  switch (provider) {
    case "google-drive":
      // Em um ambiente real, você registraria um app no Google Cloud Console
      // e usaria as credenciais para gerar esta URL
      return "https://accounts.google.com/o/oauth2/v2/auth?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&response_type=code&scope=https://www.googleapis.com/auth/drive.file&access_type=offline"

    case "dropbox":
      // Em um ambiente real, você registraria um app no Dropbox Developer Console
      return "https://www.dropbox.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&response_type=code"

    case "mega":
      // Mega usa um sistema diferente, normalmente baseado em credenciais
      return "https://mega.nz/"

    case "onedrive":
      return "https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&response_type=code&scope=files.readwrite"

    default:
      return ""
  }
}

// Modificar a função syncWithCloud para suportar diferentes provedores
export const syncWithCloud = async (): Promise<boolean> => {
  if (!isBrowser()) return false

  const config = getSyncConfig()
  if (!config.enabled) return false

  // Obter alterações pendentes
  const pendingChanges = JSON.parse(localStorage.getItem("pendingChanges") || "[]")
  if (pendingChanges.length === 0) return true

  // Preparar dados para sincronização
  const dataToSync = {
    changes: pendingChanges,
    deviceId: localStorage.getItem("deviceId") || "unknown",
    timestamp: new Date().toISOString(),
  }

  try {
    console.log(`Sincronizando dados com ${config.provider}:`, dataToSync)

    // Simular atraso de rede
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Lógica específica para cada provedor
    switch (config.provider) {
      case "google-drive":
        // Em um ambiente real, você usaria a API do Google Drive
        console.log("Sincronizando com Google Drive")
        // await syncWithGoogleDrive(dataToSync, config);
        break

      case "dropbox":
        // Em um ambiente real, você usaria a API do Dropbox
        console.log("Sincronizando com Dropbox")
        // await syncWithDropbox(dataToSync, config);
        break

      case "mega":
        // Em um ambiente real, você usaria a API do Mega
        console.log("Sincronizando com Mega.nz")
        // await syncWithMega(dataToSync, config);
        break

      case "onedrive":
        // Em um ambiente real, você usaria a API do OneDrive
        console.log("Sincronizando com OneDrive")
        // await syncWithOneDrive(dataToSync, config);
        break

      case "custom-api":
        // Usar a API personalizada existente
        console.log("Sincronizando com API personalizada")
        // const response = await fetch(config.endpoint, {
        //   method: 'POST',
        //   headers: {
        //     'Content-Type': 'application/json',
        //     'Authorization': `Bearer ${config.apiKey}`,
        //   },
        //   body: JSON.stringify(dataToSync),
        // });
        // if (!response.ok) throw new Error('Falha na sincronização');
        break
    }

    // Limpar alterações pendentes após sincronização bem-sucedida
    localStorage.setItem("pendingChanges", "[]")

    // Atualizar estatísticas
    const stats = getSyncStats()
    stats.lastSync = new Date().toISOString()
    stats.pendingChanges = 0
    stats.syncedItems += pendingChanges.length
    saveSyncStats(stats)

    return true
  } catch (error) {
    console.error(`Erro ao sincronizar com ${config.provider}:`, error)
    return false
  }
}

// Adicionar função para verificar se o token está expirado
export const isTokenExpired = (config: SyncConfig): boolean => {
  if (!config.tokenExpiry) return true

  const expiryDate = new Date(config.tokenExpiry)
  const now = new Date()

  // Considerar expirado se faltar menos de 5 minutos
  return expiryDate.getTime() - now.getTime() < 5 * 60 * 1000
}

// Adicionar função para renovar o token
export const refreshAuthToken = async (config: SyncConfig): Promise<SyncConfig> => {
  // Em um ambiente real, você implementaria a renovação do token
  // usando o refreshToken armazenado
  console.log("Renovando token de autenticação")

  // Simular renovação bem-sucedida
  const updatedConfig = {
    ...config,
    accessToken: "novo_token_" + Date.now(),
    tokenExpiry: new Date(Date.now() + 3600 * 1000).toISOString(), // Expira em 1 hora
  }

  saveSyncConfig(updatedConfig)
  return updatedConfig
}

// Adicionar função para exportar dados
export const exportData = async (): Promise<string> => {
  // Coletar todos os dados relevantes do localStorage
  const dataToExport: Record<string, any> = {}

  // Lista de chaves a serem exportadas
  const keysToExport = [
    "users",
    "roles",
    "products",
    "productCategories",
    "sales",
    "serviceOrders",
    "customers",
    "companySettings",
  ]

  for (const key of keysToExport) {
    const data = localStorage.getItem(key)
    if (data) {
      try {
        dataToExport[key] = JSON.parse(data)
      } catch (e) {
        dataToExport[key] = data
      }
    }
  }

  // Adicionar metadados
  dataToExport._metadata = {
    exportDate: new Date().toISOString(),
    deviceId: localStorage.getItem("deviceId") || "unknown",
    version: "1.0",
  }

  // Converter para JSON
  return JSON.stringify(dataToExport)
}

// Adicionar função para importar dados
export const importData = async (jsonData: string): Promise<boolean> => {
  try {
    const data = JSON.parse(jsonData)

    // Verificar metadados
    if (!data._metadata) {
      throw new Error("Dados inválidos: metadados ausentes")
    }

    // Importar cada conjunto de dados
    for (const [key, value] of Object.entries(data)) {
      if (key !== "_metadata") {
        localStorage.setItem(key, JSON.stringify(value))
      }
    }

    return true
  } catch (error) {
    console.error("Erro ao importar dados:", error)
    return false
  }
}

// Hook para gerenciar sincronização
export function useCloudSync() {
  const [status, setStatus] = useState<SyncStatus>("idle")
  const [stats, setStats] = useState<SyncStats>(getSyncStats())
  const [config, setConfig] = useState<SyncConfig>(getSyncConfig())

  // Carregar configuração e estatísticas
  useEffect(() => {
    if (!isBrowser()) return

    setConfig(getSyncConfig())
    setStats(getSyncStats())

    // Gerar ID de dispositivo se não existir
    if (!localStorage.getItem("deviceId")) {
      localStorage.setItem("deviceId", `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`)
    }
  }, [])

  // Configurar sincronização automática
  useEffect(() => {
    if (!isBrowser() || !config.enabled || !config.autoSync) return

    const interval = setInterval(
      async () => {
        setStatus("syncing")
        const success = await syncWithCloud()
        setStatus(success ? "success" : "error")
        setStats(getSyncStats())
      },
      config.syncInterval * 60 * 1000,
    )

    return () => clearInterval(interval)
  }, [config])

  // Função para sincronização manual
  const syncNow = async () => {
    setStatus("syncing")
    const success = await syncWithCloud()
    setStatus(success ? "success" : "error")
    setStats(getSyncStats())
  }

  // Função para atualizar configuração
  const updateConfig = (newConfig: Partial<SyncConfig>) => {
    const updatedConfig = { ...config, ...newConfig }
    setConfig(updatedConfig)
    saveSyncConfig(updatedConfig)
  }

  return { status, stats, config, syncNow, updateConfig }
}


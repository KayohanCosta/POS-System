"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import {
  Cloud,
  CloudOff,
  RefreshCw,
  Check,
  AlertCircle,
  Clock,
  Download,
  Upload,
  FolderOpen,
  LogIn,
} from "lucide-react"
import { useCloudSync, type CloudProvider, getAuthUrl, exportData } from "@/lib/sync-service"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

export default function CloudSyncComponent() {
  const { toast } = useToast()
  const { status, stats, config, syncNow, updateConfig } = useCloudSync()
  const [exportedData, setExportedData] = useState<string>("")
  const [importData, setImportData] = useState<string>("")
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleSyncNow = async () => {
    try {
      await syncNow()
      toast({
        title: "Sincronização concluída",
        description: "Seus dados foram sincronizados com a nuvem",
      })
    } catch (error) {
      toast({
        title: "Erro na sincronização",
        description: "Não foi possível sincronizar seus dados",
        variant: "destructive",
      })
    }
  }

  const handleToggleSync = (enabled: boolean) => {
    updateConfig({ enabled })

    toast({
      title: enabled ? "Sincronização ativada" : "Sincronização desativada",
      description: enabled
        ? "Seus dados serão sincronizados automaticamente"
        : "A sincronização automática foi desativada",
    })
  }

  const handleToggleAutoSync = (autoSync: boolean) => {
    updateConfig({ autoSync })
  }

  const handleIntervalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const syncInterval = Number.parseInt(e.target.value, 10)
    if (!isNaN(syncInterval) && syncInterval > 0) {
      updateConfig({ syncInterval })
    }
  }

  const handleProviderChange = (provider: CloudProvider) => {
    updateConfig({ provider })

    toast({
      title: "Provedor alterado",
      description: `Sincronização configurada para usar ${getProviderName(provider)}`,
    })
  }

  const handleFolderPathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateConfig({ folderPath: e.target.value })
  }

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateConfig({ apiKey: e.target.value })
  }

  const handleAuth = () => {
    const authUrl = getAuthUrl(config.provider)
    if (authUrl) {
      window.open(authUrl, "_blank")
    } else {
      toast({
        title: "Erro de autenticação",
        description: "Não foi possível iniciar o processo de autenticação",
        variant: "destructive",
      })
    }
  }

  const handleExportData = async () => {
    setIsExporting(true)
    try {
      const data = await exportData()
      setExportedData(data)
      toast({
        title: "Dados exportados",
        description: "Seus dados foram exportados com sucesso. Copie o texto ou faça o download do arquivo.",
      })
    } catch (error) {
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar seus dados",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleDownloadExport = () => {
    if (!exportedData) return

    const blob = new Blob([exportedData], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `pos-system-backup-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleFileUpload = () => {
    if (!selectedFile) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      if (e.target?.result) {
        setImportData(e.target.result as string)
      }
    }
    reader.readAsText(selectedFile)
  }

  const handleImportData = async () => {
    if (!importData) return

    setIsImporting(true)
    try {
      const success = await importData(importData)
      if (success) {
        toast({
          title: "Dados importados",
          description: "Seus dados foram importados com sucesso",
        })
        // Recarregar a página para aplicar as alterações
        setTimeout(() => window.location.reload(), 2000)
      } else {
        throw new Error("Falha na importação")
      }
    } catch (error) {
      toast({
        title: "Erro na importação",
        description: "Não foi possível importar seus dados. Verifique se o formato é válido.",
        variant: "destructive",
      })
    } finally {
      setIsImporting(false)
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case "syncing":
        return <RefreshCw className="h-4 w-4 animate-spin" />
      case "success":
        return <Check className="h-4 w-4 text-green-500" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusText = () => {
    switch (status) {
      case "syncing":
        return "Sincronizando..."
      case "success":
        return "Sincronizado"
      case "error":
        return "Erro na sincronização"
      default:
        return "Aguardando"
    }
  }

  const formatLastSync = () => {
    if (!stats.lastSync) return "Nunca sincronizado"

    const lastSync = new Date(stats.lastSync)
    return lastSync.toLocaleString()
  }

  const getProviderName = (provider: CloudProvider): string => {
    switch (provider) {
      case "google-drive":
        return "Google Drive"
      case "dropbox":
        return "Dropbox"
      case "mega":
        return "MEGA"
      case "onedrive":
        return "OneDrive"
      case "custom-api":
        return "API Personalizada"
      default:
        return provider
    }
  }

  const getProviderDescription = (provider: CloudProvider): string => {
    switch (provider) {
      case "google-drive":
        return "Sincronize seus dados com o Google Drive"
      case "dropbox":
        return "Sincronize seus dados com o Dropbox"
      case "mega":
        return "Sincronize seus dados com o MEGA"
      case "onedrive":
        return "Sincronize seus dados com o OneDrive"
      case "custom-api":
        return "Sincronize seus dados com uma API personalizada"
      default:
        return ""
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {config.enabled ? <Cloud className="h-5 w-5" /> : <CloudOff className="h-5 w-5" />}
          Sincronização com a Nuvem
        </CardTitle>
        <CardDescription>Mantenha seus dados seguros e acessíveis em múltiplos dispositivos</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="cloud" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="cloud">Sincronização na Nuvem</TabsTrigger>
            <TabsTrigger value="manual">Backup Manual</TabsTrigger>
          </TabsList>

          <TabsContent value="cloud" className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-medium">Sincronização</span>
                <span className="text-sm text-muted-foreground">{config.enabled ? "Ativada" : "Desativada"}</span>
              </div>
              <Switch checked={config.enabled} onCheckedChange={handleToggleSync} />
            </div>

            {config.enabled && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="provider">Serviço de Armazenamento</Label>
                  <Select
                    value={config.provider}
                    onValueChange={(value) => handleProviderChange(value as CloudProvider)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um serviço" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="google-drive">Google Drive</SelectItem>
                      <SelectItem value="dropbox">Dropbox</SelectItem>
                      <SelectItem value="mega">MEGA</SelectItem>
                      <SelectItem value="onedrive">OneDrive</SelectItem>
                      <SelectItem value="custom-api">API Personalizada</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">{getProviderDescription(config.provider)}</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-medium">Sincronização automática</span>
                    <span className="text-sm text-muted-foreground">
                      Sincronizar a cada {config.syncInterval} minutos
                    </span>
                  </div>
                  <Switch checked={config.autoSync} onCheckedChange={handleToggleAutoSync} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="syncInterval">Intervalo de sincronização (minutos)</Label>
                  <Input
                    id="syncInterval"
                    type="number"
                    min="5"
                    value={config.syncInterval}
                    onChange={handleIntervalChange}
                    disabled={!config.autoSync}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="folderPath">Pasta de Backup</Label>
                  <div className="flex gap-2">
                    <Input
                      id="folderPath"
                      value={config.folderPath || ""}
                      onChange={handleFolderPathChange}
                      placeholder="Nome da pasta para armazenar os backups"
                    />
                    <Button variant="outline" size="icon" title="Selecionar pasta">
                      <FolderOpen className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Pasta onde os arquivos de backup serão armazenados</p>
                </div>

                {config.provider === "custom-api" && (
                  <div className="space-y-2">
                    <Label htmlFor="apiKey">Chave de API</Label>
                    <Input
                      id="apiKey"
                      type="password"
                      value={config.apiKey || ""}
                      onChange={handleApiKeyChange}
                      placeholder="Insira sua chave de API"
                    />
                    <p className="text-xs text-muted-foreground">
                      Obtenha sua chave de API no painel de controle da nuvem
                    </p>
                  </div>
                )}

                {config.provider !== "custom-api" && (
                  <div className="space-y-2">
                    <Label>Autenticação</Label>
                    <div className="flex justify-between items-center p-3 border rounded-md">
                      <div>
                        <p className="font-medium text-sm">Conectar ao {getProviderName(config.provider)}</p>
                        <p className="text-xs text-muted-foreground">
                          {config.lastAuthTime
                            ? `Última autenticação: ${new Date(config.lastAuthTime).toLocaleString()}`
                            : "Não autenticado"}
                        </p>
                      </div>
                      <Button onClick={handleAuth} size="sm" className="gap-1">
                        <LogIn className="h-4 w-4" />
                        Autenticar
                      </Button>
                    </div>
                  </div>
                )}

                <div className="rounded-md border p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Status</span>
                    <Badge variant={status === "error" ? "destructive" : "outline"} className="flex items-center gap-1">
                      {getStatusIcon()}
                      {getStatusText()}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Última sincronização:</span>
                      <p>{formatLastSync()}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Alterações pendentes:</span>
                      <p>{stats.pendingChanges}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Itens sincronizados:</span>
                      <p>{stats.syncedItems}</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="manual" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Exportar Dados</Label>
              <p className="text-sm text-muted-foreground">
                Exporte seus dados para um arquivo JSON que pode ser importado posteriormente.
              </p>
              <div className="flex gap-2 mt-2">
                <Button onClick={handleExportData} disabled={isExporting} className="gap-1">
                  {isExporting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Exportando...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Exportar Dados
                    </>
                  )}
                </Button>
                {exportedData && (
                  <Button variant="outline" onClick={handleDownloadExport} className="gap-1">
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                )}
              </div>

              {exportedData && (
                <div className="mt-2">
                  <Textarea
                    value={exportedData}
                    readOnly
                    className="h-32 font-mono text-xs"
                    placeholder="Dados exportados aparecerão aqui"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Copie este texto ou faça o download do arquivo para guardar seu backup.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2 pt-4 border-t">
              <Label>Importar Dados</Label>
              <p className="text-sm text-muted-foreground">
                Importe dados de um backup anterior. Isso substituirá seus dados atuais.
              </p>

              <div className="space-y-2 mt-2">
                <Label htmlFor="importFile">Selecionar arquivo de backup</Label>
                <div className="flex gap-2">
                  <Input id="importFile" type="file" accept=".json" onChange={handleFileChange} />
                  <Button
                    variant="outline"
                    onClick={handleFileUpload}
                    disabled={!selectedFile}
                    className="whitespace-nowrap"
                  >
                    Carregar Arquivo
                  </Button>
                </div>

                <Label htmlFor="importData">Ou cole o conteúdo do backup</Label>
                <Textarea
                  id="importData"
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  className="h-32 font-mono text-xs"
                  placeholder="Cole o conteúdo do backup aqui"
                />

                <div className="flex justify-end">
                  <Button
                    onClick={handleImportData}
                    disabled={!importData || isImporting}
                    variant="destructive"
                    className="gap-1"
                  >
                    {isImporting ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Importando...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        Importar Dados
                      </>
                    )}
                  </Button>
                </div>

                <p className="text-xs text-red-500 font-medium">
                  Atenção: A importação substituirá todos os seus dados atuais. Faça um backup antes de continuar.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSyncNow} disabled={!config.enabled || status === "syncing"} className="w-full gap-1">
          {status === "syncing" ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Sincronizando...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Sincronizar Agora
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}


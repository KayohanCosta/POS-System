"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { processOAuthCallback } from "@/lib/payment-service"
import { Check, X, Loader2, AlertTriangle } from "lucide-react"

export default function OAuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"loading" | "success" | "error" | "direct_access">("loading")
  const [message, setMessage] = useState("Processando autenticação...")

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Obter código e estado da URL
        const code = searchParams.get("code")
        const state = searchParams.get("state")

        // Verificar se o usuário está acessando a página diretamente
        if (!code || !state) {
          setStatus("direct_access")
          setMessage(
            "Acesso direto à página de callback detectado. Por favor, inicie o processo de autenticação pela página de configurações.",
          )
          return
        }

        // Verificar se existe um estado salvo no localStorage
        const savedState = localStorage.getItem("oauth_state")
        if (!savedState) {
          setStatus("direct_access")
          setMessage(
            "Nenhuma sessão de autenticação ativa encontrada. Por favor, inicie o processo de autenticação pela página de configurações.",
          )
          return
        }

        // Verificar se o estado da URL corresponde ao estado salvo
        if (savedState !== state) {
          setStatus("error")
          setMessage("Estado de autenticação inválido. Isso pode indicar uma tentativa de falsificação de solicitação.")
          return
        }

        // Processar callback
        const connection = await processOAuthCallback(code, state)

        if (connection) {
          setStatus("success")
          setMessage(`Conexão estabelecida com sucesso com ${connection.name}`)
        } else {
          throw new Error("Não foi possível estabelecer a conexão")
        }
      } catch (error: any) {
        setStatus("error")
        setMessage(error.message || "Ocorreu um erro durante a autenticação")
        console.error("Erro no callback OAuth:", error)
      }
    }

    processCallback()
  }, [searchParams])

  return (
    <div className="container flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {status === "loading" && <Loader2 className="h-5 w-5 animate-spin" />}
            {status === "success" && <Check className="h-5 w-5 text-green-500" />}
            {status === "error" && <X className="h-5 w-5 text-red-500" />}
            {status === "direct_access" && <AlertTriangle className="h-5 w-5 text-amber-500" />}
            Autenticação Bancária
          </CardTitle>
          <CardDescription>
            {status === "loading"
              ? "Processando sua autenticação..."
              : status === "success"
                ? "Autenticação concluída com sucesso"
                : status === "direct_access"
                  ? "Acesso direto detectado"
                  : "Falha na autenticação"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center py-4">{message}</p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={() => router.push("/settings")}>Voltar para Configurações</Button>
        </CardFooter>
      </Card>
    </div>
  )
}


"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { Award, Gift, Calendar } from "lucide-react"
import { useLoyalty } from "@/lib/loyalty-service"

export default function LoyaltyProgramComponent() {
  const { toast } = useToast()
  const { program, updateProgram, checkBirthdayBonuses } = useLoyalty()

  const handleToggleProgram = (enabled: boolean) => {
    updateProgram({ enabled })

    toast({
      title: enabled ? "Programa de fidelidade ativado" : "Programa de fidelidade desativado",
      description: enabled
        ? "Os clientes agora podem acumular e resgatar pontos"
        : "O programa de fidelidade foi desativado",
    })
  }

  const handlePointsPerCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseFloat(e.target.value)
    if (!isNaN(value) && value >= 0) {
      updateProgram({ pointsPerCurrency: value })
    }
  }

  const handleMinimumPurchaseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseFloat(e.target.value)
    if (!isNaN(value) && value >= 0) {
      updateProgram({ minimumPurchase: value })
    }
  }

  const handlePointsValidityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value, 10)
    if (!isNaN(value) && value >= 0) {
      updateProgram({ pointsValidity: value })
    }
  }

  const handleRedemptionRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseFloat(e.target.value)
    if (!isNaN(value) && value >= 0) {
      updateProgram({ redemptionRate: value })
    }
  }

  const handleMinimumRedemptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value, 10)
    if (!isNaN(value) && value >= 0) {
      updateProgram({ minimumRedemption: value })
    }
  }

  const handleWelcomeBonusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value, 10)
    if (!isNaN(value) && value >= 0) {
      updateProgram({ welcomeBonus: value })
    }
  }

  const handleBirthdayBonusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value, 10)
    if (!isNaN(value) && value >= 0) {
      updateProgram({ birthdayBonus: value })
    }
  }

  const handleCheckBirthdayBonuses = () => {
    const transactions = checkBirthdayBonuses()

    if (transactions.length > 0) {
      toast({
        title: "Bônus de aniversário concedido",
        description: `${transactions.length} cliente(s) receberam bônus de aniversário hoje`,
      })
    } else {
      toast({
        title: "Nenhum aniversariante hoje",
        description: "Não há clientes fazendo aniversário hoje",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          Programa de Fidelidade
        </CardTitle>
        <CardDescription>Configure seu programa de pontos e fidelização de clientes</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-medium">Programa de Fidelidade</span>
            <span className="text-sm text-muted-foreground">{program.enabled ? "Ativado" : "Desativado"}</span>
          </div>
          <Switch checked={program.enabled} onCheckedChange={handleToggleProgram} />
        </div>

        {program.enabled && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pointsPerCurrency">Pontos por unidade monetária</Label>
                <Input
                  id="pointsPerCurrency"
                  type="number"
                  min="0"
                  step="0.1"
                  value={program.pointsPerCurrency}
                  onChange={handlePointsPerCurrencyChange}
                />
                <p className="text-xs text-muted-foreground">
                  Quantos pontos o cliente ganha a cada R$ 1,00 em compras
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="minimumPurchase">Compra mínima (R$)</Label>
                <Input
                  id="minimumPurchase"
                  type="number"
                  min="0"
                  step="0.01"
                  value={program.minimumPurchase}
                  onChange={handleMinimumPurchaseChange}
                />
                <p className="text-xs text-muted-foreground">Valor mínimo de compra para ganhar pontos</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pointsValidity">Validade dos pontos (dias)</Label>
                <Input
                  id="pointsValidity"
                  type="number"
                  min="0"
                  value={program.pointsValidity}
                  onChange={handlePointsValidityChange}
                />
                <p className="text-xs text-muted-foreground">Quantos dias os pontos são válidos (0 = sem expiração)</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="redemptionRate">Valor de resgate (R$)</Label>
                <Input
                  id="redemptionRate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={program.redemptionRate}
                  onChange={handleRedemptionRateChange}
                />
                <p className="text-xs text-muted-foreground">Valor em R$ de cada ponto na hora do resgate</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="minimumRedemption">Resgate mínimo (pontos)</Label>
                <Input
                  id="minimumRedemption"
                  type="number"
                  min="0"
                  value={program.minimumRedemption}
                  onChange={handleMinimumRedemptionChange}
                />
                <p className="text-xs text-muted-foreground">Quantidade mínima de pontos para resgate</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="welcomeBonus">Bônus de boas-vindas (pontos)</Label>
                <Input
                  id="welcomeBonus"
                  type="number"
                  min="0"
                  value={program.welcomeBonus}
                  onChange={handleWelcomeBonusChange}
                />
                <p className="text-xs text-muted-foreground">Pontos concedidos ao cadastrar um novo cliente</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthdayBonus">Bônus de aniversário (pontos)</Label>
                <Input
                  id="birthdayBonus"
                  type="number"
                  min="0"
                  value={program.birthdayBonus}
                  onChange={handleBirthdayBonusChange}
                />
                <p className="text-xs text-muted-foreground">Pontos concedidos no aniversário do cliente</p>
              </div>
            </div>

            <div className="rounded-md border p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-green-500" />
                <span className="font-medium">Exemplo de acúmulo e resgate</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="font-medium">Acúmulo de pontos:</p>
                  <p>Compra de R$ 100,00 = {Math.floor(100 * program.pointsPerCurrency)} pontos</p>
                  <p>Compra de R$ 500,00 = {Math.floor(500 * program.pointsPerCurrency)} pontos</p>
                </div>

                <div className="space-y-1">
                  <p className="font-medium">Resgate de pontos:</p>
                  <p>100 pontos = {(100 * program.redemptionRate).toFixed(2)} em compras</p>
                  <p>500 pontos = {(500 * program.redemptionRate).toFixed(2)} em compras</p>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row gap-2">
        <Button
          onClick={handleCheckBirthdayBonuses}
          disabled={!program.enabled || program.birthdayBonus <= 0}
          variant="outline"
          className="w-full sm:w-auto"
        >
          <Calendar className="mr-2 h-4 w-4" />
          Verificar Aniversariantes
        </Button>

        <Button onClick={() => updateProgram(program)} className="w-full sm:w-auto">
          Salvar Configurações
        </Button>
      </CardFooter>
    </Card>
  )
}


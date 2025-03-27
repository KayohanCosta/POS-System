import BankConnections from "@/components/bank-connections"

export default function BankConnectionsPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Conexões Bancárias</h1>
      <BankConnections />
    </div>
  )
}


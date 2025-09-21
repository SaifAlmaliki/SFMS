import { AdversaryEmulation } from "@/components/response/adversary-emulation";
import { IncidentManagement } from "@/components/response/incident-management";


export default function ResponsePage() {
    return (
      <div className="space-y-4">
        <div className="space-y-1">
            <h1 className="text-2xl font-bold">Incident & Response</h1>
            <p className="text-muted-foreground">
                Manage incidents and simulate adversary tactics against your infrastructure.
            </p>
        </div>
  
        <div className="grid gap-6 lg:grid-cols-2">
            <IncidentManagement />
            <AdversaryEmulation />
        </div>
      </div>
    );
  }
  
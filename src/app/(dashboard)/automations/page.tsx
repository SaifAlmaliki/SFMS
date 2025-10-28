import { WorkflowOrchestration } from "@/components/automations/workflow-orchestration";


export default function AutomationsPage() {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Automations</h1>
        <p className="text-muted-foreground">
          Create and manage event-driven automations.
        </p>
  
        <WorkflowOrchestration />
      </div>
    );
  }
  
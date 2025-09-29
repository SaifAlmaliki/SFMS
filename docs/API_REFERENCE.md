# AI Firewall API Reference

This document provides a comprehensive overview of all APIs available in the AI Firewall Automation Platform.

## Table of Contents

- [Server Actions (Form Handlers)](#server-actions-form-handlers)
- [Data Layer Functions](#data-layer-functions)
- [AI Flow Functions](#ai-flow-functions)
- [Database Schema](#database-schema)

---

## Server Actions (Form Handlers)

Server Actions are Next.js server-side functions that handle form submissions and user interactions. They are defined in `src/app/actions.ts`.

### Policy Management

#### `generatePolicyAction(prevState, formData)`
**Purpose**: Generate firewall policy from natural language description  
**Input**: 
- `description` (string, min 10 chars): Natural language policy description
**Output**: Generated policy in structured format or validation errors  
**Example**: "Allow HTTPS traffic from internal network to DMZ"

#### `createPolicyAction(prevState, formData)`
**Purpose**: Create a new firewall policy  
**Input**:
- `name` (string): Policy name
- `source` (string): Source network/object
- `destination` (string): Destination network/object  
- `action` (enum): 'Allow' | 'Deny'
- `status` (enum): 'Active' | 'Inactive' | 'Pending Approval'
**Output**: Success confirmation or validation errors

#### `updatePolicyAction(prevState, formData)`
**Purpose**: Update an existing firewall policy  
**Input**: Same as createPolicyAction plus `id` (string)  
**Output**: Success confirmation or validation errors

#### `deletePolicyAction(prevState, formData)`
**Purpose**: Delete a firewall policy  
**Input**: `id` (string): Policy ID  
**Output**: Success confirmation or error message

#### `approvePolicyAction(prevState, formData)`
**Purpose**: Approve a pending policy (sets status to 'Active')  
**Input**: `id` (string): Policy ID  
**Output**: Success confirmation or error message

#### `rejectPolicyAction(prevState, formData)`
**Purpose**: Reject a pending policy (deletes it)  
**Input**: `id` (string): Policy ID  
**Output**: Success confirmation or error message

### AI Assistant

#### `chatAction(prevState, formData)`
**Purpose**: Chat with AI assistant for firewall management help  
**Input**: `query` (string): User question or request  
**Output**: AI assistant response or error message

### AI Tools

#### `selfHealingAction(prevState, formData)`
**Purpose**: Analyze firewall configuration for misconfigurations and suggest fixes  
**Input**:
- `firewallConfiguration` (string): Current firewall config
- `guardrails` (string): Security guardrails to check against
- `autoCorrect` (boolean): Whether to auto-apply fixes
**Output**: Analysis results with suggested fixes

#### `modelManagementAction(prevState, formData)`
**Purpose**: Manage AI model retraining, evaluation, and versioning  
**Input**:
- `modelName` (string): Name of the model to manage
- `retrain` (boolean): Whether to retrain the model
- `evaluate` (boolean): Whether to evaluate model performance
- `version` (boolean): Whether to create a new version
**Output**: Model management results

#### `anomalyDetectionAction(prevState, formData)`
**Purpose**: Detect anomalies in admin actions and access patterns  
**Input**:
- `adminActions` (string): Log of admin actions
- `accessPatterns` (string): Log of access patterns
**Output**: Detected anomalies and risk assessment

#### `validatePolicyAction(prevState, formData)`
**Purpose**: Validate firewall policy for best practices and conflicts  
**Input**: `policy` (string): Policy to validate  
**Output**: Validation results with issues and recommendations

#### `simulatePolicyAction(prevState, formData)`
**Purpose**: Simulate traffic flow against policy set (dry run)  
**Input**:
- `policySet` (string): Set of policies to test against
- `trafficFlow` (string): Traffic flow to simulate
**Output**: Simulation results showing allowed/blocked traffic

#### `emulateAdversaryAction(prevState, formData)`
**Purpose**: Emulate adversary attacks using MITRE ATT&CK techniques  
**Input**:
- `policySet` (string): Current policy set
- `attackTechniqueId` (string): MITRE ATT&CK technique ID
**Output**: Attack simulation results and policy effectiveness

#### `createIncidentAction(prevState, formData)`
**Purpose**: Create security incident from event description  
**Input**: `eventDescription` (string): Description of the security event  
**Output**: Created incident details

### Configuration Management

#### `rollbackSnapshotAction(prevState, formData)`
**Purpose**: Rollback to a previous configuration snapshot  
**Input**: `version` (string): Snapshot version to rollback to  
**Output**: Success confirmation or error message

---

## Data Layer Functions

Data layer functions provide database access through Prisma ORM. They are defined in `src/lib/data.ts`.

### Policy Operations

#### `getPolicies(): Promise<Policy[]>`
**Purpose**: Retrieve all firewall policies from database  
**Returns**: Array of Policy objects with converted status enums

#### `addPolicy(policy: Omit<Policy, 'id'>): Promise<Policy[]>`
**Purpose**: Add a new policy to database  
**Input**: Policy object without ID (auto-generated)  
**Returns**: Updated list of all policies

#### `updatePolicy(updatedPolicy: Partial<Policy> & { id: string }): Promise<Policy[]>`
**Purpose**: Update an existing policy  
**Input**: Partial policy object with required ID  
**Returns**: Updated list of all policies

#### `deletePolicy(policyId: string): Promise<Policy[]>`
**Purpose**: Delete a policy by ID  
**Input**: Policy ID string  
**Returns**: Updated list of all policies

### Network Objects

#### `getDevices(): Promise<Device[]>`
**Purpose**: Retrieve all firewall devices  
**Returns**: Array of Device objects (name, ip)

#### `getAddressObjects(): Promise<AddressObject[]>`
**Purpose**: Retrieve all address objects  
**Returns**: Array of AddressObject objects (IP ranges, FQDNs, geography)

#### `getServiceObjects(): Promise<ServiceObject[]>`
**Purpose**: Retrieve all service objects  
**Returns**: Array of ServiceObject objects (protocols, ports)

#### `getObjectGroups(): Promise<ObjectGroup[]>`
**Purpose**: Retrieve all object groups  
**Returns**: Array of ObjectGroup objects (address/service groups)

### Configuration Management

#### `getSnapshots(): Promise<Snapshot[]>`
**Purpose**: Retrieve all configuration snapshots  
**Returns**: Array of Snapshot objects with version history

#### `rollbackSnapshot(version: string): Promise<Snapshot[]>`
**Purpose**: Rollback to specific snapshot version  
**Input**: Version string (e.g., "v1.2.3")  
**Returns**: Updated list of snapshots with new live version

#### `getSnapshotDiff(version: string): string`
**Purpose**: Get diff between current and specified snapshot  
**Input**: Version string  
**Returns**: Diff string showing changes (currently mocked)

### Templates and Compliance

#### `getPolicyTemplates(): Promise<PolicyTemplate[]>`
**Purpose**: Retrieve all policy templates  
**Returns**: Array of PolicyTemplate objects for reuse

#### `getComplianceReports(): ComplianceReport[]`
**Purpose**: Get compliance framework reports  
**Returns**: Array of compliance reports (PCI DSS, HIPAA, GDPR, ISO 27001)

#### `getComplianceReportByFramework(framework: string): ComplianceReport | undefined`
**Purpose**: Get specific compliance framework report  
**Input**: Framework name (case-insensitive)  
**Returns**: Matching compliance report or undefined

#### `getRecentActivities(): Activity[]`
**Purpose**: Get recent user activities  
**Returns**: Array of recent activity objects (currently mocked)

---

## AI Flow Functions

AI Flow functions are powered by Google's Genkit and Gemini AI. They are defined in `src/ai/flows/`.

### Policy Generation & Validation

#### `generateFirewallPolicy(input: GenerateFirewallPolicyInput): Promise<GenerateFirewallPolicyOutput>`
**Purpose**: Generate structured firewall policy from natural language  
**Input**: `{ description: string }`  
**Output**: `{ policy: string }` - Generated policy in YAML format

#### `validateFirewallPolicy(input: ValidateFirewallPolicyInput): Promise<ValidateFirewallPolicyOutput>`
**Purpose**: Validate firewall policy for best practices and conflicts  
**Input**: `{ policy: string }`  
**Output**: `{ isValid: boolean, issues: string[], recommendations: string[] }`

#### `simulatePolicy(input: SimulatePolicyInput): Promise<SimulatePolicyOutput>`
**Purpose**: Simulate traffic flow against policy set  
**Input**: `{ policySet: string, trafficFlow: string }`  
**Output**: `{ result: string, allowedTraffic: string[], blockedTraffic: string[] }`

### Security & Threat Intelligence

#### `detectAdminAnomalies(input: DetectAdminAnomaliesInput): Promise<DetectAdminAnomaliesOutput>`
**Purpose**: Detect anomalies in admin behavior using UBA  
**Input**: `{ adminActions: string, accessPatterns: string }`  
**Output**: `{ anomalies: string[], riskScore: number, recommendations: string[] }`

#### `emulateAdversary(input: EmulateAdversaryInput): Promise<EmulateAdversaryOutput>`
**Purpose**: Emulate adversary attacks using MITRE ATT&CK  
**Input**: `{ policySet: string, attackTechniqueId: string }`  
**Output**: `{ attackResult: string, policyEffectiveness: string, recommendations: string[] }`

#### `threatIntelligence(input: ThreatIntelligenceInput): Promise<ThreatIntelligenceOutput>`
**Purpose**: Analyze threat intelligence data  
**Input**: `{ threatData: string }`  
**Output**: `{ analysis: string, recommendations: string[] }`

#### `createIncident(input: CreateIncidentInput): Promise<CreateIncidentOutput>`
**Purpose**: Create incident from security event  
**Input**: `{ eventDescription: string }`  
**Output**: `{ incidentId: string, severity: string, recommendations: string[] }`

### AI Operations

#### `selfHealingMisconfigurations(input: SelfHealingMisconfigurationsInput): Promise<SelfHealingMisconfigurationsOutput>`
**Purpose**: Detect and fix firewall misconfigurations  
**Input**: `{ firewallConfiguration: string, guardrails: string, autoCorrect: boolean }`  
**Output**: `{ issues: string[], fixes: string[], appliedFixes: string[] }`

#### `manageRetrainEvaluateVersion(input: ManageRetrainEvaluateVersionInput): Promise<ManageRetrainEvaluateVersionOutput>`
**Purpose**: Manage AI model lifecycle  
**Input**: `{ modelName: string, retrain: boolean, evaluate: boolean, version: boolean }`  
**Output**: `{ status: string, metrics: object, newVersion?: string }`

#### `nlpChatbotAssistance(input: NlpChatbotAssistanceInput): Promise<NlpChatbotAssistanceOutput>`
**Purpose**: Provide NLP-powered chatbot assistance  
**Input**: `{ query: string }`  
**Output**: `{ response: string }`

#### `summarizeSecurityEvents(input: SummarizeSecurityEventsInput): Promise<SummarizeSecurityEventsOutput>`
**Purpose**: Summarize security events for reporting  
**Input**: `{ events: string }`  
**Output**: `{ summary: string, keyFindings: string[], recommendations: string[] }`

---

## Database Schema

The application uses PostgreSQL with Prisma ORM. Key models include:

### Core Models

- **Policy**: Firewall policies with source, destination, action, status
- **Snapshot**: Configuration snapshots with version history
- **Device**: Firewall devices with name and IP
- **AddressObject**: Network address objects (IP ranges, FQDNs, geography)
- **ServiceObject**: Service objects (protocols, ports)
- **ObjectGroup**: Groups of address or service objects
- **PolicyTemplate**: Reusable policy templates

### Enums

- **PolicyAction**: Allow, Deny
- **PolicyStatus**: Active, Inactive, PendingApproval
- **SnapshotStatus**: Live, Archived
- **AddressObjectType**: IPRange, FQDN, Geography
- **ServiceProtocol**: TCP, UDP, ICMP
- **ObjectGroupType**: Address, Service
- **PolicyTemplateCategory**: Security, Compliance, Operations

---

## Usage Examples

### Creating a Policy via API
```typescript
// Using server action
const formData = new FormData();
formData.append('name', 'Allow HTTPS to Web Servers');
formData.append('source', 'Internal-Network');
formData.append('destination', 'Web-Servers');
formData.append('action', 'Allow');
await createPolicyAction(null, formData);

// Using data layer directly
await addPolicy({
  name: 'Allow HTTPS to Web Servers',
  source: 'Internal-Network',
  destination: 'Web-Servers',
  action: 'Allow',
  status: 'Active'
});
```

### Generating Policy with AI
```typescript
const result = await generateFirewallPolicy({
  description: 'Allow HTTPS traffic from internal network to DMZ web servers'
});
console.log(result.policy); // Generated YAML policy
```

### Validating a Policy
```typescript
const validation = await validateFirewallPolicy({
  policy: 'allow tcp from 10.0.0.0/8 to 192.168.1.0/24 port 443'
});
console.log(validation.isValid, validation.issues);
```

---

## Error Handling

All APIs return structured error responses:

```typescript
// Server Actions return
{
  error?: string | { [field: string]: string[] },
  success?: boolean,
  data?: any
}

// Data Layer functions throw exceptions
// AI Flow functions throw exceptions
```

## Authentication & Authorization

Currently, the system operates without authentication. In production:
- Add authentication middleware
- Implement role-based access control (RBAC)
- Add audit logging for all operations
- Secure API endpoints with proper authorization checks

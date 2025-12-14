# Compliance Refresh Data & AI Analytics - Backend Flow

## Overview
When you click the **"Refresh Data & AI Analytics"** button on `/compliance`, the system performs a two-phase operation that collects **REAL data directly from your FortiGate firewall** in real-time.

## Phase 1: Data Ingestion (`/api/ingestion/run`)

### What Happens:
1. **Frontend Request**: Calls `POST /api/ingestion/run` with `{ type: 'full' }`

2. **Backend Processing** (`src/lib/ingestion/firewall-ingestion.ts`):
   - Gets all **active FortiGate devices** from the database
   - For each device, performs:

   **a) Traffic Log Ingestion** (`ingestTrafficLogs`):
   - Creates a FortiGate API client using device credentials
   - Tests connection to the firewall
   - **Fetches REAL firewall sessions** via:
     ```
     GET /api/v2/monitor/firewall/session
     ```
   - Processes each log entry:
     - Creates SHA256 hash for deduplication
     - Determines severity (Info/Low/Medium/High/Critical)
     - Stores in `FirewallEvent` table with full payload
   
   **b) Configuration Snapshot** (`ingestConfigSnapshot`):
   - **Fetches global system config** via:
     ```
     GET /api/v2/cmdb/system/global
     ```
   - **Fetches firewall policies** via:
     ```
     GET /api/v2/cmdb/firewall/policy
     ```
   - Stores snapshots in `FirewallSnapshot` table

### Real Data Collected:
✅ **Firewall Sessions** - Active network connections and traffic flows  
✅ **System Configuration** - Global settings, timezone, admin ports, SSL settings  
✅ **Firewall Policies** - All security policies, rules, UTM profiles

---

## Phase 2: Compliance Evaluation & AI Analysis (`/api/compliance/evaluate`)

### What Happens:
1. **Frontend Request**: Calls `POST /api/compliance/evaluate` with `{ type: 'all' }`

2. **Backend Processing** (`src/lib/compliance/evaluator.ts`):
   - Runs `runComplianceEvaluation()` which evaluates all frameworks (PCI DSS, HIPAA, GDPR, ISO 27001)
   - For each framework, calls `evaluateFramework()`:
     - Evaluates all compliance controls against ingested data
     - **Calls AI analysis** which fetches **LIVE data again**

3. **AI Analysis** (`src/ai/flows/compliance-ai-analyzer.ts`):
   - `getAIComplianceInsights()` → `fetchLiveFortiGateData()` makes **REAL-TIME API calls**:

   **Live Data Fetched for AI Analysis:**
   ```
   GET /api/v2/monitor/system/status          → System health & uptime
   GET /api/v2/cmdb/firewall/policy           → Current firewall rules
   GET /api/v2/monitor/firewall/session       → Active sessions
   GET /api/v2/monitor/system/resource/usage  → CPU, Memory, Disk
   GET /api/v2/monitor/system/interface       → Network interface stats
   GET /api/v2/monitor/license/status        → License information
   GET /api/v2/cmdb/system/global            → System configuration
   ```

   - This **live data** is then sent to the AI model (Gemini) for compliance analysis
   - AI generates insights, risk scores, violations, and recommendations

### Real Data Collected:
✅ **System Status** - Real-time health metrics  
✅ **Firewall Policies** - Current security rules (re-fetched for latest state)  
✅ **Active Sessions** - Live network connections  
✅ **Resource Usage** - CPU, memory, disk utilization  
✅ **Interface Statistics** - Network interface performance  
✅ **License Status** - Current license information  
✅ **Global Config** - System-wide settings

---

## Key Points

### ✅ YES - Real Logs Are Collected

1. **During Ingestion**: 
   - Real firewall sessions are fetched and stored in the database
   - Configuration snapshots are captured

2. **During AI Analysis**:
   - **Fresh, live data** is fetched directly from FortiGate API
   - This ensures AI analysis uses the **most current state** of the firewall
   - Data is NOT from database - it's fetched in real-time

### Terminal Output Evidence

From your terminal logs, you can see:
```
[FortiGate API] GET https://apiprod.viewdns.net/api/v2/monitor/firewall/session
[FortiGate API] GET https://apiprod.viewdns.net/api/v2/cmdb/firewall/policy
[FortiGate API] GET https://apiprod.viewdns.net/api/v2/monitor/system/status
[FortiGate API] GET https://apiprod.viewdns.net/api/v2/monitor/system/resource/usage
[FortiGate API] GET https://apiprod.viewdns.net/api/v2/monitor/system/interface
[FortiGate API] GET https://apiprod.viewdns.net/api/v2/monitor/license/status
[FortiGate API] GET https://apiprod.viewdns.net/api/v2/cmdb/system/global
```

These are **real API calls** to your FortiGate device (`apiprod-01` at `apiprod.viewdns.net`).

---

## Data Flow Diagram

```
User clicks "Refresh Data & AI Analytics"
         │
         ▼
┌─────────────────────────────────────┐
│  Phase 1: Ingestion                  │
│  POST /api/ingestion/run             │
│                                      │
│  ┌──────────────────────────────┐  │
│  │ For each FortiGate device:    │  │
│  │  • Fetch firewall sessions    │  │
│  │  • Fetch config snapshots     │  │
│  │  • Store in database          │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  Phase 2: Compliance Evaluation      │
│  POST /api/compliance/evaluate       │
│                                      │
│  ┌──────────────────────────────┐  │
│  │ For each framework:          │  │
│  │  1. Evaluate controls        │  │
│  │  2. AI Analysis:              │  │
│  │     • Fetch LIVE data         │  │
│  │     • Send to AI model        │  │
│  │     • Generate insights       │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
```

---

## Current Issue

The terminal shows **Google Generative AI API key errors**:
```
[GoogleGenerativeAI Error]: API key not valid. Please pass a valid API key.
```

This means:
- ✅ Data collection is working (all FortiGate API calls succeed)
- ❌ AI analysis fails due to invalid/missing Google AI API key
- The system gracefully handles this - compliance evaluation still runs, just without AI insights

---

## Files Involved

- **Frontend**: `src/app/(dashboard)/compliance/page.tsx` (lines 148-241)
- **Ingestion API**: `src/app/api/ingestion/run/route.ts`
- **Ingestion Logic**: `src/lib/ingestion/firewall-ingestion.ts`
- **Evaluation API**: `src/app/api/compliance/evaluate/route.ts`
- **Evaluator**: `src/lib/compliance/evaluator.ts`
- **AI Analyzer**: `src/ai/flows/compliance-ai-analyzer.ts` (lines 49-221)


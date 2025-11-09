# FortiGate API Prioritization & Categorization

## Overview
This document categorizes FortiGate APIs by priority and use case for integration into the AI Firewall platform. APIs are grouped by functional area and prioritized based on relevance to AI-driven firewall management.

---

## 🔴 HIGH PRIORITY - Core Firewall Operations

### Firewall Policy Management
**Status**: ✅ Already Implemented (Core functionality)
- `/api/v2/cmdb/firewall/policy` - IPv4 firewall policies
- `/api/v2/cmdb/firewall/policy6` - IPv6 firewall policies
- `/api/v2/monitor/firewall/policy/select` - List effective policies (ordered)
- `/api/v2/monitor/firewall/policy/anomaly` - Policy anomaly detection

**Use Case**: Core functionality - AI creates, deploys, and manages policies
**Integration Notes**: Already integrated via `fortigate-policy-converter.ts` and `deployment.ts`

### Firewall Objects (Addresses, Services, Groups)
**Status**: ✅ API Client Available (Needs UI/Workflow Integration)
- `/api/v2/cmdb/firewall/address` - Address objects (IPv4)
- `/api/v2/cmdb/firewall/address6` - Address objects (IPv6)
- `/api/v2/cmdb/firewall/addrgrp` - Address groups
- `/api/v2/cmdb/firewall/service/custom` - Custom services (ports/protocols)
- `/api/v2/cmdb/firewall/service/group` - Service groups

**Use Case**: AI should automatically create address objects when deploying policies
**Integration Priority**: HIGH - Enables smarter policy creation
**Recommended Features**:
- Auto-create address objects from AI chat requests
- Suggest address groups for similar policies
- Service discovery and grouping

### System Zones
**Status**: ✅ API Client Available (Needs UI/Workflow Integration)
- `/api/v2/cmdb/system/zone` - Interface zones

**Use Case**: AI needs to understand network topology (zones) for policy creation
**Integration Priority**: HIGH - Required for proper policy deployment
**Recommended Features**:
- Zone discovery and mapping
- Zone-based policy suggestions
- Visual zone topology

### Monitoring & Status
**Status**: ✅ API Client Available (Needs Dashboard Integration)
- `/api/v2/monitor/system/status` - Runtime system status
- `/api/v2/monitor/system/resource/usage` - CPU/memory/disk usage
- `/api/v2/monitor/system/interface` - Interface runtime stats
- `/api/v2/monitor/firewall/session` - Active sessions
- `/api/v2/monitor/license/status` - License/subscription status

**Use Case**: Real-time monitoring for AI decision-making and user dashboards
**Integration Priority**: HIGH - Essential for operational visibility
**Recommended Features**:
- Real-time dashboard with device health
- Session monitoring and analytics
- Resource usage alerts

---

## 🟡 MEDIUM PRIORITY - Enhanced Security & Management

### Security Profiles (UTM)
**Status**: ✅ API Client Available (Needs Workflow Integration)
- `/api/v2/cmdb/webfilter/profile` - Web filter profiles
- `/api/v2/cmdb/antivirus/profile` - Antivirus profiles
- `/api/v2/cmdb/application/profile` - Application control profiles
- `/api/v2/cmdb/ips/sensor` - IPS sensors
- `/api/v2/cmdb/dlp/profile` - DLP profiles
- `/api/v2/cmdb/firewall/profile-group` - Profile groups

**Use Case**: AI can suggest and apply security profiles to policies
**Integration Priority**: MEDIUM - Enhances policy security
**Recommended Features**:
- AI suggests security profiles based on policy context
- Profile templates for common use cases
- Security profile management UI

### Schedules & Time-Based Policies
**Status**: ✅ API Client Available (Needs Workflow Integration)
- `/api/v2/cmdb/firewall/schedule/recurring` - Recurring schedules
- `/api/v2/cmdb/firewall/schedule/onetime` - One-time schedules

**Use Case**: AI can create time-based policies ("Allow access during business hours")
**Integration Priority**: MEDIUM - Enables advanced policy features
**Recommended Features**:
- Natural language schedule parsing ("business hours", "weekends")
- Schedule templates
- Schedule visualization

### NAT & VIP Management
**Status**: ✅ API Client Available (Needs Workflow Integration)
- `/api/v2/cmdb/firewall/vip` - Virtual IP (destination NAT)
- `/api/v2/cmdb/firewall/vipgrp` - VIP groups
- `/api/v2/cmdb/firewall/ippool` - IP pools (source NAT)

**Use Case**: AI can handle NAT requirements in policy creation
**Integration Priority**: MEDIUM - Common enterprise requirement
**Recommended Features**:
- NAT rule suggestions
- Port forwarding via AI chat
- NAT visualization

### System Interfaces
**Status**: ✅ API Client Available (Needs Workflow Integration)
- `/api/v2/cmdb/system/interface` - Manage interfaces

**Use Case**: AI needs interface information for zone mapping and policy creation
**Integration Priority**: MEDIUM - Supports network topology understanding
**Recommended Features**:
- Interface discovery and mapping
- Interface status monitoring
- Interface configuration via AI

### Routing & Network Topology
**Status**: ✅ API Client Available (Needs Workflow Integration)
- `/api/v2/cmdb/router/static` - Static routes
- `/api/v2/monitor/router/ipv4` - IPv4 routing table
- `/api/v2/monitor/router/lookup` - Route lookup for IP

**Use Case**: AI can understand network paths and suggest optimal policies
**Integration Priority**: MEDIUM - Enhances AI decision-making
**Recommended Features**:
- Route visualization
- Path analysis for policy creation
- Routing recommendations

---

## 🟢 LOW PRIORITY - Advanced Features & Utilities

### VPN Management
**Status**: ✅ API Client Available
- `/api/v2/cmdb/vpn/ipsec/phase1-interface` - IPsec phase1
- `/api/v2/cmdb/vpn/ipsec/phase2-interface` - IPsec phase2
- `/api/v2/cmdb/vpn/ssl/settings` - SSL VPN settings
- `/api/v2/cmdb/vpn/ssl/web/portal` - SSL VPN portals
- `/api/v2/monitor/vpn/ipsec/sa` - IPsec SAs (runtime)
- `/api/v2/monitor/vpn/ssl/stats` - SSL VPN statistics

**Use Case**: VPN configuration and monitoring (specialized use case)
**Integration Priority**: LOW - Not core to firewall policy management
**When to Integrate**: When users specifically request VPN management features

### SD-WAN
**Status**: ✅ API Client Available
- `/api/v2/cmdb/system/sdwan` - SD-WAN global settings
- `/api/v2/cmdb/system/sdwan/zone` - SD-WAN zones
- `/api/v2/cmdb/system/sdwan/health-check` - Health checks (SLA)
- `/api/v2/cmdb/system/sdwan/service` - SD-WAN rules
- `/api/v2/monitor/system/sdwan` - SD-WAN runtime status

**Use Case**: SD-WAN path selection and monitoring
**Integration Priority**: LOW - Specialized feature
**When to Integrate**: For organizations with SD-WAN deployments

### Wireless & Switch Management
**Status**: ✅ API Client Available
- `/api/v2/cmdb/wireless-controller/wtp` - Managed FortiAPs
- `/api/v2/cmdb/wireless-controller/vap` - Virtual AP (SSID) profiles
- `/api/v2/cmdb/switch-controller/managed-switch` - Managed FortiSwitches
- `/api/v2/monitor/wireless-controller/wtp` - AP runtime status
- `/api/v2/monitor/switch-controller/managed-switch` - Switch runtime status

**Use Case**: Wireless and switch management (separate from firewall)
**Integration Priority**: LOW - Different domain
**When to Integrate**: If expanding platform to network management

### User Management
**Status**: ✅ API Client Available
- `/api/v2/cmdb/user/local` - Local user accounts
- `/api/v2/cmdb/user/group` - User groups
- `/api/v2/cmdb/user/ldap` - LDAP servers
- `/api/v2/cmdb/user/radius` - RADIUS servers
- `/api/v2/cmdb/user/tacacs+` - TACACS+ servers
- `/api/v2/monitor/user/active` - Active authenticated users
- `/api/v2/monitor/user/banned` - Banned users list

**Use Case**: User-based policies and authentication
**Integration Priority**: LOW - Can be useful for user-based rules
**When to Integrate**: When implementing user-based policy features

### Advanced Routing (BGP/OSPF)
**Status**: ✅ API Client Available
- `/api/v2/cmdb/router/bgp` - BGP global settings
- `/api/v2/cmdb/router/bgp/neighbor` - BGP neighbors
- `/api/v2/cmdb/router/ospf` - OSPF global
- `/api/v2/cmdb/router/ospf/network` - OSPF networks
- `/api/v2/monitor/router/bgp` - BGP summary/peers
- `/api/v2/monitor/router/ospf` - OSPF summary

**Use Case**: Dynamic routing configuration
**Integration Priority**: LOW - Specialized networking feature
**When to Integrate**: For enterprise networks with dynamic routing

### System Configuration
**Status**: ✅ API Client Available
- `/api/v2/cmdb/system/global` - Global FortiGate settings
- `/api/v2/cmdb/system/vdom` - VDOMs
- `/api/v2/cmdb/system/ntp` - NTP servers
- `/api/v2/cmdb/system/dns` - DNS servers
- `/api/v2/cmdb/system/admin` - Local admin accounts
- `/api/v2/cmdb/system/ha` - HA settings

**Use Case**: System-level configuration
**Integration Priority**: LOW - Administrative tasks
**When to Integrate**: For comprehensive device management features

### Logging & Compliance
**Status**: ✅ API Client Available
- `/api/v2/cmdb/log/memory/setting` - Memory logging settings
- `/api/v2/cmdb/log/disk/setting` - Disk logging settings
- `/api/v2/cmdb/log/syslogd/setting` - Syslog forwarding
- `/api/v2/cmdb/log/syslogd/filter` - Syslog filter

**Use Case**: Log management and compliance
**Integration Priority**: LOW - Important but separate concern
**When to Integrate**: When adding log analysis features

### Utilities
**Status**: ✅ API Client Available
- `/api/v2/monitor/system/config/backup` - Download configuration backup
- `/api/v2/monitor/system/config/restore` - Restore configuration
- `/api/v2/monitor/system/firmware` - Firmware info
- `/api/v2/monitor/system/firmware/upgrade` - Firmware upgrade
- `/api/v2/monitor/system/reboot` - Reboot device
- `/api/v2/monitor/firewall/clear-counters` - Clear traffic counters

**Use Case**: Device maintenance and management
**Integration Priority**: LOW - Administrative utilities
**When to Integrate**: For device lifecycle management features

### Advanced Security Features
**Status**: ✅ API Client Available
- `/api/v2/cmdb/firewall/local-in-policy` - Local-in policies
- `/api/v2/cmdb/firewall/proxy-policy` - Proxy policies
- `/api/v2/cmdb/firewall/dospolicy` - DoS policies
- `/api/v2/cmdb/firewall/shaper/traffic-shaper` - Traffic shapers
- `/api/v2/cmdb/firewall/ssl-ssh-profile` - SSL/SSH inspection profiles
- `/api/v2/cmdb/emailfilter/profile` - Email filter profiles
- `/api/v2/cmdb/voip/profile` - VoIP profiles
- `/api/v2/cmdb/waf/profile` - WAF profiles

**Use Case**: Advanced security features
**Integration Priority**: LOW - Specialized security features
**When to Integrate**: As users request specific security features

### Proxy Configuration
**Status**: ✅ API Client Available
- `/api/v2/cmdb/web-proxy/profile` - Web proxy profiles
- `/api/v2/cmdb/web-proxy/explicit` - Explicit proxy settings
- `/api/v2/cmdb/web-proxy/forward-server` - Upstream proxy servers

**Use Case**: Proxy configuration and management
**Integration Priority**: LOW - Specialized feature
**When to Integrate**: For organizations using explicit proxy

### Automation & Scripting
**Status**: ✅ API Client Available
- `/api/v2/cmdb/system/automation-action` - Automation actions
- `/api/v2/cmdb/system/automation-trigger` - Automation triggers
- `/api/v2/cmdb/system/automation-stitch` - Automation stitches

**Use Case**: Automated responses and workflows
**Integration Priority**: LOW - Advanced automation
**When to Integrate**: For advanced automation features

### SNMP & Monitoring
**Status**: ✅ API Client Available
- `/api/v2/cmdb/system/snmp/community` - SNMP communities
- `/api/v2/cmdb/system/snmp/user` - SNMP users

**Use Case**: External monitoring integration
**Integration Priority**: LOW - External tool integration
**When to Integrate**: For integration with monitoring systems

### Certificates
**Status**: ✅ API Client Available
- `/api/v2/cmdb/system/certificate/local` - Local certificates
- `/api/v2/cmdb/system/certificate/remote` - Remote CA certs

**Use Case**: Certificate management for SSL inspection
**Integration Priority**: LOW - Infrastructure management
**When to Integrate**: When implementing SSL inspection features

### SDN Connectors
**Status**: ✅ API Client Available
- `/api/v2/cmdb/system/sdn-connector` - SDN connectors (AWS/Azure/GCP)

**Use Case**: Cloud integration and dynamic addressing
**Integration Priority**: LOW - Cloud-specific feature
**When to Integrate**: For cloud-native deployments

---

## 📊 Implementation Roadmap

### Phase 1: Core Enhancements (HIGH PRIORITY)
**Timeline**: Immediate
1. **Address Object Management**
   - Auto-create address objects from AI chat
   - Address object library/management UI
   - Address group suggestions

2. **Zone Discovery & Mapping**
   - Automatic zone discovery
   - Zone-based policy suggestions
   - Visual zone topology

3. **Real-Time Monitoring Dashboard**
   - Device health dashboard
   - Active session monitoring
   - Resource usage visualization
   - License status tracking

### Phase 2: Security Enhancements (MEDIUM PRIORITY)
**Timeline**: Next 2-3 months
1. **Security Profile Integration**
   - AI-suggested security profiles
   - Profile templates
   - Profile management UI

2. **Time-Based Policies**
   - Natural language schedule parsing
   - Schedule templates
   - Schedule visualization

3. **NAT Management**
   - NAT rule suggestions
   - Port forwarding via AI
   - NAT visualization

### Phase 3: Advanced Features (LOW PRIORITY)
**Timeline**: As needed / User requests
1. VPN management
2. SD-WAN support
3. User-based policies
4. Advanced routing
5. Log analysis
6. Device lifecycle management

---

## 🎯 Key Integration Patterns

### Pattern 1: AI-Driven Object Creation
When AI creates a policy, automatically:
1. Check if address objects exist
2. Create missing address objects
3. Suggest address groups
4. Create service objects if needed

### Pattern 2: Context-Aware Suggestions
Use monitoring APIs to provide context:
1. Check current resource usage
2. Analyze active sessions
3. Review existing policies
4. Suggest optimal configurations

### Pattern 3: Proactive Monitoring
Continuously monitor:
1. Device health
2. Policy effectiveness
3. Security events
4. Resource constraints

### Pattern 4: Natural Language to Configuration
Map natural language to FortiGate configs:
- "Business hours" → Recurring schedule
- "High security" → Security profile group
- "Port forwarding" → VIP configuration
- "Load balancing" → SD-WAN service

---

## 📝 Notes

- **API Client Status**: Most APIs are already implemented in the client layer (`src/lib/fortigate/`)
- **Integration Gap**: The gap is in UI/workflow integration, not API availability
- **AI Enhancement**: Focus on making AI smarter about using these APIs
- **User Experience**: Prioritize features that enhance AI chat capabilities
- **Operational Value**: Monitoring and status APIs provide immediate operational value

---

## 🔄 Current State vs. Target State

### Current State
- ✅ Firewall policy CRUD operations
- ✅ Policy deployment
- ✅ Policy sync from FortiGate
- ✅ Basic monitoring (API client available)

### Target State (Phase 1)
- ✅ Firewall policy CRUD operations
- ✅ Policy deployment
- ✅ Policy sync from FortiGate
- ✅ **Address object auto-creation**
- ✅ **Zone discovery and mapping**
- ✅ **Real-time monitoring dashboard**
- ✅ **Context-aware AI suggestions**

### Target State (Phase 2)
- ✅ All Phase 1 features
- ✅ **Security profile integration**
- ✅ **Time-based policies**
- ✅ **NAT management**
- ✅ **Interface management**

---

## 🚀 Quick Wins

These can be implemented quickly with high impact:

1. **Monitoring Dashboard** (2-3 days)
   - Use existing monitor APIs
   - Create dashboard UI
   - Real-time updates

2. **Address Object Auto-Creation** (1-2 days)
   - Extend policy deployment
   - Check/create address objects
   - Minimal UI changes

3. **Zone Discovery** (1-2 days)
   - Fetch zones on device connection
   - Display in UI
   - Use in AI suggestions

4. **Policy Anomaly Detection** (1 day)
   - Use existing API
   - Display warnings in UI
   - AI can suggest fixes


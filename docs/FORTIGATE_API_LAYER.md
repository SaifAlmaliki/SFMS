# FortiGate API Layer - Complete Implementation

## Overview

A comprehensive, modular FortiGate 7.2 API layer has been implemented covering all 100+ APIs organized by functional modules. The implementation provides both real API integration and realistic mock data for development.

## Architecture

### Modular Structure

The API layer is organized into separate modules:

```
src/lib/fortigate/
├── base-client.ts          # Base client with common functionality
├── system.ts               # System configuration APIs
├── monitor.ts              # Monitoring and status APIs
├── firewall.ts             # Firewall policies and objects
├── security.ts             # Security profiles (WebFilter, AV, IPS, etc.)
├── proxy.ts                # Web proxy configuration
├── user.ts                 # User management and authentication
├── vpn.ts                  # VPN configuration (IPsec, SSL VPN)
├── router.ts               # Routing (static, BGP, OSPF)
├── sdwan.ts                # SD-WAN configuration
├── wireless.ts             # Wireless controller (FortiAP)
├── switch.ts              # Switch controller (FortiSwitch)
├── log.ts                  # Logging configuration
├── utility.ts              # Utilities (backup, firmware, reboot)
├── traffic.ts              # Traffic management
├── policy.ts               # Policy analysis
├── routing.ts              # Route lookup
├── mock-client.ts          # Mock implementation with realistic data
├── client-factory.ts       # Helper functions to create clients
└── index.ts                # Main export file
```

## Usage

### Basic Usage

```typescript
import { FortiGateClient, FortiGateDevice } from '@/lib/fortigate';
import { MockFortiGateClient } from '@/lib/fortigate/mock-client';

// Create device configuration
const device: FortiGateDevice = {
  name: 'FortiGate-VM64',
  ip: 'apiprod.viewdns.net',
  apiKey: 'nQdNQqy79m8Qwn4dc1h8fQsfNkbhtH',
  version: '7.2.5',
};

// Create client (real API)
const client = new FortiGateClient(device);

// Or use mock client for development
const mockClient = new MockFortiGateClient(device);

// Test connection
const connection = await client.testConnection();
console.log(connection);

// Access modules
const systemStatus = await client.monitor.getSystemStatus();
const policies = await client.firewall.getPolicies();
const interfaces = await client.system.getInterfaces();
```

### Using Client Factory

```typescript
import { createFortiGateClient } from '@/lib/fortigate/client-factory';

// Automatically uses mock in development, real API in production
const client = createFortiGateClient(device);

// Or force mock/real
const mockClient = createFortiGateClient(device, true);
const realClient = createFortiGateClient(device, false);
```

### Module Examples

#### System Module

```typescript
// Get global settings
const global = await client.system.getGlobal();

// Update global settings
await client.system.updateGlobal({
  hostname: 'NewHostname',
  timezone: 'America/New_York',
});

// Manage interfaces
const interfaces = await client.system.getInterfaces();
await client.system.createInterface({
  name: 'port4',
  ip: '192.168.2.1 255.255.255.0',
  type: 'physical',
});

// Manage VDOMs
const vdoms = await client.system.getVdoms();
await client.system.createVdom({ name: 'VDOM1' }, { scope: 'global' });
```

#### Firewall Module

```typescript
// Get policies
const policies = await client.firewall.getPolicies();

// Create policy
const newPolicy = await client.firewall.createPolicy({
  name: 'Allow HTTPS',
  srcintf: [{ name: 'port2' }],
  dstintf: [{ name: 'port3' }],
  srcaddr: [{ name: 'all' }],
  dstaddr: [{ name: 'all' }],
  action: 'accept',
  schedule: 'always',
  service: [{ name: 'HTTPS' }],
  logtraffic: 'all',
});

// Update policy
await client.firewall.updatePolicy('1', {
  logtraffic: 'utm',
});

// Delete policy
await client.firewall.deletePolicy('1');

// Manage address objects
const addresses = await client.firewall.getAddresses();
await client.firewall.createAddress({
  name: 'Web-Server',
  subnet: '192.168.10.0/24',
  type: 'ipmask',
});
```

#### Monitor Module

```typescript
// System status
const status = await client.monitor.getSystemStatus();

// Resource usage
const resources = await client.monitor.getResourceUsage();

// Interface statistics
const ifStats = await client.monitor.getInterfaceStats();

// License status
const license = await client.monitor.getLicenseStatus();

// Firewall sessions
const sessions = await client.monitor.getFirewallSessions();

// Active users
const users = await client.monitor.getActiveUsers();

// Routing table
const routes = await client.monitor.getIpv4RoutingTable();
```

#### Security Module

```typescript
// WebFilter profiles
const webfilterProfiles = await client.security.getWebFilterProfiles();
await client.security.createWebFilterProfile({
  name: 'Strict-WebFilter',
  // ... profile configuration
});

// Antivirus profiles
const avProfiles = await client.security.getAntivirusProfiles();

// IPS sensors
const ipsSensors = await client.security.getIpsSensors();

// Application control
const appProfiles = await client.security.getApplicationProfiles();
```

#### VPN Module

```typescript
// IPsec phase1 (interface mode)
const phase1Interfaces = await client.vpn.getIpsecPhase1Interfaces();
await client.vpn.createIpsecPhase1Interface({
  name: 'VPN-Tunnel-1',
  type: 'dynamic',
  interface: 'port1',
  // ... configuration
});

// SSL VPN
const sslSettings = await client.vpn.getSslVpnSettings();
const portals = await client.vpn.getSslVpnPortals();
```

#### Router Module

```typescript
// Static routes
const staticRoutes = await client.router.getStaticRoutes();
await client.router.createStaticRoute({
  dst: '0.0.0.0/0',
  gateway: '192.168.1.1',
  device: 'port1',
  distance: 10,
});

// BGP
const bgpGlobal = await client.router.getBgpGlobal();
const bgpNeighbors = await client.router.getBgpNeighbors();
```

#### Utility Module

```typescript
// Download configuration backup
const backup = await client.utility.downloadConfigBackup({ scope: 'global' });

// Restore configuration
const configFile = new File([configContent], 'backup.conf');
await client.utility.restoreConfig(configFile);

// Firmware info
const firmware = await client.utility.getFirmwareInfo();

// Reboot device (use with caution!)
// await client.utility.rebootDevice();
```

### VDOM Support

All APIs support VDOM scoping:

```typescript
// Specify VDOM in options
const policies = await client.firewall.getPolicies({ vdom: 'VDOM1' });

// Global scope for VDOM operations
const vdoms = await client.system.getVdoms({ scope: 'global' });
```

### Error Handling

All API methods return a `FortiGateApiResponse`:

```typescript
const response = await client.firewall.getPolicies();

if (response.success) {
  console.log('Policies:', response.data);
} else {
  console.error('Error:', response.error);
  console.error('HTTP Status:', response.httpStatus);
}
```

## Real Device Configuration

To use with the real FortiGate device:

```typescript
const device: FortiGateDevice = {
  name: 'apiprod',
  ip: 'apiprod.viewdns.net',
  apiKey: 'nQdNQqy79m8Qwn4dc1h8fQsfNkbhtH',
  version: '7.2.5',
};

const client = new FortiGateClient(device);

// Test connection
const test = await client.testConnection();
if (test.success) {
  console.log('Connected to:', test.data.hostname);
}
```

## Mock Client

The mock client provides realistic responses for development:

```typescript
import { MockFortiGateClient } from '@/lib/fortigate/mock-client';

const mockClient = new MockFortiGateClient(device);

// Mock client simulates:
// - Network delays
// - Realistic data structures
// - Error scenarios (5% failure rate for creates)
// - Stateful operations (create/update/delete persist in memory)
```

## Backward Compatibility

The old `FortiGateApiClient` class is still available for backward compatibility:

```typescript
import { FortiGateApiClient, MockFortiGateApiClient } from '@/lib/fortigate-api';

// Old API still works
const oldClient = new FortiGateApiClient(device);
const policies = await oldClient.getPolicies();
```

## API Coverage

### ✅ Implemented Modules

- **System**: Global, Interfaces, VDOMs, NTP, DNS, Admin, SNMP, Zones, Link Monitors, Automation, Certificates, HA, SDN Connectors
- **Monitor**: System Status, HA Status, Resources, Interfaces, License, Routing Tables, BGP, OSPF, Firewall Sessions, VPN Status, Users, SD-WAN, Wireless, Switch
- **Firewall**: Policies (IPv4/IPv6), Addresses, Services, VIPs, IP Pools, Schedules, Shapers, Profiles, Local-in Policies, Proxy Policies
- **Security**: WebFilter, Antivirus, Application Control, IPS, DLP, Email Filter, VoIP, WAF
- **Proxy**: Web Proxy Profiles, Explicit Proxy, Forward Servers
- **User**: Local Users, Groups, LDAP, RADIUS, TACACS+, Devices
- **VPN**: IPsec (interface/policy-based), SSL VPN
- **Router**: Static Routes, Policy Routes, BGP, OSPF, Prefix Lists, Route Maps
- **SD-WAN**: Settings, Zones, Health Checks, Services
- **Wireless**: FortiAPs, Profiles, Virtual APs
- **Switch**: Managed Switches, Ports, VLANs
- **Log**: Memory, Disk, Syslog settings
- **Utility**: Alerts, Backup/Restore, Firmware, Reboot
- **Traffic**: Counter clearing
- **Policy**: Anomaly detection
- **Routing**: Route lookup

## Best Practices

1. **Always test connections** before performing operations
2. **Handle errors gracefully** - check `response.success` before using `response.data`
3. **Use VDOM options** when working with multi-VDOM environments
4. **Use mock client** in development to avoid impacting production devices
5. **Store API keys securely** - never commit them to version control
6. **Use client factory** for automatic mock/real switching based on environment

## Next Steps

- Add retry logic for transient failures
- Implement request rate limiting
- Add request/response logging
- Create TypeScript interfaces for all response types
- Add comprehensive unit tests
- Implement connection pooling for multiple devices


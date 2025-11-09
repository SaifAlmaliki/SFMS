# FortiGate API Categorization - Quick Reference

## Summary Table

| Module | Endpoint | Priority | Status | Use Case |
|--------|----------|----------|--------|----------|
| **FIREWALL - CORE** |
| Firewall | `/api/v2/cmdb/firewall/policy` | 🔴 HIGH | ✅ Integrated | Core policy management |
| Firewall | `/api/v2/cmdb/firewall/policy6` | 🔴 HIGH | ✅ Integrated | IPv6 policies |
| Firewall | `/api/v2/cmdb/firewall/address` | 🔴 HIGH | ✅ Client Ready | Address objects (auto-create) |
| Firewall | `/api/v2/cmdb/firewall/address6` | 🔴 HIGH | ✅ Client Ready | IPv6 address objects |
| Firewall | `/api/v2/cmdb/firewall/addrgrp` | 🔴 HIGH | ✅ Client Ready | Address groups |
| Firewall | `/api/v2/cmdb/firewall/service/custom` | 🔴 HIGH | ✅ Client Ready | Custom services |
| Firewall | `/api/v2/cmdb/firewall/service/group` | 🔴 HIGH | ✅ Client Ready | Service groups |
| System | `/api/v2/cmdb/system/zone` | 🔴 HIGH | ✅ Client Ready | Zone discovery & mapping |
| Monitor | `/api/v2/monitor/firewall/policy/select` | 🔴 HIGH | ✅ Client Ready | Effective policy list |
| Monitor | `/api/v2/monitor/firewall/policy/anomaly` | 🔴 HIGH | ✅ Client Ready | Policy anomaly detection |
| **MONITORING - CORE** |
| Monitor | `/api/v2/monitor/system/status` | 🔴 HIGH | ✅ Client Ready | Device status dashboard |
| Monitor | `/api/v2/monitor/system/resource/usage` | 🔴 HIGH | ✅ Client Ready | Resource monitoring |
| Monitor | `/api/v2/monitor/system/interface` | 🔴 HIGH | ✅ Client Ready | Interface stats |
| Monitor | `/api/v2/monitor/firewall/session` | 🔴 HIGH | ✅ Client Ready | Active sessions |
| Monitor | `/api/v2/monitor/license/status` | 🔴 HIGH | ✅ Client Ready | License status |
| **SECURITY PROFILES** |
| Security | `/api/v2/cmdb/webfilter/profile` | 🟡 MEDIUM | ✅ Client Ready | Web filtering |
| Security | `/api/v2/cmdb/antivirus/profile` | 🟡 MEDIUM | ✅ Client Ready | Antivirus |
| Security | `/api/v2/cmdb/application/profile` | 🟡 MEDIUM | ✅ Client Ready | Application control |
| Security | `/api/v2/cmdb/ips/sensor` | 🟡 MEDIUM | ✅ Client Ready | Intrusion prevention |
| Security | `/api/v2/cmdb/dlp/profile` | 🟡 MEDIUM | ✅ Client Ready | Data loss prevention |
| Security | `/api/v2/cmdb/firewall/profile-group` | 🟡 MEDIUM | ✅ Client Ready | Profile groups |
| **SCHEDULES & TIME-BASED** |
| Firewall | `/api/v2/cmdb/firewall/schedule/recurring` | 🟡 MEDIUM | ✅ Client Ready | Recurring schedules |
| Firewall | `/api/v2/cmdb/firewall/schedule/onetime` | 🟡 MEDIUM | ✅ Client Ready | One-time schedules |
| **NAT & VIP** |
| Firewall | `/api/v2/cmdb/firewall/vip` | 🟡 MEDIUM | ✅ Client Ready | Destination NAT |
| Firewall | `/api/v2/cmdb/firewall/vipgrp` | 🟡 MEDIUM | ✅ Client Ready | VIP groups |
| Firewall | `/api/v2/cmdb/firewall/ippool` | 🟡 MEDIUM | ✅ Client Ready | Source NAT pools |
| **NETWORK TOPOLOGY** |
| System | `/api/v2/cmdb/system/interface` | 🟡 MEDIUM | ✅ Client Ready | Interface management |
| Router | `/api/v2/cmdb/router/static` | 🟡 MEDIUM | ✅ Client Ready | Static routes |
| Monitor | `/api/v2/monitor/router/ipv4` | 🟡 MEDIUM | ✅ Client Ready | Routing table |
| Monitor | `/api/v2/monitor/router/lookup` | 🟡 MEDIUM | ✅ Client Ready | Route lookup |
| **VPN** |
| VPN | `/api/v2/cmdb/vpn/ipsec/phase1-interface` | 🟢 LOW | ✅ Client Ready | IPsec tunnels |
| VPN | `/api/v2/cmdb/vpn/ipsec/phase2-interface` | 🟢 LOW | ✅ Client Ready | IPsec phase2 |
| VPN | `/api/v2/cmdb/vpn/ssl/settings` | 🟢 LOW | ✅ Client Ready | SSL VPN |
| VPN | `/api/v2/cmdb/vpn/ssl/web/portal` | 🟢 LOW | ✅ Client Ready | SSL VPN portals |
| VPN | `/api/v2/monitor/vpn/ipsec/sa` | 🟢 LOW | ✅ Client Ready | IPsec status |
| VPN | `/api/v2/monitor/vpn/ssl/stats` | 🟢 LOW | ✅ Client Ready | SSL VPN stats |
| **SD-WAN** |
| SD-WAN | `/api/v2/cmdb/system/sdwan` | 🟢 LOW | ✅ Client Ready | SD-WAN settings |
| SD-WAN | `/api/v2/cmdb/system/sdwan/zone` | 🟢 LOW | ✅ Client Ready | SD-WAN zones |
| SD-WAN | `/api/v2/cmdb/system/sdwan/health-check` | 🟢 LOW | ✅ Client Ready | Health checks |
| SD-WAN | `/api/v2/cmdb/system/sdwan/service` | 🟢 LOW | ✅ Client Ready | SD-WAN rules |
| SD-WAN | `/api/v2/monitor/system/sdwan` | 🟢 LOW | ✅ Client Ready | SD-WAN status |
| **USER MANAGEMENT** |
| User | `/api/v2/cmdb/user/local` | 🟢 LOW | ✅ Client Ready | Local users |
| User | `/api/v2/cmdb/user/group` | 🟢 LOW | ✅ Client Ready | User groups |
| User | `/api/v2/cmdb/user/ldap` | 🟢 LOW | ✅ Client Ready | LDAP servers |
| User | `/api/v2/cmdb/user/radius` | 🟢 LOW | ✅ Client Ready | RADIUS servers |
| User | `/api/v2/cmdb/user/tacacs+` | 🟢 LOW | ✅ Client Ready | TACACS+ servers |
| User | `/api/v2/monitor/user/active` | 🟢 LOW | ✅ Client Ready | Active users |
| User | `/api/v2/monitor/user/banned` | 🟢 LOW | ✅ Client Ready | Banned users |
| **ROUTING (ADVANCED)** |
| Router | `/api/v2/cmdb/router/bgp` | 🟢 LOW | ✅ Client Ready | BGP configuration |
| Router | `/api/v2/cmdb/router/bgp/neighbor` | 🟢 LOW | ✅ Client Ready | BGP neighbors |
| Router | `/api/v2/cmdb/router/ospf` | 🟢 LOW | ✅ Client Ready | OSPF configuration |
| Router | `/api/v2/cmdb/router/ospf/network` | 🟢 LOW | ✅ Client Ready | OSPF networks |
| Router | `/api/v2/cmdb/router/policy` | 🟢 LOW | ✅ Client Ready | Policy-based routing |
| Router | `/api/v2/cmdb/router/prefix-list` | 🟢 LOW | ✅ Client Ready | Prefix lists |
| Router | `/api/v2/cmdb/router/route-map` | 🟢 LOW | ✅ Client Ready | Route maps |
| Monitor | `/api/v2/monitor/router/bgp` | 🟢 LOW | ✅ Client Ready | BGP status |
| Monitor | `/api/v2/monitor/router/ospf` | 🟢 LOW | ✅ Client Ready | OSPF status |
| **SYSTEM CONFIGURATION** |
| System | `/api/v2/cmdb/system/global` | 🟢 LOW | ✅ Client Ready | Global settings |
| System | `/api/v2/cmdb/system/vdom` | 🟢 LOW | ✅ Client Ready | VDOM management |
| System | `/api/v2/cmdb/system/ntp` | 🟢 LOW | ✅ Client Ready | NTP servers |
| System | `/api/v2/cmdb/system/dns` | 🟢 LOW | ✅ Client Ready | DNS servers |
| System | `/api/v2/cmdb/system/admin` | 🟢 LOW | ✅ Client Ready | Admin accounts |
| System | `/api/v2/cmdb/system/ha` | 🟢 LOW | ✅ Client Ready | HA settings |
| Monitor | `/api/v2/monitor/system/ha-status` | 🟢 LOW | ✅ Client Ready | HA status |
| **WIRELESS & SWITCH** |
| Wireless | `/api/v2/cmdb/wireless-controller/wtp` | 🟢 LOW | ✅ Client Ready | FortiAPs |
| Wireless | `/api/v2/cmdb/wireless-controller/wtp-profile` | 🟢 LOW | ✅ Client Ready | AP profiles |
| Wireless | `/api/v2/cmdb/wireless-controller/vap` | 🟢 LOW | ✅ Client Ready | SSID profiles |
| Wireless | `/api/v2/monitor/wireless-controller/wtp` | 🟢 LOW | ✅ Client Ready | AP status |
| Switch | `/api/v2/cmdb/switch-controller/managed-switch` | 🟢 LOW | ✅ Client Ready | FortiSwitches |
| Switch | `/api/v2/cmdb/switch-controller/managed-switch/interface` | 🟢 LOW | ✅ Client Ready | Switch ports |
| Switch | `/api/v2/cmdb/switch-controller/vlan` | 🟢 LOW | ✅ Client Ready | Switch VLANs |
| Switch | `/api/v2/monitor/switch-controller/managed-switch` | 🟢 LOW | ✅ Client Ready | Switch status |
| **LOGGING** |
| Log | `/api/v2/cmdb/log/memory/setting` | 🟢 LOW | ✅ Client Ready | Memory logging |
| Log | `/api/v2/cmdb/log/disk/setting` | 🟢 LOW | ✅ Client Ready | Disk logging |
| Log | `/api/v2/cmdb/log/syslogd/setting` | 🟢 LOW | ✅ Client Ready | Syslog forwarding |
| Log | `/api/v2/cmdb/log/syslogd/filter` | 🟢 LOW | ✅ Client Ready | Syslog filters |
| **UTILITIES** |
| Utility | `/api/v2/monitor/system/config/backup` | 🟢 LOW | ✅ Client Ready | Config backup |
| Utility | `/api/v2/monitor/system/config/restore` | 🟢 LOW | ✅ Client Ready | Config restore |
| Utility | `/api/v2/monitor/system/firmware` | 🟢 LOW | ✅ Client Ready | Firmware info |
| Utility | `/api/v2/monitor/system/firmware/upgrade` | 🟢 LOW | ✅ Client Ready | Firmware upgrade |
| Utility | `/api/v2/monitor/system/reboot` | 🟢 LOW | ✅ Client Ready | System reboot |
| Utility | `/api/v2/monitor/alert/email/test` | 🟢 LOW | ✅ Client Ready | Test email |
| Traffic | `/api/v2/monitor/firewall/clear-counters` | 🟢 LOW | ✅ Client Ready | Clear counters |
| **ADVANCED SECURITY** |
| Firewall | `/api/v2/cmdb/firewall/local-in-policy` | 🟢 LOW | ✅ Client Ready | Local-in policies |
| Firewall | `/api/v2/cmdb/firewall/proxy-policy` | 🟢 LOW | ✅ Client Ready | Proxy policies |
| Firewall | `/api/v2/cmdb/firewall/dospolicy` | 🟢 LOW | ✅ Client Ready | DoS policies |
| Firewall | `/api/v2/cmdb/firewall/shaper/traffic-shaper` | 🟢 LOW | ✅ Client Ready | Traffic shaping |
| Firewall | `/api/v2/cmdb/firewall/shaper/per-ip-shaper` | 🟢 LOW | ✅ Client Ready | Per-IP shaping |
| Firewall | `/api/v2/cmdb/firewall/ssl-ssh-profile` | 🟢 LOW | ✅ Client Ready | SSL inspection |
| Security | `/api/v2/cmdb/emailfilter/profile` | 🟢 LOW | ✅ Client Ready | Email filtering |
| Security | `/api/v2/cmdb/voip/profile` | 🟢 LOW | ✅ Client Ready | VoIP profiles |
| Security | `/api/v2/cmdb/waf/profile` | 🟢 LOW | ✅ Client Ready | WAF profiles |
| **PROXY** |
| Proxy | `/api/v2/cmdb/web-proxy/profile` | 🟢 LOW | ✅ Client Ready | Proxy profiles |
| Proxy | `/api/v2/cmdb/web-proxy/explicit` | 🟢 LOW | ✅ Client Ready | Explicit proxy |
| Proxy | `/api/v2/cmdb/web-proxy/forward-server` | 🟢 LOW | ✅ Client Ready | Forward servers |
| Proxy | `/api/v2/cmdb/web-proxy/forward-server-group` | 🟢 LOW | ✅ Client Ready | Server groups |
| **AUTOMATION** |
| System | `/api/v2/cmdb/system/automation-action` | 🟢 LOW | ✅ Client Ready | Automation actions |
| System | `/api/v2/cmdb/system/automation-trigger` | 🟢 LOW | ✅ Client Ready | Automation triggers |
| System | `/api/v2/cmdb/system/automation-stitch` | 🟢 LOW | ✅ Client Ready | Automation stitches |
| **SNMP** |
| System | `/api/v2/cmdb/system/snmp/community` | 🟢 LOW | ✅ Client Ready | SNMP communities |
| System | `/api/v2/cmdb/system/snmp/user` | 🟢 LOW | ✅ Client Ready | SNMP users |
| **CERTIFICATES** |
| System | `/api/v2/cmdb/system/certificate/local` | 🟢 LOW | ✅ Client Ready | Local certificates |
| System | `/api/v2/cmdb/system/certificate/remote` | 🟢 LOW | ✅ Client Ready | CA certificates |
| **SDN CONNECTORS** |
| System | `/api/v2/cmdb/system/sdn-connector` | 🟢 LOW | ✅ Client Ready | Cloud connectors |
| **LINK MONITORING** |
| System | `/api/v2/cmdb/system/link-monitor` | 🟢 LOW | ✅ Client Ready | Link health monitors |

## Priority Legend

- 🔴 **HIGH**: Core functionality - implement immediately
- 🟡 **MEDIUM**: Enhanced features - implement in next phase
- 🟢 **LOW**: Advanced/specialized - implement as needed

## Status Legend

- ✅ **Integrated**: Fully integrated into platform workflows
- ✅ **Client Ready**: API client available, needs UI/workflow integration
- ⏳ **Not Started**: Not yet implemented

## Quick Stats

- **Total APIs**: 100+
- **High Priority**: 15 APIs
- **Medium Priority**: 15 APIs
- **Low Priority**: 70+ APIs
- **Client Implementation**: 100% (all APIs have client support)
- **Platform Integration**: ~10% (only firewall policies fully integrated)

## Next Steps

1. **Immediate (High Priority)**: Address objects, zones, monitoring dashboard
2. **Short-term (Medium Priority)**: Security profiles, schedules, NAT
3. **Long-term (Low Priority)**: VPN, SD-WAN, advanced features as requested


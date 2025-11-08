/**
 * FortiGate Monitor Module APIs
 * Handles system monitoring, status, resources, interfaces, license, routing, firewall, VPN, user monitoring
 */

import { FortiGateBaseClient, FortiGateRequestOptions } from './base-client';

export class FortiGateMonitorClient extends FortiGateBaseClient {
  /**
   * System status
   * Note: /api/v2/cmdb/system/status returns metadata (serial, version, build) with empty results
   * /api/v2/monitor/system/status returns runtime status
   */
  async getSystemStatus(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/monitor/system/status', options);
  }

  /**
   * HA status
   */
  async getHaStatus(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/monitor/system/ha-status', options);
  }

  /**
   * Resource usage (CPU, memory, disk)
   */
  async getResourceUsage(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/monitor/system/resource/usage', options);
  }

  /**
   * Interface runtime stats
   */
  async getInterfaceStats(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/monitor/system/interface', options);
  }

  /**
   * License status
   */
  async getLicenseStatus(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/monitor/license/status', options);
  }

  /**
   * IPv4 routing table
   */
  async getIpv4RoutingTable(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/monitor/router/ipv4', options);
  }

  /**
   * IPv6 routing table
   */
  async getIpv6RoutingTable(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/monitor/router/ipv6', options);
  }

  /**
   * BGP summary/peers
   */
  async getBgpStatus(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/monitor/router/bgp', options);
  }

  /**
   * OSPF summary
   */
  async getOspfStatus(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/monitor/router/ospf', options);
  }

  /**
   * Effective firewall policies (ordered)
   */
  async getEffectivePolicies(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/monitor/firewall/policy/select', options);
  }

  /**
   * Active firewall sessions
   */
  async getFirewallSessions(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/monitor/firewall/session', options);
  }

  /**
   * IPsec SAs (phase1/phase2 runtime)
   */
  async getIpsecSas(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/monitor/vpn/ipsec/sa', options);
  }

  /**
   * SSL VPN statistics/sessions
   */
  async getSslVpnStats(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/monitor/vpn/ssl/stats', options);
  }

  /**
   * Active authenticated users
   */
  async getActiveUsers(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/monitor/user/active', options);
  }

  /**
   * Banned users list
   */
  async getBannedUsers(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/monitor/user/banned', options);
  }

  /**
   * Clear banned user
   */
  async clearBannedUser(userId: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.delete(`/api/v2/monitor/user/banned/${userId}`, options);
  }

  /**
   * SD-WAN runtime status
   */
  async getSdwanStatus(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/monitor/system/sdwan', options);
  }

  /**
   * Wireless AP runtime status
   */
  async getWirelessApStatus(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/monitor/wireless-controller/wtp', options);
  }

  /**
   * Switch runtime status
   */
  async getSwitchStatus(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/monitor/switch-controller/managed-switch', options);
  }
}


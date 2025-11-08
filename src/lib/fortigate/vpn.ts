/**
 * FortiGate VPN Module APIs
 * Handles IPsec (interface and policy-based), SSL VPN settings and portals
 */

import { FortiGateBaseClient, FortiGateRequestOptions } from './base-client';

export class FortiGateVpnClient extends FortiGateBaseClient {
  /**
   * IPsec phase1 (interface mode)
   */
  async getIpsecPhase1Interfaces(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/vpn/ipsec/phase1-interface', options);
  }

  async getIpsecPhase1Interface(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.get(`/api/v2/cmdb/vpn/ipsec/phase1-interface/${name}`, options);
  }

  async createIpsecPhase1Interface(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.post('/api/v2/cmdb/vpn/ipsec/phase1-interface', data, options);
  }

  async updateIpsecPhase1Interface(name: string, data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put(`/api/v2/cmdb/vpn/ipsec/phase1-interface/${name}`, data, options);
  }

  async deleteIpsecPhase1Interface(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.delete(`/api/v2/cmdb/vpn/ipsec/phase1-interface/${name}`, options);
  }

  /**
   * IPsec phase2 (interface mode)
   */
  async getIpsecPhase2Interfaces(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/vpn/ipsec/phase2-interface', options);
  }

  async getIpsecPhase2Interface(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.get(`/api/v2/cmdb/vpn/ipsec/phase2-interface/${name}`, options);
  }

  async createIpsecPhase2Interface(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.post('/api/v2/cmdb/vpn/ipsec/phase2-interface', data, options);
  }

  async updateIpsecPhase2Interface(name: string, data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put(`/api/v2/cmdb/vpn/ipsec/phase2-interface/${name}`, data, options);
  }

  async deleteIpsecPhase2Interface(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.delete(`/api/v2/cmdb/vpn/ipsec/phase2-interface/${name}`, options);
  }

  /**
   * IPsec phase1 (policy-based - legacy)
   */
  async getIpsecPhase1Policies(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/vpn/ipsec/phase1', options);
  }

  async getIpsecPhase1Policy(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.get(`/api/v2/cmdb/vpn/ipsec/phase1/${name}`, options);
  }

  async createIpsecPhase1Policy(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.post('/api/v2/cmdb/vpn/ipsec/phase1', data, options);
  }

  async updateIpsecPhase1Policy(name: string, data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put(`/api/v2/cmdb/vpn/ipsec/phase1/${name}`, data, options);
  }

  async deleteIpsecPhase1Policy(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.delete(`/api/v2/cmdb/vpn/ipsec/phase1/${name}`, options);
  }

  /**
   * IPsec phase2 (policy-based - legacy)
   */
  async getIpsecPhase2Policies(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/vpn/ipsec/phase2', options);
  }

  async getIpsecPhase2Policy(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.get(`/api/v2/cmdb/vpn/ipsec/phase2/${name}`, options);
  }

  async createIpsecPhase2Policy(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.post('/api/v2/cmdb/vpn/ipsec/phase2', data, options);
  }

  async updateIpsecPhase2Policy(name: string, data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put(`/api/v2/cmdb/vpn/ipsec/phase2/${name}`, data, options);
  }

  async deleteIpsecPhase2Policy(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.delete(`/api/v2/cmdb/vpn/ipsec/phase2/${name}`, options);
  }

  /**
   * SSL VPN global settings
   */
  async getSslVpnSettings(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/vpn/ssl/settings', options);
  }

  async updateSslVpnSettings(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put('/api/v2/cmdb/vpn/ssl/settings', data, options);
  }

  /**
   * SSL VPN portals
   */
  async getSslVpnPortals(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/vpn/ssl/web/portal', options);
  }

  async getSslVpnPortal(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.get(`/api/v2/cmdb/vpn/ssl/web/portal/${name}`, options);
  }

  async createSslVpnPortal(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.post('/api/v2/cmdb/vpn/ssl/web/portal', data, options);
  }

  async updateSslVpnPortal(name: string, data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put(`/api/v2/cmdb/vpn/ssl/web/portal/${name}`, data, options);
  }

  async deleteSslVpnPortal(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.delete(`/api/v2/cmdb/vpn/ssl/web/portal/${name}`, options);
  }
}


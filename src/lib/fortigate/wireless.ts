/**
 * FortiGate Wireless Module APIs
 * Handles FortiAP management, profiles, virtual APs
 */

import { FortiGateBaseClient, FortiGateRequestOptions } from './base-client';

export class FortiGateWirelessClient extends FortiGateBaseClient {
  /**
   * Managed FortiAPs
   */
  async getWtps(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/wireless-controller/wtp', options);
  }

  async getWtp(serial: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.get(`/api/v2/cmdb/wireless-controller/wtp/${serial}`, options);
  }

  async createWtp(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.post('/api/v2/cmdb/wireless-controller/wtp', data, options);
  }

  async updateWtp(serial: string, data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put(`/api/v2/cmdb/wireless-controller/wtp/${serial}`, data, options);
  }

  async deleteWtp(serial: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.delete(`/api/v2/cmdb/wireless-controller/wtp/${serial}`, options);
  }

  /**
   * FortiAP profiles
   */
  async getWtpProfiles(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/wireless-controller/wtp-profile', options);
  }

  async getWtpProfile(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.get(`/api/v2/cmdb/wireless-controller/wtp-profile/${name}`, options);
  }

  async createWtpProfile(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.post('/api/v2/cmdb/wireless-controller/wtp-profile', data, options);
  }

  async updateWtpProfile(name: string, data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put(`/api/v2/cmdb/wireless-controller/wtp-profile/${name}`, data, options);
  }

  async deleteWtpProfile(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.delete(`/api/v2/cmdb/wireless-controller/wtp-profile/${name}`, options);
  }

  /**
   * Virtual AP (SSID) profiles
   */
  async getVaps(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/wireless-controller/vap', options);
  }

  async getVap(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.get(`/api/v2/cmdb/wireless-controller/vap/${name}`, options);
  }

  async createVap(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.post('/api/v2/cmdb/wireless-controller/vap', data, options);
  }

  async updateVap(name: string, data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put(`/api/v2/cmdb/wireless-controller/vap/${name}`, data, options);
  }

  async deleteVap(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.delete(`/api/v2/cmdb/wireless-controller/vap/${name}`, options);
  }
}


/**
 * FortiGate Security Module APIs
 * Handles WebFilter, Antivirus, ApplicationControl, IPS, DLP, EmailFilter, VoIP, WAF
 */

import { FortiGateBaseClient, FortiGateRequestOptions } from './base-client';

export class FortiGateSecurityClient extends FortiGateBaseClient {
  /**
   * WebFilter profiles
   */
  async getWebFilterProfiles(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/webfilter/profile', options);
  }

  async getWebFilterProfile(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.get(`/api/v2/cmdb/webfilter/profile/${name}`, options);
  }

  async createWebFilterProfile(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.post('/api/v2/cmdb/webfilter/profile', data, options);
  }

  async updateWebFilterProfile(name: string, data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put(`/api/v2/cmdb/webfilter/profile/${name}`, data, options);
  }

  async deleteWebFilterProfile(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.delete(`/api/v2/cmdb/webfilter/profile/${name}`, options);
  }

  /**
   * URL filters
   */
  async getUrlFilters(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/webfilter/urlfilter', options);
  }

  async getUrlFilter(id: number, options?: FortiGateRequestOptions): Promise<any> {
    return this.get(`/api/v2/cmdb/webfilter/urlfilter/${id}`, options);
  }

  async createUrlFilter(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.post('/api/v2/cmdb/webfilter/urlfilter', data, options);
  }

  async updateUrlFilter(id: number, data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put(`/api/v2/cmdb/webfilter/urlfilter/${id}`, data, options);
  }

  async deleteUrlFilter(id: number, options?: FortiGateRequestOptions): Promise<any> {
    return this.delete(`/api/v2/cmdb/webfilter/urlfilter/${id}`, options);
  }

  /**
   * Antivirus profiles
   */
  async getAntivirusProfiles(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/antivirus/profile', options);
  }

  async getAntivirusProfile(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.get(`/api/v2/cmdb/antivirus/profile/${name}`, options);
  }

  async createAntivirusProfile(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.post('/api/v2/cmdb/antivirus/profile', data, options);
  }

  async updateAntivirusProfile(name: string, data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put(`/api/v2/cmdb/antivirus/profile/${name}`, data, options);
  }

  async deleteAntivirusProfile(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.delete(`/api/v2/cmdb/antivirus/profile/${name}`, options);
  }

  /**
   * Application control custom lists
   */
  async getApplicationLists(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/application/list', options);
  }

  async getApplicationList(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.get(`/api/v2/cmdb/application/list/${name}`, options);
  }

  async createApplicationList(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.post('/api/v2/cmdb/application/list', data, options);
  }

  async updateApplicationList(name: string, data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put(`/api/v2/cmdb/application/list/${name}`, data, options);
  }

  async deleteApplicationList(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.delete(`/api/v2/cmdb/application/list/${name}`, options);
  }

  /**
   * Application control profiles
   */
  async getApplicationProfiles(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/application/profile', options);
  }

  async getApplicationProfile(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.get(`/api/v2/cmdb/application/profile/${name}`, options);
  }

  async createApplicationProfile(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.post('/api/v2/cmdb/application/profile', data, options);
  }

  async updateApplicationProfile(name: string, data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put(`/api/v2/cmdb/application/profile/${name}`, data, options);
  }

  async deleteApplicationProfile(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.delete(`/api/v2/cmdb/application/profile/${name}`, options);
  }

  /**
   * IPS sensors
   */
  async getIpsSensors(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/ips/sensor', options);
  }

  async getIpsSensor(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.get(`/api/v2/cmdb/ips/sensor/${name}`, options);
  }

  async createIpsSensor(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.post('/api/v2/cmdb/ips/sensor', data, options);
  }

  async updateIpsSensor(name: string, data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put(`/api/v2/cmdb/ips/sensor/${name}`, data, options);
  }

  async deleteIpsSensor(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.delete(`/api/v2/cmdb/ips/sensor/${name}`, options);
  }

  /**
   * DLP profiles
   */
  async getDlpProfiles(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/dlp/profile', options);
  }

  async getDlpProfile(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.get(`/api/v2/cmdb/dlp/profile/${name}`, options);
  }

  async createDlpProfile(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.post('/api/v2/cmdb/dlp/profile', data, options);
  }

  async updateDlpProfile(name: string, data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put(`/api/v2/cmdb/dlp/profile/${name}`, data, options);
  }

  async deleteDlpProfile(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.delete(`/api/v2/cmdb/dlp/profile/${name}`, options);
  }

  /**
   * Email filter profiles
   */
  async getEmailFilterProfiles(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/emailfilter/profile', options);
  }

  async getEmailFilterProfile(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.get(`/api/v2/cmdb/emailfilter/profile/${name}`, options);
  }

  async createEmailFilterProfile(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.post('/api/v2/cmdb/emailfilter/profile', data, options);
  }

  async updateEmailFilterProfile(name: string, data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put(`/api/v2/cmdb/emailfilter/profile/${name}`, data, options);
  }

  async deleteEmailFilterProfile(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.delete(`/api/v2/cmdb/emailfilter/profile/${name}`, options);
  }

  /**
   * VoIP profiles
   */
  async getVoipProfiles(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/voip/profile', options);
  }

  async getVoipProfile(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.get(`/api/v2/cmdb/voip/profile/${name}`, options);
  }

  async createVoipProfile(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.post('/api/v2/cmdb/voip/profile', data, options);
  }

  async updateVoipProfile(name: string, data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put(`/api/v2/cmdb/voip/profile/${name}`, data, options);
  }

  async deleteVoipProfile(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.delete(`/api/v2/cmdb/voip/profile/${name}`, options);
  }

  /**
   * WAF profiles
   */
  async getWafProfiles(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/waf/profile', options);
  }

  async getWafProfile(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.get(`/api/v2/cmdb/waf/profile/${name}`, options);
  }

  async createWafProfile(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.post('/api/v2/cmdb/waf/profile', data, options);
  }

  async updateWafProfile(name: string, data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put(`/api/v2/cmdb/waf/profile/${name}`, data, options);
  }

  async deleteWafProfile(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.delete(`/api/v2/cmdb/waf/profile/${name}`, options);
  }
}


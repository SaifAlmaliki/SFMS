/**
 * FortiGate Proxy Module APIs
 * Handles web proxy profiles, explicit proxy settings, forward servers
 */

import { FortiGateBaseClient, FortiGateRequestOptions } from './base-client';

export class FortiGateProxyClient extends FortiGateBaseClient {
  /**
   * Web proxy profiles
   */
  async getWebProxyProfiles(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/web-proxy/profile', options);
  }

  async getWebProxyProfile(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.get(`/api/v2/cmdb/web-proxy/profile/${name}`, options);
  }

  async createWebProxyProfile(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.post('/api/v2/cmdb/web-proxy/profile', data, options);
  }

  async updateWebProxyProfile(name: string, data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put(`/api/v2/cmdb/web-proxy/profile/${name}`, data, options);
  }

  async deleteWebProxyProfile(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.delete(`/api/v2/cmdb/web-proxy/profile/${name}`, options);
  }

  /**
   * Explicit proxy global settings
   */
  async getExplicitProxySettings(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/web-proxy/explicit', options);
  }

  async updateExplicitProxySettings(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put('/api/v2/cmdb/web-proxy/explicit', data, options);
  }

  /**
   * Forward servers
   */
  async getForwardServers(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/web-proxy/forward-server', options);
  }

  async getForwardServer(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.get(`/api/v2/cmdb/web-proxy/forward-server/${name}`, options);
  }

  async createForwardServer(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.post('/api/v2/cmdb/web-proxy/forward-server', data, options);
  }

  async updateForwardServer(name: string, data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put(`/api/v2/cmdb/web-proxy/forward-server/${name}`, data, options);
  }

  async deleteForwardServer(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.delete(`/api/v2/cmdb/web-proxy/forward-server/${name}`, options);
  }

  /**
   * Forward server groups
   */
  async getForwardServerGroups(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/web-proxy/forward-server-group', options);
  }

  async getForwardServerGroup(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.get(`/api/v2/cmdb/web-proxy/forward-server-group/${name}`, options);
  }

  async createForwardServerGroup(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.post('/api/v2/cmdb/web-proxy/forward-server-group', data, options);
  }

  async updateForwardServerGroup(name: string, data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put(`/api/v2/cmdb/web-proxy/forward-server-group/${name}`, data, options);
  }

  async deleteForwardServerGroup(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.delete(`/api/v2/cmdb/web-proxy/forward-server-group/${name}`, options);
  }
}


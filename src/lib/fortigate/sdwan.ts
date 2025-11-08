/**
 * FortiGate SD-WAN Module APIs
 * Handles SD-WAN settings, zones, health checks, services
 */

import { FortiGateBaseClient, FortiGateRequestOptions } from './base-client';

export class FortiGateSdwanClient extends FortiGateBaseClient {
  /**
   * SD-WAN global settings
   */
  async getSdwanSettings(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/system/sdwan', options);
  }

  async updateSdwanSettings(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put('/api/v2/cmdb/system/sdwan', data, options);
  }

  /**
   * SD-WAN zones
   */
  async getSdwanZones(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/system/sdwan/zone', options);
  }

  async getSdwanZone(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.get(`/api/v2/cmdb/system/sdwan/zone/${name}`, options);
  }

  async createSdwanZone(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.post('/api/v2/cmdb/system/sdwan/zone', data, options);
  }

  async updateSdwanZone(name: string, data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put(`/api/v2/cmdb/system/sdwan/zone/${name}`, data, options);
  }

  async deleteSdwanZone(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.delete(`/api/v2/cmdb/system/sdwan/zone/${name}`, options);
  }

  /**
   * SD-WAN health checks
   */
  async getSdwanHealthChecks(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/system/sdwan/health-check', options);
  }

  async getSdwanHealthCheck(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.get(`/api/v2/cmdb/system/sdwan/health-check/${name}`, options);
  }

  async createSdwanHealthCheck(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.post('/api/v2/cmdb/system/sdwan/health-check', data, options);
  }

  async updateSdwanHealthCheck(name: string, data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put(`/api/v2/cmdb/system/sdwan/health-check/${name}`, data, options);
  }

  async deleteSdwanHealthCheck(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.delete(`/api/v2/cmdb/system/sdwan/health-check/${name}`, options);
  }

  /**
   * SD-WAN services (steering policies)
   */
  async getSdwanServices(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/system/sdwan/service', options);
  }

  async getSdwanService(id: number, options?: FortiGateRequestOptions): Promise<any> {
    return this.get(`/api/v2/cmdb/system/sdwan/service/${id}`, options);
  }

  async createSdwanService(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.post('/api/v2/cmdb/system/sdwan/service', data, options);
  }

  async updateSdwanService(id: number, data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put(`/api/v2/cmdb/system/sdwan/service/${id}`, data, options);
  }

  async deleteSdwanService(id: number, options?: FortiGateRequestOptions): Promise<any> {
    return this.delete(`/api/v2/cmdb/system/sdwan/service/${id}`, options);
  }
}


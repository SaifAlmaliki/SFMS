/**
 * FortiGate Switch Module APIs
 * Handles managed FortiSwitches, ports, VLANs
 */

import { FortiGateBaseClient, FortiGateRequestOptions } from './base-client';

export class FortiGateSwitchClient extends FortiGateBaseClient {
  /**
   * Managed FortiSwitches
   */
  async getManagedSwitches(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/switch-controller/managed-switch', options);
  }

  async getManagedSwitch(switchId: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.get(`/api/v2/cmdb/switch-controller/managed-switch/${switchId}`, options);
  }

  async createManagedSwitch(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.post('/api/v2/cmdb/switch-controller/managed-switch', data, options);
  }

  async updateManagedSwitch(switchId: string, data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put(`/api/v2/cmdb/switch-controller/managed-switch/${switchId}`, data, options);
  }

  async deleteManagedSwitch(switchId: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.delete(`/api/v2/cmdb/switch-controller/managed-switch/${switchId}`, options);
  }

  /**
   * Switch ports (per switch)
   */
  async getSwitchInterfaces(switchId: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.get(`/api/v2/cmdb/switch-controller/managed-switch/${switchId}/interface`, options);
  }

  async getSwitchInterface(switchId: string, portName: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.get(`/api/v2/cmdb/switch-controller/managed-switch/${switchId}/interface/${portName}`, options);
  }

  async createSwitchInterface(switchId: string, data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.post(`/api/v2/cmdb/switch-controller/managed-switch/${switchId}/interface`, data, options);
  }

  async updateSwitchInterface(switchId: string, portName: string, data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put(`/api/v2/cmdb/switch-controller/managed-switch/${switchId}/interface/${portName}`, data, options);
  }

  async deleteSwitchInterface(switchId: string, portName: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.delete(`/api/v2/cmdb/switch-controller/managed-switch/${switchId}/interface/${portName}`, options);
  }

  /**
   * FortiSwitch VLANs
   */
  async getSwitchVlans(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/switch-controller/vlan', options);
  }

  async getSwitchVlan(vlanId: number, options?: FortiGateRequestOptions): Promise<any> {
    return this.get(`/api/v2/cmdb/switch-controller/vlan/${vlanId}`, options);
  }

  async createSwitchVlan(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.post('/api/v2/cmdb/switch-controller/vlan', data, options);
  }

  async updateSwitchVlan(vlanId: number, data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put(`/api/v2/cmdb/switch-controller/vlan/${vlanId}`, data, options);
  }

  async deleteSwitchVlan(vlanId: number, options?: FortiGateRequestOptions): Promise<any> {
    return this.delete(`/api/v2/cmdb/switch-controller/vlan/${vlanId}`, options);
  }
}


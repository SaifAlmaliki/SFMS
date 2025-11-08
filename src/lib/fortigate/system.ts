/**
 * FortiGate System Module APIs
 * Handles system configuration, interfaces, VDOMs, NTP, DNS, admin, SNMP, zones, etc.
 */

import { FortiGateBaseClient, FortiGateRequestOptions } from './base-client';

export class FortiGateSystemClient extends FortiGateBaseClient {
  /**
   * Get or update global FortiGate settings
   */
  async getGlobal(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/system/global', options);
  }

  async updateGlobal(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put('/api/v2/cmdb/system/global', data, options);
  }

  /**
   * Manage interfaces
   */
  async getInterfaces(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/system/interface', options);
  }

  async getInterface(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.get(`/api/v2/cmdb/system/interface/${name}`, options);
  }

  async createInterface(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.post('/api/v2/cmdb/system/interface', data, options);
  }

  async updateInterface(name: string, data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put(`/api/v2/cmdb/system/interface/${name}`, data, options);
  }

  async deleteInterface(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.delete(`/api/v2/cmdb/system/interface/${name}`, options);
  }

  /**
   * Manage VDOMs
   */
  async getVdoms(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/system/vdom', { ...options, scope: 'global' });
  }

  async createVdom(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.post('/api/v2/cmdb/system/vdom', data, { ...options, scope: 'global' });
  }

  async updateVdom(name: string, data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put(`/api/v2/cmdb/system/vdom/${name}`, data, { ...options, scope: 'global' });
  }

  async deleteVdom(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.delete(`/api/v2/cmdb/system/vdom/${name}`, { ...options, scope: 'global' });
  }

  /**
   * Configure NTP servers
   */
  async getNtp(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/system/ntp', options);
  }

  async updateNtp(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put('/api/v2/cmdb/system/ntp', data, options);
  }

  /**
   * Configure DNS servers
   */
  async getDns(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/system/dns', options);
  }

  async updateDns(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put('/api/v2/cmdb/system/dns', data, options);
  }

  /**
   * Manage admin accounts
   */
  async getAdmins(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/system/admin', options);
  }

  async getAdmin(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.get(`/api/v2/cmdb/system/admin/${name}`, options);
  }

  async createAdmin(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.post('/api/v2/cmdb/system/admin', data, options);
  }

  async updateAdmin(name: string, data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put(`/api/v2/cmdb/system/admin/${name}`, data, options);
  }

  async deleteAdmin(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.delete(`/api/v2/cmdb/system/admin/${name}`, options);
  }

  /**
   * SNMP v1/v2 communities
   */
  async getSnmpCommunities(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/system/snmp/community', options);
  }

  async createSnmpCommunity(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.post('/api/v2/cmdb/system/snmp/community', data, options);
  }

  async updateSnmpCommunity(name: string, data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put(`/api/v2/cmdb/system/snmp/community/${name}`, data, options);
  }

  async deleteSnmpCommunity(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.delete(`/api/v2/cmdb/system/snmp/community/${name}`, options);
  }

  /**
   * SNMP v3 users
   */
  async getSnmpUsers(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/system/snmp/user', options);
  }

  async createSnmpUser(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.post('/api/v2/cmdb/system/snmp/user', data, options);
  }

  async updateSnmpUser(name: string, data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put(`/api/v2/cmdb/system/snmp/user/${name}`, data, options);
  }

  async deleteSnmpUser(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.delete(`/api/v2/cmdb/system/snmp/user/${name}`, options);
  }

  /**
   * Interface zones
   */
  async getZones(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/system/zone', options);
  }

  async createZone(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.post('/api/v2/cmdb/system/zone', data, options);
  }

  async updateZone(name: string, data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put(`/api/v2/cmdb/system/zone/${name}`, data, options);
  }

  async deleteZone(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.delete(`/api/v2/cmdb/system/zone/${name}`, options);
  }

  /**
   * Link monitors
   */
  async getLinkMonitors(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/system/link-monitor', options);
  }

  async createLinkMonitor(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.post('/api/v2/cmdb/system/link-monitor', data, options);
  }

  async updateLinkMonitor(name: string, data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put(`/api/v2/cmdb/system/link-monitor/${name}`, data, options);
  }

  async deleteLinkMonitor(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.delete(`/api/v2/cmdb/system/link-monitor/${name}`, options);
  }

  /**
   * Automation actions
   */
  async getAutomationActions(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/system/automation-action', options);
  }

  async createAutomationAction(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.post('/api/v2/cmdb/system/automation-action', data, options);
  }

  async updateAutomationAction(name: string, data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put(`/api/v2/cmdb/system/automation-action/${name}`, data, options);
  }

  async deleteAutomationAction(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.delete(`/api/v2/cmdb/system/automation-action/${name}`, options);
  }

  /**
   * Automation triggers
   */
  async getAutomationTriggers(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/system/automation-trigger', options);
  }

  async createAutomationTrigger(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.post('/api/v2/cmdb/system/automation-trigger', data, options);
  }

  async updateAutomationTrigger(name: string, data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put(`/api/v2/cmdb/system/automation-trigger/${name}`, data, options);
  }

  async deleteAutomationTrigger(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.delete(`/api/v2/cmdb/system/automation-trigger/${name}`, options);
  }

  /**
   * Automation stitches
   */
  async getAutomationStitches(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/system/automation-stitch', options);
  }

  async createAutomationStitch(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.post('/api/v2/cmdb/system/automation-stitch', data, options);
  }

  async updateAutomationStitch(name: string, data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put(`/api/v2/cmdb/system/automation-stitch/${name}`, data, options);
  }

  async deleteAutomationStitch(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.delete(`/api/v2/cmdb/system/automation-stitch/${name}`, options);
  }

  /**
   * Local certificates
   */
  async getLocalCertificates(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/system/certificate/local', options);
  }

  async uploadLocalCertificate(
    certificate: File | Blob,
    key?: File | Blob,
    name?: string,
    options?: FortiGateRequestOptions
  ): Promise<any> {
    const formData = new FormData();
    formData.append('certificate', certificate);
    if (key) {
      formData.append('key', key);
    }
    if (name) {
      formData.append('name', name);
    }
    return this.uploadFile('/api/v2/cmdb/system/certificate/local', formData, options);
  }

  async deleteLocalCertificate(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.delete(`/api/v2/cmdb/system/certificate/local/${name}`, options);
  }

  /**
   * Remote CA certificates
   */
  async getRemoteCertificates(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/system/certificate/remote', options);
  }

  async createRemoteCertificate(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.post('/api/v2/cmdb/system/certificate/remote', data, options);
  }

  async deleteRemoteCertificate(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.delete(`/api/v2/cmdb/system/certificate/remote/${name}`, options);
  }

  /**
   * HA settings
   */
  async getHa(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/system/ha', options);
  }

  async updateHa(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put('/api/v2/cmdb/system/ha', data, options);
  }

  /**
   * SDN connectors
   */
  async getSdnConnectors(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/system/sdn-connector', options);
  }

  async createSdnConnector(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.post('/api/v2/cmdb/system/sdn-connector', data, options);
  }

  async updateSdnConnector(name: string, data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put(`/api/v2/cmdb/system/sdn-connector/${name}`, data, options);
  }

  async deleteSdnConnector(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.delete(`/api/v2/cmdb/system/sdn-connector/${name}`, options);
  }
}


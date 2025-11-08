/**
 * FortiGate User Module APIs
 * Handles local users, groups, LDAP, RADIUS, TACACS+, device definitions
 */

import { FortiGateBaseClient, FortiGateRequestOptions } from './base-client';

export class FortiGateUserClient extends FortiGateBaseClient {
  /**
   * Local users
   */
  async getLocalUsers(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/user/local', options);
  }

  async getLocalUser(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.get(`/api/v2/cmdb/user/local/${name}`, options);
  }

  async createLocalUser(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.post('/api/v2/cmdb/user/local', data, options);
  }

  async updateLocalUser(name: string, data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put(`/api/v2/cmdb/user/local/${name}`, data, options);
  }

  async deleteLocalUser(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.delete(`/api/v2/cmdb/user/local/${name}`, options);
  }

  /**
   * User groups
   */
  async getUserGroups(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/user/group', options);
  }

  async getUserGroup(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.get(`/api/v2/cmdb/user/group/${name}`, options);
  }

  async createUserGroup(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.post('/api/v2/cmdb/user/group', data, options);
  }

  async updateUserGroup(name: string, data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put(`/api/v2/cmdb/user/group/${name}`, data, options);
  }

  async deleteUserGroup(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.delete(`/api/v2/cmdb/user/group/${name}`, options);
  }

  /**
   * LDAP servers
   */
  async getLdapServers(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/user/ldap', options);
  }

  async getLdapServer(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.get(`/api/v2/cmdb/user/ldap/${name}`, options);
  }

  async createLdapServer(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.post('/api/v2/cmdb/user/ldap', data, options);
  }

  async updateLdapServer(name: string, data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put(`/api/v2/cmdb/user/ldap/${name}`, data, options);
  }

  async deleteLdapServer(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.delete(`/api/v2/cmdb/user/ldap/${name}`, options);
  }

  /**
   * RADIUS servers
   */
  async getRadiusServers(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/user/radius', options);
  }

  async getRadiusServer(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.get(`/api/v2/cmdb/user/radius/${name}`, options);
  }

  async createRadiusServer(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.post('/api/v2/cmdb/user/radius', data, options);
  }

  async updateRadiusServer(name: string, data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put(`/api/v2/cmdb/user/radius/${name}`, data, options);
  }

  async deleteRadiusServer(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.delete(`/api/v2/cmdb/user/radius/${name}`, options);
  }

  /**
   * TACACS+ servers
   */
  async getTacacsServers(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/user/tacacs+', options);
  }

  async getTacacsServer(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.get(`/api/v2/cmdb/user/tacacs+/${name}`, options);
  }

  async createTacacsServer(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.post('/api/v2/cmdb/user/tacacs+', data, options);
  }

  async updateTacacsServer(name: string, data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put(`/api/v2/cmdb/user/tacacs+/${name}`, data, options);
  }

  async deleteTacacsServer(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.delete(`/api/v2/cmdb/user/tacacs+/${name}`, options);
  }

  /**
   * Device definitions
   */
  async getDevices(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/user/device', options);
  }

  async getDevice(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.get(`/api/v2/cmdb/user/device/${name}`, options);
  }

  async createDevice(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.post('/api/v2/cmdb/user/device', data, options);
  }

  async updateDevice(name: string, data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put(`/api/v2/cmdb/user/device/${name}`, data, options);
  }

  async deleteDevice(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.delete(`/api/v2/cmdb/user/device/${name}`, options);
  }
}


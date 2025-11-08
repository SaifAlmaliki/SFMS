/**
 * FortiGate Firewall Module APIs
 * Handles firewall policies, addresses, services, VIPs, IP pools, schedules, shapers, profiles
 */

import { FortiGateBaseClient, FortiGateRequestOptions } from './base-client';

export class FortiGateFirewallClient extends FortiGateBaseClient {
  /**
   * IPv4 firewall policies
   */
  async getPolicies(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/firewall/policy', options);
  }

  async getPolicy(policyId: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.get(`/api/v2/cmdb/firewall/policy/${policyId}`, options);
  }

  async createPolicy(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.post('/api/v2/cmdb/firewall/policy', data, options);
  }

  async updatePolicy(policyId: string, data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put(`/api/v2/cmdb/firewall/policy/${policyId}`, data, options);
  }

  async deletePolicy(policyId: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.delete(`/api/v2/cmdb/firewall/policy/${policyId}`, options);
  }

  /**
   * IPv6 firewall policies
   */
  async getPolicies6(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/firewall/policy6', options);
  }

  async getPolicy6(policyId: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.get(`/api/v2/cmdb/firewall/policy6/${policyId}`, options);
  }

  async createPolicy6(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.post('/api/v2/cmdb/firewall/policy6', data, options);
  }

  async updatePolicy6(policyId: string, data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put(`/api/v2/cmdb/firewall/policy6/${policyId}`, data, options);
  }

  async deletePolicy6(policyId: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.delete(`/api/v2/cmdb/firewall/policy6/${policyId}`, options);
  }

  /**
   * Address objects (IPv4)
   */
  async getAddresses(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/firewall/address', options);
  }

  async getAddress(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.get(`/api/v2/cmdb/firewall/address/${name}`, options);
  }

  async createAddress(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.post('/api/v2/cmdb/firewall/address', data, options);
  }

  async updateAddress(name: string, data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put(`/api/v2/cmdb/firewall/address/${name}`, data, options);
  }

  async deleteAddress(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.delete(`/api/v2/cmdb/firewall/address/${name}`, options);
  }

  /**
   * Address objects (IPv6)
   */
  async getAddresses6(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/firewall/address6', options);
  }

  async getAddress6(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.get(`/api/v2/cmdb/firewall/address6/${name}`, options);
  }

  async createAddress6(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.post('/api/v2/cmdb/firewall/address6', data, options);
  }

  async updateAddress6(name: string, data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put(`/api/v2/cmdb/firewall/address6/${name}`, data, options);
  }

  async deleteAddress6(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.delete(`/api/v2/cmdb/firewall/address6/${name}`, options);
  }

  /**
   * Address groups
   */
  async getAddressGroups(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/firewall/addrgrp', options);
  }

  async getAddressGroup(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.get(`/api/v2/cmdb/firewall/addrgrp/${name}`, options);
  }

  async createAddressGroup(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.post('/api/v2/cmdb/firewall/addrgrp', data, options);
  }

  async updateAddressGroup(name: string, data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put(`/api/v2/cmdb/firewall/addrgrp/${name}`, data, options);
  }

  async deleteAddressGroup(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.delete(`/api/v2/cmdb/firewall/addrgrp/${name}`, options);
  }

  /**
   * Custom services
   */
  async getCustomServices(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/firewall/service/custom', options);
  }

  async getCustomService(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.get(`/api/v2/cmdb/firewall/service/custom/${name}`, options);
  }

  async createCustomService(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.post('/api/v2/cmdb/firewall/service/custom', data, options);
  }

  async updateCustomService(name: string, data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put(`/api/v2/cmdb/firewall/service/custom/${name}`, data, options);
  }

  async deleteCustomService(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.delete(`/api/v2/cmdb/firewall/service/custom/${name}`, options);
  }

  /**
   * Service groups
   */
  async getServiceGroups(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/firewall/service/group', options);
  }

  async getServiceGroup(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.get(`/api/v2/cmdb/firewall/service/group/${name}`, options);
  }

  async createServiceGroup(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.post('/api/v2/cmdb/firewall/service/group', data, options);
  }

  async updateServiceGroup(name: string, data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put(`/api/v2/cmdb/firewall/service/group/${name}`, data, options);
  }

  async deleteServiceGroup(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.delete(`/api/v2/cmdb/firewall/service/group/${name}`, options);
  }

  /**
   * Virtual IPs (destination NAT)
   */
  async getVips(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/firewall/vip', options);
  }

  async getVip(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.get(`/api/v2/cmdb/firewall/vip/${name}`, options);
  }

  async createVip(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.post('/api/v2/cmdb/firewall/vip', data, options);
  }

  async updateVip(name: string, data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put(`/api/v2/cmdb/firewall/vip/${name}`, data, options);
  }

  async deleteVip(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.delete(`/api/v2/cmdb/firewall/vip/${name}`, options);
  }

  /**
   * VIP groups
   */
  async getVipGroups(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/firewall/vipgrp', options);
  }

  async getVipGroup(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.get(`/api/v2/cmdb/firewall/vipgrp/${name}`, options);
  }

  async createVipGroup(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.post('/api/v2/cmdb/firewall/vipgrp', data, options);
  }

  async updateVipGroup(name: string, data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put(`/api/v2/cmdb/firewall/vipgrp/${name}`, data, options);
  }

  async deleteVipGroup(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.delete(`/api/v2/cmdb/firewall/vipgrp/${name}`, options);
  }

  /**
   * IP pools (source NAT)
   */
  async getIpPools(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/firewall/ippool', options);
  }

  async getIpPool(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.get(`/api/v2/cmdb/firewall/ippool/${name}`, options);
  }

  async createIpPool(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.post('/api/v2/cmdb/firewall/ippool', data, options);
  }

  async updateIpPool(name: string, data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put(`/api/v2/cmdb/firewall/ippool/${name}`, data, options);
  }

  async deleteIpPool(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.delete(`/api/v2/cmdb/firewall/ippool/${name}`, options);
  }

  /**
   * Local-in policies
   */
  async getLocalInPolicies(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/firewall/local-in-policy', options);
  }

  async getLocalInPolicy(policyId: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.get(`/api/v2/cmdb/firewall/local-in-policy/${policyId}`, options);
  }

  async createLocalInPolicy(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.post('/api/v2/cmdb/firewall/local-in-policy', data, options);
  }

  async updateLocalInPolicy(policyId: string, data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put(`/api/v2/cmdb/firewall/local-in-policy/${policyId}`, data, options);
  }

  async deleteLocalInPolicy(policyId: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.delete(`/api/v2/cmdb/firewall/local-in-policy/${policyId}`, options);
  }

  /**
   * Proxy policies
   */
  async getProxyPolicies(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/firewall/proxy-policy', options);
  }

  async getProxyPolicy(policyId: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.get(`/api/v2/cmdb/firewall/proxy-policy/${policyId}`, options);
  }

  async createProxyPolicy(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.post('/api/v2/cmdb/firewall/proxy-policy', data, options);
  }

  async updateProxyPolicy(policyId: string, data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put(`/api/v2/cmdb/firewall/proxy-policy/${policyId}`, data, options);
  }

  async deleteProxyPolicy(policyId: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.delete(`/api/v2/cmdb/firewall/proxy-policy/${policyId}`, options);
  }

  /**
   * Recurring schedules
   */
  async getRecurringSchedules(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/firewall/schedule/recurring', options);
  }

  async getRecurringSchedule(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.get(`/api/v2/cmdb/firewall/schedule/recurring/${name}`, options);
  }

  async createRecurringSchedule(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.post('/api/v2/cmdb/firewall/schedule/recurring', data, options);
  }

  async updateRecurringSchedule(name: string, data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put(`/api/v2/cmdb/firewall/schedule/recurring/${name}`, data, options);
  }

  async deleteRecurringSchedule(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.delete(`/api/v2/cmdb/firewall/schedule/recurring/${name}`, options);
  }

  /**
   * One-time schedules
   */
  async getOnetimeSchedules(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/firewall/schedule/onetime', options);
  }

  async getOnetimeSchedule(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.get(`/api/v2/cmdb/firewall/schedule/onetime/${name}`, options);
  }

  async createOnetimeSchedule(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.post('/api/v2/cmdb/firewall/schedule/onetime', data, options);
  }

  async updateOnetimeSchedule(name: string, data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put(`/api/v2/cmdb/firewall/schedule/onetime/${name}`, data, options);
  }

  async deleteOnetimeSchedule(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.delete(`/api/v2/cmdb/firewall/schedule/onetime/${name}`, options);
  }

  /**
   * DoS policies
   */
  async getDosPolicies(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/firewall/dospolicy', options);
  }

  async getDosPolicy(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.get(`/api/v2/cmdb/firewall/dospolicy/${name}`, options);
  }

  async createDosPolicy(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.post('/api/v2/cmdb/firewall/dospolicy', data, options);
  }

  async updateDosPolicy(name: string, data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put(`/api/v2/cmdb/firewall/dospolicy/${name}`, data, options);
  }

  async deleteDosPolicy(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.delete(`/api/v2/cmdb/firewall/dospolicy/${name}`, options);
  }

  /**
   * Traffic shapers
   */
  async getTrafficShapers(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/firewall/shaper/traffic-shaper', options);
  }

  async getTrafficShaper(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.get(`/api/v2/cmdb/firewall/shaper/traffic-shaper/${name}`, options);
  }

  async createTrafficShaper(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.post('/api/v2/cmdb/firewall/shaper/traffic-shaper', data, options);
  }

  async updateTrafficShaper(name: string, data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put(`/api/v2/cmdb/firewall/shaper/traffic-shaper/${name}`, data, options);
  }

  async deleteTrafficShaper(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.delete(`/api/v2/cmdb/firewall/shaper/traffic-shaper/${name}`, options);
  }

  /**
   * Per-IP shapers
   */
  async getPerIpShapers(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/firewall/shaper/per-ip-shaper', options);
  }

  async getPerIpShaper(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.get(`/api/v2/cmdb/firewall/shaper/per-ip-shaper/${name}`, options);
  }

  async createPerIpShaper(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.post('/api/v2/cmdb/firewall/shaper/per-ip-shaper', data, options);
  }

  async updatePerIpShaper(name: string, data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put(`/api/v2/cmdb/firewall/shaper/per-ip-shaper/${name}`, data, options);
  }

  async deletePerIpShaper(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.delete(`/api/v2/cmdb/firewall/shaper/per-ip-shaper/${name}`, options);
  }

  /**
   * SSL/SSH inspection profiles
   */
  async getSslSshProfiles(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/firewall/ssl-ssh-profile', options);
  }

  async getSslSshProfile(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.get(`/api/v2/cmdb/firewall/ssl-ssh-profile/${name}`, options);
  }

  async createSslSshProfile(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.post('/api/v2/cmdb/firewall/ssl-ssh-profile', data, options);
  }

  async updateSslSshProfile(name: string, data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put(`/api/v2/cmdb/firewall/ssl-ssh-profile/${name}`, data, options);
  }

  async deleteSslSshProfile(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.delete(`/api/v2/cmdb/firewall/ssl-ssh-profile/${name}`, options);
  }

  /**
   * Profile groups
   */
  async getProfileGroups(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/firewall/profile-group', options);
  }

  async getProfileGroup(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.get(`/api/v2/cmdb/firewall/profile-group/${name}`, options);
  }

  async createProfileGroup(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.post('/api/v2/cmdb/firewall/profile-group', data, options);
  }

  async updateProfileGroup(name: string, data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put(`/api/v2/cmdb/firewall/profile-group/${name}`, data, options);
  }

  async deleteProfileGroup(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.delete(`/api/v2/cmdb/firewall/profile-group/${name}`, options);
  }
}


/**
 * FortiGate Router Module APIs
 * Handles static routes, policy routes, BGP, OSPF, prefix lists, route maps
 */

import { FortiGateBaseClient, FortiGateRequestOptions } from './base-client';

export class FortiGateRouterClient extends FortiGateBaseClient {
  /**
   * Static routes
   */
  async getStaticRoutes(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/router/static', options);
  }

  async getStaticRoute(seqNum: number, options?: FortiGateRequestOptions): Promise<any> {
    return this.get(`/api/v2/cmdb/router/static/${seqNum}`, options);
  }

  async createStaticRoute(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.post('/api/v2/cmdb/router/static', data, options);
  }

  async updateStaticRoute(seqNum: number, data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put(`/api/v2/cmdb/router/static/${seqNum}`, data, options);
  }

  async deleteStaticRoute(seqNum: number, options?: FortiGateRequestOptions): Promise<any> {
    return this.delete(`/api/v2/cmdb/router/static/${seqNum}`, options);
  }

  /**
   * Policy routes (PBR)
   */
  async getPolicyRoutes(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/router/policy', options);
  }

  async getPolicyRoute(seqNum: number, options?: FortiGateRequestOptions): Promise<any> {
    return this.get(`/api/v2/cmdb/router/policy/${seqNum}`, options);
  }

  async createPolicyRoute(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.post('/api/v2/cmdb/router/policy', data, options);
  }

  async updatePolicyRoute(seqNum: number, data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put(`/api/v2/cmdb/router/policy/${seqNum}`, data, options);
  }

  async deletePolicyRoute(seqNum: number, options?: FortiGateRequestOptions): Promise<any> {
    return this.delete(`/api/v2/cmdb/router/policy/${seqNum}`, options);
  }

  /**
   * BGP global settings
   */
  async getBgpGlobal(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/router/bgp', options);
  }

  async updateBgpGlobal(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put('/api/v2/cmdb/router/bgp', data, options);
  }

  /**
   * BGP neighbors
   */
  async getBgpNeighbors(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/router/bgp/neighbor', options);
  }

  async getBgpNeighbor(ip: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.get(`/api/v2/cmdb/router/bgp/neighbor/${ip}`, options);
  }

  async createBgpNeighbor(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.post('/api/v2/cmdb/router/bgp/neighbor', data, options);
  }

  async updateBgpNeighbor(ip: string, data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put(`/api/v2/cmdb/router/bgp/neighbor/${ip}`, data, options);
  }

  async deleteBgpNeighbor(ip: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.delete(`/api/v2/cmdb/router/bgp/neighbor/${ip}`, options);
  }

  /**
   * OSPF global
   */
  async getOspfGlobal(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/router/ospf', options);
  }

  async updateOspfGlobal(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put('/api/v2/cmdb/router/ospf', data, options);
  }

  /**
   * OSPF networks
   */
  async getOspfNetworks(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/router/ospf/network', options);
  }

  async getOspfNetwork(id: number, options?: FortiGateRequestOptions): Promise<any> {
    return this.get(`/api/v2/cmdb/router/ospf/network/${id}`, options);
  }

  async createOspfNetwork(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.post('/api/v2/cmdb/router/ospf/network', data, options);
  }

  async updateOspfNetwork(id: number, data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put(`/api/v2/cmdb/router/ospf/network/${id}`, data, options);
  }

  async deleteOspfNetwork(id: number, options?: FortiGateRequestOptions): Promise<any> {
    return this.delete(`/api/v2/cmdb/router/ospf/network/${id}`, options);
  }

  /**
   * Prefix lists
   */
  async getPrefixLists(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/router/prefix-list', options);
  }

  async getPrefixList(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.get(`/api/v2/cmdb/router/prefix-list/${name}`, options);
  }

  async createPrefixList(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.post('/api/v2/cmdb/router/prefix-list', data, options);
  }

  async updatePrefixList(name: string, data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put(`/api/v2/cmdb/router/prefix-list/${name}`, data, options);
  }

  async deletePrefixList(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.delete(`/api/v2/cmdb/router/prefix-list/${name}`, options);
  }

  /**
   * Route maps
   */
  async getRouteMaps(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/router/route-map', options);
  }

  async getRouteMap(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.get(`/api/v2/cmdb/router/route-map/${name}`, options);
  }

  async createRouteMap(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.post('/api/v2/cmdb/router/route-map', data, options);
  }

  async updateRouteMap(name: string, data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put(`/api/v2/cmdb/router/route-map/${name}`, data, options);
  }

  async deleteRouteMap(name: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.delete(`/api/v2/cmdb/router/route-map/${name}`, options);
  }
}


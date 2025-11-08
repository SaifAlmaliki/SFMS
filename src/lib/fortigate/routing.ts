/**
 * FortiGate Routing Module APIs
 * Handles route lookup
 */

import { FortiGateBaseClient, FortiGateRequestOptions } from './base-client';

export class FortiGateRoutingClient extends FortiGateBaseClient {
  /**
   * Route lookup for IP
   */
  async lookupRoute(destination: string, options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/monitor/router/lookup', {
      ...options,
      destination,
    });
  }
}


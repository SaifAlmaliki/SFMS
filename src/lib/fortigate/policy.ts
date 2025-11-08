/**
 * FortiGate Policy Module APIs
 * Handles policy anomaly detection
 */

import { FortiGateBaseClient, FortiGateRequestOptions } from './base-client';

export class FortiGatePolicyClient extends FortiGateBaseClient {
  /**
   * Policy anomaly check
   */
  async getPolicyAnomalies(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/monitor/firewall/policy/anomaly', options);
  }
}


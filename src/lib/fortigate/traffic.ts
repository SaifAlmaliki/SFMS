/**
 * FortiGate Traffic Module APIs
 * Handles traffic counter clearing
 */

import { FortiGateBaseClient, FortiGateRequestOptions } from './base-client';

export class FortiGateTrafficClient extends FortiGateBaseClient {
  /**
   * Clear traffic counters
   */
  async clearCounters(options?: FortiGateRequestOptions): Promise<any> {
    return this.post('/api/v2/monitor/firewall/clear-counters', undefined, options);
  }
}


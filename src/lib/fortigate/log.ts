/**
 * FortiGate Log Module APIs
 * Handles memory, disk, and syslog logging settings
 */

import { FortiGateBaseClient, FortiGateRequestOptions } from './base-client';

export class FortiGateLogClient extends FortiGateBaseClient {
  /**
   * Memory logging settings
   */
  async getMemoryLogSettings(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/log/memory/setting', options);
  }

  async updateMemoryLogSettings(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put('/api/v2/cmdb/log/memory/setting', data, options);
  }

  /**
   * Disk logging settings
   */
  async getDiskLogSettings(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/log/disk/setting', options);
  }

  async updateDiskLogSettings(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put('/api/v2/cmdb/log/disk/setting', data, options);
  }

  /**
   * Syslog forwarding settings
   */
  async getSyslogSettings(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/log/syslogd/setting', options);
  }

  async updateSyslogSettings(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put('/api/v2/cmdb/log/syslogd/setting', data, options);
  }

  /**
   * Syslog filter
   */
  async getSyslogFilter(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/cmdb/log/syslogd/filter', options);
  }

  async updateSyslogFilter(data: any, options?: FortiGateRequestOptions): Promise<any> {
    return this.put('/api/v2/cmdb/log/syslogd/filter', data, options);
  }
}


/**
 * FortiGate Utility Module APIs
 * Handles alerts, config backup/restore, firmware management, system reboot
 */

import { FortiGateBaseClient, FortiGateRequestOptions } from './base-client';

export class FortiGateUtilityClient extends FortiGateBaseClient {
  /**
   * Send test alert email
   */
  async sendTestAlertEmail(options?: FortiGateRequestOptions): Promise<any> {
    return this.post('/api/v2/monitor/alert/email/test', undefined, options);
  }

  /**
   * Download full configuration backup
   */
  async downloadConfigBackup(options?: FortiGateRequestOptions): Promise<any> {
    return this.downloadFile('/api/v2/monitor/system/config/backup', options);
  }

  /**
   * Restore configuration
   */
  async restoreConfig(configFile: File | Blob, options?: FortiGateRequestOptions): Promise<any> {
    const formData = new FormData();
    formData.append('file', configFile);
    return this.uploadFile('/api/v2/monitor/system/config/restore', formData, options);
  }

  /**
   * Get current firmware info
   */
  async getFirmwareInfo(options?: FortiGateRequestOptions): Promise<any> {
    return this.get('/api/v2/monitor/system/firmware', options);
  }

  /**
   * Trigger firmware upgrade
   */
  async upgradeFirmware(firmwareFile: File | Blob, options?: FortiGateRequestOptions): Promise<any> {
    const formData = new FormData();
    formData.append('file', firmwareFile);
    return this.uploadFile('/api/v2/monitor/system/firmware/upgrade', formData, options);
  }

  /**
   * Reboot device
   */
  async rebootDevice(options?: FortiGateRequestOptions): Promise<any> {
    return this.post('/api/v2/monitor/system/reboot', undefined, options);
  }
}


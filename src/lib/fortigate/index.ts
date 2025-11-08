/**
 * FortiGate API Client - Main Export
 * Provides a unified interface to all FortiGate API modules
 */

import { FortiGateBaseClient, FortiGateDevice, FortiGateApiResponse, FortiGateRequestOptions } from './base-client';
import { FortiGateSystemClient } from './system';
import { FortiGateMonitorClient } from './monitor';
import { FortiGateFirewallClient } from './firewall';
import { FortiGateSecurityClient } from './security';
import { FortiGateProxyClient } from './proxy';
import { FortiGateUserClient } from './user';
import { FortiGateVpnClient } from './vpn';
import { FortiGateRouterClient } from './router';
import { FortiGateSdwanClient } from './sdwan';
import { FortiGateWirelessClient } from './wireless';
import { FortiGateSwitchClient } from './switch';
import { FortiGateLogClient } from './log';
import { FortiGateUtilityClient } from './utility';
import { FortiGateTrafficClient } from './traffic';
import { FortiGatePolicyClient } from './policy';
import { FortiGateRoutingClient } from './routing';

/**
 * Main FortiGate API Client
 * Combines all module clients into a single unified interface
 */
export class FortiGateClient extends FortiGateBaseClient {
  public system: FortiGateSystemClient;
  public monitor: FortiGateMonitorClient;
  public firewall: FortiGateFirewallClient;
  public security: FortiGateSecurityClient;
  public proxy: FortiGateProxyClient;
  public user: FortiGateUserClient;
  public vpn: FortiGateVpnClient;
  public router: FortiGateRouterClient;
  public sdwan: FortiGateSdwanClient;
  public wireless: FortiGateWirelessClient;
  public switch: FortiGateSwitchClient;
  public log: FortiGateLogClient;
  public utility: FortiGateUtilityClient;
  public traffic: FortiGateTrafficClient;
  public policy: FortiGatePolicyClient;
  public routing: FortiGateRoutingClient;

  constructor(device: FortiGateDevice) {
    super(device);
    
    // Initialize all module clients
    this.system = new FortiGateSystemClient(device);
    this.monitor = new FortiGateMonitorClient(device);
    this.firewall = new FortiGateFirewallClient(device);
    this.security = new FortiGateSecurityClient(device);
    this.proxy = new FortiGateProxyClient(device);
    this.user = new FortiGateUserClient(device);
    this.vpn = new FortiGateVpnClient(device);
    this.router = new FortiGateRouterClient(device);
    this.sdwan = new FortiGateSdwanClient(device);
    this.wireless = new FortiGateWirelessClient(device);
    this.switch = new FortiGateSwitchClient(device);
    this.log = new FortiGateLogClient(device);
    this.utility = new FortiGateUtilityClient(device);
    this.traffic = new FortiGateTrafficClient(device);
    this.policy = new FortiGatePolicyClient(device);
    this.routing = new FortiGateRoutingClient(device);
  }
}

// Re-export types and base client for convenience
export type { FortiGateDevice, FortiGateApiResponse, FortiGateRequestOptions };
export { FortiGateBaseClient };


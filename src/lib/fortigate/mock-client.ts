/**
 * Mock FortiGate API Client
 * Provides realistic mock responses for development and testing
 */

import { FortiGateClient, FortiGateDevice, FortiGateApiResponse } from './index';

/**
 * Mock FortiGate Client with realistic data
 */
export class MockFortiGateClient extends FortiGateClient {
  // Mock data storage
  private mockPolicies: any[] = [];
  private mockAddresses: any[] = [];
  private mockInterfaces: any[] = [];
  private mockSystemStatus: any = null;
  private mockUsers: any[] = [];
  private mockVdoms: any[] = [];
  private mockSessions: any[] = [];
  private nextId = 1;

  constructor(device: FortiGateDevice) {
    super(device);
    this.initializeMockData();
  }

  /**
   * Initialize mock data with realistic FortiGate responses
   */
  private initializeMockData() {
    // Initialize system status
    this.mockSystemStatus = {
      hostname: this.device.name || 'FortiGate-VM64',
      version: '7.2.5',
      build: 1234,
      serial: 'FGVM08TM12345678',
      uptime: 86400,
      cpu_usage: 15.5,
      mem_usage: 45.2,
      disk_usage: 30.1,
    };

    // Initialize interfaces
    this.mockInterfaces = [
      {
        name: 'port1',
        vdom: 'root',
        ip: '192.168.1.1 255.255.255.0',
        status: 'up',
        speed: '1000',
        type: 'physical',
        alias: 'WAN1',
      },
      {
        name: 'port2',
        vdom: 'root',
        ip: '10.0.0.1 255.255.255.0',
        status: 'up',
        speed: '1000',
        type: 'physical',
        alias: 'LAN',
      },
      {
        name: 'port3',
        vdom: 'root',
        ip: '172.16.0.1 255.255.255.0',
        status: 'up',
        speed: '1000',
        type: 'physical',
        alias: 'DMZ',
      },
    ];

    // Initialize address objects
    this.mockAddresses = [
      {
        name: 'Internal-Network',
        subnet: '10.0.0.0/8',
        type: 'ipmask',
        comment: 'Main internal corporate network',
      },
      {
        name: 'DMZ-Network',
        subnet: '172.16.0.0/16',
        type: 'ipmask',
        comment: 'DMZ network segment',
      },
      {
        name: 'google.com',
        fqdn: 'google.com',
        type: 'fqdn',
        comment: 'Google main domain',
      },
    ];

    // Initialize policies
    this.mockPolicies = [
      {
        policyid: 1,
        name: 'Allow Internal to DMZ',
        srcintf: [{ name: 'port2' }],
        dstintf: [{ name: 'port3' }],
        srcaddr: [{ name: 'all' }],
        dstaddr: [{ name: 'all' }],
        action: 'accept',
        schedule: 'always',
        service: [{ name: 'ALL' }],
        logtraffic: 'all',
        comments: 'Allow internal traffic to DMZ',
      },
      {
        policyid: 2,
        name: 'Block Public to Internal',
        srcintf: [{ name: 'port1' }],
        dstintf: [{ name: 'port2' }],
        srcaddr: [{ name: 'all' }],
        dstaddr: [{ name: 'Internal-Network' }],
        action: 'deny',
        schedule: 'always',
        service: [{ name: 'ALL' }],
        logtraffic: 'utm',
        comments: 'Block public access to internal network',
      },
    ];

    // Initialize users
    this.mockUsers = [
      {
        name: 'admin',
        user_type: 'local',
        status: 'enable',
        two_factor: 'disable',
        wildcard: 'disable',
      },
    ];

    // Initialize VDOMs
    this.mockVdoms = [
      {
        name: 'root',
        short_name: 'root',
        vcluster_id: 0,
        flag: 0,
      },
    ];
  }

  // Override base methods with mock implementations
  async testConnection(): Promise<FortiGateApiResponse> {
    await this.simulateDelay(500);
    return {
      success: true,
      data: {
        serial: this.mockSystemStatus.serial,
        version: this.mockSystemStatus.version,
        build: this.mockSystemStatus.build,
        hostname: this.device.name || this.mockSystemStatus.hostname,
      },
      status: 200,
      httpStatus: 200,
      revision: 'mock-revision-123',
      serial: this.mockSystemStatus.serial,
      version: this.mockSystemStatus.version,
      build: this.mockSystemStatus.build,
      vdom: 'root',
    };
  }

  // System module mocks
  async getGlobal(options?: any): Promise<FortiGateApiResponse> {
    await this.simulateDelay(200);
    return {
      success: true,
      data: {
        hostname: this.device.name || 'FortiGate-VM64',
        timezone: 'America/New_York',
        admin_port: 443,
        admin_sport: 10443,
        admin_https_redirect: 'enable',
        admin_https_ssl_versions: 'tlsv1-2 tlsv1-3',
        admin_https_ssl_ciphersuites: 'all',
        admin_https_ssl_banned_ciphers: 'none',
      },
      status: 200,
    };
  }

  async getInterfaces(options?: any): Promise<FortiGateApiResponse> {
    await this.simulateDelay(300);
    return {
      success: true,
      data: this.mockInterfaces,
      status: 200,
    };
  }

  async getVdoms(options?: any): Promise<FortiGateApiResponse> {
    await this.simulateDelay(200);
    return {
      success: true,
      data: this.mockVdoms,
      status: 200,
    };
  }

  async getAdmins(options?: any): Promise<FortiGateApiResponse> {
    await this.simulateDelay(250);
    return {
      success: true,
      data: this.mockUsers,
      status: 200,
    };
  }

  // Monitor module mocks
  async getSystemStatus(options?: any): Promise<FortiGateApiResponse> {
    await this.simulateDelay(200);
    return {
      success: true,
      data: this.mockSystemStatus,
      status: 200,
      httpStatus: 200,
      revision: 'mock-revision-123',
      serial: this.mockSystemStatus.serial,
      version: this.mockSystemStatus.version,
      build: 1234,
      vdom: 'root',
    };
  }

  async getResourceUsage(options?: any): Promise<FortiGateApiResponse> {
    await this.simulateDelay(200);
    return {
      success: true,
      data: {
        cpu: {
          usage: 15.5,
          history: [12.3, 14.1, 15.5, 16.2, 15.8],
        },
        memory: {
          usage: 45.2,
          available: 2048,
          total: 4096,
        },
        disk: {
          usage: 30.1,
          available: 14000,
          total: 20000,
        },
      },
      status: 200,
    };
  }

  async getInterfaceStats(options?: any): Promise<FortiGateApiResponse> {
    await this.simulateDelay(300);
    return {
      success: true,
      data: this.mockInterfaces.map((iface) => ({
        ...iface,
        rx_bytes: Math.floor(Math.random() * 1000000000),
        tx_bytes: Math.floor(Math.random() * 1000000000),
        rx_packets: Math.floor(Math.random() * 1000000),
        tx_packets: Math.floor(Math.random() * 1000000),
        rx_errors: 0,
        tx_errors: 0,
      })),
      status: 200,
    };
  }

  async getLicenseStatus(options?: any): Promise<FortiGateApiResponse> {
    await this.simulateDelay(300);
    return {
      success: true,
      data: {
        status: 'valid',
        contract_expiry: '2025-12-31',
        vm_license: 'VM02',
        fortiguard_anycast: 'enable',
        fortiguard_anycast_source: 'fortiguard',
        forticare_support: 'valid',
      },
      status: 200,
    };
  }

  async getFirewallSessions(options?: any): Promise<FortiGateApiResponse> {
    await this.simulateDelay(400);
    return {
      success: true,
      data: {
        session_count: 1250,
        session_rate: 45,
        packet_rate: 1200,
        traffic: {
          bytes_in: 1024000000,
          bytes_out: 2048000000,
          packets_in: 5000000,
          packets_out: 6000000,
        },
      },
      status: 200,
    };
  }

  async getActiveUsers(options?: any): Promise<FortiGateApiResponse> {
    await this.simulateDelay(250);
    return {
      success: true,
      data: [
        {
          user: 'admin',
          ip: '192.168.1.100',
          type: 'local',
          login_time: new Date().toISOString(),
        },
      ],
      status: 200,
    };
  }

  // Firewall module mocks
  async getPolicies(options?: any): Promise<FortiGateApiResponse> {
    await this.simulateDelay(300);
    return {
      success: true,
      data: this.mockPolicies,
      status: 200,
    };
  }

  async createPolicy(data: any, options?: any): Promise<FortiGateApiResponse> {
    await this.simulateDelay(800);
    
    // Simulate occasional failures (5% failure rate)
    if (Math.random() < 0.05) {
      return {
        success: false,
        error: 'Policy name already exists or invalid configuration',
        status: 400,
      };
    }

    const newPolicy = {
      policyid: this.nextId++,
      ...data,
    };
    this.mockPolicies.push(newPolicy);

    return {
      success: true,
      data: newPolicy,
      status: 200,
    };
  }

  async updatePolicy(policyId: string, data: any, options?: any): Promise<FortiGateApiResponse> {
    await this.simulateDelay(600);
    
    const index = this.mockPolicies.findIndex((p) => p.policyid === parseInt(policyId));
    if (index === -1) {
      return {
        success: false,
        error: 'Policy not found',
        status: 404,
      };
    }

    this.mockPolicies[index] = { ...this.mockPolicies[index], ...data };
    return {
      success: true,
      data: this.mockPolicies[index],
      status: 200,
    };
  }

  async deletePolicy(policyId: string, options?: any): Promise<FortiGateApiResponse> {
    await this.simulateDelay(400);
    
    const index = this.mockPolicies.findIndex((p) => p.policyid === parseInt(policyId));
    if (index === -1) {
      return {
        success: false,
        error: 'Policy not found',
        status: 404,
      };
    }

    this.mockPolicies.splice(index, 1);
    return {
      success: true,
      status: 200,
    };
  }

  async getAddresses(options?: any): Promise<FortiGateApiResponse> {
    await this.simulateDelay(300);
    return {
      success: true,
      data: this.mockAddresses,
      status: 200,
    };
  }

  async createAddress(data: any, options?: any): Promise<FortiGateApiResponse> {
    await this.simulateDelay(500);
    
    if (this.mockAddresses.find((a) => a.name === data.name)) {
      return {
        success: false,
        error: 'Address object name already exists',
        status: 400,
      };
    }

    this.mockAddresses.push(data);
    return {
      success: true,
      data: data,
      status: 200,
    };
  }

  async getCustomServices(options?: any): Promise<FortiGateApiResponse> {
    await this.simulateDelay(300);
    return {
      success: true,
      data: [
        {
          name: 'HTTPS-Custom',
          protocol: 'TCP/UDP/SCTP',
          tcp_portrange: '443',
          udp_portrange: '',
          comment: 'Custom HTTPS service',
        },
        {
          name: 'SSH-Custom',
          protocol: 'TCP/UDP/SCTP',
          tcp_portrange: '22',
          udp_portrange: '',
          comment: 'Custom SSH service',
        },
      ],
      status: 200,
    };
  }

  async getIpv4RoutingTable(options?: any): Promise<FortiGateApiResponse> {
    await this.simulateDelay(300);
    return {
      success: true,
      data: [
        {
          ip_version: 4,
          type: 'static',
          dst: '0.0.0.0/0',
          gateway: '192.168.1.1',
          interface: 'port1',
          distance: 10,
          priority: 0,
          weight: 0,
          comment: 'Default route',
        },
        {
          ip_version: 4,
          type: 'static',
          dst: '10.0.0.0/8',
          gateway: '10.0.0.1',
          interface: 'port2',
          distance: 10,
          priority: 0,
          weight: 0,
          comment: 'Internal network route',
        },
      ],
      status: 200,
    };
  }

  async getBgpStatus(options?: any): Promise<FortiGateApiResponse> {
    await this.simulateDelay(400);
    return {
      success: true,
      data: {
        as: 65001,
        router_id: '192.168.1.1',
        neighbors: [
          {
            ip: '10.0.0.2',
            remote_as: 65002,
            state: 'Established',
            uptime: 86400,
            prefixes_received: 150,
          },
        ],
      },
      status: 200,
    };
  }

  async getHaStatus(options?: any): Promise<FortiGateApiResponse> {
    await this.simulateDelay(300);
    return {
      success: true,
      data: {
        mode: 'standalone',
        group_id: 0,
        group_name: '',
        priority: 128,
        override: 'disable',
        schedule: 'none',
      },
      status: 200,
    };
  }

  async getSdwanStatus(options?: any): Promise<FortiGateApiResponse> {
    await this.simulateDelay(400);
    return {
      success: true,
      data: {
        status: 'enable',
        members: [
          {
            interface: 'port1',
            gateway: '192.168.1.1',
            status: 'up',
            sla: [
              {
                id: 1,
                latency: 25,
                jitter: 5,
                packet_loss: 0,
                status: 'pass',
              },
            ],
          },
        ],
        services: [
          {
            id: 1,
            name: 'Default',
            mode: 'auto',
            status: 'active',
          },
        ],
      },
      status: 200,
    };
  }

  async lookupRoute(destination: string, options?: any): Promise<FortiGateApiResponse> {
    await this.simulateDelay(200);
    return {
      success: true,
      data: {
        destination: destination,
        gateway: '192.168.1.1',
        interface: 'port1',
        distance: 10,
        type: 'static',
      },
      status: 200,
    };
  }

  async getPolicyAnomalies(options?: any): Promise<FortiGateApiResponse> {
    await this.simulateDelay(500);
    return {
      success: true,
      data: {
        anomalies: [
          {
            type: 'shadowed',
            policy_id: 1,
            policy_name: 'Allow Internal to DMZ',
            shadowed_by: [2],
            description: 'Policy is shadowed by policy 2',
          },
        ],
      },
      status: 200,
    };
  }

  // Utility methods
  async downloadConfigBackup(options?: any): Promise<FortiGateApiResponse> {
    await this.simulateDelay(1000);
    const mockConfig = `# FortiGate Configuration
config system global
    set hostname "${this.device.name || 'FortiGate-VM64'}"
    set timezone "America/New_York"
end

config firewall policy
    edit 1
        set name "Allow Internal to DMZ"
        set srcintf "port2"
        set dstintf "port3"
        set srcaddr "all"
        set dstaddr "all"
        set action accept
        set schedule "always"
        set service "ALL"
        set logtraffic all
    next
end
`;
    return {
      success: true,
      data: new Blob([mockConfig], { type: 'text/plain' }),
      status: 200,
    };
  }

  async getFirmwareInfo(options?: any): Promise<FortiGateApiResponse> {
    await this.simulateDelay(300);
    return {
      success: true,
      data: {
        version: '7.2.5',
        build: 1234,
        release: 'GA',
        patch: 0,
        branch: 'release',
        time: '2024-01-15 10:30:00',
      },
      status: 200,
    };
  }

  /**
   * Simulate network delay
   */
  private async simulateDelay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}


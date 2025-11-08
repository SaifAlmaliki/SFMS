/**
 * FortiGate Base API Client
 * Provides common functionality for all FortiGate API modules
 * 
 * NOTE: This file is server-only and should only be imported in server actions
 */

// Mark as server-only to prevent client-side bundling
import 'server-only';

import { Agent, fetch as undiciFetch } from 'undici';

// Create a custom dispatcher that disables SSL certificate verification
// WARNING: This should only be used for development or internal networks
const httpsAgent = new Agent({
  connect: {
    rejectUnauthorized: false,
  },
});

// Custom fetch function that uses the SSL-disabled dispatcher
// This only affects FortiGate API calls, not other fetch requests
// Node.js 18+ fetch uses undici, which requires a dispatcher instead of agent
async function fortigateFetch(url: string | URL, init?: RequestInit): Promise<Response> {
  // For server-side (Node.js), use undici fetch with custom dispatcher
  if (typeof url === 'string' && url.startsWith('https://')) {
    // Use undici fetch with custom dispatcher to disable SSL verification
    return undiciFetch(url, {
      ...init,
      dispatcher: httpsAgent,
    } as any);
  }
  // Fallback to undici fetch for non-HTTPS URLs (for consistency)
  return undiciFetch(url, init as any);
}

export interface FortiGateDevice {
  id?: string;
  name: string;
  ip: string;
  apiKey: string;
  version?: string;
  vdom?: string; // Default VDOM for this device
}

export interface FortiGateApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  status?: number;
  httpStatus?: number;
  // FortiGate response metadata
  revision?: string;
  serial?: string;
  version?: string;
  build?: number;
  vdom?: string;
}

export interface FortiGateRequestOptions {
  vdom?: string;
  scope?: 'global' | 'vdom';
  filter?: string;
  [key: string]: any; // For additional query parameters
}

/**
 * Base class for FortiGate API clients
 */
export abstract class FortiGateBaseClient {
  protected device: FortiGateDevice;
  protected baseUrl: string;
  protected defaultVdom?: string;

  constructor(device: FortiGateDevice) {
    this.device = device;
    this.baseUrl = `https://${device.ip}`;
    this.defaultVdom = device.vdom;
  }

  /**
   * Build query string from options
   */
  protected buildQueryString(options?: FortiGateRequestOptions): string {
    if (!options) return '';
    
    const params = new URLSearchParams();
    
    if (options.vdom) {
      params.append('vdom', options.vdom);
    } else if (this.defaultVdom) {
      params.append('vdom', this.defaultVdom);
    }
    
    if (options.scope) {
      params.append('scope', options.scope);
    }
    
    if (options.filter) {
      params.append('filter', options.filter);
    }
    
    // Add any additional query parameters
    Object.keys(options).forEach(key => {
      if (!['vdom', 'scope', 'filter'].includes(key) && options[key] !== undefined) {
        params.append(key, String(options[key]));
      }
    });
    
    const queryString = params.toString();
    return queryString ? `?${queryString}` : '';
  }

  /**
   * Make a GET request
   */
  protected async get<T = any>(
    endpoint: string,
    options?: FortiGateRequestOptions
  ): Promise<FortiGateApiResponse> {
    const queryString = this.buildQueryString(options);
    const url = `${this.baseUrl}${endpoint}${queryString}`;
    
    try {
      const response = await fortigateFetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.device.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json().catch(() => ({}));

      // Check FortiGate response status
      const fortigateStatus = data.status === 'success';
      const httpOk = response.ok;

      if (httpOk && fortigateStatus) {
        // Extract results - FortiGate returns data in 'results' field
        // For some endpoints (like /system/status), results is empty object {}
        // For others, results contains the actual data (object or array)
        const resultData = data.results !== undefined ? data.results : data;

        return {
          success: true,
          data: resultData,
          status: response.status,
          httpStatus: response.status,
          revision: data.revision,
          serial: data.serial,
          version: data.version,
          build: data.build,
          vdom: data.vdom,
        };
      } else {
        // Error response - FortiGate API returns errors in different formats
        // Check for error code (e.g., -3, -1, etc.)
        const errorCode = data.error || data.cli_error || data.http_status;
        let errorMessage = data.error?.message || 
                           data.message || 
                           data.cli_error ||
                           (data.status === 'error' ? (data.error || 'Unknown error') : null) ||
                           `HTTP ${response.status}: ${response.statusText}`;
        
        // If we have an error code, include it in the message
        if (errorCode !== undefined && errorCode !== null) {
          // Map common FortiGate error codes
          const errorCodeMap: Record<number | string, string> = {
            '-3': 'Invalid value or parameter',
            '-1': 'Invalid command or syntax',
            '-2': 'Object already exists',
            '-4': 'Object not found',
            '-5': 'Permission denied',
            '-6': 'Invalid operation',
          };
          
          const codeDescription = errorCodeMap[errorCode] || 'Unknown error code';
          errorMessage = `${errorMessage} (Error Code: ${errorCode} - ${codeDescription})`;
        }
        
        // Log full error details for debugging
        console.error('FortiGate API error response:', {
          url,
          httpStatus: response.status,
          errorCode,
          errorMessage,
          fullResponse: data,
        });
        
        return {
          success: false,
          error: errorMessage,
          status: response.status,
          httpStatus: response.status,
          revision: data.revision,
          serial: data.serial,
          version: data.version,
          build: data.build,
        };
      }
    } catch (error: any) {
      // Provide more detailed error messages
      let errorMessage = 'Network request failed';
      let errorDetails: any = {};
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.cause) {
        errorMessage = error.cause.message || String(error.cause);
        errorDetails.cause = error.cause;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // Capture error code and other details
      if (error.code) {
        errorDetails.code = error.code;
        errorMessage += ` (Code: ${error.code})`;
      }
      
      if (error.errno) {
        errorDetails.errno = error.errno;
      }
      
      if (error.syscall) {
        errorDetails.syscall = error.syscall;
        errorMessage += ` (Syscall: ${error.syscall})`;
      }
      
      // Check for common SSL/certificate errors
      if (errorMessage.includes('certificate') || errorMessage.includes('SSL') || errorMessage.includes('TLS') || error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' || error.code === 'CERT_HAS_EXPIRED' || error.code === 'SELF_SIGNED_CERT_IN_CHAIN') {
        errorMessage = `SSL Certificate Error: ${errorMessage}. SSL verification is disabled but the error persists.`;
      }
      
      // Check for network errors
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT' || error.code === 'EHOSTUNREACH') {
        errorMessage = `Network Error (${error.code}): ${errorMessage}. Please check the hostname and network connectivity.`;
      }
      
      // Log detailed error for debugging
      console.error('FortiGate API request failed:', {
        url,
        error: errorMessage,
        details: errorDetails,
        fullError: error,
      });
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Make a POST request
   */
  protected async post<T = any>(
    endpoint: string,
    body?: any,
    options?: FortiGateRequestOptions
  ): Promise<FortiGateApiResponse> {
    const queryString = this.buildQueryString(options);
    const url = `${this.baseUrl}${endpoint}${queryString}`;
    
    try {
      
      const response = await fortigateFetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.device.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json().catch(() => ({}));

      // Check FortiGate response status
      const fortigateStatus = data.status === 'success';
      const httpOk = response.ok;

      if (httpOk && fortigateStatus) {
        // Extract results - FortiGate returns data in 'results' field
        // For some endpoints (like /system/status), results is empty object {}
        // For others, results contains the actual data (object or array)
        const resultData = data.results !== undefined ? data.results : data;

        return {
          success: true,
          data: resultData,
          status: response.status,
          httpStatus: response.status,
          revision: data.revision,
          serial: data.serial,
          version: data.version,
          build: data.build,
          vdom: data.vdom,
        };
      } else {
        // Error response - FortiGate API returns errors in different formats
        // Check for error code (e.g., -3, -1, etc.)
        const errorCode = data.error || data.cli_error || data.http_status;
        let errorMessage = data.error?.message || 
                           data.message || 
                           data.cli_error ||
                           (data.status === 'error' ? (data.error || 'Unknown error') : null) ||
                           `HTTP ${response.status}: ${response.statusText}`;
        
        // If we have an error code, include it in the message
        if (errorCode !== undefined && errorCode !== null) {
          // Map common FortiGate error codes
          const errorCodeMap: Record<number | string, string> = {
            '-3': 'Invalid value or parameter',
            '-1': 'Invalid command or syntax',
            '-2': 'Object already exists',
            '-4': 'Object not found',
            '-5': 'Permission denied',
            '-6': 'Invalid operation',
          };
          
          const codeDescription = errorCodeMap[errorCode] || 'Unknown error code';
          errorMessage = `${errorMessage} (Error Code: ${errorCode} - ${codeDescription})`;
        }
        
        // Log full error details for debugging
        console.error('FortiGate API error response:', {
          url,
          httpStatus: response.status,
          errorCode,
          errorMessage,
          fullResponse: data,
        });
        
        return {
          success: false,
          error: errorMessage,
          status: response.status,
          httpStatus: response.status,
          revision: data.revision,
          serial: data.serial,
          version: data.version,
          build: data.build,
        };
      }
    } catch (error: any) {
      // Provide more detailed error messages
      let errorMessage = 'Network request failed';
      let errorDetails: any = {};
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.cause) {
        errorMessage = error.cause.message || String(error.cause);
        errorDetails.cause = error.cause;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // Capture error code and other details
      if (error.code) {
        errorDetails.code = error.code;
        errorMessage += ` (Code: ${error.code})`;
      }
      
      if (error.errno) {
        errorDetails.errno = error.errno;
      }
      
      if (error.syscall) {
        errorDetails.syscall = error.syscall;
        errorMessage += ` (Syscall: ${error.syscall})`;
      }
      
      // Check for common SSL/certificate errors
      if (errorMessage.includes('certificate') || errorMessage.includes('SSL') || errorMessage.includes('TLS') || error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' || error.code === 'CERT_HAS_EXPIRED' || error.code === 'SELF_SIGNED_CERT_IN_CHAIN') {
        errorMessage = `SSL Certificate Error: ${errorMessage}. SSL verification is disabled but the error persists.`;
      }
      
      // Check for network errors
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT' || error.code === 'EHOSTUNREACH') {
        errorMessage = `Network Error (${error.code}): ${errorMessage}. Please check the hostname and network connectivity.`;
      }
      
      // Log detailed error for debugging
      console.error('FortiGate API request failed:', {
        url,
        error: errorMessage,
        details: errorDetails,
        fullError: error,
      });
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Make a PUT request
   */
  protected async put<T = any>(
    endpoint: string,
    body?: any,
    options?: FortiGateRequestOptions
  ): Promise<FortiGateApiResponse> {
    const queryString = this.buildQueryString(options);
    const url = `${this.baseUrl}${endpoint}${queryString}`;
    
    try {
      
      const response = await fortigateFetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.device.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json().catch(() => ({}));

      // Check FortiGate response status
      const fortigateStatus = data.status === 'success';
      const httpOk = response.ok;

      if (httpOk && fortigateStatus) {
        // Extract results - FortiGate returns data in 'results' field
        // For some endpoints (like /system/status), results is empty object {}
        // For others, results contains the actual data (object or array)
        const resultData = data.results !== undefined ? data.results : data;

        return {
          success: true,
          data: resultData,
          status: response.status,
          httpStatus: response.status,
          revision: data.revision,
          serial: data.serial,
          version: data.version,
          build: data.build,
          vdom: data.vdom,
        };
      } else {
        // Error response - FortiGate API returns errors in different formats
        // Check for error code (e.g., -3, -1, etc.)
        const errorCode = data.error || data.cli_error || data.http_status;
        let errorMessage = data.error?.message || 
                           data.message || 
                           data.cli_error ||
                           (data.status === 'error' ? (data.error || 'Unknown error') : null) ||
                           `HTTP ${response.status}: ${response.statusText}`;
        
        // If we have an error code, include it in the message
        if (errorCode !== undefined && errorCode !== null) {
          // Map common FortiGate error codes
          const errorCodeMap: Record<number | string, string> = {
            '-3': 'Invalid value or parameter',
            '-1': 'Invalid command or syntax',
            '-2': 'Object already exists',
            '-4': 'Object not found',
            '-5': 'Permission denied',
            '-6': 'Invalid operation',
          };
          
          const codeDescription = errorCodeMap[errorCode] || 'Unknown error code';
          errorMessage = `${errorMessage} (Error Code: ${errorCode} - ${codeDescription})`;
        }
        
        // Log full error details for debugging
        console.error('FortiGate API error response:', {
          url,
          httpStatus: response.status,
          errorCode,
          errorMessage,
          fullResponse: data,
        });
        
        return {
          success: false,
          error: errorMessage,
          status: response.status,
          httpStatus: response.status,
          revision: data.revision,
          serial: data.serial,
          version: data.version,
          build: data.build,
        };
      }
    } catch (error: any) {
      // Provide more detailed error messages
      let errorMessage = 'Network request failed';
      let errorDetails: any = {};
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.cause) {
        errorMessage = error.cause.message || String(error.cause);
        errorDetails.cause = error.cause;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // Capture error code and other details
      if (error.code) {
        errorDetails.code = error.code;
        errorMessage += ` (Code: ${error.code})`;
      }
      
      if (error.errno) {
        errorDetails.errno = error.errno;
      }
      
      if (error.syscall) {
        errorDetails.syscall = error.syscall;
        errorMessage += ` (Syscall: ${error.syscall})`;
      }
      
      // Check for common SSL/certificate errors
      if (errorMessage.includes('certificate') || errorMessage.includes('SSL') || errorMessage.includes('TLS') || error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' || error.code === 'CERT_HAS_EXPIRED' || error.code === 'SELF_SIGNED_CERT_IN_CHAIN') {
        errorMessage = `SSL Certificate Error: ${errorMessage}. SSL verification is disabled but the error persists.`;
      }
      
      // Check for network errors
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT' || error.code === 'EHOSTUNREACH') {
        errorMessage = `Network Error (${error.code}): ${errorMessage}. Please check the hostname and network connectivity.`;
      }
      
      // Log detailed error for debugging
      console.error('FortiGate API request failed:', {
        url,
        error: errorMessage,
        details: errorDetails,
        fullError: error,
      });
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Make a DELETE request
   */
  protected async delete<T = any>(
    endpoint: string,
    options?: FortiGateRequestOptions
  ): Promise<FortiGateApiResponse> {
    const queryString = this.buildQueryString(options);
    const url = `${this.baseUrl}${endpoint}${queryString}`;
    
    try {
      
      const response = await fortigateFetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.device.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json().catch(() => ({}));

      // Check FortiGate response status
      const fortigateStatus = data.status === 'success';
      const httpOk = response.ok;

      if (httpOk && fortigateStatus) {
        // Extract results - FortiGate returns data in 'results' field
        // For some endpoints (like /system/status), results is empty object {}
        // For others, results contains the actual data (object or array)
        const resultData = data.results !== undefined ? data.results : data;

        return {
          success: true,
          data: resultData,
          status: response.status,
          httpStatus: response.status,
          revision: data.revision,
          serial: data.serial,
          version: data.version,
          build: data.build,
          vdom: data.vdom,
        };
      } else {
        // Error response - FortiGate API returns errors in different formats
        // Check for error code (e.g., -3, -1, etc.)
        const errorCode = data.error || data.cli_error || data.http_status;
        let errorMessage = data.error?.message || 
                           data.message || 
                           data.cli_error ||
                           (data.status === 'error' ? (data.error || 'Unknown error') : null) ||
                           `HTTP ${response.status}: ${response.statusText}`;
        
        // If we have an error code, include it in the message
        if (errorCode !== undefined && errorCode !== null) {
          // Map common FortiGate error codes
          const errorCodeMap: Record<number | string, string> = {
            '-3': 'Invalid value or parameter',
            '-1': 'Invalid command or syntax',
            '-2': 'Object already exists',
            '-4': 'Object not found',
            '-5': 'Permission denied',
            '-6': 'Invalid operation',
          };
          
          const codeDescription = errorCodeMap[errorCode] || 'Unknown error code';
          errorMessage = `${errorMessage} (Error Code: ${errorCode} - ${codeDescription})`;
        }
        
        // Log full error details for debugging
        console.error('FortiGate API error response:', {
          url,
          httpStatus: response.status,
          errorCode,
          errorMessage,
          fullResponse: data,
        });
        
        return {
          success: false,
          error: errorMessage,
          status: response.status,
          httpStatus: response.status,
          revision: data.revision,
          serial: data.serial,
          version: data.version,
          build: data.build,
        };
      }
    } catch (error: any) {
      // Provide more detailed error messages
      let errorMessage = 'Network request failed';
      let errorDetails: any = {};
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.cause) {
        errorMessage = error.cause.message || String(error.cause);
        errorDetails.cause = error.cause;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // Capture error code and other details
      if (error.code) {
        errorDetails.code = error.code;
        errorMessage += ` (Code: ${error.code})`;
      }
      
      if (error.errno) {
        errorDetails.errno = error.errno;
      }
      
      if (error.syscall) {
        errorDetails.syscall = error.syscall;
        errorMessage += ` (Syscall: ${error.syscall})`;
      }
      
      // Check for common SSL/certificate errors
      if (errorMessage.includes('certificate') || errorMessage.includes('SSL') || errorMessage.includes('TLS') || error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' || error.code === 'CERT_HAS_EXPIRED' || error.code === 'SELF_SIGNED_CERT_IN_CHAIN') {
        errorMessage = `SSL Certificate Error: ${errorMessage}. SSL verification is disabled but the error persists.`;
      }
      
      // Check for network errors
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT' || error.code === 'EHOSTUNREACH') {
        errorMessage = `Network Error (${error.code}): ${errorMessage}. Please check the hostname and network connectivity.`;
      }
      
      // Log detailed error for debugging
      console.error('FortiGate API request failed:', {
        url,
        error: errorMessage,
        details: errorDetails,
        fullError: error,
      });
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Upload file (multipart/form-data)
   */
  protected async uploadFile(
    endpoint: string,
    formData: FormData,
    options?: FortiGateRequestOptions
  ): Promise<FortiGateApiResponse> {
    const queryString = this.buildQueryString(options);
    const url = `${this.baseUrl}${endpoint}${queryString}`;
    
    try {
      
      const response = await fortigateFetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.device.apiKey}`,
          // Don't set Content-Type for FormData, browser will set it with boundary
        },
        body: formData,
      });

      const data = await response.json().catch(() => ({}));

      // Check FortiGate response status
      const fortigateStatus = data.status === 'success';
      const httpOk = response.ok;

      if (httpOk && fortigateStatus) {
        // Extract results - FortiGate returns data in 'results' field
        // For some endpoints (like /system/status), results is empty object {}
        // For others, results contains the actual data (object or array)
        const resultData = data.results !== undefined ? data.results : data;

        return {
          success: true,
          data: resultData,
          status: response.status,
          httpStatus: response.status,
          revision: data.revision,
          serial: data.serial,
          version: data.version,
          build: data.build,
          vdom: data.vdom,
        };
      } else {
        // Error response - FortiGate API returns errors in different formats
        // Check for error code (e.g., -3, -1, etc.)
        const errorCode = data.error || data.cli_error || data.http_status;
        let errorMessage = data.error?.message || 
                           data.message || 
                           data.cli_error ||
                           (data.status === 'error' ? (data.error || 'Unknown error') : null) ||
                           `HTTP ${response.status}: ${response.statusText}`;
        
        // If we have an error code, include it in the message
        if (errorCode !== undefined && errorCode !== null) {
          // Map common FortiGate error codes
          const errorCodeMap: Record<number | string, string> = {
            '-3': 'Invalid value or parameter',
            '-1': 'Invalid command or syntax',
            '-2': 'Object already exists',
            '-4': 'Object not found',
            '-5': 'Permission denied',
            '-6': 'Invalid operation',
          };
          
          const codeDescription = errorCodeMap[errorCode] || 'Unknown error code';
          errorMessage = `${errorMessage} (Error Code: ${errorCode} - ${codeDescription})`;
        }
        
        // Log full error details for debugging
        console.error('FortiGate API error response:', {
          url,
          httpStatus: response.status,
          errorCode,
          errorMessage,
          fullResponse: data,
        });
        
        return {
          success: false,
          error: errorMessage,
          status: response.status,
          httpStatus: response.status,
          revision: data.revision,
          serial: data.serial,
          version: data.version,
          build: data.build,
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'File upload failed',
      };
    }
  }

  /**
   * Download file
   */
  protected async downloadFile(
    endpoint: string,
    options?: FortiGateRequestOptions
  ): Promise<FortiGateApiResponse> {
    const queryString = this.buildQueryString(options);
    const url = `${this.baseUrl}${endpoint}${queryString}`;
    
    try {
      
      const response = await fortigateFetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.device.apiKey}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        return {
          success: true,
          data: blob,
          status: response.status,
          httpStatus: response.status,
        };
      } else {
        const data = await response.json().catch(() => ({}));
        return {
          success: false,
          error: data.error?.message || data.message || `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
          httpStatus: response.status,
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'File download failed',
      };
    }
  }

  /**
   * Test connection to FortiGate device
   * Uses /api/v2/monitor/system/status which returns runtime status
   */
  async testConnection(): Promise<FortiGateApiResponse> {
    try {
      // Try monitor endpoint first (returns runtime status)
      const monitorResponse = await this.get('/api/v2/monitor/system/status');
      
      if (monitorResponse.success) {
        return monitorResponse;
      }
      
      // Fallback to cmdb endpoint (returns metadata)
      const cmdbResponse = await this.get('/api/v2/cmdb/system/status');
      
      // For cmdb status endpoint, results is empty, so return metadata instead
      if (cmdbResponse.success && (!cmdbResponse.data || Object.keys(cmdbResponse.data).length === 0)) {
        return {
          ...cmdbResponse,
          data: {
            serial: cmdbResponse.serial,
            version: cmdbResponse.version,
            build: cmdbResponse.build,
            hostname: this.device.name,
          },
        };
      }
      
      return cmdbResponse;
    } catch (error: any) {
      return {
        success: false,
        error: `Connection test failed: ${error.message || String(error)}`,
      };
    }
  }
}


'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Shield, Network, Server } from 'lucide-react';
import { AVAILABLE_VENDORS } from '@/lib/firewall-vendors';

interface VendorSelectorProps {
  selectedVendor: string;
  onVendorChange: (vendor: string) => void;
  disabled?: boolean;
}

export function VendorSelector({ selectedVendor, onVendorChange, disabled = false }: VendorSelectorProps) {
  const getVendorIcon = (vendorId: string) => {
    switch (vendorId) {
      case 'fortigate':
        return <Shield className="h-5 w-5 text-blue-500" />;
      case 'paloalto':
        return <Network className="h-5 w-5 text-green-500" />;
      case 'cisco':
        return <Server className="h-5 w-5 text-red-500" />;
      default:
        return <Shield className="h-5 w-5 text-gray-500" />;
    }
  };

  const getVendorDescription = (vendorId: string) => {
    switch (vendorId) {
      case 'fortigate':
        return 'Fortinet FortiGate - Enterprise firewall with advanced threat protection';
      case 'paloalto':
        return 'Palo Alto Networks - Next-generation firewall with application control';
      case 'cisco':
        return 'Cisco ASA - Adaptive Security Appliance with VPN capabilities';
      default:
        return 'Generic firewall configuration';
    }
  };

  const getVendorStatus = (vendorId: string) => {
    switch (vendorId) {
      case 'fortigate':
        return { text: 'Fully Supported', color: 'bg-green-500/20 text-green-500 border-green-500/20' };
      case 'paloalto':
        return { text: 'Beta Support', color: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/20' };
      case 'cisco':
        return { text: 'Beta Support', color: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/20' };
      default:
        return { text: 'Generic', color: 'bg-gray-500/20 text-gray-500 border-gray-500/20' };
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Select Firewall Vendor</CardTitle>
        <CardDescription>
          Choose the firewall vendor for policy generation and deployment
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={selectedVendor}
          onValueChange={onVendorChange}
          disabled={disabled}
          className="space-y-4"
        >
          {AVAILABLE_VENDORS.map((vendor) => {
            const status = getVendorStatus(vendor.id);
            return (
              <div key={vendor.id} className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <RadioGroupItem value={vendor.id} id={vendor.id} />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    {getVendorIcon(vendor.id)}
                    <Label htmlFor={vendor.id} className="text-base font-medium cursor-pointer">
                      {vendor.displayName}
                    </Label>
                    <Badge variant="outline" className={status.color}>
                      {status.text}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground ml-8">
                    {getVendorDescription(vendor.id)}
                  </p>
                  <div className="ml-8 text-xs text-muted-foreground">
                    <span className="font-medium">Format:</span> {vendor.policyFormat} • 
                    <span className="font-medium ml-2">API:</span> {vendor.apiVersion} • 
                    <span className="font-medium ml-2">Auth:</span> {vendor.authType}
                  </div>
                </div>
              </div>
            );
          })}
        </RadioGroup>
        
        {selectedVendor === 'fortigate' && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
              <Shield className="h-4 w-4" />
              <span className="text-sm font-medium">FortiGate Features</span>
            </div>
            <ul className="mt-2 text-xs text-blue-700 dark:text-blue-300 space-y-1">
              <li>• REST API v2 integration</li>
              <li>• CLI configuration generation</li>
              <li>• Policy validation and deployment</li>
              <li>• Address and service object management</li>
            </ul>
          </div>
        )}
        
        {selectedVendor === 'paloalto' && (
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
              <Network className="h-4 w-4" />
              <span className="text-sm font-medium">Palo Alto (Beta)</span>
            </div>
            <p className="mt-1 text-xs text-yellow-700 dark:text-yellow-300">
              Basic policy generation supported. Full API integration coming soon.
            </p>
          </div>
        )}
        
        {selectedVendor === 'cisco' && (
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
              <Server className="h-4 w-4" />
              <span className="text-sm font-medium">Cisco ASA (Beta)</span>
            </div>
            <p className="mt-1 text-xs text-yellow-700 dark:text-yellow-300">
              Basic policy generation supported. Full API integration coming soon.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * API Route for FortiGate Interface Management
 */

import { NextRequest, NextResponse } from 'next/server';
import { FortiGateInterfaceService } from '@/lib/fortigate-interface-route-service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const deviceName = searchParams.get('device');
    const vdom = searchParams.get('vdom') || undefined;

    if (!deviceName) {
      return NextResponse.json(
        { success: false, error: 'Device name is required' },
        { status: 400 }
      );
    }

    const result = await FortiGateInterfaceService.getInterfaces(deviceName, vdom);
    
    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deviceName, config, userId } = body;

    if (!deviceName || !config || !userId) {
      return NextResponse.json(
        { success: false, error: 'deviceName, config, and userId are required' },
        { status: 400 }
      );
    }

    const result = await FortiGateInterfaceService.createInterface(deviceName, config, userId);
    
    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { deviceName, interfaceName, config, userId } = body;

    if (!deviceName || !interfaceName || !config || !userId) {
      return NextResponse.json(
        { success: false, error: 'deviceName, interfaceName, config, and userId are required' },
        { status: 400 }
      );
    }

    const result = await FortiGateInterfaceService.updateInterface(
      deviceName,
      interfaceName,
      config,
      userId
    );
    
    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const deviceName = searchParams.get('device');
    const interfaceName = searchParams.get('interface');
    const vdom = searchParams.get('vdom') || undefined;
    const userId = searchParams.get('userId');

    if (!deviceName || !interfaceName || !userId) {
      return NextResponse.json(
        { success: false, error: 'device, interface, and userId are required' },
        { status: 400 }
      );
    }

    const result = await FortiGateInterfaceService.deleteInterface(
      deviceName,
      interfaceName,
      vdom,
      userId
    );
    
    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || String(error) },
      { status: 500 }
    );
  }
}


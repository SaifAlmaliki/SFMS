/**
 * API Route for FortiGate Static Route Management
 */

import { NextRequest, NextResponse } from 'next/server';
import { FortiGateRouteService } from '@/lib/fortigate-interface-route-service';

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

    const result = await FortiGateRouteService.getStaticRoutes(deviceName, vdom);
    
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

    const result = await FortiGateRouteService.createStaticRoute(deviceName, config, userId);
    
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
    const { deviceName, seqNum, config, userId } = body;

    if (!deviceName || seqNum === undefined || !config || !userId) {
      return NextResponse.json(
        { success: false, error: 'deviceName, seqNum, config, and userId are required' },
        { status: 400 }
      );
    }

    const result = await FortiGateRouteService.updateStaticRoute(
      deviceName,
      seqNum,
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
    const seqNum = searchParams.get('seqNum');
    const vdom = searchParams.get('vdom') || undefined;
    const userId = searchParams.get('userId');

    if (!deviceName || !seqNum || !userId) {
      return NextResponse.json(
        { success: false, error: 'device, seqNum, and userId are required' },
        { status: 400 }
      );
    }

    const result = await FortiGateRouteService.deleteStaticRoute(
      deviceName,
      parseInt(seqNum, 10),
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


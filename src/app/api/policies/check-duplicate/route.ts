import { NextRequest, NextResponse } from 'next/server';
import { PolicyMatcherService } from '@/lib/policy-matcher';
import { PolicyRequestParser } from '@/lib/policy-parser';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, sourceIp, destinationIp, destinationFqdn, destinationUrl, port, targetDevice } = body;

    let parsedRequest;

    // If query is provided, parse it; otherwise use individual fields
    if (query) {
      const parseResult = PolicyRequestParser.parse(query);
      if (!parseResult.success) {
        return NextResponse.json(
          { success: false, error: parseResult.error },
          { status: 400 }
        );
      }
      parsedRequest = parseResult.data!;
    } else {
      // Validate required fields
      if (!sourceIp || !port) {
        return NextResponse.json(
          { success: false, error: 'Source IP and port are required' },
          { status: 400 }
        );
      }

      if (!destinationIp && !destinationFqdn && !destinationUrl) {
        return NextResponse.json(
          { success: false, error: 'Destination IP, FQDN, or URL is required' },
          { status: 400 }
        );
      }

      parsedRequest = {
        sourceIp,
        destinationIp,
        destinationFqdn,
        destinationUrl,
        port,
        targetDevice
      };
    }

    // Check for duplicates
    const policyMatcher = new PolicyMatcherService();
    const matchResult = await policyMatcher.findExactMatches(parsedRequest);

    return NextResponse.json({
      success: true,
      hasMatch: matchResult.hasMatch,
      matchedPolicies: matchResult.matchedPolicies,
      matchType: matchResult.matchType,
      recommendation: matchResult.recommendation,
      parsedRequest: parsedRequest
    });

  } catch (error: any) {
    console.error('Error checking for duplicate policies:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sourceIp = searchParams.get('sourceIp');
  const destinationIp = searchParams.get('destinationIp');
  const port = searchParams.get('port');
  const targetDevice = searchParams.get('targetDevice');

  if (!sourceIp || !destinationIp || !port) {
    return NextResponse.json(
      { success: false, error: 'Missing required parameters: sourceIp, destinationIp, port' },
      { status: 400 }
    );
  }

  try {
    const policyMatcher = new PolicyMatcherService();
    const matchResult = await policyMatcher.findExactMatches({
      sourceIp,
      destinationIp,
      port: parseInt(port),
      targetDevice: targetDevice || undefined
    });

    return NextResponse.json({
      success: true,
      hasMatch: matchResult.hasMatch,
      matchedPolicies: matchResult.matchedPolicies,
      matchType: matchResult.matchType,
      recommendation: matchResult.recommendation
    });

  } catch (error: any) {
    console.error('Error checking for duplicate policies:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { classifyTicket } from '@/lib/ticket-classifier';

/**
 * POST /api/tickets/classify - Classify a user query into ticket type/category
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    const classification = await classifyTicket(query);

    return NextResponse.json({ classification });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to classify ticket' },
      { status: 500 }
    );
  }
}


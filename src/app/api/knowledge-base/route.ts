import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';
import { searchKnowledgeBase } from '@/lib/knowledge-base-service';

const prisma = new PrismaClient();

/**
 * GET /api/knowledge-base - Search knowledge base
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (query) {
      const results = await searchKnowledgeBase(query, limit);
      return NextResponse.json({ results });
    }

    // Get all entries ordered by frequency
    const entries = await prisma.knowledgeBase.findMany({
      orderBy: { frequency: 'desc' },
      take: limit,
    });

    return NextResponse.json({ results: entries });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch knowledge base' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/knowledge-base - Create knowledge base entry
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, category, ticketType, keywords, solution } = body;

    if (!title || !description || !category || !ticketType) {
      return NextResponse.json(
        { error: 'Title, description, category, and ticketType are required' },
        { status: 400 }
      );
    }

    const entry = await prisma.knowledgeBase.create({
      data: {
        title,
        description,
        category,
        ticketType,
        keywords: keywords || [],
        solution,
      },
    });

    return NextResponse.json({ entry });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create knowledge base entry' },
      { status: 500 }
    );
  }
}


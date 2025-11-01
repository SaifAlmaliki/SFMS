import { NextRequest, NextResponse } from 'next/server';
import { getPolicyTemplates } from '@/lib/data';

/**
 * GET /api/templates/[id] - Get a specific template by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const templates = await getPolicyTemplates();
    const template = templates.find((t) => t.id === id);

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ template });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch template' },
      { status: 500 }
    );
  }
}


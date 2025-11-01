import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

/**
 * GET /api/tickets - Get tickets with filters
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {};

    if (type && type !== 'all') {
      where.ticketType = type;
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    if (category) {
      where.category = {
        contains: category,
        mode: 'insensitive',
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { ticketNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const tickets = await prisma.changeTicket.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        policy: true,
        comments: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    return NextResponse.json({ tickets });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tickets - Create a new ticket
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      requestedBy,
      ticketType = 'ITSupport',
      category,
      keywords = [],
      priority = 'Medium',
      isNetworkRelated = false,
    } = body;

    if (!title || !description || !requestedBy) {
      return NextResponse.json(
        { error: 'Title, description, and requestedBy are required' },
        { status: 400 }
      );
    }

    const ticketCount = await prisma.changeTicket.count();
    const ticketNumber = `TKT-${String(ticketCount + 1).padStart(6, '0')}`;

    const ticket = await prisma.changeTicket.create({
      data: {
        ticketNumber,
        title,
        description,
        requestedBy,
        status: 'PendingApproval',
        priority,
        ticketType: ticketType as any,
        category,
        keywords,
        isNetworkRelated,
      },
    });

    return NextResponse.json({ ticket });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create ticket' },
      { status: 500 }
    );
  }
}


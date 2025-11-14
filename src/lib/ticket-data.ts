import { PrismaClient } from '@/generated/prisma';
import { Prisma } from '@/generated/prisma';

const prisma = new PrismaClient();

export type TicketWithRelations = Prisma.ChangeTicketGetPayload<{
  include: {
    policy: true;
    comments: {
      orderBy: {
        createdAt: 'desc';
      };
    };
  };
}>;

export async function getTicketsByStatus(
  status: 'PendingApproval' | 'Approved' | 'Rejected',
  ticketType?: string
): Promise<TicketWithRelations[]> {
  try {
    const where: Prisma.ChangeTicketWhereInput = {
      status,
    };

    // Filter by ticket type if specified
    if (ticketType && ticketType !== 'all') {
      where.ticketType = ticketType as Prisma.TicketType;
    }

    const tickets = await prisma.changeTicket.findMany({
      where,
      include: {
        policy: true,
        comments: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return tickets;
  } catch (error) {
    console.error(`Error fetching ${status} tickets:`, error);
    return [];
  }
}

export async function getPendingTickets(ticketType?: string): Promise<TicketWithRelations[]> {
  return getTicketsByStatus('PendingApproval', ticketType);
}

export async function getApprovedTickets(ticketType?: string): Promise<TicketWithRelations[]> {
  try {
    const where: Prisma.ChangeTicketWhereInput = {
      status: {
        in: ['Approved', 'Deployed'], // Include both Approved and Deployed tickets
      },
    };

    // Filter by ticket type if specified
    if (ticketType && ticketType !== 'all') {
      where.ticketType = ticketType as Prisma.TicketType;
    }

    const tickets = await prisma.changeTicket.findMany({
      where,
      include: {
        policy: true,
        comments: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return tickets;
  } catch (error) {
    console.error('Error fetching approved tickets:', error);
    return [];
  }
}

export async function getRejectedTickets(ticketType?: string): Promise<TicketWithRelations[]> {
  return getTicketsByStatus('Rejected', ticketType);
}


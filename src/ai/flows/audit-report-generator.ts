/**
 * Audit Report Generator AI Flow
 * Generates security/compliance audit reports from natural language queries
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { PrismaClient } from '../../generated/prisma';

const prisma = new PrismaClient();

const AuditReportInputSchema = z.object({
  query: z.string().describe('Natural language query for audit report'),
  userId: z.string().describe('User ID requesting the report'),
  format: z.enum(['json', 'csv', 'pdf']).default('json').describe('Report format'),
});

export type AuditReportInput = z.infer<typeof AuditReportInputSchema>;

const AuditReportOutputSchema = z.object({
  reportType: z.string().describe('Type of report (e.g., VPN Access, Policy Changes)'),
  data: z.any().describe('Report data'),
  summary: z.string().describe('Summary of the report'),
  query: z.string().describe('Original query'),
});

export type AuditReportOutput = z.infer<typeof AuditReportOutputSchema>;

/**
 * Parse audit query to determine what to query
 */
async function parseAuditQuery(query: string): Promise<{
  reportType: string;
  filters: {
    userId?: string;
    ticketType?: string;
    category?: string;
    dateFrom?: Date;
    dateTo?: Date;
    resource?: string;
  };
}> {
  const normalized = query.toLowerCase();
  
  // Determine report type
  let reportType = 'General';
  if (normalized.includes('vpn') || normalized.includes('access')) {
    reportType = 'VPN Access';
  } else if (normalized.includes('policy') || normalized.includes('firewall')) {
    reportType = 'Policy Changes';
  } else if (normalized.includes('user') || normalized.includes('admin')) {
    reportType = 'User Activity';
  } else if (normalized.includes('ticket')) {
    reportType = 'Ticket Analysis';
  }
  
  const filters: any = {};
  
  // Extract user mentions (more flexible matching)
  const userPatterns = [
    /user\s+([A-Za-z0-9-_]+)/i,
    /by\s+([A-Za-z0-9-_]+)/i,
    /for\s+user\s+([A-Za-z0-9-_]+)/i,
    /for\s+([A-Za-z0-9-_]+)/i,
  ];
  
  for (const pattern of userPatterns) {
    const match = query.match(pattern);
    if (match && match[1] && match[1].length > 2) {
      filters.userId = match[1];
      break;
    }
  }
  
  // Extract date ranges
  if (normalized.includes('last month')) {
    const dateFrom = new Date();
    dateFrom.setMonth(dateFrom.getMonth() - 1);
    filters.dateFrom = dateFrom;
  } else if (normalized.includes('last week')) {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - 7);
    filters.dateFrom = dateFrom;
  } else if (normalized.includes('last year')) {
    const dateFrom = new Date();
    dateFrom.setFullYear(dateFrom.getFullYear() - 1);
    filters.dateFrom = dateFrom;
  }
  
  // Extract ticket type
  if (normalized.includes('vpn')) {
    filters.ticketType = 'VPN';
  } else if (normalized.includes('email') || normalized.includes('outlook')) {
    filters.ticketType = 'Email';
  } else if (normalized.includes('hardware')) {
    filters.ticketType = 'Hardware';
  } else if (normalized.includes('software')) {
    filters.ticketType = 'Software';
  }
  
  return { reportType, filters };
}

/**
 * Generate audit report
 */
export async function generateAuditReport(input: AuditReportInput): Promise<AuditReportOutput> {
  const { query, userId, format } = input;
  
  const parsed = await parseAuditQuery(query);
  const { reportType, filters } = parsed;
  
  let reportData: any = {};
  
  // Query based on report type
  switch (reportType) {
    case 'VPN Access': {
      const where: any = {
        ticketType: 'VPN',
      };
      
      if (filters.dateFrom) {
        where.createdAt = {
          gte: filters.dateFrom,
        };
      }
      
      if (filters.userId) {
        where.requestedBy = filters.userId;
      }
      
      const tickets = await prisma.changeTicket.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
      
      reportData = {
        totalTickets: tickets.length,
        tickets: tickets.map(t => ({
          id: t.id,
          ticketNumber: t.ticketNumber,
          title: t.title,
          requestedBy: t.requestedBy,
          status: t.status,
          priority: t.priority,
          createdAt: t.createdAt,
          category: t.category,
        })),
        byStatus: tickets.reduce((acc: any, t) => {
          acc[t.status] = (acc[t.status] || 0) + 1;
          return acc;
        }, {}),
      };
      break;
    }
    
    case 'Policy Changes': {
      const where: any = {};
      
      if (filters.userId) {
        where.requestedBy = filters.userId;
      }
      
      if (filters.dateFrom) {
        where.createdAt = {
          gte: filters.dateFrom,
        };
      }
      
      const policies = await prisma.policy.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
      
      const policyHistory = await prisma.policyHistory.findMany({
        where: filters.userId ? { performedBy: filters.userId } : {},
        orderBy: { performedAt: 'desc' },
        take: 100,
      });
      
      reportData = {
        totalPolicies: policies.length,
        policies: policies.map(p => ({
          id: p.id,
          name: p.name,
          source: p.source,
          destination: p.destination,
          status: p.status,
          requestedBy: p.requestedBy,
          approvedBy: p.approvedBy,
          createdAt: p.createdAt,
        })),
        history: policyHistory.map(h => ({
          policyId: h.policyId,
          action: h.action,
          performedBy: h.performedBy,
          performedAt: h.performedAt,
          comment: h.comment,
        })),
      };
      break;
    }
    
    case 'User Activity': {
      const where: any = {};
      
      if (filters.userId) {
        where.userId = filters.userId;
      }
      
      if (filters.dateFrom) {
        where.timestamp = {
          gte: filters.dateFrom,
        };
      }
      
      const auditLogs = await prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: 100,
      });
      
      reportData = {
        totalActions: auditLogs.length,
        actions: auditLogs.map(log => ({
          userId: log.userId,
          action: log.action,
          resource: log.resource,
          timestamp: log.timestamp,
          details: log.details,
        })),
        byAction: auditLogs.reduce((acc: any, log) => {
          acc[log.action] = (acc[log.action] || 0) + 1;
          return acc;
        }, {}),
      };
      break;
    }
    
    case 'Ticket Analysis': {
      const where: any = {};
      
      if (filters.ticketType) {
        where.ticketType = filters.ticketType;
      }
      
      if (filters.category) {
        where.category = filters.category;
      }
      
      if (filters.dateFrom) {
        where.createdAt = {
          gte: filters.dateFrom,
        };
      }
      
      const tickets = await prisma.changeTicket.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 200,
      });
      
      reportData = {
        totalTickets: tickets.length,
        tickets: tickets.map(t => ({
          id: t.id,
          ticketNumber: t.ticketNumber,
          title: t.title,
          type: t.ticketType || 'Unknown',
          category: t.category || 'Uncategorized',
          status: t.status,
          priority: t.priority,
          requestedBy: t.requestedBy,
          createdAt: t.createdAt,
        })),
        byType: tickets.reduce((acc: any, t) => {
          const type = t.ticketType || 'Unknown';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {}),
        byCategory: tickets.reduce((acc: any, t) => {
          if (t.category) {
            acc[t.category] = (acc[t.category] || 0) + 1;
          }
          return acc;
        }, {}),
      };
      break;
    }
    
    default: {
      // General report - combine multiple sources
      const tickets = await prisma.changeTicket.findMany({
        where: filters.dateFrom ? { createdAt: { gte: filters.dateFrom } } : {},
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      
      const auditLogs = await prisma.auditLog.findMany({
        where: filters.dateFrom ? { timestamp: { gte: filters.dateFrom } } : {},
        orderBy: { timestamp: 'desc' },
        take: 50,
      });
      
      reportData = {
        tickets: {
          total: tickets.length,
          recent: tickets.slice(0, 10),
        },
        auditLogs: {
          total: auditLogs.length,
          recent: auditLogs.slice(0, 10),
        },
      };
    }
  }
  
  // Generate summary using AI (with fallback if AI is not available)
  let summary = 'Audit report generated successfully.';
  try {
    // Define prompt only once by using a unique name or checking registry
    const promptName = `auditReportSummaryPrompt_${Date.now()}`;
    const prompt = ai.definePrompt({
      name: promptName,
      input: { schema: AuditReportInputSchema },
      output: { schema: z.object({ summary: z.string() }) },
      prompt: `Generate a concise summary of this audit report.

Report Type: ${reportType}
Query: {{{query}}}

Data: ${JSON.stringify(reportData, null, 2)}

Provide a 2-3 sentence summary highlighting key findings and statistics.`,
    });
    
    const { output } = await prompt(input);
    summary = output?.summary || summary;
  } catch (aiError: any) {
    console.warn('AI summary generation failed, using default summary:', aiError.message);
    // Generate a simple summary based on data
    if (reportData.totalTickets !== undefined) {
      summary = reportData.totalTickets === 0 
        ? `No tickets found matching your query.`
        : `Found ${reportData.totalTickets} tickets matching your query.`;
    } else if (reportData.totalPolicies !== undefined) {
      summary = reportData.totalPolicies === 0
        ? `No policies found matching your query.`
        : `Found ${reportData.totalPolicies} policies matching your query.`;
    } else if (reportData.totalActions !== undefined) {
      summary = reportData.totalActions === 0
        ? `No actions found matching your query.`
        : `Found ${reportData.totalActions} actions matching your query.`;
    } else {
      summary = `Report generated. No matching data found for the specified criteria.`;
    }
  }
  
  // Save report to database (with fallback if table doesn't exist or save fails)
  try {
    await prisma.auditReport.create({
      data: {
        query,
        reportType,
        generatedBy: userId,
        data: reportData,
        format,
      },
    });
  } catch (dbError: any) {
    console.warn('Failed to save audit report to database:', dbError.message);
    // Continue without saving - the report can still be returned
  }
  
  return {
    reportType,
    data: reportData,
    summary,
    query,
  };
}


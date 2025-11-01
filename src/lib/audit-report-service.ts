/**
 * Audit Report Service
 * Helper functions for audit report management
 */

import { PrismaClient } from '../generated/prisma';
import { generateAuditReport } from '@/ai/flows/audit-report-generator';

const prisma = new PrismaClient();

/**
 * Get all audit reports
 */
export async function getAuditReports(limit: number = 50) {
  return await prisma.auditReport.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

/**
 * Get audit report by ID
 */
export async function getAuditReportById(id: string) {
  return await prisma.auditReport.findUnique({
    where: { id },
  });
}

/**
 * Create audit report from query
 */
export async function createAuditReport(query: string, userId: string, format: 'json' | 'csv' | 'pdf' = 'json') {
  return await generateAuditReport({
    query,
    userId,
    format,
  });
}

/**
 * Export report data to CSV format
 */
export function exportToCSV(data: any): string {
  if (Array.isArray(data)) {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(item => 
      Object.values(item).map(val => 
        typeof val === 'string' && val.includes(',') ? `"${val}"` : val
      ).join(',')
    );
    
    return [headers, ...rows].join('\n');
  }
  
  return JSON.stringify(data, null, 2);
}


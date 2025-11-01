/**
 * Knowledge Base Service
 * Provides search and retrieval functions for the knowledge base
 */

import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

export interface KnowledgeBaseSearchResult {
  id: string;
  title: string;
  description: string;
  category: string;
  ticketType: string;
  keywords: string[];
  solution?: string;
  frequency: number;
  commonPatterns?: any;
  matchScore?: number;
}

/**
 * Search knowledge base by query
 */
export async function searchKnowledgeBase(
  query: string,
  limit: number = 10
): Promise<KnowledgeBaseSearchResult[]> {
  const normalizedQuery = query.toLowerCase();
  const queryWords = normalizedQuery.split(/\s+/);
  
  const allEntries = await prisma.knowledgeBase.findMany({
    take: 100, // Get more entries to score
  });
  
  // Score each entry
  const scoredEntries = allEntries.map(entry => {
    let score = 0;
    
    // Keyword matching
    entry.keywords.forEach(keyword => {
      queryWords.forEach(qw => {
        if (keyword.toLowerCase().includes(qw) || qw.includes(keyword.toLowerCase())) {
          score += 2;
        }
      });
    });
    
    // Title matching
    if (entry.title.toLowerCase().includes(normalizedQuery.substring(0, 30))) {
      score += 5;
    }
    
    // Description matching
    if (entry.description.toLowerCase().includes(normalizedQuery.substring(0, 30))) {
      score += 3;
    }
    
    // Category matching
    if (entry.category.toLowerCase().includes(normalizedQuery.substring(0, 20))) {
      score += 3;
    }
    
    // Frequency bonus
    score += Math.log(entry.frequency + 1);
    
    return {
      ...entry,
      matchScore: score,
    };
  });
  
  // Sort by score and return top results
  return scoredEntries
    .filter(e => e.matchScore! > 0)
    .sort((a, b) => b.matchScore! - a.matchScore!)
    .slice(0, limit)
    .map(({ matchScore, ...entry }) => entry);
}

/**
 * Get knowledge base entry by category and type
 */
export async function getKnowledgeBaseByCategory(
  category: string,
  ticketType: string
): Promise<KnowledgeBaseSearchResult | null> {
  const entry = await prisma.knowledgeBase.findFirst({
    where: {
      category,
      ticketType,
    },
  });
  
  return entry || null;
}

/**
 * Get most frequent knowledge base entries
 */
export async function getMostFrequentEntries(limit: number = 10): Promise<KnowledgeBaseSearchResult[]> {
  return await prisma.knowledgeBase.findMany({
    orderBy: {
      frequency: 'desc',
    },
    take: limit,
  });
}

/**
 * Update frequency when a ticket is created matching this knowledge base entry
 */
export async function incrementFrequency(knowledgeBaseId: string): Promise<void> {
  await prisma.knowledgeBase.update({
    where: { id: knowledgeBaseId },
    data: {
      frequency: {
        increment: 1,
      },
    },
  });
}


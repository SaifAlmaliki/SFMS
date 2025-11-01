/**
 * Ticket Classification Service
 * Classifies user queries into ticket types and categories using knowledge base
 */

import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

export interface TicketClassification {
  ticketType: 'FirewallPolicy' | 'ITSupport' | 'NetworkAccess' | 'Hardware' | 'Software' | 'Email' | 'VPN' | 'AdminAccess' | 'PasswordReset' | 'AccessRequest' | 'Other';
  category: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  keywords: string[];
  isNetworkRelated: boolean;
  confidence: number;
  matchedKnowledgeBase?: {
    id: string;
    title: string;
    solution?: string;
  };
}

/**
 * Extract keywords from user query
 */
function extractKeywords(query: string): string[] {
  const normalized = query.toLowerCase();
  
  // Common IT support keywords
  const commonKeywords = [
    'email', 'outlook', 'mail', 'vpn', 'access', 'install', 'software', 
    'laptop', 'keyboard', 'mouse', 'hardware', 'admin', 'password', 'reset',
    'wifi', 'internet', 'network', 'connect', 'working', 'not working',
    'slow', 'hanging', 'issue', 'problem', 'required', 'need', 'request',
    'configuration', 'setup', 'certificate', 'license', 'jira', 'confluence',
    'excel', 'teams', 'navision', 'office', 'windows', 'mac', 'mobile'
  ];
  
  const foundKeywords: string[] = [];
  commonKeywords.forEach(keyword => {
    if (normalized.includes(keyword)) {
      foundKeywords.push(keyword);
    }
  });
  
  // Also extract 2-3 word phrases
  const words = normalized.split(/\s+/);
  for (let i = 0; i < words.length - 1; i++) {
    const phrase = `${words[i]} ${words[i + 1]}`;
    if (phrase.length > 5 && phrase.length < 30) {
      foundKeywords.push(phrase);
    }
  }
  
  return Array.from(new Set(foundKeywords));
}

/**
 * Classify a user query into a ticket type and category
 */
export async function classifyTicket(query: string): Promise<TicketClassification> {
  const keywords = extractKeywords(query);
  const normalizedQuery = query.toLowerCase();
  
  // Search knowledge base for similar entries
  const knowledgeBaseEntries = await prisma.knowledgeBase.findMany({
    where: {
      OR: [
        {
          keywords: {
            hasSome: keywords.slice(0, 5), // Check first 5 keywords
          },
        },
        {
          title: {
            contains: normalizedQuery.substring(0, 50),
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: normalizedQuery.substring(0, 50),
            mode: 'insensitive',
          },
        },
      ],
    },
    orderBy: {
      frequency: 'desc',
    },
    take: 5,
  });
  
  // Calculate match scores
  const matches = knowledgeBaseEntries.map(entry => {
    let score = 0;
    
    // Keyword matching
    const entryKeywords = entry.keywords.map(k => k.toLowerCase());
    keywords.forEach(kw => {
      if (entryKeywords.some(ek => ek.includes(kw) || kw.includes(ek))) {
        score += 2;
      }
    });
    
    // Title matching
    if (normalizedQuery.includes(entry.title.toLowerCase().substring(0, 20))) {
      score += 5;
    }
    
    // Category matching
    if (normalizedQuery.includes(entry.category.toLowerCase())) {
      score += 3;
    }
    
    // Frequency bonus
    score += Math.log(entry.frequency + 1);
    
    return { entry, score };
  });
  
  // Sort by score
  matches.sort((a, b) => b.score - a.score);
  
  const bestMatch = matches[0];
  let classification: TicketClassification;
  
  if (bestMatch && bestMatch.score > 5) {
    // High confidence match
    const entry = bestMatch.entry;
    classification = {
      ticketType: entry.ticketType as any,
      category: entry.category,
      priority: determinePriority(query, entry.ticketType),
      keywords,
      isNetworkRelated: ['VPN', 'NetworkAccess'].includes(entry.ticketType),
      confidence: Math.min(bestMatch.score / 15, 1), // Normalize to 0-1
      matchedKnowledgeBase: {
        id: entry.id,
        title: entry.title,
        solution: entry.solution || undefined,
      },
    };
  } else {
    // Low confidence - use heuristics
    classification = classifyByHeuristics(query, keywords);
  }
  
  return classification;
}

/**
 * Classify using heuristics when knowledge base match is weak
 */
function classifyByHeuristics(query: string, keywords: string[]): TicketClassification {
  const normalized = query.toLowerCase();
  
  // Check for specific patterns
  if (normalized.includes('vpn') || normalized.includes('gvpn') || normalized.includes('forticlient')) {
    return {
      ticketType: 'VPN',
      category: 'VPN Setup',
      priority: normalized.includes('not working') || normalized.includes('unable') ? 'High' : 'Medium',
      keywords,
      isNetworkRelated: true,
      confidence: 0.7,
    };
  }
  
  if (normalized.includes('email') || normalized.includes('outlook') || normalized.includes('mail')) {
    return {
      ticketType: 'Email',
      category: normalized.includes('not working') ? 'Email Issue' : 'Email Configuration',
      priority: normalized.includes('not working') ? 'High' : 'Medium',
      keywords,
      isNetworkRelated: false,
      confidence: 0.7,
    };
  }
  
  if (normalized.includes('laptop') || normalized.includes('keyboard') || normalized.includes('mouse') || normalized.includes('headphone')) {
    return {
      ticketType: 'Hardware',
      category: 'Hardware Request',
      priority: normalized.includes('urgent') || normalized.includes('not working') ? 'High' : 'Low',
      keywords,
      isNetworkRelated: false,
      confidence: 0.6,
    };
  }
  
  if (normalized.includes('install') || normalized.includes('software') || normalized.includes('license')) {
    return {
      ticketType: 'Software',
      category: 'Software Installation',
      priority: 'Medium',
      keywords,
      isNetworkRelated: false,
      confidence: 0.6,
    };
  }
  
  if (normalized.includes('admin') || normalized.includes('access') || normalized.includes('rights')) {
    return {
      ticketType: 'AdminAccess',
      category: 'Access Request',
      priority: 'High',
      keywords,
      isNetworkRelated: false,
      confidence: 0.6,
    };
  }
  
  if (normalized.includes('wifi') || normalized.includes('internet') || normalized.includes('network')) {
    return {
      ticketType: 'NetworkAccess',
      category: 'Network Connectivity',
      priority: normalized.includes('not working') ? 'High' : 'Medium',
      keywords,
      isNetworkRelated: true,
      confidence: 0.6,
    };
  }
  
  // Default to IT Support
  return {
    ticketType: 'ITSupport',
    category: 'General IT Support',
    priority: 'Medium',
    keywords,
    isNetworkRelated: false,
    confidence: 0.3,
  };
}

/**
 * Determine priority based on query content and ticket type
 */
function determinePriority(query: string, ticketType: string): 'Low' | 'Medium' | 'High' | 'Critical' {
  const normalized = query.toLowerCase();
  
  // Critical keywords
  if (normalized.includes('critical') || normalized.includes('urgent') || normalized.includes('blocking')) {
    return 'Critical';
  }
  
  // High priority indicators
  if (normalized.includes('not working') || normalized.includes('unable') || 
      normalized.includes('locked') || normalized.includes('expired')) {
    return 'High';
  }
  
  // Network-related issues are typically high priority
  if (['VPN', 'NetworkAccess'].includes(ticketType)) {
    return 'High';
  }
  
  // Admin access requests are typically high priority
  if (ticketType === 'AdminAccess') {
    return 'High';
  }
  
  // Request types are typically medium
  if (normalized.includes('request') || normalized.includes('need') || normalized.includes('required')) {
    return 'Medium';
  }
  
  // Hardware requests are typically low unless urgent
  if (ticketType === 'Hardware') {
    return 'Low';
  }
  
  return 'Medium';
}

/**
 * Find similar tickets in knowledge base
 */
export async function findSimilarTickets(query: string, limit: number = 5) {
  const keywords = extractKeywords(query);
  
  return await prisma.knowledgeBase.findMany({
    where: {
      keywords: {
        hasSome: keywords.slice(0, 5),
      },
    },
    orderBy: {
      frequency: 'desc',
    },
    take: limit,
  });
}


import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PrismaClient } from '@/generated/prisma';
import { BookOpen, TrendingUp } from 'lucide-react';

const prisma = new PrismaClient();

async function getKnowledgeBaseEntries() {
  return await prisma.knowledgeBase.findMany({
    orderBy: { frequency: 'desc' },
    take: 100,
  });
}

export default async function KnowledgeBasePage() {
  const entries = await getKnowledgeBaseEntries();

  const groupedByCategory = entries.reduce((acc: any, entry) => {
    if (!acc[entry.category]) {
      acc[entry.category] = [];
    }
    acc[entry.category].push(entry);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Knowledge Base</h1>
        <p className="text-muted-foreground">
          IT support ticket patterns, categories, and solutions from historical tickets.
        </p>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{entries.length}</div>
            <p className="text-xs text-muted-foreground">
              Knowledge base entries
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(groupedByCategory).length}</div>
            <p className="text-xs text-muted-foreground">
              Unique categories
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Frequency</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {entries.reduce((sum, e) => sum + e.frequency, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total ticket occurrences
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Knowledge Base Entries by Category */}
      <div className="space-y-6">
        {Object.entries(groupedByCategory).map(([category, categoryEntries]: [string, any]) => (
          <Card key={category}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{category}</CardTitle>
                <Badge variant="outline">{categoryEntries.length} entries</Badge>
              </div>
              <CardDescription>
                {categoryEntries[0]?.ticketType} • Total frequency: {categoryEntries.reduce((sum: number, e: any) => sum + e.frequency, 0)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {categoryEntries.map((entry: any) => (
                <div key={entry.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{entry.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{entry.description}</p>
                    </div>
                    <Badge variant="secondary">
                      {entry.frequency} occurrences
                    </Badge>
                  </div>
                  
                  {entry.keywords && entry.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {entry.keywords.slice(0, 8).map((keyword: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  {entry.solution && (
                    <div className="mt-3 p-3 bg-muted rounded-md">
                      <p className="text-sm font-medium mb-1">Suggested Solution:</p>
                      <p className="text-sm text-muted-foreground">{entry.solution}</p>
                    </div>
                  )}
                  
                  {entry.commonPatterns && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      <p>Common patterns: {entry.commonPatterns.similarTitles?.length || 0} similar tickets</p>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}


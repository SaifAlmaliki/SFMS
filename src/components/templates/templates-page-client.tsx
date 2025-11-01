'use client';

import { useState, useMemo } from 'react';
import { PolicyTemplate } from '@/lib/data';
import { PolicyTemplateCard } from './policy-template-card';
import { TemplateFilters } from './template-filters';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { InfoIcon } from 'lucide-react';

interface TemplatesPageClientProps {
  templates: PolicyTemplate[];
}

export function TemplatesPageClient({ templates }: TemplatesPageClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Filter templates based on search and category
  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      const matchesSearch =
        !searchQuery ||
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === 'all' || template.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [templates, searchQuery, selectedCategory]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
  };

  const categoryCounts = useMemo(() => {
    return templates.reduce(
      (acc, template) => {
        acc[template.category] = (acc[template.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  }, [templates]);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{templates.length}</div>
            <div className="text-sm text-muted-foreground">Total Templates</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{categoryCounts.Security || 0}</div>
            <div className="text-sm text-muted-foreground">Security Templates</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{categoryCounts.Compliance || 0}</div>
            <div className="text-sm text-muted-foreground">Compliance Templates</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{categoryCounts.Operations || 0}</div>
            <div className="text-sm text-muted-foreground">Operations Templates</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <TemplateFilters
        searchQuery={searchQuery}
        category={selectedCategory}
        onSearchChange={setSearchQuery}
        onCategoryChange={setSelectedCategory}
        onReset={handleResetFilters}
      />

      {/* Results */}
      {filteredTemplates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <InfoIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Templates Found</h3>
            <p className="text-muted-foreground text-center">
              Try adjusting your search or category filter.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {filteredTemplates.length} of {templates.length} templates
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTemplates.map((template) => (
              <PolicyTemplateCard key={template.id} template={template} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}


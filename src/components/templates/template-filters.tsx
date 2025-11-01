'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PolicyTemplate } from '@/lib/data';

interface TemplateFiltersProps {
  searchQuery: string;
  category: string;
  onSearchChange: (query: string) => void;
  onCategoryChange: (category: string) => void;
  onReset: () => void;
}

export function TemplateFilters({
  searchQuery,
  category,
  onSearchChange,
  onCategoryChange,
  onReset,
}: TemplateFiltersProps) {
  const hasFilters = searchQuery || category !== 'all';

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates by name or description..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      <Select value={category} onValueChange={onCategoryChange}>
        <SelectTrigger className="w-full sm:w-[200px]">
          <SelectValue placeholder="All Categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          <SelectItem value="Security">Security</SelectItem>
          <SelectItem value="Compliance">Compliance</SelectItem>
          <SelectItem value="Operations">Operations</SelectItem>
        </SelectContent>
      </Select>
      {hasFilters && (
        <Button variant="outline" onClick={onReset}>
          <X className="mr-2 h-4 w-4" />
          Clear
        </Button>
      )}
    </div>
  );
}


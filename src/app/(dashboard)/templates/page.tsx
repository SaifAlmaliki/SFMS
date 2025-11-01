import { getPolicyTemplates, PolicyTemplate } from '@/lib/data';
import { PolicyTemplateCard } from '@/components/templates/policy-template-card';
import { TemplatesPageClient } from '@/components/templates/templates-page-client';
import { Bot, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function TemplatesPage() {
  const templates = await getPolicyTemplates();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">Policy Templates</h1>
          <p className="text-muted-foreground">
            Create consistent policies quickly by using pre-defined templates. Use templates directly or customize them with AI.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/ai-tools">
              <Bot className="mr-2 h-4 w-4" />
              AI Tools
            </Link>
          </Button>
        </div>
      </div>

      <TemplatesPageClient templates={templates} />
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { SimpleChatbot } from '@/components/dashboard/simple-chatbot';
import type { PolicyTemplate } from '@/lib/data';

interface AiToolsPageClientProps {
  templateId?: string;
  initialQuery?: string;
}

export function AiToolsPageClient({ templateId, initialQuery }: AiToolsPageClientProps) {
  const [template, setTemplate] = useState<PolicyTemplate | null>(null);
  const [query, setQuery] = useState<string | undefined>(initialQuery);

  useEffect(() => {
    if (templateId) {
      // Fetch template details from API
      fetch(`/api/templates/${templateId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.template) {
            setTemplate(data.template);
            // If no initial query, create one from template
            if (!initialQuery) {
              setQuery(
                `Using template "${data.template.name}" (${data.template.category}), help me customize this policy: ${data.template.description}`
              );
            }
          }
        })
        .catch((error) => {
          console.error('Failed to fetch template:', error);
        });
    }
  }, [templateId, initialQuery]);

  return (
    <SimpleChatbot
      initialQuery={query}
      templateId={templateId}
      templateContext={
        template
          ? {
              name: template.name,
              category: template.category,
              description: template.description,
            }
          : undefined
      }
    />
  );
}


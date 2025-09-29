import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getPolicyTemplates, PolicyTemplate } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Layers } from 'lucide-react';

const categoryStyles: Record<PolicyTemplate['category'], string> = {
    'Security': 'bg-blue-500/20 text-blue-500 border-blue-500/20',
    'Compliance': 'bg-yellow-500/20 text-yellow-500 border-yellow-500/20',
    'Operations': 'bg-purple-500/20 text-purple-500 border-purple-500/20',
};

export default async function TemplatesPage() {
  const templates = await getPolicyTemplates();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">Policy Templates</h1>
          <p className="text-muted-foreground">
            Create consistent policies quickly by using pre-defined templates.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card key={template.id}>
            <CardHeader>
                <div className='flex items-center justify-between'>
                    <CardTitle className='text-lg'>{template.name}</CardTitle>
                    <Badge variant="outline" className={categoryStyles[template.category]}>{template.category}</Badge>
                </div>
              <CardDescription>{template.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
                <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Source:</span>
                    <span className='font-mono'>{template.policy.source}</span>
                </div>
                <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Destination:</span>
                    <span className='font-mono'>{template.policy.destination}</span>
                </div>
                <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Action:</span>
                    <Badge variant={template.policy.action === 'Allow' ? 'default' : 'destructive'} className={template.policy.action === 'Allow' ? 'bg-accent text-accent-foreground' : ''}>{template.policy.action}</Badge>
                </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full">
                <Layers className="mr-2 h-4 w-4" />
                Use Template
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

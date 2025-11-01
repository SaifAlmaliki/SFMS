import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LifeBuoy, BookOpen, MessageSquare, Ticket, Bot, FileText, HelpCircle } from 'lucide-react';
import Link from 'next/link';

export default function SupportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">IT Support</h1>
        <p className="text-muted-foreground">
          Get help with IT issues, manage support tickets, and access resources.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              AI Assistant
            </CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              Chat with our AI assistant to create tickets and get help. Our AI will classify your request and create tickets automatically.
            </p>
            <Button variant="default" className="w-full" asChild>
              <Link href="/ai-tools">
                <Bot className="mr-2 h-4 w-4" />
                Open AI Chat
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">My Tickets</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              View and manage all your IT support tickets, track status, and see resolution history.
            </p>
            <Button variant="default" className="w-full" asChild>
              <Link href="/support/tickets">
                <Ticket className="mr-2 h-4 w-4" />
                View Tickets
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Knowledge Base</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              Browse common IT support solutions, patterns, and frequently asked questions.
            </p>
            <Button variant="default" className="w-full" asChild>
              <Link href="/admin/knowledge-base">
                <BookOpen className="mr-2 h-4 w-4" />
                Browse Knowledge Base
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Common IT support tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/ai-tools">
                <Bot className="mr-2 h-4 w-4" />
                Create Ticket via AI Chat
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/support/tickets">
                <Ticket className="mr-2 h-4 w-4" />
                View All Tickets
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/admin/knowledge-base">
                <BookOpen className="mr-2 h-4 w-4" />
                Search Knowledge Base
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/audit/reports">
                <FileText className="mr-2 h-4 w-4" />
                Generate Audit Reports
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LifeBuoy className="h-5 w-5" />
              Support Resources
            </CardTitle>
            <CardDescription>
              Get help and information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm">
              <p className="font-medium mb-1">Need Help?</p>
              <p className="text-muted-foreground text-xs mb-3">
                Use the AI Assistant to describe your issue in natural language. The system will automatically classify your request and create a support ticket.
              </p>
            </div>
            <div className="text-sm">
              <p className="font-medium mb-1">Ticket Types Supported</p>
              <div className="flex flex-wrap gap-1 mt-1">
                <span className="text-xs px-2 py-1 bg-secondary rounded">VPN</span>
                <span className="text-xs px-2 py-1 bg-secondary rounded">Email</span>
                <span className="text-xs px-2 py-1 bg-secondary rounded">Hardware</span>
                <span className="text-xs px-2 py-1 bg-secondary rounded">Software</span>
                <span className="text-xs px-2 py-1 bg-secondary rounded">Access</span>
                <span className="text-xs px-2 py-1 bg-secondary rounded">Network</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { chatAction } from '@/app/actions';
import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Bot, User, AlertTriangle, CheckCircle, ExternalLink, Loader2, Shield, Ban, HelpCircle, Search } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Message {
  sender: 'user' | 'bot';
  text: string;
  metadata?: {
    ticketCreated?: boolean;
    ticketId?: string;
    vendor?: string;
    cliConfig?: string;
    externalTicketCreated?: boolean;
    externalTicketId?: string;
    externalTicketUrl?: string;
    duplicateFound?: boolean;
    matchedPolicies?: any[];
    missingJustification?: boolean;
    parsedRequest?: any;
  };
}

const initialState = {
  response: '',
  error: null,
  conversationId: '',
  ticketCreated: false,
  ticketId: '',
  vendor: '',
  cliConfig: '',
  externalTicketCreated: false,
  externalTicketId: '',
  externalTicketUrl: '',
  duplicateFound: false,
  matchedPolicies: [],
  missingJustification: false,
  parsedRequest: null,
};

function SubmitButton({ isLoading }: { isLoading: boolean }) {
  const { pending } = useFormStatus();
  const isSubmitting = pending || isLoading;
  
  return (
    <Button type="submit" size="icon" disabled={isSubmitting}>
      {isSubmitting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Send />
      )}
    </Button>
  );
}

interface SimpleChatbotProps {
  initialQuery?: string;
  templateId?: string;
  templateContext?: {
    name: string;
    category: string;
    description: string;
  };
}

export function SimpleChatbot({ initialQuery, templateId, templateContext }: SimpleChatbotProps = {}) {
  const [state, formAction] = useActionState(chatAction, initialState);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState('fortigate');
  const [selectedExternalSystem, setSelectedExternalSystem] = useState('');
  const [conversationId, setConversationId] = useState('');
  const formRef = useRef<HTMLFormElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize with template context if provided
  useEffect(() => {
    if (initialQuery && messages.length === 0) {
      // Set initial query in input if provided
      if (inputRef.current) {
        inputRef.current.value = initialQuery;
      }
      
      // Optionally auto-submit if query is provided
      // You can remove this if you want user to manually submit
    }
  }, [initialQuery, messages.length]);

  useEffect(() => {
    if (state?.response) {
      setIsLoading(false);
      // Convert escaped newlines to actual newlines for proper formatting
      // Handle both \n and \r\n patterns
      const formattedResponse = state.response
        .replace(/\\r\\n/g, '\n')
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\n');
      const botMessage: Message = {
        sender: 'bot',
        text: formattedResponse,
        metadata: {
          ticketCreated: state.ticketCreated,
          ticketId: state.ticketId,
          vendor: state.vendor,
          cliConfig: state.cliConfig,
          externalTicketCreated: state.externalTicketCreated,
          externalTicketId: state.externalTicketId,
          externalTicketUrl: state.externalTicketUrl,
          duplicateFound: state.duplicateFound,
          matchedPolicies: state.matchedPolicies,
          missingJustification: state.missingJustification,
          parsedRequest: state.parsedRequest,
        }
      };
      setMessages((prev) => [...prev, botMessage]);
      
      if (state.conversationId) {
        setConversationId(state.conversationId);
      }
    }
    if (state?.error) {
      setIsLoading(false);
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: `Error: ${state.error}` },
      ]);
    }
    formRef.current?.reset();
  }, [state]);

  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector('div[data-radix-scroll-area-viewport]');
    if (viewport) {
      viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleFormSubmit = (formData: FormData) => {
    const query = formData.get('query') as string;
    if (query.trim()) {
      setMessages((prev) => [...prev, { sender: 'user', text: query }]);
      setIsLoading(true);
      
      // Add vendor and external system to form data
      formData.set('vendor', selectedVendor);
      formData.set('externalSystem', selectedExternalSystem);
      formData.set('conversationId', conversationId);
      formData.set('userId', 'user-001'); // Default user ID
      
      formAction(formData);
    }
  };

  return (
    <div className="flex flex-col h-[500px]">
      {/* Template Context Banner */}
      {templateContext && (
        <div className="p-4 border-b bg-blue-500/10 border-blue-500/20">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium">Using Template: {templateContext.name}</p>
              <p className="text-xs text-muted-foreground mt-1">{templateContext.description}</p>
            </div>
            <Badge variant="outline" className="bg-blue-500/20 text-blue-500">
              {templateContext.category}
            </Badge>
          </div>
        </div>
      )}

      {/* Vendor Selection */}
      <div className="p-4 border-b bg-background">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="text-sm font-medium">Firewall Vendor</label>
            <select 
              value={selectedVendor} 
              onChange={(e) => setSelectedVendor(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-md bg-background"
            >
              <option value="fortigate">FortiGate</option>
              <option value="paloalto">Palo Alto</option>
              <option value="cisco">Cisco</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium">External System</label>
            <select 
              value={selectedExternalSystem} 
              onChange={(e) => setSelectedExternalSystem(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-md bg-background"
            >
              <option value="">Internal Only</option>
              <option value="servicenow">ServiceNow</option>
              <option value="jira">Jira</option>
            </select>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="p-4 space-y-4">
        {messages.length === 0 && (
            <div className="flex flex-col h-[280px] items-center justify-center text-center text-muted-foreground px-4">
              <Bot className="h-12 w-12 mb-4" />
              <p className="font-medium mb-4">Ask me anything about your firewall configuration.</p>
            </div>
          )}
          {messages.map((message, index) => (
            <div key={index} className="space-y-2">
              <div
                className={cn(
                  'flex items-start gap-3',
                  message.sender === 'user' && 'justify-end'
                )}
              >
                {message.sender === 'bot' && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Bot />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn('rounded-lg p-3 text-sm max-w-[80%]',
                    message.sender === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  <div className="whitespace-pre-wrap break-words">{message.text}</div>
                </div>
                {message.sender === 'user' && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      <User />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>

              {/* Message Metadata */}
              {message.sender === 'bot' && message.metadata && (
                <div className="ml-11 space-y-2">
                  {/* Ticket Created */}
                  {message.metadata.ticketCreated && (
                    <Card className="border-green-500/30 bg-green-500/10 dark:bg-green-500/20">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-500" />
                          <span className="text-sm font-medium">Change Ticket Created</span>
                        </div>
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">Ticket ID: {message.metadata.ticketId}</p>
                        {message.metadata.externalTicketCreated && (
                          <div className="flex items-center gap-2 mt-2">
                            <ExternalLink className="h-3 w-3" />
                            <a 
                              href={message.metadata.externalTicketUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline"
                            >
                              External Ticket: {message.metadata.externalTicketId}
                            </a>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Duplicate Policy Warning */}
                  {message.metadata.duplicateFound && message.metadata.matchedPolicies && (
                    <Card className="border-amber-500/40 bg-amber-500/10 dark:bg-amber-500/20">
                      <CardHeader>
                        <CardTitle className="text-amber-700 dark:text-amber-400 text-sm">⚠️ Duplicate Policy Detected!</CardTitle>
                        <CardDescription className="text-xs text-amber-600 dark:text-amber-300">
                          An existing policy already covers the requested connection.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {message.metadata.matchedPolicies.map((policy: any) => (
                          <div key={policy.id} className="rounded-md border p-3 bg-background">
                            <h4 className="font-semibold text-sm">Policy ID: {policy.id}</h4>
                            <p className="text-xs"><strong>Source:</strong> {policy.source}</p>
                            <p className="text-xs"><strong>Destination:</strong> {policy.destination}:{policy.destPort}</p>
                            <div className="text-xs flex items-center gap-1"><strong>Status:</strong> <Badge variant="outline" className="text-xs">{policy.status}</Badge></div>
                            <p className="text-xs"><strong>Requested By:</strong> {policy.requestedBy || 'N/A'}</p>
                            <p className="text-xs"><strong>Business Justification:</strong> {policy.businessJustification || 'N/A'}</p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* Missing Justification Warning */}
                  {message.metadata.missingJustification && (
                    <Card className="border-orange-500/40 bg-orange-500/10 dark:bg-orange-500/20">
                      <CardHeader>
                        <CardTitle className="text-orange-700 dark:text-orange-400 text-sm">⚠️ Business Justification Missing</CardTitle>
                        <CardDescription className="text-xs text-orange-600 dark:text-orange-300">
                          Providing a business justification is highly recommended for policy approval.
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  )}

                  {/* CLI Configuration */}
                  {message.metadata.cliConfig && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">{message.metadata.vendor?.toUpperCase()} CLI Configuration</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <pre className="text-xs bg-secondary p-2 rounded overflow-x-auto">
                          {message.metadata.cliConfig}
                        </pre>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="rounded-lg p-3 text-sm bg-muted border border-border">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-muted-foreground animate-pulse">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          
        </div>
      </ScrollArea>
      <div className="p-4 border-t bg-background space-y-3">
        {/* Hint Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              const input = formRef.current?.querySelector('input[name="query"]') as HTMLInputElement;
              if (input) {
                input.value = "Allow 10.1.1.5 to 192.168.1.10:443 for database access";
                input.focus();
              }
            }}
            className="px-3 py-1.5 text-xs bg-secondary hover:bg-secondary/80 rounded-md border border-border transition-colors flex items-center gap-1.5"
          >
            <Shield className="h-3.5 w-3.5" />
            Create Policy
          </button>
          <button
            type="button"
            onClick={() => {
              const input = formRef.current?.querySelector('input[name="query"]') as HTMLInputElement;
              if (input) {
                input.value = "Block 192.168.1.100 from accessing 10.0.0.5 on port 80";
                input.focus();
              }
            }}
            className="px-3 py-1.5 text-xs bg-secondary hover:bg-secondary/80 rounded-md border border-border transition-colors flex items-center gap-1.5"
          >
            <Ban className="h-3.5 w-3.5" />
            Block Traffic
          </button>
          <button
            type="button"
            onClick={() => {
              const input = formRef.current?.querySelector('input[name="query"]') as HTMLInputElement;
              if (input) {
                input.value = "What are the existing policies?";
                input.focus();
              }
            }}
            className="px-3 py-1.5 text-xs bg-secondary hover:bg-secondary/80 rounded-md border border-border transition-colors flex items-center gap-1.5"
          >
            <Search className="h-3.5 w-3.5" />
            List Policies
          </button>
          <button
            type="button"
            onClick={() => {
              const input = formRef.current?.querySelector('input[name="query"]') as HTMLInputElement;
              if (input) {
                input.value = "Show me policies with status Active";
                input.focus();
              }
            }}
            className="px-3 py-1.5 text-xs bg-secondary hover:bg-secondary/80 rounded-md border border-border transition-colors flex items-center gap-1.5"
          >
            <CheckCircle className="h-3.5 w-3.5" />
            Check Status
          </button>
          <button
            type="button"
            onClick={() => {
              const input = formRef.current?.querySelector('input[name="query"]') as HTMLInputElement;
              if (input) {
                input.value = "How do I configure firewall policies?";
                input.focus();
              }
            }}
            className="px-3 py-1.5 text-xs bg-secondary hover:bg-secondary/80 rounded-md border border-border transition-colors flex items-center gap-1.5"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            Help
          </button>
        </div>
        
        <form ref={formRef} action={handleFormSubmit} className="flex gap-2">
          <Input
            ref={inputRef}
            name="query"
            placeholder={templateContext ? `Customize "${templateContext.name}" template...` : 'Try: "Allow 10.1.1.5 to 192.168.1.10:443" or "What are the existing policies?"...'}
            defaultValue={initialQuery}
            autoComplete="off"
            className="bg-card"
          />
          <SubmitButton isLoading={isLoading} />
        </form>
      </div>
    </div>
  );
}

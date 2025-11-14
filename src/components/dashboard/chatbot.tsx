'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { chatAction } from '@/app/actions';
import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Bot, User, AlertTriangle, CheckCircle, ExternalLink, Shield, Ban, HelpCircle, Search } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { VendorSelector } from '@/components/fortigate/vendor-selector';
import { DuplicatePolicyWarning } from '@/components/policies/duplicate-policy-warning';
import { JustificationWarning } from '@/components/policies/justification-warning';
import { PolicyHistoryViewer } from '@/components/policies/policy-history-viewer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

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
    ticketType?: string;
    ticketCategory?: string;
    isITSupport?: boolean;
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
  ticketType: '',
  ticketCategory: '',
  isITSupport: false,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="icon" disabled={pending}>
      <Send />
    </Button>
  );
}

export function Chatbot() {
  const [state, formAction] = useActionState(chatAction, initialState);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedVendor, setSelectedVendor] = useState('fortigate');
  const [selectedExternalSystem, setSelectedExternalSystem] = useState('');
  const [conversationId, setConversationId] = useState('');
  const formRef = useRef<HTMLFormElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state?.response) {
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
          ticketType: state.ticketType,
          ticketCategory: state.ticketCategory,
          isITSupport: state.isITSupport,
        }
      };
      setMessages((prev) => [...prev, botMessage]);
      
      if (state.conversationId) {
        setConversationId(state.conversationId);
      }
    }
    if (state?.error) {
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: state.error as string },
      ]);
    }
    formRef.current?.reset();
  }, [state]);

  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector('div[data-radix-scroll-area-viewport]');
    if (viewport) {
      viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleFormSubmit = (formData: FormData) => {
    const query = formData.get('query') as string;
    if (query.trim()) {
      setMessages((prev) => [...prev, { sender: 'user', text: query }]);
      
      // Add vendor and external system to form data
      formData.set('vendor', selectedVendor);
      formData.set('externalSystem', selectedExternalSystem);
      formData.set('conversationId', conversationId);
      formData.set('userId', 'user-001'); // Default user ID
      
      formAction(formData);
    }
  };

  const handleProceedAnyway = () => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.metadata?.parsedRequest) {
      const proceedQuery = `Proceed anyway with policy: ${lastMessage.metadata.parsedRequest.sourceIp} to ${lastMessage.metadata.parsedRequest.destinationIp || lastMessage.metadata.parsedRequest.destinationFqdn}:${lastMessage.metadata.parsedRequest.port}`;
      setMessages((prev) => [...prev, { sender: 'user', text: proceedQuery }]);
      
      const formData = new FormData();
      formData.set('query', proceedQuery);
      formData.set('vendor', selectedVendor);
      formData.set('externalSystem', selectedExternalSystem);
      formData.set('conversationId', conversationId);
      formData.set('userId', 'user-001');
      
      formAction(formData);
    }
  };

  const handleJustificationProvided = (justification: string) => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.metadata?.parsedRequest) {
      const justifiedQuery = `${lastMessage.metadata.parsedRequest.sourceIp} to ${lastMessage.metadata.parsedRequest.destinationIp || lastMessage.metadata.parsedRequest.destinationFqdn}:${lastMessage.metadata.parsedRequest.port} for ${justification}`;
      setMessages((prev) => [...prev, { sender: 'user', text: justifiedQuery }]);
      
      const formData = new FormData();
      formData.set('query', justifiedQuery);
      formData.set('vendor', selectedVendor);
      formData.set('externalSystem', selectedExternalSystem);
      formData.set('conversationId', conversationId);
      formData.set('userId', 'user-001');
      
      formAction(formData);
    }
  };

  return (
    <div className="flex flex-col h-[500px]">
      {/* Vendor Selection */}
      <div className="p-4 border-b bg-background">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <VendorSelector 
              onVendorChange={setSelectedVendor}
              defaultValue={selectedVendor}
            />
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
              
              <div className="w-full max-w-md space-y-3">
                <div className="text-left">
                  <p className="text-xs font-semibold mb-2 text-foreground">Example queries:</p>
                  
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        const exampleQuery = "Allow 10.1.1.5 to 192.168.1.10:443 for database access";
                        const formData = new FormData();
                        formData.set('query', exampleQuery);
                        formData.set('vendor', selectedVendor);
                        formData.set('externalSystem', selectedExternalSystem);
                        formData.set('conversationId', conversationId);
                        formData.set('userId', 'user-001');
                        setMessages((prev) => [...prev, { sender: 'user', text: exampleQuery }]);
                        formAction(formData);
                      }}
                      className="block w-full text-left px-3 py-2 text-xs bg-secondary hover:bg-secondary/80 rounded-md border border-border transition-colors"
                    >
                      💡 "Allow 10.1.1.5 to 192.168.1.10:443 for database access"
                    </button>
                    
                    <button
                      onClick={() => {
                        const exampleQuery = "What are the existing policies?";
                        const formData = new FormData();
                        formData.set('query', exampleQuery);
                        formData.set('vendor', selectedVendor);
                        formData.set('externalSystem', selectedExternalSystem);
                        formData.set('conversationId', conversationId);
                        formData.set('userId', 'user-001');
                        setMessages((prev) => [...prev, { sender: 'user', text: exampleQuery }]);
                        formAction(formData);
                      }}
                      className="block w-full text-left px-3 py-2 text-xs bg-secondary hover:bg-secondary/80 rounded-md border border-border transition-colors"
                    >
                      📋 "What are the existing policies?"
                    </button>
                    
                    <button
                      onClick={() => {
                        const exampleQuery = "List all configured policies";
                        const formData = new FormData();
                        formData.set('query', exampleQuery);
                        formData.set('vendor', selectedVendor);
                        formData.set('externalSystem', selectedExternalSystem);
                        formData.set('conversationId', conversationId);
                        formData.set('userId', 'user-001');
                        setMessages((prev) => [...prev, { sender: 'user', text: exampleQuery }]);
                        formAction(formData);
                      }}
                      className="block w-full text-left px-3 py-2 text-xs bg-secondary hover:bg-secondary/80 rounded-md border border-border transition-colors"
                    >
                      📊 "List all configured policies"
                    </button>
                  </div>
                </div>
              </div>
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
                          <span className="text-sm font-medium">
                            {message.metadata.isITSupport ? 'IT Support Ticket Created' : 'Change Ticket Created'}
                          </span>
                        </div>
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">Ticket ID: {message.metadata.ticketId}</p>
                        {message.metadata.isITSupport && (
                          <div className="flex gap-2 mt-2">
                            {message.metadata.ticketType && (
                              <Badge variant="outline" className="text-xs">
                                {message.metadata.ticketType}
                              </Badge>
                            )}
                            {message.metadata.ticketCategory && (
                              <Badge variant="secondary" className="text-xs">
                                {message.metadata.ticketCategory}
                              </Badge>
                            )}
                          </div>
                        )}
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
                    <DuplicatePolicyWarning
                      matchedPolicies={message.metadata.matchedPolicies}
                      onProceedAnyway={handleProceedAnyway}
                      onCancel={() => {}}
                    />
                  )}

                  {/* Missing Justification Warning */}
                  {message.metadata.missingJustification && (
                    <JustificationWarning
                      onJustificationProvided={handleJustificationProvided}
                      onProceedWithout={() => {
                        const proceedQuery = `${message.metadata.parsedRequest.sourceIp} to ${message.metadata.parsedRequest.destinationIp || message.metadata.parsedRequest.destinationFqdn}:${message.metadata.parsedRequest.port}`;
                        setMessages((prev) => [...prev, { sender: 'user', text: proceedQuery }]);
                        
                        const formData = new FormData();
                        formData.set('query', proceedQuery);
                        formData.set('vendor', selectedVendor);
                        formData.set('externalSystem', selectedExternalSystem);
                        formData.set('conversationId', conversationId);
                        formData.set('userId', 'user-001');
                        
                        formAction(formData);
                      }}
                    />
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
            name="query"
            placeholder='Try: "Allow 10.1.1.5 to 192.168.1.10:443" or "What are the existing policies?"...'
            autoComplete="off"
            className="bg-card"
          />
          <SubmitButton />
        </form>
      </div>
    </div>
  );
}

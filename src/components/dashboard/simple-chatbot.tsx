'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { chatAction } from '@/app/actions';
import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Bot, User, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';
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

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="icon" disabled={pending}>
      <Send />
    </Button>
  );
}

export function SimpleChatbot() {
  const [state, formAction] = useActionState(chatAction, initialState);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedVendor, setSelectedVendor] = useState('fortigate');
  const [selectedExternalSystem, setSelectedExternalSystem] = useState('');
  const [conversationId, setConversationId] = useState('');
  const formRef = useRef<HTMLFormElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state?.response) {
      const botMessage: Message = {
        sender: 'bot',
        text: state.response,
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

  return (
    <div className="flex flex-col h-[500px]">
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
            <div className="flex flex-col h-[280px] items-center justify-center text-center text-muted-foreground">
              <Bot className="h-12 w-12 mb-2" />
              <p>Ask me anything about your firewall configuration.</p>
              <p className="text-xs mt-2">Try: "Allow 10.1.1.5 to 192.168.1.10:443 for database access"</p>
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
                  {message.text}
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
                    <Card className="border-green-200 bg-green-50/50">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2 text-green-700">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">Change Ticket Created</span>
                        </div>
                        <p className="text-xs text-green-600 mt-1">Ticket ID: {message.metadata.ticketId}</p>
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
                    <Card className="border-yellow-500 bg-yellow-50/50">
                      <CardHeader>
                        <CardTitle className="text-yellow-700 text-sm">⚠️ Duplicate Policy Detected!</CardTitle>
                        <CardDescription className="text-xs">
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
                    <Card className="border-orange-500 bg-orange-50/50">
                      <CardHeader>
                        <CardTitle className="text-orange-700 text-sm">⚠️ Business Justification Missing</CardTitle>
                        <CardDescription className="text-xs">
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
          
        </div>
      </ScrollArea>
      <div className="p-4 border-t bg-background">
        <form ref={formRef} action={handleFormSubmit} className="flex gap-2">
          <Input
            name="query"
            placeholder="Type a message..."
            autoComplete="off"
            className="bg-card"
          />
          <SubmitButton />
        </form>
      </div>
    </div>
  );
}

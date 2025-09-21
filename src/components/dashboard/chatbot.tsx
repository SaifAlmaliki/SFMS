'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { chatAction } from '@/app/actions';
import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Bot, User } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface Message {
  sender: 'user' | 'bot';
  text: string;
}

const initialState = {
  response: '',
  error: null,
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
  const [state, formAction] = useFormState(chatAction, initialState);
  const [messages, setMessages] = useState<Message[]>([]);
  const formRef = useRef<HTMLFormElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state?.response) {
      setMessages((prev) => [...prev, { sender: 'bot', text: state.response }]);
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
      formAction(formData);
    }
  };

  return (
    <div className="flex flex-col h-[400px]">
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="p-4 space-y-4">
        {messages.length === 0 && (
            <div className="flex flex-col h-[280px] items-center justify-center text-center text-muted-foreground">
              <Bot className="h-12 w-12 mb-2" />
              <p>Ask me anything about your firewall configuration.</p>
            </div>
          )}
          {messages.map((message, index) => (
            <div
              key={index}
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

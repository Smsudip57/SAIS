import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, Send, Loader2, Bot, User as UserIcon, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { usePredictionChat } from '@/hooks/usePredictionChat';

interface ChatMessage {
  sender: 'user' | 'ai';
  message: string;
  timestamp: Date;
}

interface PredictionChatbotProps {
  symbol: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PredictionChatbot: React.FC<PredictionChatbotProps> = ({
  symbol,
  open,
  onOpenChange,
}) => {
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { isConnected, isGenerating, isThinking, startChat, sendQuestion } =
    usePredictionChat({
      symbol,
      language: i18n.language,
      onInitialPrediction: (data) => {
        setMessages([
          {
            sender: 'ai',
            message: data.message,
            timestamp: new Date(),
          },
        ]);
      },
      onResponse: (data) => {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'ai',
            message: data.response,
            timestamp: new Date(data.timestamp),
          },
        ]);
        setIsSending(false);
      },
      onError: (error) => {
        toast.error(error || t('predictionChatbot.errorSending'));
        setIsSending(false);
      },
    });

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  // Start chat when dialog opens
  useEffect(() => {
    if (open && isConnected) {
      setMessages([]);
      startChat();
    }
  }, [open, isConnected]);

  const handleSend = () => {
    if (!inputValue.trim() || isSending || isThinking) return;

    const userMessage: ChatMessage = {
      sender: 'user',
      message: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsSending(true);
    sendQuestion(inputValue);
    setInputValue('');
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t('predictionChatbot.copied'));
  };

  const handleClearHistory = () => {
    setMessages([]);
    toast.success(t('predictionChatbot.clearHistory'));
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString(i18n.language, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] h-[600px] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-purple-600" />
              {t('predictionChatbot.title')} - {symbol}
            </DialogTitle>
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearHistory}
                className="text-xs"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                {t('predictionChatbot.clearHistory')}
              </Button>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 py-4">
          <div className="space-y-4">
            {/* Loading State */}
            {isGenerating && messages.length === 0 && (
              <Card className="p-4 bg-purple-50 dark:bg-purple-900/20">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
                <p className="text-sm text-purple-600 dark:text-purple-400 mt-2">
                  {t('predictionChatbot.generating')}
                </p>
              </Card>
            )}

            {/* Messages */}
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.sender === 'ai'
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600'
                      : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                  }`}
                >
                  {msg.sender === 'ai' ? (
                    <Bot className="w-4 h-4" />
                  ) : (
                    <UserIcon className="w-4 h-4" />
                  )}
                </div>

                <div
                  className={`flex-1 ${
                    msg.sender === 'user' ? 'text-right' : 'text-left'
                  }`}
                >
                  <Card
                    className={`inline-block p-3 max-w-[85%] ${
                      msg.sender === 'ai'
                        ? 'bg-white dark:bg-gray-800'
                        : 'bg-blue-600 text-white'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {msg.message}
                    </p>
                  </Card>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                    <span>{formatTime(msg.timestamp)}</span>
                    {msg.sender === 'ai' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2"
                        onClick={() => handleCopy(msg.message)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Thinking State */}
            {isThinking && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <Card className="p-3 bg-white dark:bg-gray-800">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {t('predictionChatbot.thinking')}
                    </span>
                  </div>
                </Card>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="px-6 py-4 border-t">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2"
          >
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={t('predictionChatbot.placeholder')}
              disabled={isSending || isThinking || isGenerating}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={
                !inputValue.trim() || isSending || isThinking || isGenerating
              }
              className="px-6"
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  {t('predictionChatbot.sendButton')}
                </>
              )}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

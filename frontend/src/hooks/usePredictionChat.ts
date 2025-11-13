import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSelector } from 'react-redux';
import { RootState } from '../../Redux/store';

interface ChatMessage {
  sender: 'user' | 'ai';
  message: string;
  language: string;
  timestamp: Date;
}

interface UsePredictionChatProps {
  symbol: string;
  language: string;
  onInitialPrediction?: (data: any) => void;
  onResponse?: (data: any) => void;
  onError?: (error: string) => void;
}

export const usePredictionChat = ({
  symbol,
  language,
  onInitialPrediction,
  onResponse,
  onError,
}: UsePredictionChatProps) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const user = useSelector((state: RootState) => state.auth.user);

  // Initialize socket connection
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      console.log('🔌 Socket connected for prediction chat');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 Socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('prediction:generating', (data) => {
      console.log('🤖 Generating prediction...', data);
      setIsGenerating(true);
    });

    newSocket.on('prediction:ready', (data) => {
      console.log('✅ Prediction ready', data);
      setIsGenerating(false);
      if (onInitialPrediction) {
        onInitialPrediction(data);
      }
    });

    newSocket.on('prediction:error', (data) => {
      console.error('❌ Prediction error:', data);
      setIsGenerating(false);
      if (onError) {
        onError(data.error);
      }
    });

    newSocket.on('chat:response:start', (data) => {
      console.log('💬 AI is thinking...', data);
      setIsThinking(true);
    });

    newSocket.on('chat:response:end', (data) => {
      console.log('✅ AI response received', data);
      setIsThinking(false);
      if (onResponse) {
        onResponse(data);
      }
    });

    newSocket.on('chat:response:error', (data) => {
      console.error('❌ Chat error:', data);
      setIsThinking(false);
      if (onError) {
        onError(data.error);
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Start chat session
  const startChat = useCallback(() => {
    if (socket && isConnected && user) {
      console.log('🚀 Starting chat for', symbol);
      socket.emit('predictionChat:start', {
        symbol,
        userId: user._id,
        language,
      });
    }
  }, [socket, isConnected, symbol, language, user]);

  // Send question
  const sendQuestion = useCallback(
    (question: string) => {
      if (socket && isConnected && user) {
        console.log('📤 Sending question:', question);
        socket.emit('chat:question', {
          symbol,
          userId: user._id,
          question,
          language,
        });
      }
    },
    [socket, isConnected, symbol, language, user]
  );

  return {
    isConnected,
    isGenerating,
    isThinking,
    startChat,
    sendQuestion,
  };
};

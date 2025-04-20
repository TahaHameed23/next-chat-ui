'use client';

import { useState, useEffect, Suspense } from 'react';
import { Client, Account } from 'appwrite';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

// Initialize Appwrite client
const client = new Client()
  .setEndpoint('https://cloud.appwrite.io/v1')
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '');

const account = new Account(client);

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function ChatContent() {
  const searchParams = useSearchParams();
  const isDemoMode = searchParams.get('mode') === 'demo';

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(isDemoMode ? 'demo-user' : null);
  const [isAuthenticated, setIsAuthenticated] = useState(isDemoMode);
  const [isAuthChecking, setIsAuthChecking] = useState(!isDemoMode);

  useEffect(() => {
    if (isDemoMode) {
      setIsAuthChecking(false);
      return;
    }

    const checkAuth = async () => {
      try {
        // First try to get the current session
        const session = await account.getSession('current');
        if (session) {
          const user = await account.get();
          setUserId(user.$id);
          setIsAuthenticated(true);
          setIsAuthChecking(false);
          return;
        }
      } catch (error) {
        console.error('Session check error:', error);
      }

      // If no session found, try to get the user directly
      try {
        const user = await account.get();
        setUserId(user.$id);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Authentication error:', error);
        setIsAuthenticated(false);
        // Only redirect if we're not in demo mode
        // if (!isDemoMode) {
        //   // Redirect to dashboard with return URL
        //   const currentUrl = encodeURIComponent(window.location.href);
        //   window.location.href = `https://dash.datafloww.me/login?returnTo=${currentUrl}`;
        // }
      } finally {
        setIsAuthChecking(false);
      }
    };

    checkAuth();
  }, [isDemoMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !isAuthenticated || !userId) return;

    // Add user message
    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          user_id: userId,
          is_demo: isDemoMode,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      // Add assistant message
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.answer,
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, there was an error processing your request.',
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isDemoMode && isAuthChecking) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <div className="p-8 bg-white rounded-lg shadow-md flex flex-col items-center">
          <div className="flex space-x-2 mb-4">
            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isDemoMode && !isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <div className="p-8 bg-white rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-semibold mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-4">Please sign in the Datafloww
            <a href="https://dash.datafloww.me" className="text-blue-500 hover:underline"> dashboard </a>
            to access the chat assistant.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto p-4 flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-800">AI Assistant</h1>
          <div className="flex items-center space-x-4">
            {isDemoMode && (
              <span className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded-full">
                Demo Mode
              </span>
            )}
            <button className="text-sm text-gray-600">
              <Link className="bg-blue-500 text-white px-4 py-2 rounded-md" href={process.env.NEXT_PUBLIC_DASHBOARD_URL || ''}>
                Go to Dashboard
              </Link>
            </button>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 max-w-5xl mx-auto w-full">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-lg p-4 ${message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white shadow-sm'
                  }`}
              >
                <p className="text-base leading-relaxed">{message.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-lg p-4 bg-white shadow-sm">
                <div className="flex space-x-2">
                  <div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="max-w-5xl mx-auto">
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <input
              className="flex-1 p-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={input}
              placeholder="Type your message..."
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-5 py-3 text-base bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function Chat() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <div className="p-8 bg-white rounded-lg shadow-md flex flex-col items-center">
          <div className="flex space-x-2 mb-4">
            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <ChatContent />
    </Suspense>
  );
}

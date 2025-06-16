'use client';

import { useState, useRef, useEffect } from 'react';

export interface Message {
  text: string;
  sender: 'user' | 'bot';
  type: 'chat' | 'search';
}

interface ChatbotProps {
  onSendMessage: (message: string, history: Message[]) => Promise<any>;
  onDirectSearch?: (handles: string[]) => Promise<void>;
}

export function Chatbot({ onSendMessage, onDirectSearch }: ChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      text: "Hi! I'm your AI assistant for finding influencers. I can help you in two ways:\n\n🤖 **AI Search**: Ask me to find creators based on criteria like 'Find fashion influencers on Instagram with 10k-100k followers' or 'Show me tech YouTubers in California'\n\n📱 **Direct Handle Search**: Click the 'Search Specific Handles' button below to search exact Instagram usernames like @cristiano, @therock, etc.\n\n💡 After I show results, you can ask follow-up questions to add more results!",
      sender: 'bot',
      type: 'chat'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [manualHandles, setManualHandles] = useState('');
  const [isProcessingHandles, setIsProcessingHandles] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (input.trim() === '' || isLoading) return;

    const userMessage: Message = { text: input, sender: 'user', type: 'chat' };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      console.log('🤖 Chatbot sending message:', currentInput);
      const response = await onSendMessage(currentInput, messages);
      console.log('🤖 Chatbot received response:', response);

      if (response.type === 'chat') {
        const botMessage: Message = { text: response.data, sender: 'bot', type: 'chat' };
        setMessages((prevMessages) => [...prevMessages, botMessage]);
        console.log('💬 Added chat message to UI:', response.data);
      } else if (response.type === 'search') {
        const botMessage: Message = { 
          text: "🔍 Searching for influencers based on your criteria...", 
          sender: 'bot', 
          type: 'chat' 
        };
        setMessages((prevMessages) => [...prevMessages, botMessage]);
        console.log('🔍 Added search message to UI');
      }
    } catch (error) {
      console.error('🤖 Chatbot error:', error);
      const errorMessage: Message = { 
        text: 'Sorry, something went wrong. Please try again.', 
        sender: 'bot', 
        type: 'chat' 
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDirectSearch = async () => {
    if (!manualHandles.trim() || !onDirectSearch) return;

    setIsProcessingHandles(true);
    
    try {
      const handles = manualHandles
        .split('\n')
        .map(h => h.trim())
        .filter(h => h.length > 0)
        .map(h => h.replace('@', '').replace('https://instagram.com/', '').replace('https://www.instagram.com/', ''));

      console.log(`🔍 Processing ${handles.length} direct handles...`);
      
      // Add a message to chat showing we're processing
      const processingMessage: Message = { 
        text: `🔍 Searching for ${handles.length} Instagram profile${handles.length !== 1 ? 's' : ''}: @${handles.join(', @')}`, 
        sender: 'bot', 
        type: 'chat' 
      };
      setMessages((prevMessages) => [...prevMessages, processingMessage]);

      await onDirectSearch(handles);
      
      // Clear the input
      setManualHandles('');
      
      const successMessage: Message = { 
        text: `✅ Successfully processed ${handles.length} Instagram profile${handles.length !== 1 ? 's' : ''}! Check the results below.`, 
        sender: 'bot', 
        type: 'chat' 
      };
      setMessages((prevMessages) => [...prevMessages, successMessage]);
      
    } catch (error) {
      console.error('❌ Direct search error:', error);
      const errorMessage: Message = { 
        text: 'Sorry, there was an error processing the Instagram handles. Please try again.', 
        sender: 'bot', 
        type: 'chat' 
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setIsProcessingHandles(false);
    }
  };

  return (
    <div className="flex flex-col h-[700px] w-full max-w-4xl mx-auto bg-white rounded-lg shadow-xl mb-8">
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-t-lg">
        <h3 className="text-lg font-semibold">AI Influencer Search Assistant</h3>
        <p className="text-sm opacity-90">Powered by OpenAI GPT-3.5 🤖</p>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex mb-4 ${
              msg.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`rounded-lg px-4 py-2 max-w-[80%] ${
                msg.sender === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-800 border'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="bg-gray-100 text-gray-800 border rounded-lg px-4 py-2">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span>Thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <div className="border-t bg-gray-50 rounded-b-lg">
        {/* Manual Handle Input Section - Always visible */}
        <div className="p-4 border-b border-gray-200 bg-blue-50">
          <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            📱 Direct Instagram Handle Search
            <span className="text-xs text-gray-500 font-normal">(Search Specific Profiles)</span>
          </h4>
          <div className="space-y-3">
            <textarea
              value={manualHandles}
              onChange={(e) => setManualHandles(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
              rows={3}
              placeholder={`@cristiano\n@therock\n@taylorswift\nhttps://instagram.com/username`}
              disabled={isProcessingHandles}
            />
            <div className="flex items-center gap-2">
              <button
                onClick={handleDirectSearch}
                disabled={!manualHandles.trim() || isProcessingHandles}
                className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isProcessingHandles ? 'Searching...' : 'Search Profiles'}
              </button>
              {manualHandles.trim() && (
                <button
                  onClick={() => setManualHandles('')}
                  className="px-4 py-2 text-gray-600 text-sm hover:text-gray-800 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Chat Input */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-gray-500">💬 Or ask AI to find influencers for you:</span>
          </div>
          <div className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ask me to find influencers... (e.g., 'Find fitness influencers with 50k+ followers')"
              disabled={isLoading || isProcessingHandles}
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || isProcessingHandles || input.trim() === ''}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 
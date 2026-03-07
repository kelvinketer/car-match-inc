import { useState, useEffect, useRef } from 'react';

// Grab the base API URL (e.g., https://car-match-backend...onrender.com)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Dynamically convert http/https to ws/wss for WebSockets
const WS_BASE_URL = API_BASE_URL.replace(/^http/, 'ws');

export default function ChatUI({ roomId, currentUserId }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const ws = useRef(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll to the newest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // UPDATED: Open the WebSocket connection using the dynamic secure URL
    ws.current = new WebSocket(`${WS_BASE_URL}/ws/chat/${roomId}/`);

    ws.current.onopen = () => {
      console.log(`Connected to Car Match Secure Escrow Chat: Room ${roomId}`);
    };

    // Listen for incoming messages broadcasted by the server
    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages((prevMessages) => [...prevMessages, data]);
    };

    ws.current.onerror = (error) => {
      console.error("WebSocket Error: ", error);
    };

    // Cleanup the connection when the user leaves the page
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [roomId]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (inputMessage.trim() !== '' && ws.current.readyState === WebSocket.OPEN) {
      // Send the message to the backend via WebSocket
      ws.current.send(JSON.stringify({
        message: inputMessage,
        sender_id: currentUserId
      }));
      setInputMessage('');
    }
  };

  return (
    <div className="flex flex-col h-96 bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
      {/* Chat Header */}
      <div className="bg-brand-dark text-white px-6 py-4 flex justify-between items-center">
        <div>
          <h3 className="font-bold text-lg">Secure Negotiation</h3>
          <p className="text-xs text-brand-primary uppercase tracking-widest font-semibold">Live Escrow Chat</p>
        </div>
        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" title="Connection Secure"></div>
      </div>

      {/* Message History */}
      <div className="flex-grow p-6 overflow-y-auto bg-gray-50 flex flex-col gap-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 text-sm mt-10">
            Connection established. Start the negotiation.
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.sender_id === currentUserId;
            return (
              <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] px-4 py-2 rounded-2xl ${isMe ? 'bg-brand-primary text-white rounded-br-sm' : 'bg-gray-200 text-gray-800 rounded-bl-sm'}`}>
                  <p className="text-sm">{msg.message}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-100 flex gap-2">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-grow px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-primary text-sm"
        />
        <button 
          type="submit"
          className="bg-brand-dark hover:bg-black text-white px-6 py-3 rounded-xl font-bold transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
}
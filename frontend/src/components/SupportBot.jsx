import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

export default function SupportBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Hi! I'm your 24/7 Car Match Assistant. Have questions about our escrow or verification process?", isBot: true }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to the bottom of the chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input;
    // Add user message to UI immediately
    setMessages(prev => [...prev, { text: userText, isBot: false }]);
    setInput('');
    setIsTyping(true);

    try {
      // Send message to Django backend
      const res = await axios.post('http://localhost:8000/api/support/', {
        message: userText
      });
      
      // Simulate a slight delay so it feels like a real agent typing
      setTimeout(() => {
        setMessages(prev => [...prev, { text: res.data.reply, isBot: true }]);
        setIsTyping(false);
      }, 600);

    } catch (error) {
      console.error("Support bot error:", error);
      setIsTyping(false);
      setMessages(prev => [...prev, { text: "Sorry, our global servers are currently busy. Please try again.", isBot: true }]);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* The Chat Window */}
      {isOpen && (
        <div className="bg-white w-80 sm:w-96 rounded-2xl shadow-2xl border border-gray-200 flex flex-col mb-4 overflow-hidden h-[450px] transition-all transform origin-bottom-right">
          <div className="bg-brand-dark text-white p-4 flex justify-between items-center shadow-md z-10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-brand-primary rounded-full flex items-center justify-center text-sm">🤖</div>
              <div>
                <h3 className="font-bold text-sm">Global Support</h3>
                <p className="text-[10px] text-green-400 uppercase tracking-wider font-bold">Online 24/7</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-gray-300 hover:text-white transition-colors">
              ✕
            </button>
          </div>

          <div className="flex-grow p-4 overflow-y-auto bg-gray-50 flex flex-col gap-3">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.isBot ? 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm' : 'bg-brand-primary text-white rounded-tr-sm shadow-sm'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 text-gray-500 p-3 rounded-2xl rounded-tl-sm text-sm shadow-sm flex gap-1">
                  <span className="animate-bounce">.</span><span className="animate-bounce delay-75">.</span><span className="animate-bounce delay-150">.</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 flex gap-2">
            <input
              type="text"
              className="flex-grow px-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              placeholder="Ask a question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" className="bg-brand-dark text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-black transition-colors shadow-sm">
              ↑
            </button>
          </form>
        </div>
      )}

      {/* The Toggle Button (Always visible) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-brand-primary hover:bg-blue-700 text-white w-16 h-16 rounded-full shadow-2xl flex items-center justify-center text-3xl transition-transform transform hover:scale-110"
        >
          💬
        </button>
      )}
    </div>
  );
}
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Shield, HelpCircle, ThumbsUp, ThumbsDown, AlertCircle } from 'lucide-react';
import { fetchApi } from '../api';

export default function ChatbotWidget({ activeScreen = "search" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Namaste! I am the BIS Standards AI Assistant. How can I assist you in finding Indian Standards, checking tender compliance, or navigating normative references today?",
      sources: ["BIS Knowledge Base"],
      canEscalate: false
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [ticketStatus, setTicketStatus] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { sender: "user", text: userMsg }]);
    setLoading(true);

    try {
      const data = await fetchApi('/chatbot/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, current_screen: activeScreen })
      });
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: data.reply,
          sources: data.sources_cited,
          actions: data.suggested_actions,
          canEscalate: data.can_escalate
        }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: `I am having trouble connecting to the BIS server: ${err.message}`,
          sources: [],
          canEscalate: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (queryText) => {
    try {
      const data = await fetchApi('/chatbot/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_query: queryText,
          user_email: "procurement.officer@gov.in",
          context_screen: activeScreen
        })
      });
      setTicketStatus(data);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-500 hover:from-blue-500 hover:to-indigo-500 text-white shadow-xl shadow-blue-500/30 flex items-center justify-center transition-all hover:scale-105 ring-2 ring-white/30 cursor-pointer"
          title="Open BIS Support AI Assistant"
        >
          <Bot className="w-6 h-6 sm:w-7 sm:h-7" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="w-88 sm:w-96 max-w-[calc(100vw-2rem)] h-[490px] sm:h-[520px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">BIS Procurement Support Bot</h4>
                <div className="flex items-center space-x-1 text-[10px] text-emerald-600 dark:text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Grounded in BIS Data</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50 dark:bg-slate-900/50 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3 shadow-xs ${
                    m.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-bl-none'
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>

                  {/* Sources Cited */}
                  {m.sources && m.sources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[10px] text-slate-500 dark:text-slate-400 flex flex-wrap gap-1">
                      <span className="font-semibold text-slate-600 dark:text-slate-300">Sources:</span>
                      {m.sources.map((s, i) => (
                        <span key={i} className="bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800 font-mono">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Human Escalation Option */}
                  {m.canEscalate && !ticketStatus && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => handleCreateTicket(m.text)}
                        className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center space-x-1"
                      >
                        <AlertCircle className="w-3 h-3" />
                        <span>Escalate to BIS Helpdesk & Raise Ticket</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center space-x-2 text-slate-400 text-xs italic bg-white dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 w-fit">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce"></div>
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:0.4s]"></div>
                <span>Checking grounded guidelines...</span>
              </div>
            )}

            {ticketStatus && (
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 p-2.5 rounded-xl text-xs text-emerald-800 dark:text-emerald-300">
                Ticket created successfully: <strong>{ticketStatus.ticket_id}</strong>. A support officer will respond.
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSend} className="p-3 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask how to search, check tenders, or export..."
              className="flex-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

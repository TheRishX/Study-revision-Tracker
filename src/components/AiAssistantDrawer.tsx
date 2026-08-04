import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Bot, User, Sparkles, RefreshCw, Lightbulb } from 'lucide-react';
import { ChatMessage, VideoProject } from '../types';

interface AiAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  videos: VideoProject[];
}

export const AiAssistantDrawer: React.FC<AiAssistantDrawerProps> = ({
  isOpen,
  onClose,
  videos
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: "Hey student! I'm Study Tutor 🎓, your AI Revision Coach. Ask me how to schedule active recall for your study videos, plan spaced repetition, or summarize difficult topics for your next revision round!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || input.trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          currentProjects: videos.map(v => ({ title: v.title, subject: v.subject, revisions: v.revisionCount, status: v.status }))
        })
      });

      const data = await res.json();
      const replyText = data.text || "I'm right here to help you study and revise your video topics! What subject are we mastering today?";

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error('AI chat error:', err);
      setMessages(prev => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'assistant',
          text: "I had a temporary connection hiccup, but here's a study tip: Use the Leitner system or 24h-3d-7d revision intervals for 100% memory retention! 🧠",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const QUICK_PROMPTS = [
    "How to use spaced repetition for study videos?",
    "Tips for active recall during 2nd revision",
    "How many times should I revise before exams?",
    "Analyze my study topics list"
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end bg-amber-950/40 backdrop-blur-sm">
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="bg-white border-l-4 border-amber-950 w-full max-w-md h-full flex flex-col shadow-[-8px_0px_0px_#451a03]"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 bg-amber-100 border-b-3 border-amber-950 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-sky-300 p-2 rounded-xl border-2 border-amber-950 shadow-[2px_2px_0px_#451a03]">
                <Bot className="w-6 h-6 text-amber-950 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="font-black text-amber-950 text-lg">Sidekick AI Assistant</h3>
                <p className="text-xs font-bold text-amber-800">Gemini-powered revision advisor</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-amber-200 border-2 border-transparent hover:border-amber-950 transition-colors"
            >
              <X className="w-6 h-6 text-amber-950 stroke-[2.5]" />
            </button>
          </div>

          {/* Quick Prompt Chips */}
          <div className="p-3 bg-amber-50 border-b-2 border-amber-950/10 flex flex-wrap gap-1.5">
            {QUICK_PROMPTS.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(p)}
                className="text-[11px] font-extrabold bg-white hover:bg-amber-200 text-amber-950 px-2.5 py-1 rounded-xl border border-amber-950 shadow-[1px_1px_0px_#451a03] transition-transform active:translate-y-0.5"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Messages Thread */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-amber-50/40">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'assistant' && (
                  <div className="w-7 h-7 rounded-xl bg-sky-300 border-2 border-amber-950 flex items-center justify-center shrink-0 shadow-[1px_1px_0px_#451a03]">
                    <Bot className="w-4 h-4 text-amber-950" />
                  </div>
                )}

                <div
                  className={`max-w-[80%] rounded-2xl p-3 border-2 border-amber-950 text-xs font-semibold leading-relaxed shadow-[2px_2px_0px_#451a03] whitespace-pre-wrap ${
                    m.sender === 'user'
                      ? 'bg-amber-300 text-amber-950 rounded-tr-none'
                      : 'bg-white text-amber-950 rounded-tl-none'
                  }`}
                >
                  {m.text}
                  <div className="text-[9px] font-extrabold opacity-60 text-right mt-1">
                    {m.timestamp}
                  </div>
                </div>

                {m.sender === 'user' && (
                  <div className="w-7 h-7 rounded-xl bg-amber-400 border-2 border-amber-950 flex items-center justify-center shrink-0 shadow-[1px_1px_0px_#451a03]">
                    <User className="w-4 h-4 text-amber-950" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900 italic">
                <RefreshCw className="w-4 h-4 animate-spin text-amber-800" />
                Sidekick is thinking...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <div className="p-3 bg-white border-t-3 border-amber-950">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Sidekick AI..."
                className="flex-1 bg-amber-50 border-2 border-amber-950 rounded-xl px-3 py-2 text-xs font-bold text-amber-950 placeholder-amber-900/40 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-black p-2.5 rounded-xl border-2 border-amber-950 shadow-[2px_2px_0px_#451a03] disabled:opacity-50"
              >
                <Send className="w-4 h-4 stroke-[2.5]" />
              </button>
            </form>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};

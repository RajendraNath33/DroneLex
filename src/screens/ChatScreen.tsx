import { useEffect, useRef, useState } from 'react';
import {
  Send,
  Paperclip,
  MessageSquare,
  Plus,
  Trash2,
  X,
  FileText,
  Loader2,
  Bot,
  User as UserIcon,
  ChevronLeft,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import type { ChatThread, ChatMessage as ChatMessageType } from '@/types';

const suggestedQuestions = [
  'What are the DGCA drone categories in India?',
  'How do I get a Remote Pilot Certificate?',
  'Explain the aerodynamics of quadcopter flight',
  'What are no-fly zones for drones?',
];

// Local AI response generator (fallback)
function generateResponse(question: string): string {
  const lower = question.toLowerCase();
  if (lower.includes('dgca') || lower.includes('categor')) {
    return 'The DGCA classifies drones into three main categories in India:\n\n1. **Micro** (250g – 2kg): Operate below 200ft AGL, visual line of sight only.\n2. **Small** (2kg – 25kg): Require NPNT compliance and remote pilot license for most operations.\n3. **Medium & Large** (25kg+): Require specific approvals and operational plans.\n\nAs of the 2023 DGCA amendments, Nano drones (under 250g) can be flown without registration if operated below 50ft in a safe area. All other drones require a Unique Identification Number (UIN) and compliance with the DigitalSky platform.';
  }
  if (lower.includes('pilot') || lower.includes('license') || lower.includes('certificate')) {
    return 'To obtain a Remote Pilot Certificate (RPC) in India:\n\n1. **Be at least 18 years old** and have passed Class 10.\n2. **Complete training** at a DGCA-approved Remote Pilot Training Organization (RPTO).\n3. **Pass the theoretical exam** covering air regulations, meteorology, and navigation.\n4. **Complete practical flight training** (minimum hours as per RPAS category).\n5. **Obtain medical fitness** (Class 2 medical assessment).\n\nThe RPC is valid for 5 years (for small category) or 10 years (for medium), renewable with refresher training.';
  }
  if (lower.includes('aerodynamic') || lower.includes('quadcopter') || lower.includes('flight')) {
    return 'Quadcopter flight dynamics rely on four key principles:\n\n1. **Thrust**: Each motor generates thrust through propeller rotation. Total thrust must exceed weight for takeoff.\n2. **Yaw Control**: Achieved by adjusting the relative speeds of CW and CCW rotating motors.\n3. **Pitch & Roll**: Achieved by reducing speed on motors in one direction while increasing on the opposite side.\n4. **Stability**: The flight controller uses PID loops with IMU sensor data to adjust motor speeds 400-1000 times per second.\n\nThe mathematical model involves 6 DOF (degrees of freedom) — 3 translational and 3 rotational.';
  }
  if (lower.includes('no-fly') || lower.includes('restricted') || lower.includes('airspace')) {
    return 'India designates the following no-fly zones for drones:\n\n**Red Zones** (Permission required from central govt):\n• Military installations\n• Strategic locations\n• 5km radius of major airports\n\n**Yellow Zones** (Permission from local ATC):\n• Controlled airspace\n• 5-25km from airports (altitude restricted)\n\n**Green Zones** (No permission needed up to 400ft):\n• Most of India\'s airspace\n• Rural areas with no strategic installations\n\nThe DigitalSky platform provides real-time zone maps. Always check before every flight.';
  }
  return `That's a great question about "${question}". Here's what I can share:\n\nThis is a demo response from the DroneLex AI Assistant. In production, this would connect to an AI API (like OpenAI or a specialized aviation model) to provide detailed, context-aware answers about drone piloting, aircraft design, and DGCA regulations.\n\nYou can also upload PDF documents (DGCA circulars, training manuals, etc.) for context-aware responses.`;
}

// Function to call the n8n Webhook
async function callWebhookAI(question: string): Promise<string> {
  const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL as string;
  if (!webhookUrl) {
    return generateResponse(question);
  }
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: question, question }),
    });
    if (!res.ok) throw new Error(`Webhook error: ${res.status}`);
    const data = await res.json();
    const reply =
      data?.output ??
      data?.reply ??
      data?.response ??
      data?.answer ??
      data?.message ??
      (typeof data === 'string' ? data : null);
    if (!reply) throw new Error('Empty response from webhook');
    return reply as string;
  } catch (err) {
    console.error('AI webhook failed, falling back to demo response', err);
    return generateResponse(question);
  }
}

export default function ChatScreen() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [showThreads, setShowThreads] = useState(false);
  const [attachment, setAttachment] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('chat_threads')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      setThreads(data as ChatThread[] || []);
      if (data && data.length > 0) {
        setCurrentThreadId(data[0].id);
      }
    })();
  }, [user]);

  useEffect(() => {
    if (!currentThreadId || !user) return;
    (async () => {
      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('thread_id', currentThreadId)
        .order('created_at', { ascending: true });
      setMessages(data as ChatMessageType[] || []);
    })();
  }, [currentThreadId, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const createNewThread = async (): Promise<string> => {
    const { data, error } = await supabase
      .from('chat_threads')
      .insert({ user_id: user!.id, title: 'New Conversation' })
      .select()
      .single();
    if (error || !data) throw error;
    const newThread = data as ChatThread;
    setThreads((prev) => [newThread, ...prev]);
    setCurrentThreadId(newThread.id);
    return newThread.id;
  };

  const deleteThread = async (threadId: string) => {
    await supabase.from('chat_threads').delete().eq('id', threadId);
    setThreads((prev) => prev.filter((t) => t.id !== threadId));
    if (currentThreadId === threadId) {
      const remaining = threads.filter((t) => t.id !== threadId);
      setCurrentThreadId(remaining.length > 0 ? remaining[0].id : null);
      setMessages([]);
    }
  };

  const handleSend = async (text?: string) => {
    const content = (text || input).trim();
    if (!content || sending || !user) return;

    setSending(true);
    setInput('');

    let threadId = currentThreadId;
    if (!threadId) {
      try {
        threadId = await createNewThread();
      } catch {
        setSending(false);
        return;
      }
    }

    // Save user message
    const { data: userMsg } = await supabase
      .from('chat_messages')
      .insert({
        thread_id: threadId,
        user_id: user.id,
        role: 'user',
        content,
        attachment_name: attachment,
      })
      .select()
      .single();

    if (userMsg) {
      setMessages((prev) => [...prev, userMsg as ChatMessageType]);
    }

    // Update thread title if first message
    if (threads.find((t) => t.id === threadId)?.title === 'New Conversation') {
      const title = content.slice(0, 40) + (content.length > 40 ? '...' : '');
      await supabase.from('chat_threads').update({ title, updated_at: new Date().toISOString() }).eq('id', threadId);
      setThreads((prev) => prev.map((t) => (t.id === threadId ? { ...t, title } : t)));
    }

    setAttachment(null);

    // Call n8n Webhook AI response
    const response = await callWebhookAI(content);

    const { data: aiMsg } = await supabase
      .from('chat_messages')
      .insert({
        thread_id: threadId,
        user_id: user.id,
        role: 'assistant',
        content: response,
      })
      .select()
      .single();

    if (aiMsg) {
      setMessages((prev) => [...prev, aiMsg as ChatMessageType]);
    }

    await supabase.from('chat_threads').update({ updated_at: new Date().toISOString() }).eq('id', threadId);
    setSending(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachment(file.name);
    }
  };

  const formatMessage = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return (
          <p key={i} className="font-bold text-white">
            {line.slice(2, -2)}
          </p>
        );
      }
      const boldParts = line.split(/(\*\*[^*]+\*\*)/);
      return (
        <p key={i} className={line.trim() === '' ? 'h-2' : ''}>
          {boldParts.map((part, j) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <span key={j} className="font-semibold text-white">{part.slice(2, -2)}</span>;
            }
            return <span key={j}>{part}</span>;
          })}
        </p>
      );
    });
  };

  return (
    <div className="flex h-full flex-col bg-slate-950">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 bg-slate-900/80 px-4 pt-12 pb-3 backdrop-blur">
        <div className="flex items-center gap-3">
          {showThreads && (
            <button onClick={() => setShowThreads(false)} className="text-slate-400">
              <ChevronLeft size={20} />
            </button>
          )}
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500">
            <Bot size={18} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">AI Assistant</p>
            <p className="text-[10px] text-sky-400">Online · DGCA & Aviation Expert</p>
          </div>
        </div>
        <button
          onClick={() => setShowThreads(!showThreads)}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-slate-400 transition-colors hover:text-sky-300"
        >
          <MessageSquare size={18} />
        </button>
      </div>

      {/* Thread list sidebar */}
      {showThreads && (
        <div className="absolute inset-0 z-40 bg-slate-950/95 pt-20 backdrop-blur">
          <div className="px-4 pt-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-white">Conversations</h2>
              <button
                onClick={() => {
                  createNewThread();
                  setShowThreads(false);
                  setMessages([]);
                }}
                className="flex items-center gap-1.5 rounded-lg bg-sky-500/20 px-3 py-1.5 text-xs font-medium text-sky-300"
              >
                <Plus size={14} /> New
              </button>
            </div>
            <div className="space-y-2">
              {threads.length === 0 && (
                <p className="text-center text-sm text-slate-500 py-8">No conversations yet</p>
              )}
              {threads.map((thread) => (
                <div
                  key={thread.id}
                  className={`group flex items-center gap-3 rounded-xl border p-3 transition-all cursor-pointer ${
                    thread.id === currentThreadId
                      ? 'border-sky-500/30 bg-sky-500/10'
                      : 'border-white/5 bg-slate-900/60 hover:border-white/10'
                  }`}
                  onClick={() => {
                    setCurrentThreadId(thread.id);
                    setShowThreads(false);
                  }}
                >
                  <MessageSquare size={16} className="flex-shrink-0 text-slate-500" />
                  <p className="flex-1 truncate text-sm text-slate-300">{thread.title}</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteThread(thread.id);
                    }}
                    className="opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <Trash2 size={14} className="text-rose-400" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto thin-scrollbar px-4 py-4 pb-2">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-4">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-sky-500 to-cyan-500 shadow-xl shadow-sky-500/20 animate-float">
              <Bot size={40} className="text-white" />
            </div>
            <h2 className="font-display mb-2 text-lg font-bold text-white">How can I help you?</h2>
            <p className="mb-6 text-center text-xs text-slate-400">
              Ask about drone piloting, aircraft design, or DGCA regulations
            </p>
            <div className="w-full space-y-2">
              {suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(q)}
                  className="flex w-full items-center gap-3 rounded-xl border border-white/5 bg-slate-900/60 p-3 text-left text-sm text-slate-300 transition-all hover:border-sky-500/20 hover:bg-slate-800/60 animate-fade-in-up"
                  style={{ animationDelay: `${i * 0.08}s` }}
                >
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-sky-500/10">
                    <MessageSquare size={14} className="text-sky-400" />
                  </div>
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 animate-fade-in-up ${
                  msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
                style={{ animationDelay: `${Math.min(i * 0.03, 0.3)}s` }}
              >
                <div
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-slate-700'
                      : 'bg-gradient-to-br from-sky-500 to-cyan-500'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <UserIcon size={16} className="text-slate-300" />
                  ) : (
                    <Bot size={16} className="text-white" />
                  )}
                </div>
                <div
                  className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-sky-600 to-sky-700 text-white rounded-tr-sm'
                      : 'border border-white/5 bg-slate-900 text-slate-200 rounded-tl-sm'
                  }`}
                >
                  {msg.attachment_name && (
                    <div className="mb-2 flex items-center gap-2 rounded-lg bg-black/20 px-2.5 py-1.5">
                      <FileText size={14} className="text-sky-300" />
                      <span className="text-xs text-sky-200">{msg.attachment_name}</span>
                    </div>
                  )}
                  <div className="space-y-1">{formatMessage(msg.content)}</div>
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex gap-2.5">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-cyan-500">
                  <Bot size={16} className="text-white" />
                </div>
                <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm border border-white/5 bg-slate-900 px-4 py-4">
                  <span className="typing-dot h-2 w-2 rounded-full bg-sky-400" style={{ animationDelay: '0s' }} />
                  <span className="typing-dot h-2 w-2 rounded-full bg-sky-400" style={{ animationDelay: '0.2s' }} />
                  <span className="typing-dot h-2 w-2 rounded-full bg-sky-400" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Attachment preview */}
      {attachment && (
        <div className="mx-4 mb-2 flex items-center gap-2 rounded-xl border border-sky-500/20 bg-sky-500/10 px-3 py-2 animate-fade-in">
          <FileText size={16} className="text-sky-400" />
          <span className="flex-1 truncate text-xs text-sky-300">{attachment}</span>
          <button onClick={() => setAttachment(null)}>
            <X size={16} className="text-slate-400" />
          </button>
        </div>
      )}

      {/* Input bar */}
      <div className="border-t border-white/5 bg-slate-900/80 px-4 py-3 pb-5 backdrop-blur">
        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-slate-800 text-slate-400 transition-colors hover:text-sky-300"
          >
            <Paperclip size={18} />
          </button>
          <div className="flex-1 rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-2.5">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              rows={1}
              placeholder="Ask about drones, aviation, or DGCA rules..."
              className="w-full resize-none bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
              style={{ maxHeight: '100px' }}
            />
          </div>
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || sending}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 text-white shadow-lg shadow-sky-500/20 transition-all disabled:opacity-40"
          >
            {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}
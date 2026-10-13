import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PriorixApi } from '../services/api';
import { ChatMessage, TicketDraft, CATEGORIES } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  Send,
  User,
  Bot,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  HelpCircle,
  Tag,
  Clock,
  ShieldCheck,
  FileText,
  CornerDownLeft
} from 'lucide-react';

const SUGGESTED_PROMPTS = [
  "I can't log in to my account",
  "Payment was not processed",
  "The app keeps crashing",
  "I need to upgrade my plan"
];

export const AiTriageChatPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'I can help you analyze your issue and suggest the best category, priority and more. What happened?'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [draft, setDraft] = useState<TicketDraft | null>(null);
  const [isReadyForReview, setIsReadyForReview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await PriorixApi.aiTriageChat({
        messages: newMessages,
        current_draft: draft
      });

      if (response) {
        setMessages([...newMessages, { role: 'assistant', content: response.message }]);
        if (response.suggested_ticket) {
          setDraft(response.suggested_ticket);
        }
        setIsReadyForReview(response.is_ready_for_review);
      }
    } catch (err) {
      console.error('AI Triage Chat Error:', err);
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: 'I encountered an error connecting to the triage engine. You can continue describing your issue or create a ticket directly.'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmAndCreate = async () => {
    if (!draft || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const created = await PriorixApi.createTicket({
        title: draft.title || 'Support Request via AI Triage',
        description: draft.description || messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n'),
        summary: draft.title || undefined,
        category: draft.category || 'Technical Issue',
        urgency: draft.suggested_urgency || 'Medium',
        impact: draft.suggested_impact || 'Medium',
        customer_name: user?.display_name || 'Sarah Johnson',
        customer_email: user?.email || 'customer@priorix.local'
      });

      if (created) {
        setShowConfirmModal(false);
        navigate(`/tickets/${created.id}`);
      }
    } catch (err) {
      console.error('Failed to create ticket from AI draft:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1300px] mx-auto pb-12">
      {/* Header matching reference mockup */}
      <div>
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-bold mb-2">
          <Sparkles className="w-3.5 h-3.5 text-purple-600" />
          <span>Intelligent Conversational Triage</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">AI Chat Triage</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Describe your issue and let AI help you create the perfect ticket.
        </p>
      </div>

      {/* Main Grid: Left Chat Panel, Right Draft Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chat Window (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col h-[600px] overflow-hidden">
          {/* Chat Messages Body */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex items-start space-x-3 ${
                  m.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {m.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`p-4 rounded-2xl text-xs leading-relaxed max-w-lg ${
                    m.role === 'user'
                      ? 'bg-purple-600 text-white rounded-tr-none'
                      : 'bg-slate-50 text-slate-800 border border-slate-200/80 rounded-tl-none'
                  }`}
                >
                  {m.content}
                </div>

                {m.role === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs animate-pulse">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-500 flex items-center space-x-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-600" />
                  <span>AI assistant is analyzing details...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Pills matching reference mockup */}
          <div className="px-6 py-2 border-t border-slate-100 bg-slate-50/50">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Try these examples:
            </div>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSendMessage(prompt)}
                  disabled={isLoading}
                  className="px-3 py-1 bg-white hover:bg-purple-50 text-slate-700 hover:text-purple-700 text-[11px] font-medium rounded-full border border-slate-200 hover:border-purple-200 transition-colors shadow-2xs"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-4 border-t border-slate-200 flex items-center gap-2 bg-white"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type your issue here..."
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:bg-white"
            />
            <button
              type="submit"
              disabled={isLoading || !inputText.trim()}
              className="p-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl shadow-xs transition-transform active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Live Ticket Draft Preview (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs pb-3 border-b border-slate-100">
              <FileText className="w-4 h-4 text-purple-600" />
              <span>Real-Time Ticket Draft</span>
            </div>

            {draft ? (
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[11px] text-slate-400 block font-semibold">Summary</span>
                  <div className="font-bold text-slate-900 mt-0.5">{draft.title}</div>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 block font-semibold">Suggested Category</span>
                  <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700 text-xs">
                    {draft.category || 'Technical Issue'}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 block font-semibold">Suggested Urgency</span>
                  <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-full font-bold bg-amber-50 text-amber-700 text-xs">
                    {draft.suggested_urgency || 'High'}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 block font-semibold">Description</span>
                  <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100 max-h-32 overflow-y-auto">
                    {draft.description}
                  </p>
                </div>

                <button
                  onClick={() => setShowConfirmModal(true)}
                  className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Review & Submit Ticket</span>
                </button>
              </div>
            ) : (
              <div className="text-center py-10 text-slate-400 text-xs space-y-2">
                <Sparkles className="w-8 h-8 mx-auto text-purple-300" />
                <p className="font-medium text-slate-600">No draft generated yet</p>
                <p className="text-[11px]">Chat with the assistant or click an example above to generate a structured ticket draft.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && draft && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-scaleUp">
            <h3 className="text-sm font-bold text-slate-900">Confirm Ticket Submission</h3>
            <p className="text-xs text-slate-500">
              Please review the details before submitting. Your ticket will be evaluated by the deterministic prioritization engine and assigned an SLA target deadline.
            </p>

            <div className="p-3 bg-slate-50 rounded-xl space-y-2 text-xs border border-slate-200">
              <div>
                <strong>Title:</strong> {draft.title}
              </div>
              <div>
                <strong>Category:</strong> {draft.category}
              </div>
              <div>
                <strong>Urgency:</strong> {draft.suggested_urgency}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAndCreate}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs"
              >
                {isSubmitting ? 'Submitting...' : 'Confirm & Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

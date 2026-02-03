'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAiChat } from '../hooks/useAiChat';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { useAuraStore } from '../store/aura-store';

export function FloatingChat() {
    const { isOpen, setIsOpen, messageTrigger, clearTrigger } = useAuraStore();
    const [input, setInput] = useState('');
    const { messages, sendMessage, isLoading } = useAiChat();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (messageTrigger) {
            sendMessage(messageTrigger);
            clearTrigger();
        }
    }, [messageTrigger, sendMessage, clearTrigger]);

    const scrollToBottom = () => {

        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) scrollToBottom();
    }, [messages, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;
        sendMessage(input);
        setInput('');
    };

    return (
        <div className="fixed bottom-0 right-0 md:bottom-6 md:right-6 z-50 flex flex-col items-end p-4 pb-safe">
            {/* Chat Window */}
            {isOpen && (
                <div className="mb-4 flex h-[60dvh] md:h-[500px] w-[90vw] max-w-[380px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a]/90 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-300">
                    {/* Header */}
                    <div className="flex items-center justify-between bg-gradient-to-r from-[#bfff00]/20 to-transparent p-4 border-b border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-[#bfff00] animate-pulse" />
                            <h3 className="font-semibold text-white tracking-wide">Aura AI</h3>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-white/40 hover:text-white transition-colors"
                        >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
                        {messages.length === 0 && (
                            <div className="flex h-full flex-col items-center justify-center text-center opacity-40 px-6">
                                <svg className="h-12 w-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                </svg>
                                <p className="text-sm">Hola, soy Aura. ¿En qué puedo ayudarte hoy?</p>
                            </div>
                        )}
                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-1 duration-300`}
                            >
                                <div className={`max-w-[85%] rounded-2xl p-3 text-sm shadow-sm ${msg.role === 'user'
                                    ? 'bg-[#bfff00] text-black font-medium'
                                    : 'bg-white/5 text-white/90 border border-white/10'
                                    }`}>
                                    {msg.role === 'assistant' ? (
                                        <div className="markdown-container">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {msg.content}
                                            </ReactMarkdown>
                                        </div>
                                    ) : (
                                        msg.content
                                    )}
                                </div>
                            </div>
                        ))}
                        {isLoading && messages[messages.length - 1]?.role === 'user' && (
                            <div className="flex justify-start">
                                <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
                                    <div className="flex gap-1">
                                        <div className="h-1.5 w-1.5 bg-[#bfff00] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="h-1.5 w-1.5 bg-[#bfff00] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="h-1.5 w-1.5 bg-[#bfff00] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSubmit} className="p-4 border-t border-white/5 bg-black/20">
                        <div className="relative flex items-center">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Escribe un mensaje..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-4 pr-12 text-sm text-white focus:outline-none focus:border-[#bfff00]/50 focus:ring-1 focus:ring-[#bfff00]/20 transition-all"
                            />
                            <button
                                type="submit"
                                disabled={isLoading || !input.trim()}
                                className="absolute right-2 p-1.5 text-[#bfff00] hover:bg-[#bfff00]/10 rounded-lg transition-colors disabled:opacity-30"
                            >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`group flex h-14 w-14 items-center justify-center rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 ${isOpen ? 'bg-red-500 rotate-90' : 'bg-[#bfff00]'
                    }`}
            >
                {isOpen ? (
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <div className="relative">
                        <svg className="h-7 w-7 text-black group-hover:animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                        <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-white border-2 border-[#bfff00]" />
                    </div>
                )}
            </button>

            <style jsx global>{`
                .markdown-container h1, .markdown-container h2, .markdown-container h3 {
                    font-weight: 600;
                    margin-bottom: 0.5rem;
                    color: white;
                }
                .markdown-container p {
                    margin-bottom: 0.75rem;
                }
                .markdown-container p:last-child {
                    margin-bottom: 0;
                }
                .markdown-container ul, .markdown-container ol {
                    margin-bottom: 0.75rem;
                    padding-left: 1.25rem;
                }
                .markdown-container li {
                    margin-bottom: 0.25rem;
                }
                .markdown-container strong {
                    color: #bfff00;
                    font-weight: 600;
                }
                .markdown-container code {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 0.1rem 0.3rem;
                    rounded: 0.2rem;
                    font-family: inherit;
                }
            `}</style>
        </div>
    );
}

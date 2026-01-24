import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MagicWandIcon, PaperPlaneIcon, PersonIcon } from '@radix-ui/react-icons';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8787/api/v1';

export const AnalystPage: React.FC = () => {
    const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([
        { role: 'assistant', content: "Welcome. I'm your dedicated Market Analyst. How can I assist you with strategic intelligence today?" }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setInput('');
        setLoading(true);

        try {
            const res = await fetch(`${API_BASE}/intel/ai-chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('boa_auth_token') || ''}`
                },
                body: JSON.stringify({ message: userMessage })
            });

            if (res.ok) {
                const data = await res.json();
                setMessages(prev => [...prev, { role: 'assistant', content: data.response || data.message || 'I processed your request.' }]);
            } else {
                setMessages(prev => [...prev, { role: 'assistant', content: 'I encountered an issue processing your request. Please try again.' }]);
            }
        } catch {
            setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. The intelligence service may be temporarily unavailable.' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="container py-8 max-w-4xl">
                <div className="mb-8">
                    <h1 className="text-4xl font-serif font-black mb-2 flex items-center gap-3">
                        <MagicWandIcon className="h-8 w-8 text-primary" />
                        Strategic Analyst
                    </h1>
                    <p className="text-xl text-muted-foreground">Your dedicated intelligence partner for the African continent.</p>
                </div>

                <Card className="h-[600px] flex flex-col border-border shadow-lg">
                    <CardHeader className="border-b bg-muted/20">
                        <CardTitle>Secure Analyst Session</CardTitle>
                        <CardDescription>Powered by Best of Africa Intelligence Engine</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
                        <div className="flex-1 p-4 overflow-y-auto">
                            <div className="space-y-4">
                                {messages.map((msg, i) => (
                                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`flex gap-3 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                            <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                                                {msg.role === 'user' ? <PersonIcon /> : <MagicWandIcon />}
                                            </div>
                                            <div className={`p-4 rounded-2xl ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted/50 text-foreground rounded-tl-sm'}`}>
                                                <p className="leading-relaxed">{msg.content}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="p-4 border-t bg-background">
                            <form onSubmit={handleSend} className="flex gap-2">
                                <Input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask about market trends, country profiles, or investment opportunities..."
                                    className="flex-1"
                                />
                                <Button type="submit" size="icon">
                                    <PaperPlaneIcon />
                                </Button>
                            </form>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
};

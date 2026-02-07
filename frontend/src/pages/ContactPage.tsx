import React, { useState } from 'react';
import { useSystemConfig } from "@/hooks/useSystemConfig";
import { Layout } from '../components/Layout';
import { EnvelopeClosedIcon, ChatBubbleIcon, PaperPlaneIcon, UpdateIcon } from '@radix-ui/react-icons';
import { toast } from "sonner"
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8787/api/v1';

export const ContactPage: React.FC = () => {
    const { data: config } = useSystemConfig();
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        organization: '',
        email: '',
        inquiry_type: 'Strategic Partnership',
        message: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('submitting');
        setError('');

        try {
            const res = await fetch(`${API_BASE}/contact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to submit');
            }

            setStatus('success');
            setFormData({ name: '', organization: '', email: '', inquiry_type: 'Strategic Partnership', message: '' });
        } catch (err: any) {
            setError(err.message);
            setStatus('error');
        }
    };

    return (
        <Layout>
            <div className="container py-20 max-w-4xl">
                <div className="mb-12 text-center">
                    <h1 className="mb-4 text-4xl font-serif font-extrabold text-foreground md:text-5xl">
                        {config?.['contact_headline'] || "Contact Best of Africa"}
                    </h1>
                    <p className="text-xl text-muted-foreground">
                        For media inquiries, partnership opportunities, or support.
                    </p>
                </div>

                {status === 'success' ? (
                    <Card className="border-primary/20 bg-primary/5 text-center text-foreground shadow-sm">
                        <CardContent className="flex flex-col items-center py-12">
                            <div className="mb-6 rounded-full bg-primary/10 p-4">
                                <PaperPlaneIcon className="h-12 w-12 text-primary" />
                            </div>
                            <h2 className="mb-2 text-2xl font-bold">Message Sent</h2>
                            <p className="mb-8 text-muted-foreground">Thank you for reaching out. We will review your inquiry shortly.</p>
                            <Button
                                variant="outline"
                                className="border-primary text-primary hover:bg-primary/10"
                                onClick={() => {
                                    setStatus('idle');
                                    toast.info("Ready for new message");
                                }}
                            >
                                Send Another
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="border-border shadow-lg">
                        <CardHeader>
                            <CardTitle>Send us a message</CardTitle>
                            <CardDescription>We typically respond within 24 business hours.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {error && (
                                <div className="mb-6 rounded-3xl bg-destructive/10 p-4 text-sm text-destructive border border-destructive/20">
                                    {error}
                                </div>
                            )}
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Name</Label>
                                        <Input
                                            id="name"
                                            required
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Your Name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="org">Organization</Label>
                                        <Input
                                            id="org"
                                            value={formData.organization}
                                            onChange={e => setFormData({ ...formData, organization: e.target.value })}
                                            placeholder="Company / Institution"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        required
                                        type="email"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="official@organization.com"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="type">Inquiry Type</Label>
                                    <Select
                                        value={formData.inquiry_type}
                                        onValueChange={(value) => setFormData({ ...formData, inquiry_type: value })}
                                    >
                                        <SelectTrigger id="type" className="bg-background">
                                            <SelectValue placeholder="Select Inquiry Type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Strategic Partnership">Strategic Partnership</SelectItem>
                                            <SelectItem value="Media / Press">Media / Press</SelectItem>
                                            <SelectItem value="Report Access">Report Access</SelectItem>
                                            <SelectItem value="Technical Support">Technical Support</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="message">Message</Label>
                                    <Textarea
                                        id="message"
                                        required
                                        rows={5}
                                        value={formData.message}
                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, message: e.target.value })}
                                        placeholder="How can we assist you?"
                                        className="bg-background"
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    disabled={status === 'submitting'}
                                    className="w-full font-bold"
                                >
                                    {status === 'submitting' ? (
                                        <>
                                            <UpdateIcon className="mr-2 h-4 w-4 animate-spin" /> Sending...
                                        </>
                                    ) : (
                                        <>
                                            <PaperPlaneIcon className="mr-2 h-4 w-4" /> Send Message
                                        </>
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                )}

                <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="flex flex-col items-center rounded-3xl bg-secondary/50 p-8 text-center transition-colors hover:bg-secondary">
                        <ChatBubbleIcon className="mb-4 h-8 w-8 text-primary" />
                        <h3 className="mb-2 text-lg font-bold text-foreground">Press Inquiries</h3>
                        <p className="text-sm text-muted-foreground font-medium">press@bestofafrica.com</p>
                    </div>
                    <div className="flex flex-col items-center rounded-3xl bg-secondary/50 p-8 text-center transition-colors hover:bg-secondary">
                        <EnvelopeClosedIcon className="mb-4 h-8 w-8 text-primary" />
                        <h3 className="mb-2 text-lg font-bold text-foreground">General Support</h3>
                        <p className="text-sm text-muted-foreground font-medium">support@bestofafrica.com</p>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

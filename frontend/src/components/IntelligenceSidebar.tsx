import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DesktopIcon, PersonIcon, StarIcon, PaperPlaneIcon } from '@radix-ui/react-icons';
import { Badge } from '@/components/ui/badge';
// import { ScrollArea } from '@/components/ui/scroll-area';

interface IntelligenceSidebarProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const IntelligenceSidebar: React.FC<IntelligenceSidebarProps> = ({ open, onOpenChange }) => {
    const [query, setQuery] = useState("");
    const [chatHistory, setChatHistory] = useState([
        { role: 'assistant', content: "Select a Lens above to adapt the market insights, or ask me to refine the parameters." }
    ]);

    const handleSend = () => {
        if (!query.trim()) return;

        // Add user message
        const newHistory = [...chatHistory, { role: 'user', content: query }];
        setChatHistory(newHistory);
        setQuery("");

        // Mock AI Response (Immediate)
        setTimeout(() => {
            setChatHistory(prev => [...prev, {
                role: 'assistant',
                content: "Parameters updated. Re-calibrating vector search for 'Investor Risk' context. I've highlighted 3 regulatory shifts in the main view."
            }]);
        }, 800);
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-[400px] sm:w-[540px] flex flex-col p-0 border-l border-primary/20 bg-background/95 backdrop-blur-xl">

                {/* ADAPTIVE HEADER */}
                <SheetHeader className="p-6 border-b border-border bg-muted/10">
                    <div className="flex items-center justify-between mb-4">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Market Context</div>
                    </div>
                    <SheetTitle className="flex items-center gap-2 text-xl font-black">
                        <StarIcon className="h-5 w-5 text-primary" /> Adaptive Intelligence
                    </SheetTitle>
                    <SheetDescription className="text-muted-foreground/80">
                        Configure the narrative lens and calibrate data vectors.
                    </SheetDescription>

                    {/* ADAPTIVE CONTROLS */}
                    <div className="mt-6 space-y-3">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Active Narrative Lens</div>
                        <div className="grid grid-cols-3 gap-2">
                            <Button variant="outline" size="sm" className="bg-primary/5 border-primary/20 text-primary hover:bg-primary hover:text-white transition-colors">
                                Investor
                            </Button>
                            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                                Gov/Policy
                            </Button>
                            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                                NGO
                            </Button>
                        </div>
                    </div>
                </SheetHeader>

                <ScrollArea className="flex-1 p-6">
                    <div className="space-y-6">
                        {chatHistory.map((msg, i) => (
                            <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <Avatar className="h-8 w-8 border border-border shrink-0">
                                    <AvatarFallback className={msg.role === 'system' ? 'bg-primary text-white' : 'bg-muted'}>
                                        {msg.role === 'system' ? <DesktopIcon className="h-4 w-4" /> : <PersonIcon className="h-4 w-4" />}
                                    </AvatarFallback>
                                </Avatar>
                                <div className={`p-3 rounded-lg text-sm leading-relaxed shadow-sm ${msg.role === 'system'
                                    ? 'bg-muted/50 border border-border text-foreground'
                                    : 'bg-primary text-white'
                                    }`}>
                                    <span className="block mb-1 text-[10px] font-bold uppercase tracking-widest opacity-50">
                                        {msg.role === 'system' ? 'Analysis' : 'Input'}
                                    </span>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-4 border-t border-border bg-background">
                    <div className="flex gap-2 mb-2 overflow-x-auto pb-2">
                        <Badge variant="outline" className="cursor-pointer hover:bg-primary/10 transition-colors">Summarize Risks</Badge>
                        <Badge variant="outline" className="cursor-pointer hover:bg-primary/10 transition-colors">Identify Opps</Badge>
                        <Badge variant="outline" className="cursor-pointer hover:bg-primary/10 transition-colors">Draft Briefing</Badge>
                    </div>
                    <form
                        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                        className="flex gap-2"
                    >
                        <Input
                            placeholder="Refine parameters..."
                            className="flex-1 bg-muted/20 focus-visible:ring-primary/20"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        <Button type="submit" size="icon" className="shrink-0 shadow-sm">
                            <PaperPlaneIcon className="h-4 w-4" />
                        </Button>
                    </form>
                </div>
            </SheetContent>
        </Sheet>
    );
};

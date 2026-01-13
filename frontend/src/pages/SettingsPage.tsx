import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { User, Bell, Shield, LogOut, CreditCard, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

export const SettingsPage: React.FC = () => {
    const [user, setUser] = useState({
        name: 'Jonathan Doe',
        email: 'j.doe@investment-fund.com',
        role: 'Institutional Analyst',
        tier: 'Premium',
        notifications: {
            email: true,
            push: false,
            reports: true
        }
    });

    const [isEditing, setIsEditing] = useState(false);

    const toggleNotification = (key: keyof typeof user.notifications) => {
        setUser(prev => ({
            ...prev,
            notifications: {
                ...prev.notifications,
                [key]: !prev.notifications[key]
            }
        }));
    };

    return (
        <Layout>
            <div className="container py-20 max-w-4xl">
                <header className="mb-12 border-b border-border pb-8">
                    <h1 className="mb-2 text-4xl font-black tracking-tight text-foreground">Control Center</h1>
                    <p className="text-lg text-muted-foreground">Manage your account, preferences, and subscription.</p>
                </header>

                <div className="grid gap-10">

                    {/* PROFILE SETTINGS */}
                    <Card className="border-border shadow-sm">
                        <CardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                                        <User className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg font-bold text-foreground">Profile Details</CardTitle>
                                        <CardDescription>Personal information and professional credentials.</CardDescription>
                                    </div>
                                </div>
                                <Button
                                    variant={isEditing ? "default" : "outline"}
                                    onClick={() => setIsEditing(!isEditing)}
                                    className={isEditing ? "" : ""}
                                >
                                    {isEditing ? 'Save Changes' : 'Edit Profile'}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input
                                        id="name"
                                        value={user.name}
                                        readOnly={!isEditing}
                                        onChange={(e) => setUser({ ...user, name: e.target.value })}
                                        className={cn(!isEditing && "bg-muted text-muted-foreground")}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input
                                        id="email"
                                        value={user.email}
                                        readOnly={!isEditing}
                                        className="bg-muted text-muted-foreground"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="role">Professional Role</Label>
                                    <Input
                                        id="role"
                                        value={user.role}
                                        readOnly={!isEditing}
                                        onChange={(e) => setUser({ ...user, role: e.target.value })}
                                        className={cn(!isEditing && "bg-muted text-muted-foreground")}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Account Tier</Label>
                                    <div className="flex items-center h-10 px-3 rounded-md bg-secondary border border-border">
                                        <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 mr-2">
                                            {user.tier}
                                        </Badge>
                                        <span className="text-sm text-muted-foreground">Access valid until Dec 2026</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* NOTIFICATIONS */}
                    <Card className="border-border shadow-sm">
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                                    <Bell className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-bold text-foreground">Notifications</CardTitle>
                                    <CardDescription>Configure how you receive intelligence alerts.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            {[
                                { key: 'email', label: 'Email Digest', desc: 'Daily summary of tracked markets.', icon: Mail },
                                { key: 'push', label: 'Real-time Alerts', desc: 'Immediate notification for high-volatility events.', icon: Zap },
                                { key: 'reports', label: 'New Reports', desc: 'When new premium reports are published.', icon: CreditCard },
                            ].map((item) => (
                                <div key={item.key} className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="rounded-full bg-card p-2 shadow-sm border border-border">
                                            <item.icon className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-foreground">{item.label}</div>
                                            <div className="text-xs text-muted-foreground">{item.desc}</div>
                                        </div>
                                    </div>
                                    <Switch
                                        checked={user.notifications[item.key as keyof typeof user.notifications]}
                                        onCheckedChange={() => toggleNotification(item.key as keyof typeof user.notifications)}
                                    />
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* SECURITY & DANGER ZONE */}
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card className="border-border shadow-sm">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Shield className="h-5 w-5 text-primary" />
                                    <CardTitle className="text-base font-bold text-foreground">Security</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Button variant="outline" className="w-full justify-start border-border">
                                    Change Password
                                </Button>
                                <Button variant="outline" className="w-full justify-start border-border">
                                    Two-Factor Authentication
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="border-destructive/20 bg-destructive/5 shadow-sm">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <LogOut className="h-5 w-5 text-destructive" />
                                    <CardTitle className="text-base font-bold text-destructive">Session</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-destructive">Securely sign out of your account on all devices.</p>
                                <Button variant="destructive" className="w-full">
                                    Sign Out
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

// Mock Icon for Zap
function Zap(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
    )
}

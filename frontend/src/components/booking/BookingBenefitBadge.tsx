import React from 'react';
import { cn } from '@/lib/utils';
import { StarFilledIcon, TimerIcon, Link2Icon, BackpackIcon } from '@radix-ui/react-icons';

export type BenefitType = 'breakfast' | 'upgrade' | 'credit' | 'wifi' | 'checkout' | 'lounge';

interface BookingBenefitBadgeProps {
    type: BenefitType;
    className?: string;
    variant?: 'default' | 'minimal' | 'card';
}

const BENEFIT_CONFIG: Record<BenefitType, { label: string; icon: React.ElementType; color: string }> = {
    breakfast: {
        label: 'Daily Breakfast for Two',
        icon: StarFilledIcon,
        color: 'text-[#D4AF37]' // Gold
    },
    upgrade: {
        label: 'Room Upgrade',
        icon: StarFilledIcon,
        color: 'text-[#D4AF37]' // Gold
    },
    credit: {
        label: '$100 Hotel Credit',
        icon: StarFilledIcon,
        color: 'text-[#D4AF37]' // Gold
    },
    wifi: {
        label: 'High-Speed WiFi',
        icon: Link2Icon,
        color: 'text-primary' // Green
    },
    checkout: {
        label: 'Early Check-in / Late Checkout',
        icon: TimerIcon,
        color: 'text-primary' // Green
    },
    lounge: {
        label: 'Executive Lounge Access',
        icon: BackpackIcon,
        color: 'text-[#D4AF37]' // Gold
    }
};

export const BookingBenefitBadge: React.FC<BookingBenefitBadgeProps> = ({
    type,
    className,
    variant = 'default'
}) => {
    const config = BENEFIT_CONFIG[type];
    const Icon = config.icon;

    if (variant === 'minimal') {
        return (
            <div className={cn("flex items-center gap-1.5 text-xs font-medium text-muted-foreground", className)}>
                <Icon className="h-3.5 w-3.5" />
                <span>{config.label}</span>
            </div>
        );
    }

    if (variant === 'card') {
        return (
            <div className={cn("flex flex-col items-center justify-center p-3 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-center gap-2", className)}>
                <div className={cn("p-2 rounded-full bg-white shadow-sm", config.color)}>
                    <Icon className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground leading-tight">
                    {config.label}
                </span>
            </div>
        )
    }

    return (
        <div className={cn(
            "inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-sm font-medium transition-colors",
            "bg-background/50 border-border hover:bg-accent hover:text-accent-foreground",
            className
        )}>
            <Icon className={cn("h-4 w-4", config.color)} />
            <span>{config.label}</span>
            {type === 'upgrade' && <span className="text-[10px] text-muted-foreground ml-1">(Subject to Avail.)</span>}
        </div>
    );
};

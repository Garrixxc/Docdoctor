'use client';

import { LucideIcon, ArrowRight, Shield, FileText, Users, Zap, CheckCircle2, Globe, Lock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const iconMap = {
    shield: Shield,
    fileText: FileText,
    users: Users,
    zap: Zap,
    checkCircle2: CheckCircle2,
    globe: Globe,
    lock: Lock,
    alertCircle: AlertCircle
};

interface VerticalCardProps {
    title: string;
    description: string;
    iconName: keyof typeof iconMap;
    color: 'blue' | 'emerald' | 'purple' | 'amber';
    href?: string;
    stats?: string;
    badge?: string;
    className?: string;
}

export default function VerticalCard({
    title,
    description,
    iconName,
    color,
    href,
    stats,
    badge,
    className
}: VerticalCardProps) {
    const Icon = iconMap[iconName] || Shield;

    // Standardizing colors to the blue-focused theme
    const colorMap = {
        blue: 'from-blue-600 to-blue-700 shadow-blue-200',
        emerald: 'from-emerald-600 to-emerald-700 shadow-emerald-200',
        purple: 'from-blue-600 to-blue-800 shadow-blue-200',
        amber: 'from-amber-500 to-orange-600 shadow-amber-200',
    };

    const bgMap = {
        blue: 'bg-blue-50/50',
        emerald: 'bg-emerald-50/50',
        purple: 'bg-blue-50/50',
        amber: 'bg-amber-50/50',
    };

    const textHoverMap = {
        blue: 'group-hover:text-blue-600',
        emerald: 'group-hover:text-emerald-600',
        purple: 'group-hover:text-blue-700',
        amber: 'group-hover:text-amber-600',
    };

    return (
        <div
            onClick={() => href && (window.location.href = href)}
            className={cn(
                "group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 transition-all duration-500 hover:-translate-y-2 hover:shadow-xl hover:shadow-slate-200/50 cursor-pointer h-full flex flex-col justify-between",
                className
            )}
        >
            <div className={cn(
                "absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-0 blur-3xl transition-all duration-1000 group-hover:opacity-40",
                bgMap[color]
            )} />

            <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-6">
                    <div className={cn(
                        "flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg transition-all duration-500 group-hover:scale-110",
                        colorMap[color]
                    )}>
                        <Icon className="h-7 w-7 text-white" />
                    </div>
                    {badge && (
                        <div className="px-3 py-1 rounded-full bg-slate-900 text-white text-[9px] font-bold uppercase tracking-widest leading-none">
                            {badge}
                        </div>
                    )}
                </div>

                <div className="space-y-3">
                    <h3 className={cn("text-xl font-outfit font-bold text-slate-900 transition-colors leading-tight", textHoverMap[color])}>
                        {title}
                    </h3>

                    <p className="text-sm leading-relaxed text-slate-500 font-medium">
                        {description}
                    </p>
                </div>

                <div className="mt-auto pt-8 flex items-center justify-between">
                    {stats ? (
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            {stats}
                        </span>
                    ) : <div />}

                    <div className={cn("flex items-center gap-2 text-xs font-bold transition-all duration-500 group-hover:translate-x-1", color === 'blue' || color === 'purple' ? 'text-blue-600' : color === 'emerald' ? 'text-emerald-600' : 'text-amber-600')}>
                        Get Started <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                </div>
            </div>
        </div>
    );
}

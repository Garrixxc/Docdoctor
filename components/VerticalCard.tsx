'use client';

import { ReactNode } from 'react';
import { LucideIcon, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface VerticalCardProps {
    title: string;
    description: string;
    icon: LucideIcon;
    color: 'blue' | 'emerald' | 'purple' | 'amber';
    href?: string;
    stats?: string;
    badge?: string;
    className?: string;
}

export default function VerticalCard({
    title,
    description,
    icon: Icon,
    color,
    href,
    stats,
    badge,
    className
}: VerticalCardProps) {
    const colorMap = {
        blue: 'from-blue-500 to-indigo-600 shadow-blue-500/20 group-hover:shadow-blue-500/30',
        emerald: 'from-emerald-500 to-teal-600 shadow-emerald-500/20 group-hover:shadow-emerald-500/30',
        purple: 'from-purple-500 to-pink-600 shadow-purple-500/20 group-hover:shadow-purple-500/30',
        amber: 'from-amber-500 to-orange-600 shadow-amber-500/20 group-hover:shadow-amber-500/30',
    };

    const bgMap = {
        blue: 'bg-blue-50',
        emerald: 'bg-emerald-50',
        purple: 'bg-purple-50',
        amber: 'bg-amber-50',
    };

    return (
        <div
            onClick={() => href && (window.location.href = href)}
            className={cn(
                "group relative overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white p-10 transition-all duration-700 hover:-translate-y-2 hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] cursor-pointer h-full flex flex-col justify-between",
                className
            )}
        >
            {/* Visual Textures */}
            <div className="absolute inset-0 noise opacity-[0.03] pointer-events-none" />
            <div className={cn(
                "absolute -right-10 -top-10 h-64 w-64 rounded-full opacity-0 blur-3xl transition-all duration-1000 group-hover:opacity-40",
                bgMap[color]
            )} />

            <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-8">
                    <div className={cn(
                        "flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br shadow-2xl transition-all duration-700 group-hover:rotate-[10deg] group-hover:scale-110",
                        colorMap[color]
                    )}>
                        <Icon className="h-8 w-8 text-white" />
                    </div>
                    {badge && (
                        <div className="px-3 py-1 rounded-full bg-slate-900 text-white text-[9px] font-bold uppercase tracking-widest animate-fade-in">
                            {badge}
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-outfit font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">
                            {title}
                        </h3>
                    </div>

                    <p className="text-base leading-relaxed text-slate-500 font-medium">
                        {description}
                    </p>
                </div>

                <div className="mt-auto pt-10 flex items-center justify-between">
                    {stats ? (
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            {stats}
                        </span>
                    ) : <div />}

                    <div className="flex items-center gap-2 text-sm font-bold text-indigo-600 transition-all duration-500 group-hover:translate-x-1">
                        Explore <ArrowRight className="h-4 w-4" />
                    </div>
                </div>
            </div>

            <div className="absolute inset-0 border-2 border-transparent group-hover:border-indigo-500/10 rounded-[2.5rem] transition-all duration-700" />
        </div>
    );
}

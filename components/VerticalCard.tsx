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
    className?: string;
}

export default function VerticalCard({
    title,
    description,
    icon: Icon,
    color,
    href,
    stats,
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
                "group relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-8 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl cursor-pointer",
                className
            )}
        >
            <div className={cn(
                "absolute -right-4 -top-4 h-32 w-32 rounded-full opacity-10 blur-3xl transition-all duration-500 group-hover:scale-150 group-hover:opacity-20",
                bgMap[color]
            )} />

            <div className="relative z-10">
                <div className={cn(
                    "mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br shadow-xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3",
                    colorMap[color]
                )}>
                    <Icon className="h-7 w-7 text-white" />
                </div>

                <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {title}
                    </h3>
                    {stats && (
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-blue-500 transition-colors">
                            {stats}
                        </span>
                    )}
                </div>

                <p className="mb-8 text-sm leading-relaxed text-gray-600">
                    {description}
                </p>

                <div className="flex items-center gap-2 text-sm font-bold text-blue-600 opacity-0 transition-all duration-500 group-hover:translate-x-2 group-hover:opacity-100">
                    Get Started <ArrowRight className="h-4 w-4" />
                </div>
            </div>

            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r transition-all duration-500 opacity-0 group-hover:opacity-100" style={{ backgroundImage: `linear-gradient(to right, var(--${color}-500), var(--${color}-600))` }} />
        </div>
    );
}

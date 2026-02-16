'use client';

import { useEffect, useState } from 'react';
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Zap, ShieldCheck, AlertCircle } from 'lucide-react';
import { cn } from "@/lib/utils/cn";

export default function UsageBanner() {
    const [usage, setUsage] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsage = async () => {
            try {
                const res = await fetch('/api/usage');
                if (res.ok) {
                    const data = await res.json();
                    setUsage(data.usage);
                }
            } catch (err) {
                console.error('Failed to fetch usage:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchUsage();
    }, []);

    if (loading || !usage) return null;

    const isPro = usage.tier === 'PRO';
    const isWarn = usage.percentUsed > 80;
    const isAtLimit = usage.isAtLimit;

    if (isPro) {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-700 text-xs font-medium animate-fade-in">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Unlimited Plan (BYO Key)</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-3 sm:gap-6 py-2 px-3 sm:px-5 rounded-2xl bg-white/40 backdrop-blur-md border border-white/40 shadow-sm transition-all hover:bg-white/60">
            <div className="flex flex-col gap-1.5 min-w-[100px] sm:min-w-[150px]">
                <div className="flex justify-between items-end mb-0.5">
                    <span className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 leading-none">Usage</span>
                    <span className="text-[10px] font-black text-slate-900 leading-none">
                        {usage.pagesUsed}<span className="text-slate-300 sm:inline hidden"> / {usage.pagesLimit}</span>
                    </span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden p-[1px] border border-slate-200/50">
                    <div
                        className={cn(
                            "h-full rounded-full transition-all duration-1000",
                            isAtLimit ? "bg-red-500" : isWarn ? "bg-amber-500" : "bg-indigo-600"
                        )}
                        style={{ width: `${usage.percentUsed}%` }}
                    />
                </div>
            </div>

            <div className="h-8 w-[1px] bg-slate-100 hidden lg:block" />

            <div className="flex flex-col items-end gap-1.5 hidden sm:flex">
                <span className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 leading-none">Tier</span>
                <Badge variant="outline" className={cn(
                    "font-black text-[9px] py-0 px-2.5 h-4.5 uppercase tracking-wider rounded-lg border",
                    isPro ? "bg-indigo-600 text-white border-none shadow-md" : "bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-100 text-indigo-700"
                )}>
                    {usage.tier || 'FREE'}
                </Badge>
            </div>
        </div>
    );
}

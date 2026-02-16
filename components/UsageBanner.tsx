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
        <div className="flex items-center gap-4 animate-fade-in">
            <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-bold text-gray-500">
                    <span className={cn(isWarn ? "text-amber-600" : isAtLimit ? "text-red-600" : "text-gray-500")}>
                        {usage.pagesUsed} / {usage.pagesLimit} Pages Used
                    </span>
                    {isWarn && !isAtLimit && <AlertCircle className="w-3 h-3 text-amber-500 animate-pulse" />}
                    {isAtLimit && <AlertCircle className="w-3 h-3 text-red-500" />}
                </div>
                <div className="w-32 h-1.5 bg-gray-100 rounded-full overflow-hidden border border-gray-200/50">
                    <div
                        className={cn(
                            "h-full transition-all duration-1000",
                            isAtLimit ? "bg-red-500" : isWarn ? "bg-amber-500" : "bg-blue-500"
                        )}
                        style={{ width: `${usage.percentUsed}%` }}
                    />
                </div>
            </div>
            {!isPro && (
                <Badge variant="outline" className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 text-amber-700 text-[10px] py-0 px-2 h-5 cursor-help" title="50 pages/month limit">
                    FREE
                </Badge>
            )}
        </div>
    );
}

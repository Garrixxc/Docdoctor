'use client';

import { Check, Zap, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Card } from '@/components/ui/card';

interface PlanSelectorProps {
    value: 'FREE' | 'BYO';
    onChange: (value: 'FREE' | 'BYO') => void;
}

export default function PlanSelector({ value, onChange }: PlanSelectorProps) {
    const plans = [
        {
            id: 'FREE',
            title: 'Free Tier',
            description: 'Perfect for quick tests and small batches.',
            price: '$0',
            period: '/mo',
            icon: Zap,
            color: 'blue',
            features: [
                'Up to 50 pages / month',
                'GPT-4o-mini powered',
                'All extraction verticals',
                'CSV Exports'
            ]
        },
        {
            id: 'BYO',
            title: 'Bring Your Own Key',
            description: 'Scale without limits using your own API key.',
            price: 'Unlimited',
            period: '',
            icon: ShieldCheck,
            color: 'indigo',
            features: [
                'No page limits',
                'Choose any model (4o, 4-turbo)',
                'Workspace-wide key sharing',
                'CSV & JSON Exports'
            ]
        }
    ];

    return (
        <div className="grid md:grid-cols-2 gap-6 w-full max-w-4xl mx-auto">
            {plans.map((plan) => (
                <div
                    key={plan.id}
                    onClick={() => onChange(plan.id as any)}
                    className={cn(
                        "group relative cursor-pointer rounded-[2rem] border-2 p-8 transition-all duration-300",
                        value === plan.id
                            ? "border-blue-600 bg-blue-50/30 shadow-xl shadow-blue-500/10"
                            : "border-gray-100 bg-white hover:border-blue-200 hover:shadow-lg"
                    )}
                >
                    {value === plan.id && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">
                            Selected Plan
                        </div>
                    )}

                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className={cn(
                                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110",
                                plan.id === 'FREE' ? "bg-blue-100 text-blue-600" : "bg-indigo-100 text-indigo-600"
                            )}>
                                <plan.icon className="w-6 h-6" />
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold text-gray-900 leading-none">{plan.price}</div>
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{plan.period}</div>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <h3 className="text-xl font-bold text-gray-900">{plan.title}</h3>
                            <p className="text-sm text-gray-500 font-medium leading-relaxed">{plan.description}</p>
                        </div>

                        <div className="space-y-3 pt-4 border-t border-gray-100/50">
                            {plan.features.map((feature, i) => (
                                <div key={i} className="flex items-center gap-3 text-sm font-medium text-gray-600">
                                    <div className={cn(
                                        "flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center",
                                        plan.id === 'FREE' ? "bg-blue-100 text-blue-600" : "bg-indigo-100 text-indigo-600"
                                    )}>
                                        <Check className="w-3 h-3" />
                                    </div>
                                    {feature}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

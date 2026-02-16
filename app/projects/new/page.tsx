'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Check, Zap, Brain, ShieldCheck, ChevronRight, Lock, Clock, Sparkles } from 'lucide-react';
import PlanSelector from '@/components/PlanSelector';
import { cn } from '@/lib/utils/cn';

interface Template {
    id: string;
    name: string;
    slug: string;
    category: string;
    config: any;
}

const STEPS = [
    { id: 1, label: 'Choose Plan' },
    { id: 2, label: 'Project Details' },
    { id: 3, label: 'Confirm' },
];

function NewProjectContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const templateSlugFromUrl = searchParams.get('template');

    const [step, setStep] = useState(1);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(false);
    const [plan, setPlan] = useState<'FREE' | 'BYO'>('FREE');

    // Form data
    const [formData, setFormData] = useState({
        name: '',
        templateId: '',
        requirements: {} as any,
    });

    useEffect(() => {
        fetchTemplates();
    }, []);

    async function fetchTemplates() {
        try {
            const res = await fetch('/api/templates');
            const data = await res.json();
            const fetchedTemplates = data.templates || [];
            setTemplates(fetchedTemplates);

            // Pre-select template if slug in URL
            if (templateSlugFromUrl) {
                const found = fetchedTemplates.find((t: Template) => t.slug === templateSlugFromUrl);
                if (found) {
                    setFormData(prev => ({ ...prev, templateId: found.id }));
                }
            }
        } catch (err) {
            console.error('Failed to fetch templates:', err);
        }
    }

    const selectedTemplate = templates.find((t) => t.id === formData.templateId);

    async function handleSubmit() {
        setLoading(true);
        try {
            // Build extraction settings based on plan
            let extractionSettings: any = {};

            if (plan === 'FREE') {
                extractionSettings = {
                    settingsMode: 'simple',
                    costVsAccuracy: 0, // Maps to gpt-4o-mini
                    speedVsThoroughness: true,
                    model: 'gpt-4o-mini',
                    chunkingMethod: 'by_pages',
                    chunkSize: 6000,
                    overlap: 100,
                    temperature: 0.1,
                    autoAcceptThreshold: 0.95,
                    needsReviewThreshold: 0.7,
                    maxCostPerRun: null, // Limit is handled by orchestrator usage-tracker
                    apiKeyMode: 'PLATFORM'
                };
            } else {
                extractionSettings = {
                    settingsMode: 'advanced', // Defaults for BYO but user can change later in project settings
                    chunkingMethod: 'headings',
                    chunkSize: 3000,
                    overlap: 300,
                    provider: 'openai',
                    model: 'gpt-4o',
                    temperature: 0.1,
                    autoAcceptThreshold: 0.92,
                    needsReviewThreshold: 0.65,
                    maxCostPerRun: null,
                    apiKeyMode: 'WORKSPACE' // Expects key to be set at workspace level
                };
            }

            const res = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    templateId: formData.templateId,
                    requirements: formData.requirements,
                    extractionSettings,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                router.push(`/projects/${data.project.id}`);
            }
        } catch (err) {
            console.error('Failed to create project:', err);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="container mx-auto px-6 py-10 max-w-6xl space-y-16 animate-fade-in relative z-10">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
                <div className="space-y-6">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                        className="rounded-xl hover:bg-white border border-slate-100 hover:border-slate-200 transition-all hover:translate-x-[-4px]"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </Button>
                    <div className="space-y-2">
                        <h1 className="text-5xl font-display font-black text-slate-900 tracking-tighter leading-none">New Project Studio</h1>
                        <p className="text-xl text-slate-500 font-medium">Configure your industrial datasets for scale.</p>
                    </div>
                </div>

                {/* Evolution Meter */}
                <div className="flex flex-col gap-4 min-w-[300px] noise glass p-6 rounded-[2rem]">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-indigo-600">
                        <span>Project Evolution</span>
                        <span className="text-slate-400">{Math.round((step / 3) * 100)}% Processed</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden p-[2px]">
                        <div
                            className="h-full bg-indigo-600 rounded-full transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(79,70,229,0.3)]"
                            style={{ width: `${(step / 3) * 100}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Stepper Navigation */}
            <div className="flex flex-wrap items-center gap-4">
                {STEPS.map((s, i) => (
                    <div key={s.id} className="flex items-center gap-4">
                        <button
                            onClick={() => { if (s.id < step) setStep(s.id); }}
                            className={cn(
                                "flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-black transition-all border",
                                s.id === step
                                    ? "bg-white border-indigo-600 text-indigo-600 shadow-2xl shadow-indigo-500/10"
                                    : s.id < step
                                        ? "bg-indigo-50 border-transparent text-indigo-700 hover:bg-indigo-100"
                                        : "bg-white border-slate-100 text-slate-300 opacity-60 pointer-events-none"
                            )}
                        >
                            <span className={cn(
                                "w-7 h-7 rounded-lg flex items-center justify-center text-[10px]",
                                s.id === step ? "bg-indigo-600 text-white" : s.id < step ? "bg-indigo-200 text-indigo-700" : "bg-slate-100 text-slate-300"
                            )}>
                                {s.id < step ? <Check className="w-4 h-4" /> : s.id}
                            </span>
                            {s.label}
                        </button>
                        {i < STEPS.length - 1 && <ChevronRight className="w-5 h-5 text-slate-200" />}
                    </div>
                ))}
            </div>

            {/* Step Content */}
            <div className="relative min-h-[500px]">
                {/* Step 1: Infrastructure */}
                {step === 1 && (
                    <div className="space-y-12 animate-slide-up">
                        <div className="text-center space-y-4 max-w-2xl mx-auto">
                            <h2 className="text-4xl font-display font-black text-slate-900 tracking-tight leading-tight">Select Infrastructure</h2>
                            <p className="text-slate-500 font-medium text-lg">Choose a plan that matches your project scale.</p>
                        </div>

                        <PlanSelector value={plan} onChange={setPlan} />

                        <div className="flex justify-end">
                            <Button
                                onClick={() => setStep(2)}
                                size="lg"
                                className="h-16 px-12 rounded-[1.25rem] text-lg font-black bg-slate-900 hover:bg-slate-800 text-white shadow-2xl transition-all active:scale-95 flex items-center gap-3"
                            >
                                Configure Studio <ArrowRight className="w-6 h-6" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 2: Configuration */}
                {step === 2 && (
                    <div className="grid lg:grid-cols-12 gap-12 animate-slide-up">
                        <div className="lg:col-span-8 space-y-12">
                            <section className="space-y-8">
                                <h2 className="text-3xl font-display font-black text-slate-900 leading-tight">Project Identity</h2>
                                <div className="space-y-4">
                                    <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Studio Name</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g., Q1 2026 COI Compliance Audit"
                                        className="h-16 px-8 rounded-2xl text-xl border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all font-display font-black"
                                    />
                                </div>
                            </section>

                            <section className="space-y-8">
                                <div className="flex items-center gap-4">
                                    <h2 className="text-2xl font-display font-black text-slate-900 tracking-tight">Industrial Requirements</h2>
                                    <div className="h-[1px] flex-1 bg-slate-100" />
                                </div>
                                {selectedTemplate ? (
                                    <div className="p-10 rounded-[2.5rem] bg-indigo-50/30 border border-indigo-100/50 space-y-10 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-8 opacity-[0.05]">
                                            <Brain className="w-32 h-32 text-indigo-600" />
                                        </div>
                                        <div className="flex items-center gap-6 relative z-10">
                                            <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-200">
                                                <Zap className="w-8 h-8 fill-white/20" />
                                            </div>
                                            <div>
                                                <h4 className="text-xl font-display font-black text-slate-900">{selectedTemplate.name}</h4>
                                                <p className="text-slate-500 font-medium">{selectedTemplate.category} Vertical Intelligence</p>
                                            </div>
                                        </div>

                                        {selectedTemplate.slug === 'coi' ? (
                                            <div className="grid md:grid-cols-2 gap-8 relative z-10">
                                                <div className="space-y-3">
                                                    <Label htmlFor="minLiability" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Min Liability ($)</Label>
                                                    <Input
                                                        id="minLiability"
                                                        type="number"
                                                        value={formData.requirements.minLiabilityPerOccurrence || ''}
                                                        onChange={(e) => setFormData({
                                                            ...formData,
                                                            requirements: { ...formData.requirements, minLiabilityPerOccurrence: Number(e.target.value) }
                                                        })}
                                                        placeholder="1,000,000"
                                                        className="h-14 px-6 rounded-xl border-slate-200 bg-white font-black"
                                                    />
                                                </div>
                                                <div className="space-y-3">
                                                    <Label htmlFor="minAggregate" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Min Aggregate ($)</Label>
                                                    <Input
                                                        id="minAggregate"
                                                        type="number"
                                                        value={formData.requirements.minGeneralAggregate || ''}
                                                        onChange={(e) => setFormData({
                                                            ...formData,
                                                            requirements: { ...formData.requirements, minGeneralAggregate: Number(e.target.value) }
                                                        })}
                                                        placeholder="2,000,000"
                                                        className="h-14 px-6 rounded-xl border-slate-200 bg-white font-black"
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="py-6 text-center bg-white/50 rounded-3xl border border-white relative z-10">
                                                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Standard Intelligent Field Mapping Active</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="p-10 rounded-[2.5rem] bg-slate-50 border border-slate-100 flex items-center justify-center">
                                        <div className="flex items-center gap-3 text-slate-400">
                                            <Clock className="w-5 h-5 animate-spin" />
                                            <span className="font-black uppercase tracking-widest text-[10px]">Loading Intelligence...</span>
                                        </div>
                                    </div>
                                )}
                            </section>

                            <div className="flex justify-between items-center pt-8">
                                <Button variant="ghost" onClick={() => setStep(1)} className="h-14 px-8 rounded-2xl font-black text-slate-500 hover:text-indigo-600 transition-colors">
                                    <ArrowLeft className="w-5 h-5 mr-3" /> Previous Step
                                </Button>
                                <Button
                                    onClick={() => setStep(3)}
                                    disabled={!formData.name || !formData.templateId}
                                    className="h-16 px-12 rounded-[1.25rem] text-lg font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xl shadow-indigo-500/10 transition-all active:scale-95 flex items-center gap-3"
                                >
                                    Orchestration Review <ArrowRight className="w-6 h-6" />
                                </Button>
                            </div>
                        </div>

                        {/* Summary Deck */}
                        <div className="lg:col-span-4 space-y-6">
                            <div className="noise glass rounded-[2.5rem] p-8 space-y-8 sticky top-32">
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-display font-black text-slate-900 tracking-tight">Studio Setup</h3>
                                    <p className="text-xs text-slate-500 font-medium">Build phase summary</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Plan</span>
                                        <Badge variant="outline" className="bg-indigo-50 text-indigo-600 border-indigo-100 font-black">{plan}</Badge>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Vertical</span>
                                        <span className="text-sm font-black text-slate-900">{selectedTemplate?.name || 'Pending'}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Monthly Capacity</span>
                                        <span className="text-sm font-black text-slate-900">{plan === 'FREE' ? '50 Pages' : 'Unlimited'}</span>
                                    </div>
                                </div>

                                <div className="p-6 rounded-3xl bg-indigo-600 text-white space-y-4">
                                    <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest opacity-80">
                                        <Sparkles className="w-4 h-4 fill-white/20" />
                                        Model Specification
                                    </div>
                                    <div className="text-2xl font-display font-black tracking-tight">{plan === 'FREE' ? 'GPT-4o-mini' : 'GPT-4o'}</div>
                                    <p className="text-[10px] opacity-70 font-medium tracking-wide leading-relaxed uppercase">Optimized for high-fidelity industrial extraction architecture.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 3: Deployment */}
                {step === 3 && (
                    <div className="max-w-4xl mx-auto space-y-12 animate-slide-up pb-20">
                        <div className="text-center space-y-6">
                            <div className="w-24 h-24 rounded-[2.5rem] bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-2xl shadow-indigo-500/20 group">
                                <Sparkles className="w-12 h-12 fill-white/20 group-hover:scale-110 transition-transform duration-500" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-5xl font-display font-black text-slate-900 tracking-tighter leading-none">Ready for Orchestration</h2>
                                <p className="text-xl text-slate-500 font-medium">Verify your intelligence parameters before studio deployment.</p>
                            </div>
                        </div>

                        <div className="grid gap-8">
                            <div className="p-10 rounded-[3rem] bg-white border border-slate-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] space-y-12 relative overflow-hidden">
                                <div className="absolute inset-0 grid-bg opacity-[0.05] pointer-events-none" />

                                <div className="grid md:grid-cols-2 gap-16 relative z-10">
                                    <div className="space-y-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Studio Configuration</span>
                                        <p className="text-2xl font-display font-black text-slate-900 leading-tight">{formData.name}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Model Architecture</span>
                                        <div className="flex items-center gap-3 text-2xl font-display font-black text-indigo-600">
                                            <Zap className="w-6 h-6 fill-indigo-100" />
                                            {selectedTemplate?.name} Intelligence
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Resource Tier</span>
                                        <div className="flex items-center gap-3 text-2xl font-display font-black text-slate-900">
                                            {plan === 'FREE' ? <Badge className="bg-slate-100 text-slate-600">Free</Badge> : <Badge className="bg-indigo-600 text-white border-none">PRO (BYO)</Badge>}
                                            <span className="text-slate-400 font-medium">/ {plan === 'FREE' ? '50 Pg' : 'Unlimited'}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Extraction Engine</span>
                                        <p className="text-2xl font-display font-black text-slate-900">{plan === 'FREE' ? 'GPT-4o-mini' : 'GPT-4o'}</p>
                                    </div>
                                </div>

                                <div className="h-[1px] bg-slate-100 flex items-center justify-center">
                                    <div className="bg-white px-6 text-[11px] font-black text-slate-300 uppercase tracking-[0.3em]">Specs Ledger</div>
                                </div>

                                <div className="grid md:grid-cols-3 gap-8 relative z-10">
                                    <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100/50 space-y-1">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Orchestrator</span>
                                        <span className="text-base font-black text-slate-700">{plan === 'FREE' ? 'Shared' : 'Dedicated (BYO)'}</span>
                                    </div>
                                    <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100/50 space-y-1">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Chunk Methodology</span>
                                        <span className="text-base font-black text-slate-700">{plan === 'FREE' ? 'Linear (Page)' : 'Semantic (Headings)'}</span>
                                    </div>
                                    <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100/50 space-y-1">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Precision export</span>
                                        <span className="text-base font-black text-slate-700">{plan === 'FREE' ? 'CSV Only' : 'CSV, JSON, SQL'}</span>
                                    </div>
                                </div>
                            </div>

                            {plan === 'BYO' && (
                                <div className="p-6 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center gap-6 animate-pulse">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-200">
                                        <Lock className="w-6 h-6" />
                                    </div>
                                    <p className="text-sm font-bold text-indigo-700 leading-relaxed">Infrastructure check: Ensure your API key is configured in Workspace Settings for successful deployment.</p>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col md:flex-row justify-between items-center gap-8 pt-10">
                            <Button variant="ghost" onClick={() => setStep(2)} className="h-16 px-10 rounded-2xl font-black text-slate-400 hover:text-indigo-600 transition-colors">
                                <ArrowLeft className="w-5 h-5 mr-3" /> Adjustment required
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="h-20 px-16 rounded-[1.5rem] text-2xl font-black bg-indigo-600 hover:bg-slate-900 text-white shadow-[0_20px_40px_-10px_rgba(79,70,229,0.3)] hover:translate-y-[-4px] active:scale-95 transition-all flex items-center gap-4"
                            >
                                {loading ? (
                                    <>
                                        <Clock className="w-6 h-6 animate-spin" /> Orchestrating...
                                    </>
                                ) : (
                                    <>
                                        Launch Studio <Sparkles className="w-6 h-6 fill-white/20" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function NewProjectPage() {
    return (
        <Suspense fallback={<div>Loading wizard...</div>}>
            <NewProjectContent />
        </Suspense>
    );
}

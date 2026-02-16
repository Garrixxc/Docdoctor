'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Check, Zap, Brain, ShieldCheck, ChevronRight, Lock } from 'lucide-react';
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
        <div className="container mx-auto px-4 py-8 max-w-5xl">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-white border-transparent hover:border-gray-100">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">New Extraction Project</h1>
                        <p className="text-gray-500 font-medium">Configure your industrial datasets studio</p>
                    </div>
                </div>

                {/* Progress Visual */}
                <div className="flex flex-col gap-2 min-w-[200px]">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-blue-600">
                        <span>Step {step} of 3</span>
                        <span>{Math.round((step / 3) * 100)}%</span>
                    </div>
                    <Progress value={(step / 3) * 100} className="h-2 rounded-full" />
                </div>
            </div>

            {/* Steps Navigation Sidebar / Top */}
            <div className="flex flex-wrap items-center gap-3 mb-12">
                {STEPS.map((s, i) => (
                    <div key={s.id} className="flex items-center gap-3">
                        <button
                            onClick={() => { if (s.id < step) setStep(s.id); }}
                            className={cn(
                                "flex items-center gap-3 px-6 py-3 rounded-2xl text-sm font-bold transition-all border-2",
                                s.id === step
                                    ? "bg-white border-blue-600 text-blue-600 shadow-xl shadow-blue-500/10"
                                    : s.id < step
                                        ? "bg-blue-50 border-transparent text-blue-700 hover:bg-blue-100"
                                        : "bg-white border-gray-100 text-gray-400 opacity-60 pointer-events-none"
                            )}
                        >
                            <span className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center text-[10px]",
                                s.id === step ? "bg-blue-600 text-white" : s.id < step ? "bg-blue-200 text-blue-700" : "bg-gray-100 text-gray-400"
                            )}>
                                {s.id < step ? <Check className="w-3 h-3" /> : s.id}
                            </span>
                            {s.label}
                        </button>
                        {i < STEPS.length - 1 && <ChevronRight className="w-4 h-4 text-gray-300" />}
                    </div>
                ))}
            </div>

            {/* Step 1: Plan Selection */}
            {step === 1 && (
                <div className="space-y-8 animate-slide-up">
                    <div className="text-center space-y-4 max-w-2xl mx-auto mb-10">
                        <h2 className="text-3xl font-black text-gray-900">Choose your processing plan</h2>
                        <p className="text-gray-500 font-medium">Use our community defaults or unlock ultimate scale with your own API key.</p>
                    </div>

                    <PlanSelector value={plan} onChange={setPlan} />

                    <div className="flex justify-end pt-8">
                        <Button
                            onClick={() => setStep(2)}
                            size="lg"
                            className="h-14 px-10 rounded-2xl text-lg font-bold shadow-xl shadow-blue-500/10"
                        >
                            Configure Project <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Step 2: Project Details */}
            {step === 2 && (
                <div className="grid lg:grid-cols-3 gap-12 animate-slide-up">
                    <div className="lg:col-span-2 space-y-8">
                        <section className="space-y-6">
                            <h2 className="text-3xl font-black text-gray-900">Project Details</h2>
                            <div className="grid gap-6">
                                <div className="space-y-3">
                                    <Label htmlFor="name" className="text-base font-bold text-gray-700">Name your dataset collection</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g., Q1 2026 COI Compliance Review"
                                        className="h-14 px-6 rounded-2xl text-lg border-2 focus-visible:ring-blue-500/20"
                                    />
                                    <p className="text-xs text-gray-400 font-medium ml-2 uppercase tracking-wide">Enter a unique name to identify your project results</p>
                                </div>
                            </div>
                        </section>

                        <section className="space-y-6">
                            <h2 className="text-2xl font-black text-gray-900">Industrial Requirements</h2>
                            {selectedTemplate ? (
                                <div className="p-8 rounded-[2rem] bg-gray-50/50 border-2 border-dashed border-gray-200 space-y-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white">
                                            <Zap className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900">Configuring for {selectedTemplate.name}</h4>
                                            <p className="text-sm text-gray-500 font-medium">{selectedTemplate.category} Vertical</p>
                                        </div>
                                    </div>

                                    {selectedTemplate.slug === 'coi' && (
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="minLiability" className="text-xs font-black uppercase tracking-widest text-gray-500">Min Liability ($)</Label>
                                                <Input
                                                    id="minLiability"
                                                    type="number"
                                                    value={formData.requirements.minLiabilityPerOccurrence || ''}
                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        requirements: { ...formData.requirements, minLiabilityPerOccurrence: Number(e.target.value) }
                                                    })}
                                                    placeholder="1,000,000"
                                                    className="h-12 px-4 rounded-xl border-2"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="minAggregate" className="text-xs font-black uppercase tracking-widest text-gray-500">Min Aggregate ($)</Label>
                                                <Input
                                                    id="minAggregate"
                                                    type="number"
                                                    value={formData.requirements.minGeneralAggregate || ''}
                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        requirements: { ...formData.requirements, minGeneralAggregate: Number(e.target.value) }
                                                    })}
                                                    placeholder="2,000,000"
                                                    className="h-12 px-4 rounded-xl border-2"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {selectedTemplate.slug !== 'coi' && (
                                        <div className="flex items-center justify-center py-6 text-center">
                                            <p className="text-gray-400 text-sm font-medium italic">No custom requirements needed for this vertical.<br />Standard extraction fields will be used.</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="p-8 rounded-[2rem] bg-gray-50 text-center border-2 border-dashed border-gray-200">
                                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Loading Template Configuration...</p>
                                </div>
                            )}
                        </section>

                        <div className="flex justify-between pt-8">
                            <Button variant="ghost" onClick={() => setStep(1)} className="h-14 px-8 rounded-2xl font-bold">
                                <ArrowLeft className="w-5 h-5 mr-2" /> Change Plan
                            </Button>
                            <Button
                                onClick={() => setStep(3)}
                                disabled={!formData.name || !formData.templateId}
                                className="h-14 px-10 rounded-2xl text-lg font-bold shadow-xl shadow-blue-500/10"
                            >
                                Review Project <ArrowRight className="w-5 h-5 ml-2" />
                            </Button>
                        </div>
                    </div>

                    {/* Sidebar Summary */}
                    <div className="space-y-6">
                        <Card className="rounded-[2.5rem] border-none shadow-2xl shadow-blue-500/5 bg-white overflow-hidden">
                            <CardHeader className="bg-gray-50/50 border-b border-gray-100">
                                <CardTitle className="text-lg font-black">Project Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="space-y-4">
                                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-gray-400">
                                        <span>Plan</span>
                                        <Badge variant="outline" className="text-blue-600 bg-blue-50 border-blue-100">{plan}</Badge>
                                    </div>
                                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-gray-400">
                                        <span>Vertical</span>
                                        <span className="text-gray-900">{selectedTemplate?.name || '---'}</span>
                                    </div>
                                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-gray-400">
                                        <span>Pages / Mo</span>
                                        <span className="text-gray-900 font-black">{plan === 'FREE' ? '50' : 'Unlimited'}</span>
                                    </div>
                                </div>
                                <div className="p-4 rounded-2xl bg-blue-600 text-white space-y-2">
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-80">
                                        <Brain className="w-3 h-3" />
                                        Default Model
                                    </div>
                                    <div className="text-lg font-black">{plan === 'FREE' ? 'GPT-4o-mini' : 'GPT-4o'}</div>
                                    <p className="text-[10px] opacity-70 font-medium">Higher accuracy for complex layouts.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            {/* Step 3: Confirmation */}
            {step === 3 && (
                <div className="max-w-3xl mx-auto space-y-12 animate-slide-up">
                    <div className="text-center space-y-4">
                        <div className="w-20 h-20 rounded-3xl bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-500/10">
                            <ShieldCheck className="w-10 h-10" />
                        </div>
                        <h2 className="text-4xl font-black text-gray-900">Ready to go!</h2>
                        <p className="text-gray-500 text-lg font-medium">Review your project configuration before starting the studio.</p>
                    </div>

                    <div className="grid gap-4">
                        <div className="p-8 rounded-[2.5rem] bg-white border border-gray-100 shadow-xl space-y-8">
                            <div className="grid md:grid-cols-2 gap-12">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Project Name</span>
                                    <p className="text-xl font-black text-gray-900">{formData.name}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Extraction Vertical</span>
                                    <p className="text-xl font-black text-blue-600">{selectedTemplate?.name}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Selected Plan</span>
                                    <div className="flex items-center gap-2 text-xl font-black text-gray-900">
                                        {plan === 'FREE' ? <Zap className="w-5 h-5 text-amber-500 fill-amber-500" /> : <ShieldCheck className="w-5 h-5 text-indigo-600" />}
                                        {plan === 'FREE' ? 'Free Tier' : 'BYO Key'}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Monthly Limit</span>
                                    <p className="text-xl font-black text-gray-900">{plan === 'FREE' ? '50 Pages' : 'Unlimited'}</p>
                                </div>
                            </div>

                            <div className="h-[1px] bg-gray-50 flex items-center justify-center">
                                <div className="bg-white px-4 text-[10px] font-black text-gray-300 uppercase tracking-widest">Advanced Details</div>
                            </div>

                            <div className="grid md:grid-cols-3 gap-6">
                                <div className="p-4 rounded-2xl bg-gray-50 text-center">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-1">Model</span>
                                    <span className="text-sm font-bold text-gray-700">{plan === 'FREE' ? 'gpt-4o-mini' : 'gpt-4o'}</span>
                                </div>
                                <div className="p-4 rounded-2xl bg-gray-50 text-center">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-1">Chunking</span>
                                    <span className="text-sm font-bold text-gray-700">{plan === 'FREE' ? 'by_pages' : 'headings'}</span>
                                </div>
                                <div className="p-4 rounded-2xl bg-gray-50 text-center">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-1">Export</span>
                                    <span className="text-sm font-bold text-gray-700">{plan === 'FREE' ? 'CSV' : 'CSV, JSON'}</span>
                                </div>
                            </div>
                        </div>

                        {plan === 'BYO' && (
                            <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <p className="text-sm font-medium text-indigo-700">Make sure you have added your OpenAI API key in Workspace Settings to run this project.</p>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between items-center">
                        <Button variant="ghost" onClick={() => setStep(2)} className="h-14 px-8 rounded-2xl font-bold">
                            <ArrowLeft className="w-5 h-5 mr-2" /> Back to Details
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="h-14 px-12 rounded-2xl text-xl font-black bg-blue-600 hover:bg-blue-700 shadow-2xl shadow-blue-500/20 active:scale-95 transition-all"
                        >
                            {loading ? "Creating Studio..." : "Launch Project"}
                        </Button>
                    </div>
                </div>
            )}
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

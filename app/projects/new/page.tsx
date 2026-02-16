'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, Check, Plus, Zap, Brain } from 'lucide-react';
import TemplateCard from '@/components/TemplateCard';
import {
    DEFAULT_SIMPLE_SETTINGS,
    AVAILABLE_MODELS,
    AVAILABLE_CHUNKING_METHODS,
    DEFAULT_ADVANCED_SETTINGS,
} from '@/types/settings-types';

interface Template {
    id: string;
    name: string;
    slug: string;
    category: string;
    config: any;
}

const STEPS = [
    { id: 1, label: 'Template' },
    { id: 2, label: 'Details' },
    { id: 3, label: 'Settings' },
];

export default function NewProjectPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(false);

    // Form data
    const [formData, setFormData] = useState({
        name: '',
        templateId: '',
        requirements: {} as any,
    });

    // Settings
    const [settingsMode, setSettingsMode] = useState<'simple' | 'advanced'>('simple');
    const [costVsAccuracy, setCostVsAccuracy] = useState(DEFAULT_SIMPLE_SETTINGS.costVsAccuracy);
    const [speedVsThoroughness, setSpeedVsThoroughness] = useState(DEFAULT_SIMPLE_SETTINGS.speedVsThoroughness);
    const [chunkingMethod, setChunkingMethod] = useState(DEFAULT_ADVANCED_SETTINGS.chunkingMethod);
    const [chunkSize, setChunkSize] = useState(DEFAULT_ADVANCED_SETTINGS.chunkSize);
    const [overlap, setOverlap] = useState(DEFAULT_ADVANCED_SETTINGS.overlap);
    const [model, setModel] = useState(DEFAULT_ADVANCED_SETTINGS.model);
    const [autoAcceptThreshold, setAutoAcceptThreshold] = useState(DEFAULT_ADVANCED_SETTINGS.autoAcceptThreshold);
    const [needsReviewThreshold, setNeedsReviewThreshold] = useState(DEFAULT_ADVANCED_SETTINGS.needsReviewThreshold);
    const [maxCostPerRun, setMaxCostPerRun] = useState<string>('');

    useEffect(() => {
        fetchTemplates();
    }, []);

    async function fetchTemplates() {
        try {
            const res = await fetch('/api/templates');
            const data = await res.json();
            setTemplates(data.templates || []);
        } catch (err) {
            console.error('Failed to fetch templates:', err);
        }
    }

    const selectedTemplate = templates.find((t) => t.id === formData.templateId);

    async function handleSubmit() {
        setLoading(true);
        try {
            // Build extraction settings
            const extractionSettings: any = { settingsMode };

            if (settingsMode === 'simple') {
                extractionSettings.costVsAccuracy = costVsAccuracy;
                extractionSettings.speedVsThoroughness = speedVsThoroughness;
                // Map simple → advanced
                const mappedModel = costVsAccuracy <= 30 ? 'gpt-4o-mini' : costVsAccuracy <= 70 ? 'gpt-4o' : 'gpt-4-turbo';
                extractionSettings.model = mappedModel;
                extractionSettings.chunkingMethod = speedVsThoroughness ? 'by_pages' : 'headings';
                extractionSettings.chunkSize = speedVsThoroughness ? 6000 : 3000;
                extractionSettings.overlap = speedVsThoroughness ? 100 : 300;
                extractionSettings.temperature = 0.1;
                extractionSettings.autoAcceptThreshold = costVsAccuracy > 50 ? 0.92 : 0.95;
                extractionSettings.needsReviewThreshold = costVsAccuracy > 50 ? 0.65 : 0.7;
                extractionSettings.maxCostPerRun = costVsAccuracy <= 30 ? 5.0 : costVsAccuracy <= 70 ? 15.0 : null;
            } else {
                extractionSettings.chunkingMethod = chunkingMethod;
                extractionSettings.chunkSize = chunkSize;
                extractionSettings.overlap = overlap;
                extractionSettings.provider = 'openai';
                extractionSettings.model = model;
                extractionSettings.temperature = 0.1;
                extractionSettings.autoAcceptThreshold = autoAcceptThreshold;
                extractionSettings.needsReviewThreshold = needsReviewThreshold;
                extractionSettings.maxCostPerRun = maxCostPerRun ? Number(maxCostPerRun) : null;
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
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="flex items-center gap-3 mb-8">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold">Create New Project</h1>
                    <p className="text-gray-500 text-sm mt-1">Configure your document extraction pipeline</p>
                </div>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-2 mb-10">
                {STEPS.map((s, i) => (
                    <div key={s.id} className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                if (s.id < step) setStep(s.id);
                            }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${s.id === step
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                                    : s.id < step
                                        ? 'bg-green-100 text-green-700 cursor-pointer hover:bg-green-200'
                                        : 'bg-gray-100 text-gray-400'
                                }`}
                        >
                            {s.id < step ? (
                                <Check className="w-4 h-4" />
                            ) : (
                                <span className="w-5 h-5 rounded-full bg-current/10 flex items-center justify-center text-xs">
                                    {s.id}
                                </span>
                            )}
                            {s.label}
                        </button>
                        {i < STEPS.length - 1 && (
                            <div className={`w-12 h-0.5 ${s.id < step ? 'bg-green-400' : 'bg-gray-200'}`} />
                        )}
                    </div>
                ))}
            </div>

            {/* Step 1: Template Selection */}
            {step === 1 && (
                <div>
                    <h2 className="text-xl font-semibold mb-2">Choose a Template</h2>
                    <p className="text-gray-500 text-sm mb-6">
                        Select the document type you want to extract data from
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                        {templates.map((template) => (
                            <TemplateCard
                                key={template.id}
                                template={template}
                                selected={formData.templateId === template.id}
                                onClick={() =>
                                    setFormData({ ...formData, templateId: template.id })
                                }
                            />
                        ))}
                    </div>
                    <div className="flex justify-end">
                        <Button
                            onClick={() => setStep(2)}
                            disabled={!formData.templateId}
                            className="min-w-[140px]"
                        >
                            Next <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Step 2: Project Details */}
            {step === 2 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Project Details</CardTitle>
                        <CardDescription>
                            Name your project and set requirements for{' '}
                            <span className="font-medium text-blue-600">
                                {selectedTemplate?.name || 'your template'}
                            </span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <Label htmlFor="name">Project Name</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({ ...formData, name: e.target.value })
                                }
                                placeholder="e.g., Q1 2025 Vendor Review"
                                className="mt-1"
                            />
                        </div>

                        {/* Dynamic requirements based on template */}
                        {selectedTemplate?.slug === 'coi' && (
                            <div className="space-y-4">
                                <h3 className="font-medium text-sm text-gray-700">
                                    Compliance Requirements (optional)
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="minLiability">Min Liability per Occurrence ($)</Label>
                                        <Input
                                            id="minLiability"
                                            type="number"
                                            value={formData.requirements.minLiabilityPerOccurrence || ''}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    requirements: {
                                                        ...formData.requirements,
                                                        minLiabilityPerOccurrence: Number(e.target.value),
                                                    },
                                                })
                                            }
                                            placeholder="e.g., 1000000"
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="minAggregate">Min Aggregate ($)</Label>
                                        <Input
                                            id="minAggregate"
                                            type="number"
                                            value={formData.requirements.minGeneralAggregate || ''}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    requirements: {
                                                        ...formData.requirements,
                                                        minGeneralAggregate: Number(e.target.value),
                                                    },
                                                })
                                            }
                                            placeholder="e.g., 2000000"
                                            className="mt-1"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between pt-4">
                            <Button variant="outline" onClick={() => setStep(1)}>
                                <ArrowLeft className="w-4 h-4 mr-1" /> Back
                            </Button>
                            <Button
                                onClick={() => setStep(3)}
                                disabled={!formData.name}
                                className="min-w-[140px]"
                            >
                                Next <ArrowRight className="w-4 h-4 ml-1" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Step 3: Settings */}
            {step === 3 && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Extraction Settings</CardTitle>
                                <CardDescription>
                                    Configure how documents are processed
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                                <button
                                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${settingsMode === 'simple'
                                            ? 'bg-white dark:bg-gray-700 shadow text-blue-600'
                                            : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                    onClick={() => setSettingsMode('simple')}
                                >
                                    <Zap className="w-3.5 h-3.5 inline mr-1" />
                                    Simple
                                </button>
                                <button
                                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${settingsMode === 'advanced'
                                            ? 'bg-white dark:bg-gray-700 shadow text-blue-600'
                                            : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                    onClick={() => setSettingsMode('advanced')}
                                >
                                    <Brain className="w-3.5 h-3.5 inline mr-1" />
                                    Advanced
                                </button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {settingsMode === 'simple' ? (
                            <>
                                {/* Cost vs Accuracy */}
                                <div>
                                    <Label className="text-sm font-medium">Cost vs. Accuracy</Label>
                                    <p className="text-xs text-gray-500 mb-3">
                                        Lower = faster & cheaper, Higher = more accurate & expensive
                                    </p>
                                    <div className="flex items-center gap-4">
                                        <span className="text-xs text-gray-400 w-16">💰 Economy</span>
                                        <input
                                            type="range" min="0" max="100"
                                            value={costVsAccuracy}
                                            onChange={(e) => setCostVsAccuracy(Number(e.target.value))}
                                            className="flex-1 h-2 bg-gradient-to-r from-green-300 via-yellow-300 to-red-300 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                        />
                                        <span className="text-xs text-gray-400 w-16 text-right">🎯 Precise</span>
                                    </div>
                                    <div className="text-center mt-1">
                                        <Badge variant="outline" className="text-xs">
                                            {costVsAccuracy <= 30 ? 'GPT-4o Mini' : costVsAccuracy <= 70 ? 'GPT-4o' : 'GPT-4 Turbo'}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Speed Toggle */}
                                <div>
                                    <Label className="text-sm font-medium">Speed vs. Thoroughness</Label>
                                    <div className="flex gap-4 mt-3">
                                        <button
                                            onClick={() => setSpeedVsThoroughness(true)}
                                            className={`flex-1 p-3 rounded-lg border-2 text-sm transition-all ${speedVsThoroughness ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            ⚡ Speed<br />
                                            <span className="text-xs text-gray-500">Page chunks, faster</span>
                                        </button>
                                        <button
                                            onClick={() => setSpeedVsThoroughness(false)}
                                            className={`flex-1 p-3 rounded-lg border-2 text-sm transition-all ${!speedVsThoroughness ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            🔬 Thorough<br />
                                            <span className="text-xs text-gray-500">Heading chunks, detailed</span>
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Advanced Chunking */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <Label className="text-sm font-medium">Chunking Method</Label>
                                        <select
                                            value={chunkingMethod}
                                            onChange={(e) => setChunkingMethod(e.target.value as any)}
                                            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 dark:border-gray-600"
                                        >
                                            {AVAILABLE_CHUNKING_METHODS.map((m) => (
                                                <option key={m.value} value={m.value}>{m.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium">Chunk Size</Label>
                                        <Input type="number" value={chunkSize} onChange={(e) => setChunkSize(Number(e.target.value))} className="mt-1" min={500} max={16000} />
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium">Overlap</Label>
                                        <Input type="number" value={overlap} onChange={(e) => setOverlap(Number(e.target.value))} className="mt-1" min={0} max={2000} />
                                    </div>
                                </div>

                                {/* Model & Cost */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-sm font-medium">Model</Label>
                                        <select
                                            value={model}
                                            onChange={(e) => setModel(e.target.value)}
                                            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 dark:border-gray-600"
                                        >
                                            {AVAILABLE_MODELS.map((m) => (
                                                <option key={m.value} value={m.value}>{m.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium">Max Cost per Run ($)</Label>
                                        <Input type="number" value={maxCostPerRun} onChange={(e) => setMaxCostPerRun(e.target.value)} placeholder="No limit" className="mt-1" min={0} step={0.5} />
                                    </div>
                                </div>

                                {/* Thresholds */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-sm font-medium">Auto-Accept: {autoAcceptThreshold.toFixed(2)}</Label>
                                        <input type="range" min="0.5" max="1.0" step="0.01" value={autoAcceptThreshold} onChange={(e) => setAutoAcceptThreshold(Number(e.target.value))} className="w-full mt-2 h-2 rounded-lg appearance-none cursor-pointer accent-green-600 bg-gray-200" />
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium">Needs Review: {needsReviewThreshold.toFixed(2)}</Label>
                                        <input type="range" min="0.1" max="0.9" step="0.01" value={needsReviewThreshold} onChange={(e) => setNeedsReviewThreshold(Number(e.target.value))} className="w-full mt-2 h-2 rounded-lg appearance-none cursor-pointer accent-amber-600 bg-gray-200" />
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="flex justify-between pt-4">
                            <Button variant="outline" onClick={() => setStep(2)}>
                                <ArrowLeft className="w-4 h-4 mr-1" /> Back
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="min-w-[160px]"
                            >
                                {loading ? (
                                    'Creating...'
                                ) : (
                                    <>
                                        <Plus className="w-4 h-4 mr-1" />
                                        Create Project
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

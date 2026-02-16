'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Settings2, ChevronDown, ChevronUp, Key, Zap, Brain, Save, Shield } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import {
    AVAILABLE_MODELS,
    AVAILABLE_CHUNKING_METHODS,
    DEFAULT_ADVANCED_SETTINGS,
    DEFAULT_SIMPLE_SETTINGS,
} from '@/types/settings-types';

interface ProjectSettingsTabProps {
    projectId: string;
    onSave?: () => void;
}

export default function ProjectSettingsTab({ projectId, onSave }: ProjectSettingsTabProps) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [mode, setMode] = useState<'simple' | 'advanced'>('simple');
    const [showApiKey, setShowApiKey] = useState(false);

    // Simple settings
    const [costVsAccuracy, setCostVsAccuracy] = useState(DEFAULT_SIMPLE_SETTINGS.costVsAccuracy);
    const [speedVsThoroughness, setSpeedVsThoroughness] = useState(DEFAULT_SIMPLE_SETTINGS.speedVsThoroughness);

    // Advanced settings
    const [chunkingMethod, setChunkingMethod] = useState(DEFAULT_ADVANCED_SETTINGS.chunkingMethod);
    const [chunkSize, setChunkSize] = useState(DEFAULT_ADVANCED_SETTINGS.chunkSize);
    const [overlap, setOverlap] = useState(DEFAULT_ADVANCED_SETTINGS.overlap);
    const [provider, setProvider] = useState(DEFAULT_ADVANCED_SETTINGS.provider);
    const [model, setModel] = useState(DEFAULT_ADVANCED_SETTINGS.model);
    const [autoAcceptThreshold, setAutoAcceptThreshold] = useState(DEFAULT_ADVANCED_SETTINGS.autoAcceptThreshold);
    const [needsReviewThreshold, setNeedsReviewThreshold] = useState(DEFAULT_ADVANCED_SETTINGS.needsReviewThreshold);
    const [maxCostPerRun, setMaxCostPerRun] = useState<string>('');

    // API key settings
    const [apiKeyMode, setApiKeyMode] = useState('PLATFORM');
    const [hasProjectKey, setHasProjectKey] = useState(false);
    const [newApiKey, setNewApiKey] = useState('');

    useEffect(() => {
        loadSettings();
    }, [projectId]);

    async function loadSettings() {
        try {
            const res = await fetch(`/api/projects/${projectId}/settings`);
            const data = await res.json();

            const settings = data.extractionSettings || {};
            setApiKeyMode(data.apiKeyMode || 'PLATFORM');
            setHasProjectKey(data.hasProjectKey || false);

            // Load settings
            if (settings.chunkingMethod) setChunkingMethod(settings.chunkingMethod);
            if (settings.chunkSize) setChunkSize(settings.chunkSize);
            if (settings.overlap !== undefined) setOverlap(settings.overlap);
            if (settings.provider) setProvider(settings.provider);
            if (settings.model) setModel(settings.model);
            if (settings.autoAcceptThreshold !== undefined) setAutoAcceptThreshold(settings.autoAcceptThreshold);
            if (settings.needsReviewThreshold !== undefined) setNeedsReviewThreshold(settings.needsReviewThreshold);
            if (settings.maxCostPerRun !== undefined && settings.maxCostPerRun !== null) {
                setMaxCostPerRun(String(settings.maxCostPerRun));
            }
            if (settings.costVsAccuracy !== undefined) setCostVsAccuracy(settings.costVsAccuracy);
            if (settings.speedVsThoroughness !== undefined) setSpeedVsThoroughness(settings.speedVsThoroughness);
            if (settings.settingsMode === 'advanced') setMode('advanced');
        } catch (err) {
            console.error('Failed to load settings:', err);
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        setSaving(true);
        try {
            const extractionSettings: any = {
                settingsMode: mode,
            };

            if (mode === 'simple') {
                extractionSettings.costVsAccuracy = costVsAccuracy;
                extractionSettings.speedVsThoroughness = speedVsThoroughness;

                // Map simple → advanced for execution
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
                extractionSettings.provider = provider;
                extractionSettings.model = model;
                extractionSettings.temperature = 0.1;
                extractionSettings.autoAcceptThreshold = autoAcceptThreshold;
                extractionSettings.needsReviewThreshold = needsReviewThreshold;
                extractionSettings.maxCostPerRun = maxCostPerRun ? Number(maxCostPerRun) : null;
            }

            const body: any = { extractionSettings };

            // Handle API key updates
            if (apiKeyMode !== 'PLATFORM') {
                body.apiKeyMode = apiKeyMode;
                if (newApiKey) {
                    body.apiKey = newApiKey;
                }
            } else {
                body.apiKeyMode = 'PLATFORM';
            }

            const res = await fetch(`/api/projects/${projectId}/settings`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                setNewApiKey('');
                await loadSettings();
                onSave?.();
                alert('Settings archived successfully.');
            }
        } catch (err) {
            console.error('Failed to save settings:', err);
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="animate-pulse space-y-4">
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-8 bg-gray-200 rounded"></div>
                        <div className="h-8 bg-gray-200 rounded"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-8">
            {/* Mode Toggle */}
            <Card className="border-slate-100 shadow-xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden">
                <CardHeader className="p-10 border-b border-slate-50 bg-slate-50/30">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                                    <Settings2 className="w-5 h-5" />
                                </div>
                                <CardTitle className="text-2xl font-outfit font-bold text-slate-900 tracking-tight">Studio Intelligence</CardTitle>
                            </div>
                            <CardDescription className="text-slate-500 font-medium">Configure how the DocDoctor engine processes your datasets.</CardDescription>
                        </div>
                        <div className="flex items-center gap-1 bg-slate-100 rounded-2xl p-1.5 w-fit">
                            <button
                                className={`px-5 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${mode === 'simple'
                                    ? 'bg-white shadow-lg shadow-slate-200 text-indigo-600'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                                onClick={() => setMode('simple')}
                            >
                                <Zap className="w-3.5 h-3.5" />
                                SIMPLE
                            </button>
                            <button
                                className={`px-5 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${mode === 'advanced'
                                    ? 'bg-white shadow-lg shadow-slate-200 text-indigo-600'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                                onClick={() => setMode('advanced')}
                            >
                                <Brain className="w-3.5 h-3.5" />
                                ADVANCED
                            </button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-10 space-y-10">
                    {mode === 'simple' ? (
                        <>
                            {/* Cost vs Accuracy Slider */}
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-base font-bold text-slate-900">
                                        Logic Precision vs. Resource Cost
                                    </Label>
                                    <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                        Economy models are faster and cheaper for volume work, while Precise models are recommended for subtle legal terminology.
                                    </p>
                                </div>
                                <div className="p-8 rounded-3xl bg-slate-50/50 border border-slate-100 space-y-8">
                                    <div className="flex items-center gap-6">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest min-w-[80px]">💰 Economy</span>
                                        <div className="relative flex-1">
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={costVsAccuracy}
                                                onChange={(e) => setCostVsAccuracy(Number(e.target.value))}
                                                className="w-full h-2.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-indigo-600"
                                            />
                                            <div className="absolute -bottom-6 left-0 right-0 flex justify-between px-1">
                                                <div className="w-0.5 h-1 bg-slate-200" />
                                                <div className="w-0.5 h-1 bg-slate-200" />
                                                <div className="w-0.5 h-1 bg-slate-200" />
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest min-w-[80px] text-right">🎯 Precise</span>
                                    </div>
                                    <div className="flex justify-center">
                                        <Badge variant="outline" className="bg-white border-slate-100 text-indigo-600 font-bold px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest shadow-sm">
                                            Orchestrating via {costVsAccuracy <= 30
                                                ? 'GPT-4o Mini Core'
                                                : costVsAccuracy <= 70
                                                    ? 'GPT-4o High-Resolution'
                                                    : 'GPT-4 Turbo Pro'}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            {/* Speed vs Thoroughness Toggle */}
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <Label className="text-base font-bold text-slate-900">
                                        Chunking Strategy
                                    </Label>
                                    <p className="text-sm text-slate-500 font-medium">
                                        Balance between processing speed and contextual thoroughness.
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setSpeedVsThoroughness(true)}
                                        className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all group ${speedVsThoroughness
                                            ? 'border-indigo-600 bg-indigo-50/30'
                                            : 'border-slate-100 bg-white hover:border-slate-200'
                                            }`}
                                    >
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                                            speedVsThoroughness ? "bg-indigo-600 text-white" : "bg-slate-50 text-slate-400 group-hover:text-indigo-600"
                                        )}>
                                            <Zap className="w-5 h-5" />
                                        </div>
                                        <div className="text-center">
                                            <span className="block font-bold text-slate-900">High Velocity</span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Page-based segmentation</span>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => setSpeedVsThoroughness(false)}
                                        className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all group ${!speedVsThoroughness
                                            ? 'border-indigo-600 bg-indigo-50/30'
                                            : 'border-slate-100 bg-white hover:border-slate-200'
                                            }`}
                                    >
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                                            !speedVsThoroughness ? "bg-indigo-600 text-white" : "bg-slate-50 text-slate-400 group-hover:text-indigo-600"
                                        )}>
                                            <Brain className="w-5 h-5" />
                                        </div>
                                        <div className="text-center">
                                            <span className="block font-bold text-slate-900">Deep Context</span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Semantic heading analysis</span>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Chunking Settings */}
                            <div className="space-y-6">
                                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Segmentation Architecture</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="chunkingMethod" className="text-xs font-bold text-slate-600 uppercase tracking-widest">Method</Label>
                                        <select
                                            id="chunkingMethod"
                                            value={chunkingMethod}
                                            onChange={(e) => setChunkingMethod(e.target.value as any)}
                                            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                                        >
                                            {AVAILABLE_CHUNKING_METHODS.map((m) => (
                                                <option key={m.value} value={m.value}>
                                                    {m.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="chunkSize" className="text-xs font-bold text-slate-600 uppercase tracking-widest">Chunk Size (Tokens)</Label>
                                        <Input
                                            id="chunkSize"
                                            type="number"
                                            value={chunkSize}
                                            onChange={(e) => setChunkSize(Number(e.target.value))}
                                            className="h-12 rounded-xl border-slate-200 font-medium"
                                            min={500}
                                            max={16000}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="overlap" className="text-xs font-bold text-slate-600 uppercase tracking-widest">Overlap (Tokens)</Label>
                                        <Input
                                            id="overlap"
                                            type="number"
                                            value={overlap}
                                            onChange={(e) => setOverlap(Number(e.target.value))}
                                            className="h-12 rounded-xl border-slate-200 font-medium"
                                            min={0}
                                            max={2000}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Model Settings */}
                            <div className="space-y-6">
                                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Compute Layer</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="model" className="text-xs font-bold text-slate-600 uppercase tracking-widest">Large Language Model</Label>
                                        <select
                                            id="model"
                                            value={model}
                                            onChange={(e) => setModel(e.target.value)}
                                            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                                        >
                                            {AVAILABLE_MODELS.map((m) => (
                                                <option key={m.value} value={m.value}>
                                                    {m.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="maxCost" className="text-xs font-bold text-slate-600 uppercase tracking-widest">Max Token Burn ($)</Label>
                                        <Input
                                            id="maxCost"
                                            type="number"
                                            value={maxCostPerRun}
                                            onChange={(e) => setMaxCostPerRun(e.target.value)}
                                            placeholder="Infinite"
                                            className="h-12 rounded-xl border-slate-200 font-medium"
                                            min={0}
                                            step={0.5}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Confidence Thresholds */}
                            <div className="space-y-6">
                                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Validation Thresholds</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 p-8 rounded-3xl bg-slate-50 border border-slate-100">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end">
                                            <Label className="text-sm font-bold text-slate-900">Auto-Approval</Label>
                                            <span className="text-xs font-bold text-indigo-600 bg-white px-3 py-1 rounded-lg shadow-sm border border-slate-100">{(autoAcceptThreshold * 100).toFixed(0)}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0.5"
                                            max="1.0"
                                            step="0.01"
                                            value={autoAcceptThreshold}
                                            onChange={(e) => setAutoAcceptThreshold(Number(e.target.value))}
                                            className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-green-500 bg-slate-200"
                                        />
                                        <p className="text-[10px] text-slate-400 font-medium leading-relaxed">Exact data points with logic scores above this level bypass manual audit.</p>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end">
                                            <Label className="text-sm font-bold text-slate-900">Review Trigger</Label>
                                            <span className="text-xs font-bold text-amber-600 bg-white px-3 py-1 rounded-lg shadow-sm border border-slate-100">{(needsReviewThreshold * 100).toFixed(0)}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0.1"
                                            max="0.9"
                                            step="0.01"
                                            value={needsReviewThreshold}
                                            onChange={(e) => setNeedsReviewThreshold(Number(e.target.value))}
                                            className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-amber-500 bg-slate-200"
                                        />
                                        <p className="text-[10px] text-slate-400 font-medium leading-relaxed">Ambiguous data points below this score are flagged for intelligence review.</p>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* API Key Section */}
            <Card className="border-slate-100 shadow-xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden">
                <CardHeader className="p-10 hover:bg-slate-50/50 transition-colors">
                    <button
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="flex items-center justify-between w-full group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-2 rounded-xl bg-orange-50 text-orange-600">
                                <Key className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <CardTitle className="text-lg font-outfit font-bold text-slate-900 tracking-tight">Access Protocol</CardTitle>
                                <CardDescription className="text-xs font-medium text-slate-500">Configure your model authentication keys.</CardDescription>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            {hasProjectKey && (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-100 font-bold px-3 py-1 text-[9px] uppercase tracking-widest shadow-sm">
                                    Bespeak Key Active
                                </Badge>
                            )}
                            <div className="w-8 h-8 rounded-full border border-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-slate-100 transition-all">
                                {showApiKey ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </div>
                        </div>
                    </button>
                </CardHeader>
                {showApiKey && (
                    <CardContent className="p-10 pt-0 space-y-6 animate-slide-up">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                { id: 'PLATFORM', label: 'Universal', icon: '🌐', desc: 'System-wide preset' },
                                { id: 'WORKSPACE', label: 'Commercial', icon: '🏢', desc: 'Org-level access' },
                                { id: 'PROJECT', label: 'Bespoke', icon: '🔑', desc: 'Studio isolated' }
                            ].map((modeItem) => (
                                <label
                                    key={modeItem.id}
                                    className={`flex flex-col gap-3 p-5 rounded-[1.5rem] border-2 cursor-pointer transition-all ${apiKeyMode === modeItem.id
                                        ? 'border-indigo-600 bg-indigo-50/20'
                                        : 'border-slate-100 bg-white hover:border-slate-200'
                                        }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <span className="text-2xl">{modeItem.icon}</span>
                                        <input
                                            type="radio"
                                            name="apiKeyMode"
                                            value={modeItem.id}
                                            checked={apiKeyMode === modeItem.id}
                                            onChange={(e) => setApiKeyMode(e.target.value)}
                                            className="mt-1 accent-indigo-600 w-4 h-4"
                                        />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">{modeItem.label}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{modeItem.desc}</p>
                                    </div>
                                </label>
                            ))}
                        </div>

                        {apiKeyMode === 'PROJECT' && (
                            <div className="space-y-4 pt-4 border-t border-slate-100">
                                <div className="space-y-2">
                                    <Label htmlFor="apiKey" className="text-xs font-bold text-slate-600 uppercase tracking-widest">
                                        Project Isolation API Key
                                    </Label>
                                    <Input
                                        id="apiKey"
                                        type="password"
                                        value={newApiKey}
                                        onChange={(e) => setNewApiKey(e.target.value)}
                                        placeholder={hasProjectKey ? '••••••••••••••• (Authenticated)' : 'sk-...'}
                                        className="h-12 rounded-xl border-slate-200 focus:ring-indigo-600"
                                    />
                                </div>
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                                    <Shield className="w-4 h-4 text-slate-400" />
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                        Encrypted via AES-256. Post-persistence access is restricted.
                                    </p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                )}
            </Card>

            {/* Save Button */}
            <div className="flex justify-end pt-4">
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="h-16 px-12 rounded-2xl font-bold bg-indigo-600 hover:bg-slate-900 text-white shadow-xl shadow-indigo-100 hover:translate-y-[-4px] active:scale-95 transition-all text-lg gap-3"
                >
                    {saving ? (
                        <>
                            <Zap className="w-5 h-5 animate-pulse" />
                            Archiving...
                        </>
                    ) : (
                        <>
                            <Save className="w-5 h-5" />
                            Synchronize Studio
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}

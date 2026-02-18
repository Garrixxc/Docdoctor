'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Settings2, ChevronDown, ChevronUp, Key, Zap, Brain, Save, Shield, ShieldCheck } from 'lucide-react';
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
    const [mode, setMode] = useState<'simple' | 'advanced'>('advanced');
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

            if (apiKeyMode !== 'PLATFORM') {
                body.apiKeyMode = apiKeyMode;
                if (newApiKey) body.apiKey = newApiKey;
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
            }
        } catch (err) {
            console.error('Failed to save settings:', err);
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <Card className="border-slate-200 shadow-sm animate-pulse">
                <CardContent className="p-10 space-y-6">
                    <div className="h-4 bg-slate-100 rounded w-1/4"></div>
                    <div className="h-10 bg-slate-50 rounded"></div>
                    <div className="h-32 bg-slate-50 rounded"></div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Engine Settings */}
            <Card className="border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-600 rounded-xl text-white shadow-md shadow-blue-100">
                                <Settings2 className="w-5 h-5" />
                            </div>
                            <div className="space-y-1">
                                <CardTitle className="text-xl font-outfit font-bold text-slate-900">Engine Intelligence</CardTitle>
                                <CardDescription className="text-slate-500">Optimize how the DocDoctor core processes this project.</CardDescription>
                            </div>
                        </div>
                        <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                            <button
                                onClick={() => setMode('simple')}
                                className={cn(
                                    "px-6 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2",
                                    mode === 'simple' ? "bg-white shadow-sm text-blue-600" : "text-slate-500 hover:text-slate-700"
                                )}
                            >
                                <Zap className="w-3.5 h-3.5" />
                                SIMPLE
                            </button>
                            <button
                                onClick={() => setMode('advanced')}
                                className={cn(
                                    "px-6 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2",
                                    mode === 'advanced' ? "bg-white shadow-sm text-blue-600" : "text-slate-500 hover:text-slate-700"
                                )}
                            >
                                <Brain className="w-3.5 h-3.5" />
                                ADVANCED
                            </button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-8 space-y-10">
                    {mode === 'simple' ? (
                        <div className="space-y-8">
                            {/* Simple Logic Controls */}
                            <div className="space-y-6">
                                <div className="space-y-1">
                                    <Label className="text-sm font-bold text-slate-900 uppercase tracking-widest">Logic Precision vs. Economy</Label>
                                    <p className="text-sm text-slate-500">Economy is faster for simple forms; Precision is better for complex legal documents.</p>
                                </div>
                                <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 space-y-6">
                                    <div className="flex items-center gap-6">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest w-16 text-center">Economy</span>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={costVsAccuracy}
                                            onChange={(e) => setCostVsAccuracy(Number(e.target.value))}
                                            className="flex-1 h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-blue-600"
                                        />
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest w-16 text-center">Precise</span>
                                    </div>
                                    <div className="flex justify-center">
                                        <Badge variant="outline" className="bg-white border-blue-100 text-blue-700 font-bold px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest">
                                            Model: {costVsAccuracy <= 30 ? 'GPT-4o Mini' : costVsAccuracy <= 70 ? 'GPT-4o Base' : 'GPT-4 Turbo Pro'}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-10 animate-in fade-in duration-300">
                            {/* Advanced Grids */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Model Engine</Label>
                                    <select
                                        value={model}
                                        onChange={(e) => setModel(e.target.value)}
                                        className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                                    >
                                        {AVAILABLE_MODELS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Chunking Method</Label>
                                    <select
                                        value={chunkingMethod}
                                        onChange={(e) => setChunkingMethod(e.target.value as any)}
                                        className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                                    >
                                        {AVAILABLE_CHUNKING_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Record Cap ($)</Label>
                                    <Input
                                        type="number"
                                        value={maxCostPerRun}
                                        onChange={(e) => setMaxCostPerRun(e.target.value)}
                                        placeholder="Infinite"
                                        className="h-12 rounded-xl border-slate-200 font-bold focus:ring-blue-600"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-4 border-t border-slate-100">
                                <div className="space-y-6">
                                    <div className="flex justify-between">
                                        <Label className="text-sm font-bold text-slate-900">Auto-Pass Score</Label>
                                        <span className="text-xs font-bold text-blue-600">{(autoAcceptThreshold * 100).toFixed(0)}%</span>
                                    </div>
                                    <input
                                        type="range" min="0.5" max="1.0" step="0.01"
                                        value={autoAcceptThreshold}
                                        onChange={(e) => setAutoAcceptThreshold(Number(e.target.value))}
                                        className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-emerald-500"
                                    />
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">Values above this score skip manual review.</p>
                                </div>
                                <div className="space-y-6">
                                    <div className="flex justify-between">
                                        <Label className="text-sm font-bold text-slate-900">Fail Trigger Score</Label>
                                        <span className="text-xs font-bold text-amber-600">{(needsReviewThreshold * 100).toFixed(0)}%</span>
                                    </div>
                                    <input
                                        type="range" min="0.1" max="0.9" step="0.01"
                                        value={needsReviewThreshold}
                                        onChange={(e) => setNeedsReviewThreshold(Number(e.target.value))}
                                        className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-amber-500"
                                    />
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">Values below this score are flagged for audit.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* API Access Protocol */}
            <Card className="border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50/50 p-8 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setShowApiKey(!showApiKey)}>
                    <div className="flex items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-slate-800 rounded-xl text-white">
                                <Key className="w-5 h-5" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-outfit font-bold text-slate-900">Access Protocol</CardTitle>
                                <CardDescription className="text-xs font-medium text-slate-400">Configure studio-specific authentication.</CardDescription>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            {hasProjectKey && <Badge className="bg-emerald-50 text-emerald-700 border-none font-bold text-[10px] tracking-widest uppercase">Isolation Key Active</Badge>}
                            <div className="h-8 w-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400">
                                {showApiKey ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </div>
                        </div>
                    </div>
                </CardHeader>
                {showApiKey && (
                    <CardContent className="p-8 space-y-8 animate-in slide-in-from-top-2 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                { id: 'PLATFORM', label: 'Universal', desc: 'System defaults' },
                                { id: 'WORKSPACE', label: 'Org-wide', desc: 'Team settings' },
                                { id: 'PROJECT', label: 'Isolated', desc: 'Studio specific' },
                            ].map((modeItem) => (
                                <button
                                    key={modeItem.id}
                                    onClick={() => setApiKeyMode(modeItem.id)}
                                    className={cn(
                                        "p-5 text-left rounded-xl border-2 transition-all",
                                        apiKeyMode === modeItem.id ? "border-blue-600 bg-blue-50/20" : "border-slate-100 hover:border-slate-200"
                                    )}
                                >
                                    <p className="font-bold text-slate-900 text-sm">{modeItem.label}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{modeItem.desc}</p>
                                </button>
                            ))}
                        </div>
                        {apiKeyMode === 'PROJECT' && (
                            <div className="space-y-4 pt-4 animate-in fade-in">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Isolation API Key (Optional)</Label>
                                    <Input
                                        type="password"
                                        value={newApiKey}
                                        onChange={(e) => setNewApiKey(e.target.value)}
                                        placeholder={hasProjectKey ? '•••••••••••••••• (Encrypted)' : 'Enter sk-...'}
                                        className="h-12 rounded-xl focus:ring-blue-600 border-slate-200 font-bold"
                                    />
                                </div>
                                <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Encrypted via AES-256 for studio safety.</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                )}
            </Card>

            {/* Global Actions */}
            <div className="flex justify-end pt-4">
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="h-16 px-12 rounded-2xl bg-blue-600 hover:bg-slate-900 text-white font-bold text-lg shadow-xl shadow-blue-100 transition-all hover:-translate-y-1 active:scale-95 gap-3"
                >
                    {saving ? <Zap className="w-5 h-5 animate-pulse" /> : <Save className="w-5 h-5" />}
                    {saving ? 'Syncing Studio...' : 'Save Configuration'}
                </Button>
            </div>
        </div>
    );
}

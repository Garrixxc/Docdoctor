'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Settings2, ChevronDown, ChevronUp, Key, Zap, Brain } from 'lucide-react';
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
        <div className="space-y-6">
            {/* Mode Toggle */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Settings2 className="w-5 h-5 text-gray-600" />
                            <CardTitle>Extraction Settings</CardTitle>
                        </div>
                        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                            <button
                                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${mode === 'simple'
                                        ? 'bg-white dark:bg-gray-700 shadow text-blue-600'
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                onClick={() => setMode('simple')}
                            >
                                <Zap className="w-3.5 h-3.5 inline mr-1" />
                                Simple
                            </button>
                            <button
                                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${mode === 'advanced'
                                        ? 'bg-white dark:bg-gray-700 shadow text-blue-600'
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                onClick={() => setMode('advanced')}
                            >
                                <Brain className="w-3.5 h-3.5 inline mr-1" />
                                Advanced
                            </button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {mode === 'simple' ? (
                        <>
                            {/* Cost vs Accuracy Slider */}
                            <div>
                                <Label className="text-sm font-medium">
                                    Cost vs. Accuracy
                                </Label>
                                <p className="text-xs text-gray-500 mb-3">
                                    Lower = faster & cheaper, Higher = more accurate & expensive
                                </p>
                                <div className="flex items-center gap-4">
                                    <span className="text-xs text-gray-400 w-16">💰 Economy</span>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={costVsAccuracy}
                                        onChange={(e) => setCostVsAccuracy(Number(e.target.value))}
                                        className="flex-1 h-2 bg-gradient-to-r from-green-300 via-yellow-300 to-red-300 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                    />
                                    <span className="text-xs text-gray-400 w-16 text-right">🎯 Precise</span>
                                </div>
                                <div className="text-center mt-1">
                                    <Badge variant="outline" className="text-xs">
                                        {costVsAccuracy <= 30
                                            ? 'GPT-4o Mini'
                                            : costVsAccuracy <= 70
                                                ? 'GPT-4o'
                                                : 'GPT-4 Turbo'}
                                    </Badge>
                                </div>
                            </div>

                            {/* Speed vs Thoroughness Toggle */}
                            <div>
                                <Label className="text-sm font-medium">
                                    Speed vs. Thoroughness
                                </Label>
                                <p className="text-xs text-gray-500 mb-3">
                                    Toggle between faster page-based processing or thorough heading-based analysis
                                </p>
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => setSpeedVsThoroughness(true)}
                                        className={`flex-1 p-3 rounded-lg border-2 transition-all text-sm ${speedVsThoroughness
                                                ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                                                : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        ⚡ Speed<br />
                                        <span className="text-xs text-gray-500">Page chunks, faster</span>
                                    </button>
                                    <button
                                        onClick={() => setSpeedVsThoroughness(false)}
                                        className={`flex-1 p-3 rounded-lg border-2 transition-all text-sm ${!speedVsThoroughness
                                                ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                                                : 'border-gray-200 hover:border-gray-300'
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
                            {/* Chunking Settings */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <Label htmlFor="chunkingMethod" className="text-sm font-medium">Chunking Method</Label>
                                    <select
                                        id="chunkingMethod"
                                        value={chunkingMethod}
                                        onChange={(e) => setChunkingMethod(e.target.value as any)}
                                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 dark:border-gray-600"
                                    >
                                        {AVAILABLE_CHUNKING_METHODS.map((m) => (
                                            <option key={m.value} value={m.value}>
                                                {m.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <Label htmlFor="chunkSize" className="text-sm font-medium">Chunk Size (tokens)</Label>
                                    <Input
                                        id="chunkSize"
                                        type="number"
                                        value={chunkSize}
                                        onChange={(e) => setChunkSize(Number(e.target.value))}
                                        className="mt-1"
                                        min={500}
                                        max={16000}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="overlap" className="text-sm font-medium">Overlap (tokens)</Label>
                                    <Input
                                        id="overlap"
                                        type="number"
                                        value={overlap}
                                        onChange={(e) => setOverlap(Number(e.target.value))}
                                        className="mt-1"
                                        min={0}
                                        max={2000}
                                    />
                                </div>
                            </div>

                            {/* Model Settings */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="model" className="text-sm font-medium">Model</Label>
                                    <select
                                        id="model"
                                        value={model}
                                        onChange={(e) => setModel(e.target.value)}
                                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 dark:border-gray-600"
                                    >
                                        {AVAILABLE_MODELS.map((m) => (
                                            <option key={m.value} value={m.value}>
                                                {m.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <Label htmlFor="maxCost" className="text-sm font-medium">Max Cost per Run ($)</Label>
                                    <Input
                                        id="maxCost"
                                        type="number"
                                        value={maxCostPerRun}
                                        onChange={(e) => setMaxCostPerRun(e.target.value)}
                                        placeholder="No limit"
                                        className="mt-1"
                                        min={0}
                                        step={0.5}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Leave empty for no limit</p>
                                </div>
                            </div>

                            {/* Confidence Thresholds */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm font-medium">
                                        Auto-Accept Threshold: {autoAcceptThreshold.toFixed(2)}
                                    </Label>
                                    <p className="text-xs text-gray-500 mb-2">
                                        Fields with confidence ≥ this value are auto-approved
                                    </p>
                                    <input
                                        type="range"
                                        min="0.5"
                                        max="1.0"
                                        step="0.01"
                                        value={autoAcceptThreshold}
                                        onChange={(e) => setAutoAcceptThreshold(Number(e.target.value))}
                                        className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-green-600 bg-gray-200"
                                    />
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">
                                        Needs Review Threshold: {needsReviewThreshold.toFixed(2)}
                                    </Label>
                                    <p className="text-xs text-gray-500 mb-2">
                                        Fields below this value get flagged for review
                                    </p>
                                    <input
                                        type="range"
                                        min="0.1"
                                        max="0.9"
                                        step="0.01"
                                        value={needsReviewThreshold}
                                        onChange={(e) => setNeedsReviewThreshold(Number(e.target.value))}
                                        className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-amber-600 bg-gray-200"
                                    />
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* API Key Section */}
            <Card>
                <CardHeader>
                    <button
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="flex items-center justify-between w-full"
                    >
                        <div className="flex items-center gap-2">
                            <Key className="w-5 h-5 text-gray-600" />
                            <CardTitle className="text-base">API Key</CardTitle>
                            {hasProjectKey && (
                                <Badge variant="outline" className="text-green-600 border-green-300">
                                    Project Key Set
                                </Badge>
                            )}
                        </div>
                        {showApiKey ? (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                    </button>
                </CardHeader>
                {showApiKey && (
                    <CardContent className="space-y-4 pt-0">
                        <div className="space-y-2">
                            {['PLATFORM', 'WORKSPACE', 'PROJECT'].map((keyMode) => (
                                <label
                                    key={keyMode}
                                    className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${apiKeyMode === keyMode
                                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-950'
                                            : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="apiKeyMode"
                                        value={keyMode}
                                        checked={apiKeyMode === keyMode}
                                        onChange={(e) => setApiKeyMode(e.target.value)}
                                        className="mt-1"
                                    />
                                    <div>
                                        <p className="text-sm font-medium">
                                            {keyMode === 'PLATFORM' && '🌐 Platform Key'}
                                            {keyMode === 'WORKSPACE' && '🏢 Workspace Key'}
                                            {keyMode === 'PROJECT' && '🔑 Project-Specific Key'}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {keyMode === 'PLATFORM' && 'Use the default platform API key'}
                                            {keyMode === 'WORKSPACE' && 'Use the workspace-level BYO API key'}
                                            {keyMode === 'PROJECT' && 'Use a custom API key just for this project'}
                                        </p>
                                    </div>
                                </label>
                            ))}
                        </div>

                        {apiKeyMode === 'PROJECT' && (
                            <div>
                                <Label htmlFor="apiKey" className="text-sm font-medium">
                                    OpenAI API Key
                                </Label>
                                <Input
                                    id="apiKey"
                                    type="password"
                                    value={newApiKey}
                                    onChange={(e) => setNewApiKey(e.target.value)}
                                    placeholder={hasProjectKey ? '••••••••••••••• (key set, enter new to replace)' : 'sk-...'}
                                    className="mt-1"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    🔒 Keys are encrypted at rest and never visible after saving
                                </p>
                            </div>
                        )}
                    </CardContent>
                )}
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="min-w-[120px]"
                >
                    {saving ? 'Saving...' : 'Save Settings'}
                </Button>
            </div>
        </div>
    );
}

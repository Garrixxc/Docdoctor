'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Settings2, Key, Shield, AlertTriangle } from 'lucide-react';

export default function WorkspaceSettingsPage() {
    const params = useParams();
    const workspaceId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [provider, setProvider] = useState('openai');
    const [keyMode, setKeyMode] = useState('platform');
    const [hasApiKey, setHasApiKey] = useState(false);
    const [newApiKey, setNewApiKey] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        loadSettings();
    }, [workspaceId]);

    async function loadSettings() {
        try {
            const res = await fetch(`/api/workspaces/${workspaceId}/settings`);
            if (res.ok) {
                const data = await res.json();
                setProvider(data.settings.provider || 'openai');
                setKeyMode(data.settings.keyMode || 'platform');
                setHasApiKey(data.settings.hasApiKey || false);
            }
        } catch (err) {
            console.error('Failed to load workspace settings:', err);
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        setSaving(true);
        try {
            const body: any = { provider, keyMode };
            if (keyMode === 'byo' && newApiKey) {
                body.apiKey = newApiKey;
            }

            const res = await fetch(`/api/workspaces/${workspaceId}/settings`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                setNewApiKey('');
                await loadSettings();
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 3000);
            }
        } catch (err) {
            console.error('Failed to save settings:', err);
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-2xl">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-64 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            <div className="flex items-center gap-3 mb-8">
                <Settings2 className="w-7 h-7 text-gray-600" />
                <div>
                    <h1 className="text-2xl font-bold">Workspace Settings</h1>
                    <p className="text-gray-500 text-sm">Manage API keys and provider configuration</p>
                </div>
            </div>

            {showSuccess && (
                <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
                    <Shield className="w-4 h-4" /> Settings saved successfully!
                </div>
            )}

            <div className="space-y-6">
                {/* Provider */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">LLM Provider</CardTitle>
                        <CardDescription>Select the AI provider for document extraction</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <select
                            value={provider}
                            onChange={(e) => setProvider(e.target.value)}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 dark:border-gray-600"
                        >
                            <option value="openai">OpenAI</option>
                        </select>
                    </CardContent>
                </Card>

                {/* API Key Mode */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Key className="w-5 h-5 text-gray-600" />
                            <CardTitle className="text-base">API Key Configuration</CardTitle>
                        </div>
                        <CardDescription>
                            Choose whether to use the platform&apos;s shared key or bring your own
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label
                                className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${keyMode === 'platform'
                                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950'
                                        : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                                    }`}
                            >
                                <input
                                    type="radio"
                                    name="keyMode"
                                    value="platform"
                                    checked={keyMode === 'platform'}
                                    onChange={(e) => setKeyMode(e.target.value)}
                                    className="mt-1"
                                />
                                <div>
                                    <p className="font-medium text-sm">🌐 Platform Key</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Use the shared platform API key. No configuration needed.
                                    </p>
                                </div>
                            </label>

                            <label
                                className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${keyMode === 'byo'
                                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950'
                                        : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                                    }`}
                            >
                                <input
                                    type="radio"
                                    name="keyMode"
                                    value="byo"
                                    checked={keyMode === 'byo'}
                                    onChange={(e) => setKeyMode(e.target.value)}
                                    className="mt-1"
                                />
                                <div>
                                    <p className="font-medium text-sm">🔑 Bring Your Own Key</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Use your own OpenAI API key. This key will be used by all projects in this workspace (unless overridden at project level).
                                    </p>
                                </div>
                            </label>
                        </div>

                        {keyMode === 'byo' && (
                            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border">
                                <Label htmlFor="wsApiKey" className="text-sm font-medium">
                                    OpenAI API Key
                                </Label>
                                <Input
                                    id="wsApiKey"
                                    type="password"
                                    value={newApiKey}
                                    onChange={(e) => setNewApiKey(e.target.value)}
                                    placeholder={hasApiKey ? '••••••••••••••• (key saved, enter new to replace)' : 'sk-...'}
                                    className="mt-2"
                                />

                                {hasApiKey && !newApiKey && (
                                    <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                                        <Shield className="w-3 h-3" /> API key is securely stored
                                    </p>
                                )}

                                <div className="flex items-start gap-2 mt-3 p-2 bg-amber-50 dark:bg-amber-950 rounded text-xs text-amber-700 dark:text-amber-300">
                                    <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                    <p>Keys are encrypted with AES-256-GCM and never displayed after saving. Only workspace owners and admins can manage keys.</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Save */}
                <div className="flex justify-end">
                    <Button onClick={handleSave} disabled={saving} className="min-w-[120px]">
                        {saving ? 'Saving...' : 'Save Settings'}
                    </Button>
                </div>
            </div>
        </div>
    );
}

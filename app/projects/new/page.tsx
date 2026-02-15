'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function NewProjectPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [templates, setTemplates] = useState<any[]>([]);
    const [workspaces, setWorkspaces] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        workspaceId: '',
        templateId: '',
        name: '',
        minLiabilityOccurrence: '1000000',
        minLiabilityAggregate: '2000000',
    });

    useEffect(() => {
        async function loadData() {
            const [templatesRes, workspacesRes] = await Promise.all([
                fetch('/api/templates'),
                fetch('/api/workspaces'),
            ]);

            const templatesData = await templatesRes.json();
            const workspacesData = await workspacesRes.json();

            setTemplates(templatesData.templates || []);
            setWorkspaces(workspacesData.workspaces || []);

            if (workspacesData.workspaces?.length > 0) {
                setFormData((prev) => ({ ...prev, workspaceId: workspacesData.workspaces[0].id }));
            }
        }

        loadData();
    }, []);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    workspaceId: formData.workspaceId,
                    templateId: formData.templateId,
                    name: formData.name,
                    requirements: {
                        general_liability_each_occurrence: Number(formData.minLiabilityOccurrence),
                        general_liability_aggregate: Number(formData.minLiabilityAggregate),
                    },
                    extractionSettings: {
                        model: 'gpt-4o-mini',
                        chunkingMethod: 'by_pages',
                        temperature: 0.1,
                    },
                    apiKeyMode: 'PLATFORM',
                }),
            });

            const data = await res.json();
            if (data.project) {
                router.push(`/projects/${data.project.id}`);
            }
        } catch (error) {
            console.error('Failed to create project:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            <h1 className="text-3xl font-bold mb-8">Create New Project</h1>

            {step === 1 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Choose a Template</CardTitle>
                        <CardDescription>Select the type of documents you want to process</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {templates.map((template) => (
                            <Card
                                key={template.id}
                                className={`cursor-pointer hover:border-blue-500 transition-colors ${formData.templateId === template.id ? 'border-blue-600 bg-blue-50' : ''
                                    }`}
                                onClick={() => {
                                    setFormData({ ...formData, templateId: template.id });
                                    setStep(2);
                                }}
                            >
                                <CardHeader>
                                    <CardTitle className="text-lg">{template.name}</CardTitle>
                                    <CardDescription>{template.category}</CardDescription>
                                </CardHeader>
                            </Card>
                        ))}
                    </CardContent>
                </Card>
            )}

            {step === 2 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Project Details</CardTitle>
                        <CardDescription>Configure your project settings</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <Label htmlFor="name">Project Name</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Q1 2026 Vendor Compliance"
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <Label htmlFor="minOccurrence">Minimum Liability Per Occurrence</Label>
                            <Input
                                id="minOccurrence"
                                type="number"
                                value={formData.minLiabilityOccurrence}
                                onChange={(e) =>
                                    setFormData({ ...formData, minLiabilityOccurrence: e.target.value })
                                }
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <Label htmlFor="minAggregate">Minimum Liability Aggregate</Label>
                            <Input
                                id="minAggregate"
                                type="number"
                                value={formData.minLiabilityAggregate}
                                onChange={(e) =>
                                    setFormData({ ...formData, minLiabilityAggregate: e.target.value })
                                }
                                className="mt-1"
                            />
                        </div>

                        <div className="flex gap-4">
                            <Button variant="outline" onClick={() => setStep(1)}>
                                Back
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={!formData.name || loading}
                                className="flex-1"
                            >
                                {loading ? 'Creating...' : 'Create Project'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, Play, Shield, Receipt, User } from 'lucide-react';
import ProjectSettingsTab from '@/components/ProjectSettingsTab';

export default function ProjectPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.id as string;

    const [project, setProject] = useState<any>(null);
    const [documents, setDocuments] = useState<any[]>([]);
    const [runs, setRuns] = useState<any[]>([]);
    const [uploading, setUploading] = useState(false);
    const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());

    useEffect(() => {
        loadProject();
        loadDocuments();
        loadRuns();
    }, [projectId]);

    async function loadProject() {
        const res = await fetch(`/api/projects/${projectId}`);
        const data = await res.json();
        setProject(data.project);
    }

    async function loadDocuments() {
        const res = await fetch(`/api/projects/${projectId}/documents`);
        const data = await res.json();
        setDocuments(data.documents || []);
    }

    async function loadRuns() {
        const res = await fetch(`/api/projects/${projectId}/runs`);
        const data = await res.json();
        setRuns(data.runs || []);
    }

    async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            // Get presigned URL
            const presignedRes = await fetch('/api/upload/presigned-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filename: file.name,
                    fileType: file.type,
                    projectId,
                }),
            });

            if (!presignedRes.ok) {
                const error = await presignedRes.json();
                throw new Error(error.error || 'Failed to get upload URL');
            }

            const { uploadUrl, fileUrl } = await presignedRes.json();

            // Upload to S3
            const uploadRes = await fetch(uploadUrl, {
                method: 'PUT',
                body: file,
                headers: {
                    'Content-Type': file.type,
                },
            });

            if (!uploadRes.ok) {
                throw new Error(`S3 upload failed: ${uploadRes.statusText}`);
            }

            // Register document
            const docRes = await fetch(`/api/projects/${projectId}/documents`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: file.name,
                    fileUrl,
                    fileType: file.type,
                    fileSize: file.size,
                }),
            });

            if (!docRes.ok) {
                const error = await docRes.json();
                throw new Error(error.error || 'Failed to register document');
            }

            loadDocuments();
            alert('Document uploaded successfully!');
        } catch (error) {
            console.error('Upload failed:', error);
            alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setUploading(false);
        }
    }

    async function triggerRun() {
        const documentIds = Array.from(selectedDocuments);
        if (documentIds.length === 0) {
            alert('Please select at least one document');
            return;
        }

        await fetch(`/api/projects/${projectId}/runs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ documentIds }),
        });
        loadRuns();
        setSelectedDocuments(new Set()); // Clear selection after run
    }

    function toggleDocumentSelection(docId: string) {
        const newSelection = new Set(selectedDocuments);
        if (newSelection.has(docId)) {
            newSelection.delete(docId);
        } else {
            newSelection.add(docId);
        }
        setSelectedDocuments(newSelection);
    }

    function toggleSelectAll() {
        if (selectedDocuments.size === documents.length) {
            setSelectedDocuments(new Set());
        } else {
            setSelectedDocuments(new Set(documents.map(d => d.id)));
        }
    }

    if (!project) {
        return <div className="container mx-auto px-4 py-8">Loading...</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold">{project.name}</h1>
                    <Badge variant="outline" className="text-sm">
                        {project.template.name}
                    </Badge>
                </div>
                <p className="text-gray-500 text-sm">
                    Template: {project.template.name} · {documents.length} document{documents.length !== 1 ? 's' : ''} · {runs.length} run{runs.length !== 1 ? 's' : ''}
                </p>
            </div>

            <Tabs defaultValue="documents">
                <TabsList>
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                    <TabsTrigger value="runs">Runs</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="documents" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Upload Documents</CardTitle>
                            <CardDescription>Upload Certificate of Insurance files (PDF)</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <label className="block">
                                <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={handleFileUpload}
                                    disabled={uploading}
                                    className="hidden"
                                />
                                <Button asChild disabled={uploading}>
                                    <span>
                                        <Upload className="w-4 h-4 mr-2" />
                                        {uploading ? 'Uploading...' : 'Upload PDF'}
                                    </span>
                                </Button>
                            </label>
                        </CardContent>
                    </Card>

                    {documents.length > 0 && (
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Uploaded Documents</CardTitle>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={toggleSelectAll}
                                    >
                                        {selectedDocuments.size === documents.length ? 'Deselect All' : 'Select All'}
                                    </Button>
                                </div>
                                <CardDescription>
                                    {selectedDocuments.size} of {documents.length} selected
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    )}

                    <div className="space-y-2">
                        {documents.map((doc) => (
                            <Card key={doc.id}>
                                <CardContent className="flex items-center gap-4 p-4">
                                    <input
                                        type="checkbox"
                                        checked={selectedDocuments.has(doc.id)}
                                        onChange={() => toggleDocumentSelection(doc.id)}
                                        className="w-4 h-4 cursor-pointer"
                                    />
                                    <div className="flex-1">
                                        <p className="font-medium">{doc.name}</p>
                                        <p className="text-sm text-gray-600">
                                            {new Date(doc.createdAt).toLocaleString()}
                                        </p>
                                        {doc.docTypeDetected && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                Type: {doc.docTypeDetected} (Score: {(doc.docTypeScore * 100).toFixed(1)}%)
                                            </p>
                                        )}
                                        {doc.skipReason && (
                                            <p className="text-xs text-orange-600 mt-1">
                                                ⚠️ {doc.skipReason}
                                            </p>
                                        )}
                                    </div>
                                    <Badge>{doc.status}</Badge>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="runs" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Process Documents</CardTitle>
                            <CardDescription>
                                Select documents and start extraction run
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button
                                onClick={triggerRun}
                                disabled={selectedDocuments.size === 0}
                            >
                                <Play className="w-4 h-4 mr-2" />
                                Start New Run ({selectedDocuments.size} document{selectedDocuments.size !== 1 ? 's' : ''})
                            </Button>
                            {selectedDocuments.size === 0 && (
                                <p className="text-sm text-gray-500 mt-2">
                                    Go to Documents tab and select files to process
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    <div className="space-y-2">
                        {runs.map((run) => (
                            <Card
                                key={run.id}
                                className="cursor-pointer hover:shadow-lg transition-shadow"
                                onClick={() => router.push(`/projects/${projectId}/review?runId=${run.id}`)}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="font-medium">
                                            Run {new Date(run.createdAt).toLocaleString()}
                                        </p>
                                        <Badge
                                            variant={
                                                run.status === 'COMPLETED'
                                                    ? 'default'
                                                    : run.status === 'FAILED'
                                                        ? 'destructive'
                                                        : 'secondary'
                                            }
                                        >
                                            {run.status}
                                        </Badge>
                                    </div>
                                    {run.status === 'PROCESSING' && <Progress value={50} className="mt-2" />}
                                    <p className="text-sm text-gray-600 mt-2">{run._count.records} records</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="settings" className="space-y-4 mt-4">
                    <ProjectSettingsTab projectId={projectId} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

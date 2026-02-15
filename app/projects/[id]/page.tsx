'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, Play } from 'lucide-react';

export default function ProjectPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.id as string;

    const [project, setProject] = useState<any>(null);
    const [documents, setDocuments] = useState<any[]>([]);
    const [runs, setRuns] = useState<any[]>([]);
    const [uploading, setUploading] = useState(false);

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

            const { uploadUrl, fileUrl } = await presignedRes.json();

            // Upload to S3
            await fetch(uploadUrl, {
                method: 'PUT',
                body: file,
                headers: {
                    'Content-Type': file.type,
                },
            });

            // Register document
            await fetch(`/api/projects/${projectId}/documents`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: file.name,
                    fileUrl,
                    fileType: file.type,
                    fileSize: file.size,
                }),
            });

            loadDocuments();
        } catch (error) {
            console.error('Upload failed:', error);
        } finally {
            setUploading(false);
        }
    }

    async function triggerRun() {
        await fetch(`/api/projects/${projectId}/runs`, {
            method: 'POST',
        });
        loadRuns();
    }

    if (!project) {
        return <div className="container mx-auto px-4 py-8">Loading...</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
                <p className="text-gray-600">{project.template.name}</p>
            </div>

            <Tabs defaultValue="documents">
                <TabsList>
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                    <TabsTrigger value="runs">Runs</TabsTrigger>
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

                    <div className="space-y-2">
                        {documents.map((doc) => (
                            <Card key={doc.id}>
                                <CardContent className="flex items-center justify-between p-4">
                                    <div>
                                        <p className="font-medium">{doc.name}</p>
                                        <p className="text-sm text-gray-600">
                                            {new Date(doc.createdAt).toLocaleString()}
                                        </p>
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
                            <CardDescription>Extract data from uploaded documents</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button onClick={triggerRun} disabled={documents.length === 0}>
                                <Play className="w-4 h-4 mr-2" />
                                Start New Run
                            </Button>
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
            </Tabs>
        </div>
    );
}

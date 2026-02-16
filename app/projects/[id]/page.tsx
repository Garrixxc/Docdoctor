'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, Play, Shield, Receipt, User, BarChart3, ArrowLeft, Zap, Check, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
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
        <div className="container mx-auto px-4 py-8 space-y-10 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-4">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-blue-600 transition-colors uppercase tracking-widest"
                    >
                        <ArrowLeft className="w-3 h-3" /> Back to Dashboard
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xl shadow-blue-500/20">
                            <Zap className="w-7 h-7" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-4xl font-black text-gray-900 tracking-tight">{project.name}</h1>
                                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">
                                    {project.template.name}
                                </Badge>
                            </div>
                            <p className="text-gray-500 font-medium mt-1">
                                {documents.length} Docs · {runs.length} Runs · Created {new Date(project.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <Button
                        size="lg"
                        onClick={triggerRun}
                        disabled={selectedDocuments.size === 0}
                        className="h-14 px-8 rounded-2xl font-bold bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/10 active:scale-95 transition-all"
                    >
                        <Play className="w-4 h-4 mr-2 fill-current" />
                        Run Extraction ({selectedDocuments.size})
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="documents" className="w-full">
                <TabsList className="bg-transparent border-b border-gray-100 w-full justify-start h-auto p-0 gap-8 rounded-none mb-8">
                    {['documents', 'runs', 'settings'].map((tab) => (
                        <TabsTrigger
                            key={tab}
                            value={tab}
                            className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-2 py-4 text-sm font-black uppercase tracking-widest text-gray-400 data-[state=active]:text-blue-600 transition-all border-b-2 border-transparent"
                        >
                            {tab}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <TabsContent value="documents" className="space-y-8 animate-slide-up">
                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Upload Card */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-24 space-y-6">
                                <Card className="rounded-[2rem] border-none shadow-xl shadow-blue-500/5 bg-white overflow-hidden">
                                    <div className="p-8 space-y-6 text-center">
                                        <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto transition-transform hover:rotate-3">
                                            <Upload className="w-8 h-8" />
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-xl font-black text-gray-900">Add Documents</h3>
                                            <p className="text-sm text-gray-500 font-medium">Upload PDF files to start extracting data.</p>
                                        </div>
                                        <label className="block">
                                            <input
                                                type="file"
                                                accept=".pdf"
                                                onChange={handleFileUpload}
                                                disabled={uploading}
                                                className="hidden"
                                            />
                                            <Button className="w-full h-12 rounded-xl font-bold" disabled={uploading}>
                                                {uploading ? 'Processing...' : 'Choose PDF'}
                                            </Button>
                                        </label>
                                    </div>
                                </Card>
                            </div>
                        </div>

                        {/* List Card */}
                        <div className="lg:col-span-2 space-y-4">
                            <div className="flex justify-between items-center px-4">
                                <h3 className="text-xl font-black text-gray-900">Files</h3>
                                <button onClick={toggleSelectAll} className="text-xs font-bold text-blue-600 hover:underline">
                                    {selectedDocuments.size === documents.length ? 'Deselect All' : 'Select All'}
                                </button>
                            </div>

                            <div className="space-y-3">
                                {documents.map((doc) => (
                                    <div
                                        key={doc.id}
                                        onClick={() => toggleDocumentSelection(doc.id)}
                                        className={cn(
                                            "group p-5 rounded-2xl border bg-white transition-all cursor-pointer flex items-center gap-4",
                                            selectedDocuments.has(doc.id) ? "border-blue-600 shadow-lg shadow-blue-500/5 ring-1 ring-blue-600/10" : "border-gray-100 hover:border-blue-200"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                                            selectedDocuments.has(doc.id) ? "bg-blue-600 border-blue-600 text-white" : "border-gray-200 group-hover:border-blue-300"
                                        )}>
                                            {selectedDocuments.has(doc.id) && <Check className="w-3.5 h-3.5" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-gray-900 truncate">{doc.name}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                                                    {new Date(doc.createdAt).toLocaleDateString()}
                                                </span>
                                                <div className="w-1 h-1 rounded-full bg-gray-200" />
                                                <span className="text-[10px] text-blue-600 font-bold uppercase tracking-tight">{doc.status}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            {doc.docTypeDetected && (
                                                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-blue-100 text-blue-700 bg-blue-50/50">
                                                    {doc.docTypeDetected}
                                                </Badge>
                                            )}
                                            {doc.skipReason && (
                                                <span className="text-[9px] text-amber-600 font-bold uppercase tracking-widest">⚠️ Needs Attention</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {documents.length === 0 && (
                                    <div className="py-20 text-center space-y-4 rounded-3xl border-2 border-dashed border-gray-100">
                                        <p className="text-gray-400 font-medium">No documents uploaded yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="runs" className="animate-slide-up">
                    <div className="space-y-4">
                        {runs.map((run) => (
                            <div
                                key={run.id}
                                onClick={() => router.push(`/projects/${projectId}/review?runId=${run.id}`)}
                                className="group p-6 rounded-[2rem] bg-white border border-gray-100 hover:border-blue-100 hover:shadow-xl hover:shadow-blue-500/5 transition-all cursor-pointer flex items-center justify-between"
                            >
                                <div className="flex items-center gap-6">
                                    <div className={cn(
                                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                                        run.status === 'COMPLETED' ? "bg-green-50 text-green-600" : run.status === 'FAILED' ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                                    )}>
                                        <BarChart3 className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                            Extraction Run #{run.id.slice(-4).toUpperCase()}
                                        </h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                                                {new Date(run.createdAt).toLocaleString()}
                                            </span>
                                            <div className="w-1 h-1 rounded-full bg-gray-200" />
                                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">
                                                {run._count.records} Records Extracted
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Badge className={cn(
                                        "px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider",
                                        run.status === 'COMPLETED' ? "bg-green-100 text-green-700" : run.status === 'FAILED' ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                                    )}>
                                        {run.status}
                                    </Badge>
                                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                                </div>
                            </div>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="settings" className="animate-slide-up">
                    <div className="max-w-3xl mx-auto py-4">
                        <ProjectSettingsTab projectId={projectId} />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

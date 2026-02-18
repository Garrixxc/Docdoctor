'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
    Upload,
    Play,
    BarChart3,
    ArrowLeft,
    Check,
    FileText,
    ChevronRight,
    Zap
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import ProjectSettingsTab from '@/components/ProjectSettingsTab';

export default function ProjectPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.id as string;
    const fileInputRef = useRef<HTMLInputElement>(null);

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
            const presignedRes = await fetch('/api/upload/presigned-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filename: file.name,
                    fileType: file.type,
                    projectId,
                }),
            });

            if (!presignedRes.ok) throw new Error('Failed to get upload URL');
            const { uploadUrl, fileUrl } = await presignedRes.json();

            await fetch(uploadUrl, {
                method: 'PUT',
                body: file,
                headers: { 'Content-Type': file.type },
            });

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
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }

    async function triggerRun() {
        const documentIds = Array.from(selectedDocuments);
        if (documentIds.length === 0) return;

        await fetch(`/api/projects/${projectId}/runs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ documentIds }),
        });
        loadRuns();
        setSelectedDocuments(new Set());
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

    if (!project) {
        return (
            <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                <div className="w-12 h-12 bg-slate-200 rounded-lg mb-4" />
                <div className="h-4 w-32 bg-slate-100 rounded" />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-8">
                <div className="space-y-4">
                    <Button
                        variant="ghost"
                        onClick={() => router.push('/dashboard')}
                        className="p-0 h-auto text-slate-500 hover:text-blue-600 font-bold text-xs uppercase tracking-widest gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </Button>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                            <Zap className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-outfit font-bold text-slate-900 leading-tight">{project.name}</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 font-bold text-[10px] uppercase tracking-wider">
                                    {project.template.name}
                                </Badge>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    {documents.length} Documents • {runs.length} Runs
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button
                        onClick={triggerRun}
                        disabled={selectedDocuments.size === 0}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 px-6 rounded-lg shadow-md shadow-blue-100 transition-all active:scale-95"
                    >
                        <Play className="w-4 h-4 mr-2" />
                        Run Extractions ({selectedDocuments.size})
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="documents" className="w-full">
                <TabsList className="bg-slate-100/50 border border-slate-200 p-1 h-12 w-fit mb-8 rounded-lg">
                    <TabsTrigger value="documents" className="px-6 font-bold text-xs uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">Documents</TabsTrigger>
                    <TabsTrigger value="runs" className="px-6 font-bold text-xs uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">Runs</TabsTrigger>
                    <TabsTrigger value="settings" className="px-6 font-bold text-xs uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="documents" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Left: Upload area */}
                        <div className="lg:col-span-4">
                            <Card className="bg-white border-slate-200 shadow-sm border-2 border-dashed">
                                <CardHeader className="text-center pb-2">
                                    <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2">
                                        <Upload className="w-6 h-6" />
                                    </div>
                                    <CardTitle className="text-lg font-outfit font-bold">Add Source</CardTitle>
                                    <CardDescription>Upload PDF documents</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".pdf"
                                        onChange={handleFileUpload}
                                        disabled={uploading}
                                        className="hidden"
                                    />
                                    <Button
                                        variant="outline"
                                        className="w-full h-12 border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-600 hover:text-blue-600 font-bold rounded-lg transition-all"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploading}
                                    >
                                        {uploading ? 'Processing...' : 'Choose File'}
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right: Docs list */}
                        <div className="lg:col-span-8 space-y-4">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                    Documents
                                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{documents.length}</span>
                                </h3>
                                {documents.length > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            if (selectedDocuments.size === documents.length) {
                                                setSelectedDocuments(new Set());
                                            } else {
                                                setSelectedDocuments(new Set(documents.map(d => d.id)));
                                            }
                                        }}
                                        className="text-[10px] font-bold text-blue-600 hover:bg-blue-50 uppercase tracking-widest"
                                    >
                                        {selectedDocuments.size === documents.length ? 'Deselect All' : 'Select All'}
                                    </Button>
                                )}
                            </div>

                            {documents.length > 0 ? (
                                <div className="space-y-2">
                                    {documents.map((doc) => (
                                        <div
                                            key={doc.id}
                                            onClick={() => toggleDocumentSelection(doc.id)}
                                            className={cn(
                                                "group flex items-center justify-between p-4 rounded-xl border bg-white cursor-pointer transition-all",
                                                selectedDocuments.has(doc.id)
                                                    ? "border-blue-600 bg-blue-50/30"
                                                    : "border-slate-200 hover:border-blue-300 hover:shadow-sm"
                                            )}
                                        >
                                            <div className="flex items-center gap-4 min-w-0">
                                                <div className={cn(
                                                    "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                                                    selectedDocuments.has(doc.id) ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300 bg-white group-hover:border-blue-400"
                                                )}>
                                                    {selectedDocuments.has(doc.id) && <Check className="w-3 h-3 stroke-[3px]" />}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                                                        {doc.name}
                                                    </p>
                                                    <div className="flex items-center gap-3 mt-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                        <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                                                        {doc.docTypeDetected && (
                                                            <>
                                                                <span>•</span>
                                                                <span className="text-blue-500">{doc.docTypeDetected}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-400" />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-20 flex flex-col items-center text-center space-y-3 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
                                    <FileText className="w-10 h-10 text-slate-300" />
                                    <p className="text-slate-500 text-sm font-medium">No documents yet. Start by uploading a PDF.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="runs" className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-slate-900">Extraction Cycles</h3>
                        <Badge variant="outline" className="text-slate-500 border-slate-200 font-bold">{runs.length}</Badge>
                    </div>

                    {runs.length > 0 ? (
                        <div className="grid gap-3">
                            {runs.map((run) => (
                                <Card
                                    key={run.id}
                                    className="group hover:border-blue-300 cursor-pointer transition-all shadow-sm rounded-xl overflow-hidden"
                                    onClick={() => router.push(`/projects/${projectId}/review?runId=${run.id}`)}
                                >
                                    <CardContent className="p-5 flex items-center justify-between">
                                        <div className="flex items-center gap-6">
                                            <div className={cn(
                                                "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                                                run.status === 'COMPLETED' ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                                            )}>
                                                <BarChart3 className="w-6 h-6" />
                                            </div>
                                            <div className="space-y-1">
                                                <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                                    Run ID: {run.id.slice(-6).toUpperCase()}
                                                </h4>
                                                <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    <span>{new Date(run.createdAt).toLocaleString()}</span>
                                                    <span>•</span>
                                                    <span>{run._count.records} Records</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <Badge className={cn(
                                                "px-3 py-1 font-bold text-[10px] tracking-wider uppercase",
                                                run.status === 'COMPLETED' ? "bg-emerald-100 text-emerald-700 border-none" : "bg-blue-100 text-blue-700 border-none animate-pulse"
                                            )}>
                                                {run.status}
                                            </Badge>
                                            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-400" />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="py-20 flex flex-col items-center text-center space-y-3 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
                            <Zap className="w-10 h-10 text-slate-300" />
                            <p className="text-slate-500 text-sm font-medium">No runs triggered yet. Select some documents to begin.</p>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="settings" className="max-w-3xl">
                    <ProjectSettingsTab projectId={projectId} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

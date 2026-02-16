'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, Play, Shield, Receipt, User, BarChart3, ArrowLeft, Zap, Check, ArrowRight, Sparkles, FileText } from 'lucide-react';
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
            if (fileInputRef.current) fileInputRef.current.value = '';
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
        return (
            <div className="container mx-auto px-6 py-20 flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-indigo-600 animate-pulse" />
                </div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Waking up studio...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-6 py-10 space-y-12 animate-fade-in max-w-7xl">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
                <div className="space-y-6">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="flex items-center gap-2 text-[10px] font-bold text-slate-400 hover:text-indigo-600 transition-all uppercase tracking-[0.2em] group"
                    >
                        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" /> Path to Workspace
                    </button>
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-[2.5rem] bg-indigo-600 text-white flex items-center justify-center shadow-2xl shadow-indigo-500/10 group relative overflow-hidden">
                            <Zap className="w-10 h-10 fill-white/20 group-hover:scale-110 transition-transform duration-500" />
                            <div className="absolute inset-0 noise opacity-[0.05] pointer-events-none" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-4">
                                <h1 className="text-4xl lg:text-5xl font-outfit font-bold text-slate-900 tracking-tight leading-none">{project.name}</h1>
                                <Badge variant="outline" className="bg-white text-indigo-700 border-indigo-100 font-bold px-3 py-1 rounded-lg text-[9px] uppercase tracking-widest shadow-sm">
                                    {project.template.name}
                                </Badge>
                            </div>
                            <p className="text-lg text-slate-500 font-medium flex items-center flex-wrap gap-x-4 gap-y-2">
                                <span className="flex items-center gap-2"><span className="text-slate-900 font-bold">{documents.length}</span> Objects</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-200 hidden md:block" />
                                <span className="flex items-center gap-2"><span className="text-slate-900 font-bold">{runs.length}</span> Evolutions</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-200 hidden md:block" />
                                <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Established {new Date(project.createdAt).toLocaleDateString()}</span>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4">
                    <Button
                        size="lg"
                        onClick={triggerRun}
                        disabled={selectedDocuments.size === 0}
                        className="h-16 px-10 rounded-[1.25rem] font-bold bg-indigo-600 hover:bg-slate-900 text-white shadow-xl shadow-indigo-100 active:scale-95 transition-all text-lg gap-3"
                    >
                        <Play className="w-5 h-5 fill-white/20" />
                        Run Extraction ({selectedDocuments.size})
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="documents" className="w-full">
                <TabsList className="bg-transparent border-b border-slate-100 w-full justify-start h-auto p-0 gap-10 rounded-none mb-12">
                    {['documents', 'runs', 'settings'].map((tab) => (
                        <TabsTrigger
                            key={tab}
                            value={tab}
                            className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none px-2 py-6 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 data-[state=active]:text-indigo-600 transition-all border-b-2 border-transparent"
                        >
                            {tab}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <TabsContent value="documents" className="space-y-8 animate-slide-up">
                    <div className="grid lg:grid-cols-12 gap-12">
                        {/* Upload Card */}
                        <div className="lg:col-span-4">
                            <div className="sticky top-24 space-y-6">
                                <div className="noise glass rounded-[2.5rem] p-12 space-y-10 text-center border border-white/40 shadow-2xl shadow-slate-200/50">
                                    <div className="w-20 h-20 rounded-3xl bg-indigo-600 text-white flex items-center justify-center mx-auto transition-transform hover:rotate-6 shadow-xl shadow-indigo-100">
                                        <Upload className="w-10 h-10" />
                                    </div>
                                    <div className="space-y-4">
                                        <h3 className="text-2xl font-outfit font-bold text-slate-900 tracking-tight">Augment Studio</h3>
                                        <p className="text-sm text-slate-500 font-medium leading-relaxed">Infuse new datasets into your current orchestration stream.</p>
                                    </div>
                                    <div className="pt-4">
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".pdf"
                                            onChange={handleFileUpload}
                                            disabled={uploading}
                                            className="hidden"
                                        />
                                        <Button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-full h-16 rounded-2xl font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xl transition-all active:scale-95 text-lg gap-3"
                                            disabled={uploading}
                                        >
                                            {uploading ? (
                                                <>
                                                    <Zap className="w-5 h-5 animate-pulse" />
                                                    Processing...
                                                </>
                                            ) : (
                                                <>
                                                    Select PDF Source <ArrowRight className="w-5 h-5 opacity-50" />
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* List Card */}
                        <div className="lg:col-span-8 space-y-6">
                            <div className="flex justify-between items-center px-6">
                                <h3 className="text-xl font-outfit font-bold text-slate-900 flex items-center gap-3">
                                    Files <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-widest leading-none">{documents.length}</span>
                                </h3>
                                <button onClick={toggleSelectAll} className="text-[10px] font-bold text-indigo-600 hover:text-slate-900 transition-colors uppercase tracking-widest px-4 py-2 bg-indigo-50 rounded-xl">
                                    {selectedDocuments.size === documents.length ? 'Deselect All' : 'Select All'}
                                </button>
                            </div>

                            <div className="space-y-4">
                                {documents.map((doc) => (
                                    <div
                                        key={doc.id}
                                        onClick={() => toggleDocumentSelection(doc.id)}
                                        className={cn(
                                            "group p-6 rounded-[2rem] border bg-white transition-all cursor-pointer flex items-center gap-6",
                                            selectedDocuments.has(doc.id)
                                                ? "border-indigo-600 bg-indigo-50/10 shadow-xl shadow-indigo-100/20"
                                                : "border-slate-100 hover:border-indigo-200 hover:shadow-lg hover:shadow-slate-100/50"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all",
                                            selectedDocuments.has(doc.id) ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200" : "border-slate-100 bg-slate-50 group-hover:border-indigo-200"
                                        )}>
                                            {selectedDocuments.has(doc.id) && <Check className="w-4 h-4 stroke-[3px]" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-slate-900 text-lg group-hover:text-indigo-600 transition-colors truncate tracking-tight">{doc.name}</p>
                                            <div className="flex items-center gap-3 mt-1.5">
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest px-2 py-0.5 bg-slate-50 rounded-md">
                                                    {new Date(doc.createdAt).toLocaleDateString()}
                                                </span>
                                                <div className="w-1 h-1 rounded-full bg-slate-200" />
                                                <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest">{doc.status}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            {doc.docTypeDetected && (
                                                <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest border-slate-100 text-slate-600 bg-slate-50/50 px-3 py-1">
                                                    {doc.docTypeDetected}
                                                </Badge>
                                            )}
                                            {doc.skipReason && (
                                                <span className="text-[9px] text-amber-600 font-bold uppercase tracking-widest flex items-center gap-1">
                                                    <Shield className="w-3 h-3" /> Needs Attention
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {documents.length === 0 && (
                                    <div className="py-24 text-center space-y-6 rounded-[3rem] border-2 border-dashed border-slate-100 bg-slate-50/50">
                                        <div className="w-16 h-16 rounded-3xl bg-white border border-slate-100 flex items-center justify-center mx-auto shadow-sm">
                                            <FileText className="w-8 h-8 text-slate-300" />
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-slate-900 font-bold text-lg">No documents detected</p>
                                            <p className="text-slate-400 text-sm font-medium">Upload your first PDF to begin the orchestrations.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="runs" className="animate-slide-up">
                    <div className="space-y-6 max-w-5xl mx-auto">
                        {runs.length > 0 ? (
                            runs.map((run) => (
                                <div
                                    key={run.id}
                                    onClick={() => router.push(`/projects/${projectId}/review?runId=${run.id}`)}
                                    className="group p-8 rounded-[2.5rem] bg-white border border-slate-100 hover:border-indigo-100 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all cursor-pointer flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-8">
                                        <div className={cn(
                                            "w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all group-hover:scale-105 shadow-sm",
                                            run.status === 'COMPLETED' ? "bg-green-50 text-green-600 border border-green-100" : run.status === 'FAILED' ? "bg-red-50 text-red-600 border border-red-100" : "bg-indigo-50 text-indigo-600 border border-indigo-100"
                                        )}>
                                            <BarChart3 className="w-8 h-8" />
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors tracking-tight">
                                                Evolution Loop #{run.id.slice(-4).toUpperCase()}
                                            </h4>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest px-2 py-0.5 bg-slate-50 rounded-md">
                                                    {new Date(run.createdAt).toLocaleString()}
                                                </span>
                                                <div className="w-1 h-1 rounded-full bg-slate-200" />
                                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                                    {run._count.records} Records Identified
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <Badge className={cn(
                                            "px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-sm",
                                            run.status === 'COMPLETED' ? "bg-green-600 text-white border-none" : run.status === 'FAILED' ? "bg-red-600 text-white border-none" : "bg-indigo-600 text-white border-none animate-pulse"
                                        )}>
                                            {run.status}
                                        </Badge>
                                        <div className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all shadow-sm">
                                            <ArrowRight className="w-5 h-5" />
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-32 text-center space-y-6 rounded-[3rem] border-2 border-dashed border-slate-100 bg-slate-50/50">
                                <div className="w-16 h-16 rounded-3xl bg-white border border-slate-100 flex items-center justify-center mx-auto shadow-sm">
                                    <Sparkles className="w-8 h-8 text-slate-300" />
                                </div>
                                <div className="space-y-2">
                                    <p className="text-slate-900 font-bold text-lg">No extraction loops triggered</p>
                                    <p className="text-slate-400 text-sm font-medium">Select datasets above to begin the intelligence cycle.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="settings" className="animate-slide-up">
                    <div className="max-w-4xl mx-auto py-4">
                        <ProjectSettingsTab projectId={projectId} />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

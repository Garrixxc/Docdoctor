'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
    Upload, Play, BarChart3, ArrowLeft, Check, FileText,
    ChevronRight, Zap, Search, Tag, Loader2, XCircle, CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import ProjectSettingsTab from '@/components/ProjectSettingsTab';

interface HtsResult {
    code: string;
    description: string;
    section: string | null;
    chapter: string | null;
    similarity: number;
}

export default function ProjectPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.id as string;

    const [project, setProject] = useState<any>(null);
    const [documents, setDocuments] = useState<any[]>([]);
    const [runs, setRuns] = useState<any[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<string | null>(null);
    const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

    // HTS Search state
    const [htsQuery, setHtsQuery] = useState('');
    const [htsResults, setHtsResults] = useState<HtsResult[]>([]);
    const [htsLoading, setHtsLoading] = useState(false);
    const [htsError, setHtsError] = useState<string | null>(null);
    const htsDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const loadProject = useCallback(async () => {
        const res = await fetch(`/api/projects/${projectId}`);
        const data = await res.json();
        setProject(data.project);
    }, [projectId]);

    const loadDocuments = useCallback(async () => {
        const res = await fetch(`/api/projects/${projectId}/documents`);
        const data = await res.json();
        setDocuments(data.documents || []);
    }, [projectId]);

    const loadRuns = useCallback(async () => {
        const res = await fetch(`/api/projects/${projectId}/runs`);
        const data = await res.json();
        setRuns(data.runs || []);
        return data.runs || [];
    }, [projectId]);

    // Start / stop polling based on run status
    useEffect(() => {
        const hasActiveRun = runs.some(r => r.status === 'PENDING' || r.status === 'PROCESSING');
        if (hasActiveRun && !pollingRef.current) {
            pollingRef.current = setInterval(async () => {
                const updated = await loadRuns();
                const stillActive = updated.some((r: any) =>
                    r.status === 'PENDING' || r.status === 'PROCESSING'
                );
                if (!stillActive && pollingRef.current) {
                    clearInterval(pollingRef.current);
                    pollingRef.current = null;
                    showToast('Run completed!', 'success');
                }
            }, 3000);
        } else if (!hasActiveRun && pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
        return () => {
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
                pollingRef.current = null;
            }
        };
    }, [runs, loadRuns]);

    useEffect(() => {
        loadProject();
        loadDocuments();
        loadRuns();
    }, [projectId, loadProject, loadDocuments, loadRuns]);

    // Drag-and-drop upload
    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setUploading(true);
        setUploadProgress(`Uploading ${file.name}...`);
        try {
            const presignedRes = await fetch('/api/upload/presigned-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename: file.name, fileType: file.type, projectId }),
            });
            if (!presignedRes.ok) throw new Error('Failed to get upload URL');
            const { uploadUrl, fileUrl } = await presignedRes.json();

            setUploadProgress('Transferring to storage...');
            await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });

            setUploadProgress('Registering document...');
            await fetch(`/api/projects/${projectId}/documents`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: file.name, fileUrl, fileType: file.type, fileSize: file.size }),
            });

            await loadDocuments();
            showToast(`"${file.name}" uploaded successfully`, 'success');
        } catch (error: any) {
            showToast(error.message || 'Upload failed', 'error');
        } finally {
            setUploading(false);
            setUploadProgress(null);
        }
    }, [projectId, loadDocuments]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
        disabled: uploading,
        maxFiles: 1,
    });

    async function triggerRun() {
        const documentIds = Array.from(selectedDocuments);
        if (documentIds.length === 0) return;

        await fetch(`/api/projects/${projectId}/runs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ documentIds }),
        });
        showToast(`Started extraction on ${documentIds.length} document(s)`, 'success');
        setSelectedDocuments(new Set());
        await loadRuns();
    }

    function toggleDocumentSelection(docId: string) {
        const newSelection = new Set(selectedDocuments);
        if (newSelection.has(docId)) newSelection.delete(docId);
        else newSelection.add(docId);
        setSelectedDocuments(newSelection);
    }

    // HTS search with debounce
    useEffect(() => {
        if (htsDebounceRef.current) clearTimeout(htsDebounceRef.current);
        if (!htsQuery.trim()) { setHtsResults([]); setHtsError(null); return; }

        htsDebounceRef.current = setTimeout(async () => {
            setHtsLoading(true);
            setHtsError(null);
            try {
                const res = await fetch('/api/hts/search', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: htsQuery, topK: 7 }),
                });
                if (!res.ok) throw new Error('Search failed');
                const data = await res.json();
                setHtsResults(data.results || []);
            } catch (err: any) {
                setHtsError(err.message);
            } finally {
                setHtsLoading(false);
            }
        }, 500);
    }, [htsQuery]);

    const isTradeProject = project?.template?.slug === 'trade-invoice';

    if (!project) {
        return (
            <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                <div className="w-12 h-12 bg-slate-200 rounded-lg mb-4" />
                <div className="h-4 w-32 bg-slate-100 rounded" />
            </div>
        );
    }

    const activeRunCount = runs.filter(r => r.status === 'PENDING' || r.status === 'PROCESSING').length;

    return (
        <div className="space-y-8 max-w-6xl mx-auto">

            {/* Toast Notification */}
            {toast && (
                <div className={cn(
                    'fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl text-white text-sm font-bold animate-in slide-in-from-top-4 duration-300',
                    toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-500'
                )}>
                    {toast.type === 'success'
                        ? <CheckCircle2 className="w-4 h-4 shrink-0" />
                        : <XCircle className="w-4 h-4 shrink-0" />
                    }
                    {toast.msg}
                </div>
            )}

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
                                    {documents.length} Documents · {runs.length} Runs
                                </span>
                                {activeRunCount > 0 && (
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 uppercase tracking-widest animate-pulse">
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                        {activeRunCount} Processing
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button
                        onClick={triggerRun}
                        disabled={selectedDocuments.size === 0}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 px-6 rounded-lg shadow-md shadow-blue-100 transition-all active:scale-95 disabled:opacity-40"
                    >
                        <Play className="w-4 h-4 mr-2" />
                        Run Extractions ({selectedDocuments.size})
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="documents" className="w-full">
                <TabsList className="bg-slate-100/50 border border-slate-200 p-1 h-12 w-fit mb-8 rounded-lg">
                    <TabsTrigger value="documents" className="px-6 font-bold text-xs uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">Documents</TabsTrigger>
                    <TabsTrigger value="runs" className="px-6 font-bold text-xs uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">
                        Runs
                        {activeRunCount > 0 && (
                            <span className="ml-2 w-2 h-2 rounded-full bg-amber-400 inline-block animate-pulse" />
                        )}
                    </TabsTrigger>
                    {isTradeProject && (
                        <TabsTrigger value="hts" className="px-6 font-bold text-xs uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">HTS Lookup</TabsTrigger>
                    )}
                    <TabsTrigger value="settings" className="px-6 font-bold text-xs uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">Settings</TabsTrigger>
                </TabsList>

                {/* === DOCUMENTS TAB === */}
                <TabsContent value="documents" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Drag-and-Drop Upload */}
                        <div className="lg:col-span-4">
                            <div
                                {...getRootProps()}
                                className={cn(
                                    'relative flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border-2 border-dashed cursor-pointer transition-all min-h-[200px] text-center',
                                    isDragActive
                                        ? 'border-blue-500 bg-blue-50/60 scale-[1.01] shadow-lg shadow-blue-100'
                                        : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/30',
                                    uploading && 'pointer-events-none opacity-70'
                                )}
                            >
                                <input {...getInputProps()} />
                                <div className={cn(
                                    'w-14 h-14 rounded-2xl flex items-center justify-center transition-all',
                                    isDragActive ? 'bg-blue-600 text-white scale-110' : 'bg-blue-50 text-blue-500'
                                )}>
                                    {uploading
                                        ? <Loader2 className="w-7 h-7 animate-spin" />
                                        : <Upload className="w-7 h-7" />
                                    }
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800 text-base">
                                        {uploading ? uploadProgress : isDragActive ? 'Drop your PDF here' : 'Drag & drop a PDF'}
                                    </p>
                                    {!uploading && (
                                        <p className="text-slate-400 text-sm mt-1">
                                            or <span className="text-blue-600 font-semibold">click to browse</span>
                                        </p>
                                    )}
                                </div>
                                {!uploading && (
                                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">PDF only · Max 50 MB</p>
                                )}
                            </div>
                        </div>

                        {/* Document List */}
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
                                            if (selectedDocuments.size === documents.length) setSelectedDocuments(new Set());
                                            else setSelectedDocuments(new Set(documents.map(d => d.id)));
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
                                                'group flex items-center justify-between p-4 rounded-xl border bg-white cursor-pointer transition-all',
                                                selectedDocuments.has(doc.id)
                                                    ? 'border-blue-600 bg-blue-50/30'
                                                    : 'border-slate-200 hover:border-blue-300 hover:shadow-sm'
                                            )}
                                        >
                                            <div className="flex items-center gap-4 min-w-0">
                                                <div className={cn(
                                                    'w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0',
                                                    selectedDocuments.has(doc.id) ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white group-hover:border-blue-400'
                                                )}>
                                                    {selectedDocuments.has(doc.id) && <Check className="w-3 h-3 stroke-[3px]" />}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">{doc.name}</p>
                                                    <div className="flex items-center gap-3 mt-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                        <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                                                        {doc.docTypeDetected && (
                                                            <><span>·</span><span className="text-blue-500">{doc.docTypeDetected}</span></>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-400 shrink-0" />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-20 flex flex-col items-center text-center space-y-3 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
                                    <FileText className="w-10 h-10 text-slate-300" />
                                    <p className="text-slate-500 text-sm font-medium">No documents yet. Drag a PDF here to start.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </TabsContent>

                {/* === RUNS TAB === */}
                <TabsContent value="runs" className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2">
                            Extraction Runs
                            {activeRunCount > 0 && (
                                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                                    <Loader2 className="w-3 h-3 animate-spin" /> {activeRunCount} live
                                </span>
                            )}
                        </h3>
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
                                                'w-12 h-12 rounded-xl flex items-center justify-center transition-colors',
                                                run.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600'
                                                    : run.status === 'FAILED' ? 'bg-red-50 text-red-500'
                                                        : 'bg-amber-50 text-amber-500'
                                            )}>
                                                {run.status === 'PROCESSING' || run.status === 'PENDING'
                                                    ? <Loader2 className="w-6 h-6 animate-spin" />
                                                    : <BarChart3 className="w-6 h-6" />
                                                }
                                            </div>
                                            <div className="space-y-1">
                                                <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                                    Run #{run.id.slice(-6).toUpperCase()}
                                                </h4>
                                                <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    <span>{new Date(run.createdAt).toLocaleString()}</span>
                                                    <span>·</span>
                                                    <span>{run._count?.records ?? 0} Records</span>
                                                    {run.costEstimate != null && (
                                                        <><span>·</span><span className="text-emerald-600">${Number(run.costEstimate).toFixed(4)}</span></>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <Badge className={cn(
                                                'px-3 py-1 font-bold text-[10px] tracking-wider uppercase',
                                                run.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700 border-none'
                                                    : run.status === 'FAILED' ? 'bg-red-100 text-red-700 border-none'
                                                        : 'bg-amber-100 text-amber-700 border-none animate-pulse'
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
                            <p className="text-slate-500 text-sm font-medium">No runs triggered yet. Select documents to begin.</p>
                        </div>
                    )}
                </TabsContent>

                {/* === HTS LOOKUP TAB (Trade Docs only) === */}
                {isTradeProject && (
                    <TabsContent value="hts" className="space-y-6">
                        <div className="max-w-2xl">
                            <div className="mb-6">
                                <h3 className="font-outfit font-bold text-xl text-slate-900 mb-1">HS / HTS Code Lookup</h3>
                                <p className="text-slate-500 text-sm">Semantically search the Harmonized System schedule by product description. Powered by vector similarity.</p>
                            </div>

                            <div className="relative mb-6">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    value={htsQuery}
                                    onChange={e => setHtsQuery(e.target.value)}
                                    placeholder="e.g. cotton t-shirt, laptop computer, crude petroleum…"
                                    className="w-full pl-11 pr-4 py-4 rounded-xl border border-slate-200 bg-white text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all shadow-sm"
                                />
                                {htsLoading && (
                                    <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 animate-spin" />
                                )}
                            </div>

                            {htsError && (
                                <div className="flex items-center gap-2 text-red-600 text-sm font-medium bg-red-50 border border-red-100 rounded-xl p-4 mb-4">
                                    <XCircle className="w-4 h-4 shrink-0" />
                                    {htsError === 'Search failed'
                                        ? 'HTS vector database not seeded yet. Run: npm run db:seed'
                                        : htsError}
                                </div>
                            )}

                            {htsResults.length > 0 && (
                                <div className="space-y-2">
                                    {htsResults.map((result, i) => (
                                        <div key={result.code} className={cn(
                                            'flex items-start justify-between gap-4 p-4 rounded-xl border bg-white transition-all',
                                            i === 0 ? 'border-blue-200 shadow-sm' : 'border-slate-100 hover:border-slate-200'
                                        )}>
                                            <div className="flex items-start gap-3 min-w-0">
                                                <div className="shrink-0 flex items-center gap-1">
                                                    <Tag className={cn('w-4 h-4', i === 0 ? 'text-blue-600' : 'text-slate-400')} />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className={cn('font-mono font-bold text-sm', i === 0 ? 'text-blue-700' : 'text-slate-700')}>
                                                            {result.code}
                                                        </span>
                                                        {i === 0 && (
                                                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full uppercase tracking-widest">Best Match</span>
                                                        )}
                                                    </div>
                                                    <p className="text-slate-700 text-sm font-medium mt-0.5">{result.description}</p>
                                                    {result.section && (
                                                        <p className="text-slate-400 text-xs mt-1 truncate">{result.section}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="shrink-0 text-right">
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Match</div>
                                                <div className={cn(
                                                    'text-sm font-bold',
                                                    result.similarity > 0.8 ? 'text-emerald-600'
                                                        : result.similarity > 0.6 ? 'text-amber-600'
                                                            : 'text-slate-500'
                                                )}>
                                                    {(result.similarity * 100).toFixed(0)}%
                                                </div>
                                                <div className="w-16 h-1 rounded-full bg-slate-100 mt-1">
                                                    <div
                                                        className={cn('h-full rounded-full', result.similarity > 0.8 ? 'bg-emerald-500' : result.similarity > 0.6 ? 'bg-amber-400' : 'bg-slate-400')}
                                                        style={{ width: `${Math.min(result.similarity * 100, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {!htsLoading && !htsError && htsQuery && htsResults.length === 0 && (
                                <div className="py-12 flex flex-col items-center text-center space-y-3 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                    <Tag className="w-8 h-8 text-slate-300" />
                                    <p className="text-slate-500 text-sm">No results found. Try a different description.</p>
                                </div>
                            )}

                            {!htsQuery && (
                                <div className="mt-8 grid grid-cols-2 gap-3">
                                    {['cotton t-shirt', 'laptop computer', 'crude palm oil', 'lithium-ion battery'].map(q => (
                                        <button
                                            key={q}
                                            onClick={() => setHtsQuery(q)}
                                            className="text-left p-3 rounded-xl border border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50 transition-all text-sm text-slate-600 font-medium"
                                        >
                                            <Search className="w-3.5 h-3.5 inline mr-2 text-slate-400" />
                                            {q}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </TabsContent>
                )}

                <TabsContent value="settings" className="max-w-3xl">
                    <ProjectSettingsTab projectId={projectId} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

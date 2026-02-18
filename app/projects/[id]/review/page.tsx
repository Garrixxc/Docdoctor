'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Check,
    X,
    Eye,
    ArrowLeft,
    Download,
    Search,
    Filter,
    CheckCircle2,
    AlertCircle,
    Clock,
    ExternalLink,
    ChevronRight,
    FileText
} from 'lucide-react';
import { EvidenceDrawer } from '@/components/evidence-drawer';
import { cn } from '@/lib/utils/cn';

export default function ReviewPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const projectId = params.id as string;
    const runId = searchParams.get('runId');

    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingField, setEditingField] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    const [evidenceDrawer, setEvidenceDrawer] = useState<{
        isOpen: boolean;
        field: any;
        document: any;
    } | null>(null);

    useEffect(() => {
        if (runId) {
            loadRecords();
        }
    }, [runId]);

    async function loadRecords() {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch(`/api/runs/${runId}/records`);
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || `HTTP error! status: ${res.status}`);
            }

            setRecords(data.records || []);
        } catch (err: any) {
            console.error('Failed to load records:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function updateField(fieldId: string, action: string, value?: any) {
        await fetch(`/api/records/${fieldId.split('-')[0]}/fields/${fieldId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, value }),
        });
        loadRecords();
        setEditingField(null);
    }

    async function exportData() {
        try {
            const res = await fetch(`/api/projects/${projectId}/export`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ runId }),
            });

            if (!res.ok) {
                const error = await res.json();
                alert(`Export failed: ${error.error || 'Unknown error'}`);
                return;
            }

            const data = await res.json();
            if (data.downloadUrl) {
                const downloadRes = await fetch('/api/download', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fileUrl: data.downloadUrl }),
                });

                if (downloadRes.ok) {
                    const { presignedUrl } = await downloadRes.json();
                    window.open(presignedUrl, '_blank');
                } else {
                    window.open(data.downloadUrl, '_blank');
                }
            }
        } catch (error) {
            console.error('Export failed:', error);
        }
    }

    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 0.8) return 'bg-emerald-50 text-emerald-700 border-emerald-100';
        if (confidence >= 0.6) return 'bg-amber-50 text-amber-700 border-amber-100';
        return 'bg-rose-50 text-rose-700 border-rose-100';
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PASS':
            case 'COMPLIANT':
                return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 font-bold text-[10px] uppercase tracking-wider">Pass</Badge>;
            case 'MISSING':
                return <Badge variant="secondary" className="bg-slate-100 text-slate-500 font-bold text-[10px] uppercase tracking-wider">Missing</Badge>;
            case 'FAIL_VALIDATION':
            case 'NON_COMPLIANT':
                return <Badge variant="destructive" className="bg-rose-50 text-rose-700 border-rose-100 font-bold text-[10px] uppercase tracking-wider">Failed</Badge>;
            case 'NEEDS_REVIEW':
                return <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50/50 font-bold text-[10px] uppercase tracking-wider">Review</Badge>;
            default:
                return <Badge className="font-bold text-[10px] uppercase tracking-wider">{status}</Badge>;
        }
    };

    if (loading) {
        return (
            <div className="space-y-8 animate-pulse max-w-6xl mx-auto">
                <div className="h-10 w-64 bg-slate-200 rounded-lg" />
                <div className="space-y-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-48 bg-slate-100 rounded-xl" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            {/* Sticky Header */}
            <div className="sticky top-16 z-30 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/80 backdrop-blur-md py-6 border-b border-slate-200">
                <div className="space-y-1">
                    <Button
                        variant="ghost"
                        onClick={() => router.push(`/projects/${projectId}`)}
                        className="p-0 h-auto text-slate-500 hover:text-blue-600 font-bold text-xs uppercase tracking-widest gap-2 mb-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Project
                    </Button>
                    <h1 className="text-2xl font-outfit font-bold text-slate-900">Review Extraction Data</h1>
                    <p className="text-slate-500 text-sm">Validating results for Loop #{runId?.slice(-6).toUpperCase()}</p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold h-11 px-6 rounded-lg shadow-sm"
                        onClick={exportData}
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                    </Button>
                    <Button
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 px-6 rounded-lg shadow-md shadow-blue-100"
                        onClick={() => router.push(`/projects/${projectId}`)}
                    >
                        Complete Review
                    </Button>
                </div>
            </div>

            {error ? (
                <Card className="border-rose-200 bg-rose-50">
                    <CardContent className="p-8 text-center space-y-4">
                        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
                        <div>
                            <h3 className="text-lg font-bold text-rose-900">Error loading records</h3>
                            <p className="text-rose-700 text-sm mt-1">{error}</p>
                        </div>
                        <Button variant="outline" className="border-rose-200 hover:bg-white" onClick={loadRecords}>Retry Connection</Button>
                    </CardContent>
                </Card>
            ) : records.length === 0 ? (
                <div className="py-32 flex flex-col items-center text-center space-y-4 bg-white rounded-2xl border border-dashed border-slate-200">
                    <Clock className="w-12 h-12 text-slate-300" />
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">No records identified</h3>
                        <p className="text-slate-500 text-sm mt-1">If the run just started, it might take a few minutes for data to appear.</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-8 pb-20">
                    {records.map((record) => (
                        <Card key={record.id} className="bg-white border-slate-200 shadow-sm overflow-hidden rounded-xl">
                            <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                                        <FileText className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-base">{record.document.name}</h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{record.document.docTypeDetected || 'Unknown Type'}</p>
                                    </div>
                                </div>
                                {getStatusBadge(record.recordStatus)}
                            </div>

                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/50 text-left border-b border-slate-100">
                                                <th className="py-3 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Field</th>
                                                <th className="py-3 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Extracted Value</th>
                                                <th className="py-3 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Confidence</th>
                                                <th className="py-3 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Validation</th>
                                                <th className="py-3 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {record.fields.map((field: any) => (
                                                <tr key={field.id} className="group hover:bg-slate-50/50 transition-colors">
                                                    <td className="py-4 px-6">
                                                        <span className="text-sm font-bold text-slate-700">{field.fieldName}</span>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        {editingField === field.id ? (
                                                            <div className="flex items-center gap-2">
                                                                <Input
                                                                    value={editValue}
                                                                    onChange={(e) => setEditValue(e.target.value)}
                                                                    className="h-9 min-w-[200px]"
                                                                    autoFocus
                                                                />
                                                                <Button size="sm" className="h-9 px-3 bg-blue-600" onClick={() => updateField(field.id, 'EDIT', editValue)}>
                                                                    <Check className="w-4 h-4" />
                                                                </Button>
                                                                <Button size="sm" variant="ghost" className="h-9 px-3" onClick={() => setEditingField(null)}>
                                                                    <X className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <div
                                                                className="text-sm text-slate-600 bg-slate-100/30 px-3 py-1.5 rounded-lg border border-transparent hover:border-slate-200 hover:bg-white cursor-pointer transition-all inline-block min-w-[100px]"
                                                                onClick={() => {
                                                                    setEditingField(field.id);
                                                                    setEditValue(JSON.stringify(field.extractedValue).replace(/^"|"$/g, ''));
                                                                }}
                                                            >
                                                                {JSON.stringify(field.extractedValue).replace(/^"|"$/g, '') || <span className="text-slate-400 italic">Empty</span>}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <Badge variant="outline" className={cn("font-bold text-[10px] border", getConfidenceColor(Number(field.confidence)))}>
                                                            {(Number(field.confidence) * 100).toFixed(0)}%
                                                        </Badge>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex flex-col gap-1">
                                                            {getStatusBadge(field.fieldStatus || field.validationStatus)}
                                                            {field.validationErrorsJson && field.validationErrorsJson.length > 0 && (
                                                                <span className="text-[10px] text-rose-500 font-medium">
                                                                    {field.validationErrorsJson[0].message}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6 text-right">
                                                        <div className="flex gap-2 justify-end">
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                                                                onClick={() => setEvidenceDrawer({
                                                                    isOpen: true,
                                                                    field,
                                                                    document: record.document,
                                                                })}
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </Button>
                                                            {!field.isApproved ? (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="h-8 px-3 border-slate-200 text-slate-600 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 font-bold text-[10px] uppercase tracking-wider"
                                                                    onClick={() => updateField(field.id, 'APPROVE')}
                                                                >
                                                                    <Check className="w-3 h-3 mr-1.5" />
                                                                    Approve
                                                                </Button>
                                                            ) : (
                                                                <div className="flex items-center gap-1.5 text-emerald-600 px-3 py-1">
                                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                                    <span className="text-[10px] font-bold uppercase tracking-wider">Verified</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Evidence Drawer */}
            {evidenceDrawer && (
                <EvidenceDrawer
                    isOpen={evidenceDrawer.isOpen}
                    onClose={() => setEvidenceDrawer(null)}
                    fieldName={evidenceDrawer.field.fieldName}
                    extractedValue={evidenceDrawer.field.extractedValue}
                    confidence={Number(evidenceDrawer.field.confidence)}
                    evidence={evidenceDrawer.field.evidenceJson}
                    documentName={evidenceDrawer.document.name}
                    documentUrl={evidenceDrawer.document.fileUrl}
                />
            )}
        </div>
    );
}

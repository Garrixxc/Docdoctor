'use client';

import { X, FileText, ExternalLink, Zap, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/cn';

export interface EvidenceData {
    snippet?: string;
    page?: number;
    charOffsets?: { start: number; end: number };
    bounds?: { x: number; y: number; width: number; height: number };
}

export interface EvidenceDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    fieldName: string;
    extractedValue: any;
    confidence: number;
    evidence: EvidenceData | null;
    documentName: string;
    documentUrl?: string;
}

export function EvidenceDrawer({
    isOpen,
    onClose,
    fieldName,
    extractedValue,
    confidence,
    evidence,
    documentName,
    documentUrl,
}: EvidenceDrawerProps) {
    if (!isOpen) return null;

    const handleOpenPDF = async () => {
        if (!documentUrl) return;

        try {
            const res = await fetch('/api/download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileUrl: documentUrl }),
            });

            if (res.ok) {
                const { presignedUrl } = await res.json();
                window.open(presignedUrl, '_blank');
            } else {
                window.open(documentUrl, '_blank');
            }
        } catch (error) {
            console.error('Failed to open PDF:', error);
        }
    };

    const getConfidenceColor = () => {
        if (confidence >= 0.8) return 'bg-emerald-500';
        if (confidence >= 0.6) return 'bg-amber-500';
        return 'bg-rose-500';
    };

    const getConfidenceText = () => {
        if (confidence >= 0.8) return 'text-emerald-600';
        if (confidence >= 0.6) return 'text-amber-600';
        return 'text-rose-600';
    };

    return (
        <>
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity animate-in fade-in" onClick={onClose} />
            <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 overflow-y-auto animate-in slide-in-from-right duration-300">
                <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
                    <div>
                        <h2 className="text-xl font-outfit font-bold text-slate-900">Evidence Details</h2>
                        <div className="flex items-center gap-2 mt-0.5">
                            <FileText className="w-3 h-3 text-slate-400" />
                            <span className="text-xs font-medium text-slate-500 truncate max-w-[200px]">{documentName}</span>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-slate-100 h-10 w-10">
                        <X className="w-5 h-5 text-slate-500" />
                    </Button>
                </div>

                <div className="p-8 space-y-10">
                    {/* Header Info */}
                    <div className="space-y-6">
                        <div className="space-y-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Target Field</span>
                            <div className="text-xl font-outfit font-bold text-slate-900">{fieldName}</div>
                        </div>

                        <div className="space-y-3">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Extracted Knowledge</span>
                            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                                <p className="text-lg font-bold text-blue-700 leading-tight">
                                    {extractedValue !== null && extractedValue !== undefined
                                        ? JSON.stringify(extractedValue).replace(/^"|"$/g, '')
                                        : <span className="text-blue-300 italic">No entry detected</span>}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-end">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Extraction Confidence</span>
                                <span className={cn("text-xs font-bold", getConfidenceText())}>
                                    {(confidence * 100).toFixed(0)}% Certainty
                                </span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className={cn("h-full transition-all duration-1000", getConfidenceColor())}
                                    style={{ width: `${confidence * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Source Evidence */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <h3 className="font-bold text-slate-900">Verification Source</h3>
                        </div>

                        {evidence ? (
                            <div className="space-y-4">
                                {evidence.page && (
                                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none font-bold text-[10px] uppercase tracking-wider">
                                        Found on Page {evidence.page}
                                    </Badge>
                                )}
                                {evidence.snippet && (
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 relative overflow-hidden">
                                        <div className="absolute left-0 top-0 w-1 h-full bg-blue-600" />
                                        <p className="text-sm font-medium text-slate-400 mb-3 uppercase tracking-widest text-[10px]">Context Snippet</p>
                                        <p className="text-sm text-slate-700 font-mono leading-relaxed whitespace-pre-wrap">{evidence.snippet}</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center space-y-2">
                                <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
                                <p className="text-sm font-bold text-slate-600">Verification reference missing</p>
                                <p className="text-xs text-slate-400">Manual validation recommended for this data point.</p>
                            </div>
                        )}
                    </div>

                    <div className="pt-8 border-t border-slate-100">
                        {documentUrl && (
                            <Button
                                onClick={handleOpenPDF}
                                className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg shadow-slate-200 flex items-center justify-center gap-2 group"
                            >
                                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-400 transition-colors" />
                                Open Source Document
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

'use client';

import { X, FileText, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
            alert('Failed to open PDF');
        }
    };

    const getConfidenceColor = () => {
        if (confidence >= 0.8) return 'bg-green-500';
        if (confidence >= 0.6) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    const getConfidenceBadgeVariant = (): 'default' | 'secondary' | 'destructive' => {
        if (confidence >= 0.8) return 'default';
        if (confidence >= 0.6) return 'secondary';
        return 'destructive';
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
            <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 overflow-y-auto">
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold">Field Evidence</h2>
                        <p className="text-sm text-gray-600">{documentName}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="space-y-2">
                        <h3 className="font-medium text-gray-700">Field Name</h3>
                        <p className="text-lg font-mono bg-gray-50 p-3 rounded">{fieldName}</p>
                    </div>

                    <div className="space-y-2">
                        <h3 className="font-medium text-gray-700">Extracted Value</h3>
                        <p className="text-lg bg-blue-50 p-3 rounded border border-blue-200">
                            {extractedValue !== null && extractedValue !== undefined
                                ? JSON.stringify(extractedValue).replace(/^"|"$/g, '')
                                : 'N/A'}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <h3 className="font-medium text-gray-700">Confidence Score</h3>
                        <div className="flex items-center gap-3">
                            <div className="flex-1 bg-gray-200 rounded-full h-3">
                                <div
                                    className={`h-3 rounded-full transition-all ${getConfidenceColor()}`}
                                    style={{ width: `${confidence * 100}%` }}
                                />
                            </div>
                            <Badge variant={getConfidenceBadgeVariant()}>
                                {(confidence * 100).toFixed(1)}%
                            </Badge>
                        </div>
                    </div>

                    {evidence ? (
                        <div className="space-y-4">
                            <h3 className="font-medium text-gray-700">Evidence from Document</h3>
                            {evidence.page && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <FileText className="w-4 h-4" />
                                    <span>Page {evidence.page}</span>
                                </div>
                            )}
                            {evidence.snippet && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                                    <p className="text-sm font-medium text-gray-700 mb-2">Text Snippet:</p>
                                    <p className="text-sm font-mono whitespace-pre-wrap">{evidence.snippet}</p>
                                </div>
                            )}
                            {evidence.charOffsets && (
                                <div className="text-xs text-gray-500">
                                    Character offsets: {evidence.charOffsets.start} - {evidence.charOffsets.end}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-gray-50 border border-gray-200 rounded p-4 text-center">
                            <p className="text-sm text-gray-600">No evidence data available for this field</p>
                        </div>
                    )}

                    {documentUrl && (
                        <div className="pt-4 border-t">
                            <Button onClick={handleOpenPDF} variant="outline" className="w-full">
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Open Source PDF
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

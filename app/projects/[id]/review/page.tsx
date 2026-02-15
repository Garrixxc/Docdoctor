'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Check, X, Eye } from 'lucide-react';
import { EvidenceDrawer } from '@/components/evidence-drawer';

export default function ReviewPage() {
    const params = useParams();
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
                // Generate presigned URL for download
                const downloadRes = await fetch('/api/download', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fileUrl: data.downloadUrl }),
                });

                if (downloadRes.ok) {
                    const { presignedUrl } = await downloadRes.json();
                    window.open(presignedUrl, '_blank');
                } else {
                    // Fallback to direct URL
                    window.open(data.downloadUrl, '_blank');
                }

                alert('Export successful! Download started.');
            }
        } catch (error) {
            console.error('Export failed:', error);
            alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 0.8) return 'bg-green-100 text-green-800';
        if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800';
        return 'bg-red-100 text-red-800';
    };

    const getFieldStatusBadge = (fieldStatus: string) => {
        switch (fieldStatus) {
            case 'PASS':
                return <Badge variant="default">Pass</Badge>;
            case 'MISSING':
                return <Badge variant="secondary">Missing</Badge>;
            case 'FAIL_VALIDATION':
                return <Badge variant="destructive">Failed</Badge>;
            case 'NEEDS_REVIEW':
                return <Badge variant="outline">Needs Review</Badge>;
            case 'SKIPPED_WRONG_DOC_TYPE':
                return <Badge variant="secondary">Skipped</Badge>;
            default:
                return <Badge>{fieldStatus}</Badge>;
        }
    };

    const getRecordStatusBadge = (recordStatus: string) => {
        switch (recordStatus) {
            case 'COMPLIANT':
                return <Badge variant="default" className="bg-green-600">Compliant</Badge>;
            case 'NON_COMPLIANT':
                return <Badge variant="destructive">Non-Compliant</Badge>;
            case 'NEEDS_REVIEW':
                return <Badge variant="outline">Needs Review</Badge>;
            case 'SKIPPED':
                return <Badge variant="secondary">Skipped</Badge>;
            default:
                return <Badge>{recordStatus}</Badge>;
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Review Extracted Data</h1>
                <Button onClick={exportData}>Export to CSV</Button>
            </div>

            {loading && (
                <div className="text-center py-20">
                    <p className="text-gray-500">Loading records...</p>
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded mb-6">
                    <p className="font-bold">Error loading records:</p>
                    <p>{error}</p>
                    <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={loadRecords}
                    >
                        Retry
                    </Button>
                </div>
            )}

            {!loading && !error && records.length === 0 && (
                <div className="text-center py-20 bg-gray-50 rounded border border-dashed">
                    <p className="text-gray-500 italic">No records found for this run.</p>
                    <p className="text-sm text-gray-400 mt-2">Check the Runs tab to see if processing is complete.</p>
                </div>
            )}

            <div className="space-y-6">
                {records.map((record) => (
                    <Card key={record.id}>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-lg">{record.document.name}</h3>
                                {record.recordStatus && getRecordStatusBadge(record.recordStatus)}
                            </div>
                            {record.failedRulesJson && record.failedRulesJson.length > 0 && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                                    <p className="text-sm font-medium text-red-800 mb-1">Compliance Issues:</p>
                                    <ul className="text-sm text-red-700 list-disc list-inside">
                                        {record.failedRulesJson.map((rule: string, idx: number) => (
                                            <li key={idx}>{rule}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left py-2 px-4">Field</th>
                                            <th className="text-left py-2 px-4">Value</th>
                                            <th className="text-left py-2 px-4">Confidence</th>
                                            <th className="text-left py-2 px-4">Status</th>
                                            <th className="text-right py-2 px-4">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {record.fields.map((field: any) => (
                                            <tr key={field.id} className="border-b hover:bg-gray-50">
                                                <td className="py-3 px-4 font-medium">{field.fieldName}</td>
                                                <td className="py-3 px-4">
                                                    {editingField === field.id ? (
                                                        <Input
                                                            value={editValue}
                                                            onChange={(e) => setEditValue(e.target.value)}
                                                            onBlur={() => updateField(field.id, 'EDIT', editValue)}
                                                            autoFocus
                                                        />
                                                    ) : (
                                                        <span
                                                            className="cursor-pointer hover:underline"
                                                            onClick={() => {
                                                                setEditingField(field.id);
                                                                setEditValue(
                                                                    JSON.stringify(field.extractedValue).replace(/^"|"$/g, '')
                                                                );
                                                            }}
                                                        >
                                                            {JSON.stringify(field.extractedValue).replace(/^"|"$/g, '')}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <Badge className={getConfidenceColor(Number(field.confidence))}>
                                                        {(Number(field.confidence) * 100).toFixed(0)}%
                                                    </Badge>
                                                </td>
                                                <td className="py-3 px-4">
                                                    {field.fieldStatus ? getFieldStatusBadge(field.fieldStatus) : getFieldStatusBadge(field.validationStatus)}
                                                    {field.validationErrorsJson && field.validationErrorsJson.length > 0 && (
                                                        <div className="text-xs text-red-600 mt-1">
                                                            {field.validationErrorsJson[0].message}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <div className="flex gap-2 justify-end">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => setEvidenceDrawer({
                                                                isOpen: true,
                                                                field,
                                                                document: record.document,
                                                            })}
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                        {!field.isApproved && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => updateField(field.id, 'APPROVE')}
                                                            >
                                                                <Check className="w-4 h-4" />
                                                            </Button>
                                                        )}
                                                        {field.isApproved && (
                                                            <Badge variant="default">Approved</Badge>
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

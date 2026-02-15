'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Check, X, Eye } from 'lucide-react';

export default function ReviewPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const projectId = params.id as string;
    const runId = searchParams.get('runId');

    const [records, setRecords] = useState<any[]>([]);
    const [editingField, setEditingField] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');

    useEffect(() => {
        if (runId) {
            loadRecords();
        }
    }, [runId]);

    async function loadRecords() {
        const res = await fetch(`/api/runs/${runId}/records`);
        const data = await res.json();
        setRecords(data.records || []);
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
        const res = await fetch(`/api/projects/${projectId}/export`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ runId }),
        });

        const data = await res.json();
        if (data.downloadUrl) {
            window.open(data.downloadUrl, '_blank');
        }
    }

    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 0.8) return 'bg-green-100 text-green-800';
        if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800';
        return 'bg-red-100 text-red-800';
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Review Extracted Data</h1>
                <Button onClick={exportData}>Export to CSV</Button>
            </div>

            <div className="space-y-6">
                {records.map((record) => (
                    <Card key={record.id}>
                        <CardContent className="p-6">
                            <h3 className="font-semibold text-lg mb-4">{record.document.name}</h3>

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
                                                    {field.validationStatus === 'PASS' ? (
                                                        <Badge variant="default">Pass</Badge>
                                                    ) : (
                                                        <Badge variant="destructive">
                                                            {field.validationStatus}
                                                        </Badge>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <div className="flex gap-2 justify-end">
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
        </div>
    );
}

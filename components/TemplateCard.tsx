'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Receipt, User, FileText } from 'lucide-react';

interface TemplateCardProps {
    template: {
        id: string;
        name: string;
        slug: string;
        category: string;
        config: any;
    };
    selected: boolean;
    onClick: () => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
    Shield,
    Receipt,
    User,
    FileText,
};

const CATEGORY_COLORS: Record<string, string> = {
    compliance: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    trade: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300',
    hr: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-300',
};

export default function TemplateCard({ template, selected, onClick }: TemplateCardProps) {
    const config = template.config || {};
    const iconName = config.icon || 'FileText';
    const Icon = ICON_MAP[iconName] || FileText;
    const description = config.description || `${template.category} document template`;
    const exampleUseCase = config.exampleUseCase || '';
    const fieldCount = config.fields?.length || 0;
    const categoryColor = CATEGORY_COLORS[template.category] || 'bg-gray-100 text-gray-800';

    return (
        <Card
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-blue-400 hover:-translate-y-0.5 ${selected
                    ? 'border-2 border-blue-600 bg-blue-50/50 shadow-lg shadow-blue-100 dark:bg-blue-950/30 dark:shadow-blue-900/20'
                    : 'border border-gray-200 dark:border-gray-700'
                }`}
            onClick={onClick}
        >
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className={`p-2.5 rounded-xl ${selected
                            ? 'bg-blue-600 text-white'
                            : 'bg-gradient-to-br from-gray-100 to-gray-50 text-gray-600 dark:from-gray-800 dark:to-gray-900 dark:text-gray-400'
                        } transition-colors`}>
                        <Icon className="w-6 h-6" />
                    </div>
                    <Badge className={`${categoryColor} text-xs font-medium`}>
                        {template.category}
                    </Badge>
                </div>
                <CardTitle className="text-lg mt-3">{template.name}</CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                    {description}
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
                {exampleUseCase && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 italic mb-3">
                        💡 {exampleUseCase}
                    </p>
                )}
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" />
                        {fieldCount} fields
                    </span>
                    <span>v{template.config?.version || '1.0'}</span>
                </div>
                {selected && (
                    <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
                        <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
                            ✓ Selected
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

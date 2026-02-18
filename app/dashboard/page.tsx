'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Plus,
    FileText,
    ArrowRight,
    BarChart3,
    Search,
    Zap,
    MoreVertical,
    Clock
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Project {
    id: string;
    name: string;
    template: {
        name: string;
        category: string;
    };
    _count?: {
        documents: number;
        runs: number;
    };
    createdAt: string;
}

export default function DashboardPage() {
    const router = useRouter();
    const [projects, setProjects] = useState<Project[]>([]);
    const [usage, setUsage] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        let isMounted = true;

        async function loadData() {
            try {
                const usageRes = await fetch('/api/usage');
                if (!usageRes.ok) {
                    if (usageRes.status === 401) {
                        router.push('/api/auth/signin');
                        return;
                    }
                    throw new Error(`API error: ${usageRes.status}`);
                }

                const usageData = await usageRes.json();
                if (isMounted) {
                    setUsage(usageData.usage);
                    setProjects(usageData.projects || []);
                }
            } catch (error) {
                console.error('Failed to load dashboard data:', error);
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        loadData();
        return () => { isMounted = false; };
    }, [router]);

    const filteredProjects = projects.filter(project =>
        project.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="space-y-8 animate-pulse">
                <div className="flex justify-between items-end">
                    <div className="space-y-2">
                        <div className="h-10 w-48 bg-slate-200 rounded-lg" />
                        <div className="h-4 w-64 bg-slate-100 rounded-lg" />
                    </div>
                    <div className="h-10 w-32 bg-slate-200 rounded-lg" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <div key={i} className="h-48 bg-slate-100 rounded-xl" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-10">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-outfit font-bold text-slate-900">Projects</h1>
                    <p className="text-slate-500 mt-1">Manage your document extraction studios</p>
                </div>
                <Button
                    onClick={() => router.push('/projects/new')}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 px-6 rounded-lg shadow-sm"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    New Project
                </Button>
            </div>

            {/* Top Stats / Usage */}
            {usage && (
                <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
                    <CardContent className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div className="space-y-4 flex-1">
                            <div className="flex items-center justify-between md:justify-start md:gap-4">
                                <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Usage Progress</span>
                                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 font-bold">
                                    {usage.tier} Tier
                                </Badge>
                            </div>
                            <div className="relative pt-1">
                                <div className="flex mb-2 items-center justify-between">
                                    <div>
                                        <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-100">
                                            {usage.pagesUsed} / {usage.pagesLimit === 'unlimited' ? '∞' : usage.pagesLimit} pages
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs font-semibold inline-block text-blue-600 uppercase">
                                            {usage.percentUsed}%
                                        </span>
                                    </div>
                                </div>
                                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-50">
                                    <div
                                        style={{ width: `${usage.percentUsed}%` }}
                                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-600 transition-all duration-1000"
                                    />
                                </div>
                            </div>
                        </div>
                        {usage.tier !== 'PRO' && (
                            <Button variant="outline" className="border-slate-200 hover:bg-slate-50 text-slate-900 font-bold" onClick={() => router.push('/workspaces/settings')}>
                                Scale Workspace
                            </Button>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Project Grid */}
            <div className="space-y-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search projects..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                    />
                </div>

                {filteredProjects.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProjects.map((project) => (
                            <Card
                                key={project.id}
                                className="group bg-white border-slate-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer rounded-xl overflow-hidden"
                                onClick={() => router.push(`/projects/${project.id}`)}
                            >
                                <CardHeader className="pb-4">
                                    <div className="flex justify-between items-start">
                                        <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-100 transition-colors">
                                            <BarChart3 className="w-5 h-5" />
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <MoreVertical className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => router.push(`/projects/${project.id}`)}>
                                                    View Project
                                                </DropdownMenuItem>
                                                <DropdownMenuItem>
                                                    Settings
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <CardTitle className="text-xl font-outfit font-bold text-slate-900 mt-4 group-hover:text-blue-600 transition-colors">
                                        {project.name}
                                    </CardTitle>
                                    <Badge variant="outline" className="w-fit bg-slate-50 text-slate-500 border-slate-200 text-[10px] uppercase font-bold tracking-wider">
                                        {project.template.name}
                                    </Badge>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">
                                        <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> {project._count?.documents || 0}</span>
                                        <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> {project._count?.runs || 0}</span>
                                        <span className="flex items-center gap-1.5 ml-auto text-slate-300"><Clock className="w-3.5 h-3.5" /> {new Date(project.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50 rounded-xl">
                        <CardContent className="py-20 flex flex-col items-center text-center space-y-4">
                            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                                <Plus className="w-8 h-8 text-slate-400" />
                            </div>
                            <div className="max-w-xs">
                                <h3 className="text-lg font-bold text-slate-900">No projects found</h3>
                                <p className="text-slate-500 text-sm mt-1">Get started by creating your first document extraction project.</p>
                            </div>
                            <Button
                                onClick={() => router.push('/projects/new')}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 shadow-sm"
                            >
                                Create Project
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}

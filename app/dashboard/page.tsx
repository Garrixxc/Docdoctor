'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Shield, FileText, Users, Clock, ArrowRight, BarChart3, MoreVertical, Search } from 'lucide-react';
import VerticalCard from '@/components/VerticalCard';
import { cn } from '@/lib/utils/cn';

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
    const [workspaceId, setWorkspaceId] = useState<string | null>(null);

    useEffect(() => {
        async function loadData() {
            try {
                // Get usage and workspace info
                const usageRes = await fetch('/api/usage');
                const usageData = await usageRes.json();
                setUsage(usageData.usage);
                setWorkspaceId(usageData.workspace.id);

                // Get projects
                const projectsRes = await fetch(`/api/projects?workspaceId=${usageData.workspace.id}`);
                const projectsData = await projectsRes.json();
                setProjects(projectsData.projects || []);
            } catch (error) {
                console.error('Failed to load dashboard data:', error);
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, []);

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-12 space-y-8 animate-pulse">
                <div className="h-32 bg-gray-100 rounded-3xl" />
                <div className="grid md:grid-cols-3 gap-8">
                    {[1, 2, 3].map(i => <div key={i} className="h-64 bg-gray-100 rounded-3xl" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 space-y-12">
            {/* Header / Usage Banner */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-indigo-800 p-8 md:p-12 text-white shadow-2xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/20 rounded-full blur-2xl translate-y-1/2 -track-x-1/2" />

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                    <div className="space-y-2">
                        <h1 className="text-3xl md:text-4xl font-black">Welcome back! 👋</h1>
                        <p className="text-blue-100/80 font-medium">Ready to extract some datasets today?</p>
                    </div>

                    <div className="glass border-white/20 bg-white/10 p-6 rounded-3xl min-w-[300px] flex flex-col gap-4">
                        <div className="flex justify-between items-end">
                            <span className="text-xs font-bold uppercase tracking-widest text-blue-100">Monthly Usage</span>
                            <span className="text-2xl font-black">{usage?.pagesUsed || 0} / {usage?.pagesLimit === 'unlimited' ? '∞' : usage?.pagesLimit} <span className="text-xs font-medium opacity-60">pages</span></span>
                        </div>
                        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-white transition-all duration-1000"
                                style={{ width: usage?.percentUsed ? `${usage.percentUsed}%` : '0%' }}
                            />
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-bold text-blue-100 uppercase tracking-wide">
                            <span>{usage?.tier === 'PRO' ? 'PRO Plan' : 'Free Plan'}</span>
                            {usage?.tier !== 'PRO' && <a href="/workspaces/settings" className="hover:underline flex items-center gap-1">Upgrade <ArrowRight className="w-3 h-3" /></a>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Start Section */}
            <section className="space-y-6">
                <div className="flex justify-between items-end px-2">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-black text-gray-900">Start New Extraction</h2>
                        <p className="text-sm text-gray-500 font-medium">Select a vertical to create a pre-configured project</p>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    <VerticalCard
                        title="Vendor Compliance"
                        description="COI validation and vendor tracking."
                        icon={Shield}
                        color="blue"
                        href="/projects/new?template=vendor-compliance"
                        className="border-none bg-blue-50/50"
                    />
                    <VerticalCard
                        title="Trade Invoices"
                        description="Trade docs with line-item sum checks."
                        icon={FileText}
                        color="emerald"
                        href="/projects/new?template=trade-invoice"
                        className="border-none bg-emerald-50/50"
                    />
                    <VerticalCard
                        title="HR & Resumes"
                        description="Professional resume data extraction."
                        icon={Users}
                        color="purple"
                        href="/projects/new?template=resume"
                        className="border-none bg-purple-50/50"
                    />
                </div>
            </section>

            {/* Existing Projects Table */}
            <section className="space-y-6">
                <div className="flex justify-between items-end px-2">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-black text-gray-900">Recent Projects</h2>
                        <p className="text-sm text-gray-500 font-medium">Manage and review your ongoing datasets</p>
                    </div>
                    <div className="flex gap-2">
                        <div className="relative hidden sm:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search projects..."
                                className="pl-10 pr-4 h-10 rounded-full border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all w-64"
                            />
                        </div>
                        <Button size="icon" variant="outline" className="rounded-full h-10 w-10">
                            <BarChart3 className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-4">
                    {projects.length > 0 ? (
                        projects.map((project) => (
                            <div
                                key={project.id}
                                onClick={() => router.push(`/projects/${project.id}`)}
                                className="group p-6 rounded-[2rem] bg-white border border-gray-100 hover:border-blue-100 hover:shadow-xl hover:shadow-blue-500/5 transition-all cursor-pointer flex items-center justify-between"
                            >
                                <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{project.name}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="secondary" className="bg-gray-100 text-gray-500 border-none px-2 py-0 h-5 text-[10px] font-bold uppercase tracking-wider">
                                                {project.template.name}
                                            </Badge>
                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                                                {project._count?.documents || 0} Docs
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="hidden sm:flex flex-col items-end gap-0.5">
                                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Runs</span>
                                        <span className="text-sm font-bold text-gray-700">{project._count?.runs || 0}</span>
                                    </div>
                                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-50">
                                        <MoreVertical className="w-4 h-4 text-gray-400" />
                                    </Button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-20 bg-gray-50/50 rounded-[3rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center space-y-4">
                            <div className="w-16 h-16 rounded-3xl bg-white border border-gray-100 flex items-center justify-center text-gray-300">
                                <Plus className="w-8 h-8" />
                            </div>
                            <div className="text-center">
                                <h3 className="font-bold text-gray-900">No projects yet</h3>
                                <p className="text-sm text-gray-500">Create your first project to start extracting data.</p>
                            </div>
                            <Button className="rounded-2xl px-6" onClick={() => router.push('/projects/new')}>
                                Create Project
                            </Button>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}

'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Shield, FileText, Users, Clock, ArrowRight, BarChart3, MoreVertical, Search, Sparkles, Zap } from 'lucide-react';
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
        <div className="container mx-auto px-6 py-10 space-y-16 animate-fade-in relative z-10">
            {/* Command Center Header */}
            <div className="grid lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 space-y-4">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 w-fit">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-glow" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Command Center</span>
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-5xl font-display font-black tracking-tighter text-slate-900 leading-none">
                            Welcome back, <span className="text-indigo-600">Gaurav</span>
                        </h1>
                        <p className="text-xl text-slate-500 font-medium">Ready to orchestrate your data extractions today?</p>
                    </div>
                </div>

                <div className="lg:col-span-4">
                    {usage && (
                        <div className="noise glass rounded-[2.5rem] p-8 space-y-6 group hover:translate-y-[-4px] transition-all duration-500">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Monthly Usage</p>
                                    <h3 className="text-3xl font-display font-black text-slate-900">
                                        {usage.pagesUsed}
                                        <span className="text-sm font-medium text-slate-400 ml-1">/ {usage.pagesLimit === 'unlimited' ? '∞' : usage.pagesLimit} pages</span>
                                    </h3>
                                </div>
                                <div className={cn(
                                    "px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider",
                                    usage.tier === 'PRO' ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
                                )}>
                                    {usage.tier} Tier
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden p-[2px]">
                                    <div
                                        className="h-full bg-indigo-600 rounded-full transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(79,70,229,0.3)]"
                                        style={{ width: `${usage.percentUsed}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                    <span>{usage.percentUsed}% consumed</span>
                                    {usage.tier !== 'PRO' && (
                                        <a href="/workspaces/settings" className="text-indigo-600 hover:underline flex items-center gap-1">
                                            Scale Up <ArrowRight className="w-2.5 h-2.5" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Verticals Bento Grid */}
            <section className="space-y-8">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-display font-black tracking-tight text-slate-900">Studio Templates</h2>
                    <div className="h-[1px] flex-1 bg-slate-100" />
                </div>

                <div className="grid md:grid-cols-12 gap-6 h-auto md:h-[450px]">
                    <div className="md:col-span-7 h-full">
                        <VerticalCard
                            title="Vendor Compliance"
                            description="Deep validation of Certificate of Insurance docs with COI requirements matching."
                            icon={Shield}
                            color="blue"
                            href="/projects/new?template=vendor-compliance"
                            className="h-full border-none shadow-none bg-slate-50 relative overflow-hidden group"
                            badge="High Accuracy"
                        />
                    </div>
                    <div className="md:col-span-5 grid grid-rows-2 gap-6 h-full">
                        <VerticalCard
                            title="Trade Invoices"
                            description="Line-item extraction and tax validation."
                            icon={FileText}
                            color="emerald"
                            href="/projects/new?template=trade-invoice"
                            className="border-none shadow-none bg-emerald-50 relative overflow-hidden"
                        />
                        <VerticalCard
                            title="HR & Resumes"
                            description="Structured talent data from PDFs."
                            icon={Users}
                            color="purple"
                            href="/projects/new?template=resume"
                            className="border-none shadow-none bg-purple-50 relative overflow-hidden"
                        />
                    </div>
                </div>
            </section>

            {/* Project Ledger */}
            <section className="space-y-8 pb-20">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4 flex-1">
                        <h2 className="text-2xl font-display font-black tracking-tight text-slate-900">Project Ledger</h2>
                        <div className="h-[1px] flex-1 bg-slate-100" />
                    </div>

                    <div className="flex items-center gap-4 ml-8">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search the ledger..."
                                className="pl-11 pr-6 h-12 rounded-2xl bg-slate-50 border-transparent transition-all focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-100 text-sm font-medium w-64"
                            />
                        </div>
                        <Button
                            onClick={() => router.push('/projects/new')}
                            className="h-12 px-6 rounded-2xl font-black bg-slate-900 hover:bg-slate-800 text-white shadow-xl shadow-slate-200 transition-all active:scale-95 flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> New Studio
                        </Button>
                    </div>
                </div>

                <div className="space-y-4">
                    {projects.length > 0 ? (
                        projects.map((project) => (
                            <div
                                key={project.id}
                                onClick={() => router.push(`/projects/${project.id}`)}
                                className="group p-6 rounded-[2rem] bg-white border border-slate-50 hover:border-indigo-100 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all cursor-pointer flex items-center justify-between"
                            >
                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 rounded-[1.25rem] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-all">
                                        <BarChart3 className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-outfit font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{project.name}</h4>
                                        <div className="flex items-center gap-3 mt-1.5">
                                            <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-none px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider">
                                                {project.template.name}
                                            </Badge>
                                            <div className="flex items-center gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest ml-1">
                                                <span className="flex items-center gap-1.5"><FileText className="w-3 h-3" /> {project._count?.documents || 0} Docs</span>
                                                <span className="flex items-center gap-1.5"><Zap className="w-3 h-3" /> {project._count?.runs || 0} Runs</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="hidden md:flex flex-col items-end gap-1">
                                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Last Sync</span>
                                        <span className="text-xs font-bold text-slate-500">{new Date(project.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="w-10 h-10 rounded-full border border-slate-50 flex items-center justify-center text-slate-300 group-hover:text-indigo-600 group-hover:border-indigo-100 group-hover:bg-indigo-50 transition-all">
                                        <ArrowRight className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-32 noise glass rounded-[3rem] flex flex-col items-center justify-center space-y-6">
                            <div className="w-20 h-20 rounded-[2rem] bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                                <Plus className="w-10 h-10" />
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="text-2xl font-display font-black text-slate-900">Empty Ledger</h3>
                                <p className="text-slate-500 font-medium">Create your first extraction studio to begin.</p>
                            </div>
                            <Button
                                onClick={() => router.push('/projects/new')}
                                className="h-14 px-10 rounded-2xl font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xl shadow-indigo-500/20"
                            >
                                Get Started
                            </Button>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Clock } from 'lucide-react';

interface Project {
    id: string;
    name: string;
    slug: string;
    template: {
        name: string;
    };
    createdAt: string;
    _count: {
        documents: number;
        runs: number;
    };
}

export default function DashboardPage() {
    const router = useRouter();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [workspaceId, setWorkspaceId] = useState<string | null>(null);

    useEffect(() => {
        async function loadData() {
            try {
                // Get user's workspaces
                const wsRes = await fetch('/api/workspaces');
                const wsData = await wsRes.json();

                if (wsData.workspaces && wsData.workspaces.length > 0) {
                    const workspace = wsData.workspaces[0];
                    setWorkspaceId(workspace.id);

                    // Get projects
                    const projectsRes = await fetch(`/api/projects?workspaceId=${workspace.id}`);
                    const projectsData = await projectsRes.json();
                    setProjects(projectsData.projects || []);
                }
            } catch (error) {
                console.error('Failed to load data:', error);
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, []);

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/4" />
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-48 bg-gray-200 rounded-xl" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Projects</h1>
                    <p className="text-gray-600">Manage your document extraction projects</p>
                </div>
                <Button onClick={() => router.push('/projects/new')} size="lg">
                    <Plus className="w-4 h-4 mr-2" />
                    New Project
                </Button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                    <Card
                        key={project.id}
                        className="hover:shadow-lg transition-shadow cursor-pointer group"
                        onClick={() => router.push(`/projects/${project.id}`)}
                    >
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div>
                                    <CardTitle className="group-hover:text-blue-600 transition-colors">
                                        {project.name}
                                    </CardTitle>
                                    <CardDescription className="mt-1">
                                        {project.template.name}
                                    </CardDescription>
                                </div>
                                <Badge variant="outline">{project._count.documents} docs</Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                    <FileText className="w-4 h-4" />
                                    {project._count.runs} runs
                                </div>
                                <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {new Date(project.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {projects.length === 0 && (
                    <Card className="col-span-full border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <FileText className="w-16 h-16 text-gray-300 mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
                            <p className="text-gray-600 mb-4">Create your first project to get started</p>
                            <Button onClick={() => router.push('/projects/new')}>
                                <Plus className="w-4 h-4 mr-2" />
                                Create Project
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}

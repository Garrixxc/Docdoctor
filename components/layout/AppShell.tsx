'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    PlusCircle,
    Settings,
    LogOut,
    ChevronDown,
    Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import UsageBanner from '@/components/UsageBanner';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface AppShellProps {
    children: React.ReactNode;
    session: any;
}

export default function AppShell({ children, session }: AppShellProps) {
    const pathname = usePathname();

    const navLinks = [
        { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/projects/new', label: 'New Project', icon: PlusCircle },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {session && (
                <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
                    <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                        <div className="flex items-center gap-8">
                            <Link href="/dashboard" className="flex items-center gap-2 group">
                                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md group-hover:bg-blue-700 transition-colors">
                                    <Sparkles className="w-4 h-4" />
                                </div>
                                <span className="font-outfit font-bold text-xl tracking-tight text-slate-900">
                                    DocDoctor
                                </span>
                            </Link>

                            <nav className="hidden md:flex items-center gap-1">
                                {navLinks.map((link) => {
                                    const Icon = link.icon;
                                    const isActive = pathname === link.href;
                                    return (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            className={cn(
                                                "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                                isActive
                                                    ? "text-blue-600 bg-blue-50"
                                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                                            )}
                                        >
                                            <Icon className="w-4 h-4" />
                                            {link.label}
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>

                        <div className="flex items-center gap-4">
                            <UsageBanner />

                            <div className="h-4 w-px bg-slate-200" />

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="p-1 pr-2 h-auto flex items-center gap-2 hover:bg-slate-100 rounded-full border border-slate-100 bg-white">
                                        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-[10px] font-bold border border-blue-200">
                                            {(session.user?.name?.[0] || session.user?.email?.[0] || 'U').toUpperCase()}
                                        </div>
                                        <div className="hidden sm:flex flex-col items-start leading-tight">
                                            <span className="text-[11px] font-bold text-slate-900">
                                                {session.user?.name || session.user?.email?.split('@')[0]}
                                            </span>
                                        </div>
                                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 p-1 rounded-xl">
                                    <Link href="/workspaces/settings">
                                        <DropdownMenuItem className="gap-2 cursor-pointer rounded-lg">
                                            <Settings className="w-4 h-4" />
                                            Settings
                                        </DropdownMenuItem>
                                    </Link>
                                    <DropdownMenuSeparator className="bg-slate-100" />
                                    <Link href="/api/auth/signout">
                                        <DropdownMenuItem className="gap-2 text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer rounded-lg">
                                            <LogOut className="w-4 h-4" />
                                            Sign Out
                                        </DropdownMenuItem>
                                    </Link>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </header>
            )}

            <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-8">
                {children}
            </main>
        </div>
    );
}

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import UsageBanner from "@/components/UsageBanner";
import { LayoutDashboard, PlusCircle, Settings, LogOut, ChevronDown } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "DocDoctor - Document to Dataset Studio",
    description: "Self-serve document extraction and dataset creation platform",
};

const ShieldCheck = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /><path d="m9 12 2 2 4-4" /></svg>
);

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const session = await getServerSession(authOptions);

    return (
        <html lang="en">
            <body className={`${inter.className} selection:bg-blue-100 selection:text-blue-900`}>
                <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-50 via-white to-blue-50/30">
                    {session && (
                        <nav className="sticky top-0 z-50 w-full border-b bg-white/60 backdrop-blur-xl transition-all duration-300">
                            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                                <div className="flex items-center gap-8">
                                    <a href="/dashboard" className="flex items-center gap-2 group cursor-pointer">
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">
                                            <ShieldCheck className="w-5 h-5" />
                                        </div>
                                        <span className="font-black text-xl tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                                            DocDoctor
                                        </span>
                                    </a>

                                    <div className="hidden md:flex items-center gap-1">
                                        <a href="/dashboard" className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-600 hover:text-blue-600 hover:bg-blue-50/50 rounded-lg transition-all active:scale-95">
                                            <LayoutDashboard className="w-4 h-4" />
                                            Dashboard
                                        </a>
                                        <a href="/projects/new" className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-600 hover:text-blue-600 hover:bg-blue-50/50 rounded-lg transition-all active:scale-95">
                                            <PlusCircle className="w-4 h-4" />
                                            New Project
                                        </a>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    <UsageBanner />

                                    <div className="h-4 w-[1px] bg-gray-200 hidden sm:block" />

                                    <div className="flex items-center gap-3">
                                        <div className="flex flex-col items-end hidden sm:flex">
                                            <span className="text-xs font-bold text-gray-900">{session.user?.name || session.user?.email?.split('@')[0]}</span>
                                            <span className="text-[10px] text-gray-500 font-medium lowercase tracking-wide">{session.user?.email}</span>
                                        </div>
                                        <div className="relative group">
                                            <button className="flex items-center gap-1 p-1 pr-2 rounded-full border bg-white hover:border-blue-200 hover:shadow-sm transition-all shadow-sm">
                                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-50 to-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 text-[10px] font-bold">
                                                    {(session.user?.name?.[0] || session.user?.email?.[0] || 'U').toUpperCase()}
                                                </div>
                                                <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                                            </button>

                                            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-2xl border border-gray-100 p-1 hidden group-hover:block transition-all animate-scale-in origin-top-right">
                                                <a href="/workspaces/settings" className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                    <Settings className="w-4 h-4" />
                                                    Settings
                                                </a>
                                                <div className="h-[1px] bg-gray-50 my-1" />
                                                <a href="/api/auth/signout" className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                                    <LogOut className="w-4 h-4" />
                                                    Sign Out
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </nav>
                    )}
                    <main className="relative">{children}</main>
                </div>
            </body>
        </html>
    );
}

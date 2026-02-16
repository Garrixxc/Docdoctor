import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import UsageBanner from "@/components/UsageBanner";
import { LayoutDashboard, PlusCircle, Settings, LogOut, ChevronDown, Sparkles } from "lucide-react";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
});

const outfit = Outfit({
    subsets: ["latin"],
    variable: "--font-outfit",
});

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
        <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
            <body className="font-sans selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden antialiased">
                <div className="min-h-screen grid-bg">
                    {session && (
                        <nav className="sticky top-0 z-50 w-full border-b border-white/20 bg-white/60 backdrop-blur-2xl transition-all duration-500 after:absolute after:bottom-[-1px] after:left-0 after:w-full after:h-[1px] after:bg-gradient-to-r after:from-transparent after:via-indigo-500/20 after:to-transparent">
                            <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                                <div className="flex items-center gap-10">
                                    <a href="/dashboard" className="flex items-center gap-2.5 group cursor-pointer">
                                        <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-200 group-hover:rotate-6 transition-transform duration-300">
                                            <Sparkles className="w-5 h-5 fill-white/20" />
                                        </div>
                                        <span className="font-outfit font-bold text-2xl tracking-tight text-slate-900">
                                            DocDoctor
                                        </span>
                                    </a>

                                    <div className="hidden md:flex items-center gap-2">
                                        <a href="/dashboard" className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition-all">
                                            <LayoutDashboard className="w-4 h-4" />
                                            Dashboard
                                        </a>
                                        <a href="/projects/new" className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition-all">
                                            <PlusCircle className="w-4 h-4" />
                                            Build Studio
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

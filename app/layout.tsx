import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "DocDoctor - Document to Dataset Studio",
    description: "Self-serve document extraction and dataset creation platform",
};

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const session = await getServerSession(authOptions);

    return (
        <html lang="en">
            <body className={inter.className}>
                <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
                    {session && (
                        <header className="border-b bg-white/80 backdrop-blur-sm">
                            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                                <div className="flex items-center gap-6">
                                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                        DocDoctor
                                    </h1>
                                    <nav className="hidden md:flex gap-4">
                                        <a href="/dashboard" className="text-sm font-medium hover:text-blue-600 transition-colors">
                                            Dashboard
                                        </a>
                                    </nav>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-sm text-gray-600">{session.user?.email}</span>
                                    <a
                                        href="/api/auth/signout"
                                        className="text-sm font-medium text-red-600 hover:text-red-700"
                                    >
                                        Sign Out
                                    </a>
                                </div>
                            </div>
                        </header>
                    )}
                    <main>{children}</main>
                </div>
            </body>
        </html>
    );
}

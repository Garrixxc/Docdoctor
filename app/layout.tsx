import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import AppShell from "@/components/layout/AppShell";

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

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const session = await getServerSession(authOptions);

    return (
        <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
            <body className="font-sans antialiased selection:bg-blue-100 selection:text-blue-900">
                <AppShell session={session}>
                    {children}
                </AppShell>
            </body>
        </html>
    );
}

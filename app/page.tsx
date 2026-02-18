import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, FileText, Users, ArrowRight, Zap, CheckCircle2, Globe, Lock } from "lucide-react";
import VerticalCard from "@/components/VerticalCard";

export default async function HomePage() {
    const session = await getServerSession(authOptions);

    if (session) {
        redirect("/dashboard");
    }

    return (
        <div className="flex flex-col min-h-screen bg-white">
            {/* Hero Section */}
            <section className="relative pt-24 pb-32 overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-slate-50 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                </div>

                <div className="container relative z-10 mx-auto px-6">
                    <div className="max-w-4xl mx-auto text-center space-y-10">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-widest animate-fade-in mx-auto">
                            <Zap className="w-3.5 h-3.5 fill-blue-700" />
                            <span>Powered by GPT-4o-mini</span>
                        </div>

                        <h1 className="text-6xl md:text-8xl font-outfit font-black tracking-tight text-slate-900 leading-[0.9] animate-in slide-in-from-bottom-4 duration-700">
                            Documents to <span className="text-blue-600">Datasets</span> in seconds.
                        </h1>

                        <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed font-medium animate-in slide-in-from-bottom-4 duration-700 delay-150">
                            The self-serve platform for industry-specific document extraction.
                            Pick a vertical, upload your files, and export structured data.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-in slide-in-from-bottom-4 duration-700 delay-300">
                            <Button size="lg" className="h-16 px-10 rounded-2xl text-lg font-bold bg-blue-600 hover:bg-slate-900 shadow-xl shadow-blue-100 transition-all hover:-translate-y-1 active:scale-95 text-white" asChild>
                                <a href="/api/auth/signin">Get Started Free</a>
                            </Button>
                            <Button size="lg" variant="outline" className="h-16 px-10 rounded-2xl text-lg font-bold border-2 border-slate-200 hover:bg-slate-50 transition-all active:scale-95">
                                View Demo
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Verticals Section */}
            <section id="verticals" className="py-32 bg-slate-50/50 border-y border-slate-100">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-20 space-y-4">
                        <h2 className="text-4xl font-outfit font-black text-slate-900 tracking-tight">Industry Solutions</h2>
                        <p className="text-slate-500 text-lg font-medium">Pick a vertical to start a new extraction project</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        <VerticalCard
                            title="Vendor Compliance"
                            description="Automatically extract and validate Certificates of Insurance (COI) for vendor onboarding."
                            icon={Shield}
                            color="blue"
                            stats="2.4k+ Managed"
                            href="/api/auth/signin"
                        />
                        <VerticalCard
                            title="Trade Docs"
                            description="Parse commercial invoices and packing lists with line-item accuracy and sum checks."
                            icon={FileText}
                            color="emerald"
                            badge="NEW"
                            href="/api/auth/signin"
                        />
                        <VerticalCard
                            title="HR & Resumes"
                            description="Extract candidate details, skills, and contact info from resumes for your ATS."
                            icon={Users}
                            color="blue"
                            badge="BETA"
                            href="/api/auth/signin"
                        />
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-32">
                <div className="container mx-auto px-6">
                    <div className="grid lg:grid-cols-2 gap-24 items-center max-w-6xl mx-auto">
                        <div className="space-y-10">
                            <h2 className="text-5xl font-outfit font-black text-slate-900 leading-[1.1] tracking-tight">
                                Built for precision, <br />
                                designed for speed.
                            </h2>

                            <div className="grid sm:grid-cols-2 gap-8">
                                {[
                                    { icon: Shield, title: "Self-Serve Verticals", desc: "No complex configuration. Pick a template and go." },
                                    { icon: Zap, title: "Confidence Scoring", desc: "Every extracted field comes with a confidence score and evidence." },
                                    { icon: Globe, title: "Export Anywhere", desc: "Download your data as clean CSV or JSON for any ATS/ERP." },
                                    { icon: Lock, title: "BYO API Key", desc: "Use our defaults or bring your own OpenAI key for unlimited scale." }
                                ].map((feature, i) => (
                                    <div key={i} className="space-y-4 group">
                                        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 transition-all border border-blue-100 group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-blue-100">
                                            <feature.icon className="w-6 h-6" />
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="font-bold text-slate-900">{feature.title}</h4>
                                            <p className="text-slate-500 text-sm leading-relaxed">{feature.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 bg-blue-600 rounded-[3rem] rotate-3 shadow-2xl shadow-blue-200" />
                            <div className="relative bg-slate-900 rounded-[3rem] p-12 aspect-square flex flex-col justify-center items-center text-center space-y-8 overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                                <div className="w-24 h-24 rounded-3xl bg-blue-600 flex items-center justify-center shadow-2xl shadow-blue-500/40">
                                    <CheckCircle2 className="w-12 h-12 text-white" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-6xl font-black text-white font-outfit">99.2%</h3>
                                    <p className="text-blue-400 font-bold uppercase tracking-[0.2em] text-[10px]">Average Extraction Accuracy</p>
                                </div>
                                <div className="pt-4 flex gap-1">
                                    {[1, 2, 3, 4, 5].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-500/40" />)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-16 border-t border-slate-100 bg-white">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-100">
                                <Shield className="w-6 h-6" />
                            </div>
                            <span className="font-outfit font-black text-2xl tracking-tighter text-slate-900">DocDoctor</span>
                        </div>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">© 2026 DocDoctor Studio. Built for production.</p>
                        <div className="flex gap-6">
                            <a href="#" className="text-xs font-bold text-slate-400 hover:text-blue-600 uppercase tracking-widest">Terms</a>
                            <a href="#" className="text-xs font-bold text-slate-400 hover:text-blue-600 uppercase tracking-widest">Privacy</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

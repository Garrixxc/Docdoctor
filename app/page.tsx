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
        <div className="flex flex-col min-h-screen">
            {/* Hero Section */}
            <section className="relative pt-20 pb-32 overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-float" />
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-100/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                </div>

                <div className="container relative z-10 mx-auto px-4">
                    <div className="max-w-4xl mx-auto text-center space-y-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-bold animate-fade-in">
                            <Zap className="w-4 h-4 fill-blue-700" />
                            <span>Powered by GPT-4o-mini</span>
                        </div>

                        <h1 className="text-6xl md:text-7xl font-black tracking-tight text-gray-900 animate-slide-up">
                            Documents to <span className="text-gradient">Datasets</span> in seconds.
                        </h1>

                        <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed animate-slide-up [animation-delay:200ms]">
                            The self-serve platform for industry-specific document extraction.
                            Pick a vertical, upload your files, and export structured data.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-slide-up [animation-delay:400ms]">
                            <Button size="lg" className="h-14 px-8 rounded-2xl text-lg font-bold bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all active:scale-95" asChild>
                                <a href="/api/auth/signin">Get Started Free</a>
                            </Button>
                            <Button size="lg" variant="outline" className="h-14 px-8 rounded-2xl text-lg font-bold border-2 transition-all active:scale-95">
                                View Demo
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Verticals Section */}
            <section id="verticals" className="py-24 bg-gray-50/50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16 space-y-4">
                        <h2 className="text-4xl font-black text-gray-900">Industry Solutions</h2>
                        <p className="text-gray-500 text-lg">Pick a vertical to start a new extraction project</p>
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
                            stats="NEW"
                            href="/api/auth/signin"
                        />
                        <VerticalCard
                            title="HR & Resumes"
                            description="Extract candidate details, skills, and contact info from resumes for your ATS."
                            icon={Users}
                            color="purple"
                            stats="NEW"
                            href="/api/auth/signin"
                        />
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24">
                <div className="container mx-auto px-4">
                    <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
                        <div className="space-y-8">
                            <h2 className="text-4xl font-black text-gray-900 leading-tight">
                                Built for precision, <br />
                                designed for speed.
                            </h2>

                            <div className="space-y-6">
                                {[
                                    { icon: Shield, title: "Self-Serve Verticals", desc: "No complex configuration. Pick a template and go." },
                                    { icon: Zap, title: "Confidence Scoring", desc: "Every extracted field comes with a confidence score and evidence." },
                                    { icon: Globe, title: "Export Anywhere", desc: "Download your data as clean CSV or JSON for any ATS/ERP." },
                                    { icon: Lock, title: "BYO API Key", desc: "Use our defaults or bring your own OpenAI key for unlimited scale." }
                                ].map((feature, i) => (
                                    <div key={i} className="flex gap-4 group">
                                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                            <feature.icon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900">{feature.title}</h4>
                                            <p className="text-gray-500 text-sm">{feature.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl rotate-3 group-hover:rotate-1 transition-transform" />
                            <div className="relative glass rounded-3xl p-8 border-none aspect-square flex flex-col justify-center items-center text-center space-y-6">
                                <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
                                    <CheckCircle2 className="w-10 h-10 text-white" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-3xl font-black text-white">99.2%</h3>
                                    <p className="text-blue-100 font-medium uppercase tracking-widest text-xs">Average Extraction Accuracy</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t border-gray-100 bg-white">
                <div className="container mx-auto px-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <Shield className="w-6 h-6 text-blue-600" />
                        <span className="font-black text-xl tracking-tight">DocDoctor</span>
                    </div>
                    <p className="text-gray-400 text-sm">© 2026 DocDoctor Studio. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}

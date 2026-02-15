import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function HomePage() {
    const session = await getServerSession(authOptions);

    if (session) {
        redirect("/dashboard");
    }

    return (
        <div className="container mx-auto px-4 py-20">
            <div className="flex flex-col items-center justify-center min-h-[80vh]">
                <div className="text-center max-w-3xl mb-12">
                    <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                        Transform Documents into Structured Data
                    </h1>
                    <p className="text-xl text-gray-600 mb-8">
                        Self-serve platform to extract, review, and export structured datasets from your documents using AI.
                    </p>
                </div>

                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>Get Started</CardTitle>
                        <CardDescription>
                            Sign in to start extracting data from your documents
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button asChild className="w-full" size="lg">
                            <a href="/api/auth/signin">Sign In with Email</a>
                        </Button>
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-2 text-muted-foreground">Or</span>
                            </div>
                        </div>
                        <Button asChild variant="outline" className="w-full" size="lg">
                            <a href="/api/auth/signin">Sign In with Google</a>
                        </Button>
                    </CardContent>
                </Card>

                <div className="grid md:grid-cols-3 gap-8 mt-20 max-w-5xl">
                    <Card>
                        <CardHeader>
                            <CardTitle>Upload Documents</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-600">
                                Upload PDFs or images containing structured information like invoices, certificates, or forms.
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>AI Extraction</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-600">
                                Our LLM-powered engine extracts fields with confidence scores and evidence snippets.
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Review & Export</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-600">
                                Review extractions, approve or edit fields, and export your dataset to CSV.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

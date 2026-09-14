import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { sourcesApi } from "../api/sources";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Code as Github, Loader2, Code, ShieldCheck } from "lucide-react";

export default function Projects() {
  const [githubInput, setGithubInput] = useState("");
  const githubMutation = useMutation({
    mutationFn: () => {
      // Parse URL or just username
      let username = githubInput.trim();
      if (username.includes("github.com/")) {
        username = username.split("github.com/")[1].split("/")[0];
      }
      return sourcesApi.analyzeGithub(username);
    },
    onSuccess: (data) => alert(`Awesome! Extracted ${data.findings_count} verifiable evidence points from repositories.`),
    onError: (err: any) => alert(err.response?.data?.detail || "Failed to analyze GitHub"),
  });

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl space-y-12">
        
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
            Connect Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Evidence</span>
          </h1>
          <p className="text-lg text-slate-600">
            Claims are cheap. Actual code is undeniable. Connect your external profiles so SkillTwin can build a grounded, verified model of your capabilities.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* GitHub Card */}
          <Card className="shadow-lg border-0 ring-1 ring-slate-200 hover:ring-indigo-300 hover:shadow-xl transition-all overflow-hidden relative group bg-white md:col-span-2 max-w-4xl mx-auto w-full">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Github className="w-64 h-64 text-slate-900" />
            </div>
            <CardHeader className="pb-4">
              <div className="w-16 h-16 bg-slate-900 text-white rounded-xl flex items-center justify-center mb-6 shadow-sm">
                <Code className="w-8 h-8" />
              </div>
              <CardTitle className="text-3xl">GitHub Evidence Integration</CardTitle>
              <CardDescription className="text-lg text-slate-500 max-w-2xl">
                Automatically scan your public repositories, READMEs, and tech stack to ground your self-reported skills in actual, verifiable code evidence.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 relative z-10 pt-4">
              <div className="space-y-3">
                <label htmlFor="github" className="text-base font-semibold text-slate-700">
                  GitHub Username or URL
                </label>
                <div className="relative">
                  <Input 
                    id="github" 
                    placeholder="e.g. torvalds or https://github.com/torvalds" 
                    value={githubInput} 
                    onChange={(e) => setGithubInput(e.target.value)}
                    className="pl-12 h-14 text-lg bg-slate-50 border-slate-200 focus:bg-white transition-all shadow-inner"
                  />
                  <Github className="absolute left-4 top-4 w-6 h-6 text-slate-400" />
                </div>
                <p className="text-sm text-slate-500">We will analyze your top 5 most recently updated public repositories.</p>
              </div>
            </CardContent>
            <CardFooter className="bg-slate-50 border-t py-6 relative z-10">
              <Button 
                onClick={() => githubMutation.mutate()} 
                disabled={!githubInput || githubMutation.isPending}
                className="w-full sm:w-auto px-10 h-14 text-lg font-bold shadow-md hover:shadow-lg transition-all"
              >
                {githubMutation.isPending ? (
                  <><Loader2 className="w-6 h-6 mr-2 animate-spin" /> Mining Repositories...</>
                ) : (
                  <><ShieldCheck className="w-6 h-6 mr-2" /> Verify Repositories</>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

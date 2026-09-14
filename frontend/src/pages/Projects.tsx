import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { sourcesApi } from "../api/sources";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Code as Github, Globe as Linkedin, Loader2, Code, ShieldCheck } from "lucide-react";

export default function Projects() {
  const [githubInput, setGithubInput] = useState("");
  const [linkedinText, setLinkedinText] = useState("");

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

  const linkedinMutation = useMutation({
    mutationFn: () => sourcesApi.analyzeLinkedin(linkedinText),
    onSuccess: (data) => alert(`Awesome! Extracted ${data.skills_found} claimed skills.`),
    onError: (err: any) => alert(err.response?.data?.detail || "Failed to analyze LinkedIn"),
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
          <Card className="shadow-lg border-0 ring-1 ring-slate-200 hover:ring-indigo-300 hover:shadow-xl transition-all overflow-hidden relative group bg-white">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Github className="w-32 h-32 text-slate-900" />
            </div>
            <CardHeader className="pb-4">
              <div className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center mb-6 shadow-sm">
                <Code className="w-6 h-6" />
              </div>
              <CardTitle className="text-2xl">GitHub Analysis</CardTitle>
              <CardDescription className="text-base text-slate-500">
                Automatically scan your public repositories, READMEs, and tech stack to ground your skills in actual code.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 relative z-10">
              <div className="space-y-2">
                <label htmlFor="github" className="text-sm font-semibold text-slate-700">
                  GitHub Username or URL
                </label>
                <div className="relative">
                  <Input 
                    id="github" 
                    placeholder="e.g. torvalds or https://github.com/torvalds" 
                    value={githubInput} 
                    onChange={(e) => setGithubInput(e.target.value)}
                    className="pl-10 h-12 bg-slate-50 border-slate-200 focus:bg-white"
                  />
                  <Github className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-slate-50 border-t py-4 relative z-10">
              <Button 
                onClick={() => githubMutation.mutate()} 
                disabled={!githubInput || githubMutation.isPending}
                className="w-full h-12 text-base font-semibold shadow-sm"
              >
                {githubMutation.isPending ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Mining Repositories...</>
                ) : (
                  <><ShieldCheck className="w-5 h-5 mr-2" /> Verify Repositories</>
                )}
              </Button>
            </CardFooter>
          </Card>

          {/* LinkedIn Card */}
          <Card className="shadow-lg border-0 ring-1 ring-slate-200 hover:ring-blue-300 hover:shadow-xl transition-all overflow-hidden relative group bg-white">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Linkedin className="w-32 h-32 text-blue-600" />
            </div>
            <CardHeader className="pb-4">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center mb-6 shadow-sm">
                <Linkedin className="w-6 h-6" />
              </div>
              <CardTitle className="text-2xl">LinkedIn Claims</CardTitle>
              <CardDescription className="text-base text-slate-500">
                Paste your LinkedIn about or experience section to extract the skills you claim to have.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 relative z-10">
              <div className="space-y-2">
                <label htmlFor="linkedin" className="text-sm font-semibold text-slate-700">
                  Profile Text
                </label>
                <textarea 
                  id="linkedin" 
                  placeholder="Paste your LinkedIn 'About' or 'Experience' descriptions here..." 
                  value={linkedinText} 
                  onChange={(e) => setLinkedinText(e.target.value)}
                  className="flex min-h-[140px] w-full rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm shadow-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </CardContent>
            <CardFooter className="bg-slate-50 border-t py-4 relative z-10">
              <Button 
                onClick={() => linkedinMutation.mutate()} 
                disabled={!linkedinText || linkedinMutation.isPending}
                className="w-full h-12 text-base font-semibold shadow-sm"
                variant="outline"
              >
                {linkedinMutation.isPending ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Extracting Skills...</>
                ) : (
                  "Extract Claimed Skills"
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

import { useAuth } from "../hooks/useAuth";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { profileApi } from "../api/profile";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { ArrowRight, FileText, Code, Mic, User, CheckCircle2, Circle } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  
  const { data: profile } = useQuery({
    queryKey: ["skillTwin"],
    queryFn: profileApi.getSkillTwin,
  });

  const hasResume = profile?.candidate_skills && profile.candidate_skills.length > 0;
  const hasEvidence = profile?.candidate_skills?.some((s: any) => s.evidence_confidence > 0);
  const hasInterview = profile?.candidate_skills?.some((s: any) => s.demonstrated_score > 0);

  const completedSteps = [hasResume, hasEvidence, hasInterview].filter(Boolean).length;
  const progressPercent = Math.round((completedSteps / 3) * 100);

  return (
    <div className="container mx-auto py-12 px-4 space-y-10 max-w-6xl">
      
      {/* Hero Section */}
      <div className="bg-slate-900 p-8 md:p-12 rounded-3xl shadow-2xl text-center md:text-left flex flex-col md:flex-row items-center justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10" />
        <div className="relative z-10 space-y-4 max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
            Welcome back, <span className="text-primary">{user?.email?.split('@')[0]}</span>!
          </h1>
          <p className="text-lg text-slate-300">
            {completedSteps === 3 
              ? "Your SkillTwin profile is fully verified! Keep uploading new experiences and projects to maintain your edge."
              : "Ready to prove your skills? Complete your profile by uploading your resume, connecting your GitHub, and taking the adaptive interview."}
          </p>
          
          <div className="mt-6 flex items-center space-x-4 bg-slate-800/50 p-4 rounded-xl backdrop-blur-sm border border-slate-700/50 inline-flex">
            <div className="text-slate-300 font-semibold mr-4">Profile Completion:</div>
            <div className="flex-1 w-48 h-3 bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all duration-1000 ease-out" style={{ width: `${progressPercent}%` }} />
            </div>
            <div className="text-white font-bold text-lg">{progressPercent}%</div>
          </div>
        </div>
        
        <div className="mt-8 md:mt-0 relative z-10 flex-shrink-0">
          <Link to="/interview">
            <Button size="lg" className="px-8 shadow-xl hover:shadow-2xl transition-all rounded-full h-16 text-xl font-bold bg-white text-slate-900 hover:bg-slate-100">
              <Mic className="w-6 h-6 mr-3 text-red-500 animate-pulse" /> Start Live Interview
            </Button>
          </Link>
        </div>
      </div>

      {/* Action Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Step 1: Resume */}
        <Card className={`hover:shadow-lg transition-all ${hasResume ? 'bg-green-50/30 border-green-200' : ''}`}>
          <CardHeader>
            <div className="flex justify-between items-start mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${hasResume ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                <FileText className="w-6 h-6" />
              </div>
              {hasResume ? <CheckCircle2 className="w-6 h-6 text-green-500" /> : <Circle className="w-6 h-6 text-slate-300" />}
            </div>
            <CardTitle>1. Resume Base</CardTitle>
            <CardDescription>Extract your core skills and claims automatically.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/resume" className="text-primary flex items-center font-bold hover:underline">
              {hasResume ? "Update Resume" : "Upload Resume"} <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </CardContent>
        </Card>

        {/* Step 2: Evidence */}
        <Card className={`hover:shadow-lg transition-all ${hasEvidence ? 'bg-green-50/30 border-green-200' : ''}`}>
          <CardHeader>
            <div className="flex justify-between items-start mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${hasEvidence ? 'bg-green-100 text-green-600' : 'bg-indigo-100 text-indigo-600'}`}>
                <Code className="w-6 h-6" />
              </div>
              {hasEvidence ? <CheckCircle2 className="w-6 h-6 text-green-500" /> : <Circle className="w-6 h-6 text-slate-300" />}
            </div>
            <CardTitle>2. Connect Code</CardTitle>
            <CardDescription>Link GitHub to prove claims with real code evidence.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/projects" className="text-primary flex items-center font-bold hover:underline">
              {hasEvidence ? "Sync GitHub" : "Connect GitHub"} <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </CardContent>
        </Card>

        {/* Step 3: Interview */}
        <Card className={`hover:shadow-lg transition-all ${hasInterview ? 'bg-green-50/30 border-green-200' : ''}`}>
          <CardHeader>
            <div className="flex justify-between items-start mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${hasInterview ? 'bg-green-100 text-green-600' : 'bg-rose-100 text-rose-600'}`}>
                <Mic className="w-6 h-6" />
              </div>
              {hasInterview ? <CheckCircle2 className="w-6 h-6 text-green-500" /> : <Circle className="w-6 h-6 text-slate-300" />}
            </div>
            <CardTitle>3. Live Interview</CardTitle>
            <CardDescription>Answer dynamically tailored questions based on your gaps.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/interview" className="text-primary flex items-center font-bold hover:underline">
              {hasInterview ? "Retake Interview" : "Start Interview"} <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </CardContent>
        </Card>

        {/* Step 4: Review */}
        <Card className="hover:shadow-lg transition-shadow border-slate-200">
          <CardHeader>
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-4 shadow-sm">
              <User className="w-6 h-6" />
            </div>
            <CardTitle>4. Your SkillTwin</CardTitle>
            <CardDescription>View your finalized, evidence-backed skill profile.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/profile" className="text-emerald-600 flex items-center font-bold hover:underline">
              View Profile <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

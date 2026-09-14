import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { BrainCircuit, Target, ShieldCheck, Zap } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col font-sans">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-600 rounded-xl mr-3 shadow-md shadow-indigo-200">
                <BrainCircuit className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-extrabold text-slate-900 tracking-tight">SkillTwin</span>
            </div>
            <div className="flex space-x-4 items-center">
              <Link to="/login">
                <Button variant="ghost" className="font-semibold text-slate-600 hover:text-indigo-600">Sign In</Button>
              </Link>
              <Link to="/register">
                <Button className="font-bold shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all rounded-full px-6">Get Started Free</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-slate-900 text-white">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative pt-28 pb-36">
            <div className="text-center max-w-5xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 mb-8 font-medium text-sm">
                <ShieldCheck className="w-4 h-4" /> Powered by PRISM Governance, Sarvam AI & Groq Whisper
              </div>
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1]">
                Your Dynamic, Evidence-Based <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Skill Twin</span>
              </h1>
              <p className="text-xl md:text-2xl text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed font-light">
                We believe that resumes only tell half the story. SkillTwin builds a mathematically proven digital twin of your capabilities by reading your resume, verifying your GitHub code, and rigorously testing you through a live, adaptive Voice AI technical interview.
              </p>
              <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
                <Link to="/register">
                  <Button size="lg" className="h-16 px-10 text-xl font-bold rounded-full shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-105 transition-all bg-indigo-600 hover:bg-indigo-500 text-white">
                    Create Your SkillTwin
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline" className="h-16 px-10 text-xl font-bold rounded-full bg-white/5 border-white/20 text-white hover:bg-white/10 hover:text-white transition-all">
                    View My Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 relative bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">What We Do</h2>
              <p className="mt-6 text-xl text-slate-600 max-w-3xl mx-auto">
                SkillTwin is redefining hiring and upskilling. Instead of relying on self-reported skills, we build an intelligent pipeline that extracts claims, seeks evidence, and dynamically pressure-tests candidates through an automated technical interview powered by state-of-the-art voice LLMs.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto">
              <div className="bg-slate-50 p-10 rounded-3xl shadow-lg border border-slate-200 flex flex-col items-center text-center hover:-translate-y-2 transition-transform duration-300">
                <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-3xl flex items-center justify-center mb-8 shadow-inner border border-blue-200">
                  <Target className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">1. Claim Extraction</h3>
                <p className="text-slate-600 text-lg leading-relaxed">Upload your resume. Our AI instantly parses and indexes every framework, programming language, and skill you claim to possess.</p>
              </div>

              <div className="bg-slate-50 p-10 rounded-3xl shadow-lg border border-slate-200 flex flex-col items-center text-center hover:-translate-y-2 transition-transform duration-300 relative transform md:-translate-y-4">
                <div className="absolute -top-5 bg-indigo-600 text-white text-xs font-bold px-4 py-1 rounded-full shadow-md">EVIDENCE</div>
                <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-3xl flex items-center justify-center mb-8 shadow-inner border border-indigo-200">
                  <ShieldCheck className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">2. Grounded Verification</h3>
                <p className="text-slate-600 text-lg leading-relaxed">Link your GitHub profile. We automatically scan your repositories to ground your resume claims with verifiable code evidence.</p>
              </div>

              <div className="bg-slate-50 p-10 rounded-3xl shadow-lg border border-slate-200 flex flex-col items-center text-center hover:-translate-y-2 transition-transform duration-300">
                <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-3xl flex items-center justify-center mb-8 shadow-inner border border-rose-200">
                  <Zap className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">3. Adaptive Voice Interview</h3>
                <p className="text-slate-600 text-lg leading-relaxed">Engage in a live technical interview powered by Groq and Sarvam AI. The system dynamically targets your skill gaps to calculate true mastery.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-900 py-16 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center items-center mb-8">
            <div className="p-2 bg-indigo-600 rounded-lg mr-3">
              <BrainCircuit className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">SkillTwin</span>
          </div>
          <p className="text-slate-400 text-base mb-2">
            Built for the VIT Vellore Hackathon.
          </p>
          <p className="text-slate-500 text-sm">
            Powered by Groq, Sarvam AI, PRISM Trace, and React.
          </p>
        </div>
      </footer>
    </div>
  );
}

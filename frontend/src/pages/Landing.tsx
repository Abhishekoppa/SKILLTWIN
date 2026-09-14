import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { BrainCircuit, Target, ShieldCheck, Zap } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <BrainCircuit className="h-8 w-8 text-primary" />
              <span className="ml-2 text-2xl font-bold text-slate-900 tracking-tight">SkillTwin</span>
            </div>
            <div className="flex space-x-4">
              <Link to="/login">
                <Button variant="ghost" className="font-medium text-slate-600">Log In</Button>
              </Link>
              <Link to="/register">
                <Button className="font-medium shadow-sm">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-white">
          <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] bg-[length:20px_20px]" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative pt-24 pb-32">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-8 leading-tight">
                Your Dynamic, Evidence-Based <span className="text-primary">Skill Model</span>
              </h1>
              <p className="text-xl md:text-2xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                SkillTwin analyzes your resume, proves your claims with GitHub code, and dynamically evaluates you in a live adaptive AI interview.
              </p>
              <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
                <Link to="/register">
                  <Button size="lg" className="h-14 px-8 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all">
                    Create Your SkillTwin
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-medium rounded-full bg-white">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-slate-50 border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">How SkillTwin Works</h2>
              <p className="mt-4 text-lg text-slate-600">The most rigorous, tamper-proof skills assessment platform.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                  <Target className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Claim Extraction</h3>
                <p className="text-slate-600">Upload your resume and LinkedIn. We automatically extract and index every skill you claim to possess.</p>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
                <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Evidence Grounding</h3>
                <p className="text-slate-600">Connect GitHub to prove your claims. We analyze your actual code to generate verifiable evidence scores.</p>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
                <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mb-6">
                  <Zap className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Adaptive Interview</h3>
                <p className="text-slate-600">Engage in a live voice interview. The AI dynamically targets your weak spots to calculate your demonstrated mastery.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center items-center mb-6">
            <BrainCircuit className="h-6 w-6 text-primary" />
            <span className="ml-2 text-xl font-bold text-white tracking-tight">SkillTwin</span>
          </div>
          <p className="text-slate-400 text-sm">
            © {new Date().getFullYear()} SkillTwin. Built for the VIT Vellore Hackathon.
          </p>
        </div>
      </footer>
    </div>
  );
}

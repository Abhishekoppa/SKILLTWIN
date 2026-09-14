import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { BrainCircuit, Home, FileText, User, Code, Mic, LogOut } from "lucide-react";
import { Button } from "./ui/button";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: <Home className="w-4 h-4 mr-2" /> },
    { name: "Resume", path: "/resume", icon: <FileText className="w-4 h-4 mr-2" /> },
    { name: "Sources", path: "/projects", icon: <Code className="w-4 h-4 mr-2" /> },
    { name: "SkillTwin", path: "/profile", icon: <User className="w-4 h-4 mr-2" /> },
    { name: "Live Interview", path: "/interview", icon: <Mic className="w-4 h-4 mr-2 text-rose-500" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex overflow-x-auto">
              <div className="flex-shrink-0 flex items-center pr-6">
                <BrainCircuit className="h-8 w-8 text-primary" />
                <span className="ml-2 text-xl font-bold text-slate-900 tracking-tight">SkillTwin</span>
              </div>
              <div className="flex space-x-2 sm:space-x-4">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      className={`inline-flex items-center px-3 py-2 mt-3 mb-3 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                        isActive 
                          ? "bg-slate-100 text-slate-900" 
                          : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      {item.icon}
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center space-x-4 ml-4">
              <Button variant="ghost" size="sm" onClick={logout} className="text-slate-500 whitespace-nowrap">
                <LogOut className="w-4 h-4 mr-1 sm:mr-2" /> <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}

import { Link, Outlet, useLocation } from "react-router-dom";
import { Activity, ShieldCheck, Database, Smartphone, Terminal, Fingerprint } from "lucide-react";
import { Toaster } from "react-hot-toast";
import { cn } from "../lib/utils";

export function Layout() {
  const location = useLocation();

  const navLinks = [
    { name: "Explorer", path: "/explorer", icon: Database },
    { name: "Clinic MIS", path: "/clinic", icon: Activity },
    { name: "Patient TMA", path: "/patient", icon: Smartphone },
    { name: "Patient Tokenizer", path: "/tokenizer", icon: Fingerprint },
  ];

  return (
    <div className="min-h-screen flex flex-col pt-16 relative">
      <Toaster 
        position="top-center" 
        toastOptions={{
          style: {
            background: '#0f172a',
            color: '#f8fafc',
            border: '1px solid #1e293b',
          },
          success: {
            iconTheme: {
              primary: '#06b6d4',
              secondary: '#0f172a',
            },
          },
        }} 
      />
      
      <header className="fixed top-0 inset-x-0 h-16 border-b border-white/5 bg-slate-950/60 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-primary-500 font-mono font-bold text-xl tracking-tight"
          >
            <ShieldCheck className="w-6 h-6" />
            <span>MedStamp</span>
          </Link>

          <nav className="flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                location.pathname === link.path ||
                (link.path === "/patient" &&
                  location.pathname.startsWith("/patient"));
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors",
                    isActive
                      ? "bg-slate-800 text-slate-50"
                      : "text-slate-400 hover:text-slate-50 hover:bg-slate-800/50",
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline-block">{link.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto py-8">
        <Outlet />
      </main>

      {/* Live Log Stream Indicator */}
      <div className="fixed bottom-4 right-4 z-40 group">
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex items-center gap-3 shadow-2xl backdrop-blur-sm shadow-primary-500/10">
          <div className="relative flex h-3 w-3">
             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
             <span className="relative inline-flex rounded-full h-3 w-3 bg-primary-500"></span>
          </div>
          <span className="text-xs font-mono text-slate-400 select-none hidden sm:inline-block group-hover:text-primary-400 transition-colors">
            Node: Connected
          </span>
          <Terminal className="w-4 h-4 text-slate-500" />
        </div>
      </div>
    </div>
  );
}

import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Droplets, Zap, Leaf, BarChart3, Bell, Shield } from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white overflow-hidden">
      
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 md:px-12 py-5">
        <h2 className="text-xl font-bold font-display tracking-tight">
          SUS<span className="text-[#3b82f6]">TAINA</span>
        </h2>
        <div className="flex gap-3">
          <Link to="/login">
            <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10 rounded-full">
              Login
            </Button>
          </Link>
          <Link to="/signup">
            <Button className="bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-full px-6">
              Sign Up
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-6 md:px-12 pt-16 pb-24 md:pt-24 md:pb-32">
        {/* Glow effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#3b82f6]/20 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
          <div className="inline-block px-4 py-1.5 rounded-full border border-[#3b82f6]/30 bg-[#3b82f6]/10 text-[#60a5fa] text-sm font-medium mb-4">
            🌱 Smart Resource Management
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold font-display leading-tight">
            Track. Save.<br />
            <span className="text-[#3b82f6]">Sustain.</span>
          </h1>
          <p className="text-base sm:text-lg text-white/60 max-w-xl mx-auto leading-relaxed">
            Monitor your water & electricity consumption in real-time, set smart goals, and get AI-powered suggestions to reduce waste.
          </p>

          {/* ✅ Updated CTA (View Demo removed) */}
          <div className="flex justify-center pt-4">
            <Link to="/signup">
              <Button size="lg" className="bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-full px-8 gap-2">
                Get Started Free <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative z-10 max-w-2xl mx-auto mt-16 grid grid-cols-3 gap-4 text-center">
          {[
            { num: "30%", label: "Avg Savings" },
            { num: "10K+", label: "Devices Tracked" },
            { num: "24/7", label: "Real-time Alerts" },
          ].map((s) => (
            <div key={s.label} className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="text-2xl sm:text-3xl font-bold font-display text-[#3b82f6]">{s.num}</div>
              <div className="text-xs sm:text-sm text-white/50 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-6 md:px-12 py-20 bg-[#0d1224]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold font-display text-center mb-4">
            Everything You Need
          </h2>
          <p className="text-white/50 text-center mb-12 max-w-lg mx-auto">
            Powerful features to help you understand and reduce your resource consumption.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Zap, title: "Electricity Tracking", desc: "Monitor usage across rooms & devices in real-time." },
              { icon: Droplets, title: "Water Monitoring", desc: "Track water patterns and get alerts on overuse." },
              { icon: Leaf, title: "AI Suggestions", desc: "Smart nudges to reduce waste and save bills." },
              { icon: BarChart3, title: "Analytics", desc: "Weekly & monthly reports with comparison charts." },
              { icon: Bell, title: "Smart Alerts", desc: "Real-time notifications when you exceed targets." },
              { icon: Shield, title: "Secure Data", desc: "Your data is encrypted and fully private." },
            ].map((f) => (
              <div key={f.title} className="p-6 rounded-xl bg-white/5 border border-white/10 hover:border-[#3b82f6]/40 hover:bg-[#3b82f6]/5 transition-all duration-300 group">
                <div className="w-10 h-10 rounded-lg bg-[#3b82f6]/10 flex items-center justify-center mb-4 group-hover:bg-[#3b82f6]/20 transition-colors">
                  <f.icon className="h-5 w-5 text-[#3b82f6]" />
                </div>
                <h3 className="text-lg font-semibold font-display mb-2">{f.title}</h3>
                <p className="text-sm text-white/50">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 md:px-12 py-20">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-bold font-display">
            Ready to <span className="text-[#3b82f6]">Save</span>?
          </h2>
          <p className="text-white/50">
            Join thousands of users who are reducing their resource consumption every day.
          </p>
          <Link to="/signup">
            <Button size="lg" className="bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-full px-10 gap-2 mt-4">
              Start Now <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center text-sm text-white/40 px-6">
        © 2026 SUSTAINA. All rights reserved.
      </footer>
    </div>
  );
};

export default Landing;
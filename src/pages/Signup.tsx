import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import authIllustration from "@/assets/auth-illustration.png";

const Signup = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !email.trim() || !password.trim()) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, username, mobile);
      toast.success("Account created! Check your email to verify.");
      navigate("/login");
    } catch (err: any) {
      toast.error(err?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-2 sm:p-4">
      <div className="w-full max-w-4xl rounded-2xl border border-border bg-card shadow-lg overflow-hidden">
        
        <div className="grid grid-cols-[2fr_3fr] sm:grid-cols-2">
          
          {/* Left Image */}
          <div className="flex items-center justify-center bg-secondary p-3 sm:p-8">
            <img
              src={authIllustration}
              alt="Signup illustration"
              className="w-full h-auto max-h-[160px] sm:max-h-[350px] object-contain"
            />
          </div>

          {/* Right Form */}
          <div className="flex flex-col justify-center p-3 sm:p-6 md:p-10">
            
            {/* Logo */}
            <div className="flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 mb-3 sm:mb-6">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xs sm:text-sm">S</span>
              </div>
              <span className="font-display font-bold text-sm sm:text-lg text-foreground">
                Sustaina
              </span>
            </div>

            <h1 className="text-lg sm:text-2xl md:text-3xl font-bold font-display text-foreground mb-0.5 sm:mb-1 text-center sm:text-left">
              Get Started
            </h1>

            <p className="text-muted-foreground mb-3 sm:mb-5 text-[11px] sm:text-sm text-center sm:text-left">
              Create your account in seconds
            </p>

            {/* 🔥 DIRECT FORM (NO GOOGLE BUTTON) */}
            <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-3">

              <Input
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="h-8 sm:h-11 text-xs sm:text-sm"
              />

              <div className="flex gap-1.5 sm:gap-2">
                <div className="flex items-center gap-1 px-2 sm:px-3 h-8 sm:h-11 rounded-md border border-input bg-background text-[11px] sm:text-sm text-muted-foreground shrink-0">
                  🇮🇳 +91
                </div>
                <Input
                  placeholder="Mobile No."
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="h-8 sm:h-11 text-xs sm:text-sm"
                />
              </div>

              <Input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-8 sm:h-11 text-xs sm:text-sm"
              />

              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="h-8 sm:h-11 pr-8 sm:pr-10 text-xs sm:text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  ) : (
                    <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  )}
                </button>
              </div>

              <Button
                type="submit"
                className="w-full h-8 sm:h-11 text-xs sm:text-sm"
                disabled={loading}
              >
                {loading ? "Signing up..." : "Create Account"}
              </Button>
            </form>

            <p className="mt-3 sm:mt-5 text-center text-[11px] sm:text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </p>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
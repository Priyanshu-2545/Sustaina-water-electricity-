import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import authIllustration from "@/assets/auth-illustration.png";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ✅ UPDATED
  const { signIn, signInWithGoogle, user, loading: authLoading } = useAuth();

  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [authLoading, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
      toast.success("Welcome back!");
    } catch (err: any) {
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // 🔥 GOOGLE LOGIN HANDLER
  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (err: any) {
      toast.error(err.message || "Google login failed");
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-2 sm:p-4">
      <div className="w-full max-w-4xl rounded-2xl border border-border bg-card shadow-lg overflow-hidden">
        <div className="grid grid-cols-[2fr_3fr] sm:grid-cols-2">
          
          {/* Left Image */}
          <div className="flex items-center justify-center bg-secondary p-3 sm:p-8">
            <img
              src={authIllustration}
              alt="Login illustration"
              className="w-full h-auto max-h-[160px] sm:max-h-[350px] object-contain"
            />
          </div>

          {/* Right Form */}
          <div className="flex flex-col justify-center p-3 sm:p-6 md:p-10">
            
            <div className="flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 mb-3 sm:mb-6">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xs sm:text-sm">S</span>
              </div>
              <span className="font-display font-bold text-sm sm:text-lg text-foreground">
                Sustaina
              </span>
            </div>

            <h1 className="text-lg sm:text-2xl md:text-3xl font-bold font-display text-foreground mb-0.5 sm:mb-1 text-center sm:text-left">
              Welcome back
            </h1>

            <p className="text-muted-foreground mb-3 sm:mb-6 text-[11px] sm:text-sm text-center sm:text-left">
              Log in to your account
            </p>

            {/* 🔥 GOOGLE BUTTON (FIXED) */}
            <Button
              variant="outline"
              className="w-full mb-2 sm:mb-4 h-8 sm:h-11 text-[11px] sm:text-sm font-medium"
              type="button"
              onClick={handleGoogleLogin}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2 shrink-0" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span className="truncate">Sign in with Google</span>
            </Button>

            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[10px] sm:text-xs text-muted-foreground uppercase">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-4">
              <Input
                type="email"
                placeholder="Email"
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
                  className="h-8 sm:h-11 pr-8 sm:pr-10 text-xs sm:text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                </button>
              </div>

              <div className="text-right">
                <Link to="/forgot-password" className="text-[11px] sm:text-sm text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" className="w-full h-8 sm:h-11 text-xs sm:text-sm" disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>

            <p className="mt-3 sm:mt-6 text-center text-[11px] sm:text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/signup" className="font-medium text-primary hover:underline">
                Sign up for free
              </Link>
            </p>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
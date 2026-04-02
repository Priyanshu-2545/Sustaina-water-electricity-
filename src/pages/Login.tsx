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

        {/* ✅ UPDATED GRID */}
        <div className="grid grid-cols-[2fr_3fr] sm:grid-cols-2">

          {/* ✅ IMAGE */}
          <div className="flex items-center justify-center bg-secondary p-3 sm:p-8">
            <img
              src={authIllustration}
              alt="Login illustration"
              className="w-full h-auto max-h-[250px] sm:max-h-[350px] object-contain scale-110 sm:scale-100"
            />
          </div>

          {/* ✅ FORM */}
          <div className="flex flex-col justify-center p-4 sm:p-6 md:p-10">

            <div className="flex items-center justify-center sm:justify-start gap-2 mb-4 sm:mb-6">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">S</span>
              </div>
              <span className="font-display font-bold text-lg text-foreground">
                Sustaina
              </span>
            </div>

            {/* ✅ UPDATED HEADING */}
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold font-display text-foreground mb-1 text-center sm:text-left">
              Welcome back
            </h1>

            <p className="text-muted-foreground mb-4 sm:mb-6 text-sm text-center sm:text-left">
              Log in to your account
            </p>

            <Button
              variant="outline"
              className="w-full mb-3 sm:mb-4 h-9 sm:h-11 text-sm font-medium"
              type="button"
              onClick={handleGoogleLogin}
            >
              Sign in with Google
            </Button>

            <div className="flex items-center gap-3 mb-3 sm:mb-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground uppercase">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* ✅ FORM SPACING */}
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">

              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-9 sm:h-11"
              />

              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-9 sm:h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>

              <div className="text-right">
                <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" className="w-full h-9 sm:h-11" disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>

            <p className="mt-4 sm:mt-6 text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/signup" className="font-medium text-primary hover:underline">
                Sign up
              </Link>
            </p>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
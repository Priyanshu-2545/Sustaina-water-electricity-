import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import authIllustration from "@/assets/auth-illustration.png";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { signIn, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // ✅ Auto redirect after login
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

  // ✅ Loading screen
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-5xl rounded-2xl border border-border bg-card shadow-lg overflow-hidden">

        {/* ✅ FIXED: Always 2 column like Signup */}
        <div className="grid grid-cols-2">

          {/* 🔵 LEFT IMAGE */}
          <div className="flex items-center justify-center bg-secondary p-4">
            <img
              src={authIllustration}
              alt="Auth Illustration"
              className="w-full max-w-[260px] md:max-w-sm object-contain"
            />
          </div>

          {/* 🟢 RIGHT FORM */}
          <div className="flex flex-col justify-center p-6 md:p-12">
            <h1 className="text-3xl font-bold text-primary mb-2">
              Login here
            </h1>
            <p className="text-muted-foreground mb-6">
              Welcome back, you've been missed!
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">

              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <div className="text-right">
                <Link
                  to="/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="font-medium text-primary hover:underline"
              >
                Sign Up
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;
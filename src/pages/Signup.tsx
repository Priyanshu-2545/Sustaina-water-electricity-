import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react"; // ✅ ADD
import authIllustration from "@/assets/auth-illustration.png";

const Signup = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false); // ✅ ADD

  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!username.trim() || !email.trim() || !password.trim()) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      const { session } = await signUp(email, password, username, mobile);

      if (session) {
        toast.success("Account created successfully!");
        navigate("/dashboard");
      } else {
        toast.success("Account created! Please login.");
        navigate("/login");
      }
    } catch (err: any) {
      toast.error(err?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-3 sm:p-4">
      <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
        
        <div className="grid grid-cols-[0.95fr_1.05fr] sm:grid-cols-[1fr_1.1fr]">
          
          <div className="flex min-w-0 items-center justify-center bg-secondary p-3 sm:p-5 md:p-8">
            <img
              src={authIllustration}
              alt="Signup illustration"
              className="h-auto w-full max-h-[260px] object-contain sm:max-h-[320px] md:max-h-[420px]"
              loading="lazy"
            />
          </div>

          <div className="min-w-0 p-4 sm:p-5 md:p-8 lg:p-10">
            <h1 className="mb-1 font-display text-xl font-bold text-primary sm:text-2xl md:text-3xl">
              Create Account
            </h1>
            <p className="mb-4 text-xs text-muted-foreground sm:mb-5 sm:text-sm">
              Join us to discover all sustainable usage insights
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">
              
              <Input
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="h-9"
              />

              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-9"
              />

              {/* 🔥 PASSWORD WITH EYE */}
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="h-9 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <Input
                placeholder="Mobile No."
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="h-9"
              />

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing up..." : "Sign Up"}
              </Button>
            </form>

            <p className="mt-5 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="font-medium text-primary hover:underline">
                Log in
              </Link>
            </p>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
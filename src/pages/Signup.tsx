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
      toast.success("Account created! Check your email.");
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

        {/* ✅ UPDATED GRID */}
        <div className="grid grid-cols-[2fr_3fr] sm:grid-cols-2">

          {/* IMAGE */}
          <div className="flex items-center justify-center bg-secondary p-3 sm:p-8">
            <img
              src={authIllustration}
              alt="Signup illustration"
              className="w-full h-auto max-h-[250px] sm:max-h-[350px] object-contain scale-110 sm:scale-100"
            />
          </div>

          {/* FORM */}
          <div className="flex flex-col justify-center p-4 sm:p-6 md:p-10">

            <div className="flex items-center justify-center sm:justify-start gap-2 mb-4 sm:mb-6">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">S</span>
              </div>
              <span className="font-display font-bold text-lg text-foreground">
                Sustaina
              </span>
            </div>

            {/* HEADING */}
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-1 text-center sm:text-left">
              Get Started
            </h1>

            <p className="text-muted-foreground mb-4 sm:mb-6 text-sm text-center sm:text-left">
              Create your account
            </p>

            {/* FORM */}
            <form onSubmit={handleSubmit} className="space-y-2.5 sm:space-y-3">

              <Input
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="h-9 sm:h-11"
              />

              {/* MOBILE */}
            <Input
              type="tel"
              placeholder="Mobile Number"
              value={mobile}
              onChange={(e) => {
              const value = e.target.value.replace(/\D/g, ""); // only digits
              setMobile(value);
             }}
             maxLength={10}
             className="h-9 sm:h-11"
            />

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
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>

              <Button type="submit" className="w-full h-9 sm:h-11" disabled={loading}>
                {loading ? "Signing up..." : "Create Account"}
              </Button>
            </form>

            <p className="mt-4 sm:mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary font-medium hover:underline">
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
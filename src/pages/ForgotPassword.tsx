import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import authIllustration from "@/assets/auth-illustration.png";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast.error(error.message);
    } else {
      setSent(true);
      toast.success("Password reset email sent! Check your inbox.");
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-4xl rounded-2xl border border-border bg-card shadow-lg overflow-hidden">
        <div className="grid md:grid-cols-2">
          <div className="hidden md:flex items-center justify-center bg-secondary p-8">
            <img src={authIllustration} alt="Reset illustration" className="max-w-full h-auto" />
          </div>
          <div className="flex flex-col justify-center p-8 md:p-12">
            <h1 className="text-3xl font-bold font-display text-primary mb-2">Forgot Password</h1>
            <p className="text-muted-foreground mb-8">
              {sent
                ? "We've sent a password reset link to your email. Please check your inbox."
                : "Enter your email and we'll send you a reset link."}
            </p>
            {!sent ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? "Sending..." : "Send Reset Link"}
                </Button>
              </form>
            ) : (
              <Button variant="outline" className="w-full" size="lg" onClick={() => { setSent(false); setEmail(""); }}>
                Send Again
              </Button>
            )}
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Remember your password?{" "}
              <Link to="/login" className="font-medium text-primary hover:underline">Login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

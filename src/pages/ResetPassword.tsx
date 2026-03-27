import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import authIllustration from "@/assets/auth-illustration.png";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    // Check URL hash for recovery type
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords don't match!");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated successfully!");
      navigate("/dashboard");
    }
    setLoading(false);
  };

  if (!isRecovery) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold font-display text-primary">Invalid Reset Link</h1>
          <p className="text-muted-foreground">This link is invalid or has expired. Please request a new password reset.</p>
          <Button onClick={() => navigate("/forgot-password")}>Request New Link</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-4xl rounded-2xl border border-border bg-card shadow-lg overflow-hidden">
        <div className="grid md:grid-cols-2">
          <div className="hidden md:flex items-center justify-center bg-secondary p-8">
            <img src={authIllustration} alt="Reset illustration" className="max-w-full h-auto" />
          </div>
          <div className="flex flex-col justify-center p-8 md:p-12">
            <h1 className="text-3xl font-bold font-display text-primary mb-2">Set New Password</h1>
            <p className="text-muted-foreground mb-8">Enter your new password below.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input type="password" placeholder="New Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <Input type="password" placeholder="Confirm New Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;

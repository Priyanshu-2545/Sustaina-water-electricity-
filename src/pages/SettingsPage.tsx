import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { User, Save, Moon, Sun } from "lucide-react";

const SettingsPage = () => {
  const { user } = useAuth();
  const [username, setUsername] = useState("");
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return document.documentElement.classList.contains("dark");
  });

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  const fetchProfile = async () => {
    const { data } = await supabase.from("profiles").select("*").eq("user_id", user!.id).maybeSingle();
    if (data) {
      setUsername(data.username || "");
      setMobile(data.mobile || "");
    }
  };

  const updateProfile = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("profiles").update({ username, mobile }).eq("user_id", user.id);
    if (error) toast.error(error.message);
    else toast.success("Profile updated!");
    setLoading(false);
  };

  return (
    <div className="animate-fade-in space-y-6 ml-12 md:ml-0">
      <h1 className="text-2xl md:text-3xl font-bold font-display text-primary">Settings</h1>

      {/* Profile Section */}
      <div className="max-w-md rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="font-semibold">{user?.email}</p>
            <p className="text-sm text-muted-foreground">Manage your profile</p>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Username</label>
          <Input value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Mobile</label>
          <Input value={mobile} onChange={(e) => setMobile(e.target.value)} />
        </div>
        <Button onClick={updateProfile} disabled={loading} className="gap-2">
          <Save className="h-4 w-4" /> {loading ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Appearance Section */}
      <div className="max-w-md rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="section-title">Appearance</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {darkMode ? <Moon className="h-5 w-5 text-primary" /> : <Sun className="h-5 w-5 text-warning" />}
            <div>
              <p className="font-medium">Dark Mode</p>
              <p className="text-sm text-muted-foreground">Toggle dark/light theme</p>
            </div>
          </div>
          <Switch checked={darkMode} onCheckedChange={setDarkMode} />
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

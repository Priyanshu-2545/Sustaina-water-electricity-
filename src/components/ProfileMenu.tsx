import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Save, Camera } from "lucide-react";

interface ProfileMenuProps {
  className?: string;
}

const ProfileMenu = ({ className }: ProfileMenuProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    const { data } = await supabase.from("profiles").select("*").eq("user_id", user!.id).maybeSingle();
    if (data) {
      setUsername(data.username || "");
      setMobile(data.mobile || "");
      setAvatarUrl(data.avatar_url);
    }
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be less than 2MB");
      return;
    }

    setUploading(true);
    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast.error("Upload failed: " + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
    const publicUrl = urlData.publicUrl + "?t=" + Date.now(); // cache bust

    const { error: updateError } = await supabase
  .from("profiles")
  .upsert(
    {
      user_id: user.id,
      username: username || user.email?.split("@")[0] || "User",
      mobile: mobile || null,
      avatar_url: publicUrl,
    },
    { onConflict: "user_id" }
  );


    if (updateError) {
      toast.error(updateError.message);
    } else {
      setAvatarUrl(publicUrl);
      toast.success("Photo updated!");
    }
    setUploading(false);
  };

  const updateProfile = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("profiles").update({ username, mobile }).eq("user_id", user.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Profile updated!");
      setOpen(false);
    }
    setLoading(false);
  };

  const initials = username ? username.slice(0, 2).toUpperCase() : (user?.email?.slice(0, 2).toUpperCase() ?? "U");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className={className}>
          <Avatar className="h-9 w-9 cursor-pointer ring-2 ring-primary/20 hover:ring-primary/50 transition-all">
            <AvatarImage src={avatarUrl || undefined} alt="Profile" />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">{initials}</AvatarFallback>
          </Avatar>
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Update Profile</DialogTitle></DialogHeader>
        <div className="flex items-center gap-4 mb-2">
          <div className="relative group">
            <Avatar className="h-16 w-16">
              <AvatarImage src={avatarUrl || undefined} alt="Profile" />
              <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">{initials}</AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute inset-0 flex items-center justify-center rounded-full bg-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Camera className="h-5 w-5 text-background" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={uploadAvatar}
            />
          </div>
          <div>
            <p className="font-semibold">{username || "User"}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="text-xs text-primary hover:underline mt-1"
            >
              {uploading ? "Uploading..." : "Change Photo"}
            </button>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-1 block">Username</label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Mobile</label>
            <Input value={mobile} onChange={(e) => setMobile(e.target.value)} />
          </div>
          <Button onClick={updateProfile} disabled={loading} className="w-full gap-2">
            <Save className="h-4 w-4" /> {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileMenu;

import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import AppSidebar from "@/components/AppSidebar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Bell, X } from "lucide-react";
import { cn } from "@/lib/utils";

type RealtimeNotification = {
  id: string;
  title: string;
  message: string;
  type: string;
  created_at: string;
};

const DashboardLayout = () => {
  const { user } = useAuth();
  const [liveNotifs, setLiveNotifs] = useState<RealtimeNotification[]>([]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("realtime-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const notif = payload.new as RealtimeNotification;
          // Show toast
          const toastFn = notif.type === "alert" ? toast.error : notif.type === "warning" ? toast.warning : toast.info;
          toastFn(notif.title, { description: notif.message });
          // Add to live banner
          setLiveNotifs((prev) => [notif, ...prev].slice(0, 5));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const dismissNotif = (id: string) => {
    setLiveNotifs((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="page-container flex-1 overflow-auto">
        {/* Live notification banner */}
        {liveNotifs.length > 0 && (
          <div className="mb-4 space-y-2">
            {liveNotifs.map((n) => (
              <div
                key={n.id}
                className={cn(
                  "flex items-center gap-3 rounded-lg border px-4 py-3 animate-fade-in",
                  n.type === "alert" && "border-destructive/50 bg-destructive/10 text-destructive",
                  n.type === "warning" && "border-warning/50 bg-warning/10 text-warning",
                  n.type === "info" && "border-info/50 bg-info/10 text-info",
                  n.type === "success" && "border-success/50 bg-success/10 text-success",
                  !["alert", "warning", "info", "success"].includes(n.type) && "border-border bg-secondary"
                )}
              >
                <Bell className="h-4 w-4 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{n.title}</p>
                  <p className="text-xs opacity-80 truncate">{n.message}</p>
                </div>
                <button onClick={() => dismissNotif(n.id)} className="shrink-0 opacity-60 hover:opacity-100">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
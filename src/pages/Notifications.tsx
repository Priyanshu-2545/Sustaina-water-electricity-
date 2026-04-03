import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Bell, Check, Trash2 } from "lucide-react";

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
};

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // 🔥 Fetch notifications (USER-SPECIFIC)
  const fetchNotifications = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id) // ✅ IMPORTANT FIX
      .order("created_at", { ascending: false });

    if (error) {
      toast.error(error.message);
      return;
    }

    if (data) setNotifications(data);
  };

  // 🔥 Realtime + Initial fetch
  useEffect(() => {
    if (!user) return;

    fetchNotifications();

    const channel = supabase
      .channel("notifications-page")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchNotifications(); // 🔄 auto update
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // ✅ Mark single as read
  const markAsRead = async (id: string) => {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id)
      .eq("user_id", user?.id); // ✅ secure

    fetchNotifications();
  };

  // ✅ Mark all as read
  const markAllAsRead = async () => {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user?.id) // ✅ FIX
      .eq("is_read", false);

    toast.success("All marked as read");
    fetchNotifications();
  };

  // ✅ Delete notification
  const deleteNotification = async (id: string) => {
    await supabase
      .from("notifications")
      .delete()
      .eq("id", id)
      .eq("user_id", user?.id); // ✅ FIX

    fetchNotifications();
  };

  // 🎯 Unread count
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const typeColors: Record<string, string> = {
    warning: "border-l-warning",
    alert: "border-l-destructive",
    info: "border-l-info",
    success: "border-l-success",
  };

  return (
    <div className="animate-fade-in space-y-6 ml-12 md:ml-0">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold font-display text-primary">
          Notifications ({unreadCount})
        </h1>

        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            <Check className="h-4 w-4 mr-1" /> Mark all read
          </Button>
        )}
      </div>

      {/* Empty State */}
      {notifications.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <Bell className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`rounded-xl border border-border border-l-4 ${
                typeColors[n.type] || "border-l-border"
              } bg-card p-4 flex items-start justify-between gap-4 ${
                !n.is_read ? "bg-secondary/30" : ""
              }`}
            >
              <div className="flex-1">
                <p className="font-semibold">{n.title}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {n.message}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(n.created_at).toLocaleString()}
                </p>
              </div>

              <div className="flex gap-1">
                {!n.is_read && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => markAsRead(n.id)}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteNotification(n.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
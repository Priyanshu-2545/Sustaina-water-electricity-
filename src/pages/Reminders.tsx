import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Clock, Trash2 } from "lucide-react";

type Reminder = {
  id: string;
  title: string;
  description: string | null;
  reminder_time: string;
  days_of_week: number[];
  is_active: boolean;
};

const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const Reminders = () => {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", reminder_time: "08:00", days_of_week: [1, 2, 3, 4, 5, 6, 7] });

  useEffect(() => {
    if (user) fetchReminders();
  }, [user]);

  // Check reminders every minute
  useEffect(() => {
    const interval = setInterval(() => {
      checkReminders();
    }, 60000);
    checkReminders();
    return () => clearInterval(interval);
  }, [reminders]);

  const fetchReminders = async () => {
    const { data } = await supabase.from("schedule_reminders").select("*").order("reminder_time");
    if (data) setReminders(data);
  };

  const checkReminders = () => {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const currentDay = now.getDay() === 0 ? 7 : now.getDay();

    reminders.forEach((r) => {
      if (r.is_active && r.reminder_time.startsWith(currentTime) && r.days_of_week.includes(currentDay)) {
        // Show browser notification if permitted
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(`SUSTAINA Reminder: ${r.title}`, { body: r.description || "Time for your scheduled task!" });
        }
        toast.info(`⏰ Reminder: ${r.title}`, { description: r.description || undefined });
      }
    });
  };

  const requestNotificationPermission = async () => {
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
  };

  const addReminder = async () => {
    if (!form.title.trim() || !user) return;
    const { error } = await supabase.from("schedule_reminders").insert({
      user_id: user.id,
      title: form.title.trim(),
      description: form.description.trim() || null,
      reminder_time: form.reminder_time,
      days_of_week: form.days_of_week,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Reminder created!");
    setForm({ title: "", description: "", reminder_time: "08:00", days_of_week: [1, 2, 3, 4, 5, 6, 7] });
    setDialogOpen(false);
    fetchReminders();
    requestNotificationPermission();
  };

  const toggleReminder = async (id: string, isActive: boolean) => {
    await supabase.from("schedule_reminders").update({ is_active: !isActive }).eq("id", id);
    fetchReminders();
  };

  const deleteReminder = async (id: string) => {
    await supabase.from("schedule_reminders").delete().eq("id", id);
    toast.success("Reminder deleted");
    fetchReminders();
  };

  const toggleDay = (day: number) => {
    setForm(f => ({
      ...f,
      days_of_week: f.days_of_week.includes(day)
        ? f.days_of_week.filter(d => d !== day)
        : [...f.days_of_week, day].sort()
    }));
  };

  return (
    <div className="animate-fade-in space-y-6 ml-12 md:ml-0">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold font-display text-primary">Schedule Reminders</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Add Reminder</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Reminder</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Title (e.g., Turn off AC)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <Input placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <div>
                <label className="text-sm font-medium mb-1 block">Time</label>
                <Input type="time" value={form.reminder_time} onChange={(e) => setForm({ ...form, reminder_time: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Days</label>
                <div className="flex flex-wrap gap-2">
                  {dayLabels.map((label, i) => (
                    <label key={i} className="flex items-center gap-1.5 cursor-pointer">
                      <Checkbox checked={form.days_of_week.includes(i + 1)} onCheckedChange={() => toggleDay(i + 1)} />
                      <span className="text-sm">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <Button onClick={addReminder} className="w-full">Create Reminder</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {reminders.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No reminders yet. Create one to get notified!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reminders.map((r) => (
            <div key={r.id} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="font-semibold">{r.title}</span>
                  <span className="text-sm text-muted-foreground">{r.reminder_time.slice(0, 5)}</span>
                </div>
                {r.description && <p className="text-sm text-muted-foreground mt-1">{r.description}</p>}
                <div className="flex gap-1 mt-2">
                  {dayLabels.map((label, i) => (
                    <span key={i} className={`text-xs px-1.5 py-0.5 rounded ${r.days_of_week.includes(i + 1) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      {label}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={r.is_active} onCheckedChange={() => toggleReminder(r.id, r.is_active)} />
                <Button variant="ghost" size="icon" onClick={() => deleteReminder(r.id)}>
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

export default Reminders;

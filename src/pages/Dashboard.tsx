import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Search, Bell, HelpCircle, Zap, Droplets, AirVent, Fan, Flame, Droplet, Tv, Lightbulb, Refrigerator, WashingMachine } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import ProfileMenu from "@/components/ProfileMenu";

const DEVICE_CATEGORIES = [
  { value: "ac", label: "AC", icon: AirVent },
  { value: "fan", label: "Fan", icon: Fan },
  { value: "geyser", label: "Geyser", icon: Flame },
  { value: "tap", label: "Tap", icon: Droplet },
  { value: "tv", label: "TV", icon: Tv },
  { value: "light", label: "Light", icon: Lightbulb },
  { value: "fridge", label: "Fridge", icon: Refrigerator },
  { value: "washing", label: "Washing Machine", icon: WashingMachine },
  { value: "other", label: "Other", icon: Zap },
];

const getCategoryIcon = (category: string) => {
  const cat = DEVICE_CATEGORIES.find(c => c.value === category);
  return cat?.icon || Zap;
};

type Room = { id: string; name: string; icon: string };
type Device = { id: string; name: string; power_kwh: number; is_on: boolean; room_id: string; type: string; category: string };
type Target = { id: string; type: string; target_amount: number; month: number; year: number };

const Dashboard = () => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [targets, setTargets] = useState<Target[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [newRoomName, setNewRoomName] = useState("");
  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [deviceDialogOpen, setDeviceDialogOpen] = useState(false);
  const [targetDialogOpen, setTargetDialogOpen] = useState(false);
  const [newDevice, setNewDevice] = useState({ name: "", power_kwh: 0, type: "electricity", category: "other" });
  const [newTarget, setNewTarget] = useState({ type: "electricity", target_amount: 220 });
  const [electricityData, setElectricityData] = useState<any[]>([]);
  const [waterData, setWaterData] = useState<any[]>([]);
  const [totalElectricity, setTotalElectricity] = useState(0);
  const [totalWater, setTotalWater] = useState(0);
  const [dailyAvgElec, setDailyAvgElec] = useState(0);
  const [dailyAvgWater, setDailyAvgWater] = useState(0);

  useEffect(() => {
    if (user) {
      fetchRooms();
      fetchTargets();
      fetchConsumptionData();
    }
  }, [user]);

  useEffect(() => {
    if (selectedRoom) fetchDevices(selectedRoom);
  }, [selectedRoom]);

  const fetchRooms = async () => {
    const { data } = await supabase.from("rooms").select("*").order("created_at");
    if (data) {
      setRooms(data);
      if (data.length > 0 && !selectedRoom) setSelectedRoom(data[0].id);
    }
  };

  const fetchDevices = async (roomId: string) => {
    const { data } = await supabase.from("devices").select("*").eq("room_id", roomId).order("created_at");
    if (data) setDevices(data);
  };

  const fetchTargets = async () => {
    const now = new Date();
    const { data } = await supabase.from("monthly_targets").select("*")
      .eq("month", now.getMonth() + 1).eq("year", now.getFullYear());
    if (data) setTargets(data);
  };

  const fetchConsumptionData = async () => {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const { data } = await supabase.from("consumption_logs").select("*")
      .gte("logged_at", startOfDay).order("logged_at");

    if (data) {
      // Separate electricity and water
      const elecHourly: Record<string, number> = {};
      const waterHourly: Record<string, number> = {};
      for (let h = 9; h <= 18; h++) {
        elecHourly[`${h}:00`] = 0;
        waterHourly[`${h}:00`] = 0;
      }
      data.forEach((log) => {
        const hour = new Date(log.logged_at).getHours();
        const key = `${hour}:00`;
        if (log.type === "water") {
          if (waterHourly[key] !== undefined) waterHourly[key] += Number(log.amount);
        } else {
          if (elecHourly[key] !== undefined) elecHourly[key] += Number(log.amount);
        }
      });
      setElectricityData(Object.entries(elecHourly).map(([time, value]) => ({ time, value })));
      setWaterData(Object.entries(waterHourly).map(([time, value]) => ({ time, value })));

      const elecTotal = data.filter(l => l.type !== "water").reduce((s, l) => s + Number(l.amount), 0);
      const waterTotal = data.filter(l => l.type === "water").reduce((s, l) => s + Number(l.amount), 0);
      setTotalElectricity(elecTotal);
      setTotalWater(waterTotal);
    }

    // Daily averages (last 30 days)
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: monthData } = await supabase.from("consumption_logs").select("amount, type")
      .gte("logged_at", thirtyDaysAgo);
    if (monthData && monthData.length > 0) {
      setDailyAvgElec(monthData.filter(l => l.type !== "water").reduce((s, l) => s + Number(l.amount), 0) / 30);
      setDailyAvgWater(monthData.filter(l => l.type === "water").reduce((s, l) => s + Number(l.amount), 0) / 30);
    }
  };

  const addRoom = async () => {
    if (!newRoomName.trim() || !user) return;
    const { error } = await supabase.from("rooms").insert({ name: newRoomName.trim(), user_id: user.id });
    if (error) { toast.error(error.message); return; }
    toast.success("Room added!");
    setNewRoomName("");
    setRoomDialogOpen(false);
    fetchRooms();
  };

  const addDevice = async () => {
    if (!newDevice.name.trim() || !selectedRoom || !user) return;
    const { error } = await supabase.from("devices").insert({
      name: newDevice.name.trim(),
      power_kwh: newDevice.power_kwh,
      type: newDevice.type,
      category: newDevice.category,
      room_id: selectedRoom,
      user_id: user.id,
    });
    if (error) { toast.error(error.message); return; }
    await supabase.from("consumption_logs").insert({
      user_id: user.id,
      room_id: selectedRoom,
      type: newDevice.type,
      amount: newDevice.power_kwh,
      unit: newDevice.type === "water" ? "L" : "kWh",
    });
    toast.success("Device added!");
    setNewDevice({ name: "", power_kwh: 0, type: "electricity", category: "other" });
    setDeviceDialogOpen(false);
    fetchDevices(selectedRoom);
    fetchConsumptionData();
    checkConsumptionAlerts();
  };

  const toggleDevice = async (device: Device) => {
    await supabase.from("devices").update({ is_on: !device.is_on }).eq("id", device.id);
    if (!device.is_on && user) {
      await supabase.from("consumption_logs").insert({
        user_id: user.id,
        device_id: device.id,
        room_id: device.room_id,
        type: device.type,
        amount: device.power_kwh,
        unit: device.type === "water" ? "L" : "kWh",
      });
      fetchConsumptionData();
      checkConsumptionAlerts();
    }
    if (selectedRoom) fetchDevices(selectedRoom);
  };

  const setMonthlyTarget = async () => {
    if (!user) return;
    const now = new Date();
    const { error } = await supabase.from("monthly_targets").upsert({
      user_id: user.id,
      type: newTarget.type,
      target_amount: newTarget.target_amount,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    }, { onConflict: "user_id,type,month,year" });
    if (error) { toast.error(error.message); return; }
    toast.success("Target set!");
    setTargetDialogOpen(false);
    fetchTargets();
  };

  const checkConsumptionAlerts = async () => {
    if (!user) return;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const { data: logs } = await supabase.from("consumption_logs").select("amount, type")
      .gte("logged_at", startOfMonth);
    if (!logs) return;
    for (const target of targets) {
      const consumed = logs.filter(l => l.type === target.type).reduce((s, l) => s + Number(l.amount), 0);
      const pct = (consumed / target.target_amount) * 100;
      if (pct >= 80 && pct < 100) {
        await supabase.from("notifications").insert({
          user_id: user.id, title: "⚠️ Consumption Alert",
          message: `You've used ${pct.toFixed(0)}% of your monthly ${target.type} target!`, type: "warning",
        });
        toast.warning(`You've used ${pct.toFixed(0)}% of your monthly ${target.type} target!`);
      } else if (pct >= 100) {
        await supabase.from("notifications").insert({
          user_id: user.id, title: "🚨 Target Exceeded",
          message: `You've exceeded your monthly ${target.type} target!`, type: "alert",
        });
        toast.error(`You've exceeded your monthly ${target.type} target!`);
      }
    }
  };

  const getSuggestions = () => {
    const suggestions: string[] = [];
    const onDevices = devices.filter(d => d.is_on);
    if (onDevices.length > 3) suggestions.push("Consider turning off unused devices to save energy.");
    const highPower = devices.filter(d => d.power_kwh > 5);
    if (highPower.length > 0) suggestions.push(`${highPower.map(d => d.name).join(", ")} consume a lot. Use them during off-peak hours.`);
    if (totalElectricity > dailyAvgElec * 1.2) suggestions.push("Today's electricity usage is above your daily average.");
    if (totalWater > dailyAvgWater * 1.2) suggestions.push("Today's water usage is above your daily average.");
    if (suggestions.length === 0) suggestions.push("Great job! Your consumption is within healthy limits. 🌿");
    return suggestions;
  };

  const elecTarget = targets.find(t => t.type === "electricity");
  const waterTarget = targets.find(t => t.type === "water");
  const elecPct = elecTarget ? Math.min((totalElectricity / elecTarget.target_amount) * 100, 100) : 0;
  const waterPct = waterTarget ? Math.min((totalWater / waterTarget.target_amount) * 100, 100) : 0;

  const filteredDevices = devices.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const TargetRing = ({ pct, consumed, target, label, color }: { pct: number; consumed: number; target: number | undefined; label: string; color: string }) => (
    <div className="flex flex-col items-center">
      <div className="relative w-28 h-28 mb-2">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={color} strokeWidth="3" strokeDasharray={`${pct}, 100`} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold font-display">{consumed.toFixed(0)}/{target ?? "—"}</span>
        </div>
      </div>
      <p className="text-sm font-semibold">{label}</p>
      <p className="text-xs text-muted-foreground">{pct.toFixed(0)}%</p>
    </div>
  );

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold font-display text-primary ml-12 md:ml-0">Dashboard</h1>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search devices..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 w-full sm:w-64" />
          </div>
          <Button variant="ghost" size="icon"><HelpCircle className="h-5 w-5" /></Button>
          <Button variant="ghost" size="icon"><Bell className="h-5 w-5" /></Button>
          <ProfileMenu />
        </div>
      </div>

      {/* Rooms */}
      <div className="flex flex-wrap items-center gap-2">
        {rooms.map((room) => (
          <Button key={room.id} variant={selectedRoom === room.id ? "default" : "outline"} size="sm" onClick={() => setSelectedRoom(room.id)} className="rounded-full">{room.name}</Button>
        ))}
        <Dialog open={roomDialogOpen} onOpenChange={setRoomDialogOpen}>
          <DialogTrigger asChild><Button variant="ghost" size="sm" className="rounded-full">+ Add</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Room</DialogTitle></DialogHeader>
            <Input placeholder="Room name" value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} />
            <Button onClick={addRoom}>Add Room</Button>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-1"><Zap className="h-4 w-4 text-chart-electricity" /><p className="text-sm text-muted-foreground">Electricity Today</p></div>
          <p className="text-2xl font-bold font-display">{totalElectricity.toFixed(1)} kWh</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-1"><Droplets className="h-4 w-4 text-chart-water" /><p className="text-sm text-muted-foreground">Water Today</p></div>
          <p className="text-2xl font-bold font-display">{totalWater.toFixed(1)} L</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-1"><Zap className="h-4 w-4 text-chart-electricity" /><p className="text-sm text-muted-foreground">Elec. Daily Avg</p></div>
          <p className="text-2xl font-bold font-display">{dailyAvgElec.toFixed(1)} kWh</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-1"><Droplets className="h-4 w-4 text-chart-water" /><p className="text-sm text-muted-foreground">Water Daily Avg</p></div>
          <p className="text-2xl font-bold font-display">{dailyAvgWater.toFixed(1)} L</p>
        </div>
      </div>

      {/* Charts — Electricity & Water side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Electricity Chart */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-chart-electricity" />
              <span className="font-semibold text-sm">Electricity</span>
              <span className="text-xs text-muted-foreground ml-2">{totalElectricity.toFixed(1)} kWh today</span>
            </div>
            <span className="text-xs bg-secondary text-secondary-foreground px-3 py-1 rounded-full">Today</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={electricityData}>
              <XAxis dataKey="time" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {electricityData.map((entry, i) => (
                  <Cell key={i} fill={entry.value > 0 ? "hsl(205, 90%, 60%)" : "hsl(var(--muted))"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Water Chart */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Droplets className="h-4 w-4 text-chart-water" />
              <span className="font-semibold text-sm">Water</span>
              <span className="text-xs text-muted-foreground ml-2">{totalWater.toFixed(1)} L today</span>
            </div>
            <span className="text-xs bg-secondary text-secondary-foreground px-3 py-1 rounded-full">Today</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={waterData}>
              <XAxis dataKey="time" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {waterData.map((entry, i) => (
                  <Cell key={i} fill={entry.value > 0 ? "hsl(185, 70%, 50%)" : "hsl(var(--muted))"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Suggestions */}
      <div className="stat-card">
        <p className="text-sm font-medium text-muted-foreground mb-2">💡 Suggestions</p>
        <ul className="space-y-2">
          {getSuggestions().map((s, i) => (
            <li key={i} className="text-sm flex items-start gap-2"><span className="text-accent mt-0.5">•</span> {s}</li>
          ))}
        </ul>
      </div>

      {/* Devices + Monthly Targets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">DEVICES</h2>
            <Dialog open={deviceDialogOpen} onOpenChange={setDeviceDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1"><Plus className="h-4 w-4" /> ADD</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Device</DialogTitle></DialogHeader>
                <Input placeholder="Device name" value={newDevice.name} onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })} />
                <Select value={newDevice.category} onValueChange={(v) => setNewDevice({ ...newDevice, category: v })}>
                  <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent>
                    {DEVICE_CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        <span className="flex items-center gap-2"><cat.icon className="h-4 w-4" />{cat.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input type="number" placeholder="Power (kWh/L)" value={newDevice.power_kwh || ""} onChange={(e) => setNewDevice({ ...newDevice, power_kwh: Number(e.target.value) })} />
                <Select value={newDevice.type} onValueChange={(v) => setNewDevice({ ...newDevice, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="electricity">Electricity</SelectItem>
                    <SelectItem value="water">Water</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={addDevice}>Add Device</Button>
              </DialogContent>
            </Dialog>
          </div>
          <div className="divide-y divide-border">
            {filteredDevices.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                {selectedRoom ? "No devices yet. Add one!" : "Select or add a room first."}
              </p>
            ) : (
              filteredDevices.map((device) => (
                <div key={device.id} className="device-row">
                  <div className="flex items-center gap-3">
                    {(() => { const Icon = getCategoryIcon(device.category); return <Icon className={`h-4 w-4 ${device.type === "water" ? "text-chart-water" : "text-chart-electricity"}`} />; })()}
                    <div>
                      <span className="font-medium">{device.name}</span>
                      <span className="text-xs text-muted-foreground ml-2 capitalize">{device.category}</span>
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">{device.power_kwh}{device.type === "water" ? "L" : "kWh"}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs ${device.is_on ? "text-success" : "text-muted-foreground"}`}>
                      {device.is_on ? "On" : "Off"}
                    </span>
                    <Switch checked={device.is_on} onCheckedChange={() => toggleDevice(device)} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Monthly Targets — both electricity and water */}
        <div className="rounded-xl border border-border bg-card p-6 flex flex-col items-center justify-center text-center">
          <h3 className="section-title mb-4">Monthly Targets</h3>
          <div className="flex gap-6 flex-wrap justify-center mb-4">
            <TargetRing pct={elecPct} consumed={totalElectricity} target={elecTarget?.target_amount} label="Electricity" color="hsl(205, 90%, 60%)" />
            <TargetRing pct={waterPct} consumed={totalWater} target={waterTarget?.target_amount} label="Water" color="hsl(185, 70%, 50%)" />
          </div>
          <Dialog open={targetDialogOpen} onOpenChange={setTargetDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">Set Target</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Set Monthly Target</DialogTitle></DialogHeader>
              <Select value={newTarget.type} onValueChange={(v) => setNewTarget({ ...newTarget, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="electricity">Electricity (kWh)</SelectItem>
                  <SelectItem value="water">Water (L)</SelectItem>
                </SelectContent>
              </Select>
              <Input type="number" placeholder="Target amount" value={newTarget.target_amount || ""} onChange={(e) => setNewTarget({ ...newTarget, target_amount: Number(e.target.value) })} />
              <Button onClick={setMonthlyTarget}>Save Target</Button>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

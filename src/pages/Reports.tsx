import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from "recharts";
import { Zap, Droplets, TrendingDown, TrendingUp, BarChart3 } from "lucide-react";

const COLORS = ["hsl(205, 90%, 60%)", "hsl(185, 70%, 50%)", "hsl(152, 60%, 45%)", "hsl(38, 92%, 50%)"];

const Reports = () => {
  const { user } = useAuth();
  const [period, setPeriod] = useState("30d");
  const [type, setType] = useState("all");
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [roomData, setRoomData] = useState<any[]>([]);
  const [totalElec, setTotalElec] = useState(0);
  const [totalWater, setTotalWater] = useState(0);
  const [prevElec, setPrevElec] = useState(0);
  const [prevWater, setPrevWater] = useState(0);
  const [comparisonData, setComparisonData] = useState<any[]>([]);

  useEffect(() => {
    if (user) fetchReportData();
  }, [user, period, type]);

  const fetchReportData = async () => {
    const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const prevStart = new Date(Date.now() - days * 2 * 24 * 60 * 60 * 1000).toISOString();

    let query = supabase.from("consumption_logs").select("*").gte("logged_at", startDate).order("logged_at");
    if (type !== "all") query = query.eq("type", type);
    const { data: logs } = await query;

    // Previous period
    let prevQuery = supabase.from("consumption_logs").select("*")
      .gte("logged_at", prevStart).lt("logged_at", startDate);
    if (type !== "all") prevQuery = prevQuery.eq("type", type);
    const { data: prevLogs } = await prevQuery;

    if (logs) {
      // Daily aggregation
      const daily: Record<string, { electricity: number; water: number }> = {};
      logs.forEach((l) => {
        const day = new Date(l.logged_at).toLocaleDateString("en", { month: "short", day: "numeric" });
        if (!daily[day]) daily[day] = { electricity: 0, water: 0 };
        if (l.type === "electricity") daily[day].electricity += Number(l.amount);
        else daily[day].water += Number(l.amount);
      });
      setDailyData(Object.entries(daily).map(([date, v]) => ({ date, ...v })));

      // Room aggregation
      const rooms: Record<string, number> = {};
      logs.forEach((l) => {
        const key = l.room_id || "Unknown";
        rooms[key] = (rooms[key] || 0) + Number(l.amount);
      });
      const roomIds = Object.keys(rooms).filter(k => k !== "Unknown");
      if (roomIds.length > 0) {
        const { data: roomsData } = await supabase.from("rooms").select("id, name").in("id", roomIds);
        const nameMap: Record<string, string> = {};
        roomsData?.forEach(r => { nameMap[r.id] = r.name; });
        setRoomData(Object.entries(rooms).map(([id, value]) => ({ name: nameMap[id] || "Other", value })));
      }

      setTotalElec(logs.filter(l => l.type === "electricity").reduce((s, l) => s + Number(l.amount), 0));
      setTotalWater(logs.filter(l => l.type === "water").reduce((s, l) => s + Number(l.amount), 0));
    }

    if (prevLogs) {
      const pe = prevLogs.filter(l => l.type === "electricity").reduce((s, l) => s + Number(l.amount), 0);
      const pw = prevLogs.filter(l => l.type === "water").reduce((s, l) => s + Number(l.amount), 0);
      setPrevElec(pe);
      setPrevWater(pw);

      // Build comparison data by week
      const buildWeekly = (data: any[], label: string) => {
        const weeks: Record<string, { electricity: number; water: number }> = {};
        data.forEach((l) => {
          const d = new Date(l.logged_at);
          const weekNum = Math.ceil(((d.getTime() - new Date(data[0]?.logged_at || d).getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1);
          const key = `Week ${weekNum}`;
          if (!weeks[key]) weeks[key] = { electricity: 0, water: 0 };
          if (l.type === "electricity") weeks[key].electricity += Number(l.amount);
          else weeks[key].water += Number(l.amount);
        });
        return Object.entries(weeks).map(([week, v]) => ({ week, [`${label}_elec`]: v.electricity, [`${label}_water`]: v.water }));
      };

      const currentWeekly = buildWeekly(logs || [], "current");
      const prevWeekly = buildWeekly(prevLogs, "prev");

      // Merge
      const maxLen = Math.max(currentWeekly.length, prevWeekly.length);
      const merged = [];
      for (let i = 0; i < maxLen; i++) {
        merged.push({
          week: `Week ${i + 1}`,
          current_elec: currentWeekly[i]?.current_elec || 0,
          current_water: currentWeekly[i]?.current_water || 0,
          prev_elec: prevWeekly[i]?.prev_elec || 0,
          prev_water: prevWeekly[i]?.prev_water || 0,
        });
      }
      setComparisonData(merged);
    }
  };

  const elecChange = prevElec > 0 ? ((totalElec - prevElec) / prevElec) * 100 : 0;
  const waterChange = prevWater > 0 ? ((totalWater - prevWater) / prevWater) * 100 : 0;

  return (
    <div className="animate-fade-in space-y-6 ml-12 md:ml-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold font-display text-primary">Reports & Analytics</h1>
        <div className="flex gap-2">
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="electricity">Electricity</SelectItem>
              <SelectItem value="water">Water</SelectItem>
            </SelectContent>
          </Select>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-chart-electricity/20 flex items-center justify-center">
            <Zap className="h-6 w-6 text-chart-electricity" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Electricity</p>
            <p className="text-xl font-bold font-display">{totalElec.toFixed(1)} kWh</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-chart-water/20 flex items-center justify-center">
            <Droplets className="h-6 w-6 text-chart-water" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Water</p>
            <p className="text-xl font-bold font-display">{totalWater.toFixed(1)} L</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-4">
          <div className={`h-12 w-12 rounded-full flex items-center justify-center ${elecChange <= 0 ? "bg-success/20" : "bg-destructive/20"}`}>
            {elecChange <= 0 ? <TrendingDown className="h-6 w-6 text-success" /> : <TrendingUp className="h-6 w-6 text-destructive" />}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Elec. vs Prev</p>
            <p className="text-xl font-bold font-display">{elecChange > 0 ? "+" : ""}{elecChange.toFixed(1)}%</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-4">
          <div className={`h-12 w-12 rounded-full flex items-center justify-center ${waterChange <= 0 ? "bg-success/20" : "bg-destructive/20"}`}>
            {waterChange <= 0 ? <TrendingDown className="h-6 w-6 text-success" /> : <TrendingUp className="h-6 w-6 text-destructive" />}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Water vs Prev</p>
            <p className="text-xl font-bold font-display">{waterChange > 0 ? "+" : ""}{waterChange.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="section-title mb-4">Daily Consumption</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyData}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="electricity" fill="hsl(205, 90%, 60%)" name="Electricity (kWh)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="water" fill="hsl(185, 70%, 50%)" name="Water (L)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="section-title mb-4">Consumption Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyData}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="electricity" stroke="hsl(205, 90%, 60%)" strokeWidth={2} dot={false} name="Electricity" />
              <Line type="monotone" dataKey="water" stroke="hsl(185, 70%, 50%)" strokeWidth={2} dot={false} name="Water" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Comparison Chart — This Period vs Last Period */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h3 className="section-title">This Period vs Last Period</h3>
        </div>
        {comparisonData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comparisonData}>
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="current_elec" fill="hsl(205, 90%, 60%)" name="Current Electricity" radius={[4, 4, 0, 0]} />
              <Bar dataKey="prev_elec" fill="hsl(205, 90%, 80%)" name="Previous Electricity" radius={[4, 4, 0, 0]} />
              <Bar dataKey="current_water" fill="hsl(185, 70%, 50%)" name="Current Water" radius={[4, 4, 0, 0]} />
              <Bar dataKey="prev_water" fill="hsl(185, 70%, 75%)" name="Previous Water" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-muted-foreground py-8">No comparison data available yet. Add consumption logs to see trends.</p>
        )}
      </div>

      {/* Room breakdown */}
      {roomData.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="section-title mb-4">Consumption by Room</h3>
          <div className="flex flex-col md:flex-row items-center gap-8">
            <ResponsiveContainer width="100%" height={250} className="max-w-xs">
              <PieChart>
                <Pie data={roomData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                  {roomData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {roomData.map((r, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-sm">{r.name}: <strong>{r.value.toFixed(1)}</strong></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;

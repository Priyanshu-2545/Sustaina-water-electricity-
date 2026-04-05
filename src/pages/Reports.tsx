import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from "recharts";
import { Zap, Droplets, TrendingDown, TrendingUp, BarChart3, Download } from "lucide-react";
import { jsPDF } from "jspdf";

const COLORS = ["hsl(205, 90%, 60%)", "hsl(185, 70%, 50%)", "hsl(152, 60%, 45%)", "hsl(38, 92%, 50%)"];

const ELEC_RATE = 8; // ₹ per kWh
const WATER_RATE = 0.05; // ₹ per Litre
const GST_PERCENT = 18;

const Reports = () => {
  const { user } = useAuth();
  const [period, setPeriod] = useState("30d");
  const [type, setType] = useState("all");
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [roomData, setRoomData] = useState<any[]>([]);
  const [allLogs, setAllLogs] = useState<any[]>([]);
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

    let prevQuery = supabase.from("consumption_logs").select("*")
      .gte("logged_at", prevStart).lt("logged_at", startDate);
    if (type !== "all") prevQuery = prevQuery.eq("type", type);
    const { data: prevLogs } = await prevQuery;

    if (logs) {
      setAllLogs(logs);

      const daily: Record<string, { electricity: number; water: number }> = {};
      logs.forEach((l) => {
        const day = new Date(l.logged_at).toLocaleDateString("en", { month: "short", day: "numeric" });
        if (!daily[day]) daily[day] = { electricity: 0, water: 0 };
        if (l.type === "electricity") daily[day].electricity += Number(l.amount);
        else daily[day].water += Number(l.amount);
      });
      setDailyData(Object.entries(daily).map(([date, v]) => ({ date, ...v })));

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

  const downloadCSV = () => {
    if (allLogs.length === 0) return;
    const headers = "Date,Type,Amount,Unit,Rate,Cost\n";
    const rows = allLogs.map(l => {
      const rate = l.type === "electricity" ? ELEC_RATE : WATER_RATE;
      const cost = Number(l.amount) * rate;
      return `${new Date(l.logged_at).toLocaleDateString()},${l.type},${l.amount},${l.unit},${rate},${cost.toFixed(2)}`;
    }).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sustaina-report-${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPDF = () => {
    if (allLogs.length === 0) return;

    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const invoiceId = `INV-${Date.now().toString(36).toUpperCase()}`;
    const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    const userName = user?.user_metadata?.username || user?.email || "Customer";

    // ===== HEADER BAR =====
    pdf.setFillColor(16, 85, 154); // dark blue
    pdf.rect(0, 0, pageWidth, 38, "F");

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(22);
    pdf.setFont("helvetica", "bold");
    pdf.text("SUSTAINA", 14, 18);

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text("Energy & Water Management", 14, 26);
    pdf.text("Smart Consumption Tracking Platform", 14, 32);

    // Right side header info
    pdf.setFontSize(10);
    pdf.text(`Invoice: ${invoiceId}`, pageWidth - 14, 18, { align: "right" });
    pdf.text(`Date: ${today}`, pageWidth - 14, 26, { align: "right" });
    pdf.text(`Period: ${period === "7d" ? "Last 7 Days" : period === "30d" ? "Last 30 Days" : "Last 90 Days"}`, pageWidth - 14, 32, { align: "right" });

    // ===== BILL TO =====
    pdf.setTextColor(0, 0, 0);
    let y = 50;

    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.text("Bill To:", 14, y);
    pdf.setFont("helvetica", "normal");
    pdf.text(userName, 14, y + 7);
    pdf.text(user?.email || "", 14, y + 14);

    // ===== TABLE HEADER =====
    y = 82;

    pdf.setFillColor(230, 240, 250);
    pdf.rect(14, y - 5, pageWidth - 28, 10, "F");

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(16, 85, 154);
    pdf.text("Date", 16, y + 1);
    pdf.text("Type", 52, y + 1);
    pdf.text("Units", 90, y + 1);
    pdf.text("Unit", 112, y + 1);
    pdf.text("Rate (Rs)", 135, y + 1);
    pdf.text("Cost (Rs)", 168, y + 1);

    y += 12;
    pdf.setTextColor(0, 0, 0);
    pdf.setFont("helvetica", "normal");

    let subtotal = 0;

    // ===== TABLE ROWS =====
    allLogs.forEach((log) => {
      if (y > 260) {
        pdf.addPage();
        y = 20;
      }

      const rate = log.type === "electricity" ? ELEC_RATE : WATER_RATE;
      const cost = Number(log.amount) * rate;
      subtotal += cost;

      const dateStr = new Date(log.logged_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });

      pdf.setFontSize(9);
      pdf.text(dateStr, 16, y);
      pdf.text(log.type.charAt(0).toUpperCase() + log.type.slice(1), 52, y);
      pdf.text(String(log.amount), 90, y);
      pdf.text(log.unit || "-", 112, y);
      pdf.text(`Rs ${rate.toFixed(2)}`, 135, y);
      pdf.text(`Rs ${cost.toFixed(2)}`, 168, y);

      y += 7;
    });

    // ===== DIVIDER LINE =====
    y += 4;
    if (y > 250) { pdf.addPage(); y = 20; }
    pdf.setDrawColor(16, 85, 154);
    pdf.setLineWidth(0.5);
    pdf.line(14, y, pageWidth - 14, y);

    // ===== SUMMARY SECTION =====
    y += 10;

    const gst = subtotal * (GST_PERCENT / 100);
    const grandTotal = subtotal + gst;

    pdf.setFontSize(11);
    pdf.setFont("helvetica", "normal");
    pdf.text("Subtotal:", 130, y);
    pdf.text(`Rs ${subtotal.toFixed(2)}`, 168, y);

    y += 8;
    pdf.text(`GST (${GST_PERCENT}%):`, 130, y);
    pdf.text(`Rs ${gst.toFixed(2)}`, 168, y);

    y += 4;
    pdf.setDrawColor(0);
    pdf.line(128, y, pageWidth - 14, y);

    y += 8;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    pdf.setTextColor(16, 85, 154);
    pdf.text("Grand Total:", 128, y);
    pdf.text(`Rs ${grandTotal.toFixed(2)}`, 168, y);

    // ===== CONSUMPTION SUMMARY BOX =====
    y += 16;
    if (y > 245) { pdf.addPage(); y = 20; }

    pdf.setFillColor(245, 248, 252);
    pdf.roundedRect(14, y - 4, pageWidth - 28, 30, 3, 3, "F");

    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.text("Consumption Summary", 18, y + 4);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.text(`Total Electricity: ${totalElec.toFixed(2)} kWh (Rs ${(totalElec * ELEC_RATE).toFixed(2)})`, 18, y + 14);
    pdf.text(`Total Water: ${totalWater.toFixed(2)} L (Rs ${(totalWater * WATER_RATE).toFixed(2)})`, 18, y + 22);

    // ===== FOOTER =====
    const footerY = pdf.internal.pageSize.getHeight() - 14;
    pdf.setFontSize(8);
    pdf.setTextColor(130, 130, 130);
    pdf.text("This is a computer-generated bill by Sustaina. No signature required.", 14, footerY);
    pdf.text(`Generated on ${new Date().toLocaleString("en-IN")}`, pageWidth - 14, footerY, { align: "right" });

    pdf.save(`sustaina-bill-${period}.pdf`);
  };

  const elecChange = prevElec > 0 ? ((totalElec - prevElec) / prevElec) * 100 : 0;
  const waterChange = prevWater > 0 ? ((totalWater - prevWater) / prevWater) * 100 : 0;

  return (
    <div id="report-content" className="animate-fade-in space-y-6 ml-12 md:ml-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold font-display text-primary">Reports & Analytics</h1>
        <div className="flex gap-2 flex-wrap">
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
          <Select onValueChange={(value) => {
            if (value === "csv") downloadCSV();
            if (value === "pdf") downloadPDF();
          }}>
            <SelectTrigger className="w-32">
              <Download className="h-4 w-4 mr-1" />
              <span>Export</span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">Download CSV</SelectItem>
              <SelectItem value="pdf">Download PDF</SelectItem>
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

      {/* Comparison Chart */}
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

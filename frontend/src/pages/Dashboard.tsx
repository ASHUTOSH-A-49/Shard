import { useAuth } from "@/hooks/useAuth";
import { motion } from 'framer-motion';
import { useState, useEffect, useMemo } from "react";
import api from "../lib/api.ts";
import {
  FileText,
  TrendingUp,
  AlertCircle,
  Upload,
  CheckSquare,
  BarChart3,
  Calendar,
  Cpu,
  Flame,
  Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// ======================================================
//  DASHBOARD PAGE
// ======================================================
export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<any[]>([]);

  // 👇 FETCH DATA
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.email) return;

      try {
        const token = JSON.stringify({ userId: user.id, email: user.email });
        const config = { headers: { Authorization: `Bearer ${token}` } };

        // Fetch user's invoices
       const res = await api.get("/api/invoices?limit=500", config);

        if (res.data.success) {
          setInvoices(res.data.invoices);
        }
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // 🧮 CALCULATE STATS
  const stats = useMemo(() => {
    const total = invoices.length;
    
    // Status counts
    const autoApproved = invoices.filter(i => i.status === 'auto_approved').length;
    const manualApproved = invoices.filter(i => i.status === 'approved').length;
    const rejected = invoices.filter(i => i.status === 'rejected').length;
    const review = invoices.filter(i => i.status === 'pending_review' || i.status === 'needs_review' || i.status === 'review_needed').length;
    
    // 💡 Human Approval Rate Logic:
    // Only count invoices that went through manual review (Approved or Rejected by human)
    // Exclude auto-approved and pending ones from this specific metric.
    const humanReviewedTotal = manualApproved + rejected;
    const approvalRate = humanReviewedTotal > 0 
        ? ((manualApproved / humanReviewedTotal) * 100).toFixed(0) 
        : "0";

    // Average Confidence
    const totalConf = invoices.reduce((acc, inv) => {
        // Handle nested or flat structure
        const score = inv.confidence_scores?.overall_confidence || inv.confidence || 0;
        return acc + score;
    }, 0);
    const avgConf = total > 0 ? (totalConf / total).toFixed(1) : "0.0";

    return {
      total,
      approvedCount: manualApproved + autoApproved, // For display count
      review,
      avgConf,
      approvalRate, // Human review rate
    };
  }, [invoices]);

  // 📊 CHART DATA: Volume (Last 7 Days)
  const volumeData = useMemo(() => {
    // 1. Generate the last 7 days based on LOCAL time
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return { 
        // We use toDateString() to ignore time and get "Day Mon DD YYYY"
        id: d.toDateString(), 
        name: d.toLocaleDateString('en-US', { weekday: 'short' }),
        invoices: 0 
      };
    });

    // 2. Count invoices
    invoices.forEach(inv => {
      // Handle missing dates gracefully and match strictly by Date String
      const rawDate = inv.created_at || inv.updated_at || new Date().toISOString();
      const invDateStr = new Date(rawDate).toDateString();
      
      const dayObj = days.find(d => d.id === invDateStr);
      if (dayObj) dayObj.invoices++;
    });

    return days;
  }, [invoices]);

  // 🏆 TOP VENDORS
  const topVendors = useMemo(() => {
    const vendorMap: Record<string, { count: number, total: number }> = {};
    
    invoices.forEach(inv => {
      // Vendor Name Logic
      const name = inv.canonical_data?.vendor_name?.value || 
                   inv.extracted_data?.invoice_metadata?.company_name || 
                   "Unknown Vendor";
                   
      const rawAmount = inv.canonical_data?.total_amount?.value || 
                        inv.extracted_data?.pricing_summary?.total_amount || 0;
      
      // FIX: Robust Parsing (removes '$', ',', etc before parsing)
      let amountVal = 0;
      if (typeof rawAmount === 'number') {
        amountVal = rawAmount;
      } else if (typeof rawAmount === 'string') {
        amountVal = parseFloat(rawAmount.replace(/[^0-9.-]+/g, "")) || 0;
      }
      
      if (!vendorMap[name]) vendorMap[name] = { count: 0, total: 0 };
      vendorMap[name].count++;
      vendorMap[name].total += amountVal;
    });

    return Object.entries(vendorMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5); // Top 5
  }, [invoices]);

  // 🥧 STATUS CHART DATA
  const confidenceData = useMemo(() => {
      const auto = invoices.filter(i => i.status === 'auto_approved').length;
      const manual = invoices.filter(i => i.status === 'approved').length;
      const review = invoices.filter(i => i.status === 'pending_review' || i.status === 'needs_review' || i.status === 'review_needed').length;
      const rejected = invoices.filter(i => i.status === 'rejected').length;

      return [
        { name: 'Auto-Approved', value: auto, fill: 'hsl(var(--success))' },
        { name: 'Manually Approved', value: manual, fill: '#3b82f6' }, // Blue
        { name: 'Review', value: review, fill: 'hsl(var(--warning))' },
        { name: 'Rejected', value: rejected, fill: 'hsl(var(--destructive))' },
      ].filter(d => d.value > 0);
  }, [invoices]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-10">

      {/* HEADER */}
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}>
        <h1 className="text-2xl sm:text-3xl font-bold break-words">
          Welcome back, {user?.name || "User"}! 👋
        </h1>
        <Badge variant="success" className="mt-1 flex items-center gap-1 w-fit">
          <Flame className="w-4 h-4" /> System Operational
        </Badge>
      </motion.div>

      {/* KPI ROW */}
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { 
            title: 'Total Processed', 
            value: stats.total, 
            change:'All time', 
            trend:'up', 
            icon: FileText, 
            color:'--primary' 
          },
          { 
            title: 'Human Approval Rate', 
            value: `${stats.approvalRate}%`, 
            change:'Of reviewed items', 
            trend:'up', 
            icon: TrendingUp, 
            color:'--success' 
          },
          { 
            title: 'Pending Review', 
            value: stats.review, 
            change:'Action Needed', 
            trend: stats.review > 0 ? 'down' : 'up', 
            icon: AlertCircle, 
            color:'--warning' 
          },
        ].map((kpi, i)=>(
          <Card key={i} className="hover-lift">
            <CardContent className="p-6 flex justify-between items-start">
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">{kpi.title}</p>
                <h2 className="text-2xl sm:text-3xl font-bold truncate">{kpi.value}</h2>
                <span className={`text-sm flex items-center gap-1 mt-1 ${kpi.trend==='up'?'text-success':'text-warning'}`}>
                  {kpi.change}
                </span>
              </div>
              <div
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex justify-center items-center"
                style={{ background:`hsl(var(${kpi.color}) / .15)` }}
              >
                <kpi.icon className="w-5 h-5 sm:w-6 sm:h-6" style={{color:`hsl(var(${kpi.color}))`}}/>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* SECONDARY STATS (Smaller) */}
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-4">
         <Card className="hover-lift">
            <CardContent className="p-4 flex items-center gap-4">
               <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500"><Calendar size={20}/></div>
               <div>
                 <p className="text-xs text-muted-foreground">This Week</p>
                 <h3 className="font-bold text-lg">{volumeData.reduce((a,b)=>a+b.invoices,0)} Invoices</h3>
               </div>
            </CardContent>
         </Card>
         <Card className="hover-lift">
            <CardContent className="p-4 flex items-center gap-4">
               <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500"><Cpu size={20}/></div>
               <div>
                 <p className="text-xs text-muted-foreground">Avg Confidence</p>
                 <h3 className="font-bold text-lg">{stats.avgConf}%</h3>
               </div>
            </CardContent>
         </Card>
      </div>

      {/* ACTION BUTTONS */}
      <Card>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-6">
          <Link to="/upload"><Button className="w-full h-[55px] text-sm sm:text-md gap-2 py-3 rounded-xl shadow-md"><Upload/> Upload Invoice</Button></Link>
          <Link to="/activity"><Button variant="outline" className="w-full h-[55px] text-sm gap-2 py-3 rounded-xl"><CheckSquare/> Activity Feed</Button></Link>
          <Link to="/analytics"><Button variant="outline" className="w-full h-[55px] text-sm gap-2 py-3 rounded-xl"><BarChart3/> Full Analytics</Button></Link>
        </CardContent>
      </Card>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Volume Chart */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="flex gap-2"><TrendingUp/> 7-Day Volume</CardTitle></CardHeader>
          <CardContent className="h-[260px] sm:h-[350px] min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volumeData}>
                <defs>
                  <linearGradient id="vol" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="name"/><YAxis allowDecimals={false} /><Tooltip/>
                <Area type="monotone" dataKey="invoices" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#vol)"/>
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Pie Chart */}
        <Card>
          <CardHeader><CardTitle className="flex gap-2"><Cpu/> Status Distribution</CardTitle></CardHeader>
          <CardContent className="flex flex-col h-[260px] sm:h-[350px]">
            <div className="flex-1 min-w-0">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={confidenceData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={4}>
                    {confidenceData.map((c,i)=><Cell key={i} fill={c.fill}/>)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1 text-sm mt-3">
              {confidenceData.map((item,i)=>(
                <div key={i} className="flex justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{background:item.fill}}/>
                    {item.name}
                  </div>
                  <strong>{item.value}</strong>
                </div>
              ))}
              {confidenceData.length === 0 && <p className="text-muted-foreground text-center">No data yet</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* BOTTOM SECTION: RECENT & VENDORS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Activity */}
        <Card className="min-w-0 lg:col-span-2">
          <CardHeader className="flex justify-between">
            <CardTitle>Recent Activity</CardTitle>
            <Link to="/activity" className="text-primary text-sm hover:underline">View All</Link>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {invoices.slice(0, 5).map((inv, i)=>(
              <div key={i} className="flex justify-between gap-3 items-center border-b border-border/40 pb-3 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                     <FileText className="w-5 h-5 text-muted-foreground"/>
                   </div>
                   <div className="truncate">
                      <b className="truncate block">
                        {inv.canonical_data?.vendor_name?.value || inv.extracted_data?.invoice_metadata?.company_name || "Unknown Vendor"}
                      </b>
                      <p className="text-muted-foreground truncate text-xs">
                        {inv.fileName || "Invoice"} • {inv.created_at ? new Date(inv.created_at).toLocaleDateString() : 'N/A'}
                      </p>
                   </div>
                </div>
                <Badge variant={
                  (inv.status?.includes("approved")) ?"success":
                  inv.status?.includes("review")?"warning": "destructive"
                }>
                  {(inv.confidence_scores?.overall_confidence || 0).toFixed(0)}% Conf.
                </Badge>
              </div>
            ))}
            {invoices.length === 0 && <p className="text-muted-foreground text-center py-4">No recent invoices.</p>}
          </CardContent>
        </Card>

        {/* Top Vendors */}
        <Card className="h-full">
          <CardHeader><CardTitle>Top Vendors</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-4">
            {topVendors.map((vendor, i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                   <div className="text-muted-foreground font-mono text-xs w-4">{i+1}</div>
                   <div>
                     <div className="font-bold truncate max-w-[120px]">{vendor.name}</div>
                     <div className="text-xs text-muted-foreground">{vendor.count} invoices</div>
                   </div>
                </div>
                <div className="font-mono font-bold text-right">
                  ${vendor.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
              </div>
            ))}
            {topVendors.length === 0 && <p className="text-muted-foreground text-center pt-4">No vendor data.</p>}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
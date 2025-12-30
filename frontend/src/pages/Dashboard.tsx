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

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<any[]>([]);

  // 👇 FETCH DATA WITH STANDARDIZED TOKEN
  useEffect(() => {
    const fetchData = async () => {
      const identifier = user?.email || localStorage.getItem('username');
      if (!identifier) {
        setLoading(false);
        return;
      }

      try {
        const token = JSON.stringify({ 
          userId: user?.id || identifier, 
          email: identifier,
          username: localStorage.getItem('username') || identifier
        });

        const res = await api.get("/api/invoices?limit=500", {
          headers: { Authorization: `Bearer ${token}` }
        });

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
    
    const autoApproved = invoices.filter(i => (i.status || '').toLowerCase() === 'auto_approved').length;
    const manualApproved = invoices.filter(i => (i.status || '').toLowerCase() === 'approved').length;
    const rejected = invoices.filter(i => (i.status || '').toLowerCase() === 'rejected').length;
    
    const review = invoices.filter(i => {
      const s = (i.status || '').toLowerCase();
      const conf = i.confidence_scores?.overall_confidence || 0;
      return s.includes('review') || (conf < 85 && s !== 'approved' && s !== 'rejected');
    }).length;
    
    const humanReviewedTotal = manualApproved + rejected;
    const approvalRate = humanReviewedTotal > 0 
        ? ((manualApproved / humanReviewedTotal) * 100).toFixed(0) 
        : "0";

    const totalConf = invoices.reduce((acc, inv) => {
        const score = inv.confidence_scores?.overall_confidence || inv.confidence || 0;
        return acc + score;
    }, 0);
    const avgConf = total > 0 ? (totalConf / total).toFixed(1) : "0.0";

    return {
      total,
      approvedCount: manualApproved + autoApproved,
      review,
      avgConf,
      approvalRate,
    };
  }, [invoices]);

  // 📊 CHART DATA: Volume (Last 7 Days)
  const volumeData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return { 
        id: d.toDateString(), 
        name: d.toLocaleDateString('en-US', { weekday: 'short' }),
        invoices: 0 
      };
    });

    invoices.forEach(inv => {
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
      const name = inv.canonical_data?.vendor_name?.value || 
                   inv.extracted_data?.invoice_metadata?.company_name || 
                   "Unknown Vendor";
                   
      const rawAmount = inv.canonical_data?.total_amount?.value || 
                        inv.extracted_data?.pricing_summary?.total_amount || 0;
      
      let amountVal = 0;
      if (typeof rawAmount === 'number') amountVal = rawAmount;
      else if (typeof rawAmount === 'string') amountVal = parseFloat(rawAmount.replace(/[^0-9.-]+/g, "")) || 0;
      
      if (!vendorMap[name]) vendorMap[name] = { count: 0, total: 0 };
      vendorMap[name].count++;
      vendorMap[name].total += amountVal;
    });

    return Object.entries(vendorMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [invoices]);

  // 🥧 STATUS CHART DATA
  const confidenceData = useMemo(() => {
      const auto = invoices.filter(i => (i.status || '').toLowerCase() === 'auto_approved').length;
      const manual = invoices.filter(i => (i.status || '').toLowerCase() === 'approved').length;
      const rejected = invoices.filter(i => (i.status || '').toLowerCase() === 'rejected').length;
      const review = stats.review;

      return [
        { name: 'Auto-Approved', value: auto, fill: '#10b981' },
        { name: 'Manual', value: manual, fill: '#3b82f6' },
        { name: 'Review', value: review, fill: '#f59e0b' },
        { name: 'Rejected', value: rejected, fill: '#ef4444' },
      ].filter(d => d.value > 0);
  }, [invoices, stats.review]);

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
          Welcome back, {user?.name || localStorage.getItem('username') || "User"}! 👋
        </h1>
        <Badge variant="secondary" className="mt-2 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 flex items-center gap-1 w-fit">
          <Flame className="w-3.5 h-3.5 fill-emerald-600" /> Shard Engine Online
        </Badge>
      </motion.div>

      {/* KPI ROW */}
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { title: 'Total Processed', value: stats.total, change:'Database records', trend:'up', icon: FileText, color:'blue' },
          { title: 'Approval Accuracy', value: `${stats.approvalRate}%`, change:'Human verified', trend:'up', icon: TrendingUp, color:'emerald' },
          { title: 'Action Required', value: stats.review, change:'Pending review', trend: stats.review > 0 ? 'down' : 'up', icon: AlertCircle, color:'amber' },
        ].map((kpi, i)=>(
          <Card key={i} className="border-border shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6 flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground font-medium">{kpi.title}</p>
                <h2 className="text-3xl font-bold mt-1">{kpi.value}</h2>
                <p className="text-xs text-muted-foreground mt-1">{kpi.change}</p>
              </div>
              <div className={`p-3 rounded-xl bg-${kpi.color}-500/10 text-${kpi.color}-600`}>
                <kpi.icon size={24} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ACTION BUTTONS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link to="/upload" className="w-full">
            <Button className="w-full h-14 text-base gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-lg">
                <Upload size={20}/> Upload Invoice
            </Button>
          </Link>
          <Link to="/activity" className="w-full">
            <Button variant="outline" className="w-full h-14 text-base gap-2 border-border">
                <CheckSquare size={20}/> Activity Feed
            </Button>
          </Link>
          <Link to="/analytics" className="w-full">
            <Button variant="outline" className="w-full h-14 text-base gap-2 border-border">
                <BarChart3 size={20}/> System Analytics
            </Button>
          </Link>
      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-border">
          <CardHeader><CardTitle className="text-sm font-semibold flex items-center gap-2"><Calendar className="w-4 h-4"/> 7-Day Processing Volume</CardTitle></CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volumeData}>
                <defs>
                  <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                <Area type="monotone" dataKey="invoices" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#volGrad)"/>
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader><CardTitle className="text-sm font-semibold flex items-center gap-2"><Cpu className="w-4 h-4"/> Status Distribution</CardTitle></CardHeader>
          <CardContent className="h-[300px] flex flex-col justify-center">
            <div className="h-48">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={confidenceData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {confidenceData.map((c,i)=><Cell key={i} fill={c.fill}/>)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2 text-xs">
              {confidenceData.map((item,i)=>(
                <div key={i} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{background:item.fill}}/>
                    <span>{item.name}</span>
                  </div>
                  <span className="font-bold">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RECENT ACTIVITY TABLE */}
      <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Invoices</CardTitle>
            <Link to="/activity" className="text-primary text-xs font-semibold hover:underline">View All Records</Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
                {invoices.slice(0, 5).map((inv, i)=>(
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/30">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2 rounded-md bg-background border border-border"><FileText size={18} className="text-muted-foreground"/></div>
                            <div className="min-w-0">
                                <p className="font-bold text-sm truncate">{inv.canonical_data?.vendor_name?.value || "Vendor Unnamed"}</p>
                                <p className="text-[10px] text-muted-foreground">{new Date(inv.created_at).toLocaleDateString()} • {inv.original_filename || "upload.pdf"}</p>
                            </div>
                        </div>
                        <Badge variant={inv.status === 'approved' ? 'success' : inv.status === 'rejected' ? 'destructive' : 'warning'}>
                            {Math.round(inv.confidence_scores?.overall_confidence || 0)}% Accuracy
                        </Badge>
                    </div>
                ))}
                {invoices.length === 0 && <p className="text-center py-6 text-sm text-muted-foreground">No invoices found in history.</p>}
            </div>
          </CardContent>
      </Card>
    </div>
  );
}
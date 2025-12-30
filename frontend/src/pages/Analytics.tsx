import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
  FileText,
  TrendingUp,
  Download,
  FileJson,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';

export default function Analytics() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 👇 FETCH DATA
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.email) return;

      try {
        const token = JSON.stringify({ userId: user.id, email: user.email });
        const res = await axios.get("http://localhost:5000/api/invoices?limit=1000", {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data.success) {
          setInvoices(res.data.invoices);
        }
      } catch (error) {
        console.error("Analytics fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // ===================== DATA PROCESSING =====================

  // 1. KPI: Total & Accuracy
  const kpiStats = useMemo(() => {
    const total = invoices.length;
    // Fallback: Check nested confidence if root is missing
    const totalConf = invoices.reduce((acc, inv) => {
      const scores = inv.confidence_scores || {};
      return acc + (scores.overall_confidence || 0);
    }, 0);
    
    const avgAccuracy = total > 0 ? (totalConf / total).toFixed(1) : "0.0";
    
    // Weekly growth
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thisWeekCount = invoices.filter(i => new Date(i.created_at || i.updated_at) > sevenDaysAgo).length;

    return { total, avgAccuracy, thisWeekCount };
  }, [invoices]);

  // 2. CHART: Volume Over Time (Last 7 Days)
  const volumeData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return { 
        dateStr: d.toDateString(), 
        name: d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }), 
        count: 0 
      };
    });

    invoices.forEach(inv => {
      const d = new Date(inv.created_at || inv.updated_at);
      const dayObj = days.find(day => day.dateStr === d.toDateString());
      if (dayObj) dayObj.count++;
    });

    return days;
  }, [invoices]);

  // 3. CHART: Status Breakdown (Matches Activity Feed Logic)
  const statusData = useMemo(() => {
    const counts = {
      auto_approved: 0,
      approved: 0,
      needs_review: 0,
      rejected: 0
    };

    invoices.forEach(inv => {
      // Logic must match ActivityLog.tsx exactly
      const scores = inv.confidence_scores || {};
      const fieldConf = scores.field_confidence || {};
      
      const dbStatus = fieldConf.status?.toLowerCase();
      const conf = scores.overall_confidence || 0;

      if (dbStatus === 'rejected') {
        counts.rejected++;
      } else if (dbStatus === 'needs_review' || dbStatus === 'review_needed') {
        counts.needs_review++;
      } else if (conf < 85) {
        counts.needs_review++; // Low confidence fallback
      } else if (conf >= 85) {
        counts.auto_approved++;
      } else {
        counts.approved++;
      }
    });

    return [
      { name: 'Auto-Approved', value: counts.auto_approved, fill: '#10b981' }, // Emerald
      { name: 'Approved', value: counts.approved, fill: '#3b82f6' },      // Blue
      { name: 'Needs Review', value: counts.needs_review, fill: '#f59e0b' }, // Amber
      { name: 'Rejected', value: counts.rejected, fill: '#ef4444' }       // Red
    ].filter(i => i.value > 0);
  }, [invoices]);

  // 4. CHART: Accuracy by Field (FIXED LOGIC)
  const fieldAccuracyData = useMemo(() => {
    // Accumulators
    const fields = {
      'Invoice #': { sum: 0, count: 0 },
      'Vendor': { sum: 0, count: 0 },
      'Date': { sum: 0, count: 0 },
      'Items': { sum: 0, count: 0 }, // Renamed from "Line Items" to match DB intent
      'Total': { sum: 0, count: 0 }  // Using "pricing" as proxy
    };

    invoices.forEach(inv => {
      // 1. Get the field_confidence object
      const scores = inv.confidence_scores || {};
      const fieldConf = scores.field_confidence || {}; // <--- CRITICAL FIX

      // 2. Helper to safely add score if it exists
      const addScore = (key: keyof typeof fields, val: any) => {
        const numVal = parseFloat(val);
        if (!isNaN(numVal) && numVal > 0) {
          fields[key].sum += numVal;
          fields[key].count++;
        }
      };

      // 3. Map Database Keys to Chart Keys
      addScore('Invoice #', fieldConf.invoice_number);
      addScore('Vendor', fieldConf.vendor_name || fieldConf.company_name); // Try both
      addScore('Date', fieldConf.date);
      addScore('Items', fieldConf.items);
      addScore('Total', fieldConf.pricing); // "pricing" covers totals/tax usually
    });

    return Object.entries(fields).map(([name, data]) => ({
      name,
      accuracy: data.count > 0 ? Math.round(data.sum / data.count) : 0
    }));
  }, [invoices]);

  // 5. CHART: Top Vendors
  const topVendorsData = useMemo(() => {
    const vendorMap: Record<string, number> = {};
    
    invoices.forEach(inv => {
      const extracted = inv.extracted_data || {};
      const canonical = inv.canonical_data || {};
      const metadata = extracted.invoice_metadata || canonical.invoice_metadata || {};
      const vendorInfo = extracted.vendor_info || canonical.vendor_info || {};

      const name = metadata.company_name || vendorInfo.vendor_name || "Unknown";
      vendorMap[name] = (vendorMap[name] || 0) + 1;
    });

    return Object.entries(vendorMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [invoices]);


  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-24 px-4 sm:px-6 md:px-0">

      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground mt-1">Track your invoice processing performance</p>
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <Button variant="outline" className="flex-1 sm:flex-none">
            <Download className="w-4 h-4 mr-2" /> PDF
          </Button>
          <Button variant="outline" className="flex-1 sm:flex-none">
            <FileJson className="w-4 h-4 mr-2" /> Excel
          </Button>
        </div>
      </motion.div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Total Processed */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">Total Processed</span>
              </div>
              <p className="text-3xl font-bold">{kpiStats.total}</p>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-emerald-500 font-medium">+{kpiStats.thisWeekCount}</span> this week
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Avg Accuracy */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">Avg Accuracy</span>
              </div>
              <p className="text-3xl font-bold">{kpiStats.avgAccuracy}%</p>
              <p className="text-xs text-muted-foreground mt-1">Based on confidence scores</p>
            </CardContent>
          </Card>
        </motion.div>

      </div>

      {/* ROW 1 - ANALYTICS */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Volume Over Time */}
        <Card className="overflow-hidden">
          <CardHeader><CardTitle>Volume (Last 7 Days)</CardTitle></CardHeader>
          <CardContent className="w-full overflow-x-auto">
            <div className="min-w-[400px] sm:min-w-0 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={volumeData}>
                  <defs>
                    <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" fontSize={12} axisLine={false} tickLine={false} dy={10} />
                  <YAxis fontSize={12} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                  />
                  <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#volumeGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status Breakdown */}
        <Card className="overflow-hidden">
          <CardHeader><CardTitle>Status Breakdown</CardTitle></CardHeader>
          <CardContent className="h-64 flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1 min-w-[200px] h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={statusData} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={60} 
                    outerRadius={80} 
                    paddingAngle={4} 
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-3">
              {statusData.map((item) => (
                <div key={item.name} className="flex justify-between text-sm items-center">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full shadow-sm" style={{ background: item.fill }} />
                    {item.name}
                  </div>
                  <b className="font-mono">{item.value}</b>
                </div>
              ))}
              {statusData.length === 0 && <p className="text-muted-foreground text-sm text-center">No data yet</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ROW 2 */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Accuracy by Field */}
        <Card>
          <CardHeader><CardTitle>Avg Accuracy by Field</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <div className="min-w-[400px] sm:min-w-0 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fieldAccuracyData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 12}} />
                  <Tooltip 
                     cursor={{fill: 'transparent'}}
                     formatter={(value: number) => [`${value}%`, 'Accuracy']}
                  />
                  <Bar dataKey="accuracy" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Vendors */}
        <Card>
          <CardHeader><CardTitle>Top Vendors</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <div className="min-w-[400px] sm:min-w-0 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topVendorsData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{fill: 'hsl(var(--muted)/0.2)'}}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px' }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
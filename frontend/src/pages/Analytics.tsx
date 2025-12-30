import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import api from "../lib/api.ts";
import {
  FileText,
  TrendingUp,
  Download,
  FileJson,
  Loader2,
  Calendar,
  BarChart3
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

        const res = await api.get("/api/invoices?limit=1000", {
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
    const totalConf = invoices.reduce((acc, inv) => {
      const scores = inv.confidence_scores || {};
      return acc + (scores.overall_confidence || 0);
    }, 0);
    
    const avgAccuracy = total > 0 ? (totalConf / total).toFixed(1) : "0.0";
    
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
        name: d.toLocaleDateString('en-US', { weekday: 'short' }), 
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

  // 3. CHART: Status Breakdown
  const statusData = useMemo(() => {
    const counts = { auto: 0, manual: 0, review: 0, rejected: 0 };

    invoices.forEach(inv => {
      const status = (inv.status || inv.confidence_scores?.status || '').toLowerCase();
      const conf = inv.confidence_scores?.overall_confidence || 0;

      if (status === 'approved') counts.manual++;
      else if (status === 'auto_approved') counts.auto++;
      else if (status === 'rejected') counts.rejected++;
      else if (status.includes('review') || conf < 85) counts.review++;
      else counts.auto++; // Default
    });

    return [
      { name: 'Auto-Approved', value: counts.auto, fill: '#10b981' }, 
      { name: 'Approved', value: counts.manual, fill: '#3b82f6' },      
      { name: 'Needs Review', value: counts.review, fill: '#f59e0b' }, 
      { name: 'Rejected', value: counts.rejected, fill: '#ef4444' }       
    ].filter(i => i.value > 0);
  }, [invoices]);

  // 4. CHART: Accuracy by Field
  const fieldAccuracyData = useMemo(() => {
    const fields: any = {
      'Inv #': { sum: 0, count: 0 },
      'Vendor': { sum: 0, count: 0 },
      'Date': { sum: 0, count: 0 },
      'Items': { sum: 0, count: 0 },
      'Total': { sum: 0, count: 0 }
    };

    invoices.forEach(inv => {
      const fConf = inv.confidence_scores?.field_confidence || {}; 
      const add = (key: string, val: any) => {
        if (val) { fields[key].sum += val; fields[key].count++; }
      };

      add('Inv #', fConf.invoice_number);
      add('Vendor', fConf.vendor_name || fConf.company_name);
      add('Date', fConf.date);
      add('Items', fConf.items);
      add('Total', fConf.pricing || fConf.total_amount);
    });

    return Object.entries(fields).map(([name, data]: any) => ({
      name,
      accuracy: data.count > 0 ? Math.round(data.sum / data.count) : 0
    }));
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
          <p className="text-muted-foreground mt-1">AI performance and processing trends</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="bg-card">
            <Download className="w-4 h-4 mr-2" /> Export PDF
          </Button>
        </div>
      </motion.div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">Total Processed</span>
            </div>
            <p className="text-3xl font-bold">{kpiStats.total}</p>
            <p className="text-xs text-emerald-500 mt-1">+{kpiStats.thisWeekCount} this week</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-medium text-muted-foreground">Avg AI Accuracy</span>
            </div>
            <p className="text-3xl font-bold">{kpiStats.avgAccuracy}%</p>
            <p className="text-xs text-muted-foreground mt-1">Global confidence score</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-muted-foreground">Human Intervention</span>
            </div>
            <p className="text-3xl font-bold">
              {Math.round((statusData.find(d => d.name === 'Needs Review')?.value || 0) / (kpiStats.total || 1) * 100)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">Invoices requiring review</p>
          </CardContent>
        </Card>
      </div>

      {/* CHARTS */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm font-semibold flex items-center gap-2"><Calendar className="w-4 h-4"/> Processing Volume</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volumeData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="url(#colorCount)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm font-semibold">Field Extraction Accuracy</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fieldAccuracyData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.1} />
                <XAxis type="number" hide domain={[0, 100]} />
                <YAxis dataKey="name" type="category" width={60} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="accuracy" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
           <CardHeader><CardTitle className="text-sm font-semibold">System Throughput Status</CardTitle></CardHeader>
           <CardContent className="h-72 flex flex-col md:flex-row items-center">
              <div className="flex-1 h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusData} innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value">
                      {statusData.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-3 px-6 w-full">
                {statusData.map((item) => (
                  <div key={item.name} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{background: item.fill}} />
                      <span>{item.name}</span>
                    </div>
                    <span className="font-bold">{item.value}</span>
                  </div>
                ))}
              </div>
           </CardContent>
        </Card>
      </div>
    </div>
  );
}
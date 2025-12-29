// src/pages/Analytics.tsx
import { motion } from 'framer-motion';
import {
  FileText,
  TrendingUp,
  Clock,
  Users,
  DollarSign,
  Download,
  Mail,
  FileJson
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  LineChart,
  Line,
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

// ===================== DATA =====================
const volumeData = [
  { name: 'Week 1', invoices: 245 },
  { name: 'Week 2', invoices: 312 },
  { name: 'Week 3', invoices: 289 },
  { name: 'Week 4', invoices: 401 },
];

const accuracyByField = [
  { name: 'Invoice #', accuracy: 98 },
  { name: 'Vendor', accuracy: 95 },
  { name: 'Amount', accuracy: 92 },
  { name: 'Date', accuracy: 88 },
  { name: 'Tax', accuracy: 76 },
  { name: 'Line Items', accuracy: 72 },
];

const processingTimeData = [
  { name: 'Jan', time: 3.2 },
  { name: 'Feb', time: 2.8 },
  { name: 'Mar', time: 2.5 },
  { name: 'Apr', time: 2.3 },
];

const statusBreakdown = [
  { name: 'Approved', value: 1156, fill: 'hsl(var(--success))' },
  { name: 'Pending Review', value: 42, fill: 'hsl(var(--warning))' },
  { name: 'Rejected', value: 28, fill: 'hsl(var(--destructive))' },
  { name: 'Processing', value: 21, fill: 'hsl(var(--info))' },
];

const topVendors = [
  { name: 'Acme Corporation', count: 234 },
  { name: 'TechFlow Inc', count: 189 },
  { name: 'CloudSoft Solutions', count: 156 },
  { name: 'Global Supplies Ltd', count: 142 },
  { name: 'Innovation Labs', count: 98 },
];

// =================================================

export default function Analytics() {
  const kpis = [
    { title: 'Total Processed', value: '1,247', icon: FileText, change: '+156 this week' },
    { title: 'Avg Accuracy', value: '98.7%', icon: TrendingUp, change: '+2.3% vs last month' },
    { title: 'Avg Time', value: '2.3s', icon: Clock, change: '-0.5s vs last month' },
    { title: 'Manual Interventions', value: '42', icon: Users, change: '3.4% of total' },
    { title: 'Cost Saved', value: '$45,280', icon: DollarSign, change: '+$8,420 this month' },
  ];

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

        {/* Responsive Export Buttons */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <Button variant="outline" className="flex-1 sm:flex-none">
            <Download className="w-4 h-4" /> PDF
          </Button>
          <Button variant="outline" className="flex-1 sm:flex-none">
            <FileJson className="w-4 h-4" /> Excel
          </Button>
          <Button variant="outline" className="flex-1 sm:flex-none">
            <Mail className="w-4 h-4" /> Email
          </Button>
        </div>
      </motion.div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {kpis.map((kpi, index) => (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card hover>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <kpi.icon className="w-4 h-4 text-primary" />
                  <span className="text-xs text-muted-foreground">{kpi.title}</span>
                </div>
                <p className="text-2xl font-bold">{kpi.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{kpi.change}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ROW 1 - ANALYTICS */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Volume Over Time */}
        <Card className="overflow-hidden">
          <CardHeader><CardTitle>Volume Over Time</CardTitle></CardHeader>
          <CardContent className="w-full overflow-x-auto">
            <div className="min-w-[500px] sm:min-w-0 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={volumeData}>
                  <defs>
                    <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Area type="monotone" dataKey="invoices" stroke="hsl(var(--primary))" fill="url(#volumeGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status Breakdown */}
        <Card className="overflow-hidden">
          <CardHeader><CardTitle>Status Breakdown</CardTitle></CardHeader>
          <CardContent className="h-64 flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1 min-w-[260px]">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={statusBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                    {statusBreakdown.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2">
              {statusBreakdown.map((item) => (
                <div key={item.name} className="flex justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ background: item.fill }} />
                    {item.name}
                  </div>
                  <b>{item.value}</b>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ROW 2 */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Field Accuracy */}
        <Card>
          <CardHeader><CardTitle>Accuracy by Field</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <div className="min-w-[500px] sm:min-w-0 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={accuracyByField} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={90} />
                  <Tooltip />
                  <Bar dataKey="accuracy" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Processing Time */}
        <Card>
          <CardHeader><CardTitle>Processing Time Trend</CardTitle></CardHeader>
          <CardContent className="h-64 overflow-x-auto">
            <div className="min-w-[420px] sm:min-w-0 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={processingTimeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(val: number) => `${val}s`} />
                  <Line type="monotone" dataKey="time" stroke="hsl(var(--info))" strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TOP VENDORS */}
      <Card>
        <CardHeader><CardTitle>Top Vendors by Invoice Count</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="min-w-[500px] sm:min-w-0 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topVendors}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

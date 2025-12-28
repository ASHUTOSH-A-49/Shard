// src/pages/ReviewQueue.tsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  X,
  Clock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { processedInvoices } from "./History";

const mockReviewItems = [
  {
    id: "1",
    invoiceNumber: "INV-20240003",
    vendor: "Office Essentials",
    amount: 14752.81,
    date: "2024-01-15",
    dueDate: "2024-02-15",
    confidence: 72,
    priority: "Medium",
    status: "Needs Review",
    timeLeft: "10h remaining",
    fields: [
      { name: "Invoice Number", value: "INV-20240003", confidence: 98, original: "INV-20240003" },
      { name: "Vendor Name", value: "Office Essentials", confidence: 95, original: "Office Essentials" },
      { name: "Total Amount", value: "$14,752.81", confidence: 68, original: "$14752.81" },
      { name: "Due Date", value: "2024-02-15", confidence: 45, original: "15/02/24" },
    ],
  },
  {
    id: "2",
    invoiceNumber: "INV-20240005",
    vendor: "DataPro Systems",
    amount: 17382.46,
    date: "2024-01-14",
    dueDate: "2024-02-10",
    confidence: 58,
    priority: "Medium",
    status: "Needs Review",
    timeLeft: "17h remaining",
    fields: [
      { name: "Invoice Number", value: "INV-20240005", confidence: 92, original: "INV-20240005" },
      { name: "Vendor Name", value: "DataPro Systems", confidence: 88, original: "DataPro Systems" },
      { name: "Total Amount", value: "$17,382.46", confidence: 42, original: "17382.46" },
      { name: "Tax Amount", value: "$288.00", confidence: 35, original: "N/A" },
    ],
  },
];

export default function ReviewQueue() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reviewPanel, setReviewPanel] = useState<(typeof mockReviewItems)[0] | null>(null);
  const [confidenceRange, setConfidenceRange] = useState([0, 100]);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const filteredItems = mockReviewItems.filter(
    (item) =>
      item.confidence >= confidenceRange[0] &&
      item.confidence <= confidenceRange[1] &&
      (searchQuery === "" ||
        item.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getConfidenceTint = (c: number) => {
    if (c >= 85) return "text-emerald-600 bg-emerald-500/20 dark:text-emerald-500 dark:bg-emerald-500/10";
    if (c >= 60) return "text-amber-600 bg-amber-500/20 dark:text-amber-500 dark:bg-amber-500/10";
    return "text-red-600 bg-red-500/20 dark:text-red-500 dark:bg-red-500/10";
  };

  const handleApprove = (item: (typeof mockReviewItems)[0]) => {
    toast.success("Invoice approved successfully!");
    processedInvoices.unshift({
      vendor: item.vendor,
      status: "approved",
      invoiceNumber: item.invoiceNumber,
      amount: `$${item.amount.toLocaleString()}`,
      uploadedBy: "Current User",
      uploadedTime: "Just now",
      extractedTime: "Just now",
      accuracy: `${item.confidence}%`,
    });
    navigate("/history");
  };

  const handleReject = () => {
    toast.error("Invoice rejected");
    setReviewPanel(null);
  };

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-foreground">Review Queue</h1>
        <p className="text-muted-foreground mt-1">{filteredItems.length} invoices pending review</p>
      </motion.div>

      {/* FILTER BAR */}
      <Card className="bg-card/80 border-border">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by vendor or invoice number..."
              className="pl-10 bg-background border-border"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <span className="text-sm whitespace-nowrap">Confidence:</span>
            <Slider value={confidenceRange} onValueChange={setConfidenceRange} min={0} max={100} step={5} className="flex-1 md:flex-none md:w-40" />
            <span className="text-sm font-medium">{confidenceRange[0]}-{confidenceRange[1]}%</span>
          </div>
        </CardContent>
      </Card>

      {/* REVIEW LIST */}
      {filteredItems.map((item, i) => (
        <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-black/40 border-border/60 hover:border-emerald-500/50 transition-all">
            <CardContent className="p-5">

              {/* TOP ROW */}
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-lg font-semibold">{item.vendor}</h2>
                    <Badge className="bg-amber-500/10 text-amber-500">Medium</Badge>
                    <Badge className="bg-emerald-500/10 text-emerald-500">Needs Review</Badge>
                  </div>

                  <div className="flex flex-wrap gap-5 text-sm text-muted-foreground">
                    <span><b className="text-xs mr-1 opacity-70">Invoice#</b>{item.invoiceNumber}</span>
                    <span><b className="text-xs mr-1 opacity-70">Amount</b>${item.amount.toLocaleString()}</span>
                    <span><b className="text-xs mr-1 opacity-70">Date</b>{item.date}</span>
                    <span><b className="text-xs mr-1 opacity-70">Due</b>{item.dueDate}</span>
                  </div>

                  <div className="flex items-center text-amber-500 text-xs font-semibold gap-2">
                    <Clock className="w-3 h-3" /> {item.timeLeft}
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                {/* ACTION BUTTONS */}
<div className="flex flex-col sm:flex-row items-end sm:items-center justify-end gap-3 sm:gap-3 mt-4 sm:mt-0">
  {/* CONFIDENCE BUTTON */}
  <button
    className={`
      w-full sm:w-auto px-4 py-2 sm:px-2.5 sm:py-0.5 rounded-full leading-none font-bold
      text-sm sm:text-[11px] md:text-sm
      ${getConfidenceTint(item.confidence)}
    `}
    onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
  >
    {item.confidence}% Review
  </button>

  <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3 sm:gap-3">
    <Button 
      size="sm" 
      className="h-10 px-6 text-sm flex-1 sm:flex-none border-emerald-600/50 text-emerald-500 w-full sm:w-auto" 
      variant="outline" 
      onClick={() => setReviewPanel(item)}
    >
      Review
    </Button>

    <Button 
      size="sm" 
      className="h-10 px-6 text-sm flex-1 sm:flex-none text-emerald-500 w-full sm:w-auto" 
      variant="ghost" 
      onClick={() => handleApprove(item)}
    >
      <CheckCircle className="w-4 h-4 mr-1" /> Approve
    </Button>

    <Button 
      size="sm" 
      className="h-10 px-6 text-sm flex-1 sm:flex-none text-red-500 w-full sm:w-auto" 
      variant="ghost" 
      onClick={handleReject}
    >
      <XCircle className="w-4 h-4 mr-1" /> Reject
    </Button>
  </div>
</div>

              </div>

              {/* EXPANDED FIELDS */}
              <AnimatePresence>
                {expandedId === item.id && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      {item.fields.map((f) => (
                        <div key={f.name} className="p-3 rounded-lg bg-white/5 border border-white/10">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">{f.name}</span>
                            <span className={`${f.confidence >= 85 ? "text-emerald-400" : f.confidence >= 60 ? "text-amber-400" : "text-red-400"}`}>
                              {f.confidence}%
                            </span>
                          </div>
                          <p className="font-medium">{f.value}</p>
                          {f.confidence < 70 && (
                            <p className="text-[11px] text-muted-foreground mt-1">Original: {f.original}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </CardContent>
          </Card>
        </motion.div>
      ))}

      {/* SIDE PANEL (full overlay, A-type behavior) */}
      <AnimatePresence>
        {reviewPanel && (
          <>
            <motion.div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setReviewPanel(null)}
            />

            <motion.div className="fixed right-0 top-0 h-full w-full md:w-[480px] bg-card border-l border-border z-50 overflow-y-auto"
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 24 }}
            >
              <div className="p-6 space-y-4">

                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Review Invoice</h2>
                  <Button variant="ghost" size="icon" onClick={() => setReviewPanel(null)}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {reviewPanel.fields.map((f) => (
                  <div key={f.name} className="border p-4 rounded-lg bg-black/20">
                    <div className="flex justify-between text-sm mb-1">
                      <span>{f.name}</span>
                      <Badge>{f.confidence}%</Badge>
                    </div>
                    <p className="font-medium">{f.value}</p>
                    <p className="text-xs text-muted-foreground">Original: {f.original}</p>
                  </div>
                ))}

                <div className="flex gap-3 pt-3">
                  <Button className="flex-1" onClick={() => handleApprove(reviewPanel!)}>
                    <CheckCircle className="w-4 h-4 mr-1" /> Approve
                  </Button>
                  <Button className="flex-1" variant="destructive" onClick={handleReject}>
                    <XCircle className="w-4 h-4 mr-1" /> Reject
                  </Button>
                </div>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}

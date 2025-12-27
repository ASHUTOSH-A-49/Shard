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
  if (c >= 85)
    return "text-emerald-600 bg-emerald-500/20 dark:text-emerald-500 dark:bg-emerald-500/10";

  if (c >= 60)
    return "text-amber-600 bg-amber-500/20 dark:text-amber-500 dark:bg-amber-500/10";

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
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">Review Queue</h1>
          <p className="text-muted-foreground mt-1">
            {filteredItems.length} invoices awaiting human verification
          </p>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-card/80 border-border">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by vendor or invoice number..."
                  className="pl-10 bg-background border-border"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2 min-w-64">
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  Confidence:
                </span>
                <Slider
                  value={confidenceRange}
                  onValueChange={setConfidenceRange}
                  min={0}
                  max={100}
                  step={5}
                  className="flex-1"
                />
                <span className="text-sm font-medium text-foreground w-20">
                  {confidenceRange[0]}-{confidenceRange[1]}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        {filteredItems.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card
  className="
    bg-white text-gray-900
    dark:bg-[#050910] dark:text-white
    border-border/80 hover:border-emerald-500/60 transition-colors
    
    [&_.text-muted-foreground]:text-gray-700
    dark:[&_.text-muted-foreground]:text-gray-300
  "
>

              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-semibold text-foreground">
                        {item.vendor}
                      </h2>
                      <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-200 text-xs">
                        Medium
                      </Badge>
                      <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-200 text-xs">
                        Needs Review
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                      <span>
                        <span className="text-xs uppercase tracking-wide opacity-70 mr-1">
                          Invoice #
                        </span>
                        {item.invoiceNumber}
                      </span>
                      <span>
                        <span className="text-xs uppercase tracking-wide opacity-70 mr-1">
                          Amount
                        </span>
                        <span className="font-medium text-foreground">
                          ${item.amount.toLocaleString()}
                        </span>
                      </span>
                      <span>
                        <span className="text-xs uppercase tracking-wide opacity-70 mr-1">
                          Date
                        </span>
                        {item.date}
                      </span>
                      <span>
                        <span className="text-xs uppercase tracking-wide opacity-70 mr-1">
                          Due
                        </span>
                        {item.dueDate}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-semibold text-amber-500 mt-1">
                      <Clock className="w-3 h-3" />
                      <span>{item.timeLeft}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <button
                      className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2 ${getConfidenceTint(
                        item.confidence
                      )}`}
                      onClick={() =>
                        setExpandedId(expandedId === item.id ? null : item.id)
                      }
                    >
                      <span>{item.confidence}%</span>
                      <span className="opacity-75">(Review)</span>
                    </button>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-emerald-600/60 text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20"
                        onClick={() => setReviewPanel(item)}
                      >
                        Review
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-emerald-500 hover:bg-emerald-500/10"
                        onClick={() => handleApprove(item)}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:bg-red-500/10 hover:text-red-700"
                        onClick={handleReject}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {expandedId === item.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="pt-4 border-t border-border/60"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        {item.fields.map((f) => (
                          <div
                            key={f.name}
                            className="p-3 rounded-lg bg-[#0B1119] border border-border/60"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-muted-foreground">
                                {f.name}
                              </span>
                              <span
                                className={`text-xs font-medium ${
                                  f.confidence >= 85
                                    ? "text-emerald-400"
                                    : f.confidence >= 60
                                    ? "text-amber-400"
                                    : "text-red-400"
                                }`}
                              >
                                {f.confidence}%
                              </span>
                            </div>
                            <p className="text-sm font-medium text-foreground">
                              {f.value}
                            </p>
                            {f.confidence < 70 && (
                              <p className="text-[11px] text-muted-foreground mt-1">
                                Original: {f.original}
                              </p>
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
      </motion.div>

      {/* Slide-out Review Panel */}
      <AnimatePresence>
        {reviewPanel && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50"
              onClick={() => setReviewPanel(null)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25 }}
              className="fixed right-0 top-0 h-full w-full max-w-lg bg-card border-l border-border shadow-xl z-50 overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-foreground">
                    Review Invoice
                  </h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setReviewPanel(null)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="space-y-4">
                  {reviewPanel.fields.map((field) => (
                    <div key={field.name} className="p-4 bg-secondary/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-foreground">
                          {field.name}
                        </span>
                        <div className="flex items-center gap-2">
                          {field.confidence < 70 && (
                            <AlertTriangle className="w-4 h-4 text-amber-400" />
                          )}
                          <Badge
                            variant={
                              field.confidence >= 85
                                ? "secondary"
                                : field.confidence >= 60
                                ? "outline"
                                : "destructive"
                            }
                          >
                            {field.confidence}%
                          </Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-xs text-muted-foreground">
                            AI Extracted
                          </span>
                          <p className="font-medium text-foreground">
                            {field.value}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">
                            Original Text
                          </span>
                          <p className="text-muted-foreground">
                            {field.original}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 mt-6">
                  <Button className="flex-1" onClick={() => handleApprove(reviewPanel)}>
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </Button>
                  <Button variant="destructive" className="flex-1" onClick={handleReject}>
                    <XCircle className="w-4 h-4" />
                    Reject
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

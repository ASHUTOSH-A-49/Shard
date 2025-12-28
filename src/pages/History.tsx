import { motion } from "framer-motion";
import { HiOutlineEye } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  UploadCloud, 
  Workflow, 
  Calendar, 
  User, 
  Hash, 
  CheckCircle2 
} from "lucide-react";
import { cn } from "@/lib/utils";

// 🚨 Data Source
export const processedInvoices = [
  {
    vendor: "Office Essentials",
    status: "approved",
    invoiceNumber: "INV-20240003",
    amount: "$14,752.81",
    uploadedBy: "John Smith",
    uploadedTime: "Dec 26, 07:54 PM",
    extractedTime: "Dec 26, 07:54 PM",
    accuracy: "95.8%",
  },
  {
    vendor: "DataPro Systems",
    status: "approved",
    invoiceNumber: "INV-20240005",
    amount: "$17,382.46",
    uploadedBy: "Sarah Johnson",
    uploadedTime: "Dec 23, 12:28 AM",
    extractedTime: "Dec 23, 12:28 AM",
    accuracy: "97.9%",
  },
  {
    vendor: "TechSupply Inc",
    status: "approved",
    invoiceNumber: "INV-20240009",
    amount: "$33,812.92",
    uploadedBy: "Sarah Johnson",
    uploadedTime: "Dec 24, 10:19 AM",
    extractedTime: "Dec 24, 10:19 AM",
    accuracy: "94.1%",
  },
  {
    vendor: "DataPro Systems",
    status: "approved",
    invoiceNumber: "INV-20240102",
    amount: "$22,656.54",
    uploadedBy: "Mike Chen",
    uploadedTime: "Dec 23, 03:40 PM",
    extractedTime: "Dec 23, 03:40 PM",
    accuracy: "98.2%",
  },
  {
    vendor: "Premium Materials Co",
    status: "approved",
    invoiceNumber: "INV-20240014",
    amount: "$33,251.97",
    uploadedBy: "Alex Wilson",
    uploadedTime: "Dec 24, 03:27 AM",
    extractedTime: "Dec 24, 03:27 AM",
    accuracy: "95.9%",
  },
];

// 🔹 Reusable status badge
const StatusBadge = ({ status }: { status: string }) => {
  const colors: any = {
    approved: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    rejected: "bg-red-500/10 text-red-500 border-red-500/20",
    review: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  };
  return (
    <span
      className={cn(
        "px-2.5 py-0.5 text-[10px] md:text-xs font-bold rounded-full capitalize border shrink-0",
        colors[status]
      )}
    >
      {status}
    </span>
  );
};

export default function History() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 py-6 md:px-6 md:py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-1"
      >
        <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
          Processing History
        </h1>
        <p className="text-sm text-muted-foreground">
          {processedInvoices.length} invoices successfully archived
        </p>
      </motion.div>

      {/* Cards List */}
      <div className="space-y-4 md:space-y-6">
        {processedInvoices.map((inv, i) => (
          <motion.div
            key={inv.invoiceNumber}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="bg-card/40 border-border hover:border-border/80 transition-colors overflow-hidden">
              <CardContent className="p-0">
                {/* Main Content Area */}
                <div className="p-5 md:p-6 space-y-6">
                  
                  {/* Top Section: Vendor Info & Quick Actions */}
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1 min-w-0">
                      <h3 className="text-base md:text-lg font-bold truncate leading-none">
                        {inv.vendor}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1.5">
                        <span className="flex items-center gap-1">
                          <Hash className="w-3 h-3 shrink-0" /> {inv.invoiceNumber}
                        </span>
                        <span className="font-bold text-emerald-500">
                          {inv.amount}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <StatusBadge status={inv.status} />
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="md:hidden h-8 px-2 text-[11px] font-medium text-muted-foreground"
                        onClick={() => navigate(`/processing/inv/${inv.invoiceNumber}`)}
                      >
                        <HiOutlineEye className="w-4 h-4 mr-1" />
                        Details
                      </Button>
                    </div>
                  </div>

                  {/* Responsive Timeline Component */}
                  <div className="relative ml-2 md:ml-4 space-y-8">
                    {/* The Connecting Vertical Line */}
                    <div className="absolute left-[19px] top-2 bottom-2 w-px bg-border/60" />

                    {/* Timeline Item: Uploaded */}
                    <div className="flex gap-4 relative z-10">
                      <div className="shrink-0 w-10 h-10 bg-teal-500/10 border border-teal-500/20 rounded-full flex items-center justify-center">
                        <UploadCloud className="w-5 h-5 text-teal-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                          <span className="text-teal-400 font-bold text-sm leading-none">Uploaded</span>
                          <span className="text-[10px] md:text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {inv.uploadedTime}
                          </span>
                        </div>
                        <p className="text-xs md:text-sm font-medium mt-1 flex items-center gap-1">
                          <User className="w-3.5 h-3.5 opacity-60" /> {inv.uploadedBy}
                        </p>
                      </div>
                    </div>

                    {/* Timeline Item: Extracted */}
                    <div className="flex gap-4 relative z-10">
                      <div className="shrink-0 w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center">
                        <Workflow className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                          <span className="text-blue-400 font-bold text-sm leading-none">Extracted</span>
                          <span className="text-[10px] md:text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {inv.extractedTime}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <p className="text-[11px] md:text-xs text-muted-foreground">
                            Processed via <span className="text-foreground font-medium">AI v2.1</span>
                          </p>
                          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/10 text-[10px] md:text-xs font-bold text-blue-400">
                            <CheckCircle2 className="w-3 h-3" />
                            {inv.accuracy} Conf.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Desktop Only View Details Button */}
                  <div className="hidden md:flex justify-end pt-2 border-t border-border/40">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 px-4 text-xs font-semibold hover:bg-primary hover:text-primary-foreground transition-all"
                      onClick={() => navigate(`/processing/inv/${inv.invoiceNumber}`)}
                    >
                      <HiOutlineEye className="w-4 h-4 mr-2" />
                      View Full Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
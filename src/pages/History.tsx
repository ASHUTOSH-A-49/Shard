import { motion } from "framer-motion";
import { HiOutlineEye } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
// ADD THIS TO THE IMPORTS 🔥
import { UploadCloud, Workflow } from "lucide-react";


// 🚨 Exporting this for InvoiceDetails page
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

// 🔹 Reusable status badge styling
const StatusBadge = ({ status }: { status: string }) => {
  const colors: any = {
    approved: "bg-green-500/10 text-green-500",
    rejected: "bg-red-500/10 text-red-500",
    review: "bg-yellow-500/10 text-yellow-500",
  };
  return (
    <span
      className={`px-3 py-1 text-xs font-medium rounded-full capitalize ${colors[status]}`}
    >
      {status}
    </span>
  );
};

export default function History() {
  const navigate = useNavigate();

  return (
    <div className="space-y-8 max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-foreground">Processing History</h1>
        <p className="text-muted-foreground mt-1">
          {processedInvoices.length} processed invoices
        </p>
      </motion.div>

      {/* Cards */}
      <div className="space-y-6">
        {processedInvoices.map((inv, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="bg-card/90 border-border">
              <CardContent className="p-6 space-y-6">
                {/* Top Row */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{inv.vendor}</h3>
                    <p className="text-sm text-muted-foreground">
                      {inv.invoiceNumber} • {inv.amount}
                    </p>
                  </div>
                  <StatusBadge status={inv.status} />
                </div>

                {/* Timeline inside card */}
               {/* Timeline inside card */}
<div className="ml-3 space-y-10">

  {/* Uploaded */}
  <div className="flex gap-4">
    {/* ICON + LINE */}
    <div className="flex flex-col items-center">
      <div className="w-10 h-10 bg-teal-500/10 border border-teal-500/30 rounded-full flex items-center justify-center">
        <UploadCloud className="w-5 h-5 text-teal-400" />
      </div>
      {/* LINE BELOW ICON */}
      <div className="w-px flex-1 bg-border" />
    </div>

    {/* TEXT */}
    <div>
      <div className="flex items-center gap-2 font-medium">
        <span className="text-teal-400 font-semibold">Uploaded</span>
        <span className="text-xs text-muted-foreground">{inv.uploadedTime}</span>
      </div>
      <p className="text-sm text-muted-foreground">{inv.uploadedBy}</p>
      <p className="text-sm text-muted-foreground">Document uploaded via drag & drop</p>
    </div>
  </div>


  {/* Extracted */}
  <div className="flex gap-4">
    {/* ICON + LINE */}
    <div className="flex flex-col items-center">
      <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/30 rounded-full flex items-center justify-center">
        <Workflow className="w-5 h-5 text-blue-400" />
      </div>
      {/* LINE BELOW ICON */}
      <div className="w-px flex-1 bg-border" />
    </div>

    {/* TEXT */}
    <div>
      <div className="flex items-center gap-2 font-medium">
        <span className="text-blue-400 font-semibold">Extracted</span>
        <span className="text-xs text-muted-foreground">{inv.extractedTime}</span>
      </div>
      <p className="text-sm text-muted-foreground">AI Engine v2.1</p>
      <p className="text-sm text-muted-foreground">
        Extracted 8 fields with {inv.accuracy} average confidence
      </p>
    </div>
  </div>

</div>



                {/* View Button */}
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2"
                    onClick={() =>
                      navigate(`/processing/inv/${inv.invoiceNumber}`)
                    }
                  >
                    <HiOutlineEye className="w-4 h-4" />
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

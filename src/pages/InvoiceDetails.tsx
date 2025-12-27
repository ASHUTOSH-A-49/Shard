// src/pages/InvoiceDetails.tsx
import { useParams, useNavigate } from "react-router-dom";
import { processedInvoices } from "./History";
import { Button } from "@/components/ui/button";
import { Download, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Upload, Bot, Eye, Archive } from "lucide-react";

const steps = [
  { key: "upload", label: "Upload", icon: Upload },
  { key: "ai extraction", label: "AI Extraction", icon: Bot },
  { key: "human review", label: "Human Review", icon: Eye },
  { key: "approved", label: "Approved", icon: CheckCircle },
  { key: "archived", label: "Archived", icon: Archive },
];

export default function InvoiceDetails() {
  const { invoiceId } = useParams();
  const navigate = useNavigate();

  const invoice = processedInvoices.find(
    (inv) => inv.invoiceNumber.toLowerCase() === invoiceId?.toLowerCase()
  );

  if (!invoice)
    return (
      <div className="p-8 text-red-400">
        ❌ Invoice Not Found for ID: {invoiceId}
      </div>
    );

  const downloadJSON = () => {
    const json = JSON.stringify(invoice, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${invoice.invoiceNumber}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadCSV = () => {
    const csv = Object.entries(invoice)
      .map(([key, value]) => `"${key}","${value}"`)
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${invoice.invoiceNumber}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8 space-y-10 fade-in">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{invoice.vendor}</h1>
          <p className="text-muted-foreground">{invoice.invoiceNumber}</p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="border-emerald-500/60 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20"
            onClick={() => navigate("/history")}
          >
            <CheckCircle className="w-4 h-4 mr-2" /> Approve
          </Button>

          <Button variant="outline" onClick={downloadJSON}>
            <Download className="w-4 h-4 mr-2" /> JSON
          </Button>
          <Button variant="outline" onClick={downloadCSV}>
            <Download className="w-4 h-4 mr-2" /> CSV
          </Button>
        </div>
      </div>

      {/* STATUS BAR */}
      <div
  className="
    w-full flex items-center gap-0 px-10 py-4 border border-border rounded-2xl
    bg-white text-gray-900
    dark:bg-[#0A0F15] dark:text-white
  "
>

        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <div key={step.key} className="flex items-center flex-1">
              <div
                className="
                  flex items-center justify-center gap-2 px-6 py-2 w-full
                  rounded-full border text-sm font-medium
                  border-emerald-500 text-emerald-500 bg-emerald-500/10
                  whitespace-nowrap
                "
              >
                <Icon className="w-4 h-4 text-emerald-500" />
                {step.label}
              </div>
              {i < steps.length - 1 && (
                <div className="h-[2px] bg-emerald-500/30 flex-1 mx-6" />
              )}
            </div>
          );
        })}
      </div>

      {/* MAIN CONTENT */}
      <div className="grid grid-cols-2 gap-8">
        {/* LEFT — PREVIEW */}
        <div className="p-6 rounded-lg border border-border bg-card space-y-4">
          <h2 className="font-semibold">Document Preview</h2>

          <div
  className="
    border border-border rounded-lg p-10 text-sm leading-relaxed
+   bg-white text-gray-900
    dark:bg-[#0B1119] dark:text-white
  "
>

            <div className="flex justify-between items-start">
              <div>
                <span className="px-4 py-1 bg-emerald-500/20 text-emerald-500 text-xs rounded-md font-semibold mb-4 inline-block">
                  INVOICE
                </span>
                <h3 className="font-semibold">{invoice.vendor}</h3>
                <p className="text-xs text-muted-foreground">123 Business Street</p>
                <p className="text-xs text-muted-foreground">City, State 12345</p>
              </div>

              <div className="text-right text-xs space-y-1">
                <p className="text-muted-foreground">Invoice #</p>
                <p className="font-mono">{invoice.invoiceNumber}</p>
                <p className="mt-3 text-muted-foreground">Date</p>
                <p>{(invoice as any).date || "2025-12-04"}</p>
                <p className="mt-3 text-muted-foreground">Due Date</p>
                <p>{(invoice as any).dueDate || "2026-01-03"}</p>
              </div>
            </div>

            <div className="mt-10">
              <p className="text-xs text-muted-foreground mb-1">Bill To:</p>
              <p className="font-medium">
                {(invoice as any).customer || "Customer Name"}
              </p>
            </div>

            <table className="w-full mt-8 text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left py-2">Description</th>
                  <th className="text-right py-2">Qty</th>
                  <th className="text-right py-2">Rate</th>
                  <th className="text-right py-2">Amount</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3].map((i) => (
                  <tr key={i} className="border-b border-border/30">
                    <td className="py-2">Professional Services</td>
                    <td className="text-right">1</td>
                    <td className="text-right">$1,500.00</td>
                    <td className="text-right">$1,500.00</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end mt-8">
              <div className="w-56 text-sm space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>$4,500.00</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>$986.41</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-500 bg-emerald-400/10 px-3 py-1 rounded-md mt-2">
                  <span>Total:</span>
                  <span>{invoice.amount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — EXTRACTED DATA */}
        <div
  className="
    p-6 rounded-lg border border-border space-y-4
+   bg-neutral-100 text-gray-900
    dark:bg-card dark:text-white
  "
>

          <h2 className="font-semibold">Extracted Data</h2>

          {Object.entries(invoice).map(([key, value]) => {
            if (["uploadedBy", "uploadedTime"].includes(key)) return null;

            return (
              <div
                key={key}
                className="border border-border rounded-lg p-4 flex justify-between items-center"
              >
                <div>
                  <p className="text-xs text-muted-foreground capitalize">
                    {key.replace(/([A-Z])/g, " $1")}
                  </p>
                  <p className="font-medium">{value as string}</p>
                </div>
                <Badge className="bg-green-400/10 text-green-500 hover:text-green-100">✓ High</Badge>
              </div>
            );
          })}
        </div>
      </div>

      {/* AUDIT TRAIL */}
      <div className="w-full mt-10 p-10 rounded-lg border border-border bg-card">
        <h2 className="font-semibold mb-8 text-lg">Audit Trail</h2>

        <div className="space-y-10">
          <div className="flex gap-6">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 bg-teal-500/10 border border-teal-500/40 rounded-full flex items-center justify-center">
                <svg
                  width="18"
                  height="18"
                  stroke="#2dd4bf"
                  strokeWidth="2"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
                  <path d="M7 9l5-5 5 5" />
                  <path d="M12 4v12" />
                </svg>
              </div>
              <div className="w-px bg-border flex-1" />
            </div>

            <div>
              <p className="font-medium text-teal-500">
                Uploaded{" "}
                <span className="text-xs text-muted-foreground ml-2">
                  {(invoice as any).uploadedTime}
                </span>
              </p>
              <p className="text-sm text-muted-foreground">
                {(invoice as any).uploadedBy}
              </p>
              <p className="text-sm text-muted-foreground">
                Document uploaded via drag & drop
              </p>
            </div>
          </div>

          <div className="flex gap-6">
            <div className="flex flex-col itemscenter">
              <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/40 rounded-full flex items-center justify-center">
                <svg
                  width="18"
                  height="18"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 3v12" />
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
            </div>

            <div>
              <p className="font-medium text-blue-400">
                Extracted{" "}
                <span className="text-xs text-muted-foreground ml-2">
                  {(invoice as any).extractedTime}
                </span>
              </p>
              <p className="text-sm text-muted-foreground">AI Engine v2.1</p>
              <p className="text-sm text-muted-foreground">
                Extracted 8 fields with {(invoice as any).accuracy} confidence
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
      <div className="p-6 text-center text-red-400 font-medium">
        ❌ Couldn't find invoice <b>{invoiceId}</b>
      </div>
    );

  const downloadJSON = () => {
    const json = JSON.stringify(invoice, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), {
      href: url,
      download: `${invoice.invoiceNumber}.json`,
    });
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadCSV = () => {
    const csv = Object.entries(invoice)
      .map(([key, val]) => `"${key}","${val}"`)
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), {
      href: url,
      download: `${invoice.invoiceNumber}.csv`,
    });
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="px-4 sm:px-6 md:px-8 py-8 space-y-10 max-w-screen-xl mx-auto">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{invoice.vendor}</h1>
          <p className="text-muted-foreground">{invoice.invoiceNumber}</p>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="border-emerald-500/60 text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20"
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

      {/* STATUS STEP BAR */}
      <div className="w-full overflow-x-auto scrollbar-hide">
        <div className="flex gap-4 min-w-max px-2 py-4 bg-card rounded-xl border border-border">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.key}
                className="flex items-center gap-2 border border-emerald-500 text-emerald-500 text-sm font-medium px-4 py-2 rounded-full bg-emerald-500/10 whitespace-nowrap"
              >
                <Icon className="w-4 h-4" /> {step.label}
              </div>
            );
          })}
        </div>
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* LEFT - PREVIEW */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="font-semibold text-lg">Document Preview</h2>

          <div className="border border-border p-6 rounded-lg bg-white dark:bg-[#0B1119] overflow-x-auto sm:overflow-visible">

            {/* Header Block */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-6">
              <div>
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-500 text-xs rounded-md font-bold inline-block mb-3">
                  INVOICE
                </span>
                <p className="font-semibold">{invoice.vendor}</p>
                <p className="text-xs text-muted-foreground">123 Business Street</p>
                <p className="text-xs text-muted-foreground">City, State 12345</p>
              </div>

              <div className="text-right text-xs space-y-1">
                <p className="text-muted-foreground">Invoice #</p>
                <p className="font-semibold">{invoice.invoiceNumber}</p>
                <p className="mt-2 text-muted-foreground">Date</p>
                <p>{(invoice as any).date || "2025-12-04"}</p>
                <p className="mt-2 text-muted-foreground">Due Date</p>
                <p>{(invoice as any).dueDate || "2026-01-03"}</p>
              </div>
            </div>

            {/* Table */}
            <table className="w-full text-xs mt-8">
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

            <div className="w-full flex justify-end mt-6">
              <div className="w-full sm:w-56 text-sm space-y-1">
                <div className="flex justify-between"><span>Subtotal:</span><span>$4500.00</span></div>
                <div className="flex justify-between"><span>Tax:</span><span>$986.41</span></div>
                <div className="flex justify-between bg-emerald-400/10 px-3 py-1 rounded-md font-semibold text-emerald-500">
                  <span>Total:</span>
                  <span>{invoice.amount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT - EXTRACTED DATA */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="font-semibold text-lg">Extracted Data</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(invoice).map(([key, value]) => {
              if (["uploadedBy", "uploadedTime"].includes(key)) return null;

              return (
                <div
                  key={key}
                  className="border border-border p-4 rounded-xl flex justify-between items-center"
                >
                  <div>
                    <p className="text-xs text-muted-foreground capitalize">
                      {key.replace(/([A-Z])/g, " $1")}
                    </p>
                    <p className="font-medium text-sm">{value as string}</p>
                  </div>
                  <Badge className="bg-green-400/10 text-green-500">✓ High</Badge>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* AUDIT TRAIL */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-6">
        <h2 className="font-semibold text-lg">Audit Trail</h2>

        <div className="flex flex-col gap-10 pl-1 border-l border-border ml-2">
          <div>
            <p className="font-medium text-teal-500">
              Uploaded
              <span className="text-xs text-muted-foreground ml-2">
                {invoice.uploadedTime}
              </span>
            </p>
            <p className="text-sm text-muted-foreground">{invoice.uploadedBy}</p>
          </div>

          <div>
            <p className="font-medium text-blue-400">
              Extracted
              <span className="text-xs text-muted-foreground ml-2">
                {invoice.extractedTime}
              </span>
            </p>
            <p className="text-sm text-muted-foreground">AI Engine v2.1</p>
            <p className="text-sm text-muted-foreground">
              Extracted 8 fields with {invoice.accuracy}
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}

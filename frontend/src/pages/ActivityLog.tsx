import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { 
  Loader2, 
  Calendar, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Eye, 
  X, 
  Receipt,
  Building2,
  CalendarDays,
  Zap,
  UserCheck,
  UserX
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useInvoiceStore, Invoice } from "@/store/invoiceStore";
import { useAuth } from "@/hooks/useAuth"; 
import { cn } from "@/lib/utils";

// --- Types ---
interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

interface InvoiceDetails extends Invoice {
  subtotal?: number;
  tax?: number;
  discount?: number;
  lineItems?: LineItem[];
  rawStatus?: string; 
  approvedBy?: string; 
  approvedAt?: string; 
}

export default function ActivityLog() {
  const { invoices, setInvoices } = useInvoiceStore();
  const { user } = useAuth(); 
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDetails | null>(null);

  // 👇 FETCH REAL DATA FROM DB
  useEffect(() => {
    const fetchInvoices = async () => {
      if (!user?.email) {
        setLoading(false);
        return; 
      }

      try {
        const token = JSON.stringify({ 
            userId: user.id, 
            email: user.email 
        });

        const res = await axios.get("http://localhost:5000/api/invoices", {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data.success) {
          const currentLocalInvoices = useInvoiceStore.getState().invoices;
          const processingItems = currentLocalInvoices.filter(inv => inv.status === 'processing');

          const dbInvoices: InvoiceDetails[] = res.data.invoices.map((doc: any) => {
            
            // 1. EXTRACT DATA 
            const extracted = doc.extracted_data || {};
            const canonical = doc.canonical_data || {};
            const metadata = extracted.invoice_metadata || canonical.invoice_metadata || {};
            const vendorInfo = extracted.vendor_info || canonical.vendor_info || {};
            const pricing = extracted.pricing_summary || canonical.pricing_summary || {};
            
            const confScores = doc.confidence_scores || extracted.confidence_scores || canonical.confidence_scores || {};

            // A. Company Name Logic
            const displayVendor = 
              metadata.company_name || 
              vendorInfo.vendor_name || 
              "Unknown Vendor";

            // B. STATUS LOGIC
            const dbStatusRaw = doc.status || confScores.status || confScores.field_confidence?.status || '';
            const confidence = confScores.overall_confidence || 0;

            let finalStatus: Invoice['status'] = 'approved';

            if (dbStatusRaw === 'rejected') {
                finalStatus = 'rejected';
            } else if (dbStatusRaw === 'approved') {
                finalStatus = 'approved';
            } else if (dbStatusRaw === 'needs_review' || dbStatusRaw === 'review_needed') {
                finalStatus = 'pending_review';
            } else if (confidence < 85) {
                finalStatus = 'pending_review';
            } else {
                finalStatus = 'auto_approved';
            }

            // C. Helper: Number Parser
            const parseNum = (val: any) => {
              if (typeof val === 'number') return val;
              if (typeof val === 'string') return parseFloat(val.replace(/[^0-9.-]+/g, "")) || 0;
              return 0;
            };

            // D. Amounts & Currency
            const rawTotal = pricing.total_amount || metadata.total_amount || 0;
            const rawSubtotal = pricing.subtotal || metadata.subtotal || 0;
            const amountValue = parseNum(rawTotal);
            const subtotalValue = parseNum(rawSubtotal);
            const currency = pricing.currency || metadata.currency || "USD";

            // E. Line Items
            const rawItems = extracted.items || canonical.items || []; 
            const lineItems = Array.isArray(rawItems) ? rawItems.map((item: any) => ({
                description: item.item_name || item.description || "Item",
                quantity: parseNum(item.quantity || 1),
                unit_price: parseNum(item.unit_price || item.price || 0),
                amount: parseNum(item.line_total || item.amount || item.total || 0)
            })) : [];

            // F. Tax Logic
            let taxValue = parseNum(pricing.tax);
            if (!taxValue && amountValue > subtotalValue) {
               taxValue = amountValue - subtotalValue;
            }

            // G. Dates
            const processedDate = doc.created_at || doc.updated_at || new Date().toISOString();
            const invoiceDate = metadata.date || processedDate;

            return {
              id: doc._id,
              fileName: doc.fileName || "scanned_doc.pdf",
              vendor: displayVendor,
              amount: amountValue,
              currency: currency,
              date: invoiceDate,
              status: finalStatus,
              rawStatus: dbStatusRaw,
              confidence: confidence,
              extractedData: extracted,
              createdAt: processedDate,
              updatedAt: doc.updated_at || new Date().toISOString(),
              subtotal: subtotalValue,
              tax: taxValue,
              discount: 0, 
              lineItems: lineItems,
              approvedBy: doc.approved_by, 
              approvedAt: doc.approved_at
            };
          });

          dbInvoices.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setInvoices([...processingItems, ...dbInvoices]);
        }
      } catch (error) {
        console.error("Failed to fetch history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [setInvoices, user]);

  if (loading && invoices.length === 0) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  // --- Helper to Render Status Badge ---
  const renderStatusBadge = (status: string) => {
    switch (status) {
        case 'auto_approved':
            return (
                <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 capitalize whitespace-nowrap flex gap-1 items-center">
                    <Zap className="w-3 h-3 fill-emerald-600" /> Auto-Approved
                </Badge>
            );
        case 'pending_review':
            return (
                <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 capitalize whitespace-nowrap flex gap-1 items-center">
                    <AlertCircle className="w-3 h-3" /> Needs Review
                </Badge>
            );
        case 'rejected':
            return (
                <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 capitalize whitespace-nowrap">
                    Rejected
                </Badge>
            );
        default:
            return (
                <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 capitalize whitespace-nowrap">
                    Approved
                </Badge>
            );
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 py-8 relative">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Activity Feed</h1>
        <p className="text-muted-foreground">
          Real-time processing queue and history
        </p>
      </div>

      <div className="space-y-4">
        {invoices.length === 0 && !loading && (
          <div className="text-center py-10 text-muted-foreground">No activity yet.</div>
        )}

        {invoices.map((inv) => (
          <motion.div
            key={inv.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className={cn(
              "overflow-hidden transition-all",
              inv.status === 'processing' ? "border-emerald-500/50 bg-emerald-500/5" : "hover:border-border/80"
            )}>
              <CardContent className="p-0">
                <div className="p-5 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                  
                  {/* LEFT SIDE: Icon & Main Info */}
                  <div className="flex items-start gap-4 flex-1">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                      inv.status === 'processing' ? "bg-emerald-500/10 text-emerald-600" : 
                      inv.status === 'pending_review' ? "bg-amber-500/10 text-amber-600" :
                      inv.status === 'rejected' ? "bg-red-500/10 text-red-600" :
                      "bg-blue-500/10 text-blue-600"
                    )}>
                      {inv.status === 'processing' ? <Loader2 className="w-5 h-5 animate-spin" /> : 
                       inv.status === 'pending_review' ? <AlertCircle className="w-5 h-5" /> : 
                       inv.status === 'rejected' ? <X className="w-5 h-5" /> :
                       <CheckCircle2 className="w-5 h-5" />}
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-foreground truncate max-w-[200px] sm:max-w-[300px]" title={inv.vendor}>
                          {inv.status === 'processing' ? "Processing..." : inv.vendor}
                        </h3>
                        {inv.status !== 'processing' && renderStatusBadge(inv.status)}
                      </div>
                      
                      <div className="flex flex-wrap gap-x-4 text-sm text-muted-foreground items-center">
                        {/* Filename removed here */}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> 
                          {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : "N/A"}
                        </span>
                        
                        {/* APPROVED / REJECTED INFO */}
                        {inv.approvedBy && (
                          <>
                            {inv.status === 'approved' && (
                              <span className="flex items-center gap-1 text-blue-600/80 bg-blue-50 px-2 py-0.5 rounded text-[11px] font-medium border border-blue-100 whitespace-normal">
                                <UserCheck className="w-3 h-3 flex-shrink-0" /> 
                                Approved by {inv.approvedBy}
                              </span>
                            )}
                            {inv.status === 'rejected' && (
                              <span className="flex items-center gap-1 text-red-600/80 bg-red-50 px-2 py-0.5 rounded text-[11px] font-medium border border-red-100 whitespace-normal">
                                <UserX className="w-3 h-3 flex-shrink-0" /> 
                                Rejected by {inv.approvedBy}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* RIGHT SIDE: Amount & Actions */}
                  {inv.status !== 'processing' && (
                    <div className="flex items-center gap-6 justify-between sm:justify-end w-full sm:w-auto mt-2 sm:mt-0">
                      <div className="text-right">
                        <div className="font-bold text-lg whitespace-nowrap">
                          {inv.currency} {inv.amount ? inv.amount.toLocaleString(undefined, {minimumFractionDigits: 2}) : "0.00"}
                        </div>
                        <div className={cn(
                          "flex items-center justify-end gap-1 text-xs font-medium",
                          inv.confidence > 80 ? "text-emerald-600" : "text-amber-600"
                        )}>
                          <CheckCircle2 className="w-3 h-3" /> {inv.confidence}% Conf.
                        </div>
                      </div>

                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-full hover:bg-secondary"
                        onClick={() => setSelectedInvoice(inv as InvoiceDetails)}
                      >
                        <Eye className="w-5 h-5 text-muted-foreground" />
                      </Button>
                    </div>
                  )}

                  {inv.status === 'processing' && (
                    <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium animate-pulse ml-auto">
                      Analyzing document...
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ======================= */}
      {/* 👁️ INVOICE DETAILS MODAL */}
      {/* ======================= */}
      <AnimatePresence>
        {selectedInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card w-full max-w-2xl rounded-xl shadow-2xl border border-border overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* HEADER */}
              <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-primary"/>
                  <h2 className="font-bold text-lg">Invoice Details</h2>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setSelectedInvoice(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* BODY */}
              <div className="p-6 overflow-y-auto space-y-6">
                
                {/* 1. Summary Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-secondary/50 space-y-1">
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><Building2 className="w-3 h-3"/> Company</p>
                    <p className="font-semibold text-base truncate" title={selectedInvoice.vendor}>{selectedInvoice.vendor}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/50 space-y-1">
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><CalendarDays className="w-3 h-3"/> Date</p>
                    <p className="font-semibold text-base">
                      {selectedInvoice.date ? new Date(selectedInvoice.date).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* 2. Line Items Table */}
                <div>
                  <h3 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wider">Line Items</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-muted/50 text-muted-foreground">
                        <tr>
                          <th className="p-3 font-medium">Description</th>
                          <th className="p-3 font-medium text-right">Qty</th>
                          <th className="p-3 font-medium text-right">Price</th>
                          <th className="p-3 font-medium text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {selectedInvoice.lineItems && selectedInvoice.lineItems.length > 0 ? (
                          selectedInvoice.lineItems.map((item, idx) => (
                            <tr key={idx} className="hover:bg-muted/20">
                              <td className="p-3 max-w-[200px] truncate">{item.description}</td>
                              <td className="p-3 text-right">{item.quantity}</td>
                              <td className="p-3 text-right">
                                {item.unit_price > 0 && selectedInvoice.currency} {item.unit_price > 0 ? item.unit_price.toFixed(2) : '-'}
                              </td>
                              <td className="p-3 text-right font-medium">
                                {selectedInvoice.currency} {item.amount.toFixed(2)}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="p-4 text-center text-muted-foreground italic">
                              No line items extracted.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 3. Totals Breakdown */}
                <div className="flex justify-end">
                  <div className="w-full sm:w-1/2 space-y-2 border-t pt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{selectedInvoice.currency} {selectedInvoice.subtotal?.toFixed(2) || "0.00"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax</span>
                      <span>{selectedInvoice.currency} {selectedInvoice.tax?.toFixed(2) || "0.00"}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                      <span>Total</span>
                      <span>{selectedInvoice.currency} {selectedInvoice.amount?.toFixed(2)}</span>
                    </div>
                    
                    {/* Approval Info in Modal */}
                    {selectedInvoice.approvedBy && (
                      <div className={cn(
                        "p-2 rounded text-xs mt-2 flex items-center gap-2 border",
                        selectedInvoice.status === 'rejected' ? "bg-red-50 text-red-700 border-red-100" : "bg-blue-50 text-blue-700 border-blue-100"
                      )}>
                        {selectedInvoice.status === 'rejected' ? <UserX className="w-3 h-3"/> : <UserCheck className="w-3 h-3" />}
                        {selectedInvoice.status === 'rejected' ? "Rejected" : "Approved"} by <b>{selectedInvoice.approvedBy}</b>
                      </div>
                    )}

                    <div className="flex justify-between text-xs mt-2">
                      <span className="text-muted-foreground">AI Confidence</span>
                      <Badge variant={selectedInvoice.confidence > 80 ? 'success' : 'warning'}>
                        {selectedInvoice.confidence}%
                      </Badge>
                    </div>
                  </div>
                </div>

              </div>
              
              {/* FOOTER */}
              <div className="p-4 bg-muted/30 border-t flex justify-end">
                <Button onClick={() => setSelectedInvoice(null)}>Close Details</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
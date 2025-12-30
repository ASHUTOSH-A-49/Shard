import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../lib/api.ts"; // Use central API instance
import {
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  X,
  Calendar,
  DollarSign,
  Building2,
  FileText,
  Loader2
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

// --- Types ---
interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

interface ReviewInvoice {
  id: string;
  companyName: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  date: string;
  confidenceLevel: 'low' | 'medium' | 'high';
  confidenceScore: number;
  subtotal: number;
  tax: number;
  lineItems: LineItem[];
}

export default function ReviewQueue() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<ReviewInvoice[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [reviewItem, setReviewItem] = useState<ReviewInvoice | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // 👇 FETCH DATA FROM REVIEW QUEUE ENDPOINT
  useEffect(() => {
    const fetchQueue = async () => {
      if (!user?.email) return;

      try {
        setLoading(true);
        // Direct call to review-queue endpoint
        const res = await api.get("/api/review-queue");

        if (res.data.invoices) {
          const mappedItems = res.data.invoices.map((doc: any) => {
            const extracted = doc.extracted_data || {};
            const canonical = doc.canonical_data || {};
            const metadata = extracted.invoice_metadata || canonical.invoice_metadata || {};
            const vendorInfo = extracted.vendor_info || canonical.vendor_info || {};
            const pricing = extracted.pricing_summary || canonical.pricing_summary || {};
            const confScores = doc.confidence_scores || {};
            
            const parseNum = (val: any) => 
              typeof val === 'string' ? parseFloat(val.replace(/[^0-9.-]+/g, "")) || 0 : val || 0;

            return {
              id: doc._id,
              companyName: metadata.company_name || vendorInfo.vendor_name || "Unknown Vendor",
              invoiceNumber: metadata.invoice_number || "N/A",
              amount: parseNum(pricing.total_amount || metadata.total_amount),
              currency: pricing.currency || "USD",
              date: metadata.date || doc.created_at,
              confidenceLevel: confScores.field_confidence?.confidence_level || 'medium',
              confidenceScore: confScores.overall_confidence || 0,
              subtotal: parseNum(pricing.subtotal || metadata.subtotal),
              tax: parseNum(pricing.tax?.tax_amount || pricing.tax || 0),
              lineItems: (extracted.items || canonical.items || []).map((item: any) => ({
                description: item.item_name || item.description || "Item",
                quantity: parseNum(item.quantity || 1),
                unit_price: parseNum(item.unit_price || item.price || 0),
                amount: parseNum(item.line_total || item.amount || 0)
              }))
            };
          });

          setInvoices(mappedItems);
        }
      } catch (error) {
        console.error("Queue fetch error:", error);
        toast.error("Failed to load review queue");
      } finally {
        setLoading(false);
      }
    };

    fetchQueue();
  }, [user]);

  // 👇 HANDLE DECISION (Approve/Reject)
  const handleDecision = async (id: string, decision: 'approved' | 'rejected') => {
    if (!user) return;
    setProcessingId(id);

    try {
      // Points to: /api/invoices/<id>/status
      await api.put(`/api/invoices/${id}/status`, {
        status: decision,
        approved_by: user?.email
      });

      toast.success(`Invoice ${decision === 'approved' ? 'Approved' : 'Rejected'} successfully`);
      setInvoices(prev => prev.filter(inv => inv.id !== id));
      setReviewItem(null);
    } catch (error) {
      console.error("Update failed:", error);
      toast.error("Failed to update invoice status");
    } finally {
      setProcessingId(null);
    }
  };

  const filteredInvoices = invoices.filter(inv => 
    inv.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getLevelColor = (level: string) => {
    switch(level) {
      case 'high': return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case 'medium': return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case 'low': return "bg-red-500/10 text-red-500 border-red-500/20";
      default: return "bg-gray-500/10 text-gray-500";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 py-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-foreground">Review Queue</h1>
        <p className="text-muted-foreground mt-1">
          {invoices.length} invoices require manual verification
        </p>
      </motion.div>

      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by vendor or invoice #..."
              className="pl-10 bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {filteredInvoices.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-emerald-500/50" />
            <p>All caught up! No invoices pending review.</p>
          </div>
        ) : (
          filteredInvoices.map((inv) => (
            <motion.div key={inv.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="border-border hover:border-emerald-500/30 transition-all bg-card/50">
                <CardContent className="p-5 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold truncate max-w-[250px]" title={inv.companyName}>
                        {inv.companyName}
                      </h3>
                      <Badge variant="outline" className={`capitalize ${getLevelColor(inv.confidenceLevel)}`}>
                        {inv.confidenceLevel} Confidence
                      </Badge>
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                        Needs Review
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" /> {inv.invoiceNumber}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> 
                        {new Date(inv.date).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1 text-foreground font-medium">
                        <DollarSign className="w-3.5 h-3.5" /> 
                        {inv.currency} {inv.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
                    <div className="text-right mr-2 hidden md:block">
                       <p className="text-xs text-muted-foreground">AI Score</p>
                       <p className={`font-bold ${inv.confidenceScore > 80 ? 'text-emerald-500' : 'text-amber-500'}`}>
                         {inv.confidenceScore}%
                       </p>
                    </div>
                    <Button 
                      className="bg-emerald-600 hover:bg-emerald-700 text-white w-full md:w-auto"
                      onClick={() => setReviewItem(inv)}
                    >
                      Review Invoice
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {reviewItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card w-full max-w-3xl rounded-xl shadow-2xl border border-border overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500"/>
                  <h2 className="font-bold text-lg">Manual Review Required</h2>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setReviewItem(null)} disabled={!!processingId}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <Building2 className="w-3 h-3" /> Vendor
                    </p>
                    <p className="font-semibold text-lg truncate" title={reviewItem.companyName}>
                      {reviewItem.companyName}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Date
                    </p>
                    <p className="font-semibold text-lg">
                      {new Date(reviewItem.date).toDateString()}
                    </p>
                  </div>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-muted/50 px-4 py-2 border-b text-xs font-semibold text-muted-foreground uppercase">
                    Line Items Extracted
                  </div>
                  <div className="max-h-[200px] overflow-y-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-muted/20 text-muted-foreground sticky top-0">
                        <tr>
                          <th className="p-3 font-medium">Description</th>
                          <th className="p-3 font-medium text-right">Qty</th>
                          <th className="p-3 font-medium text-right">Price</th>
                          <th className="p-3 font-medium text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {reviewItem.lineItems.length > 0 ? (
                          reviewItem.lineItems.map((item, idx) => (
                            <tr key={idx}>
                              <td className="p-3">{item.description}</td>
                              <td className="p-3 text-right">{item.quantity}</td>
                              <td className="p-3 text-right">{item.unit_price.toFixed(2)}</td>
                              <td className="p-3 text-right font-medium">{item.amount.toFixed(2)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="p-4 text-center text-muted-foreground italic">
                              No items extracted
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-end">
                  <div className="w-full sm:w-1/2 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{reviewItem.currency} {reviewItem.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax</span>
                      <span>{reviewItem.currency} {reviewItem.tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold border-t pt-3 mt-2">
                      <span>Total</span>
                      <span>{reviewItem.currency} {reviewItem.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-muted/30 border-t flex gap-3 justify-end">
                <Button 
                  variant="outline" 
                  className="flex-1 sm:flex-none border-red-200 text-red-600 hover:bg-red-50"
                  onClick={() => handleDecision(reviewItem.id, 'rejected')}
                  disabled={!!processingId}
                >
                  {processingId === reviewItem.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <XCircle className="w-4 h-4 mr-2" />}
                  Reject Invoice
                </Button>
                
                <Button 
                  className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => handleDecision(reviewItem.id, 'approved')}
                  disabled={!!processingId}
                >
                  {processingId === reviewItem.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <CheckCircle className="w-4 h-4 mr-2" />}
                  Approve & Process
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
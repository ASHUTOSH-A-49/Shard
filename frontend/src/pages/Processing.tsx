import { motion } from 'framer-motion';
import { Clock, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useInvoiceStore } from '@/store/invoiceStore';


export default function Processing() {
  const { invoices } = useInvoiceStore();
  const processingInvoices = invoices.filter(inv => inv.status === 'processing');

  return (
    <div className="space-y-6 p-4 sm:p-0">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
          Processing Queue
        </h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          {processingInvoices.length} invoices currently being processed
        </p>
      </motion.div>

      {/* Processing List */}
      {processingInvoices.length > 0 ? (
        <div className="space-y-4">
          {processingInvoices.map((invoice, index) => (
            <motion.div
              key={invoice.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
            >
              <Card>
                <CardContent className="p-4 sm:p-6">
                  {/* MAIN ROW */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    
                    {/* Left side (icon + name) */}
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary animate-spin" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm sm:text-base break-all">
                          {invoice.fileName}
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Started {new Date(invoice.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <Badge
                      variant="processing"
                      className="self-start sm:self-center text-xs sm:text-sm px-3 py-1"
                    >
                      Processing
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent className="py-10 sm:py-12 text-center px-6">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-secondary flex items-center justify-center mx-auto mb-4">
                <Clock className="w-7 h-7 sm:w-8 sm:h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
                No Active Processing
              </h3>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                All invoices have been processed. Upload a new invoice to continue.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import api from "../lib/api.ts";
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineCloudArrowUp,
  HiOutlineDocumentText,
  HiOutlineSparkles,
  HiOutlineCheckCircle,
  HiOutlineDocumentDuplicate,
  HiOutlineArrowPath
} from 'react-icons/hi2';
import { useInvoiceStore } from '@/store/invoiceStore';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type UploadMode = 'single' | 'batch';

const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const { addInvoice, updateInvoice } = useInvoiceStore();
  const { user } = useAuth();

  const [uploadMode, setUploadMode] = useState<UploadMode>('single');
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [batchFiles, setBatchFiles] = useState<File[]>([]);

  // SINGLE UPLOAD HANDLER
  const onDropSingle = useCallback(async (files: File[]) => {
    if (!files.length) return;
    const file = files[0];
    
    setIsProcessing(true);
    const tempId = Date.now().toString();

    // 1. Initial Store Entry (Processing State)
    addInvoice({
      id: tempId,
      fileName: file.name,
      vendor: "AI Analyzing...",
      amount: 0,
      currency: "USD",
      date: new Date().toISOString(),
      status: 'processing',
      confidence: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    try {
      const formData = new FormData();
      formData.append("file", file);

      // 2. Auth Sync: Use email if available, otherwise fallback to local username
      const identifier = user?.email || localStorage.getItem('username') || "guest_user";
      
      const token = JSON.stringify({ 
        userId: user?.id || identifier,
        email: user?.email || identifier,
        username: localStorage.getItem('username') || identifier
      });

      // 3. API Call
      const res = await api.post('/api/extract', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      const response = res.data;

      if (!response.success) {
        throw new Error(response.error || "AI Extraction failed");
      }

      // 4. Data Transformation for UI Display
      const canonical = response.canonical_data || {};
      const confidenceMap = response.confidence?.field_confidence || {};
      
      const formattedFields = Object.entries(canonical).map(([key, field]: any) => ({
        key: key.replace(/_/g, ' '), // Prettify keys for UI
        value: field.value !== undefined ? field.value : field,
        confidence: confidenceMap[key] || response.confidence?.overall_confidence || 85,
      }));

      // 5. Update Store with Success Results
      updateInvoice(tempId, {
        status: response.status === 'approved' ? 'approved' : 'pending_review',
        vendor: canonical.vendor_name?.value || "Extracted Vendor",
        amount: parseFloat(canonical.total_amount?.value || 0),
        confidence: Math.round(response.confidence?.overall_confidence || 0),
        extractedData: response.extracted_data
      });

      setExtractedData({
        invoiceId: response.invoice_id,
        fields: formattedFields,
        overallConfidence: Math.round(response.confidence?.overall_confidence || 88),
        fileName: file.name,
      });

      toast.success("AI extraction successful!");

    } catch (error: any) {
      console.error("❌ Upload Error:", error);
      const errorMsg = error?.response?.data?.error || "Connection error to AI engine";
      toast.error(errorMsg);
      updateInvoice(tempId, { status: 'failed' });
    } finally {
      setIsProcessing(false);
    }
  }, [addInvoice, updateInvoice, user]);

  const { getRootProps: getSingleRootProps, getInputProps: getSingleInputProps, isDragActive: isSingleActive } = useDropzone({
    onDrop: onDropSingle,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    multiple: false,
    disabled: uploadMode !== 'single' || isProcessing
  });

  const { getRootProps: getBatchRootProps, getInputProps: getBatchInputProps, isDragActive: isBatchActive } = useDropzone({
    onDrop: (files) => {
        setBatchFiles((prev) => [...prev, ...files]);
        toast.info(`${files.length} files added to batch queue`);
    },
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    disabled: uploadMode !== 'batch' || isProcessing
  });

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 md:p-10 font-sans transition-all">
      <div className="max-w-4xl mx-auto space-y-8">

        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Upload Invoice</h1>
          <p className="text-muted-foreground text-sm">Let Shard AI automate your data entry</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { id: 'single', label: 'Single Upload', icon: HiOutlineDocumentText, desc: 'Extract one document' },
            { id: 'batch', label: 'Batch Upload', icon: HiOutlineDocumentDuplicate, desc: 'Process multiple files' },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => { setUploadMode(mode.id as UploadMode); setExtractedData(null); }}
              className={cn(
                "p-5 rounded-xl border text-left group bg-card transition-all",
                uploadMode === mode.id
                  ? "border-emerald-500/50 shadow-md dark:bg-emerald-500/5 bg-emerald-50/50"
                  : "border-border hover:border-emerald-500/30"
              )}
            >
              <mode.icon className={cn("w-6 h-6 mb-3", uploadMode === mode.id ? "text-emerald-500" : "text-muted-foreground")} />
              <div className="font-bold">{mode.label}</div>
              <div className="text-sm text-muted-foreground">{mode.desc}</div>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {!extractedData ? (
            <motion.div 
              key={uploadMode} 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div
                {...(uploadMode === "single" ? getSingleRootProps() : getBatchRootProps())}
                className={cn(
                  "border-2 border-dashed rounded-2xl w-full transition-all cursor-pointer",
                  "flex flex-col items-center justify-center text-center",
                  "p-10 sm:p-16 md:p-20 min-h-[300px]",
                  (isSingleActive || isBatchActive)
                    ? "border-emerald-500 bg-emerald-500/5"
                    : "border-border bg-card hover:border-emerald-500/20"
                )}
              >
                <input {...(uploadMode === "single" ? getSingleInputProps() : getBatchInputProps())} />

                {isProcessing ? (
                  <div className="flex flex-col items-center space-y-4">
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
                      <HiOutlineSparkles className="w-14 h-14 text-emerald-500" />
                    </motion.div>
                    <div className="space-y-1">
                      <h2 className="text-lg font-bold">Extracting Data...</h2>
                      <p className="text-muted-foreground text-sm">Our AI is reading your invoice fields</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="p-4 rounded-full bg-emerald-500/10 mb-4">
                      <HiOutlineCloudArrowUp className="w-10 h-10 text-emerald-500" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold">
                      {uploadMode === "batch" ? "Select Multiple Files" : "Drag & drop invoice"}
                    </h2>
                    <p className="text-muted-foreground text-sm mt-1">Supports PDF, JPG, and PNG</p>

                    <div className="flex gap-2 mt-6">
                      {['PDF', 'JPG', 'PNG'].map(ext => (
                        <span key={ext} className="px-3 py-1 rounded-md text-[10px] font-bold border bg-secondary text-secondary-foreground">
                          {ext}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
              <Card className="bg-card border-border rounded-2xl overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="bg-emerald-500/10 p-3 rounded-xl text-emerald-500">
                        <HiOutlineDocumentText size={24} />
                      </div>
                      <div>
                        <div className="font-bold text-lg">{extractedData.fileName}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <HiOutlineCheckCircle className="text-emerald-500" /> AI confidence score calculated
                        </div>
                      </div>
                    </div>
                    <div className="bg-emerald-500 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-sm">
                      {extractedData.overallConfidence}% Accuracy
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {extractedData.fields.map((field: any, idx: number) => (
                  <div
                    key={idx}
                    className="bg-card border border-border rounded-xl p-4 hover:shadow-sm transition-shadow"
                  >
                    <div className="text-[10px] uppercase text-muted-foreground font-bold flex justify-between mb-2">
                      {field.key}
                      <span className={cn(field.confidence > 80 ? "text-emerald-500" : "text-amber-500")}>
                        {field.confidence}%
                      </span>
                    </div>

                    <div className="font-semibold text-sm break-words whitespace-pre-wrap">
                      {typeof field.value === "object" && field.value !== null
                        ? JSON.stringify(field.value, null, 2)
                        : field.value || "Not found"}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border mt-4">
                <Button onClick={() => navigate('/activity')} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-12 rounded-xl">
                  <HiOutlineCheckCircle className="mr-2 w-5 h-5" /> Confirm & View in Activity
                </Button>
                <Button variant="outline" onClick={() => setExtractedData(null)} className="h-12 rounded-xl border-border">
                  <HiOutlineArrowPath className="mr-2 w-5 h-5" /> Upload Another
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default UploadPage;
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
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

// Removed 'email' from type
type UploadMode = 'single' | 'batch';

const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const { addInvoice, updateInvoice } = useInvoiceStore();
  const { user } = useAuth(); 

  const [uploadMode, setUploadMode] = useState<UploadMode>('single');
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [batchFiles, setBatchFiles] = useState<File[]>([]);

  // SINGLE UPLOAD
  const onDropSingle = useCallback(async (files: File[]) => {
    if (!files.length) return;
    const file = files[0];
    
    setIsProcessing(true);

    const tempId = Date.now().toString();

    // ADD TO STORE
    addInvoice({
      id: tempId,
      fileName: file.name,
      vendor: "Analyzing...",
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

      const userEmail = user?.email || "guest@example.com";
      const userId = user?.id || "guest_123";
      
      const token = JSON.stringify({ 
        userId: userId,
        email: userEmail 
      });

      const res = await axios.post(
        "http://localhost:5000/api/extract",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const response = res.data;
      console.log("🔎 Backend Response:", response);

      if (!response.success) {
        throw new Error(response.error || "Extraction failed");
      }

      // Format fields for UI
      const formattedFields = Object.entries(response.canonical_data).map(
        ([key, value]: any) => ({
          key,
          value,
          confidence: response.confidence?.[key] ?? 90,
        })
      );

      // UPDATE STORE: Success
      updateInvoice(tempId, {
        status: 'approved',
        vendor: response.canonical_data.vendor_name?.value || "Unknown Vendor",
        amount: typeof response.canonical_data.total_amount?.value === 'number' 
          ? response.canonical_data.total_amount.value 
          : 0,
        confidence: response.confidence?.overall || 0,
        extractedData: response.extracted_data
      });

      setExtractedData({
        invoiceId: response.invoice_id, 
        fields: formattedFields,
        overallConfidence: response.confidence?.overall ?? 88,
        fileName: file.name,
      });

      toast.success("🚀 Extraction complete!");

    } catch (error: any) {
      console.error("❌ Upload/Extraction failed:", error);
      const errorMsg = error?.response?.data?.error || "Server error";
      toast.error(errorMsg);

      updateInvoice(tempId, { status: 'failed' });

    } finally {
      setIsProcessing(false);
    }
  }, [addInvoice, updateInvoice, user]);

  // SINGLE DROPZONE CONFIG (Removed TIFF)
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

  // BATCH DROPZONE CONFIG (Removed TIFF)
  const { getRootProps: getBatchRootProps, getInputProps: getBatchInputProps, isDragActive: isBatchActive } = useDropzone({
    onDrop: (files) => setBatchFiles((prev) => [...prev, ...files]),
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
          <p className="text-muted-foreground text-sm">Drop your invoice & let AI handle extraction</p>
        </div>

        {/* MODES - Removed Email Option */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { id: 'single', label: 'Single Upload', icon: HiOutlineDocumentText, desc: 'One at a time' },
            { id: 'batch', label: 'Batch Upload', icon: HiOutlineDocumentDuplicate, desc: 'Upload many' },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => { setUploadMode(mode.id as UploadMode); setExtractedData(null); }}
              className={cn(
                "p-5 rounded-xl border text-left group bg-card transition-all",
                uploadMode === mode.id
                  ? "border-emerald-500/50 shadow dark:bg-[#111] bg-emerald-50/50"
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
            <motion.div key={uploadMode} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

              <div
                {...(uploadMode === "single" ? getSingleRootProps() : getBatchRootProps())}
                className={cn(
                  "border-2 border-dashed rounded-2xl w-full transition-all cursor-pointer",
                  "flex flex-col items-center justify-center text-center",
                  "p-10 sm:p-16 md:p-20 min-h-[280px] sm:min-h-[350px] md:min-h-[400px]",
                  (isSingleActive || isBatchActive)
                    ? "border-emerald-500 bg-emerald-500/10"
                    : "border-border bg-card hover:border-emerald-500/40"
                )}
              >
                <input {...(uploadMode === "single" ? getSingleInputProps() : getBatchInputProps())} />

                {isProcessing ? (
                  <div className="flex flex-col items-center space-y-4">
                    <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 1.3 }}>
                      <HiOutlineSparkles className="w-14 h-14 text-emerald-500" />
                    </motion.div>
                    <h2 className="text-lg font-bold leading-tight">AI is extracting data…</h2>
                    <p className="text-muted-foreground text-sm">Processing fields & verifying accuracy</p>
                  </div>
                ) : (
                  <>
                    <div className="p-4 rounded-xl border mb-4">
                      <HiOutlineCloudArrowUp className="w-12 h-12 text-emerald-500" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold leading-tight">
                      {uploadMode === "batch" ? "Drop multiple files" : "Drag & drop invoice here"}
                    </h2>
                    <p className="text-muted-foreground text-sm mt-1">or click to browse</p>

                    {/* Removed TIFF tag */}
                    <div className="flex flex-wrap justify-center gap-2 mt-6">
                      {['PDF', 'JPG', 'PNG'].map(ext => (
                        <span key={ext} className="bg-emerald-500 px-3 py-1 rounded text-xs font-bold border uppercase text-white">
                          {ext}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          ) : (

            /* RESULTS */
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

              <Card className="bg-card border-border rounded-2xl shadow-lg">
                <CardContent className="p-6 space-y-6">

                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 text-emerald-500">
                        <HiOutlineDocumentText size={28} />
                      </div>
                      <div>
                        <div className="font-bold">{extractedData.fileName}</div>
                        <div className="text-xs text-muted-foreground">Processed successfully</div>
                      </div>
                    </div>

                    <div className="bg-emerald-500/10 px-4 py-2 rounded-full border text-emerald-500 font-bold">
                      ● {extractedData.overallConfidence}% (High)
                    </div>
                  </div>

                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {extractedData.fields.map((field: any) => (
                  <div
                    key={field.key}
                    className="bg-card border border-border rounded-xl p-5 hover:border-emerald-500/40 transition"
                  >
                    <div className="text-xs uppercase text-muted-foreground font-bold flex justify-between">
                      {field.key}
                      <span className="text-emerald-500">● {field.confidence}%</span>
                    </div>

                    <div className="font-medium whitespace-pre-wrap">
                      {typeof field.value === "object" && field.value !== null
                        ? Object.entries(field.value)
                            .map(([k, v]) => `${k}: ${v ?? "N/A"}`)
                            .join("\n")
                        : field.value}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button onClick={() => navigate('/activity')} className="flex-1 bg-emerald-500 text-white font-black h-12 rounded-xl">
                  <HiOutlineCheckCircle className="mr-2" /> Approve & View Feed
                </Button>
                <Button variant="outline" onClick={() => setExtractedData(null)} className="h-12 rounded-xl font-bold">
                  <HiOutlineArrowPath className="mr-2" /> Upload Another
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
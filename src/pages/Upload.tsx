import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HiOutlineCloudArrowUp, 
  HiOutlineDocumentText, 
  HiOutlineSparkles, 
  HiOutlineUser,
  HiOutlineCheckCircle,
  HiOutlineEnvelope,
  HiOutlineArchiveBox,
  HiOutlineDocumentDuplicate,
  HiOutlineXMark,
  HiOutlineArrowPath
} from 'react-icons/hi2';
import { useInvoiceStore } from '@/store/invoiceStore';
import { mockApi } from '@/services/mockApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type UploadMode = 'single' | 'batch' | 'email';

const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const { addInvoice, confidenceThresholds } = useInvoiceStore();
  
  const [uploadMode, setUploadMode] = useState<UploadMode>('single');
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [batchFiles, setBatchFiles] = useState<File[]>([]);
  const [batchProgress, setBatchProgress] = useState(0);
  const [emailConfig, setEmailConfig] = useState({ email: '', connected: false, fetching: false });

  const onDropSingle = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    const file = files[0];
    setIsProcessing(true);
    
    try {
      const { invoiceId } = await mockApi.uploadDocument(file);
      const data = await mockApi.extractInvoiceData(invoiceId, file.name);
      
      setExtractedData({ ...data, invoiceId, fileName: file.name });
      setIsProcessing(false);
      toast.success('Extraction complete!');
    } catch (error) {
      toast.error('Failed to process document');
      setIsProcessing(false);
    }
  }, []);

  /*** 📌 FIXED → TIFF formats added ***/
  const { getRootProps: getSingleRootProps, getInputProps: getSingleInputProps, isDragActive: isSingleActive } = useDropzone({
  onDrop: onDropSingle,
  accept: {
    'application/pdf': ['.pdf'],
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/tiff': ['.tif', '.tiff'],
    'image/x-tiff': ['.tif', '.tiff']
  },
  multiple: false,
  disabled: uploadMode !== 'single' || isProcessing
});


  /*** 📌 batch mode also patched ***/
  const { getRootProps: getBatchRootProps, getInputProps: getBatchInputProps, isDragActive: isBatchActive } = useDropzone({
  onDrop: (files) => setBatchFiles(prev => [...prev, ...files]),
  accept: {
    'application/pdf': ['.pdf'],
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/tiff': ['.tif', '.tiff'],
    'image/x-tiff': ['.tif', '.tiff']
  },
  disabled: uploadMode !== 'batch' || isProcessing
});


  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-10 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Upload Invoice</h1>
          <p className="text-muted-foreground text-sm">Drop your invoice and watch AI extract all fields instantly</p>
        </div>

        {/* Tab Selector - Themed */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { id: 'single', label: 'Single Upload', icon: HiOutlineDocumentText, desc: 'One invoice at a time' },
            { id: 'batch', label: 'Batch Upload', icon: HiOutlineDocumentDuplicate, desc: 'Multiple documents together' },
            { id: 'email', label: 'Email Import', icon: HiOutlineEnvelope, desc: 'Connected inbox sync' },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => { setUploadMode(mode.id as UploadMode); setExtractedData(null); }}
              className={cn(
                "p-5 rounded-2xl border transition-all text-left group bg-card",
                uploadMode === mode.id 
                  ? "border-emerald-500/50 shadow-sm dark:bg-[#111] bg-emerald-50/50" 
                  : "border-border hover:border-emerald-500/30"
              )}
            >
              <mode.icon className={cn("w-6 h-6 mb-3 transition-colors", uploadMode === mode.id ? "text-emerald-500" : "text-muted-foreground")} />
              <div className="text-md font-bold">{mode.label}</div>
              <div className="text-sm text-muted-foreground">{mode.desc}</div>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {!extractedData ? (
            <motion.div key={uploadMode} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {uploadMode === 'email' ? (
                <div className="border border-border bg-card rounded-[32px] p-20 text-center space-y-6">
                  <HiOutlineEnvelope className="text-emerald-500 w-16 h-16 mx-auto" />
                  <h2 className="text-xl font-bold">Sync Email Inbox</h2>
                  <Button className="bg-primary text-primary-foreground px-8 py-2 font-bold rounded-xl h-12">Connect Gmail/Outlook</Button>
                </div>
              ) : (
                <div
                  {...(uploadMode === 'single' ? getSingleRootProps() : getBatchRootProps())}
                  className={cn(
                    "border-2 border-dashed rounded-[40px] p-24 flex flex-col items-center justify-center transition-all cursor-pointer min-h-[400px]",
                    (isSingleActive || isBatchActive) ? "border-emerald-500 bg-emerald-500/5" : "border-border bg-card hover:border-emerald-500/30"
                  )}
                >
                  <input {...(uploadMode === 'single' ? getSingleInputProps() : getBatchInputProps())} />
                  {isProcessing ? (
                    <div className="flex flex-col items-center justify-center space-y-6">
                      <motion.div 
                        animate={{ y: [0, -12, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        className="flex items-center justify-center"
                      >
                        <HiOutlineSparkles className="w-16 h-16 text-emerald-500 drop-shadow-[0_0_12px_rgba(16,185,129,0.4)]" />
                      </motion.div>
                      <div className="text-center space-y-2">
                        <h2 className="text-xl font-bold tracking-tight">AI is extracting data...</h2>
                        <p className="text-muted-foreground text-sm font-medium">Processing fields and verifying confidence scores</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className=" p-5 rounded-2xl mb-6 border border-border">
                        <HiOutlineCloudArrowUp className="w-10 h-10 text-emerald-500" />
                      </div>
                      <h2 className="text-xl font-bold">
                        {uploadMode === 'batch' ? "Drop multiple files here" : "Drag & drop invoice here"}
                      </h2>
                      <p className="text-muted-foreground mt-2 text-[16px] text-center">or click to browse from your computer</p>
                      <div className="flex gap-2 mt-8">
                         {['PDF', 'JPG', 'PNG', 'TIFF'].map(ext => (
                           <span key={ext} className="bg-emerald-500 px-3 py-1 rounded text-[12px] text-muted-foreground font-bold border border-border uppercase">{ext}</span>
                         ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          ) : (
            /* RESULTS VIEW */
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <Card className="bg-card border-border rounded-2xl overflow-hidden shadow-2xl shadow-black/5">
                <CardContent className="p-6 space-y-6">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 text-emerald-500">
                        <HiOutlineDocumentText size={28} />
                      </div>
                      <div>
                        <div className="text-lg font-bold tracking-tight">{extractedData.fileName}</div>
                        <div className="text-xs text-muted-foreground font-medium tracking-wide">Processed successfully</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-emerald-500/5 px-4 py-2 rounded-full border border-emerald-500/20">
                      <span className="text-emerald-500 text-md font-black">● {extractedData.overallConfidence}% (High)</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {[
                      { label: 'Upload', icon: HiOutlineCloudArrowUp, active: true },
                      { label: 'AI Extraction', icon: HiOutlineSparkles, active: true },
                      { label: 'Human Review', icon: HiOutlineUser, active: false },
                      { label: 'Approved', icon: HiOutlineCheckCircle, active: false },
                      { label: 'Archived', icon: HiOutlineArchiveBox, active: false },
                    ].map((step, idx, arr) => (
                      <React.Fragment key={step.label}>
                        <div className={cn(
                          "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[13px] font-bold uppercase tracking-wider transition-all",
                          step.active 
                            ? "bg-emerald-500/10 border-emerald-400/30 text-emerald-500 shadow-sm shadow-emerald-500/10" 
                            : "bg-secondary border-border text-muted-foreground opacity-70"
                        )}>
                          <step.icon size={14} />
                          {step.label}
                        </div>
                        {idx < arr.length - 1 && (
                          <div className={cn("h-[2px] w-6 shrink-0", step.active && arr[idx+1].active ? "bg-emerald-500" : "bg-border")} />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {extractedData.fields.map((field: any) => (
                  <div key={field.key} className="bg-card border border-border rounded-xl p-5 flex flex-col gap-1.5 hover:border-emerald-500/30 transition-all">
                    <div className="flex justify-between items-center text-[14px] uppercase tracking-widest text-muted-foreground font-bold">
                      {field.key}
                      <span className="text-emerald-500">● {field.confidence}%</span>
                    </div>
                    <div className="text-md font-medium">{field.value}</div>
                  </div>
                ))}
              </div>

              <div className="flex gap-4 pt-4">
                <Button onClick={() => navigate('/history')} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white dark:text-black font-black h-12 rounded-2xl text-base shadow-lg shadow-emerald-500/20">
                  <HiOutlineCheckCircle className="mr-2 w-5 h-5" /> Approve & Archive
                </Button>
                <Button variant="outline" onClick={() => setExtractedData(null)} className="border-border text-muted-foreground h-12 px-10 rounded-2xl text-base font-bold hover:bg-secondary">
                  <HiOutlineArrowPath className="mr-2 w-5 h-5" /> Cancel
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

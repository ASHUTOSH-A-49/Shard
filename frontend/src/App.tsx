import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useThemeStore } from "@/store/themeStore";
import Landing from "./pages/Landing";
import Auth from "@/pages/Auth";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import ReviewQueue from "./pages/ReviewQueue";
import History from "./pages/History";
import { AppLayout } from "./components/layout/AppLayout";
import NotFound from "./pages/NotFound";
import InvoiceDetails from "./pages/InvoiceDetails";
import Analytics from "./pages/Analytics";


const queryClient = new QueryClient();

function ThemeInitializer({ children }: { children: React.ReactNode }) {
  const { theme } = useThemeStore();
  
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);
  
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeInitializer>
        <Toaster />
        <Sonner />
        <BrowserRouter>
  <Routes>
    <Route path="/" element={<Landing />} />
    <Route path="/auth" element={<Auth />} />

    {/* Layout pages */}
    <Route element={<AppLayout />}>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/upload" element={<Upload />} />

      {/* 🔥 ADD THIS FOR INVOICE DETAILS */}
      <Route path="/processing/inv/:invoiceId" element={<InvoiceDetails />} />      
      <Route path="/review-queue" element={<ReviewQueue />} />
      <Route path="/analytics" element={<Analytics />} />
      <Route path="/history" element={<History />} />
    </Route>

    {/* 404 */}
    <Route path="*" element={<NotFound />} />
  </Routes>
</BrowserRouter>

      </ThemeInitializer>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

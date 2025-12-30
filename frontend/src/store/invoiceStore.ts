import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  fileName: string;
  vendor: string;
  amount: number;
  currency: string;
  date: string;
  status: 'processing' | 'pending_review' | 'approved' | 'rejected' | 'failed' | 'auto_approved';
  confidence: number;
  extractedData?: {
    invoiceNumber?: string;
    vendorName?: string;
    totalAmount?: number;
    lineItems?: LineItem[];
    [key: string]: any; 
  };
  createdAt: string;
  updatedAt: string;
  approvedBy?: string;
}

interface InvoiceState {
  invoices: Invoice[];
  selectedInvoice: Invoice | null;
  isLoading: boolean;
  filters: { status: string; search: string; };

  addInvoice: (invoice: Invoice) => void;
  updateInvoice: (id: string, data: Partial<Invoice>) => void;
  setInvoices: (invoices: Invoice[]) => void; 
  removeInvoice: (id: string) => void;
  setSelectedInvoice: (invoice: Invoice | null) => void;
  setFilters: (filters: Partial<InvoiceState['filters']>) => void;
  setLoading: (loading: boolean) => void;
  resetStore: () => void;
}

export const useInvoiceStore = create<InvoiceState>()(
  persist(
    (set) => ({
      invoices: [],
      selectedInvoice: null,
      isLoading: false,
      filters: { status: 'all', search: '' },

      addInvoice: (invoice) => set((state) => ({
        invoices: [invoice, ...state.invoices]
      })),

      updateInvoice: (id, data) => set((state) => ({
        invoices: state.invoices.map((inv) =>
          inv.id === id ? { ...inv, ...data, updatedAt: new Date().toISOString() } : inv
        ),
      })),

      // This overwrites local cache with fresh MongoDB data when the app loads
      setInvoices: (invoices) => set({ invoices, isLoading: false }),

      removeInvoice: (id) => set((state) => ({
        invoices: state.invoices.filter((inv) => inv.id !== id)
      })),

      setSelectedInvoice: (invoice) => set({ selectedInvoice: invoice }),
      setFilters: (newFilters) => set((state) => ({
        filters: { ...state.filters, ...newFilters }
      })),
      setLoading: (loading) => set({ isLoading: loading }),
      resetStore: () => set({ invoices: [], selectedInvoice: null }),
    }),
    {
      name: 'shard-invoice-storage', 
      storage: createJSONStorage(() => localStorage),
      // We only persist the invoices, not the loading state or filters
      partialize: (state) => ({ invoices: state.invoices }),
    }
  )
);
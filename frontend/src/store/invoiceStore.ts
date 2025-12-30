import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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
    vendorAddress?: string;
    totalAmount?: number;
    taxAmount?: number;
    dueDate?: string;
    lineItems?: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }>;
    [key: string]: any; // Allow flexibility for other extracted fields
  };
  createdAt: string;
  updatedAt: string;
}

interface InvoiceState {
  // --- State Variables ---
  invoices: Invoice[];
  selectedInvoice: Invoice | null;
  isLoading: boolean;
  filters: {
    status: string;
    search: string;
  };

  // --- Actions ---
  addInvoice: (invoice: Invoice) => void;
  updateInvoice: (id: string, data: Partial<Invoice>) => void;
  setInvoices: (invoices: Invoice[]) => void; // 👈 Used to load DB data
  removeInvoice: (id: string) => void;
  setSelectedInvoice: (invoice: Invoice | null) => void;
  setFilters: (filters: Partial<InvoiceState['filters']>) => void;
  setLoading: (loading: boolean) => void;
}

export const useInvoiceStore = create<InvoiceState>()(
  persist(
    (set) => ({
      // --- Initial State ---
      invoices: [], // Start empty, wait for DB fetch
      selectedInvoice: null,
      isLoading: false,
      filters: {
        status: 'all',
        search: '',
      },

      // --- Actions Implementation ---
      
      // Add a single invoice (e.g. when upload starts)
      addInvoice: (invoice) => set((state) => ({
        invoices: [invoice, ...state.invoices]
      })),

      // Update a specific invoice (e.g. when processing finishes)
      updateInvoice: (id, data) => set((state) => ({
        invoices: state.invoices.map((inv) =>
          inv.id === id ? { ...inv, ...data, updatedAt: new Date().toISOString() } : inv
        )
      })),

      // Overwrite list with real data from MongoDB
      setInvoices: (invoices) => set({ invoices }),

      // Remove an invoice
      removeInvoice: (id) => set((state) => ({
        invoices: state.invoices.filter((inv) => inv.id !== id)
      })),

      // Select an invoice for detail view
      setSelectedInvoice: (invoice) => set({ selectedInvoice: invoice }),

      // Update filters
      setFilters: (filters) => set((state) => ({
        filters: { ...state.filters, ...filters }
      })),

      // Toggle loading state
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'invoice-storage', // Key used in localStorage
      storage: createJSONStorage(() => localStorage),
    }
  )
);
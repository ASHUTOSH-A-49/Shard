import { create } from 'zustand';

// --- Types ---
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
    vendorAddress?: string;
    billingAddress?: string;
    taxAmount?: number;
    subtotal?: number;
    totalAmount?: number;
    dueDate?: string;
    lineItems?: LineItem[];
    [key: string]: any; 
  };
  createdAt: string;
  updatedAt: string;
  approvedBy?: string;
  approvedAt?: string;
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
  setInvoices: (invoices: Invoice[]) => void; 
  removeInvoice: (id: string) => void;
  setSelectedInvoice: (invoice: Invoice | null) => void;
  setFilters: (filters: Partial<InvoiceState['filters']>) => void;
  setLoading: (loading: boolean) => void;
  resetStore: () => void;
}

export const useInvoiceStore = create<InvoiceState>((set) => ({
  // --- Initial State ---
  invoices: [],
  selectedInvoice: null,
  isLoading: false,
  filters: {
    status: 'all',
    search: '',
  },

  // --- Actions Implementation ---
  
  // Use this only for the "immediate" upload feedback
  addInvoice: (invoice) => set((state) => ({
    invoices: [invoice, ...state.invoices]
  })),

  updateInvoice: (id, data) => set((state) => ({
    invoices: state.invoices.map((inv) =>
      inv.id === id 
        ? { ...inv, ...data, updatedAt: new Date().toISOString() } 
        : inv
    ),
    selectedInvoice: state.selectedInvoice?.id === id 
        ? { ...state.selectedInvoice, ...data, updatedAt: new Date().toISOString() } 
        : state.selectedInvoice
  })),

  // Source of Truth sync from MongoDB
  setInvoices: (invoices) => set({ 
    invoices, 
    isLoading: false 
  }),

  removeInvoice: (id) => set((state) => ({
    invoices: state.invoices.filter((inv) => inv.id !== id),
    selectedInvoice: state.selectedInvoice?.id === id ? null : state.selectedInvoice
  })),

  setSelectedInvoice: (invoice) => set({ selectedInvoice: invoice }),

  setFilters: (newFilters) => set((state) => ({
    filters: { ...state.filters, ...newFilters }
  })),

  setLoading: (loading) => set({ isLoading: loading }),

  resetStore: () => set({ 
    invoices: [], 
    selectedInvoice: null, 
    filters: { status: 'all', search: '' } 
  }),
}));
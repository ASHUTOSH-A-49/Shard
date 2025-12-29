import { create } from 'zustand';

export interface Invoice {
  id: string;
  fileName: string;
  vendor: string;
  amount: number;
  currency: string;
  date: string;
  status: 'processing' | 'pending_review' | 'approved' | 'rejected';
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
  };
  createdAt: string;
  updatedAt: string;
}

interface InvoiceState {
  invoices: Invoice[];
  queue: Invoice[];
  selectedInvoice: Invoice | null;
  isLoading: boolean;
  analytics: {
    totalProcessed: number;
    accuracyRate: number;
    avgProcessingTime: number;
    pendingReview: number;
    costSaved: number;
  };
  filters: {
    status: string;
    confidenceRange: [number, number];
    dateRange: [string, string] | null;
    search: string;
  };
  uploadInvoice: (file: File) => Promise<void>;
  approveInvoice: (id: string) => void;
  rejectInvoice: (id: string) => void;
  setSelectedInvoice: (invoice: Invoice | null) => void;
  setFilters: (filters: Partial<InvoiceState['filters']>) => void;
}

// Mock data for demo
const mockInvoices: Invoice[] = [
  {
    id: '1',
    fileName: 'invoice_001.pdf',
    vendor: 'Acme Corporation',
    amount: 2450.00,
    currency: 'USD',
    date: '2025-01-15',
    status: 'approved',
    confidence: 98,
    createdAt: '2025-01-15T10:30:00Z',
    updatedAt: '2025-01-15T10:32:00Z',
  },
  {
    id: '2',
    fileName: 'invoice_002.pdf',
    vendor: 'TechFlow Inc',
    amount: 8750.50,
    currency: 'USD',
    date: '2025-01-14',
    status: 'pending_review',
    confidence: 72,
    createdAt: '2025-01-14T14:20:00Z',
    updatedAt: '2025-01-14T14:25:00Z',
  },
  {
    id: '3',
    fileName: 'invoice_003.pdf',
    vendor: 'CloudSoft Solutions',
    amount: 1250.00,
    currency: 'USD',
    date: '2025-01-13',
    status: 'processing',
    confidence: 45,
    createdAt: '2025-01-13T09:00:00Z',
    updatedAt: '2025-01-13T09:05:00Z',
  },
  {
    id: '4',
    fileName: 'invoice_004.pdf',
    vendor: 'Global Supplies Ltd',
    amount: 3200.75,
    currency: 'USD',
    date: '2025-01-12',
    status: 'approved',
    confidence: 95,
    createdAt: '2025-01-12T16:45:00Z',
    updatedAt: '2025-01-12T16:48:00Z',
  },
  {
    id: '5',
    fileName: 'invoice_005.pdf',
    vendor: 'Innovation Labs',
    amount: 15000.00,
    currency: 'USD',
    date: '2025-01-11',
    status: 'approved',
    confidence: 99,
    createdAt: '2025-01-11T11:15:00Z',
    updatedAt: '2025-01-11T11:18:00Z',
  },
];

export const useInvoiceStore = create<InvoiceState>((set, get) => ({
  invoices: mockInvoices,
  queue: mockInvoices.filter(inv => inv.status === 'pending_review'),
  selectedInvoice: null,
  isLoading: false,
  analytics: {
    totalProcessed: 1247,
    accuracyRate: 98.7,
    avgProcessingTime: 2.3,
    pendingReview: 12,
    costSaved: 45280,
  },
  filters: {
    status: 'all',
    confidenceRange: [0, 100],
    dateRange: null,
    search: '',
  },
  uploadInvoice: async (file: File) => {
    set({ isLoading: true });
    // Simulate upload and processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    const newInvoice: Invoice = {
      id: Date.now().toString(),
      fileName: file.name,
      vendor: 'Processing...',
      amount: 0,
      currency: 'USD',
      date: new Date().toISOString().split('T')[0],
      status: 'processing',
      confidence: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set(state => ({
      invoices: [newInvoice, ...state.invoices],
      isLoading: false,
    }));
  },
  approveInvoice: (id: string) => {
    set(state => ({
      invoices: state.invoices.map(inv =>
        inv.id === id ? { ...inv, status: 'approved' as const, updatedAt: new Date().toISOString() } : inv
      ),
      queue: state.queue.filter(inv => inv.id !== id),
    }));
  },
  rejectInvoice: (id: string) => {
    set(state => ({
      invoices: state.invoices.map(inv =>
        inv.id === id ? { ...inv, status: 'rejected' as const, updatedAt: new Date().toISOString() } : inv
      ),
      queue: state.queue.filter(inv => inv.id !== id),
    }));
  },
  setSelectedInvoice: (invoice) => set({ selectedInvoice: invoice }),
  setFilters: (filters) => set(state => ({ filters: { ...state.filters, ...filters } })),
}));

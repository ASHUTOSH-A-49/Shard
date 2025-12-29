// src/services/mockApi.ts

export const mockApi = {
  /**
   * Simulates the initial document upload phase.
   * Generates a unique invoice ID and mimics a server delay.
   */
  uploadDocument: async (file: File) => {
    return new Promise<{ invoiceId: string }>((resolve) => {
      setTimeout(() => {
        // ID generation inspired by the patterns in the dashboard
        resolve({ invoiceId: `INV-${Math.floor(Math.random() * 1000000)}` });
      }, 1000);
    });
  },

  /**
   * Simulates the AI Extraction phase.
   * Returns data that matches the visual layout of the Review and Processing queues.
   */
  extractInvoiceData: async (invoiceId: string, fileName: string) => {
    return new Promise<any>((resolve) => {
      setTimeout(() => {
        resolve({
          invoiceId,
          fileName: fileName || 'sample-invoice.pdf',
          overallConfidence: 77, // Confidence level matching the "Review" state
          status: 'Needs Review',
          priority: 'Medium',
          timeLeft: '10h remaining',
          
          // Field data updated to match values from image_cde68c.png
          fields: [
            { key: 'Invoice Number', value: 'INV-355557', confidence: 98 },
            { key: 'Vendor Name', value: fileName || 'sample-invoice.pdf', confidence: 83 },
            { key: 'Invoice Date', value: '2025-12-26', confidence: 75 },
            { key: 'Due Date', value: '2026-01-25', confidence: 76 },
            { key: 'Total Amount', value: '$11,562.09', confidence: 83 },
            { key: 'Tax Amount', value: '$1,241.30', confidence: 76 },
            { key: 'Subtotal', value: '$11,624.61', confidence: 81 },
            { key: 'Payment Terms', value: 'Due on Receipt', confidence: 72 }
          ],

          // Audit trail log structure
          auditTrail: [
            { 
              id: '1', 
              action: 'Uploaded', 
              timestamp: 'Dec 27, 01:32 AM', 
              user: 'Current User', 
              details: 'Batch uploaded' 
            },
            { 
              id: '2', 
              action: 'Extracted', 
              timestamp: 'Dec 27, 01:32 AM', 
              user: 'AI Engine v2.1', 
              details: 'Extracted with 77.5% confidence' 
            }
          ]
        });
      }, 2000); // 2-second extraction simulation delay
    });
  }
};
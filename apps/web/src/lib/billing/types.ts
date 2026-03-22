export type InvoiceStatus =
  | "DRAFT"
  | "ISSUED"
  | "CANCELLED"
  | string;

export type InvoiceItem = {
  id?: string;
  product_id: string;
  quantity: string;
  unit_price: string;
  discount?: string;
  tax_rate?: string | number | null;
  line_sub_total?: string | number | null;
  line_tax_total?: string | number | null;
  line_total?: string | number | null;
  product?: {
    name?: string | null;
    sku?: string | null;
  };
};

export type Invoice = {
  id: string;
  customer_id: string;
  series_code?: string | null;
  invoice_no?: string | null;
  issue_date?: string | null;
  due_date?: string | null;
  notes?: string | null;
  status?: InvoiceStatus;
  total?: string | number | null;
  sub_total?: string | number | null;
  tax_total?: string | number | null;
  invoiceNumber?: string | null;
  customer?: {
    id: string;
    name: string;
    phone?: string | null;
    email?: string | null;
    gstin?: string | null;
  };
  creditNotes?: Array<{
    id: string;
    kind: string;
    noteNumber?: string;
    note_number?: string;
    noteDate?: string;
    note_date?: string;
    total?: string | number | null;
    restock?: boolean;
  }>;
  shares?: Array<{
    id: string;
    channel: string;
    recipient: string;
    status?: string;
    sentAt?: string;
    sent_at?: string;
  }>;
  lifecycleEvents?: Array<{
    id: string;
    eventType?: string;
    event_type?: string;
    summary: string;
    createdAt?: string;
    created_at?: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
  items?: InvoiceItem[];
};

export type PurchaseStatus = "DRAFT" | "RECEIVED" | "CANCELLED" | string;

export type PurchaseItem = {
  product_id: string;
  quantity: string;
  unit_cost: string;
  discount?: string;
};

export type Purchase = {
  id: string;
  supplier_id: string;
  purchase_date?: string | null;
  notes?: string | null;
  status?: PurchaseStatus;
  total?: string | number | null;
  billUrl?: string | null;
  purchaseReturns?: Array<{
    id: string;
    returnNumber?: string;
    return_number?: string;
    returnDate?: string;
    return_date?: string;
    total?: string | number | null;
  }>;
  lifecycleEvents?: Array<{
    id: string;
    eventType?: string;
    event_type?: string;
    summary: string;
    createdAt?: string;
    created_at?: string;
  }>;
  items?: PurchaseItem[];
  createdAt?: string;
  updatedAt?: string;
};

export type Ledger = {
  id: string;
  name?: string;
  account_name?: string;
  account_code?: string;
  type?: string;
  createdAt?: string;
};

export type JournalLine = {
  debit_ledger_id?: string;
  credit_ledger_id?: string;
  debit_ledger_name?: string | null;
  credit_ledger_name?: string | null;
  amount: string | number;
};

export type Journal = {
  id: string;
  date: string;
  narration?: string | null;
  source_type?: string | null;
  source_id?: string | null;
  is_system_generated?: boolean;
  lines?: JournalLine[];
  createdAt?: string;
};

export type Payment = {
  id: string;
  invoice_id?: string | null;
  purchase_id?: string | null;
  amount: string;
  method: string;
  reference?: string | null;
  payment_date?: string;
  createdAt?: string;
};

export type PaginatedPayments = {
  data: Payment[];
  page: number;
  limit: number;
  total: number;
};

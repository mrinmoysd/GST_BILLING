export type InvoiceStatus =
  | "DRAFT"
  | "ISSUED"
  | "CANCELLED"
  | string;

export type InvoiceItem = {
  product_id: string;
  quantity: string;
  unit_price: string;
  discount?: string;
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
  billUrl?: string | null;
  items?: PurchaseItem[];
  createdAt?: string;
  updatedAt?: string;
};

export type Ledger = {
  id: string;
  name: string;
  type?: string;
  createdAt?: string;
};

export type JournalLine = {
  debit_ledger_id?: string;
  credit_ledger_id?: string;
  amount: string;
};

export type Journal = {
  id: string;
  date: string;
  narration?: string | null;
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

export type InvoiceStatus =
  | "DRAFT"
  | "ISSUED"
  | "CANCELLED"
  | string;

export type QuotationStatus =
  | "DRAFT"
  | "SENT"
  | "APPROVED"
  | "EXPIRED"
  | "CANCELLED"
  | "CONVERTED"
  | string;

export type QuotationItem = {
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

export type Quotation = {
  id: string;
  customer_id?: string;
  salesperson_user_id?: string | null;
  salespersonUserId?: string | null;
  quote_number?: string | null;
  issueDate?: string | null;
  issue_date?: string | null;
  expiryDate?: string | null;
  expiry_date?: string | null;
  notes?: string | null;
  status?: QuotationStatus;
  total?: string | number | null;
  subTotal?: string | number | null;
  sub_total?: string | number | null;
  taxTotal?: string | number | null;
  tax_total?: string | number | null;
  quoteNumber?: string | null;
  convertedAt?: string | null;
  converted_at?: string | null;
  customer?: {
    id: string;
    name: string;
    phone?: string | null;
    email?: string | null;
    gstin?: string | null;
  };
  salesperson?: {
    id: string;
    name?: string | null;
    email?: string | null;
    role?: string | null;
  } | null;
  items?: QuotationItem[];
  invoices?: Array<{
    id: string;
    invoiceNumber?: string | null;
    invoice_number?: string | null;
    status?: string | null;
    total?: string | number | null;
    createdAt?: string | null;
    created_at?: string | null;
  }>;
  createdAt?: string;
  updatedAt?: string;
};

export type SalesOrderStatus =
  | "DRAFT"
  | "CONFIRMED"
  | "PARTIALLY_FULFILLED"
  | "FULFILLED"
  | "CANCELLED"
  | string;

export type SalesOrderItem = {
  id?: string;
  product_id: string;
  quantity: string;
  unit_price: string;
  discount?: string;
  quantity_ordered?: string | number | null;
  quantity_fulfilled?: string | number | null;
  line_total?: string | number | null;
  product?: {
    name?: string | null;
    sku?: string | null;
  };
  invoiceItems?: Array<{
    id: string;
    invoice?: {
      id: string;
      invoiceNumber?: string | null;
      status?: string | null;
    };
  }>;
};

export type SalesOrder = {
  id: string;
  customer_id?: string;
  salesperson_user_id?: string | null;
  salespersonUserId?: string | null;
  quotation_id?: string | null;
  order_number?: string | null;
  orderNumber?: string | null;
  order_date?: string | null;
  orderDate?: string | null;
  expected_dispatch_date?: string | null;
  expectedDispatchDate?: string | null;
  notes?: string | null;
  status?: SalesOrderStatus;
  total?: string | number | null;
  sub_total?: string | number | null;
  subTotal?: string | number | null;
  tax_total?: string | number | null;
  taxTotal?: string | number | null;
  customer?: {
    id: string;
    name: string;
    phone?: string | null;
    email?: string | null;
    gstin?: string | null;
  };
  salesperson?: {
    id: string;
    name?: string | null;
    email?: string | null;
    role?: string | null;
  } | null;
  quotation?: {
    id: string;
    quoteNumber?: string | null;
    quote_number?: string | null;
  } | null;
  items?: SalesOrderItem[];
  invoices?: Array<{
    id: string;
    invoiceNumber?: string | null;
    invoice_number?: string | null;
    status?: string | null;
    total?: string | number | null;
    createdAt?: string | null;
    created_at?: string | null;
  }>;
  createdAt?: string;
  updatedAt?: string;
};

export type DispatchQueueRow = {
  sales_order_id: string;
  order_number?: string | null;
  status?: string | null;
  expected_dispatch_date?: string | null;
  pending_dispatch_quantity: string | number;
  challans_count?: number;
  latest_challan_status?: string | null;
  customer?: {
    id: string;
    name: string;
    phone?: string | null;
  };
};

export type DeliveryChallanItem = {
  id: string;
  sales_order_item_id?: string;
  salesOrderItemId?: string;
  product_id?: string;
  productId?: string;
  quantity_requested?: string | number;
  quantityRequested?: string | number;
  quantity_dispatched?: string | number;
  quantityDispatched?: string | number;
  quantity_delivered?: string | number;
  quantityDelivered?: string | number;
  short_supply_quantity?: string | number;
  shortSupplyQuantity?: string | number;
  product?: {
    id: string;
    name?: string | null;
    sku?: string | null;
  };
  salesOrderItem?: {
    id: string;
    quantityOrdered?: string | number;
    quantity_ordered?: string | number;
    quantityFulfilled?: string | number;
    quantity_fulfilled?: string | number;
  };
};

export type DeliveryChallan = {
  id: string;
  challan_number?: string | null;
  challanNumber?: string | null;
  status?: string | null;
  challan_date?: string | null;
  challanDate?: string | null;
  transporter_name?: string | null;
  transporterName?: string | null;
  vehicle_number?: string | null;
  vehicleNumber?: string | null;
  dispatch_notes?: string | null;
  dispatchNotes?: string | null;
  delivery_notes?: string | null;
  deliveryNotes?: string | null;
  picked_at?: string | null;
  packed_at?: string | null;
  dispatched_at?: string | null;
  delivered_at?: string | null;
  customer?: {
    id: string;
    name: string;
    phone?: string | null;
    gstin?: string | null;
  };
  salesOrder?: {
    id: string;
    orderNumber?: string | null;
    order_number?: string | null;
    status?: string | null;
    expectedDispatchDate?: string | null;
    expected_dispatch_date?: string | null;
  };
  warehouse?: {
    id: string;
    name?: string | null;
    code?: string | null;
  };
  invoice?: {
    id: string;
    invoiceNumber?: string | null;
    invoice_number?: string | null;
    status?: string | null;
  } | null;
  items?: DeliveryChallanItem[];
  events?: Array<{
    id: string;
    eventType?: string | null;
    event_type?: string | null;
    summary?: string | null;
    createdAt?: string | null;
    created_at?: string | null;
  }>;
};

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
  salesperson_user_id?: string | null;
  salespersonUserId?: string | null;
  warehouse_id?: string | null;
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
  salesperson?: {
    id: string;
    name?: string | null;
    email?: string | null;
    role?: string | null;
  } | null;
  warehouse?: {
    id: string;
    name?: string | null;
    code?: string | null;
  } | null;
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

export type InvoiceComplianceSummary = {
  invoice: {
    id: string;
    invoice_number?: string | null;
    status?: string | null;
    issue_date?: string | null;
    total: number;
    customer_name: string;
  };
  provider: string;
  config: {
    e_invoice_enabled: boolean;
    e_way_bill_enabled: boolean;
    auto_generate_on_issue: boolean;
  };
  e_invoice: {
    status: string;
    eligibility_status: string;
    eligibility_reasons: string[];
    provider?: string | null;
    irn?: string | null;
    ack_no?: string | null;
    ack_date?: string | null;
    signed_qr_payload?: string | null;
    signed_invoice_json?: unknown;
    cancelled_at?: string | null;
    cancellation_reason?: string | null;
    last_synced_at?: string | null;
    last_error?: string | null;
  };
  e_way_bill: {
    status: string;
    eligibility_status: string;
    eligibility_reasons: string[];
    provider?: string | null;
    eway_bill_number?: string | null;
    transporter_name?: string | null;
    transporter_id?: string | null;
    vehicle_number?: string | null;
    transport_mode?: string | null;
    distance_km?: number | null;
    transport_document_number?: string | null;
    transport_document_date?: string | null;
    valid_from?: string | null;
    valid_until?: string | null;
    cancelled_at?: string | null;
    cancellation_reason?: string | null;
    last_synced_at?: string | null;
    last_error?: string | null;
  };
  events: Array<{
    id: string;
    event_type: string;
    status: string;
    summary: string;
    error_message?: string | null;
    created_at: string;
  }>;
};

export type InvoiceComplianceExceptionRow = {
  invoice_id: string;
  invoice_number: string;
  issue_date?: string | null;
  customer_name: string;
  total: number;
  e_invoice_status: string;
  e_invoice_eligibility_status: string;
  e_invoice_reason?: string | null;
  e_way_bill_status: string;
  e_way_bill_eligibility_status: string;
  e_way_bill_reason?: string | null;
};

export type PurchaseStatus = "DRAFT" | "RECEIVED" | "CANCELLED" | string;

export type PurchaseItem = {
  product_id: string;
  quantity: string;
  unit_cost: string;
  discount?: string;
  batchEntries?: Array<{
    id?: string;
    batchNumber?: string | null;
    batch_number?: string | null;
    quantity: string | number;
    expiryDate?: string | null;
    expiry_date?: string | null;
    manufacturingDate?: string | null;
    manufacturing_date?: string | null;
  }>;
};

export type Purchase = {
  id: string;
  supplier_id: string;
  warehouse_id?: string | null;
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
  warehouse?: {
    id: string;
    name?: string | null;
    code?: string | null;
  } | null;
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
  invoiceId?: string | null;
  purchase_id?: string | null;
  purchaseId?: string | null;
  amount: string;
  method: string;
  instrument_type?: string | null;
  instrumentType?: string | null;
  instrument_status?: string | null;
  instrumentStatus?: string | null;
  instrument_number?: string | null;
  instrumentNumber?: string | null;
  bank_account_id?: string | null;
  bankAccountId?: string | null;
  bankAccount?: {
    id: string;
    nickname: string;
    bankName?: string | null;
    accountNumberLast4?: string | null;
  } | null;
  reconciled_at?: string | null;
  reconciledAt?: string | null;
  reference?: string | null;
  notes?: string | null;
  payment_date?: string;
  paymentDate?: string;
  createdAt?: string;
};

export type PaginatedPayments = {
  data: Payment[];
  page: number;
  limit: number;
  total: number;
};

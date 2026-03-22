export type Customer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type Supplier = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type Product = {
  id: string;
  name: string;
  sku: string | null;
  hsn: string | null;
  categoryId?: string | null;
  price?: string | number | null;
  costPrice?: string | number | null;
  taxRate?: string | number | null;
  stock?: string | number;
  reorderLevel?: string | number | null;
  createdAt?: string;
  updatedAt?: string;
};

export type Paginated<T> = {
  data: T[];
  meta: { total: number; page: number; limit: number };
};

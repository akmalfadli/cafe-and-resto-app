// CafePOS Domain & Entity Type Definitions

export type RoleType = 'Owner' | 'Manager' | 'Cashier' | 'Kitchen';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: RoleType;
  pin_code?: string;
  avatar_url?: string;
  is_active: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  sort_order: number;
}

export interface Product {
  id: string;
  category_id: string;
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  image_url: string;
  selling_price: number;
  cost_price: number; // Recipe material cost
  packaging_cost: number;
  service_cost: number;
  is_available: boolean;
  is_favorite: boolean;
  kitchen_printer?: string;
}

export interface Ingredient {
  id: string;
  category_id?: string;
  supplier_id?: string;
  name: string;
  unit: 'gram' | 'ml' | 'pcs' | 'pack' | 'slice';
  avg_cost: number;
  min_stock: number;
  current_stock: number;
}

export interface RecipeItem {
  id: string;
  recipe_id: string;
  ingredient_id: string;
  ingredient_name?: string;
  unit?: string;
  unit_cost?: number;
  quantity: number;
}

export interface Recipe {
  id: string;
  product_id: string;
  product_name?: string;
  notes?: string;
  items: RecipeItem[];
}

export interface Supplier {
  id: string;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface IngredientPurchaseItem {
  id: string;
  ingredient_id: string;
  ingredient_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface IngredientPurchase {
  id: string;
  supplier_id: string;
  supplier_name: string;
  invoice_number: string;
  purchase_date: string;
  total_amount: number;
  items: IngredientPurchaseItem[];
}

export type OrderType = 'dine_in' | 'take_away' | 'delivery';

export interface CartItem {
  product: Product;
  quantity: number;
  notes?: string;
}

export interface SaleItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  unit_cost: number;
  notes?: string;
  total_price: number;
}

export type PaymentMethod = 'cash' | 'qris' | 'transfer' | 'split';

export interface Payment {
  method: PaymentMethod;
  amount: number;
  change_amount?: number;
  reference_number?: string;
}

export interface Sale {
  id: string;
  receipt_number: string;
  cashier_id: string;
  cashier_name: string;
  shift_id?: string;
  customer_name?: string;
  table_number?: string;
  order_type: OrderType;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  service_charge: number;
  grand_total: number;
  total_cogs: number;
  status: 'completed' | 'refunded' | 'voided';
  void_reason?: string;
  payments: Payment[];
  items: SaleItem[];
  created_at: string;
}

export interface CashShift {
  id: string;
  cashier_id: string;
  cashier_name: string;
  opened_at: string;
  closed_at?: string;
  starting_cash: number;
  ending_cash?: number;
  expected_cash?: number;
  notes?: string;
  status: 'open' | 'closed';
}

export interface TableItem {
  id: string;
  table_number: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved';
}

export interface CustomerOrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  notes?: string;
  total_price: number;
}

export interface CustomerOrder {
  id: string;
  order_number: string;
  customer_name: string;
  table_number?: string;
  order_type: OrderType;
  subtotal: number;
  tax_amount: number;
  service_charge: number;
  grand_total: number;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  notes?: string;
  created_at: string;
  items?: CustomerOrderItem[];
}

export interface Attendance {
  id: string;
  profile_id: string;
  employee_name: string;
  date: string;
  clock_in: string;
  clock_out?: string;
  clock_in_lat?: number;
  clock_in_lng?: number;
  clock_out_lat?: number;
  clock_out_lng?: number;
  distance_meters?: number;
  is_valid_location: boolean;
  notes?: string;
  created_at: string;
}

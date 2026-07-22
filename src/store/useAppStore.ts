import { create } from 'zustand';
import type { 
  Profile, Product, Category, Ingredient, Supplier, Recipe, Sale, 
  CashShift, CartItem, OrderType, TableItem 
} from '../types';
import { dbService } from '../services/dbService';
import { supabase } from '../lib/supabase';

interface AppStore {
  isLoading: boolean;
  isDatabaseMode: boolean;
  errorMsg: string | null;

  profiles: Profile[];
  currentUser: Profile | null;
  setCurrentUser: (user: Profile | null) => void;
  logout: () => Promise<void>;

  categories: Category[];
  products: Product[];
  ingredients: Ingredient[];
  suppliers: Supplier[];
  recipes: Recipe[];
  sales: Sale[];
  shifts: CashShift[];
  tables: TableItem[];
  activeShift: CashShift | null;

  // POS State
  cart: CartItem[];
  selectedCategory: string;
  searchQuery: string;
  orderType: OrderType;
  selectedTable: string;
  customerName: string;
  discountType: 'fixed' | 'percentage';
  discountValue: number;
  taxRate: number;
  serviceRate: number;
  outletName: string;
  outletPhone: string;
  receiptHeader: string;
  receiptFooter: string;
  receiptLogo: string;
  enableTableNumber: boolean;
  enableTax: boolean;
  setReceiptHeader: (header: string) => void;
  setReceiptFooter: (footer: string) => void;
  setReceiptLogo: (logo: string) => void;
  setCustomerName: (name: string) => void;

  saveSystemSettings: (settings: { outletName?: string; outletPhone?: string; taxRate?: number; serviceRate?: number; receiptHeader?: string; receiptFooter?: string; receiptLogo?: string; enableTableNumber?: boolean; enableTax?: boolean }) => Promise<void>;

  // Shift actions
  openShift: (startingCash: number, profileId: string) => Promise<void>;
  closeShift: (endingCash: number, notes?: string) => Promise<void>;
  refreshShift: () => Promise<void>;

  // Actions
  fetchInitialData: () => Promise<void>;
  registerOwnerAccount: (name: string, email: string, pin: string, password?: string) => Promise<Profile>;
  createStaffAccount: (name: string, email: string, role: 'Manager' | 'Cashier', pin: string, password?: string) => Promise<Profile>;

  addCategory: (cat: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (id: string, cat: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  updateCategorySortOrders: (categories: { id: string; sort_order: number }[]) => Promise<void>;
  setSelectedCategory: (catId: string) => void;
  setSearchQuery: (query: string) => void;
  setOrderType: (type: OrderType) => void;
  setSelectedTable: (tableNo: string) => void;
  setDiscount: (type: 'fixed' | 'percentage', value: number) => void;
  addToCart: (product: Product) => void;
  updateCartQty: (productId: string, quantity: number) => void;
  updateCartNotes: (productId: string, notes: string) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;

  completeSale: (paymentMethod: 'cash' | 'qris' | 'transfer' | 'split', amountPaid: number, refNo?: string) => Promise<Sale>;

  addProduct: (prod: Omit<Product, 'id'>) => Promise<void>;
  addTable: (table: { table_number: string; capacity: number }) => Promise<void>;
  deleteTable: (id: string) => Promise<void>;
  updateProduct: (id: string, prod: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  
  addSupplier: (sup: Omit<Supplier, 'id'>) => Promise<void>;
  addIngredient: (ing: Omit<Ingredient, 'id' | 'current_stock'>) => Promise<void>;
  updateIngredient: (id: string, ing: Partial<Ingredient>) => Promise<void>;
  saveRecipe: (productId: string, items: { ingredientId: string; qty: number }[], notes?: string) => Promise<void>;
}

export const useAppStore = create<AppStore>((set, get) => ({
  isLoading: false,
  isDatabaseMode: false,
  errorMsg: null,

  profiles: [],
  currentUser: null,
  setCurrentUser: (user) => {
    if (user) {
      localStorage.setItem('cafepos_session_user_id', user.id);
    } else {
      localStorage.removeItem('cafepos_session_user_id');
    }
    set({ currentUser: user });
  },

  logout: async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore signOut errors — still clear local state
    }
    localStorage.removeItem('cafepos_session_user_id');
    set({ currentUser: null });
  },

  categories: [],
  products: [],
  ingredients: [],
  suppliers: [],
  recipes: [],
  sales: [],
  shifts: [],
  tables: [],
  activeShift: null,

  cart: [],
  selectedCategory: 'all',
  searchQuery: '',
  orderType: 'dine_in',
  selectedTable: 'T-01',
  customerName: 'Pelanggan Umum',
  discountType: 'fixed',
  discountValue: 0,
  taxRate: 10,
  serviceRate: 5,
  outletName: 'CafePOS Cabang Seminyak',
  outletPhone: '(0361) 890-1234',
  receiptHeader: 'CAFE POS RESTO\nJalan Sunset Road No. 88, Seminyak\nTelp: (0361) 890-1234',
  receiptFooter: 'Terima kasih atas kunjungan Anda!\nSampai jumpa kembali.',
  receiptLogo: '',
  enableTableNumber: true,
  enableTax: true,
  setReceiptHeader: (header) => set({ receiptHeader: header }),
  setReceiptFooter: (footer) => set({ receiptFooter: footer }),
  setReceiptLogo: (logo) => set({ receiptLogo: logo }),
  setCustomerName: (name) => set({ customerName: name }),

  fetchInitialData: async () => {
    set({ isLoading: true, errorMsg: null });
    try {
      const [categories, products, ingredients, suppliers, recipes, sales, activeShift, tables, profiles, dbSettings] = await Promise.all([
        dbService.getCategories(),
        dbService.getProducts(),
        dbService.getIngredients(),
        dbService.getSuppliers(),
        dbService.getRecipes(),
        dbService.getSales(),
        dbService.getActiveShift(),
        dbService.getTables(),
        dbService.getProfiles(),
        dbService.getSettings(),
      ]);

      set({
        categories,
        products,
        ingredients,
        suppliers,
        recipes,
        sales,
        activeShift: activeShift || null,
        tables,
        profiles,
        // Restore session: find profile by saved ID in localStorage
        currentUser: (() => {
          const savedId = localStorage.getItem('cafepos_session_user_id');
          if (savedId) {
            const found = profiles.find((p) => p.id === savedId && p.is_active);
            if (found) return found;
            // ID not found (deleted/inactive) — clear stale session
            localStorage.removeItem('cafepos_session_user_id');
          }
          return get().currentUser; // keep existing if already set
        })(),
        outletName: dbSettings.outletName ?? get().outletName,
        outletPhone: dbSettings.outletPhone ?? get().outletPhone,
        taxRate: dbSettings.taxRate ?? get().taxRate,
        serviceRate: dbSettings.serviceRate ?? get().serviceRate,
        receiptHeader: dbSettings.receiptHeader ?? get().receiptHeader,
        receiptFooter: dbSettings.receiptFooter ?? get().receiptFooter,
        receiptLogo: dbSettings.receiptLogo ?? get().receiptLogo,
        enableTableNumber: dbSettings.enableTableNumber ?? get().enableTableNumber,
        enableTax: dbSettings.enableTax ?? get().enableTax,
        isDatabaseMode: true,
        isLoading: false,
      });
    } catch (err: any) {
      console.error('Database connection failed:', err?.message);
      set({
        categories: [],
        products: [],
        ingredients: [],
        suppliers: [],
        recipes: [],
        sales: [],
        shifts: [],
        activeShift: null,
        tables: [],
        profiles: [],
        currentUser: null,
        isDatabaseMode: false,
        isLoading: false,
        errorMsg: err?.message || 'Tidak dapat terhubung ke database Supabase.',
      });
    }
  },

  openShift: async (startingCash, profileId) => {
    const shift = await dbService.openShift(profileId, startingCash);
    set({ activeShift: shift });
  },

  closeShift: async (endingCash, notes) => {
    const { activeShift, sales } = get();
    if (!activeShift) throw new Error('Tidak ada shift aktif');
    // Calculate expected cash: starting_cash + total cash payments in this shift
    const shiftSales = sales.filter((s) => s.shift_id === activeShift.id && s.status === 'completed');
    const cashRevenue = shiftSales.reduce((sum, s) => {
      const cashPayment = s.payments?.find((p) => p.method === 'cash');
      return sum + (cashPayment?.amount || 0) - (cashPayment?.change_amount || 0);
    }, 0);
    const expectedCash = (activeShift.starting_cash || 0) + cashRevenue;
    await dbService.closeShift(activeShift.id, endingCash, expectedCash, notes);
    set({ activeShift: null });
  },

  refreshShift: async () => {
    const shift = await dbService.getActiveShift();
    set({ activeShift: shift || null });
  },

  saveSystemSettings: async (settings) => {
    const { isDatabaseMode } = get();
    if (settings.outletName !== undefined) set({ outletName: settings.outletName });
    if (settings.outletPhone !== undefined) set({ outletPhone: settings.outletPhone });
    if (settings.taxRate !== undefined) set({ taxRate: settings.taxRate });
    if (settings.serviceRate !== undefined) set({ serviceRate: settings.serviceRate });
    if (settings.receiptHeader !== undefined) set({ receiptHeader: settings.receiptHeader });
    if (settings.receiptFooter !== undefined) set({ receiptFooter: settings.receiptFooter });
    if (settings.receiptLogo !== undefined) set({ receiptLogo: settings.receiptLogo });
    if (settings.enableTableNumber !== undefined) set({ enableTableNumber: settings.enableTableNumber });
    if (settings.enableTax !== undefined) set({ enableTax: settings.enableTax });

    if (isDatabaseMode) {
      if (settings.outletName !== undefined) await dbService.saveSetting('outletName', settings.outletName);
      if (settings.outletPhone !== undefined) await dbService.saveSetting('outletPhone', settings.outletPhone);
      if (settings.taxRate !== undefined) await dbService.saveSetting('taxRate', settings.taxRate);
      if (settings.serviceRate !== undefined) await dbService.saveSetting('serviceRate', settings.serviceRate);
      if (settings.receiptHeader !== undefined) await dbService.saveSetting('receiptHeader', settings.receiptHeader);
      if (settings.receiptFooter !== undefined) await dbService.saveSetting('receiptFooter', settings.receiptFooter);
      if (settings.receiptLogo !== undefined) await dbService.saveSetting('receiptLogo', settings.receiptLogo);
      if (settings.enableTableNumber !== undefined) await dbService.saveSetting('enableTableNumber', settings.enableTableNumber);
      if (settings.enableTax !== undefined) await dbService.saveSetting('enableTax', settings.enableTax);
    }
  },

  registerOwnerAccount: async (name, email, pin, password) => {
    const { isDatabaseMode, profiles } = get();
    let newProfile: Profile;

    if (isDatabaseMode) {
      newProfile = await dbService.createProfile({ full_name: name, email, role: 'Owner', pin_code: pin, password });
    } else {
      newProfile = {
        id: `usr-${Date.now()}`,
        full_name: name,
        email,
        role: 'Owner',
        pin_code: pin,
        is_active: true,
      };
    }

    set({ profiles: [...profiles, newProfile], currentUser: newProfile });
    return newProfile;
  },

  createStaffAccount: async (name, email, role, pin, password) => {
    const { isDatabaseMode, profiles } = get();
    let newProfile: Profile;

    if (isDatabaseMode) {
      newProfile = await dbService.createProfile({ full_name: name, email, role, pin_code: pin, password });
    } else {
      newProfile = {
        id: `usr-${Date.now()}`,
        full_name: name,
        email,
        role,
        pin_code: pin,
        is_active: true,
      };
    }

    set({ profiles: [...profiles, newProfile] });
    return newProfile;
  },

  setSelectedCategory: (catId) => set({ selectedCategory: catId }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setOrderType: (type) => set({ orderType: type }),
  setSelectedTable: (tableNo) => set({ selectedTable: tableNo }),
  setDiscount: (type, value) => set({ discountType: type, discountValue: value }),

  addToCart: (product) => {
    const { cart } = get();
    const existingIndex = cart.findIndex((item) => item.product.id === product.id);
    if (existingIndex > -1) {
      const newCart = [...cart];
      newCart[existingIndex].quantity += 1;
      set({ cart: newCart });
    } else {
      set({ cart: [...cart, { product, quantity: 1 }] });
    }
  },

  updateCartQty: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeFromCart(productId);
      return;
    }
    const { cart } = get();
    const newCart = cart.map((item) =>
      item.product.id === productId ? { ...item, quantity } : item
    );
    set({ cart: newCart });
  },

  updateCartNotes: (productId, notes) => {
    const { cart } = get();
    const newCart = cart.map((item) =>
      item.product.id === productId ? { ...item, notes } : item
    );
    set({ cart: newCart });
  },

  removeFromCart: (productId) => {
    set({ cart: get().cart.filter((item) => item.product.id !== productId) });
  },

  clearCart: () => set({ cart: [], discountValue: 0 }),

  completeSale: async (paymentMethod, amountPaid, refNo) => {
    const { cart, currentUser, activeShift, orderType, selectedTable, customerName, discountType, discountValue, taxRate, serviceRate, enableTax, isDatabaseMode } = get();
    
    const subtotal = cart.reduce((sum, item) => sum + item.product.selling_price * item.quantity, 0);
    const discountAmount = discountType === 'percentage' ? (subtotal * discountValue) / 100 : discountValue;
    const afterDiscount = Math.max(0, subtotal - discountAmount);
    const taxAmount = enableTax ? Math.round((afterDiscount * taxRate) / 100) : 0;
    const serviceCharge = Math.round((afterDiscount * serviceRate) / 100);
    const grandTotal = Math.round(afterDiscount + taxAmount + serviceCharge);
    const totalCogs = cart.reduce((sum, item) => sum + (item.product.cost_price + item.product.packaging_cost + item.product.service_cost) * item.quantity, 0);

    const saleItems = cart.map((item) => ({
      id: `si-${Math.random().toString(36).substr(2, 9)}`,
      product_id: item.product.id,
      product_name: item.product.name,
      quantity: item.quantity,
      unit_price: item.product.selling_price,
      unit_cost: item.product.cost_price,
      notes: item.notes,
      total_price: item.product.selling_price * item.quantity,
    }));

    const newSaleData: any = {
      receipt_number: `INV-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(100 + Math.random() * 900)}`,
      cashier_id: currentUser?.id || 'usr-3',
      cashier_name: currentUser?.full_name || 'Kasir',
      shift_id: activeShift?.id,
      customer_name: customerName || 'Pelanggan Umum',
      table_number: orderType === 'dine_in' ? selectedTable : undefined,
      order_type: orderType,
      subtotal,
      discount_amount: discountAmount,
      tax_amount: taxAmount,
      service_charge: serviceCharge,
      grand_total: grandTotal,
      total_cogs: totalCogs,
      status: 'completed',
      payments: [
        {
          method: paymentMethod,
          amount: amountPaid,
          change_amount: paymentMethod === 'cash' ? Math.max(0, amountPaid - grandTotal) : 0,
          reference_number: refNo,
        },
      ],
      items: saleItems,
      created_at: new Date().toISOString(),
    };

    if (isDatabaseMode) {
      const savedSale = await dbService.createSale(newSaleData);
      set({ sales: [savedSale, ...get().sales], cart: [], discountValue: 0 });
      return savedSale;
    } else {
      const fallbackSale = { ...newSaleData, id: `sale-${Date.now()}` };
      set({ sales: [fallbackSale, ...get().sales], cart: [], discountValue: 0 });
      return fallbackSale;
    }
  },

  addTable: async (tableData) => {
    const { isDatabaseMode } = get();
    if (isDatabaseMode) {
      const { data, error } = await supabase.from('tables').insert({ table_number: tableData.table_number, capacity: tableData.capacity, status: 'available' }).select().single();
      if (error) throw error;
      set({ tables: [...get().tables, data] });
    } else {
      set({ tables: [...get().tables, { id: `tbl-${Date.now()}`, table_number: tableData.table_number, capacity: tableData.capacity, status: 'available' }] });
    }
  },

  deleteTable: async (id) => {
    const { isDatabaseMode } = get();
    if (isDatabaseMode) {
      await supabase.from('tables').delete().eq('id', id);
    }
    set({ tables: get().tables.filter((t) => t.id !== id) });
  },

  addCategory: async (catData) => {
    const { isDatabaseMode } = get();
    if (isDatabaseMode) {
      const created = await dbService.createCategory(catData);
      set({ categories: [...get().categories, created].sort((a, b) => a.sort_order - b.sort_order) });
    } else {
      set({ categories: [...get().categories, { ...catData, id: `cat-${Date.now()}` }].sort((a, b) => a.sort_order - b.sort_order) });
    }
  },

  updateCategory: async (id, catData) => {
    const { isDatabaseMode } = get();
    if (isDatabaseMode) {
      const updated = await dbService.updateCategory(id, catData);
      set({ categories: get().categories.map((c) => (c.id === id ? updated : c)).sort((a, b) => a.sort_order - b.sort_order) });
    } else {
      set({ categories: get().categories.map((c) => (c.id === id ? { ...c, ...catData } : c)).sort((a, b) => a.sort_order - b.sort_order) });
    }
  },

  deleteCategory: async (id) => {
    const { isDatabaseMode } = get();
    if (isDatabaseMode) {
      await dbService.deleteCategory(id);
    }
    set({ categories: get().categories.filter((c) => c.id !== id) });
  },

  updateCategorySortOrders: async (updatedCategories) => {
    const { isDatabaseMode } = get();
    if (isDatabaseMode) {
      await dbService.updateCategorySortOrders(updatedCategories);
    }
    const catMap = new Map(updatedCategories.map((c) => [c.id, c.sort_order]));
    const nextCategories = get().categories.map((c) => ({
      ...c,
      sort_order: catMap.get(c.id) ?? c.sort_order,
    })).sort((a, b) => a.sort_order - b.sort_order);

    set({ categories: nextCategories });
  },

  addProduct: async (prodData) => {
    const { isDatabaseMode } = get();
    if (isDatabaseMode) {
      const created = await dbService.createProduct(prodData);
      set({ products: [...get().products, created] });
    } else {
      set({ products: [...get().products, { ...prodData, id: `prod-${Date.now()}` }] });
    }
  },

  updateProduct: async (id, prodData) => {
    const { isDatabaseMode } = get();
    if (isDatabaseMode) {
      const updated = await dbService.updateProduct(id, prodData);
      set({ products: get().products.map((p) => (p.id === id ? updated : p)) });
    } else {
      set({ products: get().products.map((p) => (p.id === id ? { ...p, ...prodData } : p)) });
    }
  },

  deleteProduct: async (id) => {
    const { isDatabaseMode } = get();
    if (isDatabaseMode) {
      await dbService.deleteProduct(id);
    }
    set({ products: get().products.filter((p) => p.id !== id) });
  },

  addSupplier: async (supData) => {
    const { isDatabaseMode } = get();
    if (isDatabaseMode) {
      const { data, error } = await supabase.from('suppliers').insert(supData).select().single();
      if (error) throw error;
      set({ suppliers: [...get().suppliers, data] });
    } else {
      set({ suppliers: [...get().suppliers, { ...supData, id: `sup-${Date.now()}` }] });
    }
  },

  addIngredient: async (ingData) => {
    const { isDatabaseMode } = get();
    if (isDatabaseMode) {
      const created = await dbService.createIngredient(ingData);
      set({ ingredients: [...get().ingredients, created] });
    } else {
      set({ ingredients: [...get().ingredients, { ...ingData, id: `ing-${Date.now()}`, current_stock: 0 }] });
    }
  },

  updateIngredient: async (id, ingData) => {
    const { isDatabaseMode } = get();
    if (isDatabaseMode) {
      const updated = await dbService.updateIngredient(id, ingData);
      set({ ingredients: get().ingredients.map((i) => (i.id === id ? updated : i)) });
    } else {
      set({ ingredients: get().ingredients.map((i) => (i.id === id ? { ...i, ...ingData } : i)) });
    }
  },

  saveRecipe: async (productId, items, notes) => {
    const { isDatabaseMode, recipes, ingredients, products } = get();

    if (isDatabaseMode) {
      await dbService.saveRecipe(productId, items, notes);
      await get().fetchInitialData();
    } else {
      let recipeCost = 0;
      const recipeItems = items.map((it) => {
        const ing = ingredients.find((i) => i.id === it.ingredientId);
        const unitCost = ing?.avg_cost || 0;
        recipeCost += unitCost * it.qty;
        return {
          id: `ri-${Math.random().toString(36).substr(2, 9)}`,
          recipe_id: '',
          ingredient_id: it.ingredientId,
          ingredient_name: ing?.name,
          unit: ing?.unit,
          unit_cost: unitCost,
          quantity: it.qty,
        };
      });

      const existingIndex = recipes.findIndex((r) => r.product_id === productId);
      let updatedRecipes = [...recipes];
      const recId = existingIndex > -1 ? recipes[existingIndex].id : `rec-${Date.now()}`;
      const newRecipe: Recipe = { id: recId, product_id: productId, notes, items: recipeItems.map((ri) => ({ ...ri, recipe_id: recId })) };

      if (existingIndex > -1) updatedRecipes[existingIndex] = newRecipe;
      else updatedRecipes.push(newRecipe);

      const updatedProducts = products.map((p) => p.id === productId ? { ...p, cost_price: recipeCost } : p);
      set({ recipes: updatedRecipes, products: updatedProducts });
    }
  },
}));

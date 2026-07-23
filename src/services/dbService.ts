import { supabase } from '../lib/supabase';
import type { 
  Profile, Product, Category, Ingredient, Supplier, Recipe, Sale, 
  CashShift, TableItem, RoleType 
} from '../types';

export const dbService = {
  // Profiles & Users
  async getProfiles(): Promise<Profile[]> {
    const { data, error } = await supabase.from('profiles').select('*').is('deleted_at', null);
    if (error) throw error;
    return data || [];
  },

  async createProfile(profile: { id?: string; full_name: string; email: string; role: RoleType; pin_code: string; password?: string }): Promise<Profile> {
    // 1. Register user in official Supabase Auth user directory
    const authPassword = profile.password || `Pin${profile.pin_code}!2026`;
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: profile.email,
      password: authPassword,
      options: {
        data: {
          full_name: profile.full_name,
          role: profile.role,
        },
      },
    });

    if (authError && !authError.message.includes('User already registered')) {
      console.warn('Supabase Auth signUp info:', authError.message);
    }

    const authUserId = authData?.user?.id;

    // 2. Insert into custom public.profiles table
    const newProfile: any = {
      full_name: profile.full_name,
      email: profile.email,
      role: profile.role,
      pin_code: profile.pin_code,
      is_active: true,
    };

    if (authUserId) {
      newProfile.id = authUserId;
    } else if (profile.id) {
      newProfile.id = profile.id;
    }

    const { data, error } = await supabase.from('profiles').insert(newProfile).select().single();
    if (error) throw error;
    return data;
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    const { data, error } = await supabase.from('categories').select('*').is('deleted_at', null).order('sort_order');
    if (error) throw error;
    return data || [];
  },

  async createCategory(cat: Omit<Category, 'id'>): Promise<Category> {
    const { data, error } = await supabase.from('categories').insert(cat).select().single();
    if (error) throw error;
    return data;
  },

  async updateCategory(id: string, cat: Partial<Category>): Promise<Category> {
    const { data, error } = await supabase.from('categories').update(cat).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async deleteCategory(id: string): Promise<void> {
    const { error } = await supabase.from('categories').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
  },

  async updateCategorySortOrders(categories: { id: string; sort_order: number }[]): Promise<void> {
    for (const cat of categories) {
      await supabase.from('categories').update({ sort_order: cat.sort_order }).eq('id', cat.id);
    }
  },

  // Products
  async getProducts(): Promise<Product[]> {
    const { data, error } = await supabase.from('products').select('*').is('deleted_at', null);
    if (error) throw error;
    return data || [];
  },

  async createProduct(prod: Omit<Product, 'id'>): Promise<Product> {
    const { data, error } = await supabase.from('products').insert(prod).select().single();
    if (error) throw error;
    return data;
  },

  async updateProduct(id: string, prod: Partial<Product>): Promise<Product> {
    const { data, error } = await supabase.from('products').update({ ...prod, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async deleteProduct(id: string): Promise<void> {
    const { error } = await supabase.from('products').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
  },

  // Ingredients
  async getIngredients(): Promise<Ingredient[]> {
    const { data, error } = await supabase.from('ingredients').select('*').is('deleted_at', null);
    if (error) throw error;
    return data || [];
  },

  async createIngredient(ing: Omit<Ingredient, 'id' | 'current_stock'> & { current_stock?: number }): Promise<Ingredient> {
    const { data, error } = await supabase.from('ingredients').insert(ing).select().single();
    if (error) throw error;
    return data;
  },

  async updateIngredient(id: string, ing: Partial<Ingredient>): Promise<Ingredient> {
    const { data, error } = await supabase.from('ingredients').update({ ...ing, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  // Suppliers
  async getSuppliers(): Promise<Supplier[]> {
    const { data, error } = await supabase.from('suppliers').select('*').is('deleted_at', null);
    if (error) throw error;
    return data || [];
  },

  // Recipes
  async getRecipes(): Promise<Recipe[]> {
    const { data, error } = await supabase.from('recipes').select('*, recipe_items(*)');
    if (error) throw error;
    return (data || []).map((r: any) => ({
      id: r.id,
      product_id: r.product_id,
      notes: r.notes,
      items: r.recipe_items || [],
    }));
  },

  async saveRecipe(productId: string, items: { ingredientId: string; qty: number }[], notes?: string): Promise<void> {
    // 1. Delete old recipe references
    await supabase.from('recipes').delete().eq('product_id', productId);
    
    // 2. Insert new main recipe record
    const { data: recipe, error: recErr } = await supabase.from('recipes').insert({ product_id: productId, notes }).select().single();
    if (recErr) throw recErr;

    // 3. Insert recipe ingredient items mapping
    const recipeItems = items.map((it) => ({
      recipe_id: recipe.id,
      ingredient_id: it.ingredientId,
      quantity: it.qty,
    }));

    const { error: itemsErr } = await supabase.from('recipe_items').insert(recipeItems);
    if (itemsErr) throw itemsErr;

    // 4. Calculate total recipe cost from current ingredients table values
    let totalRecipeCost = 0;
    if (items.length > 0) {
      const ingIds = items.map(it => it.ingredientId);
      const { data: currentIngredients } = await supabase
        .from('ingredients')
        .select('id, avg_cost')
        .in('id', ingIds);
      
      if (currentIngredients) {
        items.forEach((it) => {
          const matchedIng = currentIngredients.find(i => i.id === it.ingredientId);
          const unitCost = matchedIng?.avg_cost || 0;
          totalRecipeCost += unitCost * it.qty;
        });
      }
    }

    // 5. Update the cost_price on public.products table
    const { error: prodUpdateErr } = await supabase
      .from('products')
      .update({ cost_price: totalRecipeCost })
      .eq('id', productId);

    if (prodUpdateErr) {
      console.warn('Failed to update product cost_price after saving recipe:', prodUpdateErr.message);
    }
  },

  // Sales
  async getSales(): Promise<Sale[]> {
    const { data, error } = await supabase.from('sales').select('*, sale_items(*), payments(*)').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((s: any) => ({
      ...s,
      items: s.sale_items || [],
      payments: s.payments || [],
    }));
  },

  async createSale(saleData: Omit<Sale, 'id'>): Promise<Sale> {
    const { items, payments, ...mainSale } = saleData;

    // Ensure cashier_id and shift_id are valid UUIDs or omit them
    const isCashierUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(mainSale.cashier_id || '');
    if (!isCashierUuid) {
      delete (mainSale as any).cashier_id;
    }

    const isShiftUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(mainSale.shift_id || '');
    if (!isShiftUuid) {
      delete (mainSale as any).shift_id;
    }
    const { id, ...saleToInsert } = mainSale as any;

    const { data: sale, error: saleErr } = await supabase.from('sales').insert(saleToInsert).select().single();
    if (saleErr) throw saleErr;

    const saleItems = items.map((it) => ({
      sale_id: sale.id,
      product_id: it.product_id,
      product_name: it.product_name,
      quantity: it.quantity,
      unit_price: it.unit_price,
      unit_cost: it.unit_cost,
      notes: it.notes,
      total_price: it.total_price,
    }));
    await supabase.from('sale_items').insert(saleItems);

    const payItems = payments.map((p) => ({
      sale_id: sale.id,
      method: p.method,
      amount: p.amount,
      change_amount: p.change_amount || 0,
      reference_number: p.reference_number,
    }));
    await supabase.from('payments').insert(payItems);

    // Deduct ingredient stock dynamically from Supabase database based on recipes
    try {
      const productIds = items.map(it => it.product_id);
      if (productIds.length > 0) {
        // Fetch all recipes and their items for the sold products
        const { data: matchedRecipes } = await supabase
          .from('recipes')
          .select('product_id, recipe_items(ingredient_id, quantity)')
          .in('product_id', productIds);

        if (matchedRecipes && matchedRecipes.length > 0) {
          // Accumulate ingredient deductions
          const ingredientDeductions: Record<string, number> = {};
          
          items.forEach((saleItem) => {
            const recipeObj = matchedRecipes.find(r => r.product_id === saleItem.product_id);
            if (recipeObj && recipeObj.recipe_items) {
              const recipeItemsList = recipeObj.recipe_items as any[];
              recipeItemsList.forEach((rItem) => {
                const totalUsed = rItem.quantity * saleItem.quantity;
                ingredientDeductions[rItem.ingredient_id] = (ingredientDeductions[rItem.ingredient_id] || 0) + totalUsed;
              });
            }
          });

          // Deduct from Supabase ingredients table
          const uniqueIngIds = Object.keys(ingredientDeductions);
          if (uniqueIngIds.length > 0) {
            const { data: currentIngs } = await supabase
              .from('ingredients')
              .select('id, current_stock')
              .in('id', uniqueIngIds);

            if (currentIngs) {
              for (const ing of currentIngs) {
                const deductQty = ingredientDeductions[ing.id] || 0;
                const newStock = Math.max(0, (ing.current_stock || 0) - deductQty);
                await supabase
                  .from('ingredients')
                  .update({ current_stock: newStock })
                  .eq('id', ing.id);
              }
            }
          }
        }
      }
    } catch (stockErr) {
      console.warn('Failed to update ingredients stock during sale creation:', stockErr);
    }

    return { ...sale, items: saleItems as any, payments: payItems as any };
  },

  // Shifts
  async getActiveShift(): Promise<CashShift | null> {
    const { data, error } = await supabase
      .from('cash_shifts')
      .select('*, profiles(full_name)')
      .eq('status', 'open')
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
      ...data,
      cashier_name: (data as any).profiles?.full_name || 'Kasir',
    };
  },

  async openShift(cashierId: string, startingCash: number): Promise<CashShift> {
    const { data, error } = await supabase
      .from('cash_shifts')
      .insert({
        cashier_id: cashierId,
        starting_cash: startingCash,
        status: 'open',
        opened_at: new Date().toISOString(),
      })
      .select('*, profiles(full_name)')
      .single();
    if (error) throw error;
    return {
      ...data,
      cashier_name: (data as any).profiles?.full_name || 'Kasir',
    };
  },

  async closeShift(shiftId: string, endingCash: number, expectedCash: number, notes?: string): Promise<void> {
    const { error } = await supabase
      .from('cash_shifts')
      .update({
        status: 'closed',
        closed_at: new Date().toISOString(),
        ending_cash: endingCash,
        expected_cash: expectedCash,
        notes: notes || null,
      })
      .eq('id', shiftId);
    if (error) throw error;
  },

  async getShifts(limit = 50): Promise<CashShift[]> {
    const { data, error } = await supabase
      .from('cash_shifts')
      .select('*, profiles(full_name)')
      .order('opened_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data || []).map((s: any) => ({
      ...s,
      cashier_name: s.profiles?.full_name || 'Kasir',
    }));
  },

  async getShiftSalesSummary(shiftId: string): Promise<{ total_transactions: number; total_revenue: number }> {
    const { data, error } = await supabase
      .from('sales')
      .select('grand_total')
      .eq('shift_id', shiftId)
      .eq('status', 'completed');
    if (error) throw error;
    const rows = data || [];
    return {
      total_transactions: rows.length,
      total_revenue: rows.reduce((sum: number, s: any) => sum + Number(s.grand_total), 0),
    };
  },

  // Tables
  async getTables(): Promise<TableItem[]> {
    const { data, error } = await supabase.from('tables').select('*');
    if (error) throw error;
    return data || [];
  },

  // Settings
  async getSettings(): Promise<Record<string, any>> {
    const { data, error } = await supabase.from('settings').select('*');
    if (error) throw error;
    const settingsMap: Record<string, any> = {};
    (data || []).forEach((row: any) => {
      settingsMap[row.key] = row.value;
    });
    return settingsMap;
  },

  async saveSetting(key: string, value: any): Promise<void> {
    const { error } = await supabase.from('settings').upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    if (error) throw error;
  },

  // Customer Orders Queue Workflow
  async getCustomerOrders(): Promise<any[]> {
    const { data, error } = await supabase
      .from('customer_orders')
      .select('*, customer_order_items(*)')
      .order('created_at', { ascending: false });
    if (error) {
      console.warn('Failed to fetch customer_orders (schema might need DB push):', error.message);
      return [];
    }
    return (data || []).map((o: any) => ({
      ...o,
      items: o.customer_order_items || [],
    }));
  },

  async createCustomerOrder(orderData: any): Promise<any> {
    const { items, ...mainOrder } = orderData;
    const { data: order, error: orderErr } = await supabase
      .from('customer_orders')
      .insert(mainOrder)
      .select()
      .single();
    if (orderErr) throw orderErr;

    const orderItems = items.map((it: any) => ({
      order_id: order.id,
      product_id: it.product_id,
      product_name: it.product_name,
      quantity: it.quantity,
      unit_price: it.unit_price,
      notes: it.notes,
      total_price: it.total_price,
    }));

    const { error: itemsErr } = await supabase.from('customer_order_items').insert(orderItems);
    if (itemsErr) throw itemsErr;

    return { ...order, items: orderItems };
  },

  async updateCustomerOrderStatus(id: string, status: 'pending' | 'approved' | 'rejected' | 'paid'): Promise<void> {
    const { error } = await supabase
      .from('customer_orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },
};

// mockData.ts — Seed/reference data only
// Mock data untuk keperluan seed database atau unit testing saja.
// Tidak lagi digunakan sebagai fallback di aplikasi utama.

import type { Category, Product, Ingredient, Supplier, Recipe } from '../types';

export const SEED_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Coffee', slug: 'coffee', icon: 'Coffee', sort_order: 1 },
  { id: 'cat-2', name: 'Non Coffee', slug: 'non-coffee', icon: 'CupSoda', sort_order: 2 },
  { id: 'cat-3', name: 'Snack', slug: 'snack', icon: 'Cookie', sort_order: 3 },
  { id: 'cat-4', name: 'Food', slug: 'food', icon: 'Utensils', sort_order: 4 },
  { id: 'cat-5', name: 'Dessert', slug: 'dessert', icon: 'IceCream', sort_order: 5 },
];

export const SEED_INGREDIENTS: Ingredient[] = [
  { id: 'ing-1', name: 'Arabica Coffee Beans', unit: 'gram', avg_cost: 150, min_stock: 1000, current_stock: 4500 },
  { id: 'ing-2', name: 'Fresh Milk', unit: 'ml', avg_cost: 25, min_stock: 2000, current_stock: 8000 },
  { id: 'ing-3', name: 'Vanilla Syrup', unit: 'ml', avg_cost: 120, min_stock: 500, current_stock: 1200 },
  { id: 'ing-4', name: 'Matcha Powder', unit: 'gram', avg_cost: 300, min_stock: 300, current_stock: 900 },
  { id: 'ing-5', name: 'Frozen Potato Fries', unit: 'gram', avg_cost: 40, min_stock: 2000, current_stock: 5000 },
  { id: 'ing-6', name: 'Cooking Oil', unit: 'ml', avg_cost: 20, min_stock: 1000, current_stock: 3000 },
];

export const SEED_SUPPLIERS: Supplier[] = [
  { id: 'sup-1', name: 'Prima Roastery Co.', contact_person: 'David', phone: '+62812345678', email: 'order@primaroast.com', address: 'Central Industrial Estate No. 12' },
  { id: 'sup-2', name: 'Dairy Fresh Ltd', contact_person: 'Maria', phone: '+62898765432', email: 'sales@dairyfresh.com', address: 'Green Farm Complex Block B' },
];

export const SEED_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    category_id: 'cat-1',
    name: 'Caffè Latte',
    sku: 'LAT-001',
    barcode: '8991001',
    description: 'Espresso with steamed fresh milk and delicate microfoam',
    image_url: 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?auto=format&fit=crop&w=600&q=80',
    selling_price: 35000,
    cost_price: 6450,
    packaging_cost: 1500,
    service_cost: 500,
    is_available: true,
    is_favorite: true,
    kitchen_printer: 'Bar Station'
  },
  {
    id: 'prod-2',
    category_id: 'cat-1',
    name: 'Iced Vanilla Cappuccino',
    sku: 'CAP-002',
    barcode: '8991002',
    description: 'Rich espresso blended with chilled milk and aromatic vanilla',
    image_url: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=80',
    selling_price: 38000,
    cost_price: 8250,
    packaging_cost: 2000,
    service_cost: 500,
    is_available: true,
    is_favorite: true,
    kitchen_printer: 'Bar Station'
  },
];

export const SEED_RECIPES: Recipe[] = [
  {
    id: 'rec-1',
    product_id: 'prod-1',
    notes: 'Standard 8oz Latte recipe',
    items: [
      { id: 'ri-1', recipe_id: 'rec-1', ingredient_id: 'ing-1', quantity: 18 },
      { id: 'ri-2', recipe_id: 'rec-1', ingredient_id: 'ing-2', quantity: 150 },
    ]
  },
];

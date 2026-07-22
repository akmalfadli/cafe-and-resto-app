# CafePOS - Modern Point of Sale System for Cafes & Restaurants

CafePOS is a modern, high-performance, production-ready Point of Sale (POS) and Back Office management web application designed for cafes and restaurants.

## 🚀 Key Features

### 1. Cashier POS Module
- **Sub-10 Second Checkout**: Optimized touch-friendly layout for ultra-fast transactions.
- **Single-Screen Workflow**: Categories sidebar, visual product grid, quick search, and active cart side panel.
- **Order Types & Tables**: Supports Dine In (with table selector), Take Away, and Delivery.
- **Flexible Payments**: Cash tender & change calculation, QRIS scan preview, and Bank Transfer.
- **Thermal Receipt Printing**: Printable receipt preview formatted for thermal printers.
- **Shift Management**: Cash shift open/close tracking.

### 2. Back Office Management
- **Executive Dashboard**: Real-time sales, net profit KPI cards, Recharts revenue trends, and top sellers.
- **Products & Recipe Builder**: Multi-ingredient recipe builder with automated Cost of Goods Sold (COGS/HPP) calculation, packaging cost, and profit margin breakdown.
- **Ingredients & Inventory**: Weighted average cost recalculation on purchase entry, minimum stock alerts.
- **Financial Reports**: Daily sales logs, profit & loss statement export.

---

## 🛠️ Architecture & Tech Stack

- **Frontend Framework**: React 18, TypeScript, Vite
- **Styling & Icons**: TailwindCSS v4, Lucide Icons
- **State Management**: Zustand
- **Database & Backend**: PostgreSQL schema (`supabase/migrations/`), Supabase RLS Policies & Triggers
- **Deployment**: Docker & Nginx SPA fallback configuration

---

## 💻 Quick Start (Local Development)

```bash
# 1. Install dependencies
npm install

# 2. Start Vite development server
npm run dev

# 3. Build production bundle
npm run build
```

---

## 🐳 Docker Deployment

```bash
# Build and launch with Docker Compose
docker-compose up --build -d
```

The web application will be accessible at `http://localhost:8080`.

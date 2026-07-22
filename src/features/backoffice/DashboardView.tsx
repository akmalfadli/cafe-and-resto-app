import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { 
  DollarSign, TrendingUp, ShoppingBag, 
  Award, ArrowUpRight 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from 'recharts';

export const DashboardView: React.FC = () => {
  const { sales, products, categories } = useAppStore();

  const totalSalesRevenue = sales.reduce((sum, s) => sum + s.grand_total, 0);
  const totalProfit = sales.reduce((sum, s) => sum + (s.grand_total - s.total_cogs), 0);
  const totalTransactions = sales.length;
  const avgTransaction = totalTransactions > 0 ? Math.round(totalSalesRevenue / totalTransactions) : 0;

  // 1. Dynamic Best Category Calculation
  const categoryRevenueMap: Record<string, { name: string; revenue: number }> = {};
  categories.forEach((c) => {
    categoryRevenueMap[c.id] = { name: c.name, revenue: 0 };
  });

  const productQtyMap: Record<string, number> = {};

  sales.forEach((s) => {
    (s.items || []).forEach((item) => {
      // Accumulate item quantity for top selling products
      productQtyMap[item.product_id] = (productQtyMap[item.product_id] || 0) + item.quantity;

      // Find product category
      const p = products.find((prod) => prod.id === item.product_id);
      if (p && categoryRevenueMap[p.category_id]) {
        categoryRevenueMap[p.category_id].revenue += item.total_price;
      }
    });
  });

  let topCategoryName = 'Belum Ada Penjualan';
  let topCategoryShare = 0;
  let maxCatRevenue = 0;

  Object.values(categoryRevenueMap).forEach((cat) => {
    if (cat.revenue > maxCatRevenue) {
      maxCatRevenue = cat.revenue;
      topCategoryName = cat.name;
    }
  });

  if (totalSalesRevenue > 0 && maxCatRevenue > 0) {
    topCategoryShare = Math.round((maxCatRevenue / totalSalesRevenue) * 100);
  }

  // 2. Dynamic Top Selling Products
  const topProducts = products
    .map((p) => ({
      ...p,
      soldCount: productQtyMap[p.id] || 0,
    }))
    .sort((a, b) => b.soldCount - a.soldCount);

  // 3. Dynamic 7-Day Revenue & Profit Chart Data
  const daysOfWeek = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const now = new Date();
  const salesChartData = Array.from({ length: 7 })
    .map((_, i) => {
      const d = new Date();
      d.setDate(now.getDate() - (6 - i));
      const dayLabel = daysOfWeek[d.getDay()];

      const daySales = sales.filter((s) => {
        const saleDate = new Date(s.created_at);
        return saleDate.toDateString() === d.toDateString();
      });

      const dayRevenue = daySales.reduce((sum, s) => sum + s.grand_total, 0);
      const dayProfit = daySales.reduce((sum, s) => sum + (s.grand_total - s.total_cogs), 0);

      return {
        day: dayLabel,
        revenue: dayRevenue,
        profit: dayProfit,
      };
    });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      <div>
        <h1 className="text-2xl font-black text-stone-800 dark:text-stone-100 tracking-tight">
          Dasbor Eksekutif
        </h1>
        <p className="text-xs text-stone-500">Analisis pendapatan, keuntungan bersih, dan produk terlaris secara langsung</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Penjualan Hari Ini</span>
            <div className="p-2 bg-coffee-50 text-coffee-600 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-2xl font-extrabold text-stone-800 dark:text-stone-100">
              Rp {totalSalesRevenue.toLocaleString('id-ID')}
            </h2>
            <div className="flex items-center text-xs text-emerald-600 mt-1 font-semibold">
              <ArrowUpRight className="w-4 h-4 mr-0.5" />
              <span>Realtime Supabase DB</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Keuntungan Bersih</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
              Rp {totalProfit.toLocaleString('id-ID')}
            </h2>
            <div className="flex items-center text-xs text-stone-500 mt-1">
              <span>Margin Kotor: </span>
              <span className="font-bold ml-1 text-stone-700">
                {totalSalesRevenue > 0 ? Math.round((totalProfit / totalSalesRevenue) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Total Transaksi</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-2xl font-extrabold text-stone-800 dark:text-stone-100">
              {totalTransactions} Pesanan
            </h2>
            <div className="flex items-center text-xs text-stone-500 mt-1">
              <span>Rata-rata: </span>
              <span className="font-bold ml-1 text-stone-700">Rp {avgTransaction.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Kategori Terlaris</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-2xl font-extrabold text-stone-800 dark:text-stone-100 truncate">
              {topCategoryName}
            </h2>
            <div className="flex items-center text-xs text-stone-500 mt-1">
              <span>Kontribusi {topCategoryShare}% dari penjualan</span>
            </div>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2 bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-base text-stone-800 dark:text-stone-100">Tren Pendapatan & Laba Bersih Mingguan</h3>
            <span className="text-xs font-semibold text-stone-400 bg-stone-100 px-3 py-1 rounded-full">7 Hari Terakhir</span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesChartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6F4E37" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#6F4E37" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#588157" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#588157" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                <XAxis dataKey="day" stroke="#a8a29e" fontSize={12} />
                <YAxis stroke="#a8a29e" fontSize={12} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip 
                  formatter={(val: any) => [`Rp ${val.toLocaleString('id-ID')}`, '']}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', borderColor: '#e7e5e4' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#6F4E37" fillOpacity={1} fill="url(#colorRev)" name="Pendapatan" />
                <Area type="monotone" dataKey="profit" stroke="#588157" fillOpacity={1} fill="url(#colorProfit)" name="Laba Bersih" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
          <h3 className="font-bold text-base text-stone-800 dark:text-stone-100">Produk Paling Laris</h3>
          <div className="space-y-3">
            {topProducts.slice(0, 5).map((p, idx) => (
              <div key={p.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-stone-50 transition">
                <span className="font-bold text-xs text-stone-400 w-4">{idx + 1}</span>
                <img src={p.image_url} alt={p.name} className="w-10 h-10 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-stone-800 truncate">{p.name}</h4>
                  <p className="text-[11px] text-stone-400 font-mono">Rp {p.selling_price.toLocaleString('id-ID')}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-extrabold text-coffee-600">{p.soldCount} terjual</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
        <h3 className="font-bold text-base text-stone-800 dark:text-stone-100">Transaksi Selesai Terakhir</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-200 text-stone-400 uppercase font-semibold">
                <th className="pb-2">No. Struk</th>
                <th className="pb-2">Kasir</th>
                <th className="pb-2">Tipe</th>
                <th className="pb-2">Item</th>
                <th className="pb-2">Total Akhir</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {sales.map((sale) => (
                <tr key={sale.id} className="hover:bg-stone-50">
                  <td className="py-3 font-mono font-bold text-coffee-600">{sale.receipt_number}</td>
                  <td className="py-3 font-medium text-stone-700">{sale.cashier_name}</td>
                  <td className="py-3 uppercase font-bold text-stone-500">{sale.order_type}</td>
                  <td className="py-3 text-stone-600">{sale.items.length} item</td>
                  <td className="py-3 font-bold text-stone-800">Rp {sale.grand_total.toLocaleString('id-ID')}</td>
                  <td className="py-3">
                    <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold text-[10px]">
                      Selesai
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

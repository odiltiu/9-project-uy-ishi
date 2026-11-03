import { useState, useEffect } from 'react';
import './App.css';

// Faqat shu ilovaga tegishli kalitlar (boshqa loyihalarning ma'lumotiga tegmaslik uchun)
const STORAGE_KEYS = { products: 'db_products', orders: 'db_orders', store: 'db_store' };

// Buzilgan yozuv ilovani oq ekranga aylantirmasligi uchun xavfsiz o'qish
function loadSaved(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return fallback;
    const parsed = JSON.parse(saved);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

// Mahalliy vaqt: toISOString() UTC beradi va O'zbekistonda 5 soat orqada ko'rinadi
function nowLocal() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Ketma-ket chek raqami: ORD-101, ORD-102, ... (takrorlanmaydi)
function nextOrderId(orders) {
  const max = orders.reduce((m, o) => {
    const n = Number(String(o.id).replace('ORD-', ''));
    return Number.isFinite(n) ? Math.max(m, n) : m;
  }, 100);
  return `ORD-${max + 1}`;
}

const EMPTY_FORM = { name: '', brand: 'Apple', category: 'Zaryadlovchi', buyPrice: '', sellPrice: '', stock: '' };

const DEFAULT_PRODUCTS = [
  { id: 1, name: "20W USB-C Adapter (Apple)", brand: "Apple", category: "Zaryadlovchi", buyPrice: 90000, sellPrice: 150000, stock: 18, sold: 42 },
  { id: 2, name: "Type-C to Lightning (1m)", brand: "Apple", category: "Kabel", buyPrice: 40000, sellPrice: 80000, stock: 25, sold: 68 },
  { id: 3, name: "25W Super Fast Charger", brand: "Samsung", category: "Zaryadlovchi", buyPrice: 85000, sellPrice: 140000, stock: 12, sold: 31 },
  { id: 4, name: "Silikon Chexol (13 Pro Max)", brand: "Apple", category: "G'ilof", buyPrice: 20000, sellPrice: 60000, stock: 4, sold: 19 },
  { id: 5, name: "MagSafe Charger 15W", brand: "Apple", category: "Simsiz", buyPrice: 130000, sellPrice: 220000, stock: 3, sold: 14 },
  { id: 6, name: "45W PD Adapter", brand: "Samsung", category: "Zaryadlovchi", buyPrice: 120000, sellPrice: 210000, stock: 15, sold: 22 },
];

const DEFAULT_ORDERS = [
  { id: "ORD-101", customer: "Akmal Karimov", item: "20W USB-C Adapter (Apple)", qty: 2, total: 300000, date: "2026-08-15 08:30" },
  { id: "ORD-102", customer: "Sardor Aliyev", item: "Type-C to Lightning (1m)", qty: 1, total: 80000, date: "2026-08-15 09:10" }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'orders' | 'analytics' | 'settings'

  // Asosiy ma'lumotlar
  const [products, setProducts] = useState(() => loadSaved(STORAGE_KEYS.products, DEFAULT_PRODUCTS));
  const [orders, setOrders] = useState(() => loadSaved(STORAGE_KEYS.orders, DEFAULT_ORDERS));
  const [storeInfo, setStoreInfo] = useState(() =>
    loadSaved(STORAGE_KEYS.store, { storeName: "iStore Aksessuarlar", currency: "so'm", lowStockAlert: 5 })
  );

  // Mahsulot Formasi State
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCat, setFilterCat] = useState('Barchasi');

  // Kassa / Yangi Sotuv Formasi
  const [saleForm, setSaleForm] = useState({ productId: '', qty: 1, customer: '' });

  // Ma'lumotlarni saqlash
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(products));
      localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(orders));
      localStorage.setItem(STORAGE_KEYS.store, JSON.stringify(storeInfo));
    } catch {
      // xotira to'lgan yoki yopiq — ilova ishlashda davom etadi
    }
  }, [products, orders, storeInfo]);

  // Hisob-kitoblar
  const totalStock = products.reduce((acc, p) => acc + Number(p.stock), 0);
  const totalStockValue = products.reduce((acc, p) => acc + (Number(p.buyPrice) * Number(p.stock)), 0);
  const totalRevenue = orders.reduce((acc, o) => acc + Number(o.total), 0);
  const lowStockCount = products.filter(p => Number(p.stock) <= storeInfo.lowStockAlert).length;

  // Mahsulot qo'shish / tahrirlash
  const handleProductSubmit = (e) => {
    e.preventDefault();
    // Tuzatildi: oldin "!formData.stock" qoldig'i 0 bo'lgan tovarni saqlashga yo'l qo'ymasdi
    if (!formData.name.trim() || formData.sellPrice === '' || formData.stock === '') return;
    const buyPrice = Number(formData.buyPrice || 0);
    const sellPrice = Number(formData.sellPrice);
    const stock = Number(formData.stock);
    if ([buyPrice, sellPrice, stock].some(n => !Number.isFinite(n) || n < 0) || !Number.isInteger(stock)) {
      alert("Narx va qoldiq manfiy bo'lmasligi, qoldiq butun son bo'lishi kerak.");
      return;
    }

    if (editId !== null) {
      setProducts(products.map(p => p.id === editId ? {
        ...p,
        ...formData,
        name: formData.name.trim(),
        buyPrice,
        sellPrice,
        stock
      } : p));
      setEditId(null);
    } else {
      const newProd = {
        id: Date.now(),
        ...formData,
        name: formData.name.trim(),
        buyPrice,
        sellPrice,
        stock,
        sold: 0
      };
      setProducts([newProd, ...products]);
    }
    setFormData(EMPTY_FORM);
  };

  const handleEdit = (p) => {
    setEditId(p.id);
    setFormData({ name: p.name, brand: p.brand, category: p.category, buyPrice: p.buyPrice, sellPrice: p.sellPrice, stock: p.stock });
  };

  const handleDelete = (id) => {
    if (window.confirm("Mahsulotni o'chirishni tasdiqlaysizmi?")) {
      setProducts(products.filter(p => p.id !== id));
      if (editId === id) setEditId(null);
    }
  };

  // Yangi Sotuvni amalga oshirish (Kassa)
  const handleSaleSubmit = (e) => {
    e.preventDefault();
    const product = products.find(p => p.id === Number(saleForm.productId));
    if (!product) return alert("Mahsulotni tanlang!");
    const qty = Number(saleForm.qty);
    if (!Number.isInteger(qty) || qty < 1) return alert("Soni kamida 1 ta butun son bo'lishi kerak.");
    if (product.stock < qty) return alert(`Omborda yetarli tovar yo'q! Qoldiq: ${product.stock}`);

    const newOrder = {
      id: nextOrderId(orders),
      customer: saleForm.customer.trim() || "Oddiy Xaridor",
      item: product.name,
      qty,
      total: product.sellPrice * qty,
      date: nowLocal()
    };

    // Omborni yangilash
    setProducts(products.map(p => p.id === product.id ? {
      ...p,
      stock: p.stock - qty,
      sold: (p.sold || 0) + qty
    } : p));

    setOrders([newOrder, ...orders]);
    setSaleForm({ productId: '', qty: 1, customer: '' });
    alert("Sotuv muvaffaqiyatli amalga oshirildi!");
  };

  // Statistika uchun: eng ko'p sotilgan tovar soni (progress chizig'i shunga nisbatan)
  const maxSold = Math.max(1, ...products.map(p => p.sold || 0));
  const lowStockProducts = products.filter(p => Number(p.stock) <= storeInfo.lowStockAlert);

  // Filtrlash
  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = filterCat === 'Barchasi' || p.category === filterCat;
    return matchSearch && matchCat;
  });

  return (
    <div className="dashboard-container">
      {/* 1. SIDEBAR NAVIGATION */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-icon">⚡</span>
          <div>
            <h3>{storeInfo.storeName}</h3>
            <small>Admin Portal</small>
          </div>
        </div>

        <nav className="nav-menu">
          <button className={`nav-item ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>
            📦 Mahsulotlar Ombori
          </button>
          <button className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
            🛒 Kassa & Sotuvlar ({orders.length})
          </button>
          <button className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
            📊 Statistika & Hisobot
          </button>
          <button className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
            ⚙️ Tizim Sozlamalari
          </button>
        </nav>

        <div className="sidebar-footer">
          {lowStockCount > 0 && (
            <div className="alert-badge">
              ⚠️ <b>{lowStockCount} ta</b> tovar qoldig'i kam!
            </div>
          )}
        </div>
      </aside>

      {/* 2. ASOSIY KONTENT */}
      <main className="main-viewport">
        {/* Yuqori Ko'rsatkichlar Paneli */}
        <section className="kpi-grid">
          <div className="kpi-card">
            <span>Ombordagi Tovar</span>
            <h2>{totalStock} ta</h2>
            <small>{products.length} xil pozitsiya</small>
          </div>
          <div className="kpi-card">
            <span>Ombor Tannarxi</span>
            <h2>{totalStockValue.toLocaleString()} {storeInfo.currency}</h2>
            <small>Keltirilgan umumiy qiymat</small>
          </div>
          <div className="kpi-card revenue">
            <span>Umumiy Savdo</span>
            <h2>{totalRevenue.toLocaleString()} {storeInfo.currency}</h2>
            <small>{orders.length} ta chek amalga oshirildi</small>
          </div>
        </section>

        {/* ================= TAB 1: MAHSULOTLAR VA OMBOR ================= */}
        {activeTab === 'products' && (
          <div className="tab-content">
            <div className="grid-2col">
              {/* Forma */}
              <div className="card form-panel">
                <h3>{editId ? "✏️ Tovarni Tahrirlash" : "➕ Yangi Tovar Kirim Qilish"}</h3>
                <form onSubmit={handleProductSubmit}>
                  <div className="form-group">
                    <label htmlFor="p-name">Tovar Nomi</label>
                    <input id="p-name" 
                      type="text" 
                      placeholder="Masalan: 35W Dual USB-C Adapter"
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})} 
                      required 
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="p-brand">Brend</label>
                      <select id="p-brand" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})}>
                        <option value="Apple">Apple</option>
                        <option value="Samsung">Samsung</option>
                        <option value="Xiaomi">Xiaomi</option>
                        <option value="Boshqa">Boshqa</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="p-category">Kategoriya</label>
                      <select id="p-category" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                        <option value="Zaryadlovchi">Zaryadlovchi</option>
                        <option value="Kabel">Kabel</option>
                        <option value="Simsiz">Simsiz Zaryadlovchi</option>
                        <option value="G'ilof">G'ilof</option>
                        <option value="Himoya oynasi">Himoya oynasi</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="p-buy">Tannarxi ({storeInfo.currency})</label>
                      <input id="p-buy" 
                        type="number" 
                        min="0"
                        placeholder="Keltirilgan narxi"
                        value={formData.buyPrice} 
                        onChange={e => setFormData({...formData, buyPrice: e.target.value})} 
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="p-sell">Sotish Narxi ({storeInfo.currency})</label>
                      <input id="p-sell" 
                        type="number" 
                        min="0"
                        placeholder="Sotuv narxi"
                        value={formData.sellPrice} 
                        onChange={e => setFormData({...formData, sellPrice: e.target.value})} 
                        required 
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="p-stock">Kirim Soni (Qoldiq)</label>
                    <input id="p-stock" 
                      type="number" 
                      min="0"
                      step="1"
                      placeholder="10"
                      value={formData.stock} 
                      onChange={e => setFormData({...formData, stock: e.target.value})} 
                      required 
                    />
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary">{editId ? "O'zgarishlarni Saqlash" : "Omborga Qo'shish"}</button>
                    {editId && <button type="button" className="btn btn-secondary" onClick={() => { setEditId(null); setFormData(EMPTY_FORM); }}>Bekor qilish</button>}
                  </div>
                </form>
              </div>

              {/* Jadval */}
              <div className="card table-panel">
                <div className="table-header-tools">
                  <input 
                    type="text" 
                    className="search-box" 
                    aria-label="Tovar yoki brend qidirish"
                    placeholder="🔎 Tovar yoki brend qidirish..." 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                  />
                  <select value={filterCat} onChange={e => setFilterCat(e.target.value)} aria-label="Kategoriya bo'yicha filtr">
                    <option value="Barchasi">Barcha Kategoriyalar</option>
                    <option value="Zaryadlovchi">Zaryadlovchi</option>
                    <option value="Kabel">Kabel</option>
                    <option value="Simsiz">Simsiz</option>
                    <option value="G'ilof">G'ilof</option>
                    <option value="Himoya oynasi">Himoya oynasi</option>
                  </select>
                </div>

                <div className="table-responsive">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Nomi & Brend</th>
                        <th>Kategoriya</th>
                        <th>Sotish Narxi</th>
                        <th>Ombor</th>
                        <th>Amallar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.length === 0 && (
                        <tr><td colSpan="5" className="empty-note">Tovar topilmadi.</td></tr>
                      )}
                      {filteredProducts.map(p => (
                        <tr key={p.id}>
                          <td>
                            <strong>{p.name}</strong>
                            <span className="brand-tag">{p.brand}</span>
                          </td>
                          <td><span className="cat-badge">{p.category}</span></td>
                          <td><b>{p.sellPrice.toLocaleString()}</b> {storeInfo.currency}</td>
                          <td>
                            <span className={`stock-status ${p.stock <= storeInfo.lowStockAlert ? 'danger' : 'success'}`}>
                              {p.stock} dona
                            </span>
                          </td>
                          <td>
                            <button type="button" className="btn-action edit" onClick={() => handleEdit(p)} aria-label={`${p.name} — tahrirlash`} title="Tahrirlash">✎</button>
                            <button type="button" className="btn-action delete" onClick={() => handleDelete(p.id)} aria-label={`${p.name} — o'chirish`} title="O'chirish">✕</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: KASSA VA SOTUVLAR ================= */}
        {activeTab === 'orders' && (
          <div className="tab-content">
            <div className="grid-2col">
              {/* Tezkor Savdo (POS) */}
              <div className="card form-panel">
                <h3>⚡ Tezkor Kassa (Sotish)</h3>
                <form onSubmit={handleSaleSubmit}>
                  <div className="form-group">
                    <label htmlFor="s-product">Mahsulotni Tanlang</label>
                    <select id="s-product" value={saleForm.productId} onChange={e => setSaleForm({...saleForm, productId: e.target.value})} required>
                      <option value="">-- Mahsulotni tanlang --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id} disabled={p.stock === 0}>
                          {p.name} (Qoldiq: {p.stock} ta) - {p.sellPrice.toLocaleString()} {storeInfo.currency}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="s-customer">Xaridor Ismi / Raqami</label>
                    <input id="s-customer" 
                      type="text" 
                      placeholder="Mijoz ismi" 
                      value={saleForm.customer} 
                      onChange={e => setSaleForm({...saleForm, customer: e.target.value})} 
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="s-qty">Sotilayotgan Soni</label>
                    <input id="s-qty" 
                      type="number" 
                      min="1" 
                      step="1"
                      value={saleForm.qty} 
                      onChange={e => setSaleForm({...saleForm, qty: e.target.value})} 
                      required 
                    />
                  </div>

                  <button type="submit" className="btn btn-success">✅ Sotuvni Tasdiqlash & Chek</button>
                </form>
              </div>

              {/* Sotuvlar Tarixi */}
              <div className="card table-panel">
                <h3>🧾 Savdo Tarixi (Cheklar)</h3>
                <div className="table-responsive">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Chek ID</th>
                        <th>Mijoz</th>
                        <th>Mahsulot & Soni</th>
                        <th>Summa</th>
                        <th>Vaqti</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(o => (
                        <tr key={o.id}>
                          <td><code>{o.id}</code></td>
                          <td>{o.customer}</td>
                          <td>{o.item} <b>x{o.qty}</b></td>
                          <td><b style={{color: '#10b981'}}>{o.total.toLocaleString()} {storeInfo.currency}</b></td>
                          <td><small>{o.date}</small></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: STATISTIKA VA TAHLIL ================= */}
        {activeTab === 'analytics' && (
          <div className="tab-content">
            <div className="grid-2col">
              <div className="card">
                <h3>🔥 Eng Ko'p Sotilgan Tovarlar</h3>
                <div className="analytics-list">
                  {products.slice().sort((a, b) => (b.sold || 0) - (a.sold || 0)).map(p => (
                    <div className="analytics-row" key={p.id}>
                      <div>
                        <strong>{p.name}</strong>
                        <div className="progress-bar-bg">
                          <div className="progress-bar-fill" style={{ width: `${((p.sold || 0) / maxSold) * 100}%` }}></div>
                        </div>
                      </div>
                      <div className="analytics-val">{p.sold || 0} ta sotildi</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <h3>⚠️ Qoldig'i Kamaygan Tovarlar Nazorati</h3>
                <div className="low-stock-list">
                  {lowStockProducts.length === 0 && <p className="empty-note">Hamma tovarlar yetarli. 👍</p>}
                  {lowStockProducts.map(p => (
                    <div className="low-stock-card" key={p.id}>
                      <div>
                        <strong>{p.name}</strong>
                        <p>Yetkazib beruvchiga buyurtma bering!</p>
                      </div>
                      <span className="badge-danger">{p.stock} ta qoldi</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 4: SOZLAMALAR ================= */}
        {activeTab === 'settings' && (
          <div className="tab-content">
            <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
              <h3>⚙️ Do'kon va Tizim Sozlamalari</h3>
              <div className="form-group">
                <label htmlFor="st-name">Do'kon Nomi</label>
                <input id="st-name" 
                  type="text" 
                  value={storeInfo.storeName} 
                  onChange={e => setStoreInfo({...storeInfo, storeName: e.target.value})} 
                />
              </div>

              <div className="form-group">
                <label htmlFor="st-currency">Valyuta Belgisi</label>
                <input id="st-currency" 
                  type="text" 
                  value={storeInfo.currency} 
                  onChange={e => setStoreInfo({...storeInfo, currency: e.target.value})} 
                />
              </div>

              <div className="form-group">
                <label htmlFor="st-limit">Ogohlantirish Qoldiq Chegarasi (Limit)</label>
                <input id="st-limit" 
                  type="number" 
                  min="0"
                  value={storeInfo.lowStockAlert} 
                  onChange={e => setStoreInfo({...storeInfo, lowStockAlert: Number(e.target.value)})} 
                />
              </div>

              <button 
                className="btn btn-secondary" 
                style={{ marginTop: '20px', background: '#ef4444', color: 'white' }}
                onClick={() => {
                  if (window.confirm("Barcha ma'lumotlar o'chib ketadi! Bosh holatga qaytarasizmi?")) {
                    // Faqat shu ilovaning ma'lumotlari o'chiriladi (localStorage.clear() boshqa
                    // loyihalarning ma'lumotlarini ham o'chirib yuborardi)
                    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
                    window.location.reload();
                  }
                }}
              >
                🗑️ Baza Ma'lumotlarini Tozalash
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
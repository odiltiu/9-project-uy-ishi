import React, { useState, useEffect } from 'react';
import './App.css';

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
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('db_products');
    return saved ? JSON.parse(saved) : DEFAULT_PRODUCTS;
  });

  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('db_orders');
    return saved ? JSON.parse(saved) : DEFAULT_ORDERS;
  });

  const [storeInfo, setStoreInfo] = useState(() => {
    const saved = localStorage.getItem('db_store');
    return saved ? JSON.parse(saved) : { storeName: "iStore Aksessuarlar", currency: "so'm", lowStockAlert: 5 };
  });

  // Mahsulot Formasi State
  const [formData, setFormData] = useState({ name: '', brand: 'Apple', category: 'Zaryadlovchi', buyPrice: '', sellPrice: '', stock: '' });
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCat, setFilterCat] = useState('Barchasi');

  // Kassa / Yangi Sotuv Formasi
  const [saleForm, setSaleForm] = useState({ productId: '', qty: 1, customer: '' });

  // Ma'lumotlarni saqlash
  useEffect(() => {
    localStorage.setItem('db_products', JSON.stringify(products));
    localStorage.setItem('db_orders', JSON.stringify(orders));
    localStorage.setItem('db_store', JSON.stringify(storeInfo));
  }, [products, orders, storeInfo]);

  // Hisob-kitoblar
  const totalStock = products.reduce((acc, p) => acc + Number(p.stock), 0);
  const totalStockValue = products.reduce((acc, p) => acc + (Number(p.buyPrice) * Number(p.stock)), 0);
  const totalRevenue = orders.reduce((acc, o) => acc + Number(o.total), 0);
  const lowStockCount = products.filter(p => Number(p.stock) <= storeInfo.lowStockAlert).length;

  // Mahsulot qo'shish / tahrirlash
  const handleProductSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.sellPrice || !formData.stock) return;

    if (editId !== null) {
      setProducts(products.map(p => p.id === editId ? {
        ...p,
        ...formData,
        buyPrice: Number(formData.buyPrice || 0),
        sellPrice: Number(formData.sellPrice),
        stock: Number(formData.stock)
      } : p));
      setEditId(null);
    } else {
      const newProd = {
        id: Date.now(),
        ...formData,
        buyPrice: Number(formData.buyPrice || 0),
        sellPrice: Number(formData.sellPrice),
        stock: Number(formData.stock),
        sold: 0
      };
      setProducts([newProd, ...products]);
    }
    setFormData({ name: '', brand: 'Apple', category: 'Zaryadlovchi', buyPrice: '', sellPrice: '', stock: '' });
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
    if (product.stock < saleForm.qty) return alert(`Omborda yetarli tovar yo'q! Qoldiq: ${product.stock}`);

    const newOrder = {
      id: `ORD-${Date.now().toString().slice(-4)}`,
      customer: saleForm.customer || "Oddiy Xaridor",
      item: product.name,
      qty: Number(saleForm.qty),
      total: product.sellPrice * Number(saleForm.qty),
      date: new Date().toISOString().slice(0, 16).replace('T', ' ')
    };

    // Omborni yangilash
    setProducts(products.map(p => p.id === product.id ? {
      ...p,
      stock: p.stock - Number(saleForm.qty),
      sold: (p.sold || 0) + Number(saleForm.qty)
    } : p));

    setOrders([newOrder, ...orders]);
    setSaleForm({ productId: '', qty: 1, customer: '' });
    alert("Sotuv muvaffaqiyatli amalga oshirildi!");
  };

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
                    <label>Tovar Nomi</label>
                    <input 
                      type="text" 
                      placeholder="Masalan: 35W Dual USB-C Adapter"
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})} 
                      required 
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Brend</label>
                      <select value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})}>
                        <option value="Apple">Apple</option>
                        <option value="Samsung">Samsung</option>
                        <option value="Xiaomi">Xiaomi</option>
                        <option value="Boshqa">Boshqa</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Kategoriya</label>
                      <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
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
                      <label>Tannarxi ({storeInfo.currency})</label>
                      <input 
                        type="number" 
                        placeholder="Keltirilgan narxi"
                        value={formData.buyPrice} 
                        onChange={e => setFormData({...formData, buyPrice: e.target.value})} 
                      />
                    </div>
                    <div className="form-group">
                      <label>Sotish Narxi ({storeInfo.currency})</label>
                      <input 
                        type="number" 
                        placeholder="Sotuv narxi"
                        value={formData.sellPrice} 
                        onChange={e => setFormData({...formData, sellPrice: e.target.value})} 
                        required 
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Kirim Soni (Qoldiq)</label>
                    <input 
                      type="number" 
                      placeholder="10"
                      value={formData.stock} 
                      onChange={e => setFormData({...formData, stock: e.target.value})} 
                      required 
                    />
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary">{editId ? "O'zgarishlarni Saqlash" : "Omborga Qo'shish"}</button>
                    {editId && <button type="button" className="btn btn-secondary" onClick={() => { setEditId(null); setFormData({ name: '', brand: 'Apple', category: 'Zaryadlovchi', buyPrice: '', sellPrice: '', stock: '' }); }}>Bekor qilish</button>}
                  </div>
                </form>
              </div>

              {/* Jadval */}
              <div className="card table-panel">
                <div className="table-header-tools">
                  <input 
                    type="text" 
                    className="search-box" 
                    placeholder="🔎 Tovar yoki brend qidirish..." 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                  />
                  <select value={filterCat} onChange={e => setFilterCat(e.target.value)}>
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
                            <button className="btn-action edit" onClick={() => handleEdit(p)}>✎</button>
                            <button className="btn-action delete" onClick={() => handleDelete(p.id)}>✕</button>
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
                    <label>Mahsulotni Tanlang</label>
                    <select value={saleForm.productId} onChange={e => setSaleForm({...saleForm, productId: e.target.value})} required>
                      <option value="">-- Mahsulotni tanlang --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id} disabled={p.stock === 0}>
                          {p.name} (Qoldiq: {p.stock} ta) - {p.sellPrice.toLocaleString()} {storeInfo.currency}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Xaridor Ismi / Raqami</label>
                    <input 
                      type="text" 
                      placeholder="Mijoz ismi" 
                      value={saleForm.customer} 
                      onChange={e => setSaleForm({...saleForm, customer: e.target.value})} 
                    />
                  </div>

                  <div className="form-group">
                    <label>Sotilayotgan Soni</label>
                    <input 
                      type="number" 
                      min="1" 
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
                          <div className="progress-bar-fill" style={{ width: `${Math.min(100, ((p.sold || 0) / 70) * 100)}%` }}></div>
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
                  {products.filter(p => p.stock <= storeInfo.lowStockAlert).map(p => (
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
                <label>Do'kon Nomi</label>
                <input 
                  type="text" 
                  value={storeInfo.storeName} 
                  onChange={e => setStoreInfo({...storeInfo, storeName: e.target.value})} 
                />
              </div>

              <div className="form-group">
                <label>Valyuta Belgisi</label>
                <input 
                  type="text" 
                  value={storeInfo.currency} 
                  onChange={e => setStoreInfo({...storeInfo, currency: e.target.value})} 
                />
              </div>

              <div className="form-group">
                <label>Ogohlantirish Qoldiq Chegarasi (Limit)</label>
                <input 
                  type="number" 
                  value={storeInfo.lowStockAlert} 
                  onChange={e => setStoreInfo({...storeInfo, lowStockAlert: Number(e.target.value)})} 
                />
              </div>

              <button 
                className="btn btn-secondary" 
                style={{ marginTop: '20px', background: '#ef4444', color: 'white' }}
                onClick={() => {
                  if (window.confirm("Barcha ma'lumotlar o'chib ketadi! Bosh holatga qaytarasizmi?")) {
                    localStorage.clear();
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
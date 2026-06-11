/* =============================================
   Cardeals.al — Seller Backoffice Logic
   Depends on: firebase.js, app.js
   ============================================= */

const PLANS = {
  basic:  { name: 'Basic',  fee: 0.08, monthly: 0,   color: '#8892a4', icon: '⚙️' },
  silver: { name: 'Silver', fee: 0.06, monthly: 50,  color: '#94a3b8', icon: '🥈' },
  gold:   { name: 'Gold',   fee: 0.04, monthly: 100, color: '#f5c518', icon: '🥇' }
};

const PROMO_TIERS = {
  basic:    { name: 'Basic',    icon: '🥉', price: 3,  durationDays: 7, refreshHours: null, color: '#8892a4', desc: 'Promovohet një herë — qëndron në krye për 7 ditë' },
  standard: { name: 'Standard', icon: '🥈', price: 5,  durationDays: 3, refreshHours: 6,    color: '#94a3b8', desc: 'Ri-boostohet çdo 6 orë për 3 ditë' },
  premium:  { name: 'Premium',  icon: '🥇', price: 7,  durationDays: 3, refreshHours: 2,    color: '#f5c518', desc: 'Ri-boostohet çdo 2 orë për 3 ditë' },
  ultimate: { name: 'Ultimate', icon: '💎', price: 12, durationDays: 2, refreshHours: 1,    color: '#e2e8f0', desc: 'Shikshmëri maksimale — ri-boostohet çdo orë për 2 ditë' }
};

let currentUser = null, currentBiz = null;
let myParts = [], myOrders = [];
let currentPage = 'dashboard', currentOrderFilter = 'all';
let salesChart = null;
let selectedImages = [], editPartId = null;
let deletePartId = null;

// ===== SMART BULK IMPORT =====
let bulkFileHeaders = [];
let bulkFileRows = [];
let bulkColumnMapping = {};
let bulkImportData = [];

const CARD_FIELDS = {
  name: 'Emri i Pjesës *',
  category: 'Kategoria',
  condition: 'Gjendja',
  price: 'Çmimi *',
  stock: 'Stoku',
  make: 'Marka',
  model: 'Modeli',
  description: 'Përshkrimi',
  vin: 'VIN',
  year: 'Viti',
  generation: 'Gjenerata',
  engine: 'Motori',
  fuel: 'Karburanti',
  oem: 'OEM'
};

function autoDetectField(header) {
  var h = header.toLowerCase().trim();
  if (h.indexOf('emri') > -1 || h.indexOf('emër') > -1 || h.indexOf('name') > -1 || h.indexOf('titull') > -1 || h.indexOf('pjesa') > -1) return 'name';
  if (h.indexOf('kategori') > -1 || h.indexOf('category') > -1 || h.indexOf('kat') > -1 || h.indexOf('lloji') > -1) return 'category';
  if (h.indexOf('gjendj') > -1 || h.indexOf('condition') > -1 || h.indexOf('status') > -1 || h.indexOf('e re') > -1) return 'condition';
  if (h.indexOf('çmim') > -1 || h.indexOf('cmim') > -1 || h.indexOf('price') > -1 || h.indexOf('vlere') > -1 || h.indexOf('kosto') > -1) return 'price';
  if (h.indexOf('stok') > -1 || h.indexOf('stock') > -1 || h.indexOf('sasi') > -1 || h.indexOf('cope') > -1 || h.indexOf('gjendje') > -1) return 'stock';
  if (h.indexOf('mark') > -1 || h.indexOf('make') > -1 || h.indexOf('brand') > -1 || h.indexOf('prodhu') > -1) return 'make';
  if (h.indexOf('model') > -1 || h.indexOf('modeli') > -1) return 'model';
  if (h.indexOf('pershkrim') > -1 || h.indexOf('përshkrim') > -1 || h.indexOf('description') > -1 || h.indexOf('shenim') > -1) return 'description';
  if (h === 'vin' || h.indexOf('vin') > -1 || h.indexOf('shasi') > -1) return 'vin';
  if (h.indexOf('vit') > -1 || h.indexOf('year') > -1) return 'year';
  if (h.indexOf('gjenerat') > -1 || h.indexOf('generation') > -1) return 'generation';
  if (h.indexOf('motor') > -1 || h.indexOf('engine') > -1) return 'engine';
  if (h.indexOf('karburant') > -1 || h.indexOf('fuel') > -1 || h.indexOf('naft') > -1 || h.indexOf('benzin') > -1) return 'fuel';
  if (h.indexOf('oem') > -1 || h.indexOf('origjinal') > -1 || h.indexOf('numer') > -1) return 'oem';
  return null;
}

// ===== AUTH =====
auth.onAuthStateChanged(async function(user) {
  if (user) {
    currentUser = user;
    listenToBusinessProfile(user.uid);
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    loadMyParts();
    loadMyOrders();
    showPage('dashboard');
  } else {
    currentUser = null;
    currentBiz = null;
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('app').style.display = 'none';
  }
});

function listenToBusinessProfile(uid) {
  db.collection("businesses").doc(uid).onSnapshot(function(doc) {
    if (doc.exists) { currentBiz = doc.data(); updateBizDisplay(); }
  }, function(err) { console.error(err); });
}

// ===== LOGIN / REGISTER =====
window.doLogin = async function() {
  var email = g('loginEmail').value.trim(), pass = g('loginPass').value, btn = g('loginBtn');
  if (!email || !pass) { showToast('Plotëso fushat e detyrueshme!', true); return; }
  btn.textContent = 'Duke hyrë...'; btn.disabled = true;
  try { await auth.signInWithEmailAndPassword(email, pass); }
  catch (err) { showToast('Gabim: ' + err.message, true); btn.textContent = 'HYRJA →'; btn.disabled = false; }
};

window.doRegister = async function() {
  var name = g('regBizName').value.trim(), email = g('regEmail').value.trim();
  var phone = g('regPhone').value.trim(), pass = g('regPass').value, pass2 = g('regPass2').value;
  var city = g('regCity').value, btn = g('regBtn');
  if (!name || !email || !pass || !phone) { showToast('Plotëso fushat e detyrueshme!', true); return; }
  if (pass !== pass2) { showToast('Fjalëkalimet nuk përputhen', true); return; }
  btn.textContent = 'Duke u regjistruar...'; btn.disabled = true;
  try {
    var cred = await auth.createUserWithEmailAndPassword(email, pass);
    await db.collection("businesses").doc(cred.user.uid).set({
      businessName: name, email: email, phone: phone, city: city,
      plan: 'basic', commissionRate: 8,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      uid: cred.user.uid
    });
    showToast('Llogaria u krijua!');
  } catch (err) { showToast('Gabim: ' + err.message, true); btn.textContent = 'KRIJO LLOGARINË →'; btn.disabled = false; }
};

window.doLogout = async function() { await auth.signOut(); };

window.showTab = function(tab, btn) {
  document.querySelectorAll('.auth-tab').forEach(function(t) { t.classList.remove('active'); });
  btn.classList.add('active');
  g('loginForm').style.display = tab === 'login' ? 'block' : 'none';
  g('registerForm').style.display = tab === 'register' ? 'block' : 'none';
};

// ===== BIZ DISPLAY =====
function updateBizDisplay() {
  var el = g('bizName'), pl = g('bizPlan');
  if (el) el.textContent = currentBiz?.businessName || currentBiz?.name || 'Biznesi Im';
  var plan = currentBiz?.plan || 'basic', planData = PLANS[plan];
  var countdownHTML = '';
  if (plan !== 'basic' && currentBiz?.planExpiresAt) {
    var expiresAt;
    if (currentBiz.planExpiresAt.toDate) expiresAt = currentBiz.planExpiresAt.toDate();
    else if (currentBiz.planExpiresAt.seconds) expiresAt = new Date(currentBiz.planExpiresAt.seconds * 1000);
    else expiresAt = new Date(currentBiz.planExpiresAt);
    var daysLeft = Math.ceil((expiresAt - new Date()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 0) countdownHTML = '<span style="color:#c62828;">Skaduar</span>';
    else countdownHTML = '<span style="color:#2e7d32;">✓ ' + daysLeft + ' ditë</span>';
  }
  if (pl) pl.innerHTML = planData.icon + ' ' + planData.name.toUpperCase() + ' · ' + Math.round(planData.fee * 100) + '%<br><small>' + countdownHTML + '</small>';
  renderPlanCards();
}

function renderPlanCards() {
  var plan = currentBiz?.plan || 'basic';
  var pc = g('planCards'); if (!pc) return;
  pc.innerHTML = Object.entries(PLANS).map(function(entry) {
    var key = entry[0], p = entry[1];
    var isCurrent = key === plan;
    return '<div style="background:' + (isCurrent ? '#fafafa' : 'var(--surface)') + ';border:2px solid ' + (isCurrent ? p.color : 'var(--border)') + ';border-radius:10px;padding:1.25rem;text-align:center;">'
      + '<div style="font-size:2rem;">' + p.icon + '</div>'
      + '<div style="font-family:\'Oswald\',sans-serif;font-size:1.1rem;font-weight:600;color:' + p.color + '">' + p.name.toUpperCase() + '</div>'
      + '<div style="font-size:1.3rem;font-weight:700;">' + (p.monthly === 0 ? 'Falas' : '€' + p.monthly + '/muaj') + '</div>'
      + (isCurrent ? '<div style="margin-top:0.75rem;color:#2e7d32;font-weight:600;">✓ Aktiv</div>' : '<button onclick="requestUpgrade(\'' + key + '\')" style="margin-top:0.75rem;width:100%;background:' + p.color + ';color:#000;border:none;border-radius:6px;padding:9px;font-weight:600;cursor:pointer;">UPGRADE →</button>')
      + '</div>';
  }).join('');
}

window.requestUpgrade = async function(planKey) {
  if (!currentUser) return;
  try {
    await db.collection("plan_requests").add({
      businessId: currentUser.uid,
      businessName: currentBiz?.businessName || '',
      email: currentUser?.email || '',
      fromPlan: currentBiz?.plan || 'basic',
      toPlan: planKey,
      status: 'pending',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    showToast('Kërkesa u dërgua!');
  } catch (e) { showToast('Gabim', true); }
};

// ===== DATA LOADING =====
async function loadMyParts() {
  if (!currentUser) return;
  db.collection("parts").where("uid", "==", currentUser.uid).onSnapshot(function(snap) {
    myParts = snap.docs.map(function(d) { return { id: d.id, ...d.data() }; });
    myParts.sort(function(a, b) { return (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0); });
    renderMyParts();
    updateDashboardStats();
  }, function(e) { console.error(e); });
}

async function loadMyOrders() {
  if (!currentUser) return;
  db.collection("orders").where("sellerUid", "==", currentUser.uid).onSnapshot(function(snap) {
    myOrders = snap.docs.map(function(d) { return { id: d.id, ...d.data() }; });
    myOrders.sort(function(a, b) { return (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0); });
    renderOrders(currentOrderFilter);
    renderRecentOrders();
    updateDashboardStats();
    updateCharts();
    updateOrdersBadge();
  }, function(e) { console.error(e); });
}

function updateOrdersBadge() {
  var pending = myOrders.filter(function(o) { return o.status === 'pending'; }).length;
  var badge = g('ordersBadge');
  if (badge) { badge.textContent = pending; badge.style.display = pending > 0 ? 'inline-block' : 'none'; }
}

// ===== DASHBOARD =====
function updateDashboardStats() {
  g('statEarn').textContent = myOrders.filter(function(o) { return o.status === 'sold'; }).reduce(function(s, o) { return s + ((o.totalPrice || 0) - (o.platformFee || 0)); }, 0).toLocaleString() + ' L';
  g('statSales').textContent = myOrders.filter(function(o) { return o.status === 'sold'; }).length;
  g('statViews').textContent = myParts.reduce(function(s, p) { return s + (p.views || 0); }, 0).toLocaleString();
  g('statParts').textContent = myParts.filter(function(p) { return p.status === 'active'; }).length;
}

// ===== RENDER PARTS =====
function renderMyParts() {
  var tbody = g('myPartsBody'); if (!tbody) return;
  if (!myParts.length) { tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:3rem;color:#888;">Nuk keni pjesë të listuara.</td></tr>'; return; }
  tbody.innerHTML = myParts.map(function(p) {
    var name = getPartName(p);
    var thumb = p.images && p.images.length
      ? '<img src="' + p.images[0] + '" style="width:40px;height:40px;object-fit:cover;border-radius:4px;vertical-align:middle;margin-right:8px;" />'
      : '<span style="display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;background:#f5f5f5;border-radius:4px;vertical-align:middle;margin-right:8px;font-size:0.45rem;font-weight:700;color:#d0d0d0;">PA FOTO</span>';
    var badges = '';
    if (p.featured) badges += '⭐';
    if (p.weeklyPromo) badges += '🔥';
    var finalPrice = getFinalPrice(p);
    return '<tr><td>' + thumb + (p.emoji || '') + ' <strong>' + name + '</strong>' + badges + '<br><small style="color:#888;">' + (p.fits || '') + '</small></td>'
      + '<td>' + getCatName(p.category) + '</td>'
      + '<td><span class="status-badge ' + (p.condition === 'new' ? 'badge-active' : 'badge-used') + '">' + (p.condition === 'new' ? 'E Re' : 'E Përdorur') + '</span></td>'
      + '<td>' + formatPrice(p.basePrice) + '</td>'
      + '<td style="font-weight:600;color:#f57c00;">' + formatPrice(finalPrice) + '</td>'
      + '<td>' + (p.stock || 0) + '</td>'
      + '<td><span class="status-badge ' + (p.status === 'active' ? 'badge-active' : 'badge-inactive') + '">' + (p.status === 'active' ? 'Aktiv' : 'Joaktiv') + '</span></td>'
      + '<td><div style="display:flex;gap:0.5rem;flex-wrap:wrap;">'
      + '<button class="icon-btn" onclick="togglePartStatus(\'' + p.id + '\',\'' + p.status + '\')">' + (p.status === 'active' ? '⏸️' : '▶️') + '</button>'
      + '<button class="icon-btn" style="border-color:#b45309;color:#b45309" onclick="editPart(\'' + p.id + '\')">✏️</button>'
      + '<button class="icon-btn" style="background:rgba(245,197,24,0.08);border-color:#f5c518;color:#f5c518;" onclick="promotePart(\'' + p.id + '\')">🚀</button>'
      + '<button class="icon-btn" style="border-color:#2e7d32;color:#2e7d32" onclick="openUpdateStock(\'' + p.id + '\')">📦+</button>'
      + '<button class="icon-btn" style="border-color:#c62828;color:#c62828" onclick="deletePart(\'' + p.id + '\')">🗑️</button>'
      + '</div></td></tr>';
  }).join('');
}

// ===== RENDER ORDERS =====
function renderRecentOrders() {
  var tbody = g('recentOrdersBody'); if (!tbody) return;
  var recent = myOrders.slice(0, 5);
  tbody.innerHTML = recent.length ? recent.map(function(o) { return orderRow(o); }).join('') : '<tr><td colspan="7" style="text-align:center;padding:2rem;">Ende nuk keni porosi.</td></tr>';
}

function renderOrders(filter) {
  currentOrderFilter = filter;
  var tbody = g('allOrdersBody'); if (!tbody) return;
  var filtered = myOrders;
  if (filter === 'pending') filtered = myOrders.filter(function(o) { return o.status === 'pending'; });
  if (filter === 'sold') filtered = myOrders.filter(function(o) { return o.status === 'sold'; });
  if (filter === 'pickup') filtered = myOrders.filter(function(o) { return o.payMethod === 'pickup'; });
  g('orderCount').textContent = filtered.length + ' porosi';
  tbody.innerHTML = filtered.length ? filtered.map(function(o) { return orderRow(o, true); }).join('') : '<tr><td colspan="9" style="text-align:center;padding:2rem;">Ende nuk keni porosi.</td></tr>';
}

function orderRow(o, showDate) {
  var sm = { sold: 'badge-sold', pending: 'badge-pending', cancelled: 'badge-inactive' };
  var sl = o.status === 'sold' ? 'Shitur' : o.status === 'pending' ? 'Në Pritje' : 'Anuluar';
  var pl = o.payMethod === 'online' ? 'Online' : 'Marrje';
  var ds = formatDate(o.createdAt);
  var actions = o.status === 'pending'
    ? '<button class="icon-btn" style="background:rgba(46,125,50,0.1);border-color:#2e7d32;color:#2e7d32;" onclick="markOrderSold(\'' + o.id + '\')">Konfirmo</button>'
    : '<button class="icon-btn" onclick="viewOrderDetails(\'' + o.id + '\')">Detaje</button>';
  return '<tr><td style="font-weight:600;color:#b45309;">#' + (o.id?.slice(-6) || '—') + '</td>'
    + '<td>' + (o.partEmoji || '') + ' ' + (o.partName || '—') + '</td>'
    + '<td>' + (o.buyerName || '—') + '<br><small>' + (o.buyerPhone || '') + '</small></td>'
    + '<td>' + (o.sellerName || '—') + '</td>'
    + (showDate ? '<td style="color:#888;">' + ds + '</td>' : '')
    + '<td style="font-weight:600;color:#f57c00;">' + formatPrice(o.totalPrice) + '</td>'
    + '<td><span class="status-badge ' + sm[o.status] + '">' + sl + '</span></td>'
    + '<td>' + pl + '</td>'
    + '<td>' + actions + '</td></tr>';
}

window.markOrderSold = async function(id) {
  var o = myOrders.find(function(x) { return x.id === id; }); if (!o) return;
  await db.collection("orders").doc(id).update({ status: 'sold' });
  if (o.partId) {
    var pr = db.collection("parts").doc(o.partId), ps = await pr.get();
    if (ps.exists) {
      var cs = ps.data().stock || 0, ns = Math.max(0, cs - (o.quantity || 1));
      var updates = { stock: ns, sales: (ps.data().sales || 0) + (o.quantity || 1) };
      if (ns === 0) updates.status = 'inactive';
      await pr.update(updates);
      showToast(ns === 0 ? 'Shitur! Stoku mbaroi.' : 'Shitur! Stoku i mbetur: ' + ns);
    }
  }
};

window.viewOrderDetails = function(id) {
  var o = myOrders.find(function(x) { return x.id === id; }); if (!o) return;
  var phone = o.buyerPhone || '';
  var cleanPhone = phone.replace(/\D/g, '');
  var whatsappLink = cleanPhone ? '<a href="https://wa.me/' + cleanPhone + '" target="_blank" style="display:inline-block;background:#25D366;color:white;padding:8px 16px;border-radius:6px;text-decoration:none;font-weight:600;font-size:0.85rem;margin-top:0.75rem;">WhatsApp</a>' : '';
  g('orderDetailContent').innerHTML = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-bottom:1.25rem;">'
    + '<div class="dash-card"><div class="dash-num">' + formatPrice(o.totalPrice) + '</div><div class="dash-label">Çmimi Total</div></div>'
    + '<div class="dash-card"><div class="dash-num" style="color:#b45309">' + formatPrice(o.platformFee) + '</div><div class="dash-label">Fitimi yt</div></div></div>'
    + '<div style="background:#fafafa;border-radius:8px;padding:1.25rem;font-size:0.88rem;line-height:2;">'
    + (o.deliveryAddress ? '<div><strong>Adresa:</strong><br>' + o.deliveryAddress + '</div>' : '')
    + (o.shippingFee ? '<div><strong>Transporti:</strong> ' + formatPrice(o.shippingFee) + '</div>' : '')
    + '<div>Pjesa: ' + (o.partEmoji || '') + ' ' + (o.partName || '—') + '</div>'
    + '<div>Blerësi: ' + (o.buyerName || '—') + '</div>'
    + '<div>Telefon: <a href="tel:' + phone + '" style="color:#b45309">' + phone + '</a></div>'
    + whatsappLink + '</div>';
  g('orderDetailModal').classList.add('open');
};

// ===== EARNINGS =====
function renderEarnings() {
  var sold = myOrders.filter(function(o) { return o.status === 'sold'; });
  var totalNet = sold.reduce(function(s, o) { return s + ((o.totalPrice || 0) - (o.platformFee || 0)); }, 0);
  var totalFees = sold.reduce(function(s, o) { return s + (o.platformFee || 0); }, 0);
  g('earnTotalVal').textContent = formatPrice(totalNet);
  g('earnTotalOrders').textContent = sold.length;
  g('earnFeeVal').textContent = formatPrice(totalFees);
  var byMonth = {};
  sold.forEach(function(o) {
    var d = o.createdAt?.toDate ? o.createdAt.toDate() : new Date();
    var key = d.getFullYear() + '-' + (d.getMonth() + 1).toString().padStart(2, '0');
    var label = d.toLocaleDateString('sq-AL', { month: 'long', year: 'numeric' });
    if (!byMonth[key]) byMonth[key] = { label: label, orders: 0, gross: 0, fees: 0, net: 0 };
    byMonth[key].orders++;
    byMonth[key].gross += o.totalPrice || 0;
    byMonth[key].fees += o.platformFee || 0;
    byMonth[key].net += (o.totalPrice || 0) - (o.platformFee || 0);
  });
  var tbody = g('earningsBody');
  if (tbody) {
    var months = Object.values(byMonth).reverse();
    tbody.innerHTML = months.length
      ? months.map(function(m) {
          return '<tr><td style="font-weight:600">' + m.label + '</td><td>' + m.orders + '</td><td style="color:#f57c00;">' + formatPrice(m.gross) + '</td><td style="color:#c62828;">-' + formatPrice(m.fees) + '</td><td style="color:#2e7d32;">+' + formatPrice(m.net) + '</td><td><span class="status-badge badge-active">✓</span></td></tr>';
        }).join('')
      : '<tr><td colspan="6" style="text-align:center;padding:2rem;">Ende nuk keni shitje.</td></tr>';
  }
}

// ===== CHARTS =====
function updateCharts() {
  var sold = myOrders.filter(function(o) { return o.status === 'sold'; });
  var now = new Date();
  var days = [];
  for (var i = 6; i >= 0; i--) { var d = new Date(now); d.setDate(d.getDate() - i); days.push(d); }
  var dailyData = days.map(function(day) {
    return sold.filter(function(o) {
      var od = o.createdAt?.toDate ? o.createdAt.toDate() : new Date();
      return od.toDateString() === day.toDateString();
    }).length;
  });
  var labels = days.map(function(d) { return d.toLocaleDateString('sq-AL', { weekday: 'short', day: 'numeric' }); });
  var ctx1 = g('salesChart')?.getContext('2d');
  if (ctx1) {
    if (salesChart) salesChart.destroy();
    salesChart = new Chart(ctx1, {
      type: 'bar',
      data: { labels: labels, datasets: [{ label: 'Shitje', data: dailyData, backgroundColor: '#b45309', borderRadius: 4 }] },
      options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
    });
  }
}

// ===== FEE CALC =====
window.calcFee = function() {
  var price = parseFloat(g('fPrice')?.value) || 0;
  var plan = currentBiz?.plan || 'basic';
  var feeRate = PLANS[plan]?.fee || 0.08;
  var fee = Math.round(price * feeRate);
  g('fpBase').textContent = formatPrice(price);
  g('fpFee').textContent = formatPrice(fee) + ' (' + Math.round(feeRate * 100) + '%)';
  g('fpTotal').textContent = formatPrice(price + fee);
};

// ===== PAGE NAVIGATION =====
window.showPage = function(page) {
  currentPage = page;
  document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
  var pg = g('page-' + page); if (pg) pg.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(function(n) { n.classList.remove('active'); });
  var nav = g('nav-' + page); if (nav) nav.classList.add('active');
  g('topbarTitle').textContent = page === 'dashboard' ? 'PASQYRA' : page === 'parts' ? 'PJESËT E MIA' : page === 'addpart' ? 'SHTO PJESË' : page === 'bulkimport' ? 'IMPORTO ME SHUMICË' : page === 'orders' ? 'POROSITË' : page === 'earnings' ? 'FITIMET' : page === 'settings' ? 'CILËSIMET' : page.toUpperCase();
  if (page === 'earnings') renderEarnings();
  if (page === 'settings') populateSettings();
  if (page === 'dashboard') updateCharts();
  if (page === 'addpart') {
    if (!editPartId) resetAddPartForm();
    setTimeout(function() { populateCarMakes(); }, 50);
  }
  if (page === 'bulkimport') {
    bulkImportData = [];
    g('bulkStep1').style.display = 'block';
    g('bulkStep2').style.display = 'none';
    g('bulkStep3').style.display = 'none';
    g('bulkFileName').textContent = 'Asnjë skedar i zgjedhur';
    g('bulkCount').textContent = '0 pjesë';
  }
  if (window.innerWidth <= 768) { g('sidebar')?.classList.remove('open'); g('sidebarOverlay')?.classList.remove('show'); }
};

window.filterOrders = function(f, btn) {
  currentOrderFilter = f;
  document.querySelectorAll('.ot-btn').forEach(function(b) { b.classList.remove('active'); });
  btn.classList.add('active');
  renderOrders(f);
};

// ===== SETTINGS =====
function populateSettings() {
  if (!currentBiz) return;
  g('setBizName').value = currentBiz.businessName || '';
  g('setPhone').value = currentBiz.phone || '';
  g('setWhatsappPhone').value = currentBiz.whatsappPhone || currentBiz.phone || '';
  g('setEmail2').value = currentUser?.email || '';
  var ce = g('setCity'); if (ce && currentBiz.city) ce.value = currentBiz.city;
  if (currentBiz.photoURL) {
    var preview = g('storePhotoPreview');
    if (preview) { preview.src = currentBiz.photoURL; preview.style.display = 'block'; }
  }
}

window.saveSettings = async function() {
  if (!currentUser) return;
  var n = g('setBizName').value.trim(), p = g('setPhone').value.trim();
  var wp = g('setWhatsappPhone').value.trim(), c = g('setCity').value;
  await db.collection("businesses").doc(currentUser.uid).update({ businessName: n, phone: p, whatsappPhone: wp, city: c });
  currentBiz = { ...currentBiz, businessName: n, phone: p, whatsappPhone: wp, city: c };
  updateBizDisplay();
  showToast('Ndryshimet u ruajtën!');
};

function uploadStorePhoto() {
  var file = g('storePhotoInput').files[0]; if (!file) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    g('storePhotoPreview').src = e.target.result;
    g('storePhotoPreview').style.display = 'block';
    db.collection("businesses").doc(currentUser.uid).update({ photoURL: e.target.result });
    currentBiz.photoURL = e.target.result;
  };
  reader.readAsDataURL(file);
}

// ===== IMAGE HANDLING =====
function compressImage(file, maxWidth, maxHeight, quality) {
  return new Promise(function(resolve, reject) {
    var reader = new FileReader();
    reader.onload = function(e) {
      var img = new Image();
      img.onload = function() {
        var width = img.width, height = img.height;
        if (width > maxWidth) { height = Math.round((height * maxWidth) / width); width = maxWidth; }
        if (height > maxHeight) { width = Math.round((width * maxHeight) / height); height = maxHeight; }
        var canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
        var ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(function(blob) { resolve(new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), { type: 'image/jpeg', lastModified: Date.now() })); }, 'image/jpeg', quality);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

window.triggerImageUpload = function() { g('imageInput').click(); };

window.handleImageSelect = function(event) {
  var files = event.target.files; if (!files.length) return;
  for (var i = 0; i < files.length; i++) {
    var file = files[i]; if (!file.type.match('image.*')) continue;
    if (selectedImages.length >= 5) break;
    compressImage(file, 600, 600, 0.5).then(function(f) {
      if (f.size > 200000) { showToast('Foto mbi 200KB', true); }
      selectedImages.push(f); renderImagePreviews();
    }).catch(function() { selectedImages.push(file); renderImagePreviews(); });
  }
  event.target.value = '';
};

function renderImagePreviews() {
  var c = g('imagePreviews'); if (!c) return;
  if (!selectedImages.length) { c.innerHTML = '<div style="color:#888;text-align:center;padding:1rem;">Asnjë foto</div>'; return; }
  c.innerHTML = selectedImages.map(function(file, index) {
    var url = URL.createObjectURL(file);
    return '<div style="position:relative;display:inline-block;margin:0.25rem;"><img src="' + url + '" style="width:80px;height:80px;object-fit:cover;border-radius:6px;border:2px solid var(--border);" /><button onclick="removeImage(' + index + ')" style="position:absolute;top:-8px;right:-8px;background:#c62828;color:white;border:none;border-radius:50%;width:22px;height:22px;font-size:0.7rem;cursor:pointer;font-weight:700;">✕</button></div>';
  }).join('');
}

window.removeImage = function(index) { selectedImages.splice(index, 1); renderImagePreviews(); };

async function imagesToBase64() {
  var results = [];
  for (var i = 0; i < selectedImages.length; i++) {
    var file = selectedImages[i];
    var base64 = await new Promise(function(resolve, reject) {
      var reader = new FileReader();
      reader.onload = function(e) { resolve(e.target.result); };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    results.push(base64);
  }
  return results;
}

// ===== PART SUBMIT =====
window.submitPart = async function() {
  var name = g('fName').value.trim(), price = parseFloat(g('fPrice').value);
  var make = g('partMake').value, model = g('partModel').value;
  var fits = make || '';
  if (make && model) fits = make + ' ' + model;
  var vin = g('fVin')?.value.trim().toUpperCase() || '';
  var cat = g('fCat').value, cond = g('fCond').value;
  var stock = parseInt(g('fStock').value) || 1, desc = g('fDesc').value.trim();
  var discount = g('fDiscount').checked ? parseInt(g('fDiscountVal').value) || 0 : 0;
  var featured = g('fFeatured').checked || false, specialOffer = g('fSpecialOffer').checked || false;
  var freeShipping = g('fFreeShipping').checked || false, limitedStock = g('fLimitedStock').checked || false;
  var bestSeller = g('fBestSeller').checked || false;
  var btn = g('submitPartBtn');
  if (!name || !price || !make) { showToast('Plotëso fushat e detyrueshme! (Emri, Çmimi, Marka)', true); return; }
  btn.textContent = editPartId ? 'Duke përditësuar...' : 'Duke publikuar...'; btn.disabled = true;

  var partData = {
    name: { sq: name, en: name }, basePrice: price, fits, category: cat, condition: cond,
    stock, description: desc, vin, year: parseInt(g('fYear').value) || null,
    generation: g('fGeneration').value.trim() || '', engineType: g('fEngine').value.trim() || '',
    fuelType: g('fFuel').value || '', oemNumber: g('fOem').value.trim().toUpperCase() || '',
    discount, featured, specialOffer, freeShipping, limitedStock, bestSeller,
    emoji: getCatEmoji(cat),
    sellerName: currentBiz?.businessName || currentBiz?.name || '',
    sellerCity: currentBiz?.city || '', uid: currentUser.uid,
    status: stock > 0 ? 'active' : 'inactive', views: 0, sales: 0, rating: 5,
    images: [], createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  try {
    if (selectedImages.length > 0) { var base64Images = await imagesToBase64(); partData.images = base64Images; }
    if (editPartId) { await db.collection("parts").doc(editPartId).update(partData); showToast('Pjesa u përditësua!'); }
    else { await db.collection("parts").add(partData); showToast('Pjesa u publikua!'); }
    resetAddPartForm(); editPartId = null; showPage('parts');
  } catch (e) { showToast('Gabim: ' + e.message, true); btn.textContent = editPartId ? 'RUAJ NDRYSHIMET' : 'PUBLIKO PJESËN'; btn.disabled = false; }
};

function resetAddPartForm() {
  ['fName', 'fPrice', 'fStock', 'fDesc', 'fVin', 'fYear', 'fGeneration', 'fEngine', 'fOem'].forEach(function(id) { var el = g(id); if (el) el.value = ''; });
  g('fFuel').value = ''; g('fDiscountVal').value = '10'; g('fDiscountVal').style.display = 'none';
  ['fDiscount', 'fFeatured', 'fSpecialOffer', 'fFreeShipping', 'fLimitedStock', 'fBestSeller'].forEach(function(id) { var el = g(id); if (el) el.checked = false; });
  g('partMake').value = ''; g('partModel').value = ''; g('partModel').disabled = true;
  selectedImages = []; renderImagePreviews(); calcFee();
  g('submitPartBtn').textContent = 'PUBLIKO PJESËN';
  g('addPartTitle').textContent = 'SHTO PJESË TË RE';
  editPartId = null;
}

window.editPart = function(partId) {
  var part = myParts.find(function(p) { return p.id === partId; }); if (!part) return;
  editPartId = partId;
  g('addPartTitle').textContent = 'NDRYSHO PJESËN';
  g('fName').value = getPartName(part);
  g('fPrice').value = part.basePrice || '';
  g('fCat').value = part.category || 'brakes';
  g('fCond').value = part.condition || 'new';
  g('fStock').value = part.stock || 1;
  g('fDesc').value = part.description || '';
  g('fVin').value = part.vin || '';
  g('fYear').value = part.year || '';
  g('fGeneration').value = part.generation || '';
  g('fEngine').value = part.engineType || '';
  g('fFuel').value = part.fuelType || '';
  g('fOem').value = part.oemNumber || '';
  if (part.discount > 0) { g('fDiscount').checked = true; g('fDiscountVal').value = part.discount; g('fDiscountVal').style.display = 'inline-block'; }
  populateCarMakes();
  var fits = part.fits || '', spaceIndex = fits.indexOf(' ');
  if (spaceIndex > 0) {
    var savedMake = fits.substring(0, spaceIndex);
    var savedModel = fits.substring(spaceIndex + 1);
    g('partMake').value = savedMake;
    onPartMakeChange();
    setTimeout(function() { g('partModel').value = savedModel; }, 400);
  }
  selectedImages = []; renderImagePreviews(); calcFee(); showPage('addpart');
};

// ===== PROMOTE =====
window.promotePart = function(partId) {
  var part = myParts.find(function(p) { return p.id === partId; }); if (!part) return;
  g('promotePartName').textContent = 'Pjesa: ' + getPartName(part);
  g('promotePartId').value = partId;
  g('promoteSelectedTier').value = '';
  var container = g('promoTierOptions');
  container.innerHTML = Object.entries(PROMO_TIERS).map(function(entry) {
    var key = entry[0], tier = entry[1];
    return '<div onclick="selectPromoTier(\'' + key + '\')" id="promoTier_' + key + '" style="background:var(--surface);border:2px solid var(--border);border-radius:10px;padding:1rem;cursor:pointer;display:flex;align-items:center;gap:1rem;">'
      + '<div style="font-size:2rem;">' + tier.icon + '</div>'
      + '<div style="flex:1;"><div style="display:flex;justify-content:space-between;"><span style="font-weight:600;color:' + tier.color + ';">' + tier.name + '</span><span style="font-weight:600;color:#f57c00;">€' + tier.price + '</span></div>'
      + '<div style="font-size:0.78rem;color:#888;">' + tier.desc + '</div></div></div>';
  }).join('');
  g('confirmPromoteBtn').disabled = true;
  g('promoteModal').classList.add('open');
};

window.selectPromoTier = function(tierKey) {
  g('promoteSelectedTier').value = tierKey;
  var tier = PROMO_TIERS[tierKey], btn = g('confirmPromoteBtn');
  btn.disabled = false; btn.textContent = 'PROMOVO PËR €' + tier.price;
  btn.style.background = tier.color;
  btn.style.color = (tierKey === 'premium' || tierKey === 'ultimate') ? '#000' : '#fff';
};

window.confirmPromote = async function() {
  var partId = g('promotePartId').value, tierKey = g('promoteSelectedTier').value;
  if (!tierKey) { showToast('Zgjidh një plan promocioni!', true); return; }
  var part = myParts.find(function(p) { return p.id === partId; }); if (!part) return;
  var tier = PROMO_TIERS[tierKey], btn = g('confirmPromoteBtn');
  btn.textContent = 'Duke dërguar...'; btn.disabled = true;
  try {
    await db.collection("weekly_promotions").add({
      partId, partName: getPartName(part),
      businessId: currentUser.uid, businessName: currentBiz?.businessName || '',
      email: currentUser?.email || '', tier: tierKey, tierName: tier.name,
      cost: tier.price, durationDays: tier.durationDays, refreshHours: tier.refreshHours,
      status: 'pending', createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    showToast('Kërkesa u dërgua!'); closeModal('promoteModal');
  } catch (e) { showToast('Gabim: ' + e.message, true); }
  btn.textContent = 'PROMOVO'; btn.disabled = false;
};

// ===== DELETE & TOGGLE =====
window.deletePart = function(id) { deletePartId = id; g('deleteModal').classList.add('open'); };

window.confirmDelete = async function() {
  if (!deletePartId) return;
  try { await db.collection("parts").doc(deletePartId).delete(); showToast('Pjesa u fshi.'); }
  catch (e) { showToast('Gabim', true); }
  closeModal('deleteModal'); deletePartId = null;
};

window.togglePartStatus = async function(id, s) {
  var ns = s === 'active' ? 'inactive' : 'active';
  await db.collection("parts").doc(id).update({ status: ns });
  showToast('Statusi u ndryshua!');
};

// ===== STOCK =====
window.openUpdateStock = function(partId) {
  var part = myParts.find(function(p) { return p.id === partId; }); if (!part) return;
  g('updateStockPartName').textContent = 'Pjesa: ' + getPartName(part);
  g('updateStockPartId').value = partId;
  g('currentStockDisplay').value = part.stock || 0;
  g('stockToAdd').value = 1;
  g('newStockDisplay').value = (part.stock || 0) + 1;
  g('stockToAdd').oninput = function() { g('newStockDisplay').value = (part.stock || 0) + (parseInt(this.value) || 0); };
  g('updateStockModal').classList.add('open');
};

window.confirmUpdateStock = async function() {
  var partId = g('updateStockPartId').value, add = parseInt(g('stockToAdd').value) || 0;
  var part = myParts.find(function(p) { return p.id === partId; }); if (!part || add <= 0) return;
  var ns = (part.stock || 0) + add;
  try { await db.collection("parts").doc(partId).update({ stock: ns, status: ns > 0 ? 'active' : 'inactive' }); showToast('Stoku u përditësua!'); closeModal('updateStockModal'); }
  catch (e) { showToast('Gabim: ' + e.message, true); }
};

// ===== SMART BULK IMPORT =====
window.handleBulkFile = function(event) {
  var file = event.target.files[0];
  if (!file) return;
  
  g('bulkFileName').textContent = file.name;
  
  var reader = new FileReader();
  reader.onload = function(e) {
    var text = e.target.result;
    g('bulkText').value = text;
    parseWithHeaders(text);
  };
  reader.readAsText(file);
  event.target.value = '';
};

window.parseBulkImport = function() {
  var text = g('bulkText').value.trim();
  if (!text) { showToast('Ngarko një skedar ose ngjit të dhënat!', true); return; }
  parseWithHeaders(text);
};

function parseWithHeaders(text) {
  var lines = text.split('\n').filter(function(l) { return l.trim(); });
  if (lines.length < 2) { showToast('Skedari duhet të ketë të paktën 1 rresht të dhënash + kokë!', true); return; }
  
  var delimiter = lines[0].indexOf(',') > -1 ? ',' : '|';
  
  bulkFileHeaders = lines[0].split(delimiter).map(function(h) { return h.trim(); });
  bulkFileRows = [];
  
  for (var i = 1; i < lines.length; i++) {
    var values = lines[i].split(delimiter).map(function(v) { return v.trim(); });
    bulkFileRows.push(values);
  }
  
  bulkColumnMapping = {};
  bulkFileHeaders.forEach(function(header, index) {
    var detected = autoDetectField(header);
    if (detected) bulkColumnMapping[detected] = index;
  });
  
  renderColumnMapping();
  g('bulkStep1').style.display = 'none';
  g('bulkStep2').style.display = 'block';
  g('bulkStep3').style.display = 'none';
}

function renderColumnMapping() {
  var area = g('bulkMappingArea');
  var html = '';
  
  var fieldKeys = ['name', 'category', 'condition', 'price', 'stock', 'make', 'model', 'description', 'vin', 'year', 'generation', 'engine', 'fuel', 'oem'];
  
  fieldKeys.forEach(function(fieldKey) {
    var isRequired = fieldKey === 'name' || fieldKey === 'price';
    var label = CARD_FIELDS[fieldKey] + (isRequired ? '' : '');
    var currentMapping = bulkColumnMapping[fieldKey];
    
    html += '<div style="display:flex;align-items:center;gap:0.5rem;">';
    html += '<span style="font-weight:600;font-size:0.8rem;min-width:100px;">' + label + '</span>';
    html += '<select onchange="setBulkMapping(\'' + fieldKey + '\', this.value)" style="flex:1;padding:6px 8px;border:2px solid var(--border);border-radius:6px;font-size:0.8rem;font-family:Inter,sans-serif;">';
    html += '<option value="">Injoro</option>';
    
    bulkFileHeaders.forEach(function(header, index) {
      var selected = currentMapping === index ? ' selected' : '';
      html += '<option value="' + index + '"' + selected + '>' + header + '</option>';
    });
    
    html += '</select></div>';
  });
  
  area.innerHTML = html;
}

window.setBulkMapping = function(fieldKey, value) {
  if (value === '') {
    delete bulkColumnMapping[fieldKey];
  } else {
    bulkColumnMapping[fieldKey] = parseInt(value);
  }
};

window.applyBulkMapping = function() {
  if (!bulkColumnMapping['name'] && !bulkColumnMapping['price']) {
    showToast('Duhet të paktën Emri dhe Çmimi!', true);
    return;
  }
  
  bulkImportData = bulkFileRows.map(function(row) {
    function getVal(fieldKey, defaultVal) {
      var index = bulkColumnMapping[fieldKey];
      return (index !== undefined && index < row.length) ? row[index] : defaultVal;
    }
    
    return {
      name: getVal('name', ''),
      category: getVal('category', 'other'),
      condition: getVal('condition', 'new'),
      price: parseFloat(getVal('price', '0')) || 0,
      stock: parseInt(getVal('stock', '1')) || 1,
      make: getVal('make', ''),
      model: getVal('model', ''),
      description: getVal('description', ''),
      vin: getVal('vin', ''),
      year: getVal('year', ''),
      generation: getVal('generation', ''),
      engine: getVal('engine', ''),
      fuel: getVal('fuel', ''),
      oem: getVal('oem', '')
    };
  }).filter(function(item) { return item.name && item.price > 0; });
  
  renderBulkPreview();
  g('bulkStep2').style.display = 'none';
  g('bulkStep3').style.display = 'block';
};

function renderBulkPreview() {
  g('bulkPreviewCount').textContent = bulkImportData.length;
  g('bulkCount').textContent = bulkImportData.length;
  
  var tbody = g('bulkPreviewBody');
  tbody.innerHTML = bulkImportData.slice(0, 50).map(function(item, i) {
    return '<tr>'
      + '<td>' + (i + 1) + '</td>'
      + '<td>' + item.name + '</td>'
      + '<td>' + getCatName(item.category) + '</td>'
      + '<td>' + (item.condition === 'new' ? 'E Re' : 'E Përdorur') + '</td>'
      + '<td>' + formatPrice(item.price) + '</td>'
      + '<td>' + item.stock + '</td>'
      + '<td>' + item.make + '</td>'
      + '<td>' + item.model + '</td>'
      + '</tr>';
  }).join('');
  
  if (bulkImportData.length > 50) {
    tbody.innerHTML += '<tr><td colspan="8" style="text-align:center;color:var(--text-muted);">+ ' + (bulkImportData.length - 50) + ' të tjera</td></tr>';
  }
}

window.importBulkParts = async function() {
  if (!bulkImportData.length) { showToast('Asnjë pjesë për të importuar!', true); return; }
  
  var btn = g('bulkImportBtn');
  btn.textContent = 'Duke importuar...'; btn.disabled = true;
  var imported = 0;
  
  try {
    for (var i = 0; i < bulkImportData.length; i++) {
      var p = bulkImportData[i];
      if (!p.name || !p.price) continue;
      
      var fits = (p.make && p.model) ? p.make + ' ' + p.model : p.make || '';
      
      await db.collection("parts").add({
        name: { sq: p.name, en: p.name },
        basePrice: p.price,
        fits: fits,
        category: p.category || 'other',
        condition: p.condition || 'new',
        stock: p.stock || 1,
        description: p.description || '',
        vin: (p.vin || '').toUpperCase(),
        year: p.year || null,
        generation: p.generation || '',
        engineType: p.engine || '',
        fuelType: p.fuel || '',
        oemNumber: (p.oem || '').toUpperCase(),
        emoji: getCatEmoji(p.category || 'other'),
        sellerName: currentBiz?.businessName || currentBiz?.name || '',
        sellerCity: currentBiz?.city || '',
        uid: currentUser.uid,
        status: (p.stock || 1) > 0 ? 'active' : 'inactive',
        views: 0, sales: 0, rating: 5,
        images: [],
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      imported++;
    }
    
    showToast('✅ ' + imported + ' pjesë u importuan!');
    bulkImportData = [];
    g('bulkText').value = '';
    g('bulkFileName').textContent = 'Asnjë skedar i zgjedhur';
    g('bulkStep3').style.display = 'none';
    g('bulkStep1').style.display = 'block';
    g('bulkCount').textContent = '0 pjesë';
    
  } catch (e) {
    showToast('Gabim: ' + e.message, true);
  }
  
  btn.textContent = 'IMPORTO PJESË';
  btn.disabled = false;
};

// ===== LOGIN LANGUAGE =====
window.setLoginLang = function(lg) {
  currentLang = lg;
  document.querySelectorAll('.ll-btn').forEach(function(b) { b.classList.remove('active'); });
  var btn = document.querySelector('.ll-btn[onclick="setLoginLang(\'' + lg + '\')"]');
  if (btn) btn.classList.add('active');
};

// ===== CAR MAKE/MODEL FOR BACKOFFICE =====
function populateCarMakes() {
  var sel = g('partMake');
  if (!sel) return;
  sel.innerHTML = '<option value="">Zgjidh Markën</option>';
  carBrands.forEach(function(b) {
    var o = document.createElement('option');
    o.value = b;
    o.textContent = b;
    sel.appendChild(o);
  });
}

function onPartMakeChange() {
  var make = g('partMake').value;
  var modelSelect = g('partModel');
  
  if (!modelSelect) return;
  
  modelSelect.innerHTML = '<option value="">Zgjidh Modelin</option>';
  
  if (make && carModels[make]) {
    modelSelect.disabled = false;
    carModels[make].forEach(function(m) {
      var o = document.createElement('option');
      o.value = m;
      o.textContent = m;
      modelSelect.appendChild(o);
    });
  } else {
    modelSelect.disabled = true;
    modelSelect.value = '';
  }
}

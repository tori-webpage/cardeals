/* =============================================
   Cardeals.al — Admin Panel Logic
   Depends on: firebase.js (or inline firebase init)
   ============================================= */

const ADMIN_EMAIL = "cheapways91@gmail.com";

const PLANS = {
  basic:  { name:'Basic',  fee:0.08, monthly:0,   color:'#8892a4', icon:'⚙️' },
  silver: { name:'Silver', fee:0.06, monthly:50,  color:'#94a3b8', icon:'🥈' },
  gold:   { name:'Gold',   fee:0.04, monthly:100, color:'#f5c518', icon:'🥇' }
};

const PLATFORM_FEE = 0.08;

let allBusinesses = [], allParts = [], allOrders = [], allMessages = [];
let allPlanRequests = [], allWeeklyPromos = [];
let lang = 'sq', currentPage = 'dashboard', currentOrderFilter = 'all';
let adminOrderPage = 1;
const adminOrdersPerPage = 20;

const L = {
  sq: {
    pageTitle:'Cardeals.al — Admin Panel', loginBadge:'ADMIN PANEL',
    loginEmailLabel:'EMAIL ADMIN', loginEmailPlaceholder:'emaili_juaj@gmail.com',
    loginPassLabel:'FJALËKALIMI', loginPassPlaceholder:'••••••••',
    loginBtn:'HYRJA →', loginLoading:'Duke hyrë...',
    loginErrorAccess:'Akses i refuzuar. Vetëm për admin.',
    loginErrorWrong:'Kredenciale të gabuara', loginErrorFill:'Plotëso të gjitha fushat',
    adminIdentified:'Identifikuar si Admin', sidebarAdminPill:'ADMIN',
    navDashboard:'Pasqyra Kryesore', navBusinesses:'Të Gjitha Bizneset',
    navParts:'Të Gjitha Pjesët', navOrders:'Të Gjitha Porositë',
    navMessages:'Mesazhet e Kontaktit', navWeeklyPromos:'Promocione Javore',
    navEarnings:'Fitimet e Platformës', navPlans:'Kërkesat për Plane',
    secOverview:'KRYEFAQJA', secManagement:'MENAXHIM',
    secPromotions:'PROMOCIONE', secFinances:'FINANCAT',
    topbarDashboard:'PASQYRA KRYESORE', topbarBusinesses:'TË GJITHA BIZNESET',
    topbarParts:'TË GJITHA PJESËT', topbarOrders:'TË GJITHA POROSITË',
    topbarMessages:'MESAZHET E KONTAKTIT', topbarWeeklyPromos:'PROMOCIONE JAVORE',
    topbarEarnings:'FITIMET E PLATFORMËS', topbarPlans:'KËRKESAT PËR PLANE',
    statRevenue:'Fitimet e Platformës', statGMV:'Vlera Totale Shitjeve',
    statBiz:'Biznese të Regjistruara', statParts:'Pjesë Aktive',
    statOrders:'Porosi Totale', statPending:'Porosi në Pritje',
    recentActivity:'AKTIVITETI I FUNDIT', noActivity:'Asnjë aktivitet',
    thBiz:'Biznesi', thCity:'Qyteti', thPlan:'Plani', thParts:'Pjesë',
    thSales:'Shitje', thEarn:'Fitim', thStatus:'Statusi', thActions:'Veprime',
    thPart:'Pjesa', thSeller:'Shitësi', thCondition:'Gjendja', thStock:'Stoku',
    thBasePrice:'Çmimi Bazë', thFinal:'Final', thOrderNum:'#',
    thOrderPart:'Pjesa', thOrderBuyer:'Blerësi', thOrderSeller:'Shitësi',
    thOrderDate:'Data', thOrderPrice:'Çmimi', thOrderProfit:'Fitimi',
    thOrderStatus:'Statusi', thMsgStatus:'Status', thName:'Emri',
    thEmail:'Email', thDate:'Data', thMessage:'Mesazhi', thAction:'Veprim',
    thBizPromo:'Biznesi', thTier:'Tier', thCost:'Çmimi', thExpires:'Skadon',
    thFrom:'Nga', thTo:'Në', thMonth:'Muaji', thGMV:'GMV',
    active:'Aktiv', suspended:'Pezulluar', sold:'Shitur', pending:'Në Pritje',
    cancelled:'Anuluar', approved:'Aprovuar', rejected:'Refuzuar',
    expired:'Skaduar', new_:'E Re', used:'E Përdorur',
    unread:'Pashënuar', read:'Lexo',
    fixDataBtn:'Rregullo të Dhënat',
    fixDataConfirm:'Kjo do të rregullojë lidhjen midis bizneseve dhe pjesëve të tyre. Vazhdo?',
    fixDataRunning:'Duke rregulluar...', fixDataDone:'pjesë u rregulluan! Rifresko faqen.',
    searchBiz:'Kërko biznes...', searchParts:'Kërko pjesë...',
    noBusinesses:'Asnjë biznes.', noParts:'Asnjë pjesë.',
    noOrders:'Asnjë porosi.', noMessages:'Nuk ka mesazhe.',
    noPlanRequests:'Nuk ka kërkesa.', noPromoRequests:'Nuk ka kërkesa.',
    noEarnings:'Ende nuk ka shitje.', ordersCount:'porosi',
    filterAll:'Të Gjitha', filterPending:'Në Pritje', filterSold:'Shitur',
    msgDetailTitle:'Detajet e Mesazhit', msgFrom:'Nga:', msgEmail:'Email:',
    msgContent:'Mesazhi:', changePlanTitle:'NDRYSHO PLANIN',
    changePlanBiz:'Biznesi:', changePlanCurrent:'✓ AKTUAL',
    changePlanConfirm:'KONFIRMO', changePlanCancel:'Anulo',
    changePlanUpdating:'Duke ndryshuar...',
    earnTotalFees:'Fitimi Platformës (8%)', earnTotalGMV:'GMV Total',
    earnTotalOrders:'Shitje të Konfirmuara',
    earnMonthlyTitle:'PËRMBLEDHJA MUJORE', earnMonthlyStatus:'✓',
    backMarketplace:'Cardeals.al ↗', backBackoffice:'Backoffice ↗',
    logoutBtn:'Dil nga Admin',
    toastStatusUpdated:'Statusi u përditësua!',
    toastPlanActivated:'Plani u aktivua!',
    toastPlanRejected:'Kërkesa u refuzua.',
    toastPlanChanged:'Plani u ndryshua!',
    toastPromoApproved:'Promocioni u aktivua për',
    toastPromoApprovedDays:'ditë!',
    toastPromoApprovedRefresh:'(ri-boostohet çdo',
    toastPromoApprovedRefreshEnd:'h)',
    toastPromoRejected:'Kërkesa u refuzua.', toastError:'Gabim',
    approveBtn:'✅', rejectBtn:'❌',
    toggleSuspend:'⏸️', toggleActivate:'▶️',
    viewDetails:'👁️', changePlanBtn:'⭐',
    detailParts:'Pjesë', detailSales:'Shitje',
    promoWeek:'PROMOCIONE JAVORE', promoPricePrefix:'€',
    tierRefreshEvery:'çdo', tierRefreshHour:'h',
    noDate:'Pa datë', pageLabel:'Faqja', ofLabel:'nga'
  },
  en: {
    pageTitle:'Cardeals.al — Admin Panel', loginBadge:'ADMIN PANEL',
    loginEmailLabel:'ADMIN EMAIL', loginEmailPlaceholder:'your_email@gmail.com',
    loginPassLabel:'PASSWORD', loginPassPlaceholder:'••••••••',
    loginBtn:'LOGIN →', loginLoading:'Logging in...',
    loginErrorAccess:'Access denied. Admin only.',
    loginErrorWrong:'Wrong credentials', loginErrorFill:'Fill all fields',
    adminIdentified:'Logged in as Admin', sidebarAdminPill:'ADMIN',
    navDashboard:'Dashboard', navBusinesses:'All Businesses',
    navParts:'All Parts', navOrders:'All Orders',
    navMessages:'Contact Messages', navWeeklyPromos:'Weekly Promotions',
    navEarnings:'Platform Earnings', navPlans:'Plan Requests',
    secOverview:'OVERVIEW', secManagement:'MANAGEMENT',
    secPromotions:'PROMOTIONS', secFinances:'FINANCES',
    topbarDashboard:'DASHBOARD', topbarBusinesses:'ALL BUSINESSES',
    topbarParts:'ALL PARTS', topbarOrders:'ALL ORDERS',
    topbarMessages:'CONTACT MESSAGES', topbarWeeklyPromos:'WEEKLY PROMOTIONS',
    topbarEarnings:'PLATFORM EARNINGS', topbarPlans:'PLAN REQUESTS',
    statRevenue:'Platform Earnings', statGMV:'Total Sales Value',
    statBiz:'Registered Businesses', statParts:'Active Parts',
    statOrders:'Total Orders', statPending:'Pending Orders',
    recentActivity:'RECENT ACTIVITY', noActivity:'No activity',
    thBiz:'Business', thCity:'City', thPlan:'Plan', thParts:'Parts',
    thSales:'Sales', thEarn:'Earnings', thStatus:'Status', thActions:'Actions',
    thPart:'Part', thSeller:'Seller', thCondition:'Condition', thStock:'Stock',
    thBasePrice:'Base Price', thFinal:'Final', thOrderNum:'#',
    thOrderPart:'Part', thOrderBuyer:'Buyer', thOrderSeller:'Seller',
    thOrderDate:'Date', thOrderPrice:'Price', thOrderProfit:'Profit',
    thOrderStatus:'Status', thMsgStatus:'Status', thName:'Name',
    thEmail:'Email', thDate:'Date', thMessage:'Message', thAction:'Action',
    thBizPromo:'Business', thTier:'Tier', thCost:'Price', thExpires:'Expires',
    thFrom:'From', thTo:'To', thMonth:'Month', thGMV:'GMV',
    active:'Active', suspended:'Suspended', sold:'Sold', pending:'Pending',
    cancelled:'Cancelled', approved:'Approved', rejected:'Rejected',
    expired:'Expired', new_:'New', used:'Used',
    unread:'Unread', read:'Read',
    fixDataBtn:'Fix Data',
    fixDataConfirm:'This will fix the link between businesses and their parts. Continue?',
    fixDataRunning:'Fixing...', fixDataDone:'parts fixed! Refresh the page.',
    searchBiz:'Search business...', searchParts:'Search part...',
    noBusinesses:'No businesses.', noParts:'No parts.',
    noOrders:'No orders.', noMessages:'No messages.',
    noPlanRequests:'No requests.', noPromoRequests:'No requests.',
    noEarnings:'No sales yet.', ordersCount:'orders',
    filterAll:'All', filterPending:'Pending', filterSold:'Sold',
    msgDetailTitle:'Message Details', msgFrom:'From:', msgEmail:'Email:',
    msgContent:'Message:', changePlanTitle:'CHANGE PLAN',
    changePlanBiz:'Business:', changePlanCurrent:'✓ CURRENT',
    changePlanConfirm:'CONFIRM', changePlanCancel:'Cancel',
    changePlanUpdating:'Updating...',
    earnTotalFees:'Platform Earnings (8%)', earnTotalGMV:'Total GMV',
    earnTotalOrders:'Confirmed Sales',
    earnMonthlyTitle:'MONTHLY SUMMARY', earnMonthlyStatus:'✓',
    backMarketplace:'Cardeals.al ↗', backBackoffice:'Backoffice ↗',
    logoutBtn:'Admin Logout',
    toastStatusUpdated:'Status updated!',
    toastPlanActivated:'Plan activated!',
    toastPlanRejected:'Request rejected.',
    toastPlanChanged:'Plan changed!',
    toastPromoApproved:'Promotion activated for',
    toastPromoApprovedDays:'days!',
    toastPromoApprovedRefresh:'(re-boosts every',
    toastPromoApprovedRefreshEnd:'h)',
    toastPromoRejected:'Request rejected.', toastError:'Error',
    approveBtn:'✅', rejectBtn:'❌',
    toggleSuspend:'⏸️', toggleActivate:'▶️',
    viewDetails:'👁️', changePlanBtn:'⭐',
    detailParts:'Parts', detailSales:'Sales',
    promoWeek:'WEEKLY PROMOTIONS', promoPricePrefix:'€',
    tierRefreshEvery:'every', tierRefreshHour:'h',
    noDate:'No date', pageLabel:'Page', ofLabel:'of'
  }
};

function l(k) { return L[lang][k] || k; }
function s(id, v) { const el = document.getElementById(id); if (el) el.textContent = v; }
function showError(msg) { const el = document.getElementById('loginError'); if (el) { el.textContent = msg; el.style.display = 'block'; } }
function showToast(msg, isErr) { const t = document.getElementById('toast'); t.textContent = msg; t.style.background = isErr ? '#c62828' : '#2e7d32'; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 4000); }

// ===== AUTH =====
auth.onAuthStateChanged(async user => {
  if (user) {
    if (user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      await auth.signOut();
      showError(l('loginErrorAccess'));
      return;
    }
    document.getElementById('adminEmail').textContent = user.email;
    showApp();
    loadAllData();
  } else {
    showLogin();
  }
});

window.doLogin = async function() {
  const e = document.getElementById('loginEmail').value.trim();
  const p = document.getElementById('loginPass').value;
  const btn = document.getElementById('loginBtn');
  if (!e || !p) { showError(l('loginErrorFill')); return; }
  btn.textContent = l('loginLoading'); btn.disabled = true;
  try { await auth.signInWithEmailAndPassword(e, p); }
  catch (err) { showError(l('loginErrorWrong')); btn.textContent = l('loginBtn'); btn.disabled = false; }
};

window.doLogout = async () => { await auth.signOut(); };

function showApp() { document.getElementById('loginScreen').style.display = 'none'; document.getElementById('app').style.display = 'flex'; applyLang(); }
function showLogin() { document.getElementById('loginScreen').style.display = 'flex'; document.getElementById('app').style.display = 'none'; }

// ===== DATA LOADING =====
function loadAllData() { loadBusinesses(); loadAllParts(); loadAllOrders(); loadMessages(); loadPlanRequests(); loadWeeklyPromos(); }

function loadBusinesses() {
  db.collection("businesses").onSnapshot(snap => {
    allBusinesses = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderBusinesses(); updateDashboard();
  });
}

function loadAllParts() {
  db.collection("parts").onSnapshot(snap => {
    allParts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderAllParts(); updateDashboard();
  });
}

function loadAllOrders() {
  db.collection("orders").onSnapshot(snap => {
    allOrders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderAllOrders(currentOrderFilter || 'all');
    renderEarnings(); updateDashboard();
  });
}

function loadMessages() {
  db.collection("contact_messages").orderBy("createdAt", "desc").onSnapshot(snap => {
    allMessages = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderMessages(); updateMessageBadge();
  });
}

function loadPlanRequests() {
  db.collection("plan_requests").orderBy("createdAt", "desc").onSnapshot(snap => {
    allPlanRequests = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderPlanRequests(); updatePlansBadge();
  });
}

function loadWeeklyPromos() {
  db.collection("weekly_promotions").orderBy("createdAt", "desc").onSnapshot(snap => {
    allWeeklyPromos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderWeeklyPromos(); updatePromoBadge();
  });
}

// ===== BADGES =====
function updatePromoBadge() {
  var pending = allWeeklyPromos.filter(p => p.status === 'pending').length;
  var badge = document.getElementById('promoBadge');
  if (badge) { badge.textContent = pending; badge.style.display = pending > 0 ? 'inline-block' : 'none'; }
}

function updatePlansBadge() {
  var pending = allPlanRequests.filter(p => p.status === 'pending').length;
  var badge = document.getElementById('plansBadge');
  if (badge) { badge.textContent = pending; badge.style.display = pending > 0 ? 'inline-block' : 'none'; }
}

function updateMessageBadge() {
  var unread = allMessages.filter(m => m.status === 'unread').length;
  var badge = document.getElementById('msgBadge');
  if (badge) { badge.textContent = unread; badge.style.display = unread > 0 ? 'inline-block' : 'none'; }
}

// ===== DASHBOARD =====
function updateDashboard() {
  const sold = allOrders.filter(o => o.status === 'sold');
  s('statRevenue', sold.reduce((sum, o) => sum + (o.platformFee || 0), 0).toLocaleString() + ' L');
  s('statGMV', sold.reduce((sum, o) => sum + (o.totalPrice || 0), 0).toLocaleString() + ' L');
  s('statBiz', allBusinesses.length);
  s('statParts', allParts.filter(p => p.status === 'active').length);
  s('statOrders', allOrders.length);
  s('statPending', allOrders.filter(o => o.status === 'pending').length);

  const recent = allOrders.slice(0, 6);
  const actEl = document.getElementById('recentActivity');
  if (actEl) {
    actEl.innerHTML = recent.length
      ? recent.map(o => `<div class="activity-row"><div class="act-icon">${o.status === 'sold' ? '💰' : '⏳'}</div><div class="act-info"><div class="act-title">${o.partName || '—'}</div><div class="act-sub">${o.buyerName || '—'} · ${o.sellerName || '—'}</div></div><div class="act-price" style="color:${o.status === 'sold' ? '#2e7d32' : '#f57c00'}">${(o.totalPrice || 0).toLocaleString()} L</div></div>`).join('')
      : `<div style="text-align:center;padding:2rem;color:#888;">${l('noActivity')}</div>`;
  }
}

// ===== BUSINESSES =====
function renderBusinesses(filter = '') {
  const tbody = document.getElementById('bizBody'); if (!tbody) return;
  let list = allBusinesses;
  if (filter) list = list.filter(b => (b.businessName || '').toLowerCase().includes(filter.toLowerCase()) || (b.email || '').toLowerCase().includes(filter.toLowerCase()));
  if (!list.length) { tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:2rem;color:#888;">${l('noBusinesses')}</td></tr>`; return; }
  tbody.innerHTML = list.map(b => {
    const bizParts = allParts.filter(p => p.uid === b.id).length;
    const bizSales = allOrders.filter(o => o.sellerUid === b.id && o.status === 'sold').length;
    const bizEarn = allOrders.filter(o => o.sellerUid === b.id && o.status === 'sold').reduce((s, o) => s + (o.platformFee || 0), 0);
    const plan = b.plan || 'basic', planData = PLANS[plan];
    return `<tr><td style="font-weight:600;">${b.businessName || b.name || '—'}<br><small style="color:#888">${b.email || ''}</small></td><td style="color:#888">${b.city || '—'}</td><td><span style="color:${planData.color};font-weight:600;">${planData.icon} ${planData.name}</span><br><small>${planData.monthly === 0 ? 'Falas' : '€' + planData.monthly + '/muaj'}</small></td><td>${bizParts}</td><td>${bizSales}</td><td style="color:#2e7d32;font-weight:600">${bizEarn.toLocaleString()} L</td><td><span class="sbadge ${b.status !== 'suspended' ? 's-active' : 's-suspended'}">${b.status !== 'suspended' ? l('active') : l('suspended')}</span></td><td><div style="display:flex;gap:0.5rem;"><button class="icon-btn" onclick="toggleBizStatus('${b.id}','${b.status || 'active'}')">${b.status !== 'suspended' ? l('toggleSuspend') : l('toggleActivate')}</button><button class="icon-btn" onclick="openChangePlan('${b.id}','${b.businessName || b.name || ''}','${plan}')">${l('changePlanBtn')}</button><button class="icon-btn" onclick="viewBizDetails('${b.id}')">${l('viewDetails')}</button></div></td></tr>`;
  }).join('');
}

window.toggleBizStatus = async function(id, s) {
  const ns = s === 'suspended' ? 'active' : 'suspended';
  await db.collection("businesses").doc(id).update({ status: ns });
  showToast(l('toastStatusUpdated'));
};

window.viewBizDetails = function(id) {
  const b = allBusinesses.find(x => x.id === id); if (!b) return;
  document.getElementById('detailContent').innerHTML = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;"><div class="detail-card"><div class="dc-val">${allParts.filter(p => p.uid === id).length}</div><div class="dc-lbl">${l('detailParts')}</div></div><div class="detail-card"><div class="dc-val">${allOrders.filter(o => o.sellerUid === id && o.status === 'sold').length}</div><div class="dc-lbl">${l('detailSales')}</div></div></div>`;
  document.getElementById('detailTitle').textContent = b.businessName || b.name || '—';
  document.getElementById('detailModal').classList.add('open');
};

// ===== PARTS =====
function renderAllParts(filter = '') {
  const tbody = document.getElementById('allPartsBody'); if (!tbody) return;
  let list = allParts;
  if (filter) list = list.filter(p => { const name = typeof p.name === 'object' ? p.name.sq : p.name; return (name || '').toLowerCase().includes(filter.toLowerCase()); });
  if (!list.length) { tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:2rem;">${l('noParts')}</td></tr>`; return; }
  tbody.innerHTML = list.map(p => {
    const name = typeof p.name === 'object' ? p.name.sq || p.name.en : p.name;
    const stk = p.stock || 0;
    return `<tr><td style="font-weight:600;">${p.emoji || ''} <strong>${name || '—'}</strong><br><small style="color:#888">${p.fits || ''}</small></td><td style="color:#888">${p.sellerName || '—'}</td><td style="color:#888">${p.condition === 'new' ? l('new_') : l('used')}</td><td style="font-weight:600;color:${stk <= 3 ? '#f57c00' : '#2e7d32'}">${stk === 0 ? '0' : stk}</td><td>${(p.basePrice || 0).toLocaleString()} L</td><td style="font-weight:600;color:#f57c00">${((p.basePrice || 0) + Math.round((p.basePrice || 0) * PLATFORM_FEE)).toLocaleString()} L</td><td><span class="sbadge ${p.status === 'active' ? 's-active' : 's-suspended'}">${p.status === 'active' ? l('active') : l('suspended')}</span></td><td><button class="icon-btn" onclick="adminTogglePart('${p.id}','${p.status}')">${p.status === 'active' ? l('toggleSuspend') : l('toggleActivate')}</button></td></tr>`;
  }).join('');
}

window.adminTogglePart = async function(id, status) {
  const ns = status === 'active' ? 'inactive' : 'active';
  await db.collection("parts").doc(id).update({ status: ns });
  showToast(l('toastStatusUpdated'));
};

// ===== ORDERS =====
function renderAllOrders(filter) {
  currentOrderFilter = filter || 'all';
  const tbody = document.getElementById('allOrdersBody'); if (!tbody) return;
  let list = allOrders;
  if (filter === 'pending') list = allOrders.filter(o => o.status === 'pending');
  if (filter === 'sold') list = allOrders.filter(o => o.status === 'sold');
  document.getElementById('ordersCount').textContent = list.length + ' ' + l('ordersCount');
  if (!list.length) { tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:2rem;">' + l('noOrders') + '</td></tr>'; return; }

  list.sort((a, b) => new Date(b.createdAt?.toDate?.() || 0) - new Date(a.createdAt?.toDate?.() || 0));

  var totalPages = Math.ceil(list.length / adminOrdersPerPage);
  if (adminOrderPage > totalPages) adminOrderPage = 1;
  if (totalPages === 0) adminOrderPage = 1;
  var start = (adminOrderPage - 1) * adminOrdersPerPage;
  var paginated = list.slice(start, start + adminOrdersPerPage);

  var groupedByDate = {};
  paginated.forEach(o => {
    var date = o.createdAt?.toDate ? o.createdAt.toDate().toLocaleDateString('sq-AL', { day: '2-digit', month: 'long', year: 'numeric' }) : l('noDate');
    if (!groupedByDate[date]) groupedByDate[date] = [];
    groupedByDate[date].push(o);
  });

  var html = '';
  for (var date in groupedByDate) {
    html += '<tr><td colspan="8" style="background:#fafafa;font-weight:700;font-size:0.8rem;color:#b45309;padding:10px 1.25rem;border-bottom:2px solid var(--border);">📅 ' + date + ' — ' + groupedByDate[date].length + ' ' + l('ordersCount') + '</td></tr>';
    groupedByDate[date].forEach(o => {
      var fee = o.platformFee || Math.round((o.totalPrice || 0) * PLATFORM_FEE / 1.08);
      var sc = o.status === 'sold' ? 's-sold' : o.status === 'pending' ? 's-pending' : 's-suspended';
      var sl = o.status === 'sold' ? l('sold') : o.status === 'pending' ? l('pending') : l('cancelled');
      var orderDate = o.createdAt?.toDate ? o.createdAt.toDate().toLocaleDateString('sq-AL') : '—';
      var shipping = o.shippingFee ? o.shippingFee.toLocaleString() + ' L' : '0 L';
      html += '<tr><td style="font-weight:600;color:#b45309;">#' + o.id?.slice(-6) + '</td><td><strong>' + o.partName + '</strong><br><small style="color:#888;">' + o.partId?.slice(-6) + '</small></td><td><strong>' + o.buyerName + '</strong><br><small>' + o.buyerPhone + '</small>' + (o.deliveryAddress ? '<br><small>📍 ' + o.deliveryAddress.substring(0, 30) + '</small>' : '') + '</td><td>' + o.sellerName + '</td><td style="color:#888;font-size:0.8rem;">' + orderDate + '</td><td style="font-weight:600;color:#f57c00;">' + (o.totalPrice || 0).toLocaleString() + ' L<br><small>🚚 ' + shipping + '</small></td><td style="font-weight:600;color:#2e7d32;">+' + fee.toLocaleString() + ' L</td><td><span class="sbadge ' + sc + '">' + sl + '</span></td></tr>';
    });
  }

  html += '<tr><td colspan="8" style="text-align:center;padding:12px;background:#fafafa;">';
  html += '<button class="icon-btn" onclick="adminOrderPage=1;renderAllOrders(\'' + (currentOrderFilter || 'all') + '\');" ' + (adminOrderPage === 1 ? 'disabled' : '') + '>«</button> ';
  html += '<button class="icon-btn" onclick="if(adminOrderPage>1){adminOrderPage--;renderAllOrders(\'' + (currentOrderFilter || 'all') + '\');}" ' + (adminOrderPage === 1 ? 'disabled' : '') + '>‹</button> ';
  html += '<span style="margin:0 12px;font-weight:600;">' + l('pageLabel') + ' ' + adminOrderPage + ' ' + l('ofLabel') + ' ' + totalPages + '</span> ';
  html += '<button class="icon-btn" onclick="if(adminOrderPage<' + totalPages + '){adminOrderPage++;renderAllOrders(\'' + (currentOrderFilter || 'all') + '\');}" ' + (adminOrderPage >= totalPages ? 'disabled' : '') + '>›</button> ';
  html += '<button class="icon-btn" onclick="adminOrderPage=' + totalPages + ';renderAllOrders(\'' + (currentOrderFilter || 'all') + '\');" ' + (adminOrderPage >= totalPages ? 'disabled' : '') + '>»</button>';
  html += '</td></tr>';

  tbody.innerHTML = html;
}

window.filterOrders = function(f, btn) {
  document.querySelectorAll('.ot-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  adminOrderPage = 1;
  renderAllOrders(f);
};

// ===== MESSAGES =====
function renderMessages() {
  const tbody = document.getElementById('messagesBody'); if (!tbody) return;
  if (!allMessages.length) { tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;">' + l('noMessages') + '</td></tr>'; return; }
  tbody.innerHTML = allMessages.map(m => {
    const date = m.createdAt?.toDate ? m.createdAt.toDate().toLocaleDateString('sq-AL') : '—';
    return `<tr onclick="viewMessage('${m.id}')" style="cursor:pointer;">
      <td>${m.status === 'unread' ? '🔴 <strong>' + l('unread') + '</strong>' : '✅ <span style="color:#2e7d32;">' + l('read') + '</span>'}</td>
      <td><strong>${m.name || '—'}</strong></td>
      <td style="color:#888">${m.email || '—'}</td>
      <td style="color:#888;font-size:0.8rem">${date}</td>
      <td style="max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${m.message || '—'}</td>
      <td><button class="icon-btn" onclick="event.stopPropagation();toggleMessageStatus('${m.id}','${m.status}')">${m.status === 'unread' ? l('read') : l('unread')}</button></td>
    </tr>`;
  }).join('');
}

window.viewMessage = function(id) {
  const m = allMessages.find(x => x.id === id); if (!m) return;
  document.getElementById('msgDetailContent').innerHTML = `<div style="background:#fafafa;border-radius:8px;padding:1.25rem;"><div><strong>${l('msgFrom')}</strong> ${m.name || '—'}</div><div><strong>${l('msgEmail')}</strong> <a href="mailto:${m.email}" style="color:#b45309">${m.email || '—'}</a></div><div style="margin-top:1rem;padding-top:1rem;border-top:1px solid var(--border);"><strong>${l('msgContent')}</strong><br>${m.message || '—'}</div></div>`;
  if (m.status === 'unread') { db.collection("contact_messages").doc(id).update({ status: 'read' }); }
  document.getElementById('msgDetailModal').classList.add('open');
};

window.toggleMessageStatus = async function(id, status) {
  const ns = status === 'unread' ? 'read' : 'unread';
  await db.collection("contact_messages").doc(id).update({ status: ns });
  showToast(l('toastStatusUpdated'));
};

// ===== PLAN REQUESTS =====
function renderPlanRequests() {
  const tbody = document.getElementById('planRequestsBody'); if (!tbody) return;
  if (!allPlanRequests.length) { tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">${l('noPlanRequests')}</td></tr>`; return; }
  tbody.innerHTML = allPlanRequests.map(r => {
    const date = r.createdAt?.toDate ? r.createdAt.toDate().toLocaleDateString('sq-AL') : '—';
    const fromPlan = PLANS[r.fromPlan] || PLANS.basic, toPlan = PLANS[r.toPlan] || PLANS.basic;
    return `<tr><td style="font-weight:600;">${r.businessName || '—'}<br><small>${r.email || ''}</small></td><td><span style="color:${fromPlan.color};">${fromPlan.icon} ${fromPlan.name}</span><br><small>${fromPlan.monthly === 0 ? 'Falas' : '€' + fromPlan.monthly + '/muaj'}</small></td><td><span style="color:${toPlan.color};font-weight:600;">${toPlan.icon} ${toPlan.name}</span><br><small>€${toPlan.monthly}/muaj · ${Math.round(toPlan.fee * 100)}%</small></td><td>${date}</td><td><span class="sbadge ${r.status === 'approved' ? 's-active' : r.status === 'rejected' ? 's-suspended' : 's-pending'}">${r.status === 'approved' ? l('approved') : r.status === 'rejected' ? l('rejected') : l('pending')}</span></td><td>${r.status === 'pending' ? `<div style="display:flex;gap:0.5rem;"><button class="icon-btn" style="background:rgba(46,125,50,0.1);border-color:#2e7d32;color:#2e7d32;" onclick="approvePlan('${r.id}')">${l('approveBtn')}</button><button class="icon-btn" style="background:rgba(198,40,40,0.08);border-color:#c62828;color:#c62828;" onclick="rejectPlan('${r.id}')">${l('rejectBtn')}</button></div>` : '—'}</td></tr>`;
  }).join('');
}

window.approvePlan = async function(id) {
  const req = allPlanRequests.find(x => x.id === id); if (!req) return;
  const now = new Date(); const expiresAt = new Date(now); expiresAt.setDate(expiresAt.getDate() + 30);
  try {
    await db.collection("businesses").doc(req.businessId).update({ plan: req.toPlan, commissionRate: Math.round(PLANS[req.toPlan].fee * 100), planActivatedAt: now, planExpiresAt: expiresAt });
    await db.collection("plan_requests").doc(id).update({ status: 'approved' });
    showToast(l('toastPlanActivated'));
  } catch (e) { showToast(l('toastError'), true); }
};

window.rejectPlan = async function(id) {
  await db.collection("plan_requests").doc(id).update({ status: 'rejected' });
  showToast(l('toastPlanRejected'));
};

// ===== WEEKLY PROMOS =====
function renderWeeklyPromos() {
  const tbody = document.getElementById('weeklyPromosBody'); if (!tbody) return;
  if (!allWeeklyPromos.length) { tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;">${l('noPromoRequests')}</td></tr>`; return; }
  const tierColors = { basic: '#8892a4', standard: '#94a3b8', premium: '#f5c518', ultimate: '#e2e8f0' };
  const tierIcons = { basic: '🥉', standard: '🥈', premium: '🥇', ultimate: '💎' };
  tbody.innerHTML = allWeeklyPromos.map(r => {
    const date = r.createdAt?.toDate ? r.createdAt.toDate().toLocaleDateString('sq-AL') : '—';
    const expires = r.expiresAt?.toDate ? r.expiresAt.toDate().toLocaleDateString('sq-AL') : '—';
    const tier = r.tier || 'basic';
    const tierLabel = (r.tierName || 'Basic') + (r.refreshHours ? ` (${l('tierRefreshEvery')} ${r.refreshHours}${l('tierRefreshHour')})` : '');
    return `<tr><td style="font-weight:600;">${r.businessName || '—'}<br><small>${r.email || ''}</small></td><td>${r.partName || '—'}</td><td style="font-weight:600;color:${tierColors[tier] || '#8892a4'};">${tierIcons[tier] || ''} ${tierLabel}</td><td style="font-weight:600;color:#f57c00;">${l('promoPricePrefix')}${r.cost || 3}</td><td>${date}</td><td>${expires || '—'}</td><td><span class="sbadge ${r.status === 'active' ? 's-active' : r.status === 'expired' ? 's-suspended' : 's-pending'}">${r.status === 'active' ? l('active') : r.status === 'expired' ? l('expired') : l('pending')}</span></td><td>${r.status === 'pending' ? `<div style="display:flex;gap:0.5rem;"><button class="icon-btn" style="background:rgba(46,125,50,0.1);border-color:#2e7d32;color:#2e7d32;" onclick="approveWeeklyPromo('${r.id}')">${l('approveBtn')}</button><button class="icon-btn" style="background:rgba(198,40,40,0.08);border-color:#c62828;color:#c62828;" onclick="rejectWeeklyPromo('${r.id}')">${l('rejectBtn')}</button></div>` : '—'}</td></tr>`;
  }).join('');
}

window.approveWeeklyPromo = async function(id) {
  const promo = allWeeklyPromos.find(p => p.id === id); if (!promo) return;
  const now = new Date();
  const durationDays = promo.durationDays || 7;
  const refreshHours = promo.refreshHours || null;
  const expiresAt = new Date(now); expiresAt.setDate(expiresAt.getDate() + durationDays);
  try {
    await db.collection("weekly_promotions").doc(id).update({ status: 'active', activatedAt: now, lastBoostedAt: now, promoRefreshInterval: refreshHours, expiresAt: expiresAt });
    await db.collection("parts").doc(promo.partId).update({ weeklyPromo: true, promoActivatedAt: now, promoExpiresAt: expiresAt, promoRefreshInterval: refreshHours, promoLastBoostedAt: now, promoTier: promo.tier || 'basic', promoTierName: promo.tierName || 'Basic' });
    const tierLabel = promo.tierName || 'Basic';
    const refreshMsg = refreshHours ? ` ${l('toastPromoApprovedRefresh')} ${refreshHours}${l('toastPromoApprovedRefreshEnd')}` : '';
    showToast(`✅ ${l('toastPromoApproved')} ${tierLabel} ${durationDays} ${l('toastPromoApprovedDays')}${refreshMsg}`);
  } catch (e) { showToast(l('toastError') + ': ' + e.message, true); }
};

window.rejectWeeklyPromo = async function(id) {
  await db.collection("weekly_promotions").doc(id).update({ status: 'rejected' });
  showToast(l('toastPromoRejected'));
};

// ===== FIX DATA =====
window.fixBusinessData = async function() {
  if (!confirm(l('fixDataConfirm'))) return;
  showToast(l('fixDataRunning'));
  let fixed = 0;
  for (const biz of allBusinesses) {
    const bizName = (biz.businessName || biz.name || '').toLowerCase().trim();
    const bizEmail = (biz.email || '').toLowerCase().trim();
    for (const part of allParts) {
      const sellerName = (part.sellerName || '').toLowerCase().trim();
      const partUid = part.uid || '';
      if ((sellerName === bizName || sellerName === bizEmail || partUid === bizEmail) && partUid !== biz.id) {
        try { await db.collection("parts").doc(part.id).update({ uid: biz.id }); fixed++; }
        catch (e) { console.error(e); }
      }
    }
  }
  showToast(`✅ ${fixed} ${l('fixDataDone')}`);
};

// ===== CHANGE PLAN =====
window.openChangePlan = function(bizId, bizName, currentPlan) {
  document.getElementById('changePlanBizName').textContent = bizName;
  document.getElementById('changePlanBizId').value = bizId;
  const container = document.getElementById('changePlanOptions');
  container.innerHTML = Object.entries(PLANS).map(([key, p]) => {
    const isCurrent = key === currentPlan;
    return `<div onclick="selectPlanOption('${key}')" id="planOpt_${key}" style="background:${isCurrent ? '#fafafa' : 'var(--bg)'};border:2px solid ${isCurrent ? p.color : 'var(--border)'};border-radius:8px;padding:1rem;cursor:pointer;display:flex;align-items:center;gap:1rem;"><div style="font-size:1.5rem">${p.icon}</div><div style="flex:1"><div style="font-weight:600;color:${p.color}">${p.name}</div><div style="font-size:0.75rem;color:#888">${p.monthly === 0 ? 'Falas' : '€' + p.monthly + '/muaj'} · ${Math.round(p.fee * 100)}% komision</div></div>${isCurrent ? `<span style="font-size:0.7rem;color:#2e7d32;">${l('changePlanCurrent')}</span>` : ''}</div>`;
  }).join('');
  document.getElementById('selectedPlanKey').value = currentPlan;
  document.getElementById('changePlanModal').classList.add('open');
};

window.selectPlanOption = function(key) {
  document.getElementById('selectedPlanKey').value = key;
  Object.keys(PLANS).forEach(k => {
    const el = document.getElementById('planOpt_' + k);
    if (el) { el.style.border = k === key ? '2px solid ' + PLANS[k].color : '2px solid var(--border)'; el.style.background = k === key ? '#fafafa' : 'var(--bg)'; }
  });
};

window.confirmChangePlan = async function() {
  const bizId = document.getElementById('changePlanBizId').value;
  const newPlan = document.getElementById('selectedPlanKey').value;
  const btn = document.getElementById('confirmPlanBtn');
  btn.textContent = l('changePlanUpdating'); btn.disabled = true;
  const now = new Date(); const expiresAt = new Date(now); expiresAt.setDate(expiresAt.getDate() + 30);
  try {
    await db.collection("businesses").doc(bizId).update({ plan: newPlan, commissionRate: Math.round(PLANS[newPlan].fee * 100), planActivatedAt: now, planExpiresAt: expiresAt });
    closeModal('changePlanModal');
    showToast(l('toastPlanChanged'));
  } catch (e) { showToast(l('toastError'), true); }
  btn.textContent = l('changePlanConfirm'); btn.disabled = false;
};

// ===== EARNINGS =====
function renderEarnings() {
  const sold = allOrders.filter(o => o.status === 'sold');
  s('earnTotalFees', sold.reduce((s, o) => s + (o.platformFee || 0), 0).toLocaleString() + ' L');
  s('earnTotalGMV', sold.reduce((s, o) => s + (o.totalPrice || 0), 0).toLocaleString() + ' L');
  s('earnTotalOrders', sold.length);
  const byMonth = {};
  sold.forEach(o => {
    const d = o.createdAt?.toDate ? o.createdAt.toDate() : new Date();
    const key = d.getFullYear() + '-' + (d.getMonth() + 1).toString().padStart(2, '0');
    const label = d.toLocaleDateString('sq-AL', { month: 'long', year: 'numeric' });
    if (!byMonth[key]) byMonth[key] = { label, orders: 0, gmv: 0, fees: 0 };
    byMonth[key].orders++;
    byMonth[key].gmv += o.totalPrice || 0;
    byMonth[key].fees += o.platformFee || 0;
  });
  const earnBody = document.getElementById('earningsBody');
  if (!earnBody) return;
  earnBody.innerHTML = Object.values(byMonth).reverse().map(m => `<tr><td style="font-weight:600">${m.label}</td><td>${m.orders}</td><td style="color:#f57c00">${m.gmv.toLocaleString()} L</td><td style="color:#2e7d32">+${m.fees.toLocaleString()} L</td><td><span class="sbadge s-active">${l('earnMonthlyStatus')}</span></td></tr>`).join('') || `<tr><td colspan="5" style="text-align:center;">${l('noEarnings')}</td></tr>`;
}

// ===== SEARCH =====
window.searchBiz = function(v) { renderBusinesses(v); };
window.searchParts = function(v) { renderAllParts(v); };

// ===== PAGE NAVIGATION =====
window.showPage = function(page) {
  currentPage = page;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + page)?.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('nav-' + page)?.classList.add('active');
  const topbarKey = 'topbar' + page.charAt(0).toUpperCase() + page.slice(1);
  document.getElementById('topbarTitle').textContent = l(topbarKey);
  if (page === 'earnings') renderEarnings();
  if (page === 'orders') { adminOrderPage = 1; renderAllOrders('all'); }
  if (window.innerWidth <= 768) { document.getElementById('sidebar')?.classList.remove('open'); document.getElementById('sidebarOverlay')?.classList.remove('show'); }
};

window.toggleSidebar = function() {
  var sidebar = document.getElementById('sidebar'), overlay = document.getElementById('sidebarOverlay');
  sidebar.classList.toggle('open');
  if (overlay) overlay.classList.toggle('show');
};

window.closeModal = function(id) { document.getElementById(id)?.classList.remove('open'); };

window.setLang = function(lg) {
  lang = lg;
  applyLang();
  adminOrderPage = 1;
  renderBusinesses(); renderAllParts(); renderAllOrders(currentOrderFilter || 'all');
  renderMessages(); renderPlanRequests(); renderWeeklyPromos();
  renderEarnings(); updateDashboard();
};

function applyLang() {
  document.title = l('pageTitle');
  document.querySelectorAll('[data-l]').forEach(el => { const key = el.dataset.l; if (L[lang][key] !== undefined) el.textContent = L[lang][key]; });
  document.querySelectorAll('[data-l-placeholder]').forEach(el => { const key = el.dataset.lPlaceholder; if (L[lang][key] !== undefined) el.placeholder = L[lang][key]; });
  const topbarKey = 'topbar' + currentPage.charAt(0).toUpperCase() + currentPage.slice(1);
  document.getElementById('topbarTitle').textContent = l(topbarKey);
  document.getElementById('adminIdentified').textContent = l('adminIdentified');
  document.getElementById('loginBadge').textContent = l('loginBadge');
  document.getElementById('loginEmailLabel').textContent = l('loginEmailLabel');
  document.getElementById('loginPassLabel').textContent = l('loginPassLabel');
  document.getElementById('loginBtn').textContent = l('loginBtn');
  document.getElementById('logoutBtn').textContent = l('logoutBtn');
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.modal-overlay').forEach(o => o.addEventListener('click', e => { if (e.target === o) o.classList.remove('open'); }));
  document.addEventListener('keypress', e => { if (e.key === 'Enter' && document.getElementById('loginScreen').style.display !== 'none') doLogin(); });
});

/* =============================================
   Cardeals.al — Workshop Panel Logic
   Depends on: firebase.js, app.js
   ============================================= */

// ========== STATE ==========
let currentUser = null;
let currentWorkshop = null;
let myOrders = [];
let currentPage = 'dashboard';

// ========== AUTH ==========
auth.onAuthStateChanged(async function(user) {
  if (user) {
    currentUser = user;
    try {
      var doc = await db.collection('workshops').doc(user.uid).get();
      if (doc.exists) {
        currentWorkshop = doc.data();
        currentWorkshop.id = user.uid;
        showApp();
      } else {
        await auth.signOut();
        showToast('Kjo llogari nuk është Pikë Shërbimi. Regjistrohu!', true);
      }
    } catch(e) {
      console.error(e);
      showToast('Gabim: ' + e.message, true);
    }
  } else {
    currentUser = null;
    currentWorkshop = null;
  }
});

function showApp() {
  g('loginScreen').style.display = 'none';
  g('app').style.display = 'flex';
  g('workshopName').textContent = currentWorkshop?.name || 'Pikë Shërbimi';
  loadMyOrders();
  showPage('dashboard');
}

// ========== LOGIN / REGISTER ==========
window.doLogin = async function() {
  var email = g('loginEmail').value.trim();
  var pass = g('loginPass').value;
  var btn = g('loginBtn');

  if (!email || !pass) {
    showToast('Plotëso të gjitha fushat!', true);
    return;
  }

  btn.textContent = 'Duke hyrë...';
  btn.disabled = true;

  try {
    await auth.signInWithEmailAndPassword(email, pass);
  } catch(err) {
    showToast('❌ Email ose fjalëkalim i gabuar!', true);
    btn.textContent = 'HYRJA →';
    btn.disabled = false;
  }
};

window.doRegister = async function() {
  var email = g('regEmail').value.trim();
  var pass = g('regPass').value;
  var pass2 = g('regPass2').value;
  var name = g('regName').value.trim();
  var phone = g('regPhone').value.trim();
  var city = g('regCity').value.trim();
  var btn = g('regBtn');

  if (!name || !email || !pass || !pass2) {
    showToast('Plotëso të gjitha fushat!', true);
    return;
  }
  if (pass !== pass2) {
    showToast('❌ Fjalëkalimet nuk përputhen!', true);
    return;
  }
  if (pass.length < 6) {
    showToast('❌ Fjalëkalimi duhet të jetë së paku 6 karaktere!', true);
    return;
  }

  btn.textContent = 'Duke u regjistruar...';
  btn.disabled = true;

  try {
    var cred = await auth.createUserWithEmailAndPassword(email, pass);
    await db.collection('workshops').doc(cred.user.uid).set({
      name: name,
      email: email,
      phone: phone,
      city: city,
      creditBalance: 0,
      totalPurchases: 0,
      currentPeriodStart: new Date(),
      currentPeriodTotal: 0,
      lastPayout: null,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    showToast('✅ Llogaria u krijua!');
  } catch(err) {
    console.error(err);
    showToast('❌ ' + err.message, true);
  } finally {
    btn.textContent = 'REGJISTROHU →';
    btn.disabled = false;
  }
};

window.doLogout = async function() {
  await auth.signOut();
};

window.showTab = function(tab) {
  var isLogin = tab === 'login';
  g('tabLogin').style.background = isLogin ? 'var(--primary)' : 'transparent';
  g('tabLogin').style.color = isLogin ? 'white' : 'var(--text-muted)';
  g('tabRegister').style.background = isLogin ? 'transparent' : 'var(--primary)';
  g('tabRegister').style.color = isLogin ? 'var(--text-muted)' : 'white';
  g('loginForm').style.display = isLogin ? 'block' : 'none';
  g('registerForm').style.display = isLogin ? 'none' : 'block';
};

// ========== DATA ==========
async function loadMyOrders() {
  if (!currentUser) return;

  db.collection('orders')
    .where('buyerUid', '==', currentUser.uid)
    .orderBy('createdAt', 'desc')
    .onSnapshot(function(snap) {
      myOrders = snap.docs.map(function(d) {
        return { id: d.id, ...d.data() };
      });
      if (currentPage === 'dashboard') updateDashboard();
      if (currentPage === 'orders') renderAllOrders();
      if (currentPage === 'cashback') renderCashback();
    });
}

// ========== DASHBOARD ==========
function updateDashboard() {
  var total = myOrders.reduce(function(s, o) { return s + (o.totalPrice || 0); }, 0);
  var now = new Date();

  var thisMonth = myOrders.filter(function(o) {
    var d = o.createdAt?.toDate ? o.createdAt.toDate() : new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  var monthTotal = thisMonth.reduce(function(s, o) { return s + (o.totalPrice || 0); }, 0);
  var cashback = Math.round(monthTotal * 0.02);

  g('statTotal').textContent = total.toLocaleString() + ' L';
  g('statOrders').textContent = myOrders.length;
  g('statMonth').textContent = monthTotal.toLocaleString() + ' L';
  g('statCashback').textContent = cashback.toLocaleString() + ' L';
  g('statBalance').textContent = (currentWorkshop?.creditBalance || 0).toLocaleString() + ' L';

  var recent = myOrders.slice(0, 5);
  var tbody = g('recentOrdersBody');
  tbody.innerHTML = recent.length
    ? recent.map(function(o) {
        var date = formatDate(o.createdAt);
        var status = renderStatus(o.status);
        return '<tr>'
          + '<td>' + (o.partEmoji || '') + ' ' + o.partName + '</td>'
          + '<td>' + formatPrice(o.totalPrice) + '</td>'
          + '<td>' + status + '</td>'
          + '<td>' + date + '</td>'
          + '</tr>';
      }).join('')
    : '<tr><td colspan="4">Ende nuk keni blerje.</td></tr>';
}

// ========== ALL ORDERS ==========
function renderAllOrders() {
  var tbody = g('allOrdersBody');
  tbody.innerHTML = myOrders.length
    ? myOrders.map(function(o) {
        var date = formatDate(o.createdAt);
        var cashback = Math.round((o.totalPrice || 0) * 0.02);
        var status = renderStatus(o.status);
        return '<tr>'
          + '<td style="color:#b45309;font-weight:600;">#' + (o.id || '').slice(-6).toUpperCase() + '</td>'
          + '<td>' + (o.partEmoji || '') + ' ' + o.partName + '</td>'
          + '<td>' + (o.sellerName || '—') + '</td>'
          + '<td style="font-weight:600;">' + formatPrice(o.totalPrice) + '</td>'
          + '<td style="color:#2e7d32;">+' + cashback.toLocaleString() + ' L</td>'
          + '<td>' + status + '</td>'
          + '<td>' + date + '</td>'
          + '</tr>';
      }).join('')
    : '<tr><td colspan="7">Ende nuk keni blerje.</td></tr>';
}

// ========== CASHBACK ==========
function renderCashback() {
  var periodStart = currentWorkshop?.currentPeriodStart?.toDate
    ? currentWorkshop.currentPeriodStart.toDate()
    : new Date();
  var now = new Date();
  var daysLeft = Math.max(0, 30 - Math.floor((now - periodStart) / (1000 * 60 * 60 * 24)));

  var periodOrders = myOrders.filter(function(o) {
    var d = o.createdAt?.toDate ? o.createdAt.toDate() : new Date();
    return d >= periodStart;
  });

  var periodTotal = periodOrders.reduce(function(s, o) { return s + (o.totalPrice || 0); }, 0);
  var projectedCashback = Math.round(periodTotal * 0.02);

  g('periodStart').textContent = periodStart.toLocaleDateString('sq-AL');
  g('daysLeft').textContent = daysLeft + ' ditë';
  g('periodTotal').textContent = periodTotal.toLocaleString() + ' L';
  g('periodCashback').textContent = projectedCashback.toLocaleString() + ' L';
  g('currentBalance').textContent = (currentWorkshop?.creditBalance || 0).toLocaleString() + ' L';
}

// ========== PAGE NAV ==========
window.showPage = function(page) {
  currentPage = page;

  document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
  g('page-' + page).classList.add('active');

  document.querySelectorAll('.nav-item').forEach(function(n) { n.classList.remove('active'); });
  g('nav-' + page).classList.add('active');

  if (page === 'dashboard') updateDashboard();
  if (page === 'orders') renderAllOrders();
  if (page === 'cashback') renderCashback();

  if (window.innerWidth <= 768) g('sidebar')?.classList.remove('open');
};

// ========== HELPERS ==========
function renderStatus(status) {
  if (status === 'sold') return '<span style="color:#2e7d32;">Shitur</span>';
  if (status === 'pending') return '<span style="color:#f57c00;">Në Pritje</span>';
  return '<span style="color:#c62828;">Anuluar</span>';
}

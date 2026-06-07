/* =============================================
   Cardeals.al — Dyqani (Store) Page Logic
   Depends on: firebase.js, app.js
   ============================================= */

// ========== STATE ==========
var params = new URLSearchParams(window.location.search);
var sellerId = params.get('id');
var allParts = [];
var cart = [];
var currentBuyer = null;
var pendingCheckoutData = null;

// ========== AUTH ==========
auth.onAuthStateChanged(function(user) {
  currentBuyer = user;
  if (user) prefillBuyerFields();
});

function prefillBuyerFields() {
  if (!currentBuyer) return;
  db.collection('buyers').doc(currentBuyer.uid).get().then(function(doc) {
    if (doc.exists) {
      var d = doc.data();
      if (d.address) g('deliveryAddress').value = d.address;
      if (d.city) g('deliveryCity').value = d.city;
    }
  });
}

// ========== INIT ==========
if (!sellerId) {
  g('content').innerHTML = '<div class="not-found"><h2>Dyqani nuk u gjet</h2><p>Mungon ID e shitësit.</p></div>';
} else {
  loadStore(sellerId);
}

// ========== LOAD STORE ==========
async function loadStore(sellerId) {
  try {
    var bizDoc = await db.collection('businesses').doc(sellerId).get();
    if (!bizDoc.exists) {
      g('content').innerHTML = '<div class="not-found"><h2>Dyqani nuk u gjet</h2><p>Ky shitës nuk ekziston.</p></div>';
      return;
    }

    var biz = bizDoc.data();
    var partsSnap = await db.collection('parts')
      .where('uid', '==', sellerId)
      .where('status', '==', 'active')
      .orderBy('createdAt', 'desc')
      .get();

    allParts = partsSnap.docs.map(function(d) { return { id: d.id, ...d.data() }; });
    document.title = biz.businessName + ' — Cardeals.al';

    var phone = (biz.whatsappPhone || biz.phone || '').replace(/\D/g, '');
    var whatsappLink = phone ? '<a href="https://wa.me/' + phone + '" target="_blank">WhatsApp</a>' : '';

    var avatarUrl = biz.photoURL || biz.logoURL || '';
    var avatarHTML = avatarUrl
      ? '<img src="' + avatarUrl + '" alt="' + biz.businessName + '" />'
      : '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>';

    var html = '<a href="index.html" style="display:inline-block;color:var(--primary);text-decoration:none;margin-bottom:1.5rem;font-weight:600;">← Kthehu te Cardeals.al</a>';

    html += '<div class="store-header">'
      + '<div class="store-avatar">' + avatarHTML + '</div>'
      + '<div class="store-info">'
      + '<div class="store-name">' + (biz.businessName || biz.name || 'Dyqan') + '</div>'
      + '<div class="store-city">📍 ' + (biz.city || 'Shqipëri') + '</div>'
      + '<div class="store-stats"><div class="store-stat"><div class="store-stat-num">' + allParts.length + '</div><div class="store-stat-lbl">Pjesë</div></div></div>'
      + '<div class="store-contact">' + whatsappLink + '</div>'
      + '</div></div>';

    html += '<div class="filter-bar">'
      + '<input type="text" id="filterSearch" placeholder="🔍 Kërko pjesë..." oninput="filterParts()" />'
      + '<select id="filterCondition" onchange="filterParts()"><option value="all">Të gjitha gjendjet</option><option value="new">Vetëm të Reja</option><option value="used">Vetëm të Përdorura</option></select>'
      + '<select id="filterCategory" onchange="filterParts()"><option value="all">Të gjitha kategoritë</option><option value="brakes">Frena</option><option value="engine">Motor</option><option value="electrical">Elektrik</option><option value="suspension">Amortizatorë</option><option value="body">Karroceri</option><option value="ac">Klimë</option></select>'
      + '<span class="filter-count" id="filterCount">' + allParts.length + ' pjesë</span>'
      + '</div>';

    html += '<div class="parts-grid" id="partsGrid"></div>';

    g('content').innerHTML = html;
    loadCart();
    renderFilteredParts();

  } catch(e) {
    g('content').innerHTML = '<div class="not-found"><h2>Gabim</h2><p>' + e.message + '</p></div>';
  }
}

// ========== FILTERING ==========
function filterParts() {
  renderFilteredParts();
}

function renderFilteredParts() {
  var search = (document.getElementById('filterSearch')?.value || '').toLowerCase();
  var condition = document.getElementById('filterCondition')?.value || 'all';
  var category = document.getElementById('filterCategory')?.value || 'all';

  var filtered = allParts.filter(function(p) {
    var name = getPartName(p).toLowerCase();
    var fits = (p.fits || '').toLowerCase();
    if (search && name.indexOf(search) === -1 && fits.indexOf(search) === -1) return false;
    if (condition !== 'all' && p.condition !== condition) return false;
    if (category !== 'all' && p.category !== category) return false;
    return true;
  });

  g('filterCount').textContent = filtered.length + ' pjesë';

  var grid = g('partsGrid');
  if (!filtered.length) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-muted);">🔍 Nuk u gjet asnjë pjesë.</div>';
    return;
  }

  grid.innerHTML = filtered.map(function(p) {
    var name = getPartName(p);
    var fin = getFinalPrice(p);
    var condBadge = p.condition === 'new' ? 'badge-active' : 'badge-used';
    var condLabel = p.condition === 'new' ? 'E RE' : 'E PËRDORUR';
    return '<div class="part-card">'
      + '<div class="part-card-img">' + partImageHTML(p, 200, 160) + '</div>'
      + '<div class="part-card-body">'
      + '<span class="status-badge ' + condBadge + '">' + condLabel + '</span>'
      + (p.weeklyPromo ? '<span class="promo-badge">PROMO</span>' : '')
      + '<div class="part-card-name">' + name + '</div>'
      + '<div class="part-card-fits">🚗 ' + (p.fits || '') + '</div>'
      + '<div class="part-card-price">' + formatPrice(fin) + '</div>'
      + '<button class="buy-btn" onclick="buyNow(\'' + p.id + '\')">BLI TANI — ' + formatPrice(fin) + '</button>'
      + '<button class="cart-add-btn" onclick="addToCart(\'' + p.id + '\')">Shto në Shportë</button>'
      + '</div></div>';
  }).join('');
}

function buyNow(partId) {
  addToCart(partId);
  openCart();
}

// ========== CART ==========
function loadCart() {
  try {
    var saved = localStorage.getItem('cardeals_cart_dyqan');
    if (saved) cart = JSON.parse(saved);
  } catch(e) { cart = []; }
  updateCartBadge();
}

function saveCart() {
  localStorage.setItem('cardeals_cart_dyqan', JSON.stringify(cart));
  updateCartBadge();
}

function updateCartBadge() {
  var count = cart.reduce(function(s, i) { return s + (i.qty || 1); }, 0);
  var b = g('cartBadge');
  if (b) {
    b.textContent = count;
    b.style.display = count > 0 ? 'inline-block' : 'none';
  }
}

function addToCart(partId) {
  var part = allParts.find(function(p) { return p.id === partId; });
  if (!part) return;

  var existing = cart.find(function(item) { return item.partId === partId; });
  if (existing) {
    existing.qty = (existing.qty || 1) + 1;
  } else {
    cart.push({
      partId: partId,
      partName: getPartName(part),
      sellerUid: part.uid || '',
      sellerName: part.sellerName || '',
      sellerCity: part.sellerCity || '',
      basePrice: part.basePrice || 0,
      discount: part.discount || 0,
      image: part.images?.[0] || '',
      qty: 1
    });
  }
  saveCart();
  showToast('✅ Shtuar në shportë!');
}

function removeFromCart(index) {
  cart.splice(index, 1);
  saveCart();
  renderCart();
}

function updateCartQty(index, delta) {
  cart[index].qty = Math.max(1, (cart[index].qty || 1) + delta);
  saveCart();
  renderCart();
}

function openCart() {
  renderCart();
  g('cartModal').classList.add('open');
}

function renderCart() {
  var container = g('cartContent');
  var checkoutSection = g('cartCheckoutSection');

  if (!cart.length) {
    container.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--text-muted);">Shporta është bosh</div>';
    checkoutSection.style.display = 'none';
    return;
  }

  var subtotal = 0;
  var html = '';

  cart.forEach(function(item, index) {
    var dp = item.discount > 0 ? Math.round((item.basePrice || 0) * (1 - (item.discount || 0) / 100)) : (item.basePrice || 0);
    var fee = Math.round(dp * PLATFORM_FEE);
    var fin = dp + fee;
    var itemTotal = fin * (item.qty || 1);
    subtotal += itemTotal;

    html += '<div class="cart-item">'
      + '<div class="cart-item-img">' + (item.image ? '<img src="' + item.image + '" />' : '🔩') + '</div>'
      + '<div class="cart-item-info">'
      + '<div class="cart-item-name">' + item.partName + '</div>'
      + '<div class="cart-item-seller">🏪 ' + item.sellerName + ' · ' + item.sellerCity + '</div>'
      + '<div class="cart-item-price">' + formatPrice(itemTotal) + '</div>'
      + '</div>'
      + '<div class="cart-item-qty">'
      + '<button class="qty-btn" onclick="updateCartQty(' + index + ',-1)">−</button>'
      + '<span style="font-weight:700;font-size:0.85rem;">' + item.qty + '</span>'
      + '<button class="qty-btn" onclick="updateCartQty(' + index + ',1)">+</button>'
      + '</div>'
      + '<button class="cart-item-remove" onclick="removeFromCart(' + index + ')">✕</button>'
      + '</div>';
  });

  container.innerHTML = html;

  var shipping = calculateShipping(subtotal);
  var grandTotal = subtotal + shipping;

  g('cartSubtotal').textContent = formatPrice(subtotal);
  g('cartShipping').innerHTML = shipping > 0 ? formatPrice(shipping) : '<span style="color:#2e7d32;">FALAS</span>';
  g('cartGrandTotal').textContent = formatPrice(grandTotal);
  checkoutSection.style.display = 'block';
}

// ========== CHECKOUT ==========
function proceedToAddress() {
  if (!cart.length) return;
  closeModal('cartModal');
  prefillBuyerFields();

  var cartTotal = cart.reduce(function(s, i) {
    var dp = i.discount > 0 ? Math.round((i.basePrice || 0) * (1 - (i.discount || 0) / 100)) : (i.basePrice || 0);
    var fee = Math.round(dp * PLATFORM_FEE);
    return s + ((dp + fee) * (i.qty || 1));
  }, 0);

  pendingCheckoutData = {
    cartItems: cart.slice(),
    cartTotal: cartTotal,
    isCartOrder: true
  };

  g('addressModal').classList.add('open');
  g('confirmAddressBtn').innerHTML = 'KONFIRMO POROSINË (' + cart.length + ' pjesë)';
}

async function confirmAddress() {
  var address = g('deliveryAddress').value.trim();
  var city = g('deliveryCity').value.trim();
  var postal = g('deliveryPostal').value.trim();
  var instructions = g('deliveryInstructions').value.trim();
  var email = g('deliveryEmail').value.trim();

  if (!address || !city || !email) {
    showToast('⚠️ Plotëso adresën, qytetin dhe email-in!', true);
    return;
  }
  if (!pendingCheckoutData) {
    showToast('❌ Gabim në porosi', true);
    return;
  }

  var btn = g('confirmAddressBtn');
  btn.textContent = 'Duke procesuar...';
  btn.disabled = true;

  var ordersToCreate = [];

  if (pendingCheckoutData.isCartOrder) {
    for (var i = 0; i < pendingCheckoutData.cartItems.length; i++) {
      var item = pendingCheckoutData.cartItems[i];
      var dp = item.discount > 0 ? Math.round((item.basePrice || 0) * (1 - (item.discount || 0) / 100)) : (item.basePrice || 0);
      var fee = Math.round(dp * PLATFORM_FEE);
      var total = (dp + fee) * (item.qty || 1);

      ordersToCreate.push({
        partId: item.partId,
        partName: item.partName,
        partEmoji: '🔩',
        buyerName: currentBuyer?.email?.split('@')[0] || 'Klient',
        buyerPhone: '',
        buyerEmail: email,
        sellerUid: item.sellerUid,
        sellerName: item.sellerName,
        sellerCity: item.sellerCity,
        basePrice: dp,
        quantity: item.qty || 1,
        platformFee: fee * (item.qty || 1),
        totalPrice: total,
        shippingFee: 0,
        deliveryAddress: address,
        deliveryCity: city,
        deliveryPostal: postal,
        deliveryInstructions: instructions,
        deliveryEmail: email,
        payMethod: 'online',
        status: 'pending',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        buyerUid: currentBuyer?.uid || null
      });
    }
  }

  try {
    var batch = db.batch();

    for (var j = 0; j < ordersToCreate.length; j++) {
      var order = ordersToCreate[j];
      var orderRef = db.collection('orders').doc();
      batch.set(orderRef, order);

      if (order.partId) {
        var partRef = db.collection('parts').doc(order.partId);
        var partDoc = await partRef.get();
        if (partDoc.exists) {
          var currentStock = partDoc.data().stock || 0;
          var newStock = Math.max(0, currentStock - order.quantity);
          batch.update(partRef, {
            stock: newStock,
            status: newStock > 0 ? 'active' : 'inactive',
            sales: (partDoc.data().sales || 0) + order.quantity
          });
        }
      }
    }

    await batch.commit();

    cart = [];
    saveCart();
    closeModal('addressModal');
    showToast('✅ Porosia u regjistrua!');

    if (currentBuyer) {
      db.collection('buyers').doc(currentBuyer.uid).update({ address, city }).catch(function() {});
    }

    showWhatsAppContact(ordersToCreate[0]);
    pendingCheckoutData = null;

    // Clear form
    ['deliveryAddress', 'deliveryCity', 'deliveryPostal', 'deliveryInstructions', 'deliveryEmail']
      .forEach(function(id) { g(id).value = ''; });

  } catch(err) {
    showToast('❌ Gabim: ' + err.message, true);
  }

  btn.textContent = 'KONFIRMO POROSINË';
  btn.disabled = false;
}

// ========== WHATSAPP ==========
function showWhatsAppContact(order) {
  if (!order || !order.sellerUid) return;
  var partName = order.partName || '';

  db.collection('businesses').doc(order.sellerUid).get().then(function(doc) {
    if (doc.exists) {
      var phone = (doc.data().whatsappPhone || doc.data().phone || '').replace(/\D/g, '');
      if (phone) {
        var msg = encodeURIComponent('Pershendetje! Bera nje porosi ne Cardeals.al per pjesen "' + partName + '". Mund te koordinohemi per detajet?');
        showToast('📞 Kontakto shitësin në WhatsApp');
        setTimeout(function() {
          window.open('https://wa.me/' + phone + '?text=' + msg, '_blank');
        }, 500);
      }
    }
  }).catch(function() {});
}

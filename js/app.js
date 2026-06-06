/* =============================================
   Cardeals.al — Shared Application Logic v2.0
   ============================================= */

// ========== SHORTCUTS ==========
function g(id) { return document.getElementById(id); }

// ========== TOAST NOTIFICATIONS ==========
function showToast(msg, isErr) {
  const t = g('toast');
  if (!t) return;
  t.textContent = msg;
  t.style.background = isErr ? '#c62828' : '#2e7d32';
  t.classList.add('show');
  setTimeout(function() { t.classList.remove('show'); }, 4000);
}

// ========== MODALS ==========
function closeModal(id) {
  if (id) document.getElementById(id).classList.remove('open');
}

// Close modal on overlay click
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
  }
});

// ========== SHIPPING ==========
const EUR_TO_LEK = 120;
const FREE_SHIPPING_THRESHOLD_LEK = 12000;
const SHIPPING_FEE_LEK = 600;

function calculateShipping(total, payMethod) {
  if (payMethod === 'pickup') return 0;
  return total >= FREE_SHIPPING_THRESHOLD_LEK ? 0 : SHIPPING_FEE_LEK;
}

// ========== SIDEBAR TOGGLE (Mobile) ==========
function toggleSidebar() {
  var sidebar = g('sidebar');
  var overlay = g('sidebarOverlay');
  if (sidebar) sidebar.classList.toggle('open');
  if (overlay) overlay.classList.toggle('show');
}

// ========== PAGE NAVIGATION ==========
function showPage(page) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(function(p) {
    p.classList.remove('active');
  });
  
  // Show target page
  var targetPage = g('page-' + page);
  if (targetPage) targetPage.classList.add('active');
  
  // Update nav active state
  document.querySelectorAll('.nav-item').forEach(function(n) {
    n.classList.remove('active');
  });
  var navItem = g('nav-' + page);
  if (navItem) navItem.classList.add('active');
  
  // Update topbar title
  var topbarTitle = g('topbarTitle');
  if (topbarTitle && typeof l === 'function') {
    var topbarKey = 'topbar' + page.charAt(0).toUpperCase() + page.slice(1);
    topbarTitle.textContent = l(topbarKey) || page.toUpperCase();
  }
  
  // Close sidebar on mobile
  if (window.innerWidth <= 768) {
    var sidebar = g('sidebar');
    var overlay = g('sidebarOverlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('show');
  }
}

// ========== LANGUAGE SYSTEM ==========
let currentLang = 'sq';

const L = {
  sq: {
    register: 'Regjistrohu',
    navWorkshop: 'Pika Shërbimi',
    navSell: 'Shit Këtu',
    footerAbout: 'Rreth Nesh',
    footerWorkshop: 'Pika Shërbimi',
    footerSell: 'Shit Me Ne',
    footerContact: 'Kontakt',
    footerPrivacy: 'Politika e Privatësisë',
    footerCopy: '© 2026 Cardeals.al — Të gjitha të drejtat e rezervuara.',
    heroTitle: 'Pjesë Këmbimi për Çdo Makinë',
    heroSub: 'Mbi <strong id="heroPartCount">0</strong> pjesë nga shitës të verifikuar · Krahaso çmimet · Bli online',
    searchPlaceholder: 'Kërko pjesë, markë, VIN...',
    condAll: 'Të gjitha',
    condNew: 'Të Reja',
    condUsed: 'Të Përdorura',
    searchBtn: 'KËRKO',
    searchPartsBtn: 'KËRKO PJESËT',
    selectMake: 'Të gjitha Markat',
    catAll: 'Të gjitha',
    catEngine: 'Motor',
    catBrakes: 'Frena',
    catElectrical: 'Elektrik',
    catSuspension: 'Amortizatorë',
    catBody: 'Karroceri',
    catAC: 'Klimë',
    dealsTitle: 'Oferta Speciale',
    partsTitle: 'Të Gjitha Pjesët'
  },
  en: {
    register: 'Sign Up',
    navWorkshop: 'Workshop',
    navSell: 'Sell Here',
    footerAbout: 'About Us',
    footerWorkshop: 'Workshop',
    footerSell: 'Sell With Us',
    footerContact: 'Contact',
    footerPrivacy: 'Privacy Policy',
    footerCopy: '© 2026 Cardeals.al — All rights reserved.',
    heroTitle: 'Auto Parts for Every Car',
    heroSub: 'Over <strong id="heroPartCount">0</strong> parts from verified sellers · Compare prices · Buy online',
    searchPlaceholder: 'Search parts, brand, VIN...',
    condAll: 'All',
    condNew: 'New',
    condUsed: 'Used',
    searchBtn: 'SEARCH',
    searchPartsBtn: 'SEARCH PARTS',
    selectMake: 'All Brands',
    catAll: 'All',
    catEngine: 'Engine',
    catBrakes: 'Brakes',
    catElectrical: 'Electrical',
    catSuspension: 'Suspension',
    catBody: 'Body',
    catAC: 'AC & Heat',
    dealsTitle: 'Special Offers',
    partsTitle: 'All Parts'
  }
};

function l(k) { return L[currentLang] && L[currentLang][k] ? L[currentLang][k] : k; }

function setLang(lg) {
  currentLang = lg;
  
  // Update all lang buttons
  document.querySelectorAll('.lang-btn').forEach(function(b) {
    b.classList.remove('active');
  });
  var activeBtn = document.querySelector('.lang-btn[onclick="setLang(\'' + lg + '\')"]');
  if (activeBtn) activeBtn.classList.add('active');
  
  // Update data-l elements
  document.querySelectorAll('[data-l]').forEach(function(el) {
    var key = el.dataset.l;
    if (L[lg] && L[lg][key]) {
      el.innerHTML = L[lg][key];
    }
  });
  
  // Update placeholders
  document.querySelectorAll('[data-l-placeholder]').forEach(function(el) {
    var key = el.dataset.lPlaceholder;
    if (L[lg] && L[lg][key]) el.placeholder = L[lg][key];
  });
  
  // Update hero subtitle (contains HTML)
  if (L[lg] && L[lg].heroSub) {
    var heroP = document.querySelector('.hero p');
    if (heroP) heroP.innerHTML = L[lg].heroSub;
  }
  
  // Update condition filter options
  var cf = g('condFilter');
  if (cf && L[lg]) {
    cf.options[0].textContent = L[lg].condAll;
    cf.options[1].textContent = L[lg].condNew;
    cf.options[2].textContent = L[lg].condUsed;
  }
}

// ========== FORMAT HELPERS ==========
function formatPrice(price) {
  return (price || 0).toLocaleString() + ' L';
}

function formatDate(timestamp) {
  if (!timestamp) return '—';
  var date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('sq-AL');
}

// ========== CATEGORY HELPERS ==========
function getCatEmoji(cat) {
  var e = { brakes: '🔘', engine: '⚙️', electrical: '⚡', suspension: '🔩', body: '🚗', ac: '🌡️' };
  return e[cat] || '🔧';
}

function getCatName(cat, lang) {
  var names = {
    sq: { brakes: 'Frena', engine: 'Motor', electrical: 'Elektrik', suspension: 'Amortizatorë', body: 'Karroceri', ac: 'Klimë' },
    en: { brakes: 'Brakes', engine: 'Engine', electrical: 'Electrical', suspension: 'Suspension', body: 'Body', ac: 'AC & Heat' }
  };
  var l = lang || currentLang || 'sq';
  return (names[l] && names[l][cat]) ? names[l][cat] : cat;
}

// ========== CAR DATA ==========
const carBrands = ['Abarth','Acura','Alfa Romeo','Alpine','Aston Martin','Audi','Bentley','BMW','Bugatti','Buick','BYD','Cadillac','Chery','Chevrolet','Chrysler','Citroën','Cupra','Dacia','Daewoo','Daihatsu','Dodge','DS Automobiles','Ferrari','Fiat','Ford','Genesis','GMC','Great Wall','Honda','Hummer','Hyundai','Infiniti','Isuzu','Jaguar','Jeep','Kia','Lamborghini','Lancia','Land Rover','Lexus','Lincoln','Lotus','Maserati','Maybach','Mazda','McLaren','Mercedes-Benz','MG','Mini','Mitsubishi','Nissan','Opel','Peugeot','Polestar','Pontiac','Porsche','Renault','Rolls-Royce','Saab','Seat','Škoda','Smart','SsangYong','Subaru','Suzuki','Tata','Tesla','Toyota','Triumph','Volkswagen','Volvo'];

const carModels = {
  Abarth: ['500','595','695','124 Spider','Punto'],
  Audi: ['A1','A2','A3','A4','A5','A6','A7','A8','Q2','Q3','Q5','Q7','Q8','TT','R8'],
  BMW: ['1 Series','2 Series','3 Series','4 Series','5 Series','6 Series','7 Series','X1','X2','X3','X4','X5','X6','X7','Z4','i3','i4','iX','M2','M3','M4','M5'],
  'Mercedes-Benz': ['A-Class','B-Class','C-Class','CLA','CLS','E-Class','G-Class','GLA','GLB','GLC','GLE','GLS','S-Class'],
  Volkswagen: ['Arteon','Beetle','Bora','Caddy','Crafter','Golf','ID.3','ID.4','Jetta','Passat','Polo','T-Cross','T-Roc','Tiguan','Touareg','Touran','Transporter','up!'],
  Toyota: ['Auris','Avensis','Aygo','C-HR','Camry','Corolla','Hilux','Land Cruiser','Prius','RAV4','Yaris'],
  Ford: ['Ecosport','Fiesta','Focus','Fusion','Kuga','Mondeo','Mustang','Puma','Ranger','Transit'],
  Opel: ['Astra','Corsa','Crossland','Grandland','Insignia','Mokka','Zafira'],
  Fiat: ['500','Bravo','Doblo','Panda','Punto','Tipo'],
  Renault: ['Captur','Clio','Espace','Kadjar','Kangoo','Koleos','Laguna','Master','Megane','Scenic','Talisman','Trafic','Twingo','Zoe'],
  Peugeot: ['2008','206','207','208','3008','301','306','307','308','407','5008','508'],
  Citroën: ['C1','C2','C3','C4','C5','Berlingo','Saxo','Xsara'],
  Hyundai: ['Accent','Elantra','i10','i20','i30','i40','Kona','Santa Fe','Tucson'],
  Kia: ['Ceed','Picanto','Rio','Sorento','Soul','Sportage','Stonic'],
  Mazda: ['2','3','5','6','CX-3','CX-5','CX-30','MX-5'],
  Nissan: ['Juke','Micra','Navara','Note','Pathfinder','Patrol','Qashqai','X-Trail'],
  Honda: ['Accord','Civic','CR-V','HR-V','Jazz'],
  Seat: ['Alhambra','Altea','Arona','Ateca','Ibiza','Leon','Tarraco','Toledo'],
  Škoda: ['Fabia','Kamiq','Karoq','Kodiaq','Octavia','Rapid','Scala','Superb'],
  Dacia: ['Duster','Logan','Sandero','Spring'],
  Volvo: ['C40','S40','S60','S90','V40','V60','V90','XC40','XC60','XC90'],
  Tesla: ['Model 3','Model S','Model X','Model Y'],
  Chevrolet: ['Aveo','Camaro','Captiva','Corvette','Cruze','Spark','Trax']
};

function populateCarMakes() {
  var sel = g('carMakeSelect');
  if (!sel) return;
  sel.innerHTML = '<option value="">' + l('selectMake') + '</option>';
  carBrands.forEach(function(b) {
    var o = document.createElement('option');
    o.value = b;
    o.textContent = b;
    sel.appendChild(o);
  });
}

function onCarMakeChange() {
  var make = g('carMakeSelect').value;
  var mi = g('carModelInput');
  var dl = g('carModelList');
  if (dl) dl.innerHTML = '';
  
  if (make && carModels[make]) {
    if (mi) {
      mi.disabled = false;
      mi.placeholder = 'Modeli (p.sh. ' + carModels[make][0] + ')';
    }
    if (dl) {
      carModels[make].forEach(function(m) {
        var o = document.createElement('option');
        o.value = m;
        dl.appendChild(o);
      });
    }
  } else {
    if (mi) { mi.disabled = true; mi.value = ''; mi.placeholder = 'Modeli'; }
  }
}

// ========== PART NAME HELPER ==========
function getPartName(part) {
  if (!part || !part.name) return '—';
  return typeof part.name === 'object' ? (part.name.sq || part.name.en) : part.name;
}

// ========== DISCOUNTED PRICE HELPER ==========
function getDiscountedPrice(part) {
  var base = part.basePrice || 0;
  var discount = part.discount || 0;
  return discount > 0 ? Math.round(base * (1 - discount / 100)) : base;
}

// ========== FINAL PRICE (with platform fee) ==========
function getFinalPrice(part) {
  var dp = getDiscountedPrice(part);
  var fee = Math.round(dp * (typeof PLATFORM_FEE !== 'undefined' ? PLATFORM_FEE : 0.08));
  return dp + fee;
}

// ========== NO-IMAGE SVG PLACEHOLDER ==========
function noImageSVG(category, width, height) {
  var catName = getCatName(category);
  return '<svg width="' + width + '" height="' + height + '" viewBox="0 0 ' + width + ' ' + height + '" xmlns="http://www.w3.org/2000/svg"><rect width="' + width + '" height="' + height + '" fill="#f8f8f8"/><text x="' + (width/2) + '" y="' + (height/2 - 12) + '" text-anchor="middle" font-family="\'Inter\', sans-serif" font-size="' + (width/14) + '" font-weight="700" fill="#d5d5d5" letter-spacing="3">PA FOTO</text><text x="' + (width/2) + '" y="' + (height/2 + 12) + '" text-anchor="middle" font-family="\'Inter\', sans-serif" font-size="' + (width/18) + '" font-weight="500" fill="#d0d0d0">' + catName + '</text></svg>';
}

// ========== PART IMAGE HTML HELPER ==========
function partImageHTML(part, width, height) {
  if (part.images && part.images.length) {
    return '<img src="' + part.images[0] + '" alt="' + getPartName(part) + '" loading="lazy" />';
  }
  return noImageSVG(part.category, width || 200, height || 180);
}

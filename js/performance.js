/* =============================================
   Cardeals.al — Performance Optimizations
   ============================================= */

document.addEventListener('DOMContentLoaded', function() {
  if ('IntersectionObserver' in window) {
    var imageObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          var img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          imageObserver.unobserve(img);
        }
      });
    }, {
      rootMargin: '100px'
    });
    
    document.querySelectorAll('img[loading="lazy"], img[data-src]').forEach(function(img) {
      imageObserver.observe(img);
    });
  }
});

function debounce(func, wait) {
  var timeout;
  return function() {
    var context = this, args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(function() {
      func.apply(context, args);
    }, wait);
  };
}

var DOMCache = {};
function cachedGet(id) {
  if (!DOMCache[id]) {
    DOMCache[id] = document.getElementById(id);
  }
  return DOMCache[id];
}

function clearDOMCache() {
  DOMCache = {};
}

function prefetchPages() {
  var pages = ['dyqani.html', 'workshop.html', 'privacy.html'];
  pages.forEach(function(page) {
    var link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = page;
    document.head.appendChild(link);
  });
}

if (document.readyState === 'complete') {
  prefetchPages();
} else {
  window.addEventListener('load', prefetchPages);
}

/* =============================================
   Cardeals.al — Global Error Handler
   ============================================= */

window.onerror = function(message, source, lineno, colno, error) {
  console.error('Global Error:', { message, source, lineno, colno, error });
  
  if (typeof firebase !== 'undefined' && firebase.firestore) {
    firebase.firestore().collection('error_logs').add({
      message: String(message),
      source: String(source),
      line: lineno,
      column: colno,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).catch(function() {});
  }
  
  if (typeof showToast === 'function') {
    showToast('⚠️ Diçka shkoi gabim. Ju lutemi provoni përsëri.', true);
  }
  
  return true;
};

window.onunhandledrejection = function(event) {
  console.error('Unhandled Promise:', event.reason);
  
  if (typeof firebase !== 'undefined' && firebase.firestore) {
    firebase.firestore().collection('error_logs').add({
      message: 'Unhandled Promise: ' + String(event.reason),
      url: window.location.href,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).catch(function() {});
  }
};

window.addEventListener('offline', function() {
  if (typeof showToast === 'function') {
    showToast('📡 Nuk keni lidhje interneti. Disa funksione mund të jenë të kufizuara.', true);
  }
});

window.addEventListener('online', function() {
  if (typeof showToast === 'function') {
    showToast('✅ Lidhja u rikthye!');
  }
});

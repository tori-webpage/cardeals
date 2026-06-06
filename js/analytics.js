/* =============================================
   Cardeals.al — Simple Analytics
   ============================================= */

var Analytics = {
  pageView: function() {
    if (typeof firebase === 'undefined') return;
    
    firebase.firestore().collection('analytics_pageviews').add({
      path: window.location.pathname,
      title: document.title,
      referrer: document.referrer,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      userAgent: navigator.userAgent.substring(0, 100)
    }).catch(function() {});
  },
  
  search: function(query, resultsCount) {
    if (typeof firebase === 'undefined') return;
    
    firebase.firestore().collection('analytics_searches').add({
      query: query.substring(0, 200),
      results: resultsCount,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).catch(function() {});
  },
  
  partView: function(partId, partName) {
    if (typeof firebase === 'undefined') return;
    
    firebase.firestore().collection('analytics_partviews').add({
      partId: partId,
      partName: partName ? partName.substring(0, 200) : '',
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).catch(function() {});
    
    firebase.firestore().collection('parts').doc(partId).update({
      views: firebase.firestore.FieldValue.increment(1)
    }).catch(function() {});
  }
};

Analytics.pageView();

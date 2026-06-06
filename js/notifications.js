/* =============================================
   Cardeals.al — Email Notification System
   Uses EmailJS (free tier: 200 emails/month)
   Sign up at https://www.emailjs.com/
   ============================================= */

(function() {
  // Replace with your EmailJS public key
  emailjs.init('YOUR_PUBLIC_KEY');
})();

var NOTIFICATIONS = {
  orderConfirmation: function(orderData) {
    var templateParams = {
      to_email: orderData.deliveryEmail,
      to_name: orderData.buyerName || 'Klient',
      order_id: orderData.id ? orderData.id.slice(-6).toUpperCase() : '—',
      part_name: orderData.partName || '—',
      total_price: (orderData.grandTotal || orderData.totalPrice || 0).toLocaleString() + ' L',
      seller_name: orderData.sellerName || '—',
      delivery_address: orderData.deliveryAddress || '—',
      message: 'Porosia juaj është regjistruar me sukses!'
    };
    
    return emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', templateParams)
      .then(function() { console.log('✅ Order email sent'); })
      .catch(function(err) { console.error('❌ Email failed:', err); });
  },
  
  sellerNewOrder: function(orderData, sellerEmail) {
    var templateParams = {
      to_email: sellerEmail,
      seller_name: orderData.sellerName || 'Shitës',
      order_id: orderData.id ? orderData.id.slice(-6).toUpperCase() : '—',
      part_name: orderData.partName || '—',
      total_price: (orderData.totalPrice || 0).toLocaleString() + ' L',
      buyer_name: orderData.buyerName || '—',
      buyer_phone: orderData.buyerPhone || '—',
      message: 'Keni një porosi të re! Hyni në panel për ta konfirmuar.'
    };
    
    return emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', templateParams)
      .catch(function(err) { console.error('❌ Seller email failed:', err); });
  },
  
  adminNewMessage: function(msgData) {
    var templateParams = {
      to_email: 'cheapways91@gmail.com',
      from_name: msgData.name || '—',
      from_email: msgData.email || '—',
      message: msgData.message || '—'
    };
    
    return emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', templateParams)
      .catch(function(err) { console.error('❌ Admin email failed:', err); });
  }
};

const EUR_TO_LEK=120,FREE_SHIPPING_THRESHOLD_LEK=12000,SHIPPING_FEE_LEK=600;
function calculateShipping(t,p){return p==='pickup'?0:t>=FREE_SHIPPING_THRESHOLD_LEK?0:SHIPPING_FEE_LEK;}
function g(id){return document.getElementById(id);}
function showToast(msg,isErr){const t=g('toast');if(!t)return;t.textContent=msg;t.style.background=isErr?'#c62828':'#2e7d32';t.classList.add('show');setTimeout(()=>t.classList.remove('show'),4000);}
function closeModal(id){if(id)document.getElementById(id).classList.remove('open');}

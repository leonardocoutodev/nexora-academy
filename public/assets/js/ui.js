function qs(s,root=document){return root.querySelector(s)}
function qsa(s,root=document){return [...root.querySelectorAll(s)]}
function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]))}
function setState(el,type,text){if(!el)return;el.className=type;el.textContent=text}
function money(cents){return new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format((Number(cents)||0)/100)}
window.LCUI={qs,qsa,esc,setState,money};
if(document.body?.classList.contains('lc-admin-page')){const s=document.createElement('script');s.src='../../assets/js/admin-public-analytics.js';s.defer=true;document.head.appendChild(s)}

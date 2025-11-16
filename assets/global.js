(function(){
  const CTA_ENABLED = false;
  const CTA_ID = 'global-poc-cta';
  const CTA_TEXT = 'PoC/相談';
  const CTA_SUBJECT = encodeURIComponent('PoC / Consultation — Thermo-Credit & AI reliability');
  const CTA_HREF = `mailto:okutomi@pm.me?subject=${CTA_SUBJECT}`;
  const DWELL_TARGETS = {
    '/': { event: 'Home dwell (30s)', delay: 30000 },
    '/index.html': { event: 'Home dwell (30s)', delay: 30000 },
    '/2025_11_Thermo_Credit/report.html': { event: 'QTC report dwell (45s)', delay: 45000 }
  };

  function injectStyles(){
    if(!CTA_ENABLED || document.getElementById('global-poc-style')) return;
    const style = document.createElement('style');
    style.id = 'global-poc-style';
    style.textContent = `
      #${CTA_ID}{
        position:sticky;
        top:0;
        z-index:1100;
        width:100%;
        background:rgba(5,9,20,0.92);
        backdrop-filter:saturate(160%) blur(8px);
        border-bottom:1px solid rgba(255,255,255,0.08);
        color:#e6e9f2;
      }
      #${CTA_ID} .cta-inner{
        max-width:1200px;
        margin:0 auto;
        padding:10px 18px;
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:12px;
        flex-wrap:wrap;
        font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;
      }
      #${CTA_ID} .cta-copy{font-size:14px; letter-spacing:.1px;}
      #${CTA_ID} .poc-btn{
        display:inline-flex;
        align-items:center;
        justify-content:center;
        padding:8px 18px;
        border-radius:999px;
        border:1px solid rgba(255,255,255,0.35);
        background:#5aa7ff;
        color:#050914;
        font-weight:600;
        text-decoration:none;
        box-shadow:0 4px 20px rgba(90,167,255,0.35);
        transition:transform .2s ease, box-shadow .2s ease;
      }
      #${CTA_ID} .poc-btn:focus-visible{outline:2px solid #fff; outline-offset:2px;}
      #${CTA_ID} .poc-btn:hover{transform:translateY(-1px); box-shadow:0 6px 24px rgba(90,167,255,0.45); text-decoration:none;}
      @media (prefers-color-scheme:light){
        #${CTA_ID}{background:rgba(255,255,255,0.92); color:#081022; border-bottom:1px solid rgba(8,16,34,0.08);}
        #${CTA_ID} .poc-btn{color:#081022;}
      }
      @media(max-width:640px){
        #${CTA_ID} .cta-inner{flex-direction:column; align-items:flex-start;}
        #${CTA_ID} .poc-btn{width:100%; justify-content:center;}
      }
    `;
    document.head?.appendChild(style);
  }

  function renderCTA(){
    if(!CTA_ENABLED || document.getElementById(CTA_ID)) return;
    const bar = document.createElement('div');
    bar.id = CTA_ID;
    bar.innerHTML = `
      <div class="cta-inner">
        <span class="cta-copy">Thermo-Credit or AI reliability PoC? We respond within 24h.</span>
        <a class="poc-btn" href="${CTA_HREF}" data-track="poc-cta" data-location="global-bar">${CTA_TEXT}</a>
      </div>
    `;
    document.body?.prepend(bar);
  }

  function sendEvent(name, props){
    if(typeof window.plausible === 'function'){
      window.plausible(name, { props });
    }
  }

  function setupCTAEvents(){
    document.addEventListener('click', event => {
      if(!(event.target instanceof Element)) return;
      const pocTarget = event.target.closest('[data-track="poc-cta"]');
      if(pocTarget){
        const location = pocTarget.getAttribute('data-location') || 'unknown';
        sendEvent('Contact/PoC click', { location });
        return;
      }
      const mailLink = event.target.closest('a[href^="mailto:"]');
      if(mailLink){
        const href = mailLink.getAttribute('href') || 'mailto:';
        const label = mailLink.textContent?.trim().slice(0, 80) || 'mailto-link';
        sendEvent('Contact link click', {
          href,
          label,
          page: normalizePath(window.location.pathname)
        });
      }
    });
  }

  function normalizePath(pathname){
    if(!pathname) return '/';
    if(pathname.endsWith('index.html')) return '/';
    return pathname;
  }

  function setupDwellTracking(){
    const path = normalizePath(window.location.pathname);
    const config = DWELL_TARGETS[path];
    if(!config) return;
    let timer = null;
    const startTimer = () => {
      timer = window.setTimeout(() => {
        sendEvent(config.event);
        timer = null;
      }, config.delay);
    };
    const clearTimer = () => {
      if(timer){
        clearTimeout(timer);
        timer = null;
      }
    };
    document.addEventListener('visibilitychange', () => {
      if(document.hidden){
        clearTimer();
      } else if(!timer){
        startTimer();
      }
    });
    startTimer();
  }

  function init(){
    if(CTA_ENABLED){
      injectStyles();
      renderCTA();
    }
    setupCTAEvents();
    setupDwellTracking();
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();

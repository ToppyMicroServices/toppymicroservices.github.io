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

  function firstSentence(text, limit=220){
    const cleaned = String(text || '').replace(/\s+/g, ' ').trim();
    if(!cleaned) return '';
    const m = cleaned.match(/^(.{1,220}?[.!?])(?:\s|$)/);
    if(m) return m[1].trim();
    return cleaned.length > limit ? cleaned.slice(0, limit).trim() + '…' : cleaned;
  }

  function plainExplainText(exp){
    const clone = exp.cloneNode(true);
    if(!(clone instanceof HTMLElement)) return '';
    clone.querySelectorAll('br').forEach(br => br.replaceWith('\n'));
    return clone.textContent || '';
  }

  function extractSection(text, labels){
    const normalized = String(text || '').replace(/\r\n/g, '\n');
    const labelPattern = labels.join('|');
    const re = new RegExp('(?:^|\\n)\\s*(?:' + labelPattern + ')\\s*:?\\s*([\\s\\S]*?)(?=\\n\\s*(?:[A-Z][a-zA-Z ]+|解説|定義|用語|問題を出した背景|実務での機会|選択肢|関連|Correct|Options|Related|Terms|Context)\\s*:?|$)', 'i');
    const match = normalized.match(re);
    return match ? match[1].replace(/\s+/g, ' ').trim() : '';
  }

  function extractOptionDetails(text){
    const normalized = String(text || '').replace(/\r\n/g, '\n');
    const map = new Map();
    const regex = /(?:^|\n)\s*-\s*([A-Z])(?:\s*\((?:correct|incorrect)\))?\s*:\s*([\s\S]*?)(?=(?:\n\s*-\s*[A-Z](?:\s*\((?:correct|incorrect)\))?\s*:)|(?:\n\s*(?:Related|関連|Correct|正解|Explanation|解説|Why others are wrong|Options|選択肢)\s*:)|$)/gi;
    let m;
    while((m = regex.exec(normalized))){
      const key = m[1].toUpperCase();
      const value = firstSentence(m[2], 180);
      if(key && value && !map.has(key)) map.set(key, value);
    }
    return map;
  }

  function questionCoreText(title){
    return String(title || '')
      .replace(/^\s*[A-Z]?\d+\s*:\s*/i, '')
      .replace(/[?？]\s*$/, '')
      .trim();
  }

  function buildPremiseText(q){
    const title = q.querySelector('h4')?.textContent || '';
    const exp = q.querySelector('.explain');
    const type = (q.dataset.type || '').toLowerCase();
    const explainText = exp ? plainExplainText(exp) : '';
    const terms = firstSentence(extractSection(explainText, ['Terms', '用語', '定義（問題語）', '定義（用語）']), 170);
    const context = firstSentence(extractSection(explainText, ['Context \\(why chosen\\)', '問題を出した背景', '背景（なぜこの問題）']), 170);
    const core = questionCoreText(title);
    const locale = (document.documentElement.lang || '').toLowerCase();
    if(locale.startsWith('ja')){
      if(context && terms) return context + ' ' + terms;
      if(context) return context;
      if(terms) return 'まず ' + terms + ' を前提に, 「' + core + '」を判断します.';
      if(type === 'ms') return '各選択肢を 1 つずつ独立に判定しながら, 「' + core + '」を考える問題です.';
      if(type === 'text') return '用語名だけを思い出すのでなく, その言葉が何を指すかを前提にして答える問題です.';
      return '前提をそろえると, 「' + core + '」は単なる暗記でなく, 何と何を見分ける問いかとして読めます.';
    }
    if(context && terms) return context + ' ' + terms;
    if(context) return context;
    if(terms) return 'Start by anchoring on ' + terms + ' before deciding what "' + core + '" is really comparing.';
    if(type === 'ms') return 'Treat each option as its own true/false check before deciding the final combination.';
    if(type === 'text') return 'Answer from understanding of the term, not just raw recall.';
    return 'Read this as a comparison question with an explicit premise, not as isolated trivia.';
  }

  function genericChoiceDetail(q, choiceText){
    const locale = (document.documentElement.lang || '').toLowerCase();
    const core = questionCoreText(q.querySelector('h4')?.textContent || '');
    const value = String(choiceText || '').replace(/^[A-Z]\.\s*/, '').trim();
    if(locale.startsWith('ja')){
      return 'この選択肢は「' + value + '」を答えとして採る立場です。正解にするには, その内容が『' + core + '』で問われている定義・役割・条件とずれずに一致している必要があります.';
    }
    return 'This option claims that "' + value + '" is the best fit. It is correct only when that claim matches the definition, role, or condition that "' + core + '" is actually testing.';
  }

  function wrapChoiceContent(label){
    if(!(label instanceof HTMLElement)) return { main: null, detail: null };
    let main = label.querySelector('.choice-main');
    if(!main){
      const input = label.querySelector('input');
      main = document.createElement('span');
      main.className = 'choice-main';
      const nodes = Array.from(label.childNodes).filter(node => node !== input);
      nodes.forEach(node => main.appendChild(node));
      label.appendChild(main);
    }
    const baseText = (main.textContent || '').replace(/\s+/g, ' ').trim();
    if(baseText && !label.dataset.choiceBase){
      label.dataset.choiceBase = baseText;
    }
    let detail = label.querySelector('.choice-detail');
    if(!detail){
      detail = document.createElement('small');
      detail.className = 'choice-detail';
      label.appendChild(detail);
    }
    label.classList.add('has-detail');
    return { main, detail };
  }

  function ensureQuestionMarksAndPremises(){
    const locale = (document.documentElement.lang || '').toLowerCase();
    document.querySelectorAll('#questions .q').forEach(q => {
      if(!(q instanceof HTMLElement)) return;
      const h4 = q.querySelector('h4');
      if(h4){
        const text = (h4.textContent || '').trim();
        if(text && !/[?？]\s*$/.test(text)){
          h4.appendChild(document.createTextNode('?'));
        }
      }

      if(!q.querySelector('.question-premise')){
        const body = q.querySelector('.body');
        if(body instanceof HTMLElement){
          const premise = document.createElement('p');
          premise.className = 'question-premise';
          premise.innerHTML = (locale.startsWith('ja') ? '<strong>前提:</strong> ' : '<strong>Premise:</strong> ') + buildPremiseText(q);
          const anchor = body.querySelector('.question-guide, .choices, input[type="text"], input[type="search"], textarea');
          if(anchor instanceof HTMLElement) anchor.insertAdjacentElement('beforebegin', premise);
          else body.prepend(premise);
        }
      }

      const exp = q.querySelector('.explain');
      const details = exp ? extractOptionDetails(plainExplainText(exp)) : new Map();
      q.querySelectorAll('.choices label.choice').forEach(label => {
        if(!(label instanceof HTMLElement)) return;
        const input = label.querySelector('input');
        if(!(input instanceof HTMLInputElement)) return;
        const { detail } = wrapChoiceContent(label);
        if(!(detail instanceof HTMLElement)) return;
        const key = input.value.toUpperCase();
        const current = (detail.textContent || '').trim();
        if(current) return;
        const labelText = label.textContent || '';
        detail.textContent = details.get(key) || genericChoiceDetail(q, labelText);
      });
    });
  }

  function init(){
    if(CTA_ENABLED){
      injectStyles();
      renderCTA();
    }
    setupCTAEvents();
    setupDwellTracking();
    if(document.querySelector('#questions .q')){
      window.addEventListener('load', ensureQuestionMarksAndPremises, { once: true });
    }
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();

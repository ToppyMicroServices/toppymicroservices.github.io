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
    return (clone.textContent || '').replace(/\*\*/g, '');
  }

  function extractSection(text, labels){
    const normalized = String(text || '').replace(/\r\n/g, '\n').replace(/\*\*/g, '');
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

  function stripLeadingLabel(text){
    let cleaned = String(text || '').replace(/\*\*/g, '');
    for(let i = 0; i < 3; i += 1){
      const next = cleaned
        .replace(/^\s*(解説|Explanation|問題を出した背景|Context \(why chosen\)|背景（なぜこの問題）|用語|Terms)\s*:?\s*/i, '')
        .trim();
      if(next === cleaned.trim()) break;
      cleaned = next;
    }
    return cleaned
      .trim();
  }

  function countChoices(q){
    return q.querySelectorAll('.choices label.choice, .choices label').length;
  }

  function splitKeywordCandidates(text){
    const raw = String(text || '')
      .replace(/\r\n/g, '\n')
      .replace(/\*\*/g, '')
      .replace(/^\s*(?:Terms|用語|Related|関連)\s*:?\s*/i, '')
      .replace(/\b(?:include|includes|such as|例えば|たとえば)\b/gi, ',')
      .replace(/[()]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if(!raw) return [];
    const parts = raw
      .split(/[,、/|]|(?:\s+-\s+)|(?:\s+and\s+)|(?:\s+or\s+)|(?:\s+や\s+)|(?:\s+と\s+)/i)
      .map(s => s.trim())
      .filter(Boolean);
    const out = [];
    const seen = new Set();
    for(const part of parts){
      const normalized = normalizeKeywordCandidate(part);
      if(!isUsefulKeyword(normalized)) continue;
      const key = normalized.toLowerCase();
      if(seen.has(key)) continue;
      seen.add(key);
      out.push(normalized);
      if(out.length >= 5) break;
    }
    return out;
  }

  function normalizeKeywordCandidate(value){
    return String(value || '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\*\*/g, '')
      .replace(/^\s*(?:An?|The)\s+/i, '')
      .replace(/\s+(?:は|とは|が|を)\s*$/u, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  const KEYWORD_STOPWORDS = new Set([
    'a', 'an', 'and', 'are', 'as', 'best', 'can', 'does', 'for', 'from',
    'how', 'is', 'it', 'of', 'or', 'problem', 'question', 'solve', 'that',
    'the', 'this', 'to', 'what', 'when', 'where', 'which', 'who', 'why',
    'with', 'rfc', '解説', '用語', '関連'
  ]);

  function isUsefulKeyword(value){
    const normalized = String(value || '').replace(/\s+/g, ' ').trim();
    const key = normalized.toLowerCase();
    if(normalized.length < 2 || normalized.length > 42) return false;
    if(KEYWORD_STOPWORDS.has(key)) return false;
    if(!/[A-Za-z0-9_-]/.test(normalized)) return false;
    if(/[.。:：]/.test(normalized)) return false;
    if(/^(correct|incorrect|explanation|context|terms|related|options)$/i.test(normalized)) return false;
    return true;
  }

  function extractHighlightedKeywords(exp){
    if(!(exp instanceof HTMLElement)) return [];
    const html = exp.innerHTML || '';
    const out = [];
    const seen = new Set();
    const add = value => {
      const parts = splitKeywordCandidates(value);
      for(const part of parts){
        const key = part.toLowerCase();
        if(seen.has(key)) continue;
        seen.add(key);
        out.push(part);
        if(out.length >= 6) return;
      }
    };
    const strongRe = /<strong[^>]*>([\s\S]*?)<\/strong>/gi;
    let m;
    while((m = strongRe.exec(html))) add(m[1].replace(/<[^>]*>/g, ' '));
    const markdownRe = /\*\*([^*]+)\*\*/g;
    while((m = markdownRe.exec(html))) add(m[1]);
    return out;
  }

  function extractQuestionKeywords(q){
    const exp = q.querySelector('.explain');
    const explainText = exp ? plainExplainText(exp) : '';
    const terms = extractSection(explainText, ['Terms', '用語', '定義（問題語）', '定義（用語）']);
    const related = extractSection(explainText, ['Related', '関連']);
    const title = questionCoreText(q.querySelector('h4')?.textContent || '');
    const titleTerms = [
      ...(title.match(/\bRFC\s*\d+\b/gi) || []),
      ...(title.match(/\b[A-Z][A-Za-z0-9/_-]{2,}\b/g) || [])
    ];
    const candidates = [
      ...splitKeywordCandidates(terms),
      ...splitKeywordCandidates(related),
      ...extractHighlightedKeywords(exp),
      ...titleTerms
    ];
    const out = [];
    const seen = new Set();
    for(const candidate of candidates){
      if(!isUsefulKeyword(candidate)) continue;
      const key = candidate.toLowerCase();
      if(seen.has(key)) continue;
      seen.add(key);
      out.push(candidate);
      if(out.length >= 4) break;
    }
    return out;
  }

  function buildKeywordGuideText(q){
    const locale = (document.documentElement.lang || '').toLowerCase();
    const type = String(q.dataset.type || '').toLowerCase();
    const keywords = extractQuestionKeywords(q);
    if(!keywords.length) return '';
    const exp = q.querySelector('.explain');
    const explainText = exp ? plainExplainText(exp) : '';
    const related = firstSentence(extractSection(explainText, ['Related', '関連']), 190);
    const terms = firstSentence(extractSection(explainText, ['Terms', '用語', '定義（問題語）', '定義（用語）']), 190);
    const core = questionCoreText(q.querySelector('h4')?.textContent || '');
    const keywordList = keywords.join(', ');
    if(locale.startsWith('ja')){
      const guide =
        type === 'ms'
          ? 'これらはこの問題で 1 つずつ判定する対象です. 名前だけでなく, どの条件に当てはまるかで見分けます.'
          : type === 'text'
            ? 'これらは「' + core + '」を説明するときに一緒に出やすいキーワードです. それぞれが何を指すか, 境界がどこかを押さえると答えやすくなります.'
            : 'これらは「' + core + '」と近い位置で登場するキーワードです. 語感ではなく, 役割・定義・条件の違いで比較するのがコツです.';
      const extra = related || terms;
      return '<strong>関連キーワード:</strong> ' + keywordList + '. ' + guide + (extra ? ' ' + extra : '');
    }
    const guide =
      type === 'ms'
        ? 'Treat these as the terms whose conditions you must judge one by one.'
        : type === 'text'
          ? 'These are the nearby terms that help define what "' + core + '" actually refers to.'
          : 'These are nearby terms, so compare role, definition, and condition rather than surface wording.';
    const extra = related || terms;
    return '<strong>Related keywords:</strong> ' + keywordList + '. ' + guide + (extra ? ' ' + extra : '');
  }

  function buildQuestionSummaryText(q){
    const locale = (document.documentElement.lang || '').toLowerCase();
    const type = String(q.dataset.type || '').toLowerCase();
    const title = q.querySelector('h4')?.textContent || '';
    const core = questionCoreText(title);
    const exp = q.querySelector('.explain');
    const explainText = exp ? plainExplainText(exp) : '';
    const context = firstSentence(extractSection(explainText, ['Context \\(why chosen\\)', '問題を出した背景', '背景（なぜこの問題）']), 180);
    const terms = firstSentence(extractSection(explainText, ['Terms', '用語', '定義（問題語）', '定義（用語）']), 180);
    const explanation = firstSentence(stripLeadingLabel(explainText), 200);
    const choiceCount = countChoices(q);

    if(locale.startsWith('ja')){
      const intro =
        type === 'ms'
          ? 'この問題は「' + core + '」について, 各選択肢を個別に判定し, 条件に当てはまるものをすべて見分ける練習です.'
          : type === 'text'
            ? 'この問題は「' + core + '」という語を丸暗記でなく, 何を指す概念かまで言い直せるかを確かめる練習です.'
            : 'この問題は「' + core + '」について, 似た候補の中から定義・役割・条件が最も合うものを 1 つ選ぶ練習です.';
      const detail = context || terms || explanation;
      const extra = detail
        ? '前提として, ' + detail
        : (choiceCount >= 3
            ? '選択肢が複数あるので, 単語の雰囲気ではなく, どの条件を満たす説明かで比べるのがコツです.'
            : '短い問いですが, 用語の意味と境界を頭の中で言い換えながら判断すると理解が深まります.');
      return intro + ' ' + extra;
    }

    const intro =
      type === 'ms'
        ? 'This question asks you to judge each option separately and select every statement that truly fits "' + core + '".'
        : type === 'text'
          ? 'This question checks whether you can restate what "' + core + '" means, not just recognize the term.'
          : 'This question asks you to pick the one option whose definition, role, or condition best matches "' + core + '".';
    const detail = context || terms || explanation;
    const extra = detail
      ? 'Start from this premise: ' + detail
      : (choiceCount >= 3
          ? 'Because the options are close together, compare the actual conditions each one satisfies rather than guessing from familiar wording.'
          : 'Even though the prompt is short, it becomes easier once you restate the concept in your own words before answering.');
    return intro + ' ' + extra;
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

  function removeLegacyQuestionContext(q){
    q.querySelectorAll('.question-summary, .question-keywords, .question-premise').forEach(node => node.remove());
  }

  function renderQuestionContext(q){
    const locale = (document.documentElement.lang || '').toLowerCase();
    const body = q.querySelector('.body');
    if(!(body instanceof HTMLElement)) return;

    removeLegacyQuestionContext(q);

    let context = q.querySelector('.question-context');
    if(!(context instanceof HTMLElement)){
      context = document.createElement('aside');
      context.className = 'question-context';
      context.setAttribute('aria-label', locale.startsWith('ja') ? '出題補足' : 'Question context');
    }

    const intentLabel = locale.startsWith('ja') ? '出題意図' : 'Question intent';
    const premiseLabel = locale.startsWith('ja') ? '前提' : 'Premise';
    const keywordsLabel = locale.startsWith('ja') ? '関連キーワード' : 'Related keywords';
    const keywordHtml = buildKeywordGuideText(q)
      .replace(/^<strong>関連 keywords:<\/strong>\s*/i, '')
      .replace(/^<strong>関連キーワード:<\/strong>\s*/i, '')
      .replace(/^<strong>Related keywords:<\/strong>\s*/i, '');

    context.innerHTML =
      '<dl>' +
        '<div><dt>' + intentLabel + '</dt><dd>' + buildQuestionSummaryText(q) + '</dd></div>' +
        '<div><dt>' + premiseLabel + '</dt><dd>' + buildPremiseText(q) + '</dd></div>' +
        (keywordHtml ? '<div><dt>' + keywordsLabel + '</dt><dd>' + keywordHtml + '</dd></div>' : '') +
      '</dl>';

    const choices = body.querySelector('.choices, input[type="text"], input[type="search"], textarea');
    if(choices instanceof HTMLElement){
      choices.insertAdjacentElement('afterend', context);
    } else {
      body.appendChild(context);
    }
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

      renderQuestionContext(q);

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

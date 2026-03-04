window.DRILL_SETTINGS = window.DRILL_SETTINGS || {
  SKILL_NAME: "Your Skill Name",
  SKILL_SUBTITLE: "Your Drill Subtitle",
  GOAL_DESCRIPTION: "Describe the learning goal",
  LEARNING_MODE_DEFAULT: true,
  BRAND_NAME: "ToppyMicroServices",
  BRAND_LOGO: "og-brand-clean.min.png",
  BRAND_URL: "../index.html"
};

(function(){
  const $=(s,r=document)=>r.querySelector(s); const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const ESCAPE_MAP={"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"};
  const escapeHtml=str=>(str??'').replace(/[&<>"']/g,ch=>ESCAPE_MAP[ch]||ch);
  const locale=(document.documentElement.lang||'').toLowerCase();
	  const PREF_KEYS = {
	    explainOnAnswer: 'quizExplainOnAnswer',
	    showAllAnswers: 'quizShowAllAnswers'
	  };
	  const UI_TEXT = locale.startsWith('ja') ? {
	    learningMode: '学習モード',
	    testMode: 'テストモード',
	    toggleModeTitle: '学習/テスト切替',
	    showExplainImmediately: '回答直後に解説を表示',
	    showAllAnswers: 'すべての解答を表示',
	    showAnswersAndScore: '解答とスコアを表示',
	    referencesHeading: '参照（URL）',
	    languageSwitcher: '言語切替'
	  } : {
	    learningMode: 'Learning Mode',
	    testMode: 'Test Mode',
	    toggleModeTitle: 'Toggle learning/test mode',
	    showExplainImmediately: 'Show explanation immediately',
	    showAllAnswers: 'Show all answers',
	    showAnswersAndScore: 'Show Answers & Score',
	    referencesHeading: 'References (URLs)',
	    languageSwitcher: 'Language switcher'
	  };
	  const DETAIL_TEXT=locale.startsWith('ja')?
	    { detailHeading:'詳細リスト', detailDescription:'各設問の回答・正解・スコア・解説をまとめています。', columns:{question:'設問',response:'回答',correct:'正解',score:'スコア',explanation:'解説'}, status:{correct:'正解',incorrect:'不正解',unanswered:'未回答'}, noAnswer:'未回答', notAvailable:'N/A', none:'なし' }:
	    { detailHeading:'Detailed Breakdown', detailDescription:'Responses, correct answers, scores, and explanations for every question.', columns:{question:'Question',response:'Your Answer',correct:'Correct Answer',score:'Result',explanation:'Explanation'}, status:{correct:'Correct',incorrect:'Incorrect',unanswered:'Unanswered'}, noAnswer:'Not answered', notAvailable:'N/A', none:'None' };
	  const THEME_KEY='quizTheme'; const prefersDark=window.matchMedia('(prefers-color-scheme: dark)');

  function readBoolPref(key, defaultValue=false){
    try {
      const raw = localStorage.getItem(key);
      if(raw === null) return defaultValue;
      return raw === '1' || raw === 'true';
    } catch (_e) {
      return defaultValue;
    }
  }
  function writeBoolPref(key, value){
    try {
      localStorage.setItem(key, value ? '1' : '0');
    } catch (_e) {}
  }

  function getRevealControls(){
    return {
      explainOnAnswer: document.getElementById('toggleExplainOnAnswer'),
      showAllAnswers: document.getElementById('toggleShowAllAnswers')
    };
  }

  function updateThemeToggle(mode){const b=$('#themeToggle'); if(!b) return; const L=mode==='light'; b.textContent=L?'🌙 Dark':'🌞 Light'; b.setAttribute('aria-pressed',L?'true':'false');}
  function setTheme(m,persist=true){const n=m==='light'?'light':'dark'; document.body.setAttribute('data-theme',n); if(persist){try{localStorage.setItem(THEME_KEY,n);}catch(e){}} updateThemeToggle(n);}    
  function applyInitialTheme(){let s=null; try{s=localStorage.getItem(THEME_KEY);}catch(e){} const init=s||(prefersDark.matches?'dark':'light'); setTheme(init,false);}    
  function toggleTheme(){const c=document.body.getAttribute('data-theme')==='light'?'light':'dark'; setTheme(c==='light'?'dark':'light',true);}    
  function applySettings(){const S=window.DRILL_SETTINGS||{}; const name=S.SKILL_NAME; const sub=S.SKILL_SUBTITLE; const goal=S.GOAL_DESCRIPTION; $('#title').textContent=(name?name+' ':'')+(sub?('— '+sub):''); $('#subtitle').textContent=goal||''; $('#footer-skill').textContent=name||'Skill'; $('#footer-goal').textContent=goal||''; const img=$('#brand-logo'); if(img&&S.BRAND_LOGO){img.src=S.BRAND_LOGO; img.style.display='inline-block'; img.alt=S.BRAND_NAME||'';} $('#brand-name').textContent=S.BRAND_NAME||''; $('#brand-link').href=S.BRAND_URL||'/'; $('#footer-brand').innerHTML='<strong>'+(S.BRAND_NAME||'')+'</strong>';}    
	  function showExplain(q,show=true){const exp=q.querySelector('.explain'); if(!exp) return; exp.classList.toggle('show',!!show);}    

	  function normalizeExplainHtml(html){
	    let out = String(html ?? '');
	    out = out.replace(/\r\n/g, '\n');
	    out = out.replace(/<br\s*\/?>/gi, '\n');

	    // Convert simple Markdown bold to HTML bold.
	    // This is intentionally minimal and only targets **...**.
	    out = out.replace(/\*\*([^*\n][^*\n]*?)\*\*/g, '<strong>$1</strong>');

	    // Convert simple Markdown inline code to HTML code.
	    // This is intentionally minimal and only targets `...` (single line).
	    out = out.replace(/`([^`\n]+?)`/g, (_m, inner) => '<code>' + escapeHtml(inner) + '</code>');

	    if(locale.startsWith('ja')){
	      out = out
	        .replace(/<strong>Explanation:<\/strong>/g, '<strong>解説:<\/strong>')
	        .replace(/<strong>Explanation<\/strong>/g, '<strong>解説<\/strong>')
	        .replace(/<strong>Context \(why chosen\):<\/strong>/g, '<strong>背景（なぜこの問題）:<\/strong>')
	        .replace(/<strong>Common mistakes:<\/strong>/g, '<strong>よくある誤り:<\/strong>')
	        .replace(/<strong>Terms:<\/strong>/g, '<strong>用語:<\/strong>')
	        .replace(/<strong>Options:<\/strong>/g, '<strong>選択肢:<\/strong>')
	        .replace(/<strong>Related:<\/strong>/g, '<strong>関連:<\/strong>')
	        .replace(/<strong>Correct([^<]*):<\/strong>/g, '<strong>正解$1:<\/strong>');
	    }

	    // Ensure section headings start on their own lines (even if authored inline).
	    out = out
	      .replace(/\s*(<strong>(?:Explanation|解説)(?::)?<\/strong>)/g, '\n$1')
	      .replace(/\s*(<strong>(?:Context \(why chosen\)|背景（なぜこの問題）):<\/strong>)/g, '\n\n$1')
      .replace(/\s*(<strong>(?:Terms|用語):<\/strong>)/g, '\n\n$1')
      .replace(/\s*(<strong>(?:Correct|正解)[^<]*?:<\/strong>)/g, '\n\n$1')
      .replace(/\s*(<strong>(?:Options|選択肢):<\/strong>)/g, '\n\n$1')
      .replace(/\s*(<strong>(?:Related|関連):<\/strong>)/g, '\n\n$1');

    // Ensure headings and lists are readable even if authored as plain text.
    out = out.replace(/(<strong>(Options|選択肢):<\/strong>)\s*/g, '$1\n');

    // If list items were written on one line, split before "- A (" patterns.
    out = out.replace(/\s-\s([A-Z]\s*\()/g, '\n- $1');

    // Make sure list items start on new lines.
    out = out.replace(/\s*(?:\n)?\s-\s+/g, '\n- ');

    // Collapse excessive blank lines.
    out = out.replace(/\n{3,}/g, '\n\n');

    out = out.trim();

    return out;
  }

  function getRfcNumber(){
    const skill = String(window.DRILL_SETTINGS?.SKILL_NAME || '');
    const m = skill.match(/RFC\s*(\d+)/i);
    return m ? m[1] : '';
  }
  function isRfcDrill(){
    return !!getRfcNumber();
  }

  const RFC_CHEATSHEETS = {
    "2119": [
      "Use **MUST/SHOULD/MAY** only when you mean **normative requirements**.",
      "**MUST** = required for conformance; **SHOULD** = strong recommendation with justified exceptions; **MAY** = truly optional.",
      "Be explicit about **exception criteria** when using **SHOULD**.",
      "Prefer testable language: avoid vague “as appropriate” or “if possible”."
    ],
    "2818": [
      "**HTTPS** = **HTTP over TLS** (not “HTTP with Base64”).",
      "Default port for `https` is **443** (vs `http` **80**).",
      "TLS provides **confidentiality**, **integrity**, and **server authentication** (with correct certificate validation).",
      "Enforce `https` for credential/token flows to avoid **downgrade** and **mixed content** risks."
    ],
    "3552": [
      "A good Security Considerations section describes **assets**, **attackers**, **trust boundaries**, and **assumptions**.",
      "Explain **what can go wrong**, not just “use TLS”.",
      "Call out **deployment realities** (key management, logging, monitoring, defaults).",
      "Write for implementers and operators: include **mitigations** and **residual risks**."
    ],
    "3986": [
      "A URI is structured: `scheme://authority/path?query#fragment` (components matter).",
      "`#fragment` is **client-side** and not sent in HTTP requests.",
      "**Percent-encoding** is contextual: encode reserved delimiters when used as data.",
      "Be careful with “normalization”: lowercasing **scheme/host** is usually safe; lowercasing paths often is not."
    ],
    "4949": [
      "Use precise terms: **authentication** ≠ **authorization**; **threat** ≠ **vulnerability**.",
      "Prefer shared vocabulary during reviews and incidents to avoid miscommunication.",
      "Distinguish **confidentiality**, **integrity**, and **availability** impacts.",
      "Name attackers clearly (passive observer vs active MITM vs insider)."
    ],
    "5077": [
      "Session tickets enable **stateless resumption**: server encrypts session state into a ticket.",
      "Ticket **key rotation** is operationally critical (compromise impacts many sessions).",
      "Tickets can create long-lived correlation unless managed carefully.",
      "Resumption improves latency but does not remove the need for sound TLS config."
    ],
    "6066": [
      "TLS extensions let clients/servers negotiate features without new protocol versions.",
      "**SNI** indicates the target hostname to select the right certificate/virtual host.",
      "SNI improves routing but impacts **privacy** (hostname exposure in ClientHello unless using ECH).",
      "Extensions can change security properties: validate what you negotiate."
    ],
    "6265": [
      "`Set-Cookie` sets state; `Cookie` sends it back to the server.",
      "**Secure** means “send only over HTTPS”; **HttpOnly** reduces JS access (XSS theft).",
      "**SameSite** helps mitigate **CSRF** by restricting cross-site sending behavior.",
      "Cookie scope rules (**domain/path**) decide what gets attached to requests."
    ],
    "6455": [
      "WebSocket starts as an **HTTP Upgrade** handshake, then switches protocols.",
      "`ws` is plaintext; `wss` is WebSocket over **TLS**.",
      "Security depends on origin checks, authentication, and correct proxy handling.",
      "Treat WebSocket like a long-lived connection: consider timeouts, backpressure, and message size."
    ],
    "6797": [
      "`Strict-Transport-Security` tells browsers to enforce **HTTPS-only** for a host.",
      "`max-age` is in **seconds**; `includeSubDomains` applies to subdomains; `preload` is for preload lists.",
      "HSTS has a **first-visit** limitation unless preloaded.",
      "Roll out safely: start with small `max-age`, monitor, then increase."
    ],
    "7239": [
      "`Forwarded` standardizes proxy metadata like `for=`, `proto=`, `host=`.",
      "Forwarding headers cross **trust boundaries**: only trust them from known proxies.",
      "Prefer standardized `Forwarded` over ad-hoc `X-Forwarded-*` when possible.",
      "Make sure your app’s “client IP” logic cannot be spoofed."
    ],
    "7258": [
      "Assume pervasive passive monitoring is an **attacker** model, not just “network noise”.",
      "Minimize metadata exposure: avoid leaking identifiers, endpoints, or sensitive patterns.",
      "Prefer encryption and designs that reduce linkability/correlation.",
      "Document privacy/security tradeoffs explicitly in protocol design."
    ],
    "7541": [
      "HPACK compresses HTTP/2 headers using a static/dynamic table and Huffman encoding.",
      "Compression saves bytes but introduces pitfalls (e.g., **side-channel** risks like CRIME/BREACH class issues).",
      "Header tables can cause memory pressure; bound sizes and validate input.",
      "Understand indexed representations vs literal headers."
    ],
    "7616": [
      "Digest auth uses a challenge/response with `nonce`, `realm`, and a hash-based response.",
      "It is more complex than Basic and has many operational pitfalls (algorithms, nonce reuse, proxies).",
      "Do not assume Digest solves everything: it still needs careful TLS/deployment decisions.",
      "Prefer modern token-based auth schemes unless you have a strong reason."
    ],
    "7617": [
      "Basic auth is `Authorization: Basic <base64(user:pass)>` (Base64 is not encryption).",
      "Always pair Basic with **TLS** to protect credentials in transit.",
      "Use proper credential storage and rate limiting to reduce brute-force risk.",
      "Be explicit about charset/encoding expectations when relevant."
    ],
    "7807": [
      "`application/problem+json` provides a consistent structure for API errors.",
      "Key fields: `type`, `title`, `status`, `detail`, `instance` (and extensions).",
      "Use stable `type` URIs for programmatic handling; avoid leaking sensitive internals.",
      "Consistent errors improve client UX and observability."
    ],
    "8174": [
      "RFC 8174 clarifies that **BCP 14** meanings apply when key words are in **ALL CAPS**.",
      "Avoid ambiguous lowercase “must/should/may” unless you mean plain English.",
      "Include the modern reference line: BCP 14 (RFC 2119, RFC 8174).",
      "Normative language should be consistent and machine-checkable."
    ],
    "8441": [
      "HTTP/2 does not support `Upgrade` like HTTP/1.1; WebSockets use **extended CONNECT**.",
      "WebSocket over HTTP/2 still needs origin/auth checks and correct intermediary handling.",
      "Understand how a tunnel maps to streams/frames at a high level.",
      "This matters for environments that require HTTP/2-only (e.g., some proxies/CDNs)."
    ],
    "8446": [
      "TLS 1.3 reduces handshake latency and removes legacy insecure features.",
      "**0-RTT** can be replayed: only use for idempotent, replay-safe requests.",
      "Handshake provides authentication, confidentiality, and integrity for the channel.",
      "Understand resumption vs full handshake and what security properties change."
    ],
    "9000": [
      "QUIC is a secure, multiplexed transport over **UDP** with streams and integrated TLS 1.3 security.",
      "**Connection IDs** enable connection continuity across address changes and load balancing.",
      "Flow control provides receiver **backpressure** (per-stream and connection-level).",
      "QUIC reduces head-of-line blocking compared to TCP for multiplexed streams."
    ],
    "9110": [
      "HTTP semantics define what methods/status codes/headers **mean**, independent of framing.",
      "**Idempotency** matters for retries; caching directives impact correctness and privacy.",
      "Status code classes are semantic categories (2xx success, 3xx redirect, 4xx client error, 5xx server error).",
      "Misunderstanding semantics breaks clients, caches, and security assumptions."
    ],
    "9112": [
      "HTTP/1.1 framing is tricky: message boundaries depend on headers and connection state.",
      "Be careful with `Content-Length`, `Transfer-Encoding: chunked`, and connection reuse.",
      "Incorrect framing can lead to request smuggling and proxy/cache desync.",
      "Know when a connection is reusable vs must be closed."
    ],
    "9113": [
      "HTTP/2 uses binary frames and multiplexed streams over one connection.",
      "Flow control is per-stream and connection-level; stream states matter for correctness.",
      "Header compression (HPACK) and intermediaries introduce new failure modes.",
      "Prioritization exists but is widely treated carefully due to complexity."
    ],
    "9114": [
      "HTTP/3 maps HTTP semantics onto QUIC streams instead of TCP + HTTP/2 framing.",
      "QUIC handles loss recovery and avoids TCP head-of-line blocking across streams.",
      "Connection migration changes assumptions about addresses and load balancing.",
      "Understand how HTTP/3 differs operationally (firewalls, UDP, observability)."
    ]
  };

  function inferQuestionTerms(q){
    const terms = new Set();
    const title = q.querySelector('h4')?.textContent || '';

    const optionTexts = [];
    q.querySelectorAll('.choices label').forEach(label => {
      if(!(label instanceof HTMLElement)) return;
      optionTexts.push(cleanLabelText(label.textContent || ''));
    });

    const blob = (title + ' ' + optionTexts.join(' ')).replace(/\s+/g, ' ').trim();

    // Header field names like Content-Type, Strict-Transport-Security, Cache-Control
    (blob.match(/\b[A-Za-z][A-Za-z0-9]*-[A-Za-z0-9-]+\b/g) || []).forEach(m => terms.add(m));
    // All-caps acronyms (TLS, HSTS, QUIC, CSRF, SNI, HPACK, URI)
    (blob.match(/\b[A-Z]{2,10}\b/g) || []).forEach(m => terms.add(m));
    // Common schemes/tokens
    (blob.match(/\bhttps?|wss?|quic|udp|tcp\b/gi) || []).forEach(m => terms.add(m.toLowerCase()));
    // CamelCase directives like includeSubDomains
    (blob.match(/\b[a-z]+[A-Z][A-Za-z0-9]*\b/g) || []).forEach(m => terms.add(m));

    const rfc = getRfcNumber();
    if(rfc) terms.add('RFC ' + rfc);

    return Array.from(terms).slice(0, 10);
  }

	  function buildContextLine(q, correctSummary){
	    const titleRaw = q.querySelector('h4')?.textContent || '';
	    const title = titleRaw.toLowerCase();
	    const rfc = getRfcNumber();
	    const subtitle = String(window.DRILL_SETTINGS?.SKILL_SUBTITLE || '').trim();

    const en = (() => {
      if(title.includes('default port') || title.includes('port')){
        return "This question is chosen because default-port assumptions show up in URL parsing, proxies, and security controls, and a small mistake can cause real outages or vulnerabilities.";
      }
      if(title.includes('header')){
        return "This question is chosen because exact header field names and directive tokens are interoperability-critical; small typos silently break behavior in production.";
      }
      if(title.includes('cookie') || title.includes('samesite') || title.includes('csrf')){
        return "This question is chosen because cookie attributes are a frequent source of auth/session vulnerabilities; you need to map each attribute to its real security effect.";
      }
      if(title.includes('tls') || title.includes('certificate') || title.includes('handshake') || title.includes('0-rtt')){
        return "This question is chosen because TLS misconceptions lead to insecure deployments; you need to separate channel security (TLS) from application-layer authorization and policy.";
      }
      if(title.includes('cache') || title.includes('cach') || title.includes('idempotent')){
        return "This question is chosen because HTTP semantics drive retries, caching, and client behavior; misreading them causes subtle correctness and privacy bugs.";
      }
      if(title.includes('websocket') || title.includes('upgrade') || title.includes('connect')){
        return "This question is chosen because WebSocket bootstrapping differs across HTTP versions; mixing the rules breaks deployments behind proxies and CDNs.";
      }
      if(title.includes('forwarded') || title.includes('proxy')){
        return "This question is chosen because forwarding metadata crosses trust boundaries; getting it wrong leads to spoofed client identity and security issues.";
      }
      if(title.includes('quic') || title.includes('stream') || title.includes('flow control') || title.includes('connection id')){
        return "This question is chosen because transport-layer building blocks (streams, flow control, connection identity) are foundational for understanding HTTP/3 behavior.";
      }
      if(title.includes('problem') || title.includes('problem+json') || title.includes('error')){
        return "This question is chosen because consistent error models are key for client UX and observability; small field mistakes lead to brittle clients.";
      }
      // Fall back to RFC subtitle/goal framing when no keyword hit.
      if(subtitle){
        return "This question is chosen to reinforce a core concept in **" + subtitle + "** that implementers must get right for interoperability.";
      }
      if(correctSummary){
        return "This question is chosen to reinforce a core definition that commonly causes interoperability bugs when misunderstood.";
      }
      return "This question is chosen to reinforce a core definition that implementations must get right for interoperability.";
    })();

    const ja = (() => {
      if(title.includes('default port') || title.includes('port')){
        return "この問題は、**デフォルトポート**の思い込みがURL解析・プロキシ・セキュリティ制御で事故になりやすく、些細なミスが障害や脆弱性に直結するため選んでいます。";
      }
      if(title.includes('header')){
        return "この問題は、ヘッダー名やディレクティブの**トークン**が相互運用性の要であり、タイポが本番で静かに挙動を壊すため選んでいます。";
      }
      if(title.includes('cookie') || title.includes('samesite') || title.includes('csrf')){
        return "この問題は、Cookie属性の誤解がセッション・認証の脆弱性につながりやすく、各属性の**実際の効果**を対応付ける必要があるため選んでいます。";
      }
      if(title.includes('tls') || title.includes('certificate') || title.includes('handshake') || title.includes('0-rtt')){
        return "この問題は、TLSの誤解が危険なデプロイにつながりやすく、TLSの**通信路の保護**とアプリ層の認可/ポリシーを分けて理解する必要があるため選んでいます。";
      }
      if(title.includes('cache') || title.includes('cach') || title.includes('idempotent')){
        return "この問題は、HTTPの意味論がリトライやキャッシュ挙動を左右し、誤解が正しさ/プライバシーのバグになるため選んでいます。";
	      }
	      if(title.includes('websocket') || title.includes('upgrade') || title.includes('connect')){
	        return "この問題は、HTTPバージョンごとにWebSocketの成立手順が異なり、混同するとプロキシ/CDN配下で壊れるため選んでいます。";
	      }
	      if(title.includes('forwarded') || title.includes('proxy')){
	        return "この問題は、転送メタデータが**信頼境界**をまたぎ、誤るとクライアント識別の**偽装**につながるため選んでいます。";
	      }
	      if(title.includes('quic') || title.includes('stream') || title.includes('flow control') || title.includes('connection id')){
	        return "この問題は、輸送層の部品（**ストリーム**、**フロー制御**、**コネクションID** など）がHTTP/3の理解の土台になるため選んでいます。";
	      }
	      if(subtitle){
	        return "この問題は、**" + subtitle + "** の中核概念を相互運用性の観点で定着させるため選んでいます。";
	      }
	      return "この問題は、相互運用性のために取り違えやすい定義を定着させる目的で選んでいます。";
	    })();

    return locale.startsWith('ja')
      ? '<strong>背景（なぜこの問題）:</strong> ' + ja
      : '<strong>Context (why chosen):</strong> ' + en;
  }

  function getCorrectSummaryFromExplain(html){
    const lines = String(html || '').split('\n');
    for(let i=0;i<lines.length;i++){
      const line = lines[i];
      if(!/(<strong>(?:Correct|正解)[^<]*?:<\/strong>)/i.test(line)) continue;
      const after = line.split('</strong>').slice(1).join('</strong>').trim();
      if(after) return after.replace(/\s+/g,' ').trim();
      for(let j=i+1;j<lines.length;j++){
        if(/^\s*<strong>[^<]+:<\/strong>/i.test(lines[j])) break;
        const t = String(lines[j] || '').trim();
        if(t) return t.replace(/\s+/g,' ').trim();
      }
    }
    return '';
  }

  function generateOptionComment({ isCorrect, optionText, questionTitle, correctSummary }){
    const title = String(questionTitle || '').toLowerCase();
    const text = String(optionText || '').toLowerCase();

    // Targeted heuristics for common misconception patterns.
    if(text.includes('base64')){
      const msg = locale.startsWith('ja')
        ? "Base64は**エンコード**であり、暗号化や認証そのものではありません。"
        : "Base64 is **encoding**, not encryption or authentication.";
      return msg;
    }
    if(text.includes('encrypt') || text.includes('encryption')){
      const msg = locale.startsWith('ja')
        ? "「暗号化される」は仕様の意味と一致しません（属性やヘッダーは暗号化を“保証”しません）。"
        : "“Encrypted” is not implied by the directive/attribute; it does not guarantee encryption by itself.";
      return msg;
    }
    if(text.includes('authorization') || text.includes('authorize') || text.includes('認可')){
      const msg = locale.startsWith('ja')
        ? "認可（authorization）はアプリ層の責務で、TLSや転送層の機能とは別です。"
        : "Authorization is an application-layer concern; transport/security layers don’t decide who is allowed to do what.";
      return msg;
    }
    if(title.includes('default port') || title.includes('port')){
      const msg = locale.startsWith('ja')
        ? "ポート番号はスキーム/プロトコルに紐づく既定値があり、別の既定値と混同しやすい点が落とし穴です。"
        : "Port numbers have well-known defaults per scheme/protocol; confusing them is a common pitfall.";
      return msg;
    }
    if(title.includes('header') || text.includes('-')){
      const msg = locale.startsWith('ja')
        ? "ヘッダー名は**トークン**として一致が必要です（表記ゆれ/タイポは機能しません）。"
        : "Header field names are tokens; exact spelling matters (typos won’t work).";
      return msg;
    }

    if(isCorrect && correctSummary){
      const msg = locale.startsWith('ja')
        ? "この選択肢は正解の要点（" + correctSummary + "）に合致します。"
        : "This matches the key point: " + correctSummary;
      return msg;
    }

    if(isCorrect){
      return locale.startsWith('ja')
        ? "設問の要件/定義に合致します。"
        : "This aligns with the RFC-defined requirement/definition for this concept.";
    }

    if(correctSummary){
      return locale.startsWith('ja')
        ? "正解の要点（" + correctSummary + "）と矛盾します。"
        : "This contradicts the key point: " + correctSummary;
    }

    return locale.startsWith('ja')
      ? "仕様上の定義/要件と一致しません。"
      : "This does not match the RFC-defined behavior/definition.";
  }

  function ensureOptionsSection(q, html){
    const type = (q.dataset.type || '').toLowerCase();
    if(type !== 'mc' && type !== 'ms') return html;

    const answer = String(q.dataset.answer || '').trim();
    const correctValues = new Set(answer.split(',').map(s=>s.trim()).filter(Boolean));
    const questionTitle = q.querySelector('h4')?.textContent || '';

    const choices = [];
    q.querySelectorAll('.choices input').forEach(input => {
      if(!(input instanceof HTMLInputElement)) return;
      const label = input.closest('label');
      const full = cleanLabelText(label?.textContent || '');
      const letter = String(input.value || '').toUpperCase();
      const text = full.replace(/^[A-Z]\.\s*/,'').trim();
      if(letter) choices.push({ value: input.value, letter, text });
    });
    if(!choices.length) return html;

    const lines = String(html || '').split('\n');
    const optionsStart = lines.findIndex(l => /<strong>(?:Options|選択肢):<\/strong>/i.test(l));
    const headingLine = locale.startsWith('ja') ? '<strong>選択肢:</strong>' : '<strong>Options:</strong>';
    const correctSummary = getCorrectSummaryFromExplain(html);

    const makeLine = (choice) => {
      const isCorrect = correctValues.has(choice.value);
      const status = isCorrect ? 'correct' : 'incorrect';
      const comment = generateOptionComment({
        isCorrect,
        optionText: choice.text,
        questionTitle,
        correctSummary
      });
      // Use the existing "- A (correct): ..." convention.
      return '- ' + choice.letter + ' (' + status + '): ' + comment;
    };

    if(optionsStart < 0){
      // If the explanation already contains per-option commentary (e.g. "<li>A (...): ..."),
      // avoid duplicating an Options block.
      const alreadyHasPerOption = choices
        .filter(c => c.letter && new RegExp('\\b' + c.letter + '\\s*\\(', 'i').test(String(html || '')))
        .length >= Math.min(choices.length, 2);
      if(alreadyHasPerOption) return html;

      // Insert before Related if present, otherwise append to end.
      const relatedIndex = lines.findIndex(l => /<strong>(?:Related|関連):<\/strong>/i.test(l));
      const insertAt = relatedIndex >= 0 ? relatedIndex : lines.length;
      const block = [headingLine, ...choices.map(makeLine)];
      lines.splice(insertAt, 0, '', ...block);
      return lines.join('\n').trim();
    }

    // Determine section end (next heading).
    let optionsEnd = lines.length;
    for(let i=optionsStart+1;i<lines.length;i++){
      if(/^\s*<strong>[^<]+:<\/strong>/i.test(lines[i])){ optionsEnd = i; break; }
    }

    const present = new Set();
    for(let i=optionsStart+1;i<optionsEnd;i++){
      const m = String(lines[i] || '').match(/^\s*-\s*([A-Z])\s*\(/);
      if(m) present.add(m[1]);
    }

    const missing = choices.filter(c => !present.has(c.letter));
    if(!missing.length) return html;

    const insertLines = missing.map(makeLine);
    lines.splice(optionsEnd, 0, ...insertLines);
    return lines.join('\n').trim();
  }

  function ensureContextAndTerms(q, html){
    const lines = String(html || '').split('\n');

    const expIdx = lines.findIndex(l => /<strong>(?:Explanation|解説)(?::)?<\/strong>/i.test(l));
    if(expIdx < 0){
      lines.unshift(locale.startsWith('ja') ? '<strong>解説:</strong>' : '<strong>Explanation:</strong>');
    }

    const hasContext = lines.some(l => /<strong>(?:Context \(why chosen\)|背景（なぜこの問題）):<\/strong>/i.test(l));
    if(!hasContext){
      const correctSummary = getCorrectSummaryFromExplain(lines.join('\n'));
      const ctxLine = buildContextLine(q, correctSummary);
      const insertAt = (expIdx >= 0 ? expIdx : 0) + 1;
      lines.splice(insertAt, 0, '', ctxLine);
    }

    // Terms: insert if missing, otherwise boldify the leading list if possible.
    const termsIdx = lines.findIndex(l => /<strong>(?:Terms|用語):<\/strong>/i.test(l));
    if(termsIdx < 0){
      const inferred = inferQuestionTerms(q);
      if(inferred.length){
        const heading = locale.startsWith('ja') ? '<strong>用語:</strong>' : '<strong>Terms:</strong>';
        const terms = inferred.map(t => '<strong>' + escapeHtml(t) + '</strong>').join(', ');
        const line = heading + ' ' + terms;
        // Insert after Context when present, otherwise after Explanation.
        const ctxIdx = lines.findIndex(l => /<strong>(?:Context \(why chosen\)|背景（なぜこの問題）):<\/strong>/i.test(l));
        const base = ctxIdx >= 0 ? ctxIdx : (expIdx >= 0 ? expIdx : 0);
        lines.splice(base + 1, 0, '', line);
      }
      return lines.join('\n').trim();
    }

    // If the Terms section has a comma-separated list up to the first period, bold those terms.
    const line = lines[termsIdx];
    const m = String(line).match(/^(\s*<strong>(?:Terms|用語):<\/strong>\s*)([\s\S]+)$/i);
    if(!m) return lines.join('\n').trim();
    const prefix = m[1];
    const rest = m[2];
    if(/<strong>/.test(rest)) return lines.join('\n').trim();

    const dot = rest.indexOf('.');
    const jpDot = rest.indexOf('。');
    const end = (() => {
      const candidates = [dot, jpDot].filter(i => i >= 0);
      if(!candidates.length) return -1;
      return Math.min(...candidates);
    })();

    if(end <= 0 || end > 160) return lines.join('\n').trim();
    const head = rest.slice(0, end).trim();
    const tail = rest.slice(end);
    const parts = head.split(/\s*,\s*/g).map(s => s.trim()).filter(Boolean);
    if(parts.length < 2) return lines.join('\n').trim();

    const bolded = parts.map(p => '<strong>' + escapeHtml(p) + '</strong>').join(', ');
    lines[termsIdx] = prefix + bolded + tail;
    return lines.join('\n').trim();
  }

  function ensureRelatedSection(html){
    const hasRelated = /<strong>(?:Related|関連):<\/strong>/i.test(String(html || ''));
    if(hasRelated) return html;

    const scope = document.querySelector('section.scope');
    const refs = [];
    scope?.querySelectorAll('a[href]').forEach(a => {
      if(!(a instanceof HTMLAnchorElement)) return;
      const href = a.getAttribute('href') || '';
      const text = cleanLabelText(a.textContent || '');
      if(!href || !text) return;
      refs.push({ href, text });
    });

    if(!refs.length) return html;

    const heading = locale.startsWith('ja') ? '<strong>関連:</strong>' : '<strong>Related:</strong>';
    const bullets = refs.slice(0, 3).map(r => '- ' + '<a href="' + escapeHtml(r.href) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(r.text) + '</a>');
    const block = [heading, ...bullets].join('\n');

    return String(html || '').trim() + '\n\n' + block;
  }

  function enrichRfcExplain(q, html){
    let out = ensureContextAndTerms(q, html);
    out = ensureOptionsSection(q, out);
    out = ensureRelatedSection(out);
    return out;
  }

  function injectRfcHubLink(){
    if(!isRfcDrill()) return;
    const scope = document.querySelector('section.scope');
    if(!(scope instanceof HTMLElement)) return;
    if(scope.querySelector('.rfc-hub-link')) return;

	    const p = document.createElement('p');
	    p.className = 'muted rfc-hub-link';
	    const hubHref = locale.startsWith('ja') ? 'rfc_quizzes_ja.html' : 'rfc_quizzes.html';
	    const label = locale.startsWith('ja') ? 'RFCクイズ一覧' : 'RFC quiz hub';
	    p.innerHTML = '↩ <a href="' + escapeHtml(hubHref) + '">' + escapeHtml(label) + '</a>';

    const refsList = scope.querySelector('ul');
    if(refsList && refsList.parentElement === scope){
      refsList.insertAdjacentElement('afterend', p);
    } else {
      scope.appendChild(p);
    }
  }

  function injectRfcCheatSheet(){
    if(!isRfcDrill()) return;
    if(locale.startsWith('ja')) return; // keep English-only for now
    if(document.querySelector('details.cheatsheet')) return;

    const rfc = getRfcNumber();
    const bullets = RFC_CHEATSHEETS[rfc];
    if(!bullets || !bullets.length) return;

    const scope = document.querySelector('section.scope');
    if(!(scope instanceof HTMLElement)) return;

    const details = document.createElement('details');
    details.className = 'cheatsheet card';
    details.open = false;

    const summary = document.createElement('summary');
    summary.textContent = 'Cheat Sheet (RFC quick notes)';
    details.appendChild(summary);

    const sheet = document.createElement('div');
    sheet.className = 'sheet';
    const ul = document.createElement('ul');
    bullets.forEach(b => {
      const li = document.createElement('li');
      li.innerHTML = normalizeExplainHtml(String(b));
      ul.appendChild(li);
    });
    sheet.appendChild(ul);
    details.appendChild(sheet);

    scope.insertAdjacentElement('afterend', details);
  }

  function extractTermsFromExplainHtml(explainHtml){
    const html = String(explainHtml ?? '').replace(/\r\n/g, '\n').replace(/<br\s*\/?>/gi, '\n');
    // Capture until the next section heading (not just any <strong>, since terms may be bolded).
    const match = html.match(/<strong>(?:Terms|用語):<\/strong>\s*([\s\S]*?)(?=\n\s*<strong>[^<]+:<\/strong>|$)/i);
    if(!match) return [];

    let text = match[1]
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Prefer the first sentence; many pages write "term1, term2. definition...".
    const period = text.indexOf('.');
    if(period >= 0 && period < 120) text = text.slice(0, period).trim();

    const pieces = text
      .split(/\s*,\s*/g)
      .map(s => s.trim())
      .filter(Boolean);

    const seen = new Set();
    const terms = [];
    for(const p of pieces){
      const key = p.toLowerCase();
      if(seen.has(key)) continue;
      seen.add(key);
      terms.push(p);
    }
    return terms;
  }

  function inferKeywordsFromQuiz(){
    const settings = window.DRILL_SETTINGS || {};
    const explicit = Array.isArray(settings.KEYWORDS) ? settings.KEYWORDS : null;
    if(explicit && explicit.length) return explicit.map(s => String(s).trim()).filter(Boolean);

    // Only auto-infer for RFC drills.
    const skill = String(settings.SKILL_NAME || '');
    if(!/^RFC\s+\d+/i.test(skill)) return [];

    const all = [];
    $$('#questions .explain').forEach(exp => {
      if(!(exp instanceof HTMLElement)) return;
      all.push(...extractTermsFromExplainHtml(exp.innerHTML));
    });

    // Fall back to goal comma-separated words if Terms isn't present.
    if(!all.length && typeof settings.GOAL_DESCRIPTION === 'string'){
      const goalParts = settings.GOAL_DESCRIPTION.split(',').map(s => s.trim()).filter(Boolean);
      all.push(...goalParts);
    }

    const seen = new Set();
    const out = [];
    for(const t of all){
      const key = t.toLowerCase();
      if(seen.has(key)) continue;
      seen.add(key);
      out.push(t);
    }
    return out;
  }

  function injectKeywordsBlock(){
    const keywords = inferKeywordsFromQuiz();
    if(!keywords.length) return;

    const scope = document.querySelector('section.scope');
    if(!(scope instanceof HTMLElement)) return;
    if(scope.querySelector('.keywords')) return;

    const label = locale.startsWith('ja') ? '重要キーワード' : 'Keywords';
    const max = 18;
    const shown = keywords.slice(0, max);
    const suffix = keywords.length > max ? (locale.startsWith('ja') ? ' …' : ' …') : '';

    const p = document.createElement('p');
    p.className = 'muted keywords';
    p.innerHTML = '<strong>'+escapeHtml(label)+':</strong> ' + escapeHtml(shown.join(', ')) + suffix;

    // Insert after the references list when available.
    const refsList = scope.querySelector('ul');
    if(refsList && refsList.parentElement === scope){
      refsList.insertAdjacentElement('afterend', p);
    } else {
      scope.appendChild(p);
    }
  }

  function normalizeAllExplanations(){
    const rfc = isRfcDrill();
    $$('#questions .q').forEach(q => {
      if(!(q instanceof HTMLElement)) return;
      const exp = q.querySelector('.explain');
      if(!(exp instanceof HTMLElement)) return;

      let out = normalizeExplainHtml(exp.innerHTML);
      if(rfc){
        out = enrichRfcExplain(q, out);
        out = normalizeExplainHtml(out);
      }
      exp.innerHTML = out;
    });
  }

  function mapDifficulty(q){
    const raw=(q.dataset.difficulty||'').trim();
    if(/^L[1-5]$/.test(raw)) return raw;
    const t=(q.dataset.type||'').toLowerCase();
    if(t==='mc') return 'L2';
    if(t==='ms') return 'L3';
    if(t==='text') return 'L3';
    return 'L3';
  }

  function injectDifficultyBadges(){
    $$('#questions .q').forEach(q => {
      if(!(q instanceof HTMLElement)) return;
      if(q.querySelector('.difficulty-badge')) return;
      const type=q.querySelector('.type');
      if(!(type instanceof HTMLElement)) return;
      const badge=document.createElement('span');
      badge.className='difficulty-badge';
      badge.textContent=mapDifficulty(q);
      badge.setAttribute('title','Difficulty');
      type.append(' ');
      type.appendChild(badge);
    });
  }

  function isAnswered(q){const t=q.dataset.type; if(t==='mc') return !!q.querySelector('input[type=radio]:checked'); if(t==='ms') return q.querySelectorAll('input[type=checkbox]:checked').length>0; if(t==='text'){const v=q.querySelector('input[type=text]')?.value.trim(); return !!v;} return false;}

  function cleanLabelText(text){ return (text||'').replace(/\s+/g,' ').trim(); }
  function describeChoiceList(q,values){ if(!values||!values.length) return ''; const map=v=>{const input=q.querySelector('input[value="'+CSS.escape(v)+'"]'); const label=input?.closest('label'); return label?cleanLabelText(label.textContent):v; }; return values.map(map).join(', '); }
  function describeChoiceLabel(q,value){ return describeChoiceList(q,[value]); }

  function evaluateQuestion(q){const id=q.dataset.id; const type=q.dataset.type; const ans=(q.dataset.answer||'').trim(); let ok=null,user=null; if(type==='mc'){const p=q.querySelector('input[type=radio]:checked'); if(!p){ok=null;} else {user=p.value; ok=(user===ans);} } else if(type==='ms'){const picked=q.querySelectorAll('input[type=checkbox]:checked'); user=Array.from(picked).map(i=>i.value).sort(); if(!user.length){ok=null;} else {const gold=ans.split(',').map(s=>s.trim()).sort(); ok=JSON.stringify(user)===JSON.stringify(gold);} } else if(type==='text'){const t=q.querySelector('input[type=text]'); user=(t?.value||'').trim(); const mode=(q.dataset.eval||'exact').toLowerCase(); if(!user){ok=null;} else if(mode==='regex'){try{ok=new RegExp(ans,'i').test(user);}catch(e){ok=false;}} else {ok=(user===ans);} } return {id,type,ok,user};}

  function formatUserAnswerDisplay(q,evaluation){ const type=q.dataset.type; if(type==='mc'){return evaluation.user?describeChoiceLabel(q,evaluation.user):'';} if(type==='ms'){const vals=Array.isArray(evaluation.user)?evaluation.user:[]; return vals.length?describeChoiceList(q,vals):'';} if(type==='text'){return evaluation.user||'';} return '';
  }
  function formatCorrectAnswerDisplay(q){ const type=q.dataset.type; const ans=(q.dataset.answer||'').trim(); if(!ans) return ''; if(type==='mc') return describeChoiceLabel(q,ans); if(type==='ms'){const vals=ans.split(',').map(s=>s.trim()).filter(Boolean); return vals.length?describeChoiceList(q,vals):'';} if(type==='text'){const mode=(q.dataset.eval||'exact').toLowerCase(); return mode==='regex' ? 'Regex: '+ans : ans;} return ans; }

  function scoreLabel(ok){ if(ok===true) return DETAIL_TEXT.status.correct; if(ok===false) return DETAIL_TEXT.status.incorrect; return DETAIL_TEXT.status.unanswered; }

  function computeLiveScore(){const qs=$$('#questions .q'); let total=0,correct=0,answered=0; qs.forEach(q=>{total++; const r=evaluateQuestion(q); if(r.ok===true) correct++; if(isAnswered(q)) answered++;}); return {total,correct,answered};}
  function updateLiveScore(){const s=computeLiveScore(); const el=$('#score-badge'); if(el){ el.textContent=s.correct+' / '+s.total; el.title='Correct '+s.correct+' of '+s.total; }}

  function resolveResultsBox(targetId){ if(targetId){ const el=document.getElementById(targetId); if(el) return el; } return document.getElementById('results-bottom') || document.querySelector('.results'); }

  function setResultsVisible(visible, targetId){
    const box = resolveResultsBox(targetId);
    if(!box) return;
    if(visible){
      box.style.display = 'block';
      return;
    }
    box.style.display = 'none';
    box.innerHTML = '';
  }

  function showAnswersAndScore(targetId){
    let total=0,correct=0,answered=0; const rows=[];
    $$('#questions .q').forEach(q=>{
      total++; const result=evaluateQuestion(q); if(isAnswered(q)) answered++; if(result.ok===true) correct++;
      const qTitle=q.querySelector('h4')?.textContent.trim()||result.id;
      const expHtml=q.querySelector('.explain')?.innerHTML.trim()||'';
      const status=scoreLabel(result.ok);
      const correctDisp=formatCorrectAnswerDisplay(q);
      const userDisp=formatUserAnswerDisplay(q,result)||DETAIL_TEXT.noAnswer;
      rows.push('<tr>'+
        '<td><div><strong>'+escapeHtml(result.id)+'</strong></div><div>'+escapeHtml(qTitle)+'</div></td>'+
        '<td>'+escapeHtml(userDisp)+'</td>'+
        '<td>'+escapeHtml(correctDisp||DETAIL_TEXT.notAvailable)+'</td>'+
        '<td>'+escapeHtml(status)+'</td>'+
        '<td>'+(expHtml||'')+'</td>'+
      '</tr>');
    });
    const box=resolveResultsBox(targetId);
    if(box){
      const scoreHeading=locale.startsWith('ja')?'スコア':'Score';
      const summaryLabel=locale.startsWith('ja')
        ? '正解: <strong>'+correct+'</strong> / '+total+' (回答: '+answered+')'
        : 'Correct: <strong>'+correct+'</strong> / '+total+' (answered: '+answered+')';
      const tableHTML='<div class="table-wrapper"><table><thead><tr>'+
        '<th>'+DETAIL_TEXT.columns.question+'</th>'+
        '<th>'+DETAIL_TEXT.columns.response+'</th>'+
        '<th>'+DETAIL_TEXT.columns.correct+'</th>'+
        '<th>'+DETAIL_TEXT.columns.score+'</th>'+
        '<th>'+DETAIL_TEXT.columns.explanation+'</th>'+
      '</tr></thead><tbody>'+rows.join('')+'</tbody></table></div>';
      box.innerHTML='<h4 style="margin:0 0 8px">'+scoreHeading+'</h4><p>'+summaryLabel+'</p>'+tableHTML;
      box.style.display='block';
    }
  }

  function applyRevealState(targetId){
    const { explainOnAnswer, showAllAnswers } = getRevealControls();
    const explain = !!explainOnAnswer?.checked;
    const showAll = !!showAllAnswers?.checked;

    $$('#questions .q').forEach(q => {
      showExplain(q, showAll || (explain && isAnswered(q)));
    });

    if(showAll){
      showAnswersAndScore(targetId);
    } else {
      setResultsVisible(false, targetId);
    }
  }

  function initRevealControls(){
    const { explainOnAnswer, showAllAnswers } = getRevealControls();
    if(explainOnAnswer){
      explainOnAnswer.checked = readBoolPref(PREF_KEYS.explainOnAnswer, true);
      explainOnAnswer.addEventListener('change', () => {
        writeBoolPref(PREF_KEYS.explainOnAnswer, !!explainOnAnswer.checked);
        applyRevealState();
      });
    }
	    if(showAllAnswers){
	      showAllAnswers.checked = readBoolPref(PREF_KEYS.showAllAnswers, false);
	      showAllAnswers.addEventListener('change', () => {
	        writeBoolPref(PREF_KEYS.showAllAnswers, !!showAllAnswers.checked);
	        applyRevealState();
	      });
	    }
	  }

	  function localizeStaticUiText(){
	    if(!locale.startsWith('ja')) return;

	    const explainLabel = document.querySelector('label.switch[for="toggleExplainOnAnswer"] .switch-label');
	    if(explainLabel && /Show explanation immediately/i.test(explainLabel.textContent || '')){
	      explainLabel.textContent = UI_TEXT.showExplainImmediately;
	    }
	    const showAllLabel = document.querySelector('label.switch[for="toggleShowAllAnswers"] .switch-label');
	    if(showAllLabel && /Show all answers/i.test(showAllLabel.textContent || '')){
	      showAllLabel.textContent = UI_TEXT.showAllAnswers;
	    }

	    const bottom = document.getElementById('bottomShowAnswers');
	    if(bottom && /Show Answers/i.test(bottom.textContent || '')){
	      bottom.textContent = UI_TEXT.showAnswersAndScore;
	    }

	    const refsHeading = document.getElementById('refs-h') || document.getElementById('scope-h');
	    if(refsHeading && (refsHeading.textContent || '').trim() === 'References (URLs)'){
	      refsHeading.textContent = UI_TEXT.referencesHeading;
	    }

	    const langToggle = document.querySelector('.lang-toggle');
	    if(langToggle){
	      const aria = langToggle.getAttribute('aria-label') || '';
	      if(!aria || aria === 'Language switcher'){
	        langToggle.setAttribute('aria-label', UI_TEXT.languageSwitcher);
	      }
	    }
	  }

	  function bindAnswerChangeEvents(){
	    const inputs = $$('#questions input');
	    const handler = () => {
	      updateLiveScore();
	      applyRevealState();
    };
    inputs.forEach(input => {
      const type = (input.getAttribute('type') || '').toLowerCase();
      if(type === 'text'){
        input.addEventListener('input', handler);
        input.addEventListener('change', handler);
      } else {
        input.addEventListener('change', handler);
      }
    });
  }

	  // Handlers
	  $('#themeToggle')?.addEventListener('click',()=>{toggleTheme(); updateLiveScore();});
	  $('#mode-badge')?.addEventListener('click',()=>{
	    let lm=$('#learningMode');
	    if(!lm){
	      lm=document.createElement('input');
	      lm.type='checkbox';
	      lm.id='learningMode';
	      lm.checked=true;
	      lm.style.display='none';
	      document.body.appendChild(lm);
	    }
	    lm.checked=!lm.checked;
	    const mb=$('#mode-badge');
	    mb.textContent=lm.checked?UI_TEXT.learningMode:UI_TEXT.testMode;
	    mb.title=UI_TEXT.toggleModeTitle;
	    mb.setAttribute('aria-pressed',lm.checked?'true':'false');
	    updateLiveScore();
	  });
	  const bottomBtn=$('#bottomShowAnswers');
	  if(bottomBtn){
	    bottomBtn.addEventListener('click',()=>{
	      const { showAllAnswers } = getRevealControls();
	      if(showAllAnswers){
        showAllAnswers.checked = true;
        writeBoolPref(PREF_KEYS.showAllAnswers, true);
      }
      applyRevealState(bottomBtn.dataset.resultsTarget);
    });
  }

	  applyInitialTheme();
	  try{ if(!localStorage.getItem('quizTheme')){ setTheme(prefersDark.matches?'dark':'light',false);} }catch(_){ }
	  applySettings();
	  localizeStaticUiText();
	  injectRfcHubLink();
	  injectRfcCheatSheet();
	  normalizeAllExplanations();
	  injectKeywordsBlock();
	  injectDifficultyBadges();
	  initRevealControls();
	  bindAnswerChangeEvents();
	  if(!$('#learningMode')){ const lm=document.createElement('input'); lm.type='checkbox'; lm.id='learningMode'; lm.checked=true; lm.style.display='none'; document.body.appendChild(lm);} 
	  const mb=$('#mode-badge');
	  if(mb){
	    mb.textContent=UI_TEXT.learningMode;
	    mb.title=UI_TEXT.toggleModeTitle;
	    mb.setAttribute('aria-pressed','true');
	  }
	  updateLiveScore();
	  applyRevealState();
	  const y=new Date().getFullYear(); const b=window.DRILL_SETTINGS?.BRAND_NAME||'ToppyMicroServices'; const c=$('#copyright'); if(c){ c.textContent='© '+y+' '+b+'. All rights reserved.'; }
	})();

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
	    languageSwitcher: '言語切替',
      progressTitle: '進捗',
      progressIntro: '今どこまで進んだかをひと目で追えます',
      progressAnswered: '回答済み',
      progressCorrect: '正解',
      progressRemaining: '残り',
      skipToQuestions: '設問へスキップ'
	  } : {
	    learningMode: 'Learning Mode',
	    testMode: 'Test Mode',
	    toggleModeTitle: 'Toggle learning/test mode',
	    showExplainImmediately: 'Show explanation immediately',
	    showAllAnswers: 'Show all answers',
	    showAnswersAndScore: 'Show Answers & Score',
	    referencesHeading: 'References (URLs)',
	    languageSwitcher: 'Language switcher',
      progressTitle: 'Progress',
      progressIntro: 'Track your pace and correctness at a glance',
      progressAnswered: 'Answered',
      progressCorrect: 'Correct',
      progressRemaining: 'Remaining',
      skipToQuestions: 'Skip to questions'
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
          .replace(/<strong>Context \(why chosen\):<\/strong>/g, '<strong>問題を出した背景:<\/strong>')
          .replace(/<strong>背景（なぜこの問題）:<\/strong>/g, '<strong>問題を出した背景:<\/strong>')
          .replace(/<strong>Real-world usage:<\/strong>/g, '<strong>実務での機会:<\/strong>')
          .replace(/<strong>Common mistakes:<\/strong>/g, '<strong>よくある誤り:<\/strong>')
          .replace(/<strong>Terms:<\/strong>/g, '<strong>用語:<\/strong>')
          .replace(/<strong>Options:<\/strong>/g, '<strong>選択肢:<\/strong>')
          .replace(/<strong>Related:<\/strong>/g, '<strong>関連:<\/strong>')
          .replace(/<strong>Correct([^<]*):<\/strong>/g, '<strong>正解$1:<\/strong>');

	    // Project policy: prefer '.' and ',' in Japanese text.
	    out = out.replace(/、/g, ',').replace(/。/g, '.');
      }

	    // Ensure section headings start on their own lines (even if authored inline).
	    out = out
	      .replace(/\s*(<strong>(?:Explanation|解説)(?::)?<\/strong>)/g, '\n$1')
	      .replace(/\s*(<strong>(?:Context \(why chosen\)|背景（なぜこの問題）|問題を出した背景):<\/strong>)/g, '\n\n$1')
	      .replace(/\s*(<strong>(?:Real-world usage|実務での機会):<\/strong>)/g, '\n\n$1')
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

  function escapeRegExp(str){
    return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function uniqueKeywords(list){
    const seen = new Set();
    const out = [];
    for(const raw of (list || [])){
      const k = String(raw || '').trim();
      if(!k) continue;
      const key = k.toLowerCase();
      if(seen.has(key)) continue;
      seen.add(key);
      out.push(k);
    }
    return out;
  }

  function getDefaultImportantKeywords(){
    // Minimal, RFC-focused set. (Other keywords come from Terms/inference.)
    return [
      'MUST NOT','SHALL NOT','NOT RECOMMENDED','SHOULD NOT',
      'MUST','SHALL','SHOULD','RECOMMENDED','MAY','OPTIONAL',
      'TLS','HTTPS','HTTP/2','HTTP/3','QUIC','WebSocket','URI',
      'Set-Cookie','SameSite','CSRF','HSTS','SNI','0-RTT'
    ];
  }

  function boldifyKeywordsInHtml(html, keywords){
    const list = uniqueKeywords(keywords)
      .filter(k => k.length >= 2)
      .sort((a,b) => b.length - a.length)
      .slice(0, 18);
    if(!list.length) return html;

    const keywordSet = new Set(list.map(k => k.toLowerCase()));
    const re = new RegExp('(' + list.map(escapeRegExp).join('|') + ')', 'gi');

    const root = document.createElement('div');
    root.innerHTML = String(html || '');

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while(walker.nextNode()) textNodes.push(walker.currentNode);

    for(const node of textNodes){
      const parent = node.parentElement;
      if(!parent) continue;
      // Skip already-emphasized or code/link contexts.
      if(parent.closest('strong, code, a, pre, script, style')) continue;
      const text = node.nodeValue || '';
      if(!re.test(text)) continue;

      const parts = text.split(re);
      if(parts.length <= 1) continue;

      const frag = document.createDocumentFragment();
      for(const part of parts){
        if(!part) continue;
        if(keywordSet.has(part.toLowerCase())){
          const strong = document.createElement('strong');
          strong.textContent = part;
          frag.appendChild(strong);
        } else {
          frag.appendChild(document.createTextNode(part));
        }
      }
      node.parentNode?.replaceChild(frag, node);
    }

    return root.innerHTML;
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
    "6585": [
      "Use **428** when the server requires a **precondition** such as `If-Match` to avoid lost updates.",
      "**429** is for client-specific rate/quota limits; **503** is for broader service unavailability.",
      "`Retry-After` can guide retry timing and reduce retry storms.",
      "**431** is about oversized request headers; **511** is about network authentication such as captive portals."
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
    "7301": [
      "**ALPN** lets client and server choose an **application protocol** during the TLS handshake.",
      "**SNI** identifies the target hostname; **ALPN** identifies what protocol to speak after TLS.",
      "If there is no mutually supported protocol, fail explicitly instead of guessing.",
      "ALPN matters in shared 443 deployments, proxies, CDNs, and HTTP/2 or HTTP/3 negotiation."
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
    "9001": [
      "RFC 9001 explains how **TLS 1.3** is carried inside **QUIC**, not as a separate TCP handshake.",
      "QUIC encrypts most transport metadata early, changing what middleboxes can observe.",
      "**0-RTT** keeps replay caveats; only replay-safe operations should use it.",
      "Transport keys, packet protection, and TLS handshake messages interact differently than in TCP + TLS."
    ],
    "9110": [
      "HTTP semantics define what methods/status codes/headers **mean**, independent of framing.",
      "**Idempotency** matters for retries; caching directives impact correctness and privacy.",
      "Status code classes are semantic categories (2xx success, 3xx redirect, 4xx client error, 5xx server error).",
      "Misunderstanding semantics breaks clients, caches, and security assumptions."
    ],
    "9111": [
      "HTTP caching is about **reuse rules**, not just saving bandwidth.",
      "Distinguish **freshness** from **validation**: `max-age` decides when reuse is allowed; validators help recheck.",
      "`no-store`, `no-cache`, `private`, and `public` have different operational and privacy meanings.",
      "Cache mistakes can leak data, serve stale responses, or break consistency."
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
    ],
    "9204": [
      "**QPACK** compresses HTTP/3 headers without reintroducing large cross-stream blocking.",
      "It separates encoder/decoder state onto dedicated streams instead of assuming ordered delivery.",
      "Dynamic table use saves bytes but adds state management and implementation complexity.",
      "Header compression is not just performance work; mistakes can affect memory use and correctness."
    ]
  };

  const RFC_CHEATSHEETS_JA = {
    "2119": [
      "**MUST/SHOULD/MAY** は, 単なる強い言い方ではなく, **normative requirements** を書くときだけ使います.",
      "**MUST** は適合に必須, **SHOULD** は強い推奨だが正当な例外あり, **MAY** は本当に任意です.",
      "**SHOULD** を使うなら, どんな条件なら例外を認めるのかも書くと誤読が減ります.",
      "「状況に応じて」「可能なら」のような曖昧表現より, テスト可能な書き方を優先します."
    ],
    "2818": [
      "**HTTPS** は **HTTP over TLS** です. Base64 や単なる暗号化の別名ではありません.",
      "`https` の既定 port は **443**, `http` は **80** です.",
      "TLS は **confidentiality**, **integrity**, **server authentication** を与えます. ただし certificate validation が前提です.",
      "credential や token を扱う flow では, downgrade や mixed content を避けるため **HTTPS 強制** が重要です."
    ],
    "3552": [
      "良い **Security Considerations** は, asset, attacker, trust boundary, assumption を具体的に書きます.",
      "「TLS を使え」で終わらせず, **何がどう危険か** を説明するのが本筋です.",
      "鍵管理, logging, monitoring, default 設定のような運用現実も security に含めて考えます.",
      "実装者と運用者の両方が読めるように, mitigation と residual risk を残します."
    ],
    "3986": [
      "URI は `scheme://authority/path?query#fragment` のように component ごとに役割が違います.",
      "`#fragment` は **client-side** で使われ, 通常の HTTP request には送られません.",
      "**Percent-encoding** は文脈依存です. delimiter を data として使うときに encode が必要です.",
      "normalization では `scheme` や `host` の lowercasing は比較的安全でも, `path` は安易に変えない方が安全です."
    ],
    "4949": [
      "**authentication** と **authorization**, **threat** と **vulnerability** のような用語は混ぜずに使います.",
      "review や incident では, 用語が揃うだけで意思疎通の事故が大きく減ります.",
      "**confidentiality**, **integrity**, **availability** のどれを損なう話かを分けて考えます.",
      "attacker も, passive observer, active MITM, insider のように具体名で置くと議論しやすくなります."
    ],
    "5077": [
      "session ticket は, server 側状態を ticket に包んで返す **stateless resumption** の仕組みです.",
      "ticket encryption key の rotation を誤ると, 多数 session へ影響するので運用が重要です.",
      "ticket を長く使い回すと, client correlation の足掛かりになり得ます.",
      "resumption は latency 改善には効きますが, TLS 設定そのものの健全性を置き換えるものではありません."
    ],
    "6066": [
      "TLS extension は, protocol version を増やさずに handshake 中の機能交渉を広げる仕組みです.",
      "**SNI** は接続先 hostname を伝え, 正しい certificate や virtual host 選択を助けます.",
      "一方で SNI は ClientHello に hostname を出すため, **privacy** の注意点もあります.",
      "extension は便利ですが, 交渉した結果で security property が変わるので, 有効になった値まで確認します."
    ],
    "6265": [
      "`Set-Cookie` は state を設定し, `Cookie` はそれを request に載せて返します.",
      "**Secure** は HTTPS 限定送信, **HttpOnly** は JS からの読み取りを減らし, XSS 時の盗難抑止に効きます.",
      "**SameSite** は cross-site 送信を絞ることで **CSRF** 軽減に役立ちます.",
      "cookie の `domain` と `path` は, どの request に cookie が付くかを決める重要な scope です."
    ],
    "6585": [
      "**428** は `If-Match` のような **precondition** を必須にして lost update を防ぎたいときに使います.",
      "**429** は client ごとの rate/quota 超過, **503** は service 側の広い availability 問題です.",
      "`Retry-After` を返せると, client は雑な即時再試行ではなく backoff 付きで動けます.",
      "**431** は request header が大きすぎる問題, **511** は captive portal など network authentication の話です."
    ],
    "6455": [
      "WebSocket は最初に **HTTP Upgrade** handshake を行い, その後 protocol を切り替えます.",
      "`ws` は平文, `wss` は **TLS** 上の WebSocket です.",
      "security では origin check, authentication, proxy 越しの正しい取り扱いが重要です.",
      "WebSocket は長寿命 connection なので, timeout, backpressure, message size 上限も設計対象です."
    ],
    "6797": [
      "`Strict-Transport-Security` は browser に **HTTPS only** を覚えさせる仕組みです.",
      "`max-age` は **秒**, `includeSubDomains` は subdomain まで対象, `preload` は preload list 文脈で使います.",
      "HSTS には **初回訪問問題** があり, preload しない限り最初の 1 回は守れません.",
      "導入時は小さい `max-age` から始め, monitoring しながら伸ばすのが安全です."
    ],
    "7239": [
      "`Forwarded` は `for=`, `proto=`, `host=` などの proxy metadata を標準化します.",
      "forwarding header は **trust boundary** をまたぐので, 信頼できる proxy から来たものだけを信用します.",
      "可能なら ad-hoc な `X-Forwarded-*` より標準化された `Forwarded` を優先します.",
      "client IP 判定は spoof されやすいので, proxy chain を前提にした安全な取り扱いが必要です."
    ],
    "7258": [
      "pervasive passive monitoring は, 単なる雑音ではなく **attacker model** として扱います.",
      "identifier, endpoint, traffic pattern のような metadata 漏えいを減らす設計が重要です.",
      "暗号化だけでなく, linkability や correlation を減らす設計も privacy に効きます.",
      "protocol 設計では, privacy と運用性の trade-off を明示しておくとレビューしやすくなります."
    ],
    "7301": [
      "**ALPN** は TLS handshake の中で, その後に話す **application protocol** を決める仕組みです.",
      "**SNI** が hostname を伝えるのに対し, **ALPN** は protocol 名を伝えます. 役割が違います.",
      "共通で使える protocol が無いなら, 勝手に推測せず明示的に失敗させるのが筋です.",
      "shared 443, proxy, CDN, HTTP/2, HTTP/3 の交渉で ALPN の理解が効きます."
    ],
    "7541": [
      "HPACK は HTTP/2 header を static table, dynamic table, Huffman encoding で圧縮します.",
      "圧縮は bytes 削減に効きますが, CRIME/BREACH 系の **side-channel** 発想には注意が必要です.",
      "header table は memory pressure の原因にもなるので, サイズ制御と入力検証が必要です.",
      "indexed representation と literal header の違いを読むと, decoder の挙動を追いやすくなります."
    ],
    "7616": [
      "Digest auth は `nonce`, `realm`, hash-based response を使う challenge/response 方式です.",
      "Basic より複雑で, algorithm, nonce reuse, proxy, 実装差異の落とし穴が多いです.",
      "Digest を使っても TLS や deployment 設計が不要になるわけではありません.",
      "現代では token-based auth を選ぶことが多く, Digest は理由がある場面で使います."
    ],
    "7617": [
      "Basic auth は `Authorization: Basic <base64(user:pass)>` で, Base64 は **暗号化ではありません**.",
      "credential を守るには **TLS** と組み合わせるのが前提です.",
      "credential storage, rotation, rate limiting まで含めて設計しないと brute-force に弱くなります.",
      "charset や encoding の扱いを曖昧にすると, 実装間で認証失敗の原因になります."
    ],
    "7807": [
      "`application/problem+json` は API error を一定の形で返すための共通フォーマットです.",
      "基本 field は `type`, `title`, `status`, `detail`, `instance` です.",
      "安定した `type` URI を使うと, client が programmatic に error を分岐しやすくなります.",
      "詳細を出しすぎると sensitive internals を漏らすので, observability と秘匿のバランスが大事です."
    ],
    "8174": [
      "RFC 8174 は, **BCP 14** の意味が **ALL CAPS** の keyword にだけ適用されることを明確にします.",
      "lowercase の must, should, may は普通の英語として読まれるので, normative meaning を期待しません.",
      "現代的には BCP 14 として RFC 2119, RFC 8174 の両方を参照する書き方が安全です.",
      "normative language が一貫していると, 仕様レビューや testability が上がります."
    ],
    "8441": [
      "HTTP/2 では HTTP/1.1 のような `Upgrade` が使えないため, WebSocket は **extended CONNECT** を使います.",
      "HTTP/2 上の WebSocket でも, origin check や auth, intermediary handling は引き続き重要です.",
      "WebSocket tunnel が stream や frame にどう乗るかを大まかに掴むと理解しやすくなります.",
      "HTTP/2 only の proxy や CDN 環境では, RFC 8441 の理解が実装可否に直結します."
    ],
    "8446": [
      "TLS 1.3 は handshake latency を減らし, 古い insecure 機能を整理した modern TLS です.",
      "**0-RTT** は replay され得るので, idempotent で replay-safe な request に限定します.",
      "handshake は authentication, confidentiality, integrity を与えますが, mode ごとの差は理解が必要です.",
      "full handshake と resumption では得られる性質や運用上の注意が少し変わります."
    ],
    "9000": [
      "QUIC は **UDP** 上の secure で multiplexed な transport で, stream と TLS 1.3 相当の保護を持ちます.",
      "**Connection ID** は address が変わっても connection を続けやすくし, load balancing にも役立ちます.",
      "flow control は receiver 側の **backpressure** で, stream 単位と connection 単位の両方があります.",
      "QUIC は multiplexed stream での TCP 由来の head-of-line blocking を減らします."
    ],
    "9001": [
      "RFC 9001 は, **TLS 1.3** を **QUIC** の中でどう使うかを定義します. TCP 上の通常 TLS とは配置が違います.",
      "QUIC は transport metadata の多くを早い段階で暗号化し, middlebox から見える情報を減らします.",
      "**0-RTT** には replay の注意が残るので, replay-safe な操作だけに使います.",
      "packet protection, transport key, TLS handshake message の関係を分けて捉えるのが理解の近道です."
    ],
    "9110": [
      "HTTP semantics は, framing と無関係に method, status code, header が **何を意味するか** を定義します.",
      "**Idempotency** は retry 設計で重要で, cache directive は correctness と privacy に直結します.",
      "2xx, 3xx, 4xx, 5xx は単なる番号帯ではなく, client が次にどう動くかの意味分類です.",
      "semantics を誤解すると, client, cache, security assumption がまとめて壊れます."
    ],
    "9111": [
      "HTTP caching は bandwidth 節約だけではなく, **いつ再利用できるか** の規則です.",
      "**freshness** と **validation** を分けて考えます. `max-age` は再利用期限, validator は再確認用です.",
      "`no-store`, `no-cache`, `private`, `public` は似て見えても意味も privacy 影響も違います.",
      "cache の誤設定は, stale response, data leak, 一貫性崩れに直結します."
    ],
    "9112": [
      "HTTP/1.1 framing は, header と connection state で message boundary が決まるため繊細です.",
      "`Content-Length`, `Transfer-Encoding: chunked`, connection reuse の読み違いに注意します.",
      "framing の不整合は request smuggling や proxy/cache desync の原因になります.",
      "どの条件で connection を再利用できるか, どこで close すべきかを分けて理解します."
    ],
    "9113": [
      "HTTP/2 は 1 本の connection 上で binary frame と multiplexed stream を使います.",
      "flow control は stream 単位と connection 単位の両方にあり, state machine の理解が重要です.",
      "HPACK や intermediary の存在で, HTTP/1.1 とは違う failure mode が増えます.",
      "prioritization はありますが, 実運用では複雑さもあるため慎重に扱われます."
    ],
    "9114": [
      "HTTP/3 は HTTP semantics を TCP ではなく QUIC stream に載せたものです.",
      "QUIC が loss recovery を担うため, TCP の cross-stream head-of-line blocking を避けやすくなります.",
      "connection migration により, address や load balancing への前提が HTTP/2 と変わります.",
      "HTTP/3 は UDP, observability, firewall の観点で運用上の差分も大きいです."
    ],
    "9204": [
      "**QPACK** は HTTP/3 用の header compression で, 大きな cross-stream blocking を避けながら圧縮します.",
      "ordered delivery を前提にせず, encoder stream と decoder stream を分けて state を運びます.",
      "dynamic table は bytes 削減に効きますが, state 管理と実装複雑性を増やします.",
      "header compression は性能だけでなく, memory usage と decode correctness の問題でもあります."
    ]
  };

  const QUESTION_HINT_CASES = [
    {
      keywords: ['428', 'precondition', 'if-match', 'etag', 'validator', 'conditional request', 'lost update'],
      guideJa: 'ここでは, 更新をそのまま再送してよい場面か, validator を取り直して条件付きで送り直すべき場面かを見分けます.',
      contextJa: 'この問題は, stale な更新をそのまま通すと lost update が起き, retry 設計まで誤るため選んでいます.',
      realJa: 'document 編集, 設定変更 API, admin 画面で, 上書き事故を防ぎながら再送方針を決める場面に直結します.',
      guideEn: 'This asks whether the client should blindly retry the update or first re-fetch a validator and retry conditionally.',
      contextEn: 'This is chosen because stale writes cause lost-update bugs and lead to the wrong retry strategy.',
      realEn: 'This matters for document editing, admin APIs, and any workflow that must avoid overwrite races.'
    },
    {
      keywords: ['429', 'retry-after', 'quota', 'rate limit', 'too many requests', '503', '511', '431', 'request header fields too large', 'network authentication required'],
      guideJa: 'ここでは, failure を「条件不足」「client 単位の制限」「header 肥大化」「network login」のどれとして伝えるべきかを見ます.',
      contextJa: 'この問題は, 追加 status code を使い分けないと client の次の行動が読めない error になってしまうため選んでいます.',
      realJa: 'API gateway, SDK backoff, captive portal, oversized header 対策, on-call 切り分けで重要です.',
      guideEn: 'This asks which kind of failure is being described: missing preconditions, client-specific throttling, oversized headers, or network login.',
      contextEn: 'This is chosen because vague error codes leave clients without a clear next action.',
      realEn: 'This shows up in API gateways, SDK backoff logic, captive portals, and incident triage.'
    },
    {
      keywords: ['must', 'should', 'may', 'optional', 'required', 'recommended', 'shall', 'bcp 14', 'rfc 2119', 'rfc 8174'],
      guideJa: 'ここでは, 規範語が「必須」「原則推奨」「任意」のどれを意味するかを, 例外の扱いで見分けます.',
      contextJa: 'この問題は, 規範語の強さを曖昧にすると仕様が testable でなくなり, 実装者ごとに解釈が割れるため選んでいます.',
      realJa: 'API 契約, protocol spec, 設計レビューで, requirement を曖昧語ではなく規範語で書き分ける場面に直結します.',
      guideEn: 'This asks you to separate “required”, “strongly recommended”, and “optional” by how exceptions are handled.',
      contextEn: 'This is chosen because ambiguous normative language makes a spec hard to test and easy to misread.',
      realEn: 'This matters when writing API contracts, protocol specs, and review comments that need clear requirement levels.'
    },
    {
      keywords: ['https', '443', 'http over tls', 'certificate validation', 'subjectaltname', 'default port'],
      guideJa: 'ここでは, HTTPS が何を守るかと, `https` の既定動作を「なんとなく secure」ではなく説明できるかを見ます.',
      contextJa: 'この問題は, HTTPS の説明を雑にすると port, certificate, mixed content, downgrade の話が一緒になってしまうため選んでいます.',
      realJa: 'reverse proxy, browser behavior, redirect 設計, security review で, HTTPS の前提を短く正確に言う必要があります.',
      guideEn: 'This asks whether you can explain what HTTPS protects and what the `https` scheme implies, not just “it is secure somehow”.',
      contextEn: 'This is chosen because loose HTTPS explanations blur together ports, certificates, mixed content, and downgrade risk.',
      realEn: 'This matters in reverse proxies, browser behavior, redirect design, and security reviews.'
    },
    {
      keywords: ['security considerations', 'threat model', 'asset', 'attacker', 'mitigation', 'residual risk', 'trust boundary'],
      guideJa: 'ここでは, 安全対策の列挙ではなく, asset, attacker, trust boundary, residual risk を枠組みで捉えられるかを見ます.',
      contextJa: 'この問題は, Security Considerations を「TLS を使う」だけで済ませると, 本当に残るリスクが設計に反映されないため選んでいます.',
      realJa: '設計書, ADR, protocol proposal, セキュリティレビューで, 何を守り, 何を諦めるかを言語化するときに使います.',
      guideEn: 'This asks whether you can reason in terms of assets, attackers, trust boundaries, and residual risk instead of listing generic mitigations.',
      contextEn: 'This is chosen because “just use TLS” is not enough to capture the real remaining risk.',
      realEn: 'This matters in design docs, ADRs, protocol proposals, and security reviews.'
    },
    {
      keywords: ['authentication', 'authorization', 'threat', 'vulnerability', 'integrity', 'availability', 'confidentiality'],
      guideJa: 'ここでは, 似た言葉を雰囲気で選ばず, 何を確認する語か, 何を許可する語か, 何が弱点かを切り分けます.',
      contextJa: 'この問題は, 用語の取り違えだけで incident review や設計議論が噛み合わなくなるため選んでいます.',
      realJa: 'セキュリティレビュー, postmortem, 要件定義で, 攻撃, 弱点, 認証, 認可を混同しないための基本です.',
      guideEn: 'This asks you to separate similar terms by role: what verifies identity, what grants permission, and what the weakness actually is.',
      contextEn: 'This is chosen because terminology mix-ups derail reviews and incident discussions.',
      realEn: 'This matters in security reviews, postmortems, and requirements writing.'
    },
    {
      keywords: ['uri', 'authority', 'fragment', 'percent', 'encoding', 'normalize', 'scheme', 'host', 'path', 'query'],
      guideJa: 'ここでは, URI の各 component と delimiter の役割を, 「区切り文字なのか, data として保持したいのか」で読み分けます.',
      contextJa: 'この問題は, URI を文字列として雑に連結/比較すると, redirect, cache key, signature 検証でバグになりやすいため選んでいます.',
      realJa: 'router, signed URL, redirect URI, CDN cache key, auth callback の実装や review で頻出です.',
      guideEn: 'This asks you to separate URI components and delimiters by whether a character is structural syntax or data.',
      contextEn: 'This is chosen because naive URI concatenation and comparison breaks redirects, cache keys, and signature checks.',
      realEn: 'This shows up in routers, signed URLs, redirect URIs, CDN cache keys, and auth callbacks.'
    },
    {
      keywords: ['session ticket', 'resumption', 'ticket', 'key rotation', 'stateless resumption'],
      guideJa: 'ここでは, resumption が「速くする仕組み」である一方, ticket key の運用や追跡可能性も増やすことを見ます.',
      contextJa: 'この問題は, resumption を性能だけで語ると, ticket key 管理や linkability の論点を落としやすいため選んでいます.',
      realJa: 'TLS terminator, CDN, large fleet の鍵運用, latency 改善の設計で重要です.',
      guideEn: 'This asks you to see resumption as both a latency feature and an operational/privacy trade-off.',
      contextEn: 'This is chosen because focusing only on speed hides ticket-key management and linkability concerns.',
      realEn: 'This matters in TLS terminators, CDNs, large fleets, and latency tuning.'
    },
    {
      keywords: ['tls extension', 'sni', 'server_name', 'certificate', 'virtual hosting', 'hostname', 'clienthello'],
      guideJa: 'ここでは, handshake 中に何を知らせているかと, それが certificate 選択や privacy にどう効くかを見ます.',
      contextJa: 'この問題は, SNI を「証明書の中身」と混同すると, multi-tenant 配置や privacy の説明が崩れるため選んでいます.',
      realJa: 'ingress, load balancer, cert 管理, TLS incident の切り分けで, どの hostname 向けに接続しているかを扱う場面で使います.',
      guideEn: 'This asks what information is signaled during the handshake and how it affects certificate selection and privacy.',
      contextEn: 'This is chosen because confusing SNI with certificate contents breaks deployment and privacy reasoning.',
      realEn: 'This matters in ingress, load balancers, certificate management, and TLS incident triage.'
    },
    {
      keywords: ['cookie', 'set-cookie', 'samesite', 'httponly', 'secure', 'csrf', 'domain', 'path'],
      guideJa: 'ここでは, Cookie 属性を「保存できるか」ではなく, どの request に付くか, JS から触れるか, cross-site で送るかで見分けます.',
      contextJa: 'この問題は, Cookie 属性の思い込みが session 漏えい, CSRF, 意図しない送信範囲に直結するため選んでいます.',
      realJa: 'login, session management, BFF, browser security review で毎回出る論点です.',
      guideEn: 'This asks you to map cookie attributes to request scope, JS accessibility, and cross-site behavior.',
      contextEn: 'This is chosen because cookie misconceptions turn directly into session leaks and CSRF bugs.',
      realEn: 'This matters in login flows, session management, BFFs, and browser security reviews.'
    },
    {
      keywords: ['websocket', 'upgrade', 'extended connect', 'connect', 'sec-websocket'],
      guideJa: 'ここでは, WebSocket 開始手順を HTTP version ごとに区別し, tunnel に近いものか, 単なる request/response かを見分けます.',
      contextJa: 'この問題は, `Upgrade` と `CONNECT` を混同すると proxy/CDN 配下で接続が成立しないため選んでいます.',
      realJa: 'browser からの接続, ingress, CDN, corporate proxy 配下での deploy/review で重要です.',
      guideEn: 'This asks you to distinguish the WebSocket bootstrap flow by HTTP version and by whether the mechanism behaves like a tunnel.',
      contextEn: 'This is chosen because mixing up `Upgrade` and `CONNECT` breaks deployments behind proxies and CDNs.',
      realEn: 'This matters for browser connections, ingress, CDNs, and corporate-proxy deployments.'
    },
    {
      keywords: ['strict-transport-security', 'hsts', 'preload', 'includesubdomains', 'max-age'],
      guideJa: 'ここでは, HSTS が「今の request を暗号化する機能」ではなく, browser に将来の HTTPS-only 方針を覚えさせる仕組みだと捉えます.',
      contextJa: 'この問題は, HSTS を redirect と同じだと思うと, first-visit 問題や rollout 手順を見落としやすいため選んでいます.',
      realJa: 'domain 移行, HTTPS 強制, preload 申請, subdomain 運用の設計で重要です.',
      guideEn: 'This asks you to see HSTS as a browser policy memory mechanism, not a way to encrypt the current request.',
      contextEn: 'This is chosen because treating HSTS like a redirect hides the first-visit limitation and rollout concerns.',
      realEn: 'This matters for domain migrations, HTTPS enforcement, preload enrollment, and subdomain policy.'
    },
    {
      keywords: ['forwarded', 'x-forwarded', 'for=', 'proto=', 'host=', 'proxy'],
      guideJa: 'ここでは, proxy が付ける転送情報を「便利な header」ではなく, trust boundary をまたぐ metadata として読みます.',
      contextJa: 'この問題は, forwarding 情報を無条件で信じると client IP や scheme 判定を偽装されるため選んでいます.',
      realJa: 'load balancer, ingress, geo 制御, redirect 生成, audit log で client 情報を復元するときに使います.',
      guideEn: 'This asks you to treat forwarding metadata as trust-boundary-crossing input, not just a handy header.',
      contextEn: 'This is chosen because trusting forwarding data blindly allows spoofed client identity and scheme decisions.',
      realEn: 'This matters for load balancers, ingress, geo logic, redirect generation, and audit logging.'
    },
    {
      keywords: ['pervasive monitoring', 'metadata', 'linkability', 'passive attacker', 'surveillance'],
      guideJa: 'ここでは, payload だけでなく metadata が何を漏らすか, passive attacker が何を学べるかで考えます.',
      contextJa: 'この問題は, 「中身は暗号化しているから十分」で止まると, privacy 設計が甘くなるため選んでいます.',
      realJa: 'protocol design, telemetry 設計, identifier の持ち方, privacy review で判断材料になります.',
      guideEn: 'This asks you to reason about metadata leakage and what a passive attacker can still learn.',
      contextEn: 'This is chosen because encrypted payloads alone do not guarantee good privacy design.',
      realEn: 'This matters in protocol design, telemetry, identifier choices, and privacy reviews.'
    },
    {
      keywords: ['hpack', 'qpack', 'dynamic table', 'header compression', 'blocked stream', 'encoder', 'decoder', 'insert count'],
      guideJa: 'ここでは, header compression を「ただの圧縮」ではなく, state 同期, memory 制約, block の発生条件まで含めて考えます.',
      contextJa: 'この問題は, compression state の共有条件を誤ると decode failure や性能劣化が transport bug に見えてしまうため選んでいます.',
      realJa: 'browser, CDN, reverse proxy, HTTP library の tuning, incident 切り分けで役立ちます.',
      guideEn: 'This asks you to see header compression as shared state with memory limits and blocking behavior, not just byte savings.',
      contextEn: 'This is chosen because compression-state mistakes often masquerade as transport bugs or performance issues.',
      realEn: 'This matters for browsers, CDNs, reverse proxies, HTTP libraries, and incident triage.'
    },
    {
      keywords: ['basic', 'digest', 'nonce', 'realm', 'base64'],
      guideJa: 'ここでは, 認証 scheme の違いを「暗号化の有無」で雑に見るのではなく, 何が wire に乗り, 何を TLS が補うかで比べます.',
      contextJa: 'この問題は, Base64 や Digest の説明を誤ると, credential 保護や migration の判断を誤るため選んでいます.',
      realJa: 'legacy API, proxy auth, internal tool の認証見直し, security review で出てきます.',
      guideEn: 'This asks you to compare auth schemes by what is sent on the wire and what TLS must still provide.',
      contextEn: 'This is chosen because misunderstanding Base64 or Digest leads to bad credential-protection decisions.',
      realEn: 'This matters in legacy APIs, proxy auth, internal tools, and security reviews.'
    },
    {
      keywords: ['problem+json', 'application/problem+json', 'detail', 'instance', 'title', 'status'],
      guideJa: 'ここでは, API error を「文字列メッセージ」ではなく, client が機械的に扱える field の組み合わせとして見ます.',
      contextJa: 'この問題は, error schema が揺れると SDK, UI, observability の全部が brittle になるため選んでいます.',
      realJa: 'API contract, SDK 実装, monitoring, support tooling で一貫した error model を作るときに使います.',
      guideEn: 'This asks you to treat API errors as structured fields clients can reason about, not just free-form strings.',
      contextEn: 'This is chosen because inconsistent error schemas make SDKs, UIs, and observability brittle.',
      realEn: 'This matters when designing API contracts, SDKs, monitoring, and support tooling.'
    },
    {
      keywords: ['0-rtt', 'tls 1.3', 'early data', 'handshake', 'replay'],
      guideJa: 'ここでは, TLS 1.3 の速さと安全性の trade-off を, 特に 0-RTT の replay 安全性で見ます.',
      contextJa: 'この問題は, 0-RTT を「速いから使う」だけで決めると, replay に弱い操作まで早送りしてしまうため選んでいます.',
      realJa: 'login shortcut, idempotent GET, edge TLS termination, performance tuning で判断が必要です.',
      guideEn: 'This asks you to weigh TLS 1.3 latency benefits against replay safety, especially for 0-RTT.',
      contextEn: 'This is chosen because “it is faster” is not enough when early data can be replayed.',
      realEn: 'This matters for login shortcuts, idempotent GETs, edge TLS termination, and performance tuning.'
    },
    {
      keywords: ['alpn', 'protocol selection', 'h2', 'http/1.1', 'tls handshake'],
      guideJa: 'ここでは, TLS の中で「どの protocol を話すか」を合意する役割を, 名前解決や certificate 選択と分けて考えます.',
      contextJa: 'この問題は, protocol mismatch の障害を certificate 問題と混同しやすいため選んでいます.',
      realJa: 'ingress, CDN, TLS terminator, multi-protocol service の review で使います.',
      guideEn: 'This asks you to separate protocol selection inside TLS from naming and certificate-selection concerns.',
      contextEn: 'This is chosen because protocol mismatches are often misdiagnosed as certificate problems.',
      realEn: 'This matters in ingress, CDNs, TLS terminators, and multi-protocol service reviews.'
    },
    {
      keywords: ['quic', 'connection id', 'flow control', 'stream', 'udp', 'transport parameter', 'http/3'],
      guideJa: 'ここでは, QUIC の機能を「TLS がやること」「transport がやること」「HTTP/3 がやること」に分けて考えます.',
      contextJa: 'この問題は, QUIC の責務境界を混同すると, incident の切り分けや interop の説明が難しくなるため選んでいます.',
      realJa: 'browser/server interop, load balancer, mobile network, observability 設計で役立ちます.',
      guideEn: 'This asks you to separate what TLS, QUIC transport, and HTTP/3 each own.',
      contextEn: 'This is chosen because blurred responsibility boundaries make incidents and interop much harder to explain.',
      realEn: 'This matters in browser/server interop, load balancers, mobile networks, and observability.'
    },
    {
      keywords: ['cache-control', 'cache', 'etag', 'vary', 'stale', 'fresh', 'no-store', 'no-cache', 'revalidate', 'private', 'public', 'age', '304', 'conditional get', 'last-modified'],
      guideJa: 'ここでは, cache policy を「保存してよいか」「そのまま再利用してよいか」「誰の cache に効くか」の3つに分けて読みます.',
      contextJa: 'この問題は, cache directive を1つの「速くする設定」として扱うと, stale 配信や private data の漏えいに直結するため選んでいます.',
      realJa: 'CDN, browser cache, dashboard, catalog API, personalization の設計で何度も出てきます.',
      guideEn: 'This asks you to split cache policy into storage, reuse without validation, and which caches are affected.',
      contextEn: 'This is chosen because treating cache directives as generic “speed knobs” causes stale data and privacy bugs.',
      realEn: 'This matters in CDNs, browser caches, dashboards, catalog APIs, and personalization.'
    },
    {
      keywords: ['safe', 'idempotent', 'status code', 'status class', 'representation', 'content-type', 'accept', 'method', 'semantics'],
      guideJa: 'ここでは, HTTP の意味を transport/framing と切り分け, method, status, header が client の行動にどう影響するかを見ます.',
      contextJa: 'この問題は, semantics を wire 形式と混同すると retry, cache, compatibility の判断を誤るため選んでいます.',
      realJa: 'API design, SDK retry, browser behavior, reverse proxy review で基本になります.',
      guideEn: 'This asks you to separate HTTP meaning from framing and transport, then reason about how methods, status codes, and headers shape client behavior.',
      contextEn: 'This is chosen because confusing semantics with wire format breaks retry, cache, and compatibility decisions.',
      realEn: 'This matters in API design, SDK retry logic, browser behavior, and reverse proxy reviews.'
    },
    {
      keywords: ['content-length', 'transfer-encoding', 'chunked', 'request smuggling', 'message body', 'connection reuse'],
      guideJa: 'ここでは, HTTP/1.1 の message 境界を, body の中身ではなく framing rule で決める点を見ます.',
      contextJa: 'この問題は, framing の誤解が request smuggling や proxy desync に直結するため選んでいます.',
      realJa: 'reverse proxy, WAF, legacy service, security review で重要です.',
      guideEn: 'This asks you to reason about message boundaries using framing rules, not body content.',
      contextEn: 'This is chosen because framing mistakes lead directly to request smuggling and proxy desync.',
      realEn: 'This matters in reverse proxies, WAFs, legacy services, and security reviews.'
    },
    {
      keywords: ['goaway', 'stream state', 'prioritization', 'frame', 'settings', 'http/2'],
      guideJa: 'ここでは, HTTP/2 を「1本の接続に多重化された stream の集まり」として捉え, frame と stream state の違いを見ます.',
      contextJa: 'この問題は, stream 単位の制御と connection 全体の制御を混同すると, shutdown や backpressure の挙動を誤るため選んでいます.',
      realJa: 'browser/server interop, gRPC, proxy tuning, incident review で頻出です.',
      guideEn: 'This asks you to view HTTP/2 as multiplexed streams on one connection and distinguish frames from stream state.',
      contextEn: 'This is chosen because mixing stream-level and connection-level control breaks shutdown and backpressure reasoning.',
      realEn: 'This matters in browser/server interop, gRPC, proxy tuning, and incident reviews.'
    }
  ];

  function includesAny(text, keywords){
    const haystack = String(text || '').toLowerCase();
    return (keywords || []).some(keyword => haystack.includes(String(keyword || '').toLowerCase()));
  }

  function getQuestionProfile(q){
    const settings = window.DRILL_SETTINGS || {};
    const titleRaw = cleanLabelText(q.querySelector('h4')?.textContent || '');
    const type = String(q.dataset.type || '').toLowerCase();
    const choiceTexts = [];
    q.querySelectorAll('.choices label').forEach(label => {
      if(!(label instanceof HTMLElement)) return;
      const full = readableChoiceLabel(label);
      const text = full.replace(/^[A-Z]\.\s*/, '').trim();
      if(text) choiceTexts.push(text);
    });

    return {
      q,
      rfc: getRfcNumber(),
      type,
      titleRaw,
      title: titleRaw.toLowerCase(),
      subtitle: String(settings.SKILL_SUBTITLE || '').trim(),
      goal: String(settings.GOAL_DESCRIPTION || '').trim(),
      choiceTexts,
      blob: [
        titleRaw,
        ...choiceTexts,
        String(settings.SKILL_NAME || ''),
        String(settings.SKILL_SUBTITLE || ''),
        String(settings.GOAL_DESCRIPTION || '')
      ].join(' ').toLowerCase()
    };
  }

  function findQuestionHintCase(profile){
    return QUESTION_HINT_CASES.find(entry => {
      if(entry.rfc && String(entry.rfc) !== String(profile.rfc)) return false;
      return includesAny(profile.blob, entry.keywords);
    }) || null;
  }

  function getLocalizedHintText(entry, key){
    if(!entry) return '';
    const localeKey = locale.startsWith('ja') ? key + 'Ja' : key + 'En';
    return String(entry[localeKey] || '').trim();
  }

  function truncateHintLabel(text, max=34){
    const clean = cleanLabelText(text || '');
    if(clean.length <= max) return clean;
    return clean.slice(0, Math.max(0, max - 1)).trim() + '…';
  }

  function getQuestionChoices(profile){
    const answer = String(profile.q?.dataset?.answer || '').trim();
    const correctValues = new Set(answer.split(',').map(s => s.trim()).filter(Boolean));
    const choices = [];
    profile.q?.querySelectorAll('.choices input').forEach(input => {
      if(!(input instanceof HTMLInputElement)) return;
      const label = input.closest('label');
      const full = cleanLabelText(label?.textContent || '');
      const text = full.replace(/^[A-Z]\.\s*/, '').trim();
      choices.push({
        value: String(input.value || '').trim(),
        text,
        correct: correctValues.has(String(input.value || '').trim())
      });
    });
    return choices;
  }

  function formatCodeList(items, localeCode){
    const parts = (items || []).map(s => String(s || '').trim()).filter(Boolean);
    if(!parts.length) return '';
    const coded = parts.map(p => '`' + escapeHtml(p) + '`');
    if(parts.length === 1) return coded[0];
    if(parts.length === 2){
      return localeCode.startsWith('ja')
        ? coded[0] + ' と ' + coded[1]
        : coded[0] + ' and ' + coded[1];
    }
    const last = coded.pop();
    return localeCode.startsWith('ja')
      ? coded.join(', ') + ' など' + ' (' + last + ' を含む)'
      : coded.join(', ') + ', including ' + last;
  }

  function inferQuestionFocus(profile){
    const blob = profile.blob;
    if(blob.includes('header')){
      return locale.startsWith('ja')
        ? 'どの header が request / response のどちらで使われ, 何を運ぶか'
        : 'which header is used on the request vs response side, and what it carries';
    }
    if(blob.includes('parameter')){
      return locale.startsWith('ja')
        ? 'どの parameter が何を識別し, どこまで意味を持つか'
        : 'which parameter identifies what, and what semantic role it plays';
    }
    if(blob.includes('directive')){
      return locale.startsWith('ja')
        ? 'どの directive が期間, 範囲, あるいは再利用条件を変えるか'
        : 'which directive changes duration, scope, or reuse behavior';
    }
    if(blob.includes('status code') || /\b401\b|\b403\b|\b429\b|\b503\b/.test(blob)){
      return locale.startsWith('ja')
        ? 'どの status code が client の次の行動を一番正確に決めるか'
        : 'which status code most precisely tells the client what to do next';
    }
    if(blob.includes('scheme')){
      return locale.startsWith('ja')
        ? 'どの scheme が transport や security expectation を表しているか'
        : 'which scheme implies the transport and security expectation';
    }
    if(blob.includes('attribute')){
      return locale.startsWith('ja')
        ? 'どの attribute が送信条件, JS からの見え方, cross-site 挙動を変えるか'
        : 'which attribute changes send conditions, JS visibility, or cross-site behavior';
    }
    if(blob.includes('member')){
      return locale.startsWith('ja')
        ? 'どの member が summary, detail, identifier のどれを担うか'
        : 'which member carries the summary, detail, or identifier role';
    }
    if(blob.includes('method')){
      return locale.startsWith('ja')
        ? 'どの method が接続開始や意味づけの中心になるか'
        : 'which method is central to bootstrapping or semantics';
    }
    if(blob.includes('port')){
      return locale.startsWith('ja')
        ? 'どの port が既定値で, 何を前提に解釈されるか'
        : 'which port is the default and what interpretation it implies';
    }
    if(blob.includes('nonce') || blob.includes('token') || blob.includes('validator')){
      return locale.startsWith('ja')
        ? 'どの token / value が freshness や識別に効くか'
        : 'which token or value drives freshness or identification';
    }
    return locale.startsWith('ja')
      ? 'どの選択肢が定義に合い, どれが近いが別概念か'
      : 'which option matches the definition, and which ones are close but different';
  }

  function inferTextQuestionGuide(profile){
    const title = profile.title;
    if(locale.startsWith('ja')){
      if(title.includes('header')){
        return 'ここでは, 略称ではなく **正確な header 名** をそのまま思い出し, request / response のどちらで使うかも結び付けます.';
      }
      if(title.includes('parameter')){
        return 'ここでは, **parameter 名** を token 単位で正確に思い出し, 何を表す値かまで結び付けます.';
      }
      if(title.includes('directive')){
        return 'ここでは, **directive 名** をそのまま再現し, どの範囲や期間へ効くかを結び付けます.';
      }
      if(title.includes('member')){
        return 'ここでは, **member 名** を summary / detail / identifier の役割とセットで思い出します.';
      }
      return 'ここでは, RFC が使う **正式な token 名** を, 略称ではなくそのまま思い出せるかを見ます.';
    }

    if(title.includes('header')){
      return 'Recall the exact **header name**, not an approximation, and tie it to the request/response direction.';
    }
    if(title.includes('parameter')){
      return 'Recall the exact **parameter token** and what it represents.';
    }
    if(title.includes('directive')){
      return 'Recall the exact **directive token** and the scope or duration it controls.';
    }
    if(title.includes('member')){
      return 'Recall the exact **member name** and the role it plays in the object.';
    }
    return 'Recall the exact **RFC token name**, not just the concept it refers to.';
  }

  function buildSpecificQuestionGuide(profile){
    if(profile.type === 'text'){
      return inferTextQuestionGuide(profile);
    }

    const choices = getQuestionChoices(profile)
      .map(c => truncateHintLabel(c.text))
      .filter(Boolean)
      .slice(0, 3);
    const optionList = formatCodeList(choices, locale);
    const focus = inferQuestionFocus(profile);

    if(locale.startsWith('ja')){
      if(profile.type === 'ms' && optionList){
        return 'ここでは, ' + focus + 'を, ' + optionList + ' の違いで見ます. 複数選択でも **1つずつ独立に判定** して残します.';
      }
      if(optionList){
        return 'ここでは, ' + focus + 'を, ' + optionList + ' の役割差で見ます.';
      }
      return 'ここでは, ' + focus + 'を見ます.';
    }

    if(profile.type === 'ms' && optionList){
      return 'Focus on ' + focus + ', comparing ' + optionList + '. Even for multi-select, judge each choice independently.';
    }
    if(optionList){
      return 'Focus on ' + focus + ', comparing ' + optionList + '.';
    }
    return 'Focus on ' + focus + '.';
  }

  function buildFallbackQuestionGuide(profile){
    if(locale.startsWith('ja')){
      if(profile.type === 'ms'){
        return 'ここでは, 各選択肢を独立に true/false 判定し, 「それっぽい」ではなく条件に合うものだけを残します.';
      }
      if(profile.type === 'text'){
        return 'ここでは, RFC が使う正式な用語や header 名を, 役割とセットで思い出せるかを見ます.';
      }
      if(profile.subtitle){
        return 'ここでは, ' + escapeHtml(profile.subtitle) + ' の中で問われている役割や条件を, 近い語と混同せずに選べるかを見ます.';
      }
      return 'ここでは, 問われている語の意味と役割を, 似た選択肢と切り分けて考えます.';
    }

    if(profile.type === 'ms'){
      return 'Treat each choice as its own true/false statement and keep only the ones that satisfy the condition.';
    }
    if(profile.type === 'text'){
      return 'Answer with the exact RFC term or header name, tied to the role it plays.';
    }
    if(profile.subtitle){
      return 'Focus on the role or condition being tested inside ' + escapeHtml(profile.subtitle) + ', not just what sounds familiar.';
    }
    return 'Focus on the meaning and role being tested, not just the closest-sounding term.';
  }

  function buildFallbackContext(profile){
    if(locale.startsWith('ja')){
      if(profile.goal){
        return 'この問題は, ' + escapeHtml(profile.goal) + 'ための前提概念を, 実装やレビューの言葉で説明できるようにするため選んでいます.';
      }
      if(profile.subtitle){
        return 'この問題は, ' + escapeHtml(profile.subtitle) + ' の中核概念を, 実装やレビューで言い換えられるようにするため選んでいます.';
      }
      return 'この問題は, 取り違えやすい定義を, 実装やレビューで説明できる形にするため選んでいます.';
    }

    if(profile.goal){
      return 'This question is chosen to reinforce a prerequisite concept behind ' + escapeHtml(profile.goal) + ' so you can explain it during implementation and review.';
    }
    if(profile.subtitle){
      return 'This question is chosen to reinforce a core idea in ' + escapeHtml(profile.subtitle) + ' so you can restate it clearly during implementation and review.';
    }
    return 'This question is chosen to reinforce a definition that is easy to mix up in real implementation and review work.';
  }

  function buildFallbackRealWorld(profile){
    if(locale.startsWith('ja')){
      if(profile.goal){
        return '設計レビュー, 実装, 障害切り分けで, ' + escapeHtml(profile.goal) + '必要がある場面で役立ちます.';
      }
      if(profile.subtitle){
        return escapeHtml(profile.subtitle) + ' を前提に判断する設計レビューや実装で役立ちます.';
      }
      return '実務では, 仕様を読み, 実装を比較し, 障害を切り分ける場面で役立ちます.';
    }

    if(profile.goal){
      return 'This helps in design reviews, implementation work, and incident triage when you need to ' + escapeHtml(profile.goal) + '.';
    }
    if(profile.subtitle){
      return 'This shows up in implementation and review work that depends on understanding ' + escapeHtml(profile.subtitle) + '.';
    }
    return 'This shows up when reading specs, reviewing implementations, and triaging incidents.';
  }

  function buildQuestionGuideLine(q){
    const profile = getQuestionProfile(q);
    const specific = buildSpecificQuestionGuide(profile);
    if(specific) return specific;
    const match = findQuestionHintCase(profile);
    return getLocalizedHintText(match, 'guide') || buildFallbackQuestionGuide(profile);
  }

  function buildRealWorldText(q){
    const profile = getQuestionProfile(q);
    const match = findQuestionHintCase(profile);
    return getLocalizedHintText(match, 'real') || buildFallbackRealWorld(profile);
  }

  function injectQuestionGuides(){
    $$('#questions .q').forEach(q => {
      if(!(q instanceof HTMLElement)) return;
      if(q.querySelector('.question-guide')) return;

      const body = q.querySelector('.body');
      if(!(body instanceof HTMLElement)) return;

      const text = buildQuestionGuideLine(q);
      if(!text) return;

      const p = document.createElement('p');
      p.className = 'question-guide';
      const label = locale.startsWith('ja') ? '<strong>見分けるポイント:</strong> ' : '<strong>What to compare:</strong> ';
      p.innerHTML = normalizeExplainHtml(label + text);

      const anchor = body.querySelector('.choices, input[type="text"], input[type="search"], textarea');
      if(anchor instanceof HTMLElement){
        anchor.insertAdjacentElement('beforebegin', p);
      } else {
        body.prepend(p);
      }
    });
  }

  function inferQuestionTerms(q){
    const terms = new Set();
    const title = q.querySelector('h4')?.textContent || '';

    const optionTexts = [];
    q.querySelectorAll('.choices label').forEach(label => {
      if(!(label instanceof HTMLElement)) return;
      optionTexts.push(readableChoiceLabel(label));
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
    const profile = getQuestionProfile(q);
    const match = findQuestionHintCase(profile);
    const text = getLocalizedHintText(match, 'context') || buildFallbackContext(profile);
    return locale.startsWith('ja')
      ? '<strong>問題を出した背景:</strong> ' + text
      : '<strong>Context (why chosen):</strong> ' + text;
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
        ? "設問の定義/要件に合致します。"
        : (isRfcDrill()
          ? "This aligns with the RFC-defined requirement/definition for this concept."
          : "This matches the definition/requirement asked by the question.");
    }

    if(correctSummary){
      return locale.startsWith('ja')
        ? "正解の要点（" + correctSummary + "）と矛盾します。"
        : "This contradicts the key point: " + correctSummary;
    }

    return locale.startsWith('ja')
      ? "設問で問われている定義/要件と一致しません。"
      : (isRfcDrill()
        ? "This does not match the RFC-defined behavior/definition."
        : "This does not match what the question is asking for.");
  }

  function ensureRealWorldSection(q, html){
    const lines = String(html || '').split('\n');
    const hasRealWorld = lines.some(l => /<strong>(?:Real-world usage|実務での機会):<\/strong>/i.test(l));
    if(hasRealWorld) return html;

    const heading = locale.startsWith('ja')
      ? '<strong>実務での機会:</strong>'
      : '<strong>Real-world usage:</strong>';
    const text = buildRealWorldText(q);

    const insertAfter = lines.findIndex(l => /<strong>(?:Context \(why chosen\)|背景（なぜこの問題）|問題を出した背景):<\/strong>/i.test(l));
    const at = insertAfter >= 0 ? insertAfter + 1 : 1;
    lines.splice(at, 0, '', heading + ' ' + text);
    return lines.join('\n').trim();
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
      const present = new Set();
      choices.forEach(c => {
        if(!c.letter) return;
        if(new RegExp('\\b' + c.letter + '\\s*\\(', 'i').test(String(html || ''))){
          present.add(c.letter);
        }
      });
      const alreadyHasPerOption = present.size >= Math.min(choices.length, 2);
      if(alreadyHasPerOption && present.size === choices.length) return html;

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

      const hasContext = lines.some(l => /<strong>(?:Context \(why chosen\)|背景（なぜこの問題）|問題を出した背景):<\/strong>/i.test(l));
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
          const ctxIdx = lines.findIndex(l => /<strong>(?:Context \(why chosen\)|背景（なぜこの問題）|問題を出した背景):<\/strong>/i.test(l));
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

    const heading = locale.startsWith('ja') ? '<strong>関連:</strong>' : '<strong>Related:</strong>';

    if(!refs.length){
      const bullets = locale.startsWith('ja')
        ? ['- Scope / チートシート（このページ上部）', '- もう一度、問題文を自分の言葉で言い換える']
        : ['- Scope / cheat sheet (top of this page)', '- Restate the question in your own words'];
      const block = [heading, ...bullets].join('\n');
      return String(html || '').trim() + '\n\n' + block;
    }
    const bullets = refs.slice(0, 3).map(r => '- ' + '<a href="' + escapeHtml(r.href) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(r.text) + '</a>');
    const block = [heading, ...bullets].join('\n');

    return String(html || '').trim() + '\n\n' + block;
  }

	function enrichExplain(q, html){
    let out = ensureContextAndTerms(q, html);
	  out = ensureRealWorldSection(q, out);
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
	    const label = locale.startsWith('ja') ? 'RFCクイズ一覧' : 'RFC quizzes';
	    p.innerHTML = '↩ <a href="' + escapeHtml(hubHref) + '">' + escapeHtml(label) + '</a>';

    const refsList = scope.querySelector('ul');
    if(refsList && refsList.parentElement === scope){
      refsList.insertAdjacentElement('afterend', p);
    } else {
      scope.appendChild(p);
    }
  }

  function getLocalizedRfcCheatSheetBullets(rfc){
    if(!rfc) return [];
    if(locale.startsWith('ja')){
      const jaBullets = RFC_CHEATSHEETS_JA[rfc];
      if(Array.isArray(jaBullets) && jaBullets.length) return jaBullets;
    }
    const bullets = RFC_CHEATSHEETS[rfc];
    return Array.isArray(bullets) ? bullets : [];
  }

  function injectRfcCheatSheet(){
    if(!isRfcDrill()) return;
    if(document.querySelector('details.cheatsheet')) return;

    const rfc = getRfcNumber();
    const bullets = getLocalizedRfcCheatSheetBullets(rfc);
    if(!bullets || !bullets.length) return;

    const scope = document.querySelector('section.scope');
    if(!(scope instanceof HTMLElement)) return;

    const details = document.createElement('details');
    details.className = 'cheatsheet card';
    details.open = !!locale.startsWith('ja');

    const summary = document.createElement('summary');
    summary.textContent = locale.startsWith('ja')
      ? '先に押さえる要点'
      : 'Cheat Sheet (RFC quick notes)';
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

  function buildQuestionTypeStudyTip(){
    const types = new Set();
    $$('#questions .q').forEach(q => {
      if(!(q instanceof HTMLElement)) return;
      const type = String(q.dataset.type || '').toLowerCase();
      if(type) types.add(type);
    });

    const tips = [];
    if(types.has('mc')){
      tips.push(locale.startsWith('ja')
        ? '`Multiple Choice` は, 1 つだけ当てるというより, 選択肢同士の違いを 1 文で説明できるかを意識すると定着しやすいです.'
        : 'For `Multiple Choice`, focus on explaining why the best option is different from the others instead of only hunting for the right letter.');
    }
    if(types.has('ms')){
      tips.push(locale.startsWith('ja')
        ? '`Multi-Select` は, 各選択肢を個別に true/false 判定すると迷いにくいです.'
        : 'For `Multi-Select`, treat each option as its own true/false check instead of trying to guess the final combination first.');
    }
    if(types.has('text')){
      tips.push(locale.startsWith('ja')
        ? '`Short Text` は, 解説内で太字になっている用語名を, 正確な呼び方で言い直せるかを確認します.'
        : 'For `Short Text`, check whether you can restate the key term exactly as it appears in the explanation.');
    }
    return tips;
  }

  function injectStudyPath(){
    if(!isRfcDrill()) return;
    if(document.querySelector('.study-path')) return;

    const scope = document.querySelector('section.scope');
    if(!(scope instanceof HTMLElement)) return;

    const settings = window.DRILL_SETTINGS || {};
    const topic = String(settings.SKILL_SUBTITLE || settings.SKILL_NAME || '').trim();
    const keywords = inferKeywordsFromQuiz().slice(0, 4);
    const keywordText = keywords.length ? keywords.join(', ') : '';
    const typeTips = buildQuestionTypeStudyTip();

    const section = document.createElement('section');
    section.className = 'study-path card';

    const title = document.createElement('h3');
    title.textContent = locale.startsWith('ja') ? '初心者向けの見方' : 'How To Study This';
    section.appendChild(title);

    const intro = document.createElement('p');
    intro.className = 'muted';
    intro.innerHTML = locale.startsWith('ja')
      ? normalizeExplainHtml('このページは **暗記** よりも, **用語の境界**, **責務の違い**, **failure の意味** を掴むためのドリルです' + (topic ? '. まずは **' + escapeHtml(topic) + '** が何を決める RFC なのかを大づかみにします.' : '.'))
      : normalizeExplainHtml('Use this page to learn the boundaries between terms, responsibilities, and failure modes rather than to memorize isolated facts.');
    section.appendChild(intro);

    const ul = document.createElement('ul');
    const bullets = locale.startsWith('ja')
      ? [
          '最初に `狙い`, `先に押さえる要点`, `重要キーワード` を読み, この RFC がどの層の何を決める文書かを先に把握します.',
          keywordText ? '**' + escapeHtml(keywordText) + '** が何を指す語かを先に押さえると, 各問題の比較軸が見えやすくなります.' : 'わからない単語が出たら, まず解説の **用語** と **関連** を見て, その語がどの役割を持つかを確認します.',
          '答え合わせでは, 正解理由だけでなく, 誤答がなぜ違うかまで読み切ると, 似た言葉の混同を防げます.',
          '`Learning Mode` と `回答直後に解説` をオンのまま 1 周して, 2 周目に自力で言い換えられるか試すと定着しやすいです.'
        ]
      : [
          'Start with the goal, cheat sheet, and keywords so you know which layer or responsibility this RFC is about before answering.',
          keywordText ? 'Anchor yourself on **' + escapeHtml(keywordText) + '** first so each question has a clearer comparison point.' : 'When a term is unfamiliar, use the explanation and related notes as your glossary before worrying about the score.',
          'Read why the wrong options are wrong, not just why the correct one is right.',
          'A good first pass is to keep Learning Mode on, read the explanation immediately, and only test yourself on the second pass.'
        ];
    bullets.concat(typeTips).forEach(text => {
      const li = document.createElement('li');
      li.innerHTML = normalizeExplainHtml(text);
      ul.appendChild(li);
    });
    section.appendChild(ul);

    const anchor = document.querySelector('details.cheatsheet') || scope;
    anchor.insertAdjacentElement('afterend', section);
  }

  function injectSkipLink(){
    if(document.querySelector('.skip-link')) return;
    const anchorTarget = document.getElementById('questions');
    if(!anchorTarget) return;
    const skip = document.createElement('a');
    skip.className = 'skip-link';
    skip.href = '#questions';
    skip.textContent = UI_TEXT.skipToQuestions;
    document.body.insertAdjacentElement('afterbegin', skip);
  }

  function ensureProgressCard(){
    if(document.getElementById('quizProgress')) return;
    const anchor = document.querySelector('section.panel') || document.getElementById('questions');
    if(!(anchor instanceof HTMLElement)) return;

    const card = document.createElement('section');
    card.id = 'quizProgress';
    card.className = 'quiz-progress card';
    card.innerHTML =
      '<div class="progress-top">' +
        '<div>' +
          '<h3>' + escapeHtml(UI_TEXT.progressTitle) + '</h3>' +
          '<p class="muted">' + escapeHtml(UI_TEXT.progressIntro) + '</p>' +
        '</div>' +
        '<span class="badge" id="progressBadge">0%</span>' +
      '</div>' +
      '<div class="progress-track" aria-hidden="true"><div class="progress-fill" id="progressFill"></div></div>' +
      '<div class="progress-metrics">' +
        '<div class="progress-metric"><strong id="progressAnsweredValue">0 / 0</strong><span>' + escapeHtml(UI_TEXT.progressAnswered) + '</span></div>' +
        '<div class="progress-metric"><strong id="progressCorrectValue">0</strong><span>' + escapeHtml(UI_TEXT.progressCorrect) + '</span></div>' +
        '<div class="progress-metric"><strong id="progressRemainingValue">0</strong><span>' + escapeHtml(UI_TEXT.progressRemaining) + '</span></div>' +
      '</div>';

    anchor.insertAdjacentElement('afterend', card);
  }

  function updateQuestionStates(){
    $$('#questions .q').forEach(q => {
      if(!(q instanceof HTMLElement)) return;
      const answered = isAnswered(q);
      const result = evaluateQuestion(q);
      q.dataset.state = answered
        ? (result.ok === true ? 'correct' : result.ok === false ? 'incorrect' : 'answered')
        : 'unanswered';
    });
  }

  function updateProgressCard(score){
    const s = score || computeLiveScore();
    const pct = s.total ? Math.round((s.answered / s.total) * 100) : 0;
    const remaining = Math.max(0, s.total - s.answered);
    const badge = document.getElementById('progressBadge');
    const fill = document.getElementById('progressFill');
    const answered = document.getElementById('progressAnsweredValue');
    const correct = document.getElementById('progressCorrectValue');
    const remainingEl = document.getElementById('progressRemainingValue');
    if(badge) badge.textContent = pct + '%';
    if(fill) fill.style.width = pct + '%';
    if(answered) answered.textContent = s.answered + ' / ' + s.total;
    if(correct) correct.textContent = String(s.correct);
    if(remainingEl) remainingEl.textContent = String(remaining);
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
    $$('#questions .q').forEach(q => {
      if(!(q instanceof HTMLElement)) return;
      const exp = q.querySelector('.explain');
      if(!(exp instanceof HTMLElement)) return;

      let out = normalizeExplainHtml(exp.innerHTML);
	    out = enrichExplain(q, out);
	    out = normalizeExplainHtml(out);
	    const terms = extractTermsFromExplainHtml(out);
	    const inferred = terms.length ? terms : inferQuestionTerms(q);
	    const keywords = uniqueKeywords([
	      ...getDefaultImportantKeywords(),
	      ...inferred
	    ]);
	    out = boldifyKeywordsInHtml(out, keywords);
	    out = normalizeExplainHtml(out);
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
      const level=mapDifficulty(q);
      const badge=document.createElement('span');
      badge.className='difficulty-badge level-' + String(level || '').toLowerCase();
      badge.textContent=level;
      badge.setAttribute('title','Difficulty');
      type.append(' ');
      type.appendChild(badge);
    });
  }

  function isAnswered(q){const t=q.dataset.type; if(t==='mc') return !!q.querySelector('input[type=radio]:checked'); if(t==='ms') return q.querySelectorAll('input[type=checkbox]:checked').length>0; if(t==='text'){const v=q.querySelector('input[type=text]')?.value.trim(); return !!v;} return false;}

  function cleanLabelText(text){ return (text||'').replace(/\s+/g,' ').trim(); }
  function readableChoiceLabel(label){ if(!label) return ''; return cleanLabelText(label.querySelector('.choice-main')?.textContent || label.dataset.choiceBase || label.textContent); }
  function describeChoiceList(q,values){ if(!values||!values.length) return ''; const map=v=>{const input=q.querySelector('input[value="'+CSS.escape(v)+'"]'); const label=input?.closest('label'); return label?readableChoiceLabel(label):v; }; return values.map(map).join(', '); }
  function describeChoiceLabel(q,value){ return describeChoiceList(q,[value]); }

  function evaluateQuestion(q){const id=q.dataset.id; const type=q.dataset.type; const ans=(q.dataset.answer||'').trim(); let ok=null,user=null; if(type==='mc'){const p=q.querySelector('input[type=radio]:checked'); if(!p){ok=null;} else {user=p.value; ok=(user===ans);} } else if(type==='ms'){const picked=q.querySelectorAll('input[type=checkbox]:checked'); user=Array.from(picked).map(i=>i.value).sort(); if(!user.length){ok=null;} else {const gold=ans.split(',').map(s=>s.trim()).sort(); ok=JSON.stringify(user)===JSON.stringify(gold);} } else if(type==='text'){const t=q.querySelector('input[type=text]'); user=(t?.value||'').trim(); const mode=(q.dataset.eval||'exact').toLowerCase(); if(!user){ok=null;} else if(mode==='regex'){try{ok=new RegExp(ans,'i').test(user);}catch(e){ok=false;}} else {ok=(user===ans);} } return {id,type,ok,user};}

  function formatUserAnswerDisplay(q,evaluation){ const type=q.dataset.type; if(type==='mc'){return evaluation.user?describeChoiceLabel(q,evaluation.user):'';} if(type==='ms'){const vals=Array.isArray(evaluation.user)?evaluation.user:[]; return vals.length?describeChoiceList(q,vals):'';} if(type==='text'){return evaluation.user||'';} return '';
  }
  function formatCorrectAnswerDisplay(q){ const type=q.dataset.type; const ans=(q.dataset.answer||'').trim(); if(!ans) return ''; if(type==='mc') return describeChoiceLabel(q,ans); if(type==='ms'){const vals=ans.split(',').map(s=>s.trim()).filter(Boolean); return vals.length?describeChoiceList(q,vals):'';} if(type==='text'){const mode=(q.dataset.eval||'exact').toLowerCase(); return mode==='regex' ? 'Regex: '+ans : ans;} return ans; }

  function scoreLabel(ok){ if(ok===true) return DETAIL_TEXT.status.correct; if(ok===false) return DETAIL_TEXT.status.incorrect; return DETAIL_TEXT.status.unanswered; }

  function computeLiveScore(){const qs=$$('#questions .q'); let total=0,correct=0,answered=0; qs.forEach(q=>{total++; const r=evaluateQuestion(q); if(r.ok===true) correct++; if(isAnswered(q)) answered++;}); return {total,correct,answered};}
  function updateLiveScore(){
    const s=computeLiveScore();
    const el=$('#score-badge');
    if(el){
      el.textContent=s.correct+' / '+s.total;
      el.title=locale.startsWith('ja')
        ? '正解 ' + s.correct + ' / ' + s.total + ' (回答 ' + s.answered + ')'
        : 'Correct ' + s.correct + ' of ' + s.total + ' (answered ' + s.answered + ')';
    }
    updateQuestionStates();
    updateProgressCard(s);
  }

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
	  injectSkipLink();
	  localizeStaticUiText();
	  injectRfcHubLink();
	  injectRfcCheatSheet();
	  injectQuestionGuides();
	  normalizeAllExplanations();
	  injectKeywordsBlock();
	  injectStudyPath();
	  ensureProgressCard();
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

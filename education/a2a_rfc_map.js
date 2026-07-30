(function () {
  'use strict';

  const RFC_EDITOR = 'https://www.rfc-editor.org/rfc/rfc';
  const NORMATIVE_REFERENCES = new Set([
    2119, 5280, 6234, 7515, 7519, 7800, 8174, 8392, 8446,
    8725, 8747, 8949, 9052, 9261, 9325, 9334, 9421, 9530
  ]);
  const INFORMATIVE_REFERENCES = new Set([
    5056, 5705, 6749, 6973, 7258, 8693, 8705, 9111, 9266,
    9449, 9457, 9518, 9651, 9711, 9847
  ]);
  const item = (n, title, ja, en, flags = '') => ({ n, title, ja, en, flags });
  const groups = [
    {
      id: 'core',
      open: true,
      ja: '1. A2Aの基本用語・発見・Agent Card',
      en: '1. A2A vocabulary, discovery, and Agent Cards',
      jaSummary: 'HTTP/JSONの意味、URI、Agent Cardの取得・キャッシュ・署名を読むための土台。',
      enSummary: 'HTTP/JSON, URI, discovery, caching, and signing foundations for Agent Cards.',
      items: [
        item(2119, 'Key words for use in RFCs to Indicate Requirement Levels', 'MUST / SHOULD / MAYの基本。A2A 1.0とdraftの規範文を同じ基準で読む。', 'The base vocabulary for normative A2A and draft requirements.', 'ADQ'),
        item(8174, 'Ambiguity of Uppercase vs Lowercase in RFC 2119 Key Words', 'BCP 14の大文字条件を補う。draftの直接参照。', 'Completes BCP 14 by defining when uppercase requirement words are normative.', 'DQ'),
        item(3986, 'Uniform Resource Identifier (URI): Generic Syntax', 'Agent endpoint、extension URI、task/target参照を、識別と取得を混同せず扱う。', 'Separates identification from retrieval for endpoints, extensions, tasks, and targets.', 'GQ'),
        item(8259, 'The JavaScript Object Notation (JSON) Data Interchange Format', 'A2AのJSON表現と、入力検証・相互運用性の基準。', 'The JSON representation and interoperability baseline used by A2A.', 'AQ'),
        item(8615, 'Well-Known Uniform Resource Identifiers (URIs)', '`.well-known/agent-card.json`を評価するための背景。現行A2A 1.0本文の直接引用ではない。', 'Background for `.well-known/agent-card.json`; not a direct citation in current A2A 1.0.', 'BQ'),
        item(9110, 'HTTP Semantics', 'method、status、representation、idempotency、intermediaryの共通意味論。', 'Common semantics for methods, status codes, representations, idempotency, and intermediaries.', 'AGQ'),
        item(9111, 'HTTP Caching', 'Agent Cardのfreshness、validator、再検証と、identity依存応答の保存可否。', 'Agent Card freshness and revalidation, plus policy for identity-dependent responses.', 'ADQ'),
        item(7515, 'JSON Web Signature (JWS)', 'Agent Card署名とdraftのauthority grant / session proofで使う署名コンテナ。', 'The signature container used for Agent Cards and the draft grant/proof profiles.', 'ADQ'),
        item(8785, 'JSON Canonicalization Scheme (JCS)', 'Agent Card署名対象を実装間で同じbyte列にする。A2Aのfield presence規則も併読する。', 'Produces stable Agent Card signature bytes; read with A2A field-presence rules.', 'AQ'),
        item(9457, 'Problem Details for HTTP APIs', '一般的なHTTP APIエラー表現。draftの直接参照だが、現行A2A 1.0のHTTP error bodyはgoogle.rpc.Status系。', 'General HTTP API errors and a direct draft reference; current A2A 1.0 uses a google.rpc.Status-style body.', 'DRQ')
      ]
    },
    {
      id: 'auth',
      ja: '2. 認証・認可・委任・トークンの使い回し防止',
      en: '2. Authentication, authorization, delegation, and sender constraining',
      jaSummary: '「誰が」「何を」「誰に対して」実行できるかと、tokenを誰が提示できるかを分離する。',
      enSummary: 'Separates who may do what for which resource from who can present a token.',
      items: [
        item(6749, 'The OAuth 2.0 Authorization Framework', 'OAuthのrole、grant、access token、scopeの基礎。draftのOAuth合成の出発点。', 'OAuth roles, grants, access tokens, and scopes; the draft composition baseline.', 'DQ'),
        item(7517, 'JSON Web Key (JWK)', 'JWS/JWT/DPoPの公開鍵表現とJWKSによる鍵配布。', 'Public-key representation and JWKS distribution for JWS, JWT, and DPoP.', 'Q'),
        item(7519, 'JSON Web Token (JWT)', 'issuer、audience、時間、token IDを持つclaim container。署名検証だけで受理を決めない。', 'Claim container for issuer, audience, time, and token IDs; signature validity alone is not acceptance.', 'DQ'),
        item(7638, 'JSON Web Key (JWK) Thumbprint', 'keyをcanonicalなthumbprintで参照する。DPoPの`jkt`理解に必要。', 'Canonical key thumbprints, including the DPoP `jkt` confirmation method.', 'Q'),
        item(7800, 'Proof-of-Possession Key Semantics for JSON Web Tokens (JWTs)', '`cnf` claimでtokenとholder keyを結び付ける。', 'Binds a token to a holder key through the `cnf` claim.', 'DQ'),
        item(8414, 'OAuth 2.0 Authorization Server Metadata', 'authorization serverのendpoint、capability、鍵位置を発見する。', 'Discovers authorization-server endpoints, capabilities, and key locations.', 'Q'),
        item(8693, 'OAuth 2.0 Token Exchange', 'actor、subject、audienceを含む委任・token変換。agent chainでのauthority伝搬を議論する基礎。', 'Delegation and token exchange across actors, subjects, and audiences in agent chains.', 'DQ'),
        item(8705, 'OAuth 2.0 Mutual-TLS Client Authentication and Certificate-Bound Access Tokens', 'client certificateによる認証とaccess tokenのcertificate binding。', 'Client-certificate authentication and certificate-bound access tokens.', 'DQ'),
        item(8725, 'JSON Web Token Best Current Practices', 'algorithm confusion、cross-JWT confusion、issuer/audience検証を含むJWT受理のBCP。', 'JWT acceptance BCP covering algorithm confusion, token confusion, issuer, and audience.', 'DQ'),
        item(9449, 'OAuth 2.0 Demonstrating Proof of Possession (DPoP)', 'HTTP requestごとのproofでtokenをkey-boundにする。認証・認可そのものとの境界が重要。', 'Binds tokens to a key with per-request proofs; not by itself authentication or authorization.', 'DQ'),
        item(9700, 'Best Current Practice for OAuth 2.0 Security', 'OAuth 2.0を現在の脅威モデルで運用するためのSecurity BCP。', 'The current OAuth 2.0 security BCP and deployment threat model.', 'Q'),
        item(9728, 'OAuth 2.0 Protected Resource Metadata', 'resource server側のauthorization server、scope、sender-constraining対応を発見する。', 'Discovers a protected resource’s authorization servers, scopes, and sender-constraining support.', 'Q')
      ]
    },
    {
      id: 'binding',
      ja: '3. 接続との結び付け・署名・実行環境の確認（関連仕様案の参照RFC）',
      en: '3. Channel binding, signatures, and attestation (direct draft references)',
      jaSummary: 'draft-okutomi-session-bound-agent-identity-06が直接参照する、受理判定の主要部品。',
      enSummary: 'Main acceptance components directly referenced by draft-okutomi-session-bound-agent-identity-06.',
      items: [
        item(5056, 'On the Use of Channel Bindings to Secure Channels', '上位認証を下位のsecure channelへ結び付ける一般モデル。', 'General model for binding upper-layer authentication to a secure channel.', 'DQ'),
        item(5280, 'Internet X.509 Public Key Infrastructure Certificate and CRL Profile', 'endpoint certificate、SubjectPublicKeyInfo、path validation、revocationの基準。', 'Endpoint certificates, SubjectPublicKeyInfo, path validation, and revocation.', 'DQ'),
        item(5705, 'Keying Material Exporters for Transport Layer Security (TLS)', 'TLSからapplication固有のkeying materialを導出するexporterの基礎。', 'Exporter foundation for deriving application-specific keying material from TLS.', 'DQ'),
        item(6234, 'US Secure Hash Algorithms', 'draftが使用するSHA-256/SHA-512の参照。主に実装・test vector向け。', 'Hash-function reference used by the draft; mainly for implementation and test vectors.', 'DQ'),
        item(8392, 'CBOR Web Token (CWT)', 'CBORベースのtoken claim表現。', 'The CBOR-based token claims format.', 'DQ'),
        item(8446, 'The Transport Layer Security (TLS) Protocol Version 1.3', 'handshake、exporter、resumption、0-RTTとchannel instanceの境界。', 'Handshake, exporters, resumption, 0-RTT, and channel-instance boundaries.', 'DQ'),
        item(8747, 'Proof-of-Possession Key Semantics for CBOR Web Tokens (CWTs)', 'CWTのconfirmation key semantics。', 'Confirmation-key semantics for CWT.', 'DQ'),
        item(8949, 'Concise Binary Object Representation (CBOR)', 'CWT/COSEのdata modelとdeterministic encoding判断の基礎。', 'The CWT/COSE data model and deterministic-encoding foundation.', 'DQ'),
        item(9052, 'CBOR Object Signing and Encryption (COSE): Structures and Process', 'CWTを署名・MAC・暗号化するCOSE構造。', 'COSE structures for signing, MACing, and encrypting CWT data.', 'DQ'),
        item(9261, 'Exported Authenticators in TLS', 'TLS handshake後に追加のcertificate-based identity proofを交換する。', 'Exchanges additional certificate-based identity proofs after the TLS handshake.', 'DQ'),
        item(9266, 'Channel Bindings for TLS 1.3', '`tls-exporter` channel binding typeの性質と利用制約。', 'Properties and use constraints of the `tls-exporter` channel-binding type.', 'DQ'),
        item(9325, 'Recommendations for Secure Use of TLS and DTLS', 'TLSを安全に配備するBCP。A2Aの「TLSを使う」を運用要件へ落とす。', 'TLS deployment BCP that turns “use TLS” into operational requirements.', 'DQ'),
        item(9334, 'Remote ATtestation procedureS (RATS) Architecture', 'Attester、Verifier、Relying Party、Evidence、Attestation Resultの責務分離。', 'Separates Attester, Verifier, Relying Party, Evidence, and Attestation Result roles.', 'DQ'),
        item(9421, 'HTTP Message Signatures', 'HTTP componentを選んでend-to-endに署名する。cover対象はapplication profileの責務。', 'Signs selected HTTP components end to end; the application profile chooses coverage.', 'DQ'),
        item(9530, 'Digest Fields', 'HTTP content digestを署名対象へ安全に組み込む。', 'Carries HTTP content digests for inclusion in message signatures.', 'DQ'),
        item(9651, 'Structured Field Values for HTTP', 'HTTP field valueを一貫してparse/serializeする構造化形式。', 'A consistent structured parsing and serialization model for HTTP field values.', 'DQ'),
        item(9711, 'The Entity Attestation Token (EAT)', 'attestation claimsをtokenとして表現する。RATS roleとの対応を崩さない。', 'Represents attestation claims as tokens while preserving RATS role separation.', 'DQ'),
        item(9847, 'IANA Registry Updates for TLS and DTLS', 'TLS/DTLS registryのRecommended列, discouraged marking, Comment列, 登録手順を読む。', 'Reads TLS/DTLS registry Recommended states, discouraged markings, Comment columns, and registration procedures.', 'DQ')
      ]
    },
    {
      id: 'transport',
      ja: '4. 通信方式・ストリーミング・バージョン管理',
      en: '4. Transport, streaming, and versioning',
      jaSummary: 'A2A bindingを、stream、connection、再接続、将来versionの違いから検討する。',
      enSummary: 'Evaluates A2A bindings across streams, connections, reconnects, and future versions.',
      items: [
        item(6455, 'The WebSocket Protocol', '双方向message transportとHTTP Upgrade、origin、masking。', 'Bidirectional messaging, HTTP Upgrade, origins, and masking.', 'Q'),
        item(8441, 'Bootstrapping WebSockets with HTTP/2', 'HTTP/2でWebSocketを確立するextended CONNECT。', 'Extended CONNECT for WebSockets over HTTP/2.', 'Q'),
        item(8999, 'Version-Independent Properties of QUIC', '将来版でも不変な最小coreを切り出す。A2A binding/profile設計の比較対象。', 'Extracts a minimal invariant core across versions; a model for A2A binding/profile design.', 'GQ'),
        item(9000, 'QUIC: A UDP-Based Multiplexed and Secure Transport', 'stream、connection ID、migration、flow control。', 'Streams, connection IDs, migration, and flow control.', 'Q'),
        item(9001, 'Using TLS to Secure QUIC', 'QUICとTLSの責務分担、0-RTT、transport parameter protection。', 'The QUIC/TLS responsibility split, 0-RTT, and transport-parameter protection.', 'Q'),
        item(9112, 'HTTP/1.1', 'message framing、connection management、request smuggling境界。', 'Message framing, connection management, and request-smuggling boundaries.', 'Q'),
        item(9113, 'HTTP/2', '一つのconnection上の複数stream、flow control、stream reset。', 'Multiple streams on one connection, flow control, and stream reset.', 'Q'),
        item(9114, 'HTTP/3', 'HTTP semanticsをQUICへmappingし、stream failureとconnection failureを分ける。', 'Maps HTTP semantics to QUIC and separates stream from connection failures.', 'Q'),
        item(9204, 'QPACK: Field Compression for HTTP/3', 'HTTP/3 header compressionとblocked streamのtrade-off。', 'HTTP/3 field compression and the blocked-stream trade-off.', 'Q')
      ]
    },
    {
      id: 'principles',
      ja: '5. 設計レビュー・脅威・プライバシー',
      en: '5. Design review, threats, and privacy',
      jaSummary: 'core/profile境界、複雑性、脅威モデル、公開情報とcentralizationをレビューする。',
      enSummary: 'Reviews core/profile boundaries, complexity, threats, exposure, and centralization.',
      items: [
        item(1958, 'Architectural Principles of the Internet', 'end-to-end、heterogeneity、modularity、running codeを設計判断へ使う。', 'Applies end-to-end, heterogeneity, modularity, and running-code principles.', 'GQ'),
        item(3439, 'Some Internet Architectural Guidelines and Philosophy', 'coupling、state、feature interactionが大規模系の複雑性を増幅する過程を読む。', 'Examines how coupling, state, and feature interactions amplify complexity.', 'GQ'),
        item(3552, 'Guidelines for Writing RFC Text on Security Considerations', '攻撃者能力、守る資産、範囲外、残余リスクを先に固定する。', 'Fixes attacker capabilities, assets, exclusions, and residual risk before mechanisms.', 'GQ'),
        item(5218, 'What Makes for a Successful Protocol?', '正味価値、段階導入、open specification、拡張性から採用可能性を評価する。', 'Evaluates adoption through net value, incremental deployment, openness, and extensibility.', 'GQ'),
        item(6973, 'Privacy Considerations for Internet Protocols', 'identifier、観測可能性、相関、保存、二次利用をprivacy threat modelへ落とす。', 'Maps identifiers, observability, correlation, retention, and secondary use into privacy threats.', 'DQ'),
        item(7258, 'Pervasive Monitoring Is an Attack', '大規模受動監視をprotocol design上の攻撃として扱う。', 'Treats pervasive passive monitoring as a protocol-design attack.', 'DGQ'),
        item(8890, 'The Internet is for End Users', 'agent、provider、gatewayの都合ではなくend userの利益を設計評価へ入れる。', 'Includes end-user interests when evaluating agents, providers, and gateways.', 'GQ'),
        item(9518, 'Centralization, Decentralization, and Internet Standards', 'registry、broker、identity providerが作るcentralization pressureを分析する。', 'Analyzes centralization pressure from registries, brokers, and identity providers.', 'DGQ')
      ]
    }
  ];

  const route = [
    ['意味と表現', 'Semantics', [9110, 8259, 3986]],
    ['発見とAgent Card', 'Discovery', [8615, 9111, 7515, 8785]],
    ['OAuthの土台', 'OAuth foundations', [6749, 8414, 9728]],
    ['鍵とtoken形式', 'Keys and token formats', [7517, 7638, 7519, 8725]],
    ['sender constrainingと委任', 'Sender constraining and delegation', [7800, 8705, 9449, 8693]],
    ['接続と証明の結び付け', 'Binding proofs to connections', [8446, 9266, 9421, 9334]],
    ['通信方式と進化', 'Transport and evolution', [9113, 9114, 9000, 8999]],
    ['設計レビュー', 'Design review', [3552, 3439, 6973]]
  ];
  const entriesByNumber = new Map(
    groups.flatMap((group) => group.items).map((entry) => [entry.n, entry])
  );

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function badge(text, kind) {
    return el('span', 'a2a-map-badge ' + kind, text);
  }

  function quizHref(rfc, locale) {
    return 'quiz_rfc' + rfc + (locale === 'ja' ? '_ja' : '') + '.html';
  }

  function renderRoute(target, locale) {
    route.forEach((stage, index) => {
      const article = el('article', 'a2a-route-stage');
      article.appendChild(el('span', 'a2a-route-number', String(index + 1)));
      const body = el('div', 'a2a-route-body');
      body.appendChild(el('h3', '', stage[locale === 'ja' ? 0 : 1]));
      const links = el('div', 'a2a-route-links');
      stage[2].forEach((rfc) => {
        const entry = entriesByNumber.get(rfc);
        if (entry && entry.flags.includes('Q')) {
          const link = el('a', '', 'RFC ' + rfc);
          link.href = quizHref(rfc, locale);
          links.appendChild(link);
        } else {
          links.appendChild(el('span', 'a2a-route-pending', 'RFC ' + rfc));
        }
      });
      body.appendChild(links);
      article.appendChild(body);
      target.appendChild(article);
    });
  }

  function renderItem(entry, locale) {
    const li = el('li', 'a2a-rfc-item');
    const main = el('div', 'a2a-rfc-main');
    const title = el('div', 'a2a-rfc-title');
    const hasQuiz = entry.flags.includes('Q');
    const number = el(hasQuiz ? 'a' : 'span', 'rfc-number', 'RFC ' + entry.n);
    if (hasQuiz) number.href = quizHref(entry.n, locale);
    title.appendChild(number);
    title.appendChild(el('span', '', entry.title));
    main.appendChild(title);
    main.appendChild(el('p', '', entry[locale]));

    const side = el('div', 'a2a-rfc-side');
    if (entry.flags.includes('A')) side.appendChild(badge(locale === 'ja' ? 'A2A 1.0で明記' : 'Named by A2A 1.0', 'a2a-direct'));
    if (entry.flags.includes('B')) side.appendChild(badge(locale === 'ja' ? '背景標準' : 'Background', 'background'));
    if (NORMATIVE_REFERENCES.has(entry.n)) {
      side.appendChild(badge(locale === 'ja' ? '規範参照' : 'Normative ref', 'draft-normative'));
    } else if (INFORMATIVE_REFERENCES.has(entry.n)) {
      side.appendChild(badge(locale === 'ja' ? '参考参照' : 'Informative ref', 'draft-informative'));
    } else if (entry.flags.includes('D')) {
      side.appendChild(badge(locale === 'ja' ? 'draft参照' : 'Draft ref', 'draft-direct'));
    }
    if (entry.flags.includes('G')) side.appendChild(badge(locale === 'ja' ? '設計レビュー向け' : 'Review guidance', 'design'));
    if (hasQuiz) {
      const link = el('a', 'a2a-map-badge quiz-link', locale === 'ja' ? '問題を解く' : 'Open quiz');
      link.href = quizHref(entry.n, locale);
      side.appendChild(link);
    } else {
      side.appendChild(badge(locale === 'ja' ? '問題未作成' : 'Quiz not yet available', 'quiz-pending'));
    }
    if (entry.flags.includes('R')) {
      const link = el('a', 'a2a-map-badge related-quiz', locale === 'ja' ? '旧版 RFC 7807 quiz' : 'Older RFC 7807 quiz');
      link.href = quizHref(7807, locale);
      side.appendChild(link);
    }
    const source = el('a', 'a2a-map-badge rfc-source', locale === 'ja' ? 'RFC本文 ↗' : 'RFC text ↗');
    source.href = RFC_EDITOR + entry.n + '.html';
    source.target = '_blank';
    source.rel = 'noopener noreferrer';
    side.appendChild(source);
    li.appendChild(main);
    li.appendChild(side);
    return li;
  }

  function renderGroups(target, locale) {
    groups.forEach((group) => {
      const details = el('details', 'a2a-rfc-group');
      if (group.open) details.open = true;
      const summary = el('summary');
      const copy = el('span', 'a2a-group-copy');
      copy.appendChild(el('strong', '', group[locale]));
      copy.appendChild(el('span', '', group[locale + 'Summary']));
      summary.appendChild(copy);
      summary.appendChild(el('span', 'a2a-group-count', group.items.length + (locale === 'ja' ? ' RFC' : ' RFCs')));
      details.appendChild(summary);
      const list = el('ul', 'a2a-rfc-list');
      group.items.forEach((entry) => list.appendChild(renderItem(entry, locale)));
      details.appendChild(list);
      target.appendChild(details);
    });
  }

  function render(options) {
    const locale = options && options.locale === 'ja' ? 'ja' : 'en';
    const routeTarget = document.getElementById('a2aRoute');
    const groupTarget = document.getElementById('a2aRfcGroups');
    const stats = document.getElementById('a2aRfcStats');
    if (!routeTarget || !groupTarget) return;
    renderRoute(routeTarget, locale);
    renderGroups(groupTarget, locale);
    if (stats) {
      const entries = groups.flatMap((group) => group.items);
      const normativeCount = entries.filter((entry) => NORMATIVE_REFERENCES.has(entry.n)).length;
      const informativeCount = entries.filter((entry) => INFORMATIVE_REFERENCES.has(entry.n)).length;
      const draftCount = normativeCount + informativeCount;
      const quizCount = entries.filter((entry) => entry.flags.includes('Q')).length;
      stats.textContent = locale === 'ja'
        ? '全' + entries.length + '本 / 関連仕様案の参照' + draftCount + '本（規範' + normativeCount + ' / 参考' + informativeCount + '） / クイズ' + quizCount + '本'
        : entries.length + ' RFCs / ' + draftCount + ' related-draft references (' + normativeCount + ' normative / ' + informativeCount + ' informative) / ' + quizCount + ' quizzes';
    }
  }

  window.A2ARfcMap = { render };
})();

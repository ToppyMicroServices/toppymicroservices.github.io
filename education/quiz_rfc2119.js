window.DRILL_SETTINGS = window.DRILL_SETTINGS || {
  SKILL_NAME: "RFC 2119 規範語（BCP14）",
  SKILL_SUBTITLE: "MUST / SHOULD / MAY など",
  GOAL_DESCRIPTION: "仕様書の規範語（requirement levels）を誤解なく読み書きできる",
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
    showAllAnswers: 'quizShowAllAnswers',
    language: 'quizLang'
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

  function getStringPref(key, defaultValue=''){
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? defaultValue : raw;
    } catch (_e) {
      return defaultValue;
    }
  }

  function setStringPref(key, value){
    try {
      localStorage.setItem(key, value);
    } catch (_e) {}
  }

  function getRevealControls(){
    return {
      explainOnAnswer: document.getElementById('toggleExplainOnAnswer'),
      showAllAnswers: document.getElementById('toggleShowAllAnswers')
    };
  }

  function initLanguageToggle(){
    const currentLang = locale.startsWith('ja') ? 'ja' : 'en';
    const stored = getStringPref(PREF_KEYS.language, '');
    const desired = stored === 'ja' || stored === 'en' ? stored : '';

    // Legacy checkbox toggle (kept for backward compatibility)
    const input = document.getElementById('langToggle');
    if(input instanceof HTMLInputElement){
      const enUrl = input.dataset.en;
      const jaUrl = input.dataset.ja;
      if(!enUrl || !jaUrl) return;

      if(desired && desired !== currentLang){
        window.location.href = desired === 'ja' ? jaUrl : enUrl;
        return;
      }

      input.checked = currentLang === 'ja';
      input.addEventListener('change', () => {
        const next = input.checked ? 'ja' : 'en';
        setStringPref(PREF_KEYS.language, next);
        window.location.href = next === 'ja' ? jaUrl : enUrl;
      });
      return;
    }

    // Flag link toggle
    const toggle = document.querySelector('.lang-toggle');
    if(!(toggle instanceof HTMLElement)) return;
    const enLink = toggle.querySelector('[data-lang="en"]');
    const jaLink = toggle.querySelector('[data-lang="ja"]');
    if(!(enLink instanceof HTMLAnchorElement) || !(jaLink instanceof HTMLAnchorElement)) return;

    const enUrl = enLink.getAttribute('href');
    const jaUrl = jaLink.getAttribute('href');
    if(!enUrl || !jaUrl) return;

    if(desired && desired !== currentLang){
      window.location.href = desired === 'ja' ? jaUrl : enUrl;
      return;
    }

    // Ensure active styling matches the current document
    enLink.classList.toggle('active', currentLang === 'en');
    jaLink.classList.toggle('active', currentLang === 'ja');
    if(currentLang === 'en') enLink.setAttribute('aria-current','page'); else enLink.removeAttribute('aria-current');
    if(currentLang === 'ja') jaLink.setAttribute('aria-current','page'); else jaLink.removeAttribute('aria-current');

    enLink.addEventListener('click', () => setStringPref(PREF_KEYS.language, 'en'));
    jaLink.addEventListener('click', () => setStringPref(PREF_KEYS.language, 'ja'));
  }

  function mapDifficulty(q){
    const raw = (q.dataset.difficulty || '').trim();
    if(/^L[1-5]$/.test(raw)) return raw;
    const t = (q.dataset.type || '').toLowerCase();
    if(t === 'mc') return 'L2';
    if(t === 'ms') return 'L3';
    if(t === 'text') return 'L3';
    return 'L3';
  }

  function injectDifficultyBadges(){
    $$('#questions .q').forEach(q => {
      if(!(q instanceof HTMLElement)) return;
      if(q.querySelector('.difficulty-badge')) return;
      const header = q.querySelector('header');
      const type = q.querySelector('.type');
      if(!header || !(type instanceof HTMLElement)) return;

      const badge = document.createElement('span');
      badge.className = 'difficulty-badge';
      badge.textContent = mapDifficulty(q);
      badge.setAttribute('title', 'Difficulty');
      type.append(' ');
      type.appendChild(badge);
    });
  }

  function updateThemeToggle(mode){const b=$('#themeToggle'); if(!b) return; const L=mode==='light'; b.textContent=L?'🌙 Dark':'🌞 Light'; b.setAttribute('aria-pressed',L?'true':'false');}
  function setTheme(m,persist=true){const n=m==='light'?'light':'dark'; document.body.setAttribute('data-theme',n); if(persist){try{localStorage.setItem(THEME_KEY,n);}catch(e){}} updateThemeToggle(n);}    
  function applyInitialTheme(){let s=null; try{s=localStorage.getItem(THEME_KEY);}catch(e){} const init=s||(prefersDark.matches?'dark':'light'); setTheme(init,false);}    
  function toggleTheme(){const c=document.body.getAttribute('data-theme')==='light'?'light':'dark'; setTheme(c==='light'?'dark':'light',true);}    
  function applySettings(){const S=window.DRILL_SETTINGS||{}; const name=S.SKILL_NAME; const sub=S.SKILL_SUBTITLE; const goal=S.GOAL_DESCRIPTION; const title=$('#title'); if(title) title.textContent=(name?name+' ':'')+(sub?('— '+sub):''); const subtitle=$('#subtitle'); if(subtitle) subtitle.textContent=goal||''; const footerSkill=$('#footer-skill'); if(footerSkill) footerSkill.textContent=name||'Skill'; const footerGoal=$('#footer-goal'); if(footerGoal) footerGoal.textContent=goal||''; const img=$('#brand-logo'); if(img&&S.BRAND_LOGO){img.src=S.BRAND_LOGO; img.style.display='inline-block'; img.alt=S.BRAND_NAME||'';} const brandName=$('#brand-name'); if(brandName) brandName.textContent=S.BRAND_NAME||''; const brandLink=$('#brand-link'); if(brandLink) brandLink.href=S.BRAND_URL||'/'; const footerBrand=$('#footer-brand'); if(footerBrand) footerBrand.innerHTML='<strong>'+(S.BRAND_NAME||'')+'</strong>';}    
  function showExplain(q,show=true){const exp=q.querySelector('.explain'); if(!exp) return; exp.classList.toggle('show',!!show);}    

  function isAnswered(q){const t=q.dataset.type; if(t==='mc') return !!q.querySelector('input[type=radio]:checked'); if(t==='ms') return q.querySelectorAll('input[type=checkbox]:checked').length>0; if(t==='text'){const v=q.querySelector('input[type=text]')?.value.trim(); return !!v;} return false;}

  function cleanLabelText(text){ return (text||'').replace(/\s+/g,' ').trim(); }
  function describeChoiceList(q,values){ if(!values||!values.length) return ''; const map=v=>{const input=q.querySelector('input[value="'+CSS.escape(v)+'"]'); const label=input?.closest('label'); return label?cleanLabelText(label.textContent):v; }; return values.map(map).join(', '); }
  function describeChoiceLabel(q,value){ return describeChoiceList(q,[value]); }

  function evaluateQuestion(q){const id=q.dataset.id; const type=q.dataset.type; const ans=(q.dataset.answer||'').trim(); let ok=null,user=null; if(type==='mc'){const p=q.querySelector('input[type=radio]:checked'); if(!p){ok=null;} else {user=p.value; ok=(user===ans);} } else if(type==='ms'){const picked=q.querySelectorAll('input[type=checkbox]:checked'); user=Array.from(picked).map(i=>i.value).sort(); if(!user.length){ok=null;} else {const gold=ans.split(',').map(s=>s.trim()).filter(Boolean).sort(); ok=JSON.stringify(user)===JSON.stringify(gold);} } else if(type==='text'){const t=q.querySelector('input[type=text]'); user=(t?.value||'').trim(); const mode=(q.dataset.eval||'exact').toLowerCase(); if(!user){ok=null;} else if(mode==='regex'){try{ok=new RegExp(ans,'i').test(user);}catch(e){ok=false;}} else {ok=(user===ans);} } return {id,type,ok,user};}

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
  $('#mode-badge').addEventListener('click',()=>{let lm=$('#learningMode'); if(!lm){ lm=document.createElement('input'); lm.type='checkbox'; lm.id='learningMode'; lm.checked=true; lm.style.display='none'; document.body.appendChild(lm);} lm.checked=!lm.checked; const mb=$('#mode-badge'); mb.textContent=lm.checked?'Learning Mode':'Test Mode'; mb.setAttribute('aria-pressed',lm.checked?'true':'false'); updateLiveScore();});
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
  initLanguageToggle();
  injectDifficultyBadges();
  initRevealControls();
  bindAnswerChangeEvents();
  if(!$('#learningMode')){ const lm=document.createElement('input'); lm.type='checkbox'; lm.id='learningMode'; lm.checked=true; lm.style.display='none'; document.body.appendChild(lm);} 
  const mb=$('#mode-badge'); if(mb){ mb.textContent='Learning Mode'; mb.setAttribute('aria-pressed','true'); }
  updateLiveScore();
  applyRevealState();
  const y=new Date().getFullYear(); const b=window.DRILL_SETTINGS?.BRAND_NAME||'ToppyMicroServices'; const c=$('#copyright'); if(c){ c.textContent='© '+y+' '+b+'. All rights reserved.'; }
})();

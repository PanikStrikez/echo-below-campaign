/* Shared renderer: accepts the player-safe ownerView, never the private sheet. */
(() => {
 'use strict';
 const esc=v=>String(v??'—').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const sign=n=>Number.isFinite(n)?`${n>=0?'+':''}${n}`:'—';
 function html(c,options={}){
  const section=(title,rows)=>rows.length?`<section><h2>${esc(title)}</h2>${rows.map(r=>`<p>${esc(r)}</p>`).join('')}</section>`:'';
  const actions=[...(c.attacks||[]),...(c.actions||[])].map(a=>[a.name,a.type,a.prepared===false?'Unavailable':'',Number.isFinite(a.attackBonus)?`Attack ${sign(a.attackBonus)}`:'',a.damageDice?`${a.damageDice} ${a.damageType||''}`:'',a.saveDC?`${a.saveAbility} DC ${a.saveDC}`:'',a.resourceId?`Cost ${a.cost??1} ${(c.resources||[]).find(r=>r.id===a.resourceId)?.name||'resource'}`:'',a.effect].filter(Boolean).join(' · '));
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(c.name)} · Character handout</title><style>body{font:15px/1.5 Georgia,serif;color:#24241d;background:#fffdf7;max-width:850px;padding:24px;margin:auto}h1,h2{color:#423d25}h2{border-bottom:1px solid #b4a67d}p{white-space:pre-wrap;overflow-wrap:anywhere}section{margin:18px 0}section p{break-inside:avoid}h2{break-after:avoid}small{color:#605e50}@media print{body{padding:0;background:white;font-size:11pt}h1{font-size:22pt}h2{font-size:15pt}@page{margin:17mm}}</style></head><body><h1>${esc(c.name)}</h1><p>${esc(c.player)} · ${esc(c.ancestry)} · ${esc(c.className)} · Level ${esc(c.level)}</p><p>${esc(c.rules)} · ${esc(c.background)}</p><small>Snapshot ${esc(new Date(options.updatedAt||Date.now()).toLocaleString())}. Current values may change during play. Print / Save as PDF from your browser.</small>
  ${/^https?:\/\//.test(options.reconnectUrl||'')?`<p><a href="${esc(options.reconnectUrl)}">Reconnect to the live table</a> · Join the table Wi-Fi first. If access was restarted, scan the new QR code. This downloaded copy stays unchanged.</p>`:''}
  ${section('Current status',[`HP ${c.hp??'?'}/${c.maxHp??'?'} · Temporary HP ${c.tempHp||0} · AC ${c.ac??'?'} · Speed ${c.speed??'?'} ft · Proficiency ${sign(c.proficiency)}`,`Hit Dice: ${c.hitDice?.current??'?'}/${c.hitDice?.max??'?'} · ${c.hitDice?.details||'d'+(c.hitDice?.die??'?')}`,...(c.hitDice?.pools||[]).map(p=>`d${p.die}: ${p.current??'?'}/${p.max??'?'}`),`Inspiration: ${c.inspiration?'yes':'no'} · Exhaustion ${c.exhaustion||0}`,`Conditions: ${(c.conditions||[]).join(', ')||'none'} · Concentration: ${c.concentration||'none'}`,`Death saves: ${c.death?.successes||0} successes / ${c.death?.failures||0} failures${c.death?.stable?' · stable':''}`,...(c.effects||[]).map(e=>`${e.name}: ${e.remaining||''} ${e.timing||''} ${e.note||''}`)])}
  ${section('Abilities and saves',[...Object.entries(c.abilities||{}).map(([k,v])=>`${k.toUpperCase()} ${v.score??'?'} (${sign(v.modifier)})`),...(c.saves||[]).map(v=>`${v.name} save ${sign(v.bonus)}`)])}
  ${section('Skills, senses and languages',[...(c.skills||[]).map(v=>`${v.name} ${sign(v.bonus)}${v.rank===2?' · Expertise':''}`),...Object.entries(c.passives||{}).map(([k,v])=>`Passive ${k}: ${v??'?'}`),`Senses: ${c.senses||'—'}`,`Languages: ${c.languages||'—'}`])}
  ${section('Attacks and abilities',actions)}
  ${section('Spells',(c.spells||[]).map(s=>`${s.name} · ${s.level===0?'cantrip':'level '+s.level} · ${s.prepared===true?'available':s.prepared===false?'not prepared':'preparation unconfirmed'}${s.notes?' — '+s.notes:''}`))}
  ${section('Resources',(c.resources||[]).map(r=>`${r.name}: ${r.current??'?'}/${r.max??'?'} ${r.unit||''}`))}
  ${section('Equipment and money',[...(c.equipment||[]).map(e=>`${e.quantity} × ${e.name}${e.attuned?' · attuned':''}${e.equipped?' · equipped':''}${e.notes?' — '+e.notes:''}`),Object.entries(c.money||{}).map(([coin,n])=>`${n} ${coin}`).join(' · ')])}
  ${section('Features',(c.features||[]).map(f=>`${f.name}: ${f.text||''}${f.source?' ('+f.source+')':''}`))}
  ${section('Character notes',c.publicNotes?[c.publicNotes]:[])}
  </body></html>`;
 }
 globalThis.ECHO_CHARACTER_SUMMARY={html};
})();

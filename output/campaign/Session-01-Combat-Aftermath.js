/* Private aftermath references; the existing outcome ledger owns approved results. */
(()=>{'use strict';
 const endings=['victory','surrender','negotiation','escape','retreat','unresolved'];
 const clip=(v,n=1500)=>String(v??'').slice(0,n);
 function recommendation(status){
  const choices={parley:{ending:'negotiation',text:'Parley is recorded. If an agreement actually ended the fight, review Negotiation; otherwise keep it unresolved.'},surrender:{ending:'surrender',text:'Surrender is recorded. Review who surrendered, captives and agreed terms before confirming the ending.'},retreat:{ending:'retreat',text:'Withdrawal is recorded. Review who withdrew, survivors and pursuit. Use Escape if that better describes the actual result.'}};
  return choices[status]||null;
 }
 function metadata(raw={}){return {runKey:clip(raw.runKey,80),sessionId:clip(raw.sessionId,80),encounterId:clip(raw.encounterId,80),sceneId:clip(raw.sceneId,100),beatId:clip(raw.beatId,80),ending:endings.includes(raw.ending)?raw.ending:'',pending:clip(raw.pending)};}
 function normalize(raw={}){return {...metadata(raw),step:[1,2,3,4].includes(raw.step)?raw.step:1,pausedTurn:raw.pausedTurn?{scene:clip(raw.pausedTurn.scene,100),round:Math.max(0,Number(raw.pausedTurn.round)||0),order:(Array.isArray(raw.pausedTurn.order)?raw.pausedTurn.order:[]).filter(v=>typeof v==='string').slice(0,250),index:Math.max(0,Number(raw.pausedTurn.index)||0)}:null,finished:raw.finished===true,reviewedNotes:clip(raw.reviewedNotes,20000)};}
 function start(plan,context,newRun=false){if(newRun&&plan.aftermath?.runKey){plan.aftermathHistory||=[];plan.aftermathHistory.push({aftermath:plan.aftermath,wrap:structuredClone(plan.wrap),outcome:plan.outcome});plan.wrap=Object.fromEntries(Object.keys(plan.wrap).map(k=>[k,'']));plan.outcome='';}if(newRun||!plan.aftermath?.runKey){plan.aftermath=normalize({...context,runKey:'combat-'+Date.now()+'-'+Math.random().toString(36).slice(2,10)});}return plan.aftermath;}
 function record(d,key){return globalThis.ECHO_OUTCOMES.effective(d).find(e=>e.combatAftermath?.runKey===key)||null;}
 function draft(d,key){return d.outcomes?.drafts?.find(x=>x.event.combatAftermath?.runKey===key)||null;}
 function approved(d,key){const e=record(d,key);return e?.approved&&['confirmed','completed'].includes(e.status)?e:null;}
 function notesSignature(plan){return JSON.stringify({ending:plan.aftermath?.ending,pending:plan.aftermath?.pending,outcome:plan.outcome,wrap:plan.wrap});}
 function values(plan,context){const a=plan.aftermath;if(!a?.ending)throw Error('Choose how the fight ended before reviewing updates.');
  const fields=[['Outcome',plan.outcome],['People / fates requiring confirmation',plan.wrap.casualties],['Loot notes',plan.wrap.loot],['Custody',plan.wrap.lootCustody],['Location / supplies',plan.wrap.wagon],['Promises',plan.wrap.promises],['Discoveries / knowledge',plan.wrap.clues],['Advancement notes',plan.wrap.advancement],['Resources observed',plan.wrap.resources],['Consequences',plan.wrap.consequences]];
  const detail=['Ending: '+a.ending,...fields.filter(([,v])=>v?.trim()).map(([k,v])=>k+': '+clip(v,180)),a.pending?'Still open: '+clip(a.pending,250):''].filter(Boolean).join('\n');
  return {kind:'other',title:'Aftermath · '+context.name,session:context.sessionName,detail,status:'confirmed',basis:'Observed',share:'private',playerText:'',source:'DM aftermath review; encounter '+a.encounterId+'; map '+a.sceneId+'; full private wrap notes retained',combatAftermath:metadata(a)};
 }
 globalThis.ECHO_COMBAT_AFTERMATH={endings,recommendation,metadata,normalize,start,record,draft,approved,values,notesSignature};
})();

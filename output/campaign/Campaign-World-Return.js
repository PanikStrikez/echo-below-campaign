/* Private, read-only projection. Preparing a return never records a visit or consequence. */
(()=>{'use strict';
 const list=x=>Array.isArray(x)?x:[],C=()=>globalThis.ECHO_CONTINUITY;
 const facts=d=>C().effective(d).filter(e=>e.approved&&['confirmed','completed'].includes(e.status));
 function fingerprint(value){let n=2166136261;for(const c of JSON.stringify(value)){n=Math.imul(n^c.charCodeAt(0),16777619);}return (n>>>0).toString(16);}
 const stamp=e=>fingerprint({...e,approvedAt:undefined});
 function build(d,ledger,townId,npcs=[]){
  const town=ledger.towns.find(t=>t.id===townId);if(!town)throw Error('Choose a recorded location.');
  const actual=facts(d),people=new Map([...npcs,...ledger.npcs].filter(n=>n.town===townId).map(n=>[n.id,n]));
  const direct=e=>list(e.places).includes(townId)||e.downtime?.town===townId;
  const related=e=>list(e.relationships).some(r=>people.has(r.npcId))||list(e.knows).some(id=>people.has(id));
  const local=actual.filter(e=>direct(e)||related(e));
  const trackKeys=new Set(local.flatMap(e=>list(e.tracks).map(t=>t.kind+':'+t.key)));
  const refs=actual.filter(e=>direct(e)||related(e)||list(e.tracks).some(t=>trackKeys.has(t.kind+':'+t.key)));
  const boundary=Object.hasOwn(town,'sinceOutcomeAt')||Array.isArray(town.sinceOutcomeIds),prior=new Set(list(town.sinceOutcomeIds));
  const changed=e=>boundary&&(!prior.has(e.id)||town.sinceOutcomeSignatures?.[e.id]&&town.sinceOutcomeSignatures[e.id]!==stamp(e)||!town.sinceOutcomeSignatures&&town.sinceOutcomeAt&&e.approvedAt>town.sinceOutcomeAt);
  const rows=refs.map(e=>({id:e.id,title:e.title,text:e.detail,basis:e.basis,source:e.source,reason:direct(e)?'Explicit location link':'Related NPC or tracked commitment; presence is not established',changed:changed(e),corrected:prior.has(e.id)&&changed(e)}));
  const currentTracks=C().trackers(d).filter(t=>trackKeys.has(t.kind+':'+t.key));
  const relationships=[];for(const [id,npc]of people){const fields={};for(const e of actual)for(const r of list(e.relationships))if(r.npcId===id)for(const [key,value]of Object.entries(r.changes||{}))fields[key]={value,id:e.id};relationships.push({id,name:npc.name,fields,knowledge:actual.filter(e=>e.knows.includes(id)).map(e=>e.id)});}
  const jobs=globalThis.ECHO_SETTLEMENTS.due(ledger).filter(j=>j.town===townId);
  const history=globalThis.ECHO_DOWNTIME?.returnSummary(d,ledger,townId)||globalThis.ECHO_SETTLEMENTS.summary(ledger,townId);
  const developments=list(history.changes).filter(h=>!refs.some(e=>e.id===h.id));
  const quests=C().questCards(d).filter(q=>q.events.some(e=>refs.some(r=>r.id===e.id))).map(q=>({id:q.id,title:q.title,state:q.state,sources:q.events.filter(e=>e.approved&&['confirmed','completed'].includes(e.status)).map(e=>e.id)}));
  const publicRows=refs.filter(e=>changed(e)&&C().shared(e)).map(e=>({id:e.id,title:e.publicTitle||e.title,text:e.playerText,basis:e.basis}));
  const unresolved=actual.filter(e=>!refs.some(r=>r.id===e.id)&&!list(e.places).length&&!e.downtime?.town&&!list(e.relationships).length&&!e.knows.some(id=>people.has(id)));
  const result={townId,title:'What changed since your last visit?',name:town.name,boundary,changed:rows.filter(r=>r.changed),references:rows.filter(r=>!r.changed),tracks:currentTracks,relationships,quests,developments,pending:jobs,publicRows,unlinked:unresolved.map(e=>({id:e.id,title:e.title})),withdrawn:list(town.sinceOutcomeIds).filter(id=>!actual.some(e=>e.id===id)&&list(d.events).find(e=>e.id===id)?.places?.includes(townId))};
  result.signature=fingerprint({town,rows,currentTracks,relationships,quests,developments,jobs,publicRows});return result;
 }
 function propose(view){
  const prompts=view.tracks.map(t=>({id:t.eventId,text:({promise:'Ask whether and how this promise will be honored.',debt:'Confirm the outstanding terms and whether payment is offered.',rescue:'Confirm the rescued person’s present condition and whereabouts.',escape:'Check whether anyone has earned information about this escape; do not reveal a destination automatically.',custody:'Confirm who can access this item and whether anyone requests its return.'})[t.kind]+' '+t.subject+' · '+t.state}));
  for(const n of view.relationships)if(Object.keys(n.fields).length)prompts.push({id:Object.values(n.fields).map(f=>f.id).join(', '),text:'Possible conversation with '+n.name+'; first establish presence, then use their reviewed relationship and permitted knowledge. Do not assume an offer or agreement.'});
  const words=view.publicRows.map(r=>(r.basis==='Claimed'?'Recorded claim: ':r.basis==='Inferred'?'Recorded inference: ':'')+r.text);return {title:'Proposed return · '+view.name,status:'planned',signature:view.signature,sources:[...new Set([...view.changed.map(r=>r.id),...view.tracks.map(t=>t.eventId),...prompts.flatMap(p=>p.id.split(', '))])],read:('You return to '+view.name+'. Before choosing where to go next, what do you want to check on?\n\n'+(words.length?'Remember what was recorded for the party: '+words.slice(0,3).join('\n\n'):'The next step is yours to choose. You can follow an unfinished lead, seek a conversation, or take a moment to decide which matter needs your attention first. What do you do?')),prompts,pending:view.pending.map(j=>({id:j.id,title:j.title,proposal:j.proposal})),private:true};
 }
 function validate(view,proposal){if(!proposal||view.signature!==proposal.signature)throw Error('Supporting records changed. Regenerate and review this return scene before showing it.');}
 globalThis.ECHO_WORLD_RETURN={build,propose,validate,stamp,fingerprint};
})();

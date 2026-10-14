/* Read-only private marker choices. No discovery, arrival or publication writes. */
(()=>{'use strict';if(globalThis.location?.hash==='#player')return;
 const rows=v=>Array.isArray(v)?v:[],unique=v=>[...new Set(v)],labels={unresolved:'Unresolved',postponed:'Postponed','outcome-recorded':'Outcome recorded'};
 function records(events,board,id){const hidden=new Set(rows(events).filter(e=>e.approved&&e.status!=='planned').flatMap(e=>rows(e.replaces)));return rows(events).filter(e=>!hidden.has(e.id)&&e.approved&&['confirmed','completed'].includes(e.status)&&rows(e.markers).some(m=>m.scene===board&&m.point===id));}
 function status(events,board,id){const latest=records(events,board,id).at(-1);const value=latest?.markers.find(m=>m.scene===board&&m.point===id)?.disposition;return {id:labels[value]?value:latest?'outcome-recorded':'unresolved',label:labels[labels[value]?value:latest?'outcome-recorded':'unresolved'],eventId:latest?.id||''};}
 function context(s,board,m){const c=s.markerContext||{},beats=rows(s.beats).filter(b=>rows(m.beats).includes(b.id)),direct=records(c.events,board,m.id),ids=new Set([...rows(m.questIds),...direct.flatMap(e=>rows(e.quests).map(q=>q.id))]);
  // Room/scene bindings are references to preparation, never evidence of a visit.
  for(const q of rows(c.quests)){const p=c.profiles?.[q.id]||{};if(rows(p.beats).some(id=>rows(m.beats).includes(id))||m.sceneId&&rows(p.scenes).includes(m.sceneId))ids.add(q.id);}
  const quests=rows(c.quests).filter(q=>ids.has(q.id)).sort((a,b)=>((a.kind==='main'||a.kind==='act')?1:0)-((b.kind==='main'||b.kind==='act')?1:0)),npcIds=unique([...rows(m.npcIds),...quests.flatMap(q=>rows(c.profiles?.[q.id]?.npcs))]);
  const leads=rows(c.leads).filter(l=>rows(m.beats).includes(l.beatId)||m.sceneId&&l.sceneId===m.sceneId).map(l=>({...l,title:quests.find(q=>q.id===l.questId)?.title||l.questId}));
  const evidence=unique([...direct.map(e=>e.id),...quests.flatMap(q=>rows(c.profiles?.[q.id]?.events))]);
  const facts=rows(c.events).filter(e=>e.approved&&e.status!=='planned'&&(evidence.includes(e.id)||rows(e.replaces).some(id=>evidence.includes(id))));
  const questions=unique([...beats.flatMap(b=>rows(b.ask)),...quests.filter(q=>q.kind!=='main'&&q.kind!=='act'&&q.status==='active').flatMap(q=>rows(q.steps).filter(x=>x.state==='open').map(x=>x.title))]);
  const approaches=unique(beats.flatMap(b=>rows(b.choices))),place=rows(c.places).find(p=>p.id===m.id);
  return {status:status(c.events,board,m.id),quests,facts,questions,leads,approaches,npcs:npcIds.map(id=>({id,name:rows(c.npcs).find(n=>n.id===id)?.name||c.names?.[id]||id})),discovery:place?place.status+(place.inaccessible?' · inaccessible':''):'Not recorded in travel',why:quests.map(q=>q.goal||q.title).filter(Boolean),beats};
 }
 globalThis.ECHO_MARKER_CONTEXT={records,status,context,labels};
})();

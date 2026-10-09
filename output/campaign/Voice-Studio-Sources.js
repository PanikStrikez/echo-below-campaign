/* Small, audience-checked selections; never pass whole NPC/scene records to speech. */
(() => {
 function collect({story={},beats=[],sessionId='',handouts=[]}){
  const M=globalThis.ECHO_VOICE_STUDIO_DATA,rows=[],continuity=story.continuity||{};
  const add=(kind,id,title,text,allowed,extra={},basis='')=>rows.push({kind,id,sessionId:kind==='scene'?sessionId:'',title,text,allowed,reason:allowed?'':'Publish and review this source for the whole party first.',fingerprint:M.hash({text,allowed,basis}),...extra});
  for(const b of beats)if(b.read?.length)add('scene',b.id,b.title,b.read.join('\n\n'),true,{visualSceneId:b.scene||''});
  const publicJournal=globalThis.ECHO_OUTCOMES?.journal(story)||story.journal?.filter(j=>j.published)||[];
  for(const j of story.journal||[]){
   const summary=continuity.outcomes?.summaries?.find(x=>x.id===j.id);
   const fp=j.kind==='recap'?globalThis.ECHO_OUTCOMES?.fingerprint(continuity,summary?.session||'all')||M.hash(continuity.events||[]):'';
   const current=publicJournal.find(x=>x.id===j.id),allowed=!!current&&j.published===true&&(!summary||summary.fingerprint===fp);
   add('journal',j.id,j.title,current?.text||j.text||'',allowed,{},fp);
  }
  for(const h of handouts)add('handout',h.id,h.title,h.text||'',true,{visualId:h.pages?.[0]?.mediaId||''});
  // Correspondence remains owner-private until the existing outcome review shares it.
  for(const l of story.downtime?.letters||[]){const event=globalThis.ECHO_DOWNTIME?.result(continuity,'letterId',l.id);const approved=event&&globalThis.ECHO_CONTINUITY?.shared(event)?event:null;add('letter',l.id,l.subject,approved?.playerText||'',!!approved,{},approved?M.hash(approved):'private');}
  return rows;
 }
 globalThis.ECHO_VOICE_STUDIO_SOURCES={collect};
})();

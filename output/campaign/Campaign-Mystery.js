/* Private investigation preparation. Actual discoveries live only in the outcome ledger. */
(() => {
 'use strict';
 const list=v=>Array.isArray(v)?v:[],str=(v,n=2400)=>String(v??'').slice(0,n),copy=v=>JSON.parse(JSON.stringify(v));
 const unique=v=>[...new Set(list(v).map(x=>str(x,100)).filter(Boolean))];
 const id=prefix=>prefix+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,9);
 const stages=['early','middle','late','finale'];
 const relations=['supports','contradicts','context','question'];
 const topics=()=>[...(globalThis.ECHO_MYSTERY_DATA?.topics||[]),...(globalThis.ECHO_DISCOVERY_PREP_DATA?[{id:'phandelver',title:'Phandelver inquiries',summary:'Earned leads at the recorded checkpoint; recheck current outcomes before use.'}]:[])];
 const conclusions=()=>[...(globalThis.ECHO_MYSTERY_DATA?.conclusions||[]),...(globalThis.ECHO_DISCOVERY_PREP_DATA?.conclusions||[]).map(c=>({...c,topic:'phandelver',stage:'early'}))];
 const C=()=>globalThis.ECHO_CONTINUITY;
 function eventMeta(r={}){r||={};const m={
  links:list(r.links).slice(0,30).filter(Boolean).map(x=>({conclusionId:str(x.conclusionId,100),relation:relations.includes(x.relation)?x.relation:'context'})),
  sourceFamily:str(r.sourceFamily,160),independence:r.independence==='reviewed'?'reviewed':'unreviewed',independenceNote:str(r.independenceNote),
  corroboration:str(r.corroboration),contradiction:str(r.contradiction),limitations:str(r.limitations),
  citations:list(r.citations).slice(0,30).filter(Boolean).map(x=>({eventId:str(x.eventId,100),fingerprint:str(x.fingerprint,120000),note:str(x.note,800)}))};
  if(r.research&&typeof r.research==='object'){const a=r.research;m.research={projectId:str(a.projectId,100),attemptId:str(a.attemptId,100),question:str(a.question),prediction:str(a.prediction),method:str(a.method),consent:str(a.consent),interpretation:str(a.interpretation),disposition:['supports','contradicts','inconclusive','declined'].includes(a.disposition)?a.disposition:'inconclusive',publication:str(a.publication)};}
  return m;
 }
 function project(r={}){return {id:str(r.id,100),templateId:str(r.templateId,100),stage:stages.includes(r.stage)?r.stage:'early',title:str(r.title,160),topic:str(r.topic,100),town:str(r.town||'waterdeep',80),conclusionId:str(r.conclusionId,100),question:str(r.question),prediction:str(r.prediction),method:str(r.method),access:str(r.access),cost:str(r.cost,1200),minutes:Number.isSafeInteger(r.minutes)&&r.minutes>=0?r.minutes:null,uncertainty:str(r.uncertainty),consent:str(r.consent),corroborates:str(r.corroborates),contradicts:str(r.contradicts),publication:str(r.publication),characterIds:unique(r.characterIds),source:str(r.source,250),state:['ready','paused','archived'].includes(r.state)?r.state:'ready',notes:str(r.notes)};}
 function normalize(r={}){r||={};return {version:1,stage:stages.includes(r.stage)?r.stage:'early',projects:list(r.projects).slice(-500).filter(Boolean).map(project),undo:list(r.undo).filter(x=>typeof x==='string'&&x.length<3000000).slice(-10),redo:list(r.redo).filter(x=>typeof x==='string'&&x.length<3000000).slice(-10)};}
 const ensure=story=>story.mystery ||= normalize();
 function checkpoint(p){p.undo.push(JSON.stringify({stage:p.stage,projects:p.projects}));p.undo=p.undo.slice(-10);p.redo=[];}
 function restore(p,redo=false){const stack=redo?p.redo:p.undo;if(!stack.length)return false;const before=JSON.stringify({stage:p.stage,projects:p.projects}),saved=normalize(JSON.parse(stack.pop()));p.stage=saved.stage;p.projects=saved.projects;(redo?p.undo:p.redo).push(before);return true;}
 const actual=d=>C().effective(d).filter(e=>e.approved&&e.status!=='planned');
 const records=d=>actual(d).filter(e=>e.mystery);
 // Approval timestamps and publication wording are excluded: the cited evidence, knowledge and source are the dependency.
 function fingerprint(e){
  const value=JSON.stringify({id:e.id,approved:e.approved,status:e.status,basis:e.basis,title:e.title,detail:e.detail,source:e.source,knows:e.knows,mystery:e.mystery});
  // Compact change marker, not an authentication signature. Prevent nested citation snapshots growing exponentially.
  let a=2166136261,b=5381;for(let i=0;i<value.length;i++){const c=value.charCodeAt(i);a=Math.imul(a^c,16777619);b=Math.imul(b,33)^c;}
  return 'e1:'+value.length+':'+(a>>>0).toString(16)+':'+(b>>>0).toString(16);
 }
 const citation=(e,note='')=>({eventId:e.id,fingerprint:fingerprint(e),note});
 function issues(d,e,seen=new Set()){
  if(seen.has(e.id))return ['Circular source reference'];if(seen.size>40)return ['Source chain is too deep; review the direct evidence'];const next=new Set(seen);next.add(e.id);
  const active=new Map(actual(d).map(x=>[x.id,x])),out=[];
  for(const ref of e.mystery?.citations||[]){const source=active.get(ref.eventId);
   if(!source)out.push('Unavailable or withdrawn source: '+(d.events.find(x=>x.id===ref.eventId)?.title||ref.eventId));
   else if(ref.fingerprint!==fingerprint(source))out.push('Changed source: '+source.title);
   else if(issues(d,source,next).length)out.push('Source needs review: '+source.title);
  }return [...new Set(out)];
 }
 function board(d,conclusionId){const entries=records(d).filter(e=>e.mystery.links.some(l=>l.conclusionId===conclusionId));
  const valid=entries.filter(e=>!issues(d,e).length),families=[...new Set(valid.filter(e=>e.mystery.independence==='reviewed'&&e.mystery.sourceFamily.trim()).map(e=>e.mystery.sourceFamily.trim().toLowerCase()))];
  const supports=valid.filter(e=>e.mystery.links.some(l=>l.conclusionId===conclusionId&&l.relation==='supports'));
  const contradicts=valid.filter(e=>e.mystery.links.some(l=>l.conclusionId===conclusionId&&l.relation==='contradicts'));
  return {entries,families,supports,contradicts,needsReview:entries.filter(e=>issues(d,e).length),label:entries.some(e=>issues(d,e).length)?'Sources need review':supports.length&&contradicts.length?'Competing evidence':contradicts.length?'Contradicting evidence recorded':entries.length?'Evidence linked — assess the conclusion':'No recorded evidence'};
 }
 function projection(d){return records(d).map(e=>({id:e.id,title:e.title,text:[e.basis,e.status,e.detail,...e.mystery.links.map(l=>(conclusions().find(c=>c.id===l.conclusionId)?.title||l.conclusionId)+' · '+l.relation),'Origin: '+(e.mystery.sourceFamily||'unreviewed'),e.mystery.independence,e.mystery.independenceNote,e.mystery.corroboration,e.mystery.contradiction,e.mystery.limitations,...e.mystery.citations.map(x=>'Cites '+(d.events.find(y=>y.id===x.eventId)?.title||x.eventId)+' · '+x.note),e.mystery.research?JSON.stringify(e.mystery.research):'',...issues(d,e)].filter(Boolean).join(' · ')}));}
 function validate(d,e,story){if(!e.mystery)return [];const m=e.mystery,errors=[];
  if(!m.links.length&&!m.research)errors.push('Link this evidence to a question or a research project.');
  if(m.links.some(l=>!conclusions().some(c=>c.id===l.conclusionId)))errors.push('Choose an available mystery question.');
  if(new Set(m.links.map(l=>l.conclusionId)).size!==m.links.length)errors.push('Use one relationship per question on this outcome.');
  if(m.independence==='reviewed'&&(!m.sourceFamily.trim()||!m.independenceNote.trim()))errors.push('Name the original source family and explain its independence before marking it reviewed.');
  if(m.citations.some(x=>x.eventId===e.id))errors.push('An outcome cannot cite itself.');
  errors.push(...issues(d,e).map(x=>x+'. Recheck the source or remove that dependency.'));
  if(m.research){const r=m.research,p=story?.mystery?.projects.find(x=>x.id===r.projectId);
   if(story&&!p)errors.push('The research project is unavailable. Restore it or remove the research result link.');
   if(!r.projectId||!r.attemptId)errors.push('The research result needs a project and a separate attempt reference.');
   if(!r.question.trim()||!r.prediction.trim()||!r.method.trim()||!r.consent.trim()||!r.interpretation.trim()||!r.publication.trim())errors.push('Record the research question, prediction, actual method, consent, interpretation and publication decision.');
   if(records(d).some(x=>x.id!==e.id&&!e.replaces.includes(x.id)&&x.mystery.research?.attemptId===r.attemptId))errors.push('This research attempt already has an approved result. Correct the existing outcome.');
   if(!e.downtime||e.downtime.activityId!==r.attemptId)errors.push('Keep this research attempt connected to its downtime activity.');
  }return [...new Set(errors)];
 }
 function prepare(story,template={},conclusionId=''){const p=ensure(story);if(p.projects.length>=500)throw Error('Archive or export older projects before adding more.');checkpoint(p);const a=project({...template,id:id('research'),templateId:template.id||'',conclusionId:conclusionId||template.conclusionId||''});p.projects.push(a);return a;}
 function fromConclusion(story,c,route){return prepare(story,{title:c.title,topic:c.topic,stage:c.stage,question:c.question,prediction:'',method:route?.method||'',access:route?.access||'',uncertainty:route?.limit||'',consent:'Confirm access and any witness or subject’s voluntary participation; they may refuse.',corroborates:list(c.corroborates).join('\n'),contradicts:list(c.contradicts).join('\n'),publication:'Keep private until the result and audience are reviewed.',characterIds:route?.characterIds||[],source:c.source||'Approved Echo Below outline; proposed investigation'},c.id);}
 function evidenceDraft(conclusionId='',relation='context'){return {kind:'discovery',title:'',detail:'',source:'',basis:'Observed',status:'confirmed',share:'private',knows:[],recipients:[],mystery:eventMeta({links:conclusionId?[{conclusionId,relation}]:[]})};}
 function beginTrial(story,projectId,at=0){const p=ensure(story).projects.find(x=>x.id===projectId);if(!p)throw Error('Choose a saved research project.');if(p.state==='archived')throw Error('Reopen this project before recording another attempt.');
  const a=globalThis.ECHO_DOWNTIME.prepare(story,{title:'Research · '+p.title,town:p.town,category:'research',minutes:p.minutes,cost:p.cost,requirements:p.access,uncertainty:p.uncertainty,consequences:p.publication,notes:[p.question,p.prediction,p.method,p.consent].join('\n\n'),source:p.source});
  return {...evidenceDraft(p.conclusionId),title:'Research · '+p.title,source:'DM-reviewed investigation result; identify the actual source',mystery:eventMeta({links:p.conclusionId?[{conclusionId:p.conclusionId,relation:'context'}]:[],corroboration:p.corroborates,contradiction:p.contradicts,limitations:p.uncertainty,research:{projectId:p.id,attemptId:a.id,question:p.question,prediction:p.prediction,method:p.method,consent:'',interpretation:'',disposition:'inconclusive',publication:'Keep private; no publication yet.'}}),downtime:{...globalThis.ECHO_DOWNTIME.draft(a,at).downtime,minutes:null,cost:'',result:'partial'}};
 }
 function suggestions(story,d){const stage=stages.indexOf(ensure(story).stage);return conclusions().filter(c=>stages.indexOf(c.stage)<=stage).map(c=>{const b=board(d,c.id);return {conclusion:c,priority:b.needsReview.length?0:b.contradicts.length?1:b.entries.length&&b.families.length<2?2:3,reason:b.needsReview.length?'Recheck changed or withdrawn sources before drawing further conclusions.':b.contradicts.length?'Design a comparison that could distinguish the competing explanations.':!b.entries.length?'Uninvestigated question. Access and discoveries still depend on play.':b.families.length<2?'Seek a genuinely separate origin; another copy of this account will not add independent testimony.':'Compare predictions and limitations. Independent sources still do not prove a conclusion.',routes:c.routes||[]};}).sort((a,b)=>a.priority-b.priority);}
 globalThis.ECHO_MYSTERY={stages,relations,topics,conclusions,eventMeta,project,normalize,ensure,checkpoint,restore,actual,records,fingerprint,citation,issues,board,projection,validate,prepare,fromConclusion,evidenceDraft,beginTrial,suggestions};
})();

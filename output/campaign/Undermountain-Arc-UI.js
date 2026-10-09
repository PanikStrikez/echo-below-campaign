/* A compact private arc guide in the existing Story sidebar. */
(() => {
  'use strict';
  let selected='map',tab='plan',beatId='',roomId='',person='kestrel';
  const expanded=new Set();
  function open(id){if(id)selected=id;globalThis.ECHO_STORY_UI.open('undermountain-arc');}
  function render(root,host){
    const A=globalThis.ECHO_UNDERMOUNTAIN_ARC,C=globalThis.ECHO_UNDERMOUNTAIN_ARC_CAST;
    const p=A.get(selected)||A.packages()[0],story=host.story(),ctx=host.expeditionContext();
    selected=p.id;
    const refresh=()=>globalThis.ECHO_STORY_UI.render(true);
    const el=(tag,text,parent,cls)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;parent.append(n);return n;};
    const button=(parent,label,fn)=>{const b=el('button',label,parent);b.type='button';b.onclick=async()=>{b.disabled=true;try{await fn();}catch(e){host.toast(e.message);}finally{if(b.isConnected)b.disabled=false;}};return b;};
    const section=(title,help)=>{const s=el('section',null,root,'story-section');el('h3',title,s);if(help)el('p',help,s,'help');return s;};
    const details=(parent,title,key=title)=>{const d=el('details',null,parent,'story-card');el('summary',title,d);d.open=expanded.has(key);d.ontoggle=()=>{if(!d.isConnected)return;d.open?expanded.add(key):expanded.delete(key);};return d;};
    const lines=(parent,title,values)=>{if(!values?.length)return;if(title)el('h4',title,parent);for(const v of Array.isArray(values)?values:[values])el('p',typeof v==='string'?v:JSON.stringify(v),parent);};
    const select=(parent,label,value,choices,change)=>{const l=el('label',label,parent,'story-field'),s=el('select',null,l);s.setAttribute('aria-label',label);for(const [id,title]of choices){const o=el('option',title,s);o.value=id;}s.value=value;s.onchange=()=>change(s.value);return s;};
    const sources=(parent,items)=>{for(const s of items||[]){if(typeof s==='string')el('p',s,parent,'help');else if(s.book&&s.page)button(parent,`${s.label||s.book} · printed p. ${s.page}`,()=>host.openPrinted(s.book,s.page));else if(s.label)el('p',s.label,parent,'help');if(s.note)el('p',s.note,parent,'help');}};
    const visual=(parent,id,title)=>{const scene=host.transitionScene(id);if(!scene)return;const box=details(parent,'Preview visual · '+title,'arc-image-'+id);const image=el('img',null,box);image.src=host.prepImage(scene.image);image.alt='DM preview: '+scene.title;image.style.cssText='width:100%;max-height:260px;object-fit:contain';el('p','Preview only. Use the scene preview’s Show on TV button when ready.',box,'help');if(host.scenes().some(s=>s.id===id))button(box,'Stage this visual for TV review',()=>{globalThis.ECHO_STORY_UI.close();host.prepPreviewScene(id);});else el('p','Open the saved Level 1 session to stage this visual.',box,'help');};
    let s=section('First Undermountain expeditions','Choose a prepared contract. Recorded outcomes take precedence over these future plans.');
    select(s,'Expedition package',selected,A.packages().map(x=>[x.id,x.title]),id=>{selected=id;beatId='';roomId='';refresh();});
    const nav=el('div',null,s,'button-row');for(const [id,label]of [['plan','Plan & route'],['scenes','Run scenes'],['crew','Gilded Compass'],['return','Return & consequences']])button(nav,label,()=>{tab=id;refresh();}).setAttribute('aria-pressed',String(tab===id));
    const setup=details(s,'Preparation and saved dungeon','arc-controls'),controls=el('div',null,setup,'button-row');button(controls,'Add this lead to session board',async()=>{
      const prep=globalThis.ECHO_QUEST_PREP.ensure(story),target=prep.target,catalog=await host.prepContext(target);
      if(host.story()!==story||prep.target!==target)throw Error('Campaign or preparation board changed. Choose the lead again.');
      A.addToBoard({...catalog,story,continuity:host.continuity(),prep,sessionId:target,roster:host.roster()},p.id);
      host.save('Added expedition contract to preparation board');globalThis.ECHO_QUEST_PREP_UI.openBoard();
    });button(controls,'Quest resources & publication',()=>globalThis.ECHO_QUEST_PREP_UI.openQuest(p.questId));
    button(controls,'Saved expedition & return',()=>globalThis.ECHO_STORY_UI.open('expeditions'));
    const sessions=host.arcSessions();
    if(!sessions.length)button(setup,'Create Level 1 session · switches table',async()=>{await host.arcCreate();refresh();});
    else{let session=sessions.find(x=>x.id===host.sessionId())?.id||sessions[0].id;select(setup,'Saved Level 1 dungeon',session,sessions.map(x=>[x.id,x.name]),v=>session=v);button(setup,'Review return to this saved dungeon',()=>host.arcReturn(session));}
    el('p','Reuse this save for all three sorties. Returning from town carries current party resources after review. It never recreates the floor.',setup,'help');
    const actual=globalThis.ECHO_CONTINUITY.effective(host.continuity()).filter(e=>e.approved&&['confirmed','completed'].includes(e.status)&&e.quests.some(q=>q.id===p.questId));
    const history=details(s,'Approved outcomes for this contract');if(!actual.length)el('p','No approved actual-play outcome is linked to this contract.',history);for(const e of actual)el('p',e.title+': '+e.detail,history);

    if(tab==='plan'){
      s=section(p.title,p.summary);lines(s,'Before offering it',p.prerequisites);
      const contract=details(s,'Offer, payment and honest partial success');for(const [key,value]of Object.entries(p.contract))el('p',key.replace(/^./,c=>c.toUpperCase())+': '+value,contract);lines(contract,'Earned rewards · record actual delivery',p.rewards);
      if(p.placement){const placement=details(s,'Instrument placement and existing custody');for(const [key,value]of Object.entries(p.placement))if(key!=='id')lines(placement,key.replace(/([A-Z])/g,' $1'),value);el('p','Choose the branch supported by the saved room and custody record before making the offer. This card creates no item.',placement,'help');}
      el('h4','Connected route',s);el('p',p.route.description,s);lines(s,'Other approaches',p.route.alternatives);lines(s,'Retreat and regroup',Array.isArray(p.route.retreat)?p.route.retreat:[p.route.retreat]);
      const atlas=details(s,'Floor maps & tactical sections');
      el('p','One saved Level 1 floor serves all three contracts. Prepare a section privately, then Show on TV with its current fog. Gates, secret doors and custom hooks remain DM decisions.',atlas,'help');
      button(atlas,'Open Level 1 map package',()=>globalThis.ECHO_ATLAS_UI?.open({boardId:'undermountain-level-1'}));
      const focusIds={map:['entry','north'],instrument:['entry','excavation'],passage:['north','western']};
      for(const m of globalThis.UNDERMOUNTAIN_MAP_COLLECTION?.maps||[])if(m.isFloorMaster||focusIds[p.id]?.some(key=>m.id.includes(key)))button(atlas,m.title,()=>globalThis.ECHO_ATLAS_UI?.open({boardId:m.sceneId}));
      const map=details(s,'Marked source map · DM only');const img=el('img',null,map);img.src='private-maps/madmage-floor-1.jpg';img.alt='Private Dungeon Level map with room keys';img.style.cssText='width:100%;height:auto';el('p','Printed p. 15, one source square = 10 feet. Never publish this marked map. Use the reviewed floor package with saved fog, or retain the existing tactical canvas.',map,'help');button(map,'Open full marked source map',()=>host.openPrinted('madMage',15));
      const rooms=p.route.rooms.map(id=>globalThis.ECHO_WATERDEEP_DATA.rooms.find(r=>r.id===id)).filter(Boolean);roomId=rooms.some(r=>r.id===roomId)?roomId:rooms[0]?.id;
      if(rooms.length){select(s,'Keyed room to prepare',roomId,rooms.map(r=>[r.id,r.number+'. '+r.title]),id=>{roomId=id;refresh();});const r=rooms.find(r=>r.id===roomId),live=ctx.extras.expedition?.rooms[r.id];el('p','Saved status: '+(live?.status||'unvisited / not recorded')+'. '+(live?.survivors||''),s,'story-note');
        const key=details(s,'Room, inhabitants, hazards and full stats','arc-room-'+r.id);lines(key,'Say aloud only if still accurate',[r.read]);lines(key,'Run this location',[r.run,r.aftermath]);button(key,'Open keyed room · p. '+r.page,()=>host.openPrinted('madMage',r.page));for(const c of r.creatures)button(key,'Full stats · '+c.name+' · p. '+c.page,()=>host.openPrinted(c.book,c.page));button(key,'Open saved room card',()=>host.arcRoom(r.id));el('p','Review saved survivors before adding or placing creatures. The marked map determines positions; selecting this card spawns nothing.',key,'help');}
      const spots=details(s,'Spotlight invitations · all five characters');for(const [id,text]of Object.entries(p.spotlights)){el('h4',host.roster().find(x=>x.id===id)?.name||id.replace('pc-',''),spots);lines(spots,'',Array.isArray(text)?text:[text]);}button(spots,'Open spotlight tracker',()=>globalThis.ECHO_STORY_UI.open('spotlights'));
      const limits=details(s,'Sources and boundaries');lines(limits,'Keep these limits',p.limits);sources(limits,p.sources);return;
    }
    if(tab==='scenes'){
      const all=A.beats(p.id);beatId=all.some(b=>b.id===beatId)?beatId:all[0].id;
      s=section('One scene at a time','Use the branch that matches actual play. Preparations and optional clues do not become player knowledge automatically.');
      select(s,'Arc scene',beatId,all.map(b=>[b.id,b.title]),id=>{beatId=id;refresh();});const b=all.find(b=>b.id===beatId);lines(s,'Say aloud',b.read);lines(s,'Ask',b.ask);
      const run=details(s,'Choices, checks and running notes','arc-beat-'+b.id);lines(run,'Run',b.run);lines(run,'Choices',b.choices);lines(run,'Private context',b.private);sources(run,b.sources);
      for(const c of b.creatures||[]){el('p',`${c.count||''} ${c.name} · ${c.note||'Use the saved inhabitants, not a fresh wave.'}`,run);button(run,'Full stats · '+c.name+' · p. '+c.page,()=>host.openPrinted(c.book,c.page));}
      if(b.spotlight?.length){const spots=details(s,'Character invitations for this return');for(const item of b.spotlight){el('h4',host.roster().find(x=>x.id===item.characterId)?.name||item.characterId,spots);el('p',item.offer,spots);el('p','If they pass: '+item.fallback,spots);}}
      visual(s,b.scene,b.title);if(host.beats().some(x=>x.id===b.id))button(s,'Open these live scene notes',()=>{globalThis.ECHO_STORY_UI.close();host.selectBeat(b.id);});
      button(s,'Record what actually happened',()=>globalThis.ECHO_STORY_UI.outcome({kind:'other',title:b.title,detail:'',source:'DM table record',share:'private',status:'confirmed',quests:[{id:p.questId,state:'reference',stepId:''}]}));
      const handouts=details(s,'Player briefs and private letter drafts');for(const h of C.handouts.filter(h=>h.arc===p.id)){el('h4',h.title,handouts);el('p',h.body,handouts);el('p','Audience: '+(h.owner||h.audience||'shared phones')+'. '+(h.publishWhen||''),handouts,'help');if(h.owner)button(handouts,'Stage private letter for '+(host.roster().find(x=>x.id===h.owner)?.name||h.owner),()=>host.arcLetter(h));else if(h.id.endsWith('-brief'))button(handouts,'Prepare this wording in quest publication',()=>{const d=host.continuity(),old=d.questGuide.records[h.questId]?.draft;if((old?.title||old?.text)&&!confirm('Replace this quest’s unpublished wording with the prepared brief? Its published version remains as it is.'))return;A.stageBrief(d,h.id);host.save('Staged player-safe contract wording');globalThis.ECHO_QUESTS_UI.open(h.questId);});}el('p','Publish a side quest through Quest resources & publication. Send a personal letter only through Private clues on phones after its stated contact conditions occur.',handouts,'help');button(handouts,'Open phone clue controls',()=>host.arcPhones());return;
    }
    if(tab==='crew'){
      s=section('The Gilded Compass','Their relationships and jobs continue when the party declines a meeting. New actions remain proposals until supported by events.');
      select(s,'Crew member',person,C.rivals.map(n=>[n.id,n.name]),id=>{person=id;refresh();});const n=C.rivals.find(n=>n.id===person)||C.rivals[0];
      for(const key of ['role','appearance','voice','goal'])if(n[key])el('p',key[0].toUpperCase()+key.slice(1)+': '+n[key],s);
      for(const [key,title]of [['relationships','Independent relationships'],['knowledge','What they can know'],['limits','Boundaries']])lines(s,title,Array.isArray(n[key])?n[key]:n[key]?[n[key]]:[]);
      lines(s,'Optional dialogue',n.say);for(const offer of n.offers||[]){const card=details(s,offer.title);el('p',offer.terms,card);el('p','If declined: '+offer.decline,card);}
      const actual=globalThis.ECHO_COURTYARD.relationship(host.continuity(),n.id);lines(s,'Approved knowledge',actual.knowledge.map(e=>e.title+': '+e.detail));for(const [key,value]of Object.entries(actual.changes))el('p','Recorded '+key+': '+value,s,'story-note');
      const plans=details(s,'Plans and responses · review before use');for(const plan of n.plans||[])for(const [key,value]of Object.entries(plan))lines(plans,key,Array.isArray(value)?value:[value]);
      button(s,'Record an interaction with '+n.name,()=>globalThis.ECHO_STORY_UI.outcome({kind:'other',title:n.name+' · expedition interaction',detail:'',status:'confirmed',source:'DM table record',share:'private',relationships:[{npcId:n.id,changes:{last:''},promiseKeys:[]}],quests:[{id:p.questId,state:'reference',stepId:''}]}));button(s,'Open existing NPC record',()=>globalThis.ECHO_STORY_UI.openPerson(n.id));return;
    }
    s=section('Return with what actually happened','Resolve payment, claims, discoveries and promises through Outcome review. Use the persistent expedition report for dungeon changes.');lines(s,'City-return possibilities',p.returns);
    for(const b of (C.returns||[]).filter(b=>b.arc===p.id)){const scene=details(s,b.title);lines(scene,'Say aloud',b.read);lines(scene,'Run',b.run);lines(scene,'Private conditions',b.private);button(scene,'Prepare this return scene',()=>{tab='scenes';beatId=b.id;refresh();});}
    const record=ctx.extras.expeditions?.records.find(r=>r.sessionId===ctx.sessionId&&r.sceneIds.includes('um1-table'));
    for(const [i,response]of p.responses.entries()){const d=details(s,response.title||response.trigger);el('p','Only if: '+response.trigger,d);lines(d,'Evidence to verify',Array.isArray(response.evidence)?response.evidence:[response.evidence]);el('p','Proposed response: '+response.proposal,d);lines(d,'Preserve',response.preserves);button(d,'Stage response for DM review',()=>{A.proposal(ctx,record,p.id,i);host.expeditionSave('Prepared conditional expedition response');globalThis.ECHO_EXPEDITIONS_UI.open(record.id,'developments');}).disabled=!record;}
    if(!record)el('p','Open and track the saved first floor before staging a precise dungeon development.',s,'help');
    button(s,'Review expedition report',()=>globalThis.ECHO_STORY_UI.open('expeditions'));button(s,'Review rest and downtime',()=>globalThis.ECHO_STORY_UI.open('downtime'));button(s,'Record delivery or reward',()=>globalThis.ECHO_STORY_UI.outcome({kind:'other',title:p.title+' · delivery and agreed reward',detail:'',source:'DM table record',status:'confirmed',share:'private',quests:[{id:p.questId,state:'reference',stepId:''}]}));
  }
  globalThis.ECHO_UNDERMOUNTAIN_ARC_UI={open,render};
})();

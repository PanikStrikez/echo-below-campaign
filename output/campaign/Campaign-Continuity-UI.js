(() => {
  'use strict';
  let tab='events', selected='', recapSession='', recapText='';
  const api=()=>globalThis.ECHO_CONTINUITY;
  function render(root,host){
    if(tab==='events'&&globalThis.ECHO_OUTCOMES_UI){globalThis.ECHO_OUTCOMES_UI.render(root,host);return;}
    const d=host.continuity(),el=(tag,text,parent,cls)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;parent.append(n);return n;};
    const button=(p,label,fn)=>{const b=el('button',label,p);b.type='button';b.addEventListener('click',fn);return b;};
    const section=(title,note='')=>{const s=el('section',null,root,'story-section');el('h3',title,s);if(note)el('p',note,s,'help');return s;};
    const refresh=()=>globalThis.ECHO_STORY_UI.render();
    const save=label=>{host.save(label);refresh();};
    const mutate=(fn,label='Campaign continuity updated')=>{api().checkpoint(d);fn();save(label);};
    const field=(p,label,value,fn,multi=false,max=1800)=>{const l=el('label',label,p,'story-field'),i=el(multi?'textarea':'input',null,l);i.value=value??'';i.maxLength=max;if(multi)i.rows=3;else i.type='text';i.addEventListener('change',()=>mutate(()=>fn(i.value.slice(0,max)),label));return i;};
    const select=(p,label,value,options,fn,persist=true)=>{const l=el('label',label,p,'story-field'),i=el('select',null,l);for(const [key,text]of options){const o=el('option',text,i);o.value=key;}i.value=value;i.addEventListener('change',()=>{if(persist)mutate(()=>fn(i.value),label);else{fn(i.value);refresh();}});return i;};
    const check=(p,label,value,fn)=>{const l=el('label',null,p,'story-field'),i=el('input',null,l);i.type='checkbox';i.checked=value;el('span',label,l);i.addEventListener('change',()=>mutate(()=>fn(i.checked),label));};
    const newEvent=values=>{if(globalThis.ECHO_OUTCOMES_UI){globalThis.ECHO_OUTCOMES_UI.start(host,values);return;}const e=api().event({id:`event-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,session:host.sessionName(),title:'New campaign event',source:'DM table record',...values});mutate(()=>{d.events.push(e);selected=e.id;tab='events';},'Added campaign draft');};
    let s=section('Campaign continuity','One record follows this campaign across sessions. Planned events never become history automatically. Approval confirms the record; “Shared with party” controls what reaches journals, phones, map notes, and recap drafts.');
    const nav=el('div',null,s,'button-row');
    for(const [id,name]of [['guide','Quest guide'],['events','Events'],['quests','Quest cards'],['tracks','Promises & custody'],['recap','Next-session recap']])button(nav,name,()=>{tab=id;refresh();}).disabled=tab===id;
    button(nav,'Undo continuity change',()=>{if(api().restore(d))save('Undo continuity change');}).disabled=!d.undo.length;
    button(nav,'Redo continuity change',()=>{if(api().restore(d,true))save('Redo continuity change');}).disabled=!d.redo.length;
    if(tab==='guide')globalThis.ECHO_QUESTS_UI?.render(root,host);
    if(tab==='events'){
      s=section('Actual-play record',d.sessionNotes);
      button(s,'Add event',()=>newEvent({}));
      if(!d.events.some(e=>e.id===selected))selected=d.events.at(-1)?.id||'';
      select(s,'Event',selected,[...d.events].reverse().map(e=>[e.id,`${e.approved?'✓':'Draft'} · ${e.session} · ${e.title}`]),v=>{selected=v;},false);
      const e=d.events.find(e=>e.id===selected);if(!e)return;
      const edit=fn=>{fn();e.approved=false;e.approvedAt='';};
      s=section(e.title,`${e.approved?'Approved':'Draft — edits require approval'} · ${e.status} · ${e.share==='party'?'Shared wording prepared':'Private'}`);
      field(s,'Title',e.title,v=>edit(()=>e.title=v),false,120);
      field(s,'Session / date',e.session,v=>edit(()=>e.session=v),false,80);
      select(s,'Record type',e.status,api().STATES.map(x=>[x,({planned:'Planned — has not happened',rumor:'Rumor — unverified account',confirmed:'Confirmed fact',completed:'Completed event'})[x]]),v=>edit(()=>e.status=v));
      select(s,'Evidence basis',e.basis,['Observed','Inferred','Claimed','Open'].map(x=>[x,x]),v=>edit(()=>e.basis=v));
      field(s,'Private details',e.detail,v=>edit(()=>e.detail=v),true,2500);
      field(s,'Source / who confirmed it',e.source,v=>edit(()=>e.source=v),false,250);
      field(s,'Player-safe wording',e.playerText,v=>edit(()=>e.playerText=v),true,1800);
      check(s,'Shared with the whole party',e.share==='party',v=>edit(()=>{e.share=v?'party':'private';e.knows=e.knows.filter(id=>id!=='party');if(v)e.knows.push('party');}));
      const knowledge=el('details',null,s);el('summary','Who actually knows this',knowledge);
      el('p','A source being named is not proof they know every fact. Select only characters or NPCs who learned this event.',knowledge,'help');
      for(const person of [...host.roster(),...host.story().npcs])check(knowledge,person.name,e.knows.includes(person.id),v=>edit(()=>{e.knows=e.knows.filter(id=>id!==person.id);if(v)e.knows.push(person.id);}));
      const links=el('details',null,s);el('summary','Connect quests, locations, and ongoing obligations',links);
      for(const q of d.quests)select(links,q.title,e.quests.find(l=>l.id===q.id)?.state||'none',[['none','Not linked'],['reference','Reference only'],['active','Quest is active'],['completed','Objective completed'],['failed','Objective failed']],v=>edit(()=>{e.quests=e.quests.filter(l=>l.id!==q.id);if(v!=='none')e.quests.push({id:q.id,state:v});}));
      const markers=host.continuityMarkers();
      button(links,'Link a map marker',()=>mutate(()=>edit(()=>e.markers.push({scene:markers[0]?.scene||'region-lmop',point:markers[0]?.point||'',reveal:false}))));
      e.markers.forEach((m,i)=>{
        select(links,`Map link ${i+1}`,`${m.scene}|${m.point}`,markers.map(p=>[`${p.scene}|${p.point}`,p.title]),v=>edit(()=>{[m.scene,m.point]=v.split('|');}));
        check(links,'Reveal this marker after approval (party-known facts only)',m.reveal,v=>edit(()=>m.reveal=v));
        button(links,'Remove map link',()=>mutate(()=>edit(()=>e.markers.splice(i,1))));
      });
      button(links,'Track a promise, debt, person, or item',()=>mutate(()=>edit(()=>e.tracks.push({kind:'promise',key:`track-${Date.now()}`,subject:'',holder:'',owedTo:'',state:'open',note:''}))));
      e.tracks.forEach((t,i)=>{const box=el('div',null,links,'story-card');
        select(box,'Track',t.kind,api().TRACKS.map(x=>[x,x]),v=>edit(()=>t.kind=v));
        field(box,'Person / item / promise',t.subject,v=>edit(()=>t.subject=v),false,120);
        field(box,'Holder / location / responsible person',t.holder,v=>edit(()=>t.holder=v),false,120);
        field(box,'Owed to',t.owedTo,v=>edit(()=>t.owedTo=v),false,120);
        select(box,'State',t.state,[['open','Open'],['resolved','Resolved'],['unknown','Unknown']],v=>edit(()=>t.state=v));
        field(box,'Details, amount, terms, deadline',t.note,v=>edit(()=>t.note=v),true,500);
        button(box,'Remove tracking link',()=>mutate(()=>edit(()=>e.tracks.splice(i,1))));
      });
      const preview=section('Approval preview', e.share==='party'?'The title, player-safe wording, and all linked tracking fields below will be visible to the party. Private details, sources, and NPC knowledge stay on the DM screen.':'');
      if(e.share==='party')for(const t of e.tracks)el('p',`${t.kind}: ${t.subject} · ${t.holder} · ${t.owedTo} · ${t.state} · ${t.note}`,preview,'help');
      el('p',e.status==='planned'?'This stays a plan and cannot complete quests, reveal map markers, or enter a recap.':e.share==='party'?`Shared ${e.status} · ${e.title}: ${e.playerText||'(add player-safe wording)'}`:'Private: this will not enter shared maps, journals, or recaps.',preview,'story-note');
      el('p',`${e.quests.length} quest links · ${e.markers.filter(m=>m.reveal).length} requested marker reveals · ${e.tracks.length} tracked obligations/items.`,preview,'help');
      button(preview,e.approved?'Approved':'Approve this record',()=>{
        if(!e.title.trim()||!e.detail.trim()||!e.source.trim()){host.toast('Add a title, details, and source before approval.');return;}
        if(e.share==='party'&&!e.playerText.trim()){host.toast('Add player-safe wording before sharing.');return;}
        if(e.tracks.some(t=>!t.subject.trim())){host.toast('Name each tracked person, item, or promise.');return;}
        if(!confirm('Approve this record and apply the displayed quest, knowledge, journal, and map links?'))return;
        mutate(()=>{e.approved=true;e.approvedAt=new Date().toISOString();},'Approved campaign record');
      }).disabled=e.approved;
      button(preview,'Withdraw approval',()=>mutate(()=>{e.approved=false;e.approvedAt='';},'Withdrew campaign approval')).disabled=!e.approved;
      button(preview,'Delete event',()=>{if(confirm(`Delete “${e.title}”? Linked views will update; continuity Undo can restore it.`))mutate(()=>{d.events=d.events.filter(x=>x.id!==e.id);selected='';},'Deleted campaign event');});
      const legacy=section('Older notes','Existing evidence stays intact. Import an entry as an unapproved draft before relying on it in linked campaign views.');
      for(const item of host.story().evidence.filter(item=>!d.events.some(e=>e.id===`evidence-${item.id}`)))button(legacy,`Review evidence: ${item.title}`,()=>mutate(()=>{const e=api().adoptEvidence(item);d.events.push(e);selected=e.id;},'Imported evidence draft'));
    }
    if(tab==='quests'){
      s=section('Quest cards','Quest status comes from approved confirmed facts or completed events. Rumors and plans remain visible as leads without completing objectives.');
      button(s,'Add quest',()=>{const title=prompt('Quest title:');if(title?.trim())mutate(()=>d.quests.push({id:`quest-${Date.now()}`,title:title.trim().slice(0,120),goal:''}));});
      for(const q of api().questCards(d)){const box=el('article',null,s,'story-card');el('h4',`${q.title} · ${q.state}`,box);el('p',q.goal,box);
        for(const e of q.events)button(box,`${e.approved?'':'Draft · '}${e.status}: ${e.title}`,()=>{if(globalThis.ECHO_OUTCOMES_UI){globalThis.ECHO_OUTCOMES_UI.start(host,{},e.id);return;}selected=e.id;tab='events';refresh();});
      }
    }
    if(tab==='tracks'){
      s=section('Promises, debts, rescues, escapes, and custody','The latest approved factual update for the same tracked entry wins. Amounts and locations stay unknown unless recorded. Changes here create a new draft event, preserving history.');
      for(const t of api().trackers(d)){const box=el('article',null,s,'story-card');el('h4',`${t.kind} · ${t.subject} · ${t.state}`,box);el('p',[t.holder,t.owedTo&&`Owed to: ${t.owedTo}`,t.note,t.session].filter(Boolean).join(' · '),box);
        button(box,'Record an update',()=>newEvent({title:`Update: ${t.subject}`,status:'confirmed',tracks:[{...t}],detail:'',share:'private'}));
        button(box,'Open source event',()=>{if(globalThis.ECHO_OUTCOMES_UI){globalThis.ECHO_OUTCOMES_UI.start(host,{},t.eventId);return;}selected=t.eventId;tab='events';refresh();});
      }
    }
    if(tab==='recap'){
      s=section('Next-session recap · private draft','Only approved, party-known facts and completed events are included. Approved rumors are explicitly labeled. Private facts and planned scenes are excluded.');
      const sessions=[...new Set(d.events.map(e=>e.session))];if(!sessions.includes(recapSession)&&recapSession!=='all')recapSession=sessions.at(-1)||'all';
      select(s,'Use events from',recapSession,[['all','All recorded sessions'],...sessions.map(x=>[x,x])],v=>{recapSession=v;recapText='';},false);
      button(s,'Generate draft from approved events',()=>{recapText=api().recap(d,recapSession);refresh();});
      const l=el('label','Review and edit before publishing',s,'story-field'),input=el('textarea',null,l);input.rows=9;input.value=recapText;input.addEventListener('input',()=>{recapText=input.value;});
      button(s,'Save unpublished journal draft',()=>{
        if(!recapText.trim()||recapText.length>2500){host.toast('Use 1–2,500 characters for one journal draft. Choose a session or shorten the text.');return;}
        const recapId=`recap-${Date.now()}`;if(globalThis.ECHO_OUTCOMES)d.outcomes.summaries.push({id:recapId,session:recapSession,fingerprint:globalThis.ECHO_OUTCOMES.fingerprint(d,recapSession)});
        host.story().journal.unshift({id:recapId,title:`Recap · ${recapSession}`,text:recapText,kind:'recap',when:recapSession,source:'Approved campaign events; DM-reviewed draft',published:false});save('Saved unpublished continuity recap');host.toast('Saved in Player journal. Publish there when ready.');
      });
    }
  }
  globalThis.ECHO_CONTINUITY_UI={render,stageRecap:(value)=>{recapText=String(value||'');recapSession='all';tab='recap';},selectTab: value=>{if(['guide','events','quests','tracks','recap'].includes(value))tab=value;}};
})();

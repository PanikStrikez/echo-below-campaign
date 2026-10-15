/* Original fictional content; requested only when this example is chosen. */
(()=>{
 const blank=(...args)=>ECHO_TEMPLATES.blank(...args);
 function example(name='Lantern Ferry · example'){
  const a=blank(name);a.installedPacks=[{id:'lantern-ferry',version:'1.0.0'}];
  const s=a.sessions[0].state;s.scene='ferry';s.scenes.push({id:'ferry',title:'Lantern Ferry',kind:'map',image:'assets/Example-Ferry.svg',grid:true,fog:false,gridColumns:24});
  s.runbookBeats=[{id:'arrival',title:'The broken ferry',scene:'ferry',read:['Lanterns sway over a quiet river. A ferry waits between two worn jetties, its guiding rope hanging loose.', 'The two jetties give you places to inspect the crossing from either bank. The slack rope offers a visible problem, while the water keeps its own steady course. You can check the ferry before deciding whether to repair it or seek another way.'],ask:['Will you repair the crossing, seek another route, or speak to the keeper?'],run:['Lysa asks for help repairing the guide rope. Accept plans beyond the prepared options.'],private:['Prepared fiction. No outcome has happened until you confirm it.']}];
  for(const [id,name,player]of [['pc-mira','Mira','Example player 1'],['pc-oswin','Oswin','Example player 2']]){
   const abilities={str:12,dex:14,con:12,int:10,wis:13,cha:10};
   s.party[id]={id,name,player,role:'pc',level:1,className:'Fighter',rules:'2014',source:'Original demonstration',sourceStatus:'Fictional example',abilities,proficiency:2,ac:13,hp:12,maxHp:12,tempHp:0,speed:30,hitDice:{current:1,max:1,die:'d10'},attacks:[{id:'staff',name:'Quarterstaff',type:'Action',attackBonus:3,damageDice:'1d6+1',damageType:'bludgeoning',prepared:true,effect:'Melee 5 ft.'}],resources:[]};
   s.tokens.push({id,name,label:name.slice(0,2),team:'pc',type:'hero',hp:12,maxHp:12,tempHp:0,ac:13,scene:'ferry',placed:true,visible:true,x:id==='pc-mira'?27:33,y:49,initBonus:2,conditions:[]});
  }
  a.tableExtras.travel.places=[{id:'ferry-crossing',title:'River crossing',x:50,y:50,status:'located',arrival:{scene:'ferry',narration:'',ambience:''}}];
  a.story.questPrep={target:'session-01',links:{crossing:{scenes:['ferry'],beats:['arrival'],npcs:['lysa']}}};
  a.story.npcs=[{id:'lysa',name:'Lysa Reed',goal:'Reopen the crossing safely.',voice:'Plain and patient',source:'Original fictional example',notes:'A prepared NPC; no meeting or agreement recorded.'}];
  const g=a.story.continuity.questGuide;
  g.customQuests=[{id:'crossing',title:'Restore the crossing',goal:'Choose a safe way across the river.',kind:'main',steps:[{id:'safe-crossing',title:'Establish a safe route',goal:'Repair, negotiate or find another way.'}],leads:['Talk to Lysa','Inspect the ferry','Seek another route']},{id:'parcel',title:'Deliver the parcel',goal:'Ask Lysa where the sealed parcel should go.',kind:'side'},{id:'miras-letter',title:'A letter for Mira',goal:'Find the person named on your letter.',kind:'character',owner:'pc-mira',dm:'Private fictional hook; Oswin does not know it.'}];
  for(const q of g.customQuests)g.records[q.id]={status:'active',draft:{title:q.title,text:q.goal},published:{title:q.title,text:q.goal,state:'active',audience:q.owner||'party',at:'2026-10-11T00:00:00Z'}};
  a.presentation.media=[{id:'ferry-map',name:'Lantern Ferry',kind:'image',category:'map',mime:'image/svg+xml',path:'assets/Example-Ferry.svg',audience:'table',source:'Original fictional example',license:'Original project artwork'}];
  return a;
 }
 globalThis.ECHO_EXAMPLE_FACTORY=example;
})();

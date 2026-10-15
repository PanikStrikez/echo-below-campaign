/* Read-only card adapters. Saved character records remain the source of statistics. */
(() => {
 'use strict';
 const copy=structuredClone,ids=['pc-trista','pc-pebble','pc-ringgo','pc-donavan','pc-aldric'];
 const labels={supported:'Reviewed roll',choice:'Choose details',reference:'Manual ruling'};
 const phb=(page,rule)=>({book:'2014 PHB',printedPage:page,rule,confidence:'verified rule / approved sheet'});
 const monk=rule=>({book:'2024 Monk exception',printedPage:null,rule,url:'https://www.dndbeyond.com/sources/dnd/br-2024/character-classes',confidence:'official rules / approved exception'});
 const special=(book,rule)=>({book,printedPage:null,rule,confidence:'approved table choice'});
 const cards={};
 const spellPages={'Dancing Lights':230,Prestidigitation:267,'Ray of Frost':271,'Spare the Dying':277,Guidance:248,Command:223,Identify:252,'Detect Magic':231,'Comprehend Languages':224,'Find Familiar':240,'Magic Missile':257,Shield:275,'Disguise Self':233,'Feather Fall':239,'Witch Bolt':289,'Silent Image':276,'Cure Wounds':230,'Healing Word':250,'Shield of Faith':275,Bane:216,Bless:219,'Create or Destroy Water':229,'Detect Evil and Good':231,'Detect Poison and Disease':231,'Guiding Bolt':248,'Inflict Wounds':253,'Protection from Evil and Good':270,'Purify Food and Drink':270,Sanctuary:272,Thaumaturgy:282,'Mage Hand':256,'Mage Armor':256,'Fire Bolt':242,'Silvery Barbs':null};
 const add=(names,kind,status,reason,source)=>names.forEach(name=>cards[name]={kind,status,reason,source});
 add(['Magic Missile'],'missile','choice','Allocate every dart; confirm visibility, range and any Shield. One slot pays for the entire spell.',phb(257,'Magic Missile'));
 add(['Shield'],'shield','choice','Confirm the triggering attack or Magic Missile. Reaction, slot, +5 AC and expiry are reviewed together.',phb(275,'Shield'));
 add(['Healing Word','Cure Wounds'],'healing','supported','One selected target, selected slot, healing dice and spellcasting modifier.',phb(250,'Healing Word / Cure Wounds p. 230'));
 add(['Toll the Dead','Toll the Dead · wounded target'],'toll','choice','Use d12 only when the target is missing HP; Wisdom save uses Donavan’s cleric DC.',special('Xanathar’s Guide; character exception','Toll the Dead'));
 add(['Flurry of Blows'],'flurry','choice','Choose exactly two strikes and their targets. Spend one Focus and one bonus action for both.',monk('Flurry of Blows'));
 add(['Patient Defense','Patient Defense + Dodge','Step of the Wind','Step of the Wind + Disengage'],'mobility','choice','Review the free or paid variant. Costs and benefit reminders are structured; movement, Dodge and opportunity attacks need a situational DM check.',monk('Patient Defense / Step of the Wind'));
 add(['Uncanny Metabolism'],'uncanny','choice','Confirm initiative was rolled. Restore Focus and roll healing; spend the once-per-long-rest use.',monk('Uncanny Metabolism'));
 add(['Second Wind'],'healing','supported','Self-healing, one bonus action and one use; uses the recorded Fighter level.',phb(72,'Second Wind'));
 add(['Action Surge'],'surge','supported','Spend one use on your own turn; make one additional action available. Does not grant a bonus action.',phb(72,'Action Surge'));
 add(['Arcane Recovery'],'recovery','choice','Confirm a short rest and choose expended slots. Donavan can recover one slot level; Aldric two.',phb(115,'Arcane Recovery'));
 add(['Cunning Action: Dash','Cunning Action: Disengage'],'cunning','choice','Bonus-action usage and benefit reminders are structured; movement and opportunity attacks remain under DM control.',phb(96,'Cunning Action'));
 add(['Cunning Action: Hide'],'hide','reference','Hiding requires cover, visibility and a Stealth check; the DM decides whether hiding succeeds.',phb(177,'Hiding; Cunning Action p. 96'));
 add(['Sneak Attack','Assassinate','Piercer: reroll damage','Piercer: critical hit'],'weapon-addon','reference','Use these choices inside Ringgo’s weapon review. Do not resolve this as a separate damaging attack.',special('2014 PHB pp. 96–97; Tasha’s feat exception','Sneak Attack / Assassinate / Piercer'));
 add(['Improved Critical','Fire-Forged'],'passive','reference','Already included in qualifying weapon rolls or recorded fire resistance. Do not spend an action.',special('2014 Champion / approved Goron lineage','Passive defense or critical range'));
 add(['Rock Eater'],'reference','reference','Ordinary stone is food. Magical stone needs a separate approved manifestation, uses and 24-hour expiry.',special('Goron homebrew approved 9 October 2026','Rock Eater'));
 add(['Interception','Deflect Attacks','Redirect deflected attack','Slow Fall'],'reaction-manual','reference','Review the trigger, incoming damage, range and reduction in the damage/reaction tools. Redirect requires a zero reduction, chosen damage type and a separate saving throw.',special('2024 Monk / Tasha’s Interception exception','Damage reduction reactions'));
 add(['Crusher'],'reference','reference','On a qualifying hit choose the legal 5-foot push; confirm size and destination. Critical-hit advantage is a separate reminder.',special('Tasha’s Cauldron; approved feat','Crusher'));
 add(['Ice Knife'],'ice','choice','Resolve the attack and a separately selected burst, even on a miss. Only piercing attack dice double on a critical.',special('Later-source character spell exception','Ice Knife'));
 add(['Ice Knife burst'],'reference','reference','Use the combined Ice Knife review to avoid repeating its burst or spending another slot.',special('Later-source character spell exception','Ice Knife burst'));
 add(['Aganazzar’s Scorcher'],'scorcher','choice','Select every creature in the line. Explicitly choose eligible Sculpt Spells exclusions; Dexterity save for half.',special('Later-source spell / 2014 Evocation','Aganazzar’s Scorcher / Sculpt Spells'));
 add(['Catapult'],'catapult','choice','Choose an eligible object and first collision; Dexterity save, no damage on success. Upcasting adds dice.',special('Xanathar’s Guide; approved exception','Catapult'));
 add(['Spare the Dying'],'stabilize','choice','Confirm a living creature at 0 HP within touch; stabilize without healing.',phb(277,'Spare the Dying'));
 add(['Guiding Bolt','Inflict Wounds'],'cleric-attack','choice','Use Donavan’s cleric attack modifier and selected slot. Confirm range and any follow-up advantage.',phb(248,'Guiding Bolt / Inflict Wounds p. 253'));
 add(['Ray of Frost'],'ray','supported','Attack and cold damage; on a hit add the speed reduction reminder until your next turn.',phb(271,'Ray of Frost'));
 add(['Hellish Rebuke'],'rebuke','choice','Confirm the visible attacker within 60 feet that damaged Ringgo. Racial casting is fixed at 2nd level, once per long rest.',phb(43,'Tiefling; Hellish Rebuke p. 250'));
 add(['Shadow Arts: Darkness','Darkness'],'darkness','reference','Spend Focus, set concentration and stage the area manually. No automatic darkvision, targeting or fog changes.',monk('Shadow Arts'));
 const normalizeName=n=>String(n||'').replace(/\s*\(.*\)$/,'').trim();
 function profile(s){return ids.includes(s.id)&&(s.id==='pc-trista'?/^2024/.test(s.rules)&&/Monk/.test(s.className):/^2014/.test(s.rules));}
 function descriptor(s,a,field){
  if(a.id==='request-freeform')return {kind:'reference',status:'reference',reason:'Freeform intent only. The DM must choose timing, rolls, costs and effects; no entitlement is assumed.',source:special('Player request','DM adjudication')};
  if(!profile(s))return {kind:'reference',status:'reference',reason:'Custom character or rules profile: review the current card and source manually.',source:special('Current character record','Custom card')};
  const found=cards[normalizeName(a.name)];
  if(found){
   const allowed={missile:['pc-donavan','pc-aldric'],shield:['pc-donavan','pc-aldric'],healing:a.name==='Second Wind'?['pc-pebble']:['pc-donavan'],toll:['pc-donavan'],flurry:['pc-trista'],mobility:['pc-trista'],uncanny:['pc-trista'],surge:['pc-pebble'],recovery:['pc-donavan','pc-aldric'],cunning:['pc-ringgo'],hide:['pc-ringgo'],'weapon-addon':['pc-ringgo'],ice:['pc-aldric'],scorcher:['pc-aldric'],catapult:['pc-donavan'],stabilize:['pc-donavan'],'cleric-attack':['pc-donavan'],ray:['pc-donavan'],rebuke:['pc-ringgo'],darkness:['pc-trista']}[found.kind];
   if(allowed&&!allowed.includes(s.id))return {kind:'reference',status:'reference',reason:'This feature is outside this character’s audited choices. Confirm eligibility and the exact effect manually.',source:special('Edited character card','DM review required')};
   // A modified spell card must not be silently interpreted as its original mechanics.
   const expected={missile:'1d4+1',ice:'1d10',scorcher:'3d8',rebuke:'3d10'}[found.kind];
   if(field!=='spell'&&expected&&a.damageDice!==expected)return {kind:'reference',status:'reference',reason:'This card’s dice differ from the audited spell. Preserve the edited card and record a ruling.',source:special('Edited character card','DM review required')};
   return copy(found);
  }
  if(field==='spell'){const linked=[...(s.attacks||[]),...(s.actions||[])].find(x=>x.name===a.name);if(linked)return descriptor(s,linked,s.attacks.includes(linked)?'attack':'action');}
  if(field==='attack'&&Number.isFinite(a.attackBonus)&&(/^\d+d\d+(?:[+-]\d+)?$/.test(a.damageDice)||/^\d+$/.test(a.damageDice)))return {kind:'weapon',status:s.id==='pc-ringgo'||a.id==='trista-spear'?'choice':'supported',reason:s.id==='pc-ringgo'?'Choose Sneak Attack, Assassinate and Piercer in this weapon review. Shortbow spends one tracked arrow.':a.id==='trista-spear'?'Choose one or two hands; the recorded d8 is the two-handed spear.':'Attack, damage, recorded defenses and resource use are reviewed together; confirm range and legality.',source:phb(195,'Attack and damage; weapon table p. 149')};
  return {kind:'reference',status:'reference',reason:'Exact effect, targets, timing and any material or situational requirements need a DM ruling. The text is available; automation is not claimed.',source:spellPages[a.name]&&s.id!=='pc-trista'?phb(spellPages[a.name],a.name):special(s.id==='pc-trista'?'2024 character exception':s.rules.includes('exception')?'Approved character / spell exception':'2014 PHB','Current sheet / feature reference')};
 }
 function rogueLevel(s){const match=String(s.className||'').match(/Rogue(?:\s+(\d+))?/i);if(!match)return 0;return Math.max(1,Math.min(20,Number(match[1]||s.level)||1));}
 function sneakDice(s){return `${Math.ceil(rogueLevel(s)/2)}d6`;}
 function decorate(s,a,field){const d=descriptor(s,a,field);a={...a};if(s.id==='pc-ringgo'){for(const key of ['effect','notes'])if(a[key])a[key]=a[key].replace(/(Sneak Attack[^.]*?)\b\d+d6\b/gi,(_,prefix)=>prefix+sneakDice(s));if(a.name==='Sneak Attack'){a.damageDice=sneakDice(s);a.effect=`Add ${sneakDice(s)} once per turn after a qualifying hit. Eligibility and critical dice require review.`;}}return {...a,support:{status:d.status,label:labels[d.status],reason:d.reason,source:d.source}};}
 function enrich(s,v){
  if(s.id==='pc-ringgo')v.features=v.features.map(f=>f.name==='Sneak Attack'?{...f,text:f.text.replace(/\b\d+d6\b/,sneakDice(s))}:f);
  for(const [key,field]of [['attacks','attack'],['actions','action'],['spells','spell']])v[key]=v[key].map(a=>decorate(s,a,field));
  // Derived cards only for spells already on the confirmed sheet. No spell is learned here.
  if(profile(s)&&s.id==='pc-donavan')for(const name of ['Guiding Bolt','Inflict Wounds']){
   const spell=v.spells.find(a=>a.name===name&&a.prepared!==false);if(!spell||v.actions.some(a=>a.name===name))continue;
   v.actions.push(decorate(s,{id:'derived-'+name.toLowerCase().replace(/ /g,'-'),derived:true,name,type:'Action',attackBonus:globalThis.ECHO_PARTY_DATA.abilityMod(s.abilities.wis)+s.proficiency,damageDice:name==='Guiding Bolt'?'4d6':'3d10',damageType:name==='Guiding Bolt'?'radiant':'necrotic',saveAbility:'',saveDC:null,resourceId:'donavan-slots-1',cost:1,prepared:true,effect:name==='Guiding Bolt'?'120 feet; next attack against the target has advantage before the end of your next turn.':'Touch; melee spell attack.'},'action'));
  }
  return v;
 }
 function entry(s,r){const v=globalThis.ECHO_PARTY_DATA.ownerView(s.party[r.characterId]);const a=r.actionType==='spell'?v.actions.find(a=>a.name===r.entry.name)||v.attacks.find(a=>a.name===r.entry.name)||r.entry:r.entry;return a;}
 function current(s,r){const sh=s.party[r.characterId];if(!sh||r.custom||!profile(sh))return null;const a=entry(s,r),field=r.actionType==='spell'&&a.id?(sh.attacks.some(x=>x.id===a.id)?'attack':'action'):r.actionType;return descriptor(sh,a,field);}
 const stamp=s=>`${s.scene}:${s.turn.round}:${s.turn.index}:${s.turn.order?.[s.turn.index]||'outside-combat'}`;
 const spent=(s,r,key)=>globalThis.ECHO_PHONE_ACTIONS.data(s).requests.some(q=>q.status==='resolved'&&q.characterId===r.characterId&&q.resolution?.plan.partyCard?.turnStamp===stamp(s)&&q.resolution.plan.partyCard[key]);
 function initial(s,r,p,a){
  const d=current(s,r);if(!d)return p;
  p.partyCard={kind:d.kind,choices:{},turnStamp:stamp(s)};
  p.support=copy(a.support||{status:d.status,label:labels[d.status],reason:d.reason,source:d.source});
  if(d.status==='reference'){p.effectRulingRequired=true;return p;}
  p.effectRulingRequired=false;
  const c=p.partyCard.choices;
  if(d.kind==='flurry'){p.steps=[copy(p.steps[0]||step('', 'attack',a)),copy(p.steps[1]||p.steps[0]||step('', 'attack',a))];p.steps.forEach(t=>t.magical=false);}
  if(d.kind==='missile')c.dartTargets=Array.from({length:3},(_,i)=>r.targetIds[i%Math.max(1,r.targetIds.length)]||'');
  if(['healing','uncanny','surge','mobility','cunning','recovery'].includes(d.kind)){
   if(['uncanny','healing'].includes(d.kind)&&/Second Wind|Uncanny/.test(a.name)){p.steps=p.steps.slice(0,1);if(!p.steps.length)p.steps=[step(r.characterId,'heal',a)];else p.steps[0].targetId=r.characterId;}
   if(['surge','mobility','cunning','recovery'].includes(d.kind))p.steps=[];
  }
  if(d.kind==='surge'){p.usage='none';p.grantAction=true;}
  if(d.kind==='recovery'||d.kind==='uncanny')p.usage='none';
  if(d.kind==='ice'){c.burstTargets=[];p.steps=p.steps.slice(0,1);}
  if(d.kind==='scorcher')c.protectedTargets=[];
  if(s.party[r.characterId].id==='pc-ringgo'&&d.kind==='weapon')Object.assign(c,{sneak:false,qualifies:false,targetNotActed:false,surprised:false,piercerIndex:'',offhandEligible:false});
  if(a.id==='trista-spear')c.hands='two';
  return p;
 }
 function step(targetId,kind,a){return {targetId,kind,notation:a.damageDice||'',manual:'',bonus:Number(a.attackBonus)||0,mode:'normal',damageType:a.damageType||'',magical:true,saveAbility:a.saveAbility||'DEX',dc:a.saveDC||10,success:'none',cover:0,ac:'',crit:20,condition:'',conditionWhen:'always',acSet:''};}
 const selectedSlot=(s,r,p)=>{const cost=p.costs.find(x=>x.delta<0&&/slots-/.test(x.id)),pool=s.party[r.characterId].resources.find(a=>a.id===cost?.id);return pool?globalThis.ECHO_CHARACTER_TOOLS?.slotLevel(pool)||pool.slotLevel||Number(pool.id.match(/slots-(\d+)/)?.[1]):0;};
 function replacesCost(s,r,p,cost){const d=current(s,r);if(!d||d.status==='reference'||!/slots-/.test(cost.id))return false;const spell=s.party[r.characterId].spells.find(a=>a.name===entry(s,r).name);return !!spell&&selectedSlot(s,r,p)>=spell.level&&p.costs.some(c=>/slots-/.test(c.id)&&c.delta===-1);}
 function compile(s,r,original){
  const p=copy(original),d=current(s,r);if(!d||d.status==='reference')return p;
  if(p.partyCard?.kind!==d.kind)throw Error('Reopen the current character card before resolving.');
  const a=entry(s,r),sh=s.party[r.characterId],c=p.partyCard.choices||{};
  p.partyCard.turnStamp=stamp(s);p.partyCard.usedSneak=false;p.partyCard.usedPiercer=false;
  const override=!!p.override.trim(),slot=selectedSlot(s,r,p);
  const requireTargets=n=>{if(p.steps.length!==n&&!override)throw Error(`Choose exactly ${n} target step(s) for ${a.name}.`);};
  const spellNames=new Set(sh.spells.filter(a=>a.level>0).map(a=>a.name));
  if(!/^2024/.test(sh.rules)&&sh.spells.some(x=>x.name===a.name)&&!override){
   const previous=globalThis.ECHO_PHONE_ACTIONS.data(s).requests.filter(q=>q.status==='resolved'&&q.characterId===r.characterId&&q.resolution?.plan.partyCard?.turnStamp===stamp(s)&&sh.spells.some(x=>x.name===q.label));
   if(p.usage==='bonus'&&previous.some(q=>sh.spells.find(x=>x.name===q.label).level>0||q.resolution.plan.usage!=='action')||p.usage!=='bonus'&&previous.some(q=>q.resolution.plan.usage==='bonus')&&(sh.spells.find(x=>x.name===a.name).level>0||p.usage!=='action'))throw Error('2014 bonus-action spell restriction: other spells this turn must be cantrips with a casting time of one action. Record a ruling for an exception.');
  }
  if(spellNames.has(a.name)&&p.costs.some(x=>/slots-/.test(x.id))){
   const level=sh.spells.find(x=>x.name===a.name).level;if(slot<level&&!override)throw Error('The selected spell slot is below the spell’s level.');
  }
  if(d.kind==='missile'){
   if(slot<1&&!override)throw Error('Choose a spell slot for Magic Missile.');
   const count=slot+2;if(!Array.isArray(c.dartTargets)||c.dartTargets.length!==count||c.dartTargets.some(id=>!id))throw Error(`Allocate all ${count} Magic Missile darts. Empty darts are not assigned automatically.`);
   if(!c.missileConfirmed&&!override)throw Error('Confirm the dart targets are in range, visible and not protected by Shield.');
   // One damage roll for simultaneous darts; one step per dart preserves per-hit reactions/concentration review.
   p.steps=c.dartTargets.map((id,i)=>({...copy(p.steps.find(t=>t.targetId===id)||step(id,'damage',a)),targetId:id,kind:'damage',notation:'1d4+1',damageType:'force',sharedRoll:'magic-missile',manual:p.steps[i]?.manual??''}));
  }
  if(d.kind==='flurry')requireTargets(2);
  if(d.kind==='weapon'){
   requireTargets(1);const t=p.steps[0];if(!t)return p;
   if(a.id==='trista-spear')t.notation=(c.hands==='one'?'1d6':'1d8')+(a.damageDice.match(/[+-]\d+$/)?.[0]||'');
   if(sh.id==='pc-ringgo'){
    if(a.id==='ringgo-offhand'&&!c.offhandEligible&&!override)throw Error('Confirm a qualifying two-weapon Attack action and two light melee weapons.');
    if(a.id==='ringgo-shortbow'&&!p.costs.some(x=>x.id==='ringgo-arrows'))p.costs.push({id:'ringgo-arrows',delta:-1});
    if(c.surprised&&!c.targetNotActed&&!override)throw Error('Confirm the surprised creature has not yet taken its turn.');
    if(c.targetNotActed)t.mode=t.mode==='disadvantage'?'normal':'advantage';
    t.forceCritical=!!c.surprised;
    if(c.sneak){if(!s.turn.order.length&&!override)throw Error('Set turn order or record a once-per-turn ruling for Sneak Attack.');if(!c.qualifies&&!override)throw Error('Confirm Sneak Attack eligibility and no disqualifying disadvantage.');if(spent(s,r,'usedSneak')&&!override)throw Error('Sneak Attack was already used this turn. It can be used again on a different creature’s turn.');}
    if(c.sneak&&t.mode==='disadvantage'&&!override)throw Error('Sneak Attack cannot be used with disadvantage.');
    if(c.piercerIndex!==''&&c.piercerIndex!=null&&!s.turn.order.length&&!override)throw Error('Set turn order or record a once-per-turn ruling for Piercer.');
    if(c.piercerIndex!==''&&c.piercerIndex!=null&&!sh.features.some(f=>f.name==='Piercer'))throw Error('Piercer is not recorded on this character.');
    if(c.piercerIndex!==''&&c.piercerIndex!=null&&t.manual!==''&&!override)throw Error('For physical Piercer damage, enter the final damage and record the reroll as a manual ruling.');
    t.components=[{notation:t.notation,manual:t.manual,type:'piercing',magical:t.magical,silvered:t.silvered,adamantine:t.adamantine,overrides:t.overrides,activeRules:t.activeRules,piercer:sh.features.some(f=>f.name==='Piercer'),rerollIndex:c.piercerIndex}];
    if(c.sneak)t.components.push({notation:sneakDice(sh),manual:c.sneakManual??'',type:'piercing',magical:t.magical,overrides:t.overrides,activeRules:t.activeRules,sneak:true});
    if(c.piercerIndex!==''&&c.piercerIndex!=null&&spent(s,r,'usedPiercer')&&!override)throw Error('Piercer’s damage reroll was already used this turn.');
   }
  }
  if(d.kind==='healing'){
   requireTargets(1);if(a.name==='Second Wind'){p.steps[0].targetId=r.characterId;p.steps[0].notation=`1d10+${sh.level}`;}
   else{const n=slot||1;p.steps.forEach(t=>{t.kind='heal';t.notation=`${n}d${a.name==='Healing Word'?4:8}+${globalThis.ECHO_PARTY_DATA.abilityMod(sh.abilities.wis)}`;});}
  }
  if(d.kind==='toll'){
   requireTargets(1);const t=p.steps[0],target=s.tokens.find(x=>x.id===t?.targetId);if(!target||!Number.isFinite(target.hp)||!Number.isFinite(target.maxHp))throw Error('Confirm target HP to choose Toll the Dead’s die.');t.notation=target.hp<target.maxHp?'1d12':'1d8';t.kind='save';
  }
  if(d.kind==='catapult'){
   requireTargets(1);if(!c.objectConfirmed&&!override)throw Error('Confirm an eligible object, unobstructed path and its first collision.');p.steps.forEach(t=>{t.notation=`${(slot||1)+2}d8`;t.kind='save';t.success='none';});
  }
  if(d.kind==='ice'){
   requireTargets(1);if(!c.burstConfirmed&&!override)throw Error('Choose and confirm all creatures within 5 feet of the knife’s impact point, even if the attack misses.');
   const first=p.steps[0];first.damageType='piercing';first.notation='1d10';first.kind='attack';
   p.steps.push(...[...new Set(c.burstTargets||[])].map(id=>({...step(id,'save',a),notation:`${(slot||1)+1}d6`,damageType:'cold',sharedRoll:'ice-knife-burst',saveAbility:'DEX',dc:a.saveDC,success:'none'})));
  }
  if(d.kind==='scorcher'){
   if(!p.steps.length)throw Error('Choose the creatures in the line.');
   const protectedIds=[...new Set(c.protectedTargets||[])];if(protectedIds.length>3)throw Error('Aldric can protect up to three eligible creatures for this 2nd-level spell.');if(protectedIds.some(id=>!p.steps.some(t=>t.targetId===id))||protectedIds.length&&!c.sculptConfirmed)throw Error('Confirm every protected creature is affected, visible and eligible for Sculpt Spells.');
   p.steps.forEach(t=>{t.kind='save';t.notation='3d8';t.success='half';t.sharedRoll='scorcher';if(protectedIds.includes(t.targetId)){t.kind='effect';t.notation='';t.manual='';t.condition='';t.acSet='';}});
  }
  if(d.kind==='cleric-attack'){
   requireTargets(1);p.steps.forEach(t=>{t.notation=`${(a.name==='Guiding Bolt'?3:2)+(slot||1)}d${a.name==='Guiding Bolt'?6:10}`;t.bonus=globalThis.ECHO_PARTY_DATA.abilityMod(sh.abilities.wis)+sh.proficiency;});
  }
  if(d.kind==='stabilize'){
   requireTargets(1);const target=s.tokens.find(x=>x.id===p.steps[0]?.targetId);if(target?.hp!==0||!c.touchLivingConfirmed&&!override)throw Error('Confirm a living creature at 0 HP within touch.');p.steps[0].kind='effect';p.steps[0].notation='';
  }
  if(d.kind==='rebuke'&&!c.triggerConfirmed&&!override)throw Error('Confirm Ringgo was damaged by this visible attacker within 60 feet.');
  if(d.kind==='surge'){p.grantAction=true;p.usage='none';}
  if(d.kind==='uncanny'){
   if(!c.initiativeConfirmed&&!override)throw Error('Confirm initiative was rolled for Uncanny Metabolism.');requireTargets(1);p.steps[0].targetId=r.characterId;p.steps[0].notation=`1d6+${sh.level}`;
   const focus=sh.resources.find(x=>x.id==='trista-focus');p.costs=p.costs.filter(x=>x.id!=='trista-focus');if(focus)p.costs.push({id:focus.id,delta:focus.max-focus.current});
  }
  if(d.kind==='recovery'){
   if(!c.restConfirmed&&!override)throw Error('Confirm a completed short rest for Arcane Recovery.');const limit=sh.id==='pc-donavan'?1:2;let total=0;
   p.costs=p.costs.filter(x=>!/slots-/.test(x.id));for(const pool of sh.resources.filter(x=>/slots-/.test(x.id))){const count=Number(c.recovery?.[pool.id]||0),level=Number(pool.id.match(/slots-(\d+)/)?.[1]);if(!Number.isInteger(count)||count<0||level>5&&count)throw Error('Choose whole expended spell slots of level 1–5.');total+=count*level;if(count)p.costs.push({id:pool.id,delta:count});}
   if(!total||total>limit)throw Error(`Choose 1–${limit} combined slot levels to recover. No higher-level spell is learned.`);
  }
  return p;
 }
 function afterStep(s,next,r,p,t,hit,crit,damage){
  const d=current(s,r);if(!d)return;
  if(d.kind==='weapon'&&hit&&t.components?.some(c=>c.sneak))p.partyCard.usedSneak=true;
  const remind=(name,note)=>next.combat.effects.push({id:`card-${Date.now()}-${Math.random().toString(36).slice(2,9)}`,tokenId:t.targetId,triggerActor:r.characterId,triggerPoint:d.kind==='ray'?'start':'end',remaining:1,name,condition:'',due:false,fired:false,repeatSave:false,note});
  if(hit&&d.kind==='ray')remind('Ray of Frost · speed −10 ft','Apply until the caster’s next turn starts. Movement remains manual.');
  if(hit&&d.kind==='cleric-attack'&&entry(s,r).name==='Guiding Bolt')remind('Guiding Bolt · next attack advantage','Consume after the next attack against this target, or expire at the end of the caster’s next turn. DM confirms consumption.');
  if(d.kind==='stabilize'&&next.party[t.targetId])next.party[t.targetId].death={successes:0,failures:0,stable:true};
 }
 function finish(s,next,r,p){
  const d=current(s,r);if(!d)return;
  if(['mobility','cunning'].includes(d.kind))next.combat.effects.push({id:`card-${Date.now()}-${Math.random().toString(36).slice(2,9)}`,tokenId:r.characterId,triggerActor:r.characterId,triggerPoint:'start',remaining:1,name:r.label,condition:'',due:false,fired:false,repeatSave:false,note:entry(s,r).effect+' Movement, opportunity attacks, Dodge and difficult terrain are checked manually.'});
 }
 function audit(s){return Object.values(s.party).filter(c=>ids.includes(c.id)).map(c=>{const v=globalThis.ECHO_PARTY_DATA.ownerView(c);return {id:c.id,name:c.name,level:c.level,rules:c.rules,source:c.source,sourceStatus:c.sourceStatus,cards:[...v.attacks.map(a=>({...a,field:'attack'})),...v.actions.map(a=>({...a,field:'action'})),...v.spells.map(a=>({...a,field:'spell'}))].map(({id,name,field,support})=>({id,name,field,...support}))};});}
 function renderChoices(s,r,p,root,ui,targets){
  if(!p.partyCard)return;
  const {el,select,check,field}=ui,c=p.partyCard.choices;
  if(p.support){el('strong',p.support.label,root);el('p',p.support.reason,root);el('small',`${p.support.source.book}${p.support.source.printedPage?' p. '+p.support.source.printedPage:''} · ${p.support.source.confidence}`,root);}
  switch(p.partyCard.kind){
   case 'missile': {const count=selectedSlot(s,r,p)+2;c.dartTargets||=[];while(c.dartTargets.length<count)c.dartTargets.push('');c.dartTargets.length=count;for(let i=0;i<count;i++)select(root,`Dart ${i+1}`,c.dartTargets[i],[['','Choose dart target'],...targets],id=>c.dartTargets[i]=id);check(root,'Every dart target is visible, in range and not protected by Shield',c.missileConfirmed,v=>c.missileConfirmed=v);el('p','Simultaneous darts share one d4+1 damage roll. Concentration is reviewed per dart; record a house ruling if your table groups hits differently.',root);break;}
   case 'weapon':if(entry(s,r).id==='trista-spear')select(root,'Spear grip',c.hands,[['one','One hand · 1d6+4'],['two','Two hands · 1d8+4']],v=>c.hands=v);
    if(r.characterId==='pc-ringgo'){
     if(entry(s,r).id==='ringgo-offhand')check(root,'Qualifying two-weapon Attack action and two light melee weapons',c.offhandEligible,v=>c.offhandEligible=v);
     check(root,'Target has not taken a turn · Assassinate advantage',c.targetNotActed,v=>c.targetNotActed=v);check(root,'Target is surprised · hit becomes critical',c.surprised,v=>c.surprised=v);
     check(root,`Add Sneak Attack · ${sneakDice(s.party[r.characterId])} once this turn`,c.sneak,v=>c.sneak=v);if(c.sneak){check(root,'Sneak Attack qualifies: finesse/ranged weapon, advantage or nearby non-incapacitated enemy, and no disadvantage',c.qualifies,v=>c.qualifies=v);field(root,'Physical Sneak Attack damage (blank rolls digitally; include critical dice)',c.sneakManual??'',v=>c.sneakManual=v).type='number';}
     select(root,'Piercer weapon die to reroll (must use new die)',String(c.piercerIndex??''),[['','No reroll'],['0','Weapon die 1'],['1','Weapon die 2 (critical only)']],v=>c.piercerIndex=v);
     el('p','Piercer adds one extra weapon die on a piercing critical automatically. This selector rerolls a digital weapon die; physical rerolls and Sneak Attack die rerolls need a recorded ruling.',root);
    }break;
   case 'uncanny':check(root,'Initiative was rolled for this combat',c.initiativeConfirmed,v=>c.initiativeConfirmed=v);break;
   case 'recovery':check(root,'A short rest was completed',c.restConfirmed,v=>c.restConfirmed=v);c.recovery||={};for(const pool of s.party[r.characterId].resources.filter(x=>/slots-/.test(x.id)))field(root,`Recover ${pool.name} (${pool.max-pool.current} spent)`,c.recovery[pool.id]||0,v=>c.recovery[pool.id]=Number(v)).type='number';break;
   case 'ice':for(const [id,name]of targets)check(root,`Burst hits · ${name}`,(c.burstTargets||[]).includes(id),v=>c.burstTargets=v?[...new Set([...(c.burstTargets||[]),id])]:(c.burstTargets||[]).filter(x=>x!==id));check(root,'Burst includes every creature within 5 feet of the impact, even on a miss',c.burstConfirmed,v=>c.burstConfirmed=v);break;
   case 'scorcher':for(const [id,name]of targets.filter(([id])=>p.steps.some(t=>t.targetId===id)))check(root,`Sculpt protects · ${name}`,(c.protectedTargets||[]).includes(id),v=>c.protectedTargets=v?[...new Set([...(c.protectedTargets||[]),id])]:(c.protectedTargets||[]).filter(x=>x!==id));if(c.protectedTargets?.length)check(root,'Protected creatures are visible, affected and eligible',c.sculptConfirmed,v=>c.sculptConfirmed=v);break;
   case 'catapult':check(root,'Object, path and first collision are legal',c.objectConfirmed,v=>c.objectConfirmed=v);break;
   case 'rebuke':check(root,'Visible attacker within 60 feet damaged Ringgo',c.triggerConfirmed,v=>c.triggerConfirmed=v);break;
   case 'stabilize':check(root,'Living creature at 0 HP within touch (not undead or construct)',c.touchLivingConfirmed,v=>c.touchLivingConfirmed=v);break;
  }
 }
 globalThis.ECHO_PARTY_ACTIONS={rogueLevel,sneakDice,enrich,descriptor,initial,compile,afterStep,finish,audit,selectedSlot,replacesCost,renderChoices};
})();

/* Next three evenings, prepared from the 9 October checkpoint. DM-only plans; never actual events. */
(() => {
 'use strict';
 if(globalThis.location?.hash==='#player')return;
 const packs=globalThis.ECHO_CONTENT_PACKS;if(!Array.isArray(packs))return;
 const clone=x=>structuredClone(x), unique=x=>[...new Set(x)];
 const beat=(id,title,scene,read,run,priv=[],ask=[])=>({id,title,scene,read,run,private:priv,ask,tv:'Private preparation. Preview the selected player-safe visual, then use Show on TV. Browsing this card reveals nothing.'});
 const source='Lost Mine of Phandelver (2014), pp. 14–51 and appendix B; original Echo Below procedures; Latest-Redbrand-Session-Actual-Recap, confirmed 9 October 2026.';
 const checkpoint=['Actual checkpoint: outside Barthen’s Provisions; Gundren left at an unnamed inn after being put to sleep; Trista holds the captured rat. Entry, payment, Gundren’s present condition and rat recognition remain unconfirmed.',
 'DM-only: Glasstaff escaped to Cragmaw Castle. The party has not earned that destination. Keep this separate from a route to the castle and from the historical transfer of Gundren.',
 'Use the current saved five character sheets. Do not refill HP, spell slots, hit dice, potion stock or other resources when opening a preparation package. Confirm a rest through the existing review.'];
 const spotlight=['Trista: offer a private choice about showing the rat or investigating it; never expose the BELOW token through narration.',
 'Pebble: offer a practical packing, stonework or safe-footing contribution; ordinary rocks do not automatically grant a homebrew benefit.',
 'Donavan: invite a sourced account or question for correspondence; separate testimony from his interpretation.',
 'Ringgo: make bargaining, scouting and legitimate paid work useful alternatives to coercion.',
 'Aldric: offer a choice to protect a vulnerable person or compare records; do not reveal his resurrection’s cause or Halaster’s involvement.'];
 const close=beat('evening-review','Close this evening · review what actually changed','town-phandalin',[],[
 'Record the exact stopping room, party positions, HP, resources, concentration, conditions, time and lights. Capture a restore point before closing.',
 'Use Outcome review for rescues, escapes, deaths, discovered routes, promises and item custody. Choose who knows each fact and inspect each proposed quest, journal, NPC or map update before applying.',
 'Record treasure actually taken, not treasure merely listed on a room card. Do not mark a dungeon cleared, reward paid, quest complete or character leveled without its established outcome.',
 'Prepare two or three credible next leads from the reviewed events. Keep unrevealed destination information private. Leave pending phone requests visible or resolve them explicitly.'
 ],['Preparation for several evenings can overlap. Continue the same dungeon save using Preview return; do not generate a fresh floor to resume it.']);
 const s4start=beat('evening4-start','Session 4 · start at Barthen’s Provisions','lmop-barthen-exterior',[
 'Barthen’s Provisions stands before you, its entrance opening onto Phandalin’s worn street. The settlement carries on around you: boots on packed earth, a door opening nearby, voices passing between buildings. For a moment, there is space to decide what comes next.',
 'Glasstaff escaped. Gundren is at the inn where you left him, and Trista has the rat you captured. Those matters are unfinished, but the street offers more than one direction. Do you go into the shop, return to Gundren, or attend to something else first?'
 ],[...checkpoint,'Get ready: check devices, backup and current objectives; privately stage Barthen’s exterior. Ask the table for a short recap, correct only established facts, then invite their next action.',
 'Three prepared leads: Barthen’s business, a return to Gundren, and the captured rat. Let players choose the order. An inquiry into Redbrand witnesses is available if they want to pursue the escape.',
 'Pacing suggestion, not a timer: opening 10 minutes; town decisions 45–75; one chosen inquiry or local scene 45–60; leave 15 minutes for outcome review. Stop at a chosen departure, a safe town rest, or an unfinished decision.'],['No new outcome is implied by this opening. Sources: Phandalin pp. 14–19; actual checkpoint.'],['What are you trying to accomplish before leaving Phandalin?']);
 const route=beat('evening4-route','Earn a lead · witnesses, records or Reidoth','town-phandalin',[
 'Phandalin is small enough that a question can travel ahead of its asker. A name spoken in a shop may be repeated at another doorway; an uncertain story may arrive with a different ending. The streets give you places to ask, but they cannot tell you which account deserves your trust.',
 'You can follow a person who might know, compare a record with what you witnessed, or look for a practical route out of town. Tell me whom you approach and what you ask. What evidence would make you willing to act?'
 ],[
 'Use the existing town markers and NPC cards. Barthen deals in supplies and the known contract; do not give him the secret castle destination. Sildar can respond to Iarno’s flight and propose an inquiry, not report an unseen escape route.',
 'If alive, present and willing, Droop or a castle-aware bugbear can provide a route (pp. 24, 28, 35–41). Establish how they know. Halia’s lead to the hideout goblin requires that goblin to remain available. Qelline can direct an inquiry toward Reidoth near Thundertree (p. 18); Reidoth’s aid depends on the actual conversation (p. 32).',
 'The Black Spider’s letter identifies a relationship with Iarno, not a road to the castle. A found custom transfer record proves the earlier transfer only. Gundren may offer information when his condition and what he actually knows are established; no automatic map reveal.',
 'A failed roll changes this approach: another witness, a corroborating record, a negotiated favor or Reidoth remain alternatives. Do not require one specific check, captive, character ability or sacrifice to continue.',
 'If all leads are declined, offer ordinary supplies, legitimate work or a return to an already cleared site with persistent state. The orc camp stays cleared; Kost stays absent until a concrete development is reviewed.'],['Keep Glasstaff’s current castle presence DM-only. A route to Cragmaw Castle does not locate Glasstaff.'],['What do you know, who told you, and what remains a guess?']);
 const rat=beat('evening4-rat-rules','Rat follow-through · a clue, not a tracking device','phandalin-art',[
 'The captured rat shifts its weight and searches for a way out. Small claws feel along the edge of its confinement; its nose lifts toward the surrounding air. For now, it is something you can observe directly, even while its purpose remains uncertain.',
 'You can watch it, offer food, decide how to keep it safe, or seek someone who can examine it. What you learn will depend on what you actually do. Trista, do you bring the others into this, or keep your attention on it for the moment?'
 ],['Ask how Trista is holding it before narrating confinement; adapt “edge” if it is in her hands. Ownership, recognition and magical control are different facts.',
 '2014 Find Familiar: telepathy is within 100 feet; the caster can dismiss or perceive through the familiar under the spell’s actual limits. Holding it does not transfer control or reveal the caster’s location. Do not assert that it automatically reports every conversation at any distance.',
 'If Detect Magic is used, apply the spell’s limits and give only justified observations; a creature’s identity is not automatically a compass bearing. Speak with Animals normally affects beasts, while a familiar is celestial, fey or fiend. An unusual interaction needs a reviewed ruling.',
 'Possible future response: Iarno notices loss of contact, dismisses it, or leaves it where it is. Choose and record a concrete response only when play or an approved consequence establishes it. Avoid a forced vanishing or automatic betrayal.'],['2014 SRD printed pp. 134, 143, 181; LMoP pp. 25–26. Familiar identity remains undisclosed until established.']);
 const s5start=beat('evening5-start','Session 5 · decide whether the castle is your next step','town-phandalin',[
 'Before you set out, there is time to place what you know beside what you only suspect. Beyond Phandalin, the road gives way to stretches of woodland where a wrong turn can consume daylight, and carrying the right supplies matters as much as choosing the right destination.',
 'A journey begins with an aim: someone you intend to find, a place you intend to examine, or a question you want answered. Which of your established leads are you following, who is traveling with you, and what will tell you that it is time to return?'
 ],[...checkpoint,'Entry gate: the party must establish a usable castle route and choose to follow it. If they have not, run the witness/Reidoth inquiry from Session 4 or the optional Thundertree package. Do not announce the castle as a known quest marker.',
 'Check marching order, supplies, light, watches and withdrawal plan. Use defined journey routes for distances; the regional painting is illustrative.',
 'At the castle, run sight → scouting → chosen entrance → connected rooms. Follow the source floor plan; room numbering is a reference. Negotiation, disguises, the rear entrance and withdrawal are valid.',
 'Pacing suggestion: route and travel 20–40 minutes; scouting 20–30; two or three connected castle scenes 90–120; closing 15. Thundertree or an extended fight can consume this entire evening.'],['LMoP pp. 27–41. Do not place Gundren or Trista’s rat at the castle.']);
 const glasstaff=beat('evening5-glasstaff','DM branch · Glasstaff’s refuge and response','lmop-castle-approach',[],[
 'Approved fact: Glasstaff fled here. Unresolved: arrival time, exact room, injuries, spent spells, staff charges, allies and whether defenders accepted him. Select these as future staging before an encounter; record them separately from observed play.',
 'Three compatible private placements: a negotiated refuge near Grol, a watched holding space while the goblinoids bargain, or a concealed route out through the ruined rear. Choose one based on existing occupants and timing. No placement is required to discover the mine route.',
 'Motivation: preserve his life and leverage; the Spider’s agent must explain his failed hideout. He can bargain over information, claim protection from Grol, attempt another escape, or surrender when that serves him. He does not know every Echo secret.',
 'For combat, use the existing Glasstaff / evil mage source-labeled card (LMoP p. 26 and appendix B). Review remaining slots, Mage Armor, Shield, Mirror Image, Misty Step and staff charges before placing his token. Do not restore spent resources merely because this package opens.',
 'Use a directly connected corridor or established rear exit for escape; no unexplained teleport across the dungeon. If captured, separate identity, confession, destination evidence and promises in Outcome review.',
 'If the party never meets him, the castle can still yield a route, negotiations and other discoveries. Propose his next move in closing review with its cause and evidence.'],['DM-only. This branch is not narration, a player handout or a phone quest. Add the existing creature manually only after selecting placement and resources.']);
 const s6start=beat('evening6-start','Session 6 · prepare the mine expedition','town-phandalin',[
 'Before another journey, your equipment lies within reach: lamps to check, packs to close, provisions to count. The work ahead will take you beyond familiar doors and into stone where daylight cannot follow. You can still decide what to carry, whom to trust, and what you hope to bring back.',
 'An expedition need not answer every question at once. You can set a limit on time, agree on a retreat signal, or choose a single objective before you enter. What is your purpose this time, and what would make you turn back?'
 ],[...checkpoint,'Entry gate: an earned mine route, a decision to enter, and current sheets/resource review. A castle rumor alone is not a precise mine entrance. Verify actual map custody or other corroborated directions.',
 'Use all 20 existing room cards, their actual exits and linked encounter cards. Establish light and marching order. Area 1 is the entrance; no fixed room sequence is required.',
 'The printed mine assumes level 4 or higher. Use the actual mixed-level five-person party and current encounter review. Warn through observable danger and support retreat; do not silently change levels or add unearned rests.',
 'Pacing suggestion: arrival 15–20 minutes; two or three connected rooms 60–90; one major fight or negotiation 45–60; retreat/close 15. Do not promise to finish Wave Echo Cave in one evening.',
 'Nezznar, Nundro, the Forge, Mormesk and the spectator have independent situations. A choice to negotiate, bypass, retreat or return does not force a single ending. Keep city transition preparation future-only until mine outcomes are approved.'],['LMoP pp. 42–51. Wave Echo Cave may span several game nights.']);
 const make=(id,name,baseId,rootMap,extra,filter=()=>true,enemySeed='')=>{
  const base=packs.find(p=>p.id===baseId);if(!base)throw Error('Missing existing pack '+baseId);
  const runbook=[...extra,...clone(base.runbook||[]).filter(filter),{...clone(close),id:id+'-review'}];
  const p={...clone(base),id,name,defaultName:name,source,rootMap,preservePartyProgression:true,carryExploration:true,enemySeed,runbook,beats:runbook.map(b=>b.id),
   scenes:unique([...base.scenes,...extra.map(b=>b.scene)]),description:'Future evening preparation. Keeps current party totals; opening does not establish discoveries, pay rewards or complete quests. Resume an existing dungeon save for returns.'};
  p.runbook=p.runbook.map(b=>globalThis.ECHO_NARRATION?.upgradeBeat(b)||b);return p;
 };
 const four=make('next-session-4','Session 4 · Phandalin after Glasstaff','phandalin-aftermath-next','town-phandalin',[s4start,route,rat]);
 four.runbook.find(b=>b.id==='s5-open').run.push(...spotlight);four.beats=four.runbook.map(b=>b.id);
 const five=make('next-session-5','Session 5 · Leads and Cragmaw Castle','gundren-session-3','region-lmop',[s5start,glasstaff],b=>!['s3-prep','s3-old-owl','s3-old-owl-fight','s3-wyvern','s3-wyvern-fight'].includes(b.id),'castle');
 five.encounters=five.encounters.filter(id=>!['old-owl-well','wyvern-tor'].includes(id));
 five.encounterNotes={'castle-king':'Grol (45 HP), Snarl (18 HP), Vyerith disguised as a drow. Gundren is with the party at an unnamed inn; do not place him here. Glasstaff’s refuge and resources need private DM staging.'};
 five.runbook.find(b=>b.id==='s3-choice').run.push(...spotlight);
 const six=make('next-session-6','Session 6 · Wave Echo Cave expedition','lmop-part-4-visuals','wave-echo',[s6start],b=>b.id!=='s4-prep','wave');
 six.runbook.find(b=>b.id==='s4-arrival').run.push(...spotlight);
 for(const p of [four,five,six]){p.firstScene=p.runbook[0].scene;p.beats=p.runbook.map(b=>b.id);}
 packs.unshift(four,five,six);
 globalThis.ECHO_SESSION_EVENINGS={version:1,checkpointDate:'2026-10-09',status:'future-preparation',packs:[four,five,six]};
})();

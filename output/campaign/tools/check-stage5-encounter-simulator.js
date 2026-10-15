/* A throwaway encounter. No browser storage, campaign save, phone service or network is opened. */
'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
for(const name of ['Session-01-Map-Data','Session-01-Party-Data','Session-01-Combat-Data',
  'Session-01-Combat-Run','Session-01-Combat-Plus','Session-01-Commands','Session-01-Dungeon','Campaign-Expeditions'])
  require(path.join(root,name+'.js'));

const clone=value=>JSON.parse(JSON.stringify(value));
const hero={id:'pc-pebble',name:'Pebble',team:'pc',type:'hero',scene:'practice-floor',placed:true,
  visible:true,x:20,y:30,hp:18,maxHp:22,tempHp:0,ac:17,conditions:[]};
const enemy={id:'practice-goblin',name:'Practice goblin',team:'enemy',type:'goblin',scene:'practice-floor',placed:true,
  visible:true,x:35,y:30,hp:15,maxHp:15,tempHp:0,ac:15,conditions:[]};
const floor='practice-floor';
let state={commandRevision:0,scene:floor,sessionKind:'custom',sceneFog:{[floor]:['2,3']},
  map:{scenes:{[floor]:ECHO_MAP_DATA.scene({fineFog:true})}},tokens:[hero,enemy],
  party:{[hero.id]:ECHO_PARTY_DATA.normalizeSheet({...ECHO_PARTY_DATA.seeds[hero.id],hp:18,maxHp:22})},
  turn:{scene:floor,round:1,index:0,order:[hero.id,enemy.id]},
  combatRun:{queue:{key:`${floor}:1:${hero.id}`,done:[],movementUsed:0,actionUsed:false,bonusUsed:false}},
  combat:{tokens:{[hero.id]:ECHO_COMBAT_DATA.creatureDefense('goblin'),[enemy.id]:ECHO_COMBAT_DATA.creatureDefense('goblin')},creatures:{},effects:[]},
  combatPlus:ECHO_COMBAT_PLUS.normalize(),annotations:[]};
state.party[hero.id].hp=18;state.party[hero.id].maxHp=22;
const extras={dungeon:ECHO_DUNGEON.normalize(),expeditions:ECHO_EXPEDITIONS.normalize(),settlements:{minutes:0}};
const room=ECHO_DUNGEON.add(extras.dungeon,floor,'room','Practice chamber',25,30);room.state='cleared';
const door=ECHO_DUNGEON.add(extras.dungeon,floor,'door','West door',10,30);door.state='open';
const chest=ECHO_DUNGEON.add(extras.dungeon,floor,'container','Practice chest',40,30);chest.state='searched';
ECHO_DUNGEON.scene(extras.dungeon,floor).memory=['2,3'];
const stair=ECHO_DUNGEON.link(extras.dungeon,floor,'practice-landing','Return stair',8,30,72,50);
const ctx={state,extras,sessionId:'isolated-practice'};
const expedition=ECHO_EXPEDITIONS.create(ctx,'Practice encounter',[floor]);
ECHO_EXPEDITIONS.start(ctx,expedition);

// An ordinary hit is previewed before anything in the fixture changes.
const attack={natural:12,total:18};
assert.equal(ECHO_COMBAT_RUN.attackOutcome(attack,enemy.ac),'Hit');
const strike={id:'practice-strike',scene:floor,status:'staged',label:'Pebble hammer',actorId:hero.id,
  targets:[enemy.id],components:[{amount:6,type:'bludgeoning',attack:true,magical:false,overrides:{}}],reactionsChecked:false,
  attack:{total:attack.total,natural:attack.natural,crit:20,cover:0}};
state.combatPlus.damage.push(strike);
const reaction=ECHO_COMBAT_PLUS.pause(state,{label:'Reaction to hammer',targets:[enemy.id]});
strike.pauseId=reaction.id;
assert.throws(()=>ECHO_COMBAT_PLUS.damagePreview(state,strike),/paused/);
reaction.status='closed';strike.reactionsChecked=true;
assert.equal(ECHO_COMBAT_PLUS.damagePreview(state,strike)[0].hp,9);
state=ECHO_COMBAT_PLUS.applyDamage(state,strike,ECHO_COMBAT_PLUS.damageSignature(state,strike));
ctx.state=state;
assert.equal(state.tokens.find(t=>t.id===enemy.id).hp,9);

// A spell-shaped burst resolves independent saves before applying one reviewed event.
const area={id:'practice-burst',scene:floor,name:'Practice burst',shape:{kind:'circle',x1:35,y1:30,x2:45,y2:30},
  owner:hero.id,anchor:hero.id,tick:'start',remaining:2,triggers:['entry','start'],difficult:false,
  public:false,active:true,concentration:'',note:'Private practice instructions'};
state.combatPlus.areas.push(area);
const save=ECHO_COMBAT_PLUS.saveBatch(state,{label:'Burst save',ability:'dex',dc:13,targets:[hero.id,enemy.id]},()=>2);
ECHO_COMBAT_PLUS.saveResult(state,{batchId:save.id,characterId:hero.id,expectedRevision:1,method:'physical',total:15},()=>1);
ECHO_COMBAT_PLUS.saveResult(state,{batchId:save.id,characterId:enemy.id,expectedRevision:1,method:'physical',total:10},()=>1);
const burst={id:'practice-burst-damage',scene:floor,status:'staged',label:'Burst',targets:[hero.id,enemy.id],
  components:[{amount:8,type:'fire',magical:true,overrides:{}}],saveBatchId:save.id,success:'half',reactionsChecked:true};
state.combatPlus.damage.push(burst);
const preview=ECHO_COMBAT_PLUS.damagePreview(state,burst);
assert.equal(preview.find(row=>row.id===hero.id).total,4);
assert.equal(preview.find(row=>row.id===enemy.id).total,8);
state=ECHO_COMBAT_PLUS.applyDamage(state,burst,ECHO_COMBAT_PLUS.damageSignature(state,burst));
ctx.state=state;
assert.equal(state.party[hero.id].hp,14);

// Leaving, recovering and reopening the floor retains known geography and occupants.
state.turn.order=[];
ECHO_EXPEDITIONS.retreat(ctx,expedition,'Return by the known stair to the landing.');
assert.equal(expedition.phase,'away');
const savedFloor=clone({state,extras});
const rest=ECHO_PARTY_DATA.previewRest(state.party[hero.id],'short',{hitDiceSpent:1,healing:3});
assert(!rest.blocked);state.party[hero.id]=rest.sheet;
state.tokens.find(t=>t.id===hero.id).hp=rest.sheet.hp;
const recoveredHp=rest.sheet.hp;
const returned=clone(savedFloor);
returned.state.party[hero.id]=clone(rest.sheet);
returned.state.tokens.find(t=>t.id===hero.id).hp=recoveredHp;
assert.equal(ECHO_DUNGEON.passage(returned.extras.dungeon,floor,stair.id).back.target,floor);
assert.equal(returned.extras.dungeon.scenes[floor].objects.find(item=>item.id===door.id).state,'open');
assert.equal(returned.extras.dungeon.scenes[floor].objects.find(item=>item.id===chest.id).state,'searched');
assert.deepEqual(returned.state.sceneFog[floor],['2,3']);
assert.equal(returned.state.tokens.find(t=>t.id===enemy.id).hp,1);
assert.equal(returned.state.party[hero.id].hp,recoveredHp);
assert.equal(returned.extras.expeditions.records[0].phase,'away','Returning to the map does not invent a completed expedition outcome');
console.log('Stage 5 encounter simulator passed: attack, reaction pause, area saves/damage, retreat, rest, return route and persistent floor state.');

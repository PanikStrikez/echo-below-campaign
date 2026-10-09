/* Pure display health logic, kept separate from map and combat rendering. */
(() => {
  function tv(clients, now=Date.now()) {
    if(!clients.length)return {level:'closed',label:'closed · open the player TV'};
    const suffix=clients.length>1?` · ${clients.length} windows`:'';
    for(const c of clients){
      if(c.error)return {level:'stale',label:'TV render error: '+c.error+suffix};
      if(!c.heartbeat||now-c.heartbeat>6500)return {level:'stale',label:'disconnected · no TV heartbeat'+suffix};
      if((c.ackRevision||0)<(c.sentRevision||0)&&now-(c.pendingSince||c.sentAt||0)>6500)return {level:'stale',label:'TV is behind the latest update'+suffix};
      if(!c.ackAt)return {level:'stale',label:'waiting for the TV to confirm its first update'+suffix};
    }
    return {level:'connected',label:'up to date'+suffix};
  }
  globalThis.ECHO_CONNECTION_HEALTH={tv};
})();

(function(g){
  'use strict';
  function sceneMessages(data,state,id,current){
    const scene=data.scenes[id];if(!scene)return [];
    let ls=scene.lines.filter(l=>!l.when||(g.NovelEngine||require('./engine.js')).conditions[l.when]?.(state));
    if(current)ls=ls.slice(0,state.lineIndex+1);
    return ls.filter(l=>['chat','voice'].includes(l.channel)).map(l=>({id:l.key,speaker:l.channel==='voice'?'mother':l.speaker,text:l.text,kind:l.channel,voice:l.voice,own:l.speaker==='petya'&&l.channel!=='voice'}));
  }
  function messages(data,state){
    const kind=data.scenes[state.sceneId].phone;
    let past=[];
    if(['code','newSession','anyaReal'].includes(kind))past=['C1_00'];
    if(kind==='motherVoiceMore')past=['C3_01'];
    if(['publication','forwarded','masked'].includes(kind))past=['C4_01'];
    return [...past.flatMap(id=>sceneMessages(data,state,id,false)),...sceneMessages(data,state,state.sceneId,true)];
  }
  function delivery(data,state){
    const engine=g.NovelEngine||(typeof require==='function'?require('./engine.js'):null);
    const l=engine.lines(data,state)[state.lineIndex];
    return l&&['chat','voice'].includes(l.channel)&&l.speaker!=='petya'||l?.channel==='voice'?l?.key:null;
  }
  function taskReached(data,state,action){
    const engine=g.NovelEngine||(typeof require==='function'?require('./engine.js'):null);
    return engine.lines(data,state).slice(0,state.lineIndex+1).some(l=>l.interaction?.action===action);
  }
  function hasCue(data,state,cue){
    const engine=g.NovelEngine||(typeof require==='function'?require('./engine.js'):null);
    const ls=engine.lines(data,state),current=ls[state.lineIndex],waiting=delivery(data,state);
    return ls.slice(0,state.lineIndex+1).some(l=>l.reveal?.includes(cue)&&!(l===current&&waiting&&!state.deliveredMessages?.includes(waiting)));
  }
  function callDecision(data,state){
    const scene=data.scenes[state.sceneId],definition=scene.phoneDecision;if(!definition)return null;
    const engine=g.NovelEngine||(typeof require==='function'?require('./engine.js'):null);
    const current=engine.lines(data,state)[state.lineIndex];
    if(current?.key!==definition.at||engine.pendingInteraction(data,state))return null;
    return {contact:definition.contact,choices:scene.choices};
  }
  const api={messages,delivery,taskReached,hasCue,callDecision};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else g.NovelPhone=api;
})(globalThis);

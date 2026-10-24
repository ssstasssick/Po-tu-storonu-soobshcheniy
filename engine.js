(function (g) {
  'use strict';
  const clone = value => JSON.parse(JSON.stringify(value));
  const conditions = {
    codeShared:s=>s.codeShared===true, codeRefused:s=>s.codeShared===false,
    priorCodeShared:s=>s.mode==='story'&&s.codeShared===true,
    priorCodeRefused:s=>s.mode==='story'&&s.codeShared===false,
    chapterMode:s=>s.mode==='chapter',
    tableShared:s=>s.dataOutcome==='shared', tableNotShared:s=>s.dataOutcome!==null&&s.dataOutcome!=='shared',
    lost180:s=>s.savingsTransferred===true, notLost180:s=>s.savingsTransferred!==true,
    voiceTransferred:s=>s.voiceOutcome==='transferred', voiceVerified:s=>s.voiceOutcome==='verified',
    priorTableVerified:s=>s.mode==='story'&&s.dataOutcome==='verified',
    publicationShared:s=>['forwarded','masked'].includes(s.publicationOutcome),
    publicationSupported:s=>s.publicationOutcome==='supported', moneyLost:s=>s.moneyLost>0
  };
  function derive(s) {
    const d=s.decisions;
    s.codeShared=d.D1_CODE===undefined?null:d.D1_CODE==='send';
    s.friendPressureExperienced=d.D1_CODE==='refuse';
    s.savingsTransferred=d.D1_CALL===undefined?null:d.D1_CALL==='transfer';
    s.moneyLost=(d.D1_CALL==='transfer'?180:0)+((d.D3_VOICE==='transfer'||d.D3_VERIFY==='transfer')?120:0);
    s.accountStatus=s.codeShared?(s.completedChapters.includes('CH01')?'recovered':'exposed'):'protected';
    s.dataOutcome=({send:'shared',refuse:'refused',verify:'verified'})[d.D2_TABLE]||null;
    s.askedForMoreAudio=d.D3_VOICE==='moreAudio';
    s.voiceOutcome=(d.D3_VOICE==='transfer'||d.D3_VERIFY==='transfer')?'transferred':(d.D3_VOICE==='call'||d.D3_VERIFY==='call')?'verified':null;
    s.publicationOutcome=({forward:'forwarded',mask:'masked',support:'supported'})[d.D4_SHARE]||null;
    return s;
  }
  function create(data,chapterId='CH00',mode='story') {
    const chapter=data.chapters.find(c=>c.id===chapterId);
    if(!chapter) throw new Error('Неизвестная глава');
    return derive({saveVersion:1,contentVersion:3,mode,chapterId,entryChapter:chapterId,sceneId:chapter.start,lineIndex:0,decisions:{},interactions:{},phoneProgress:{},phoneView:'story',inspectedEvidence:[],seenPosts:[],reflectionAnswers:{},completedChapters:[],checkpoints:{},history:[],finishedChapter:false,finishedStory:false,updatedAt:Date.now()});
  }
  function lines(data,s) {
    return data.scenes[s.sceneId].lines.filter(l=>!l.postOnly&&(!l.when||(conditions[l.when]&&conditions[l.when](s))));
  }
  function pendingInteraction(data,s) {
    return lines(data,s).slice(0,s.lineIndex+1).map(l=>l.interaction).find(t=>t&&!s.interactions?.[t.id])||null;
  }
  function interact(data,state,action,payload={}) {
    const s=clone(state),task=pendingInteraction(data,s);if(!task)return s;
    s.interactions=s.interactions||{};s.phoneProgress=s.phoneProgress||{};
    const p=s.phoneProgress[task.id]||(s.phoneProgress[task.id]={opened:[],end:false});
    let complete=false;
    if(task.type==='feed'){
      if(action==='post'&&task.posts.includes(payload.id)&&!p.opened.includes(payload.id))p.opened.push(payload.id);
      if(action==='feedEnd')p.end=true;
      complete=action==='feedFinish'&&p.end&&p.opened.length>0;
    }else if(task.type==='cards'){
      if(action==='helpCard'&&task.cards.includes(payload.id)&&!p.opened.includes(payload.id))p.opened.push(payload.id);
      complete=task.cards.every(id=>p.opened.includes(id));
    }else if(task.type==='voice')complete=['voiceEnd','voiceRead'].includes(action)&&payload.id===task.voice;
    else complete=action===task.action;
    if(complete){s.interactions[task.id]=true;s.phoneView='story';}
    s.updatedAt=Date.now();return s;
  }
  function record(data,s) {
    const l=lines(data,s)[s.lineIndex];if(!l)return;
    const key=s.sceneId+':'+s.lineIndex;
    if(s.history.at(-1)?.key!==key)s.history.push({key,sceneId:s.sceneId,speaker:l.speaker,text:l.text});
    if(s.history.length>150)s.history.shift();
  }
  function enter(data,s,id) {
    if(!data.scenes[id])throw new Error('Сцена не найдена: '+id);
    s.sceneId=id;s.chapterId=data.scenes[id].chapter;s.lineIndex=0;s.phoneView='story';s.finishedChapter=false;s.updatedAt=Date.now();record(data,s);return s;
  }
  function choose(data,state,value) {
    const s=clone(state),scene=data.scenes[s.sceneId];
    if(!scene.choices||s.lineIndex<lines(data,s).length-1||pendingInteraction(data,s))throw new Error('Сначала выполните действие в телефоне');
    const option=scene.choices.find(o=>o.value===value);
    if(!option)throw new Error('Неизвестное решение');
    if(s.decisions[scene.decision]!==undefined)throw new Error('Решение уже зафиксировано');
    const snapshot=clone(s);snapshot.checkpoints={};s.checkpoints[scene.decision]=snapshot;
    s.decisions[scene.decision]=value;derive(s);enter(data,s,option.to);return s;
  }
  function advance(data,state) {
    const s=clone(state),scene=data.scenes[s.sceneId],ls=lines(data,s);
    if(s.finishedChapter||s.finishedStory)return s;
    if(pendingInteraction(data,s))return s;
    if(s.lineIndex<ls.length-1){s.lineIndex++;record(data,s);s.updatedAt=Date.now();return s;}
    if(scene.choices)return s;
    const chapter=data.chapters.find(c=>c.id===scene.chapter);
    if(scene.id===chapter.end){
      if(!s.completedChapters.includes(chapter.id))s.completedChapters.push(chapter.id);
      derive(s);
      if(s.mode==='chapter'){s.finishedChapter=true;s.updatedAt=Date.now();return s;}
      if(!scene.next){s.finishedStory=true;s.updatedAt=Date.now();return s;}
    }
    return scene.next?enter(data,s,scene.next):s;
  }
  function restore(data,value) {
    if(!value||value.saveVersion!==1||!['story','chapter'].includes(value.mode)||!data.scenes[value.sceneId])return null;
    if(!value.decisions||!Array.isArray(value.completedChapters)||!Array.isArray(value.inspectedEvidence)||!Array.isArray(value.history))return null;
    for(const [id,v] of Object.entries(value.decisions)){
      const scene=Object.values(data.scenes).find(sc=>sc.decision===id);
      if(!scene?.choices.some(o=>o.value===v))return null;
    }
    const s=derive(clone(value));s.chapterId=data.scenes[s.sceneId].chapter;
    s.checkpoints=s.checkpoints||{};s.seenPosts=s.seenPosts||[];s.reflectionAnswers=s.reflectionAnswers||{};
    s.interactions=s.interactions||{};s.phoneProgress=s.phoneProgress||{};s.deliveredMessages=s.deliveredMessages||[];s.phoneView=['story','phone'].includes(s.phoneView)?s.phoneView:'story';
    if(s.contentVersion!==3){const current=lines(data,s),previous=data.scenes[s.sceneId].lines.filter(l=>(!l.when||conditions[l.when]?.(s))&&(s.contentVersion===2||l.legacy!==false));const oldIndex=Math.max(0,Math.min(Number(s.lineIndex)||0,previous.length-1));const target=previous.slice(oldIndex).find(l=>current.includes(l))||current.at(-1);s.lineIndex=Math.max(0,current.indexOf(target));s.contentVersion=3;}
    s.lineIndex=Math.max(0,Math.min(Number(s.lineIndex)||0,lines(data,s).length-1));return s;
  }
  function fork(data,state,id) {
    const checkpoint=state.checkpoints[id];if(!checkpoint)throw new Error('Нет сохранённой точки выбора');
    const s=restore(data,checkpoint);s.mode='chapter';s.entryChapter=data.scenes[s.sceneId].chapter;s.finishedChapter=false;s.finishedStory=false;s.checkpoints={};return derive(s);
  }
  function results(s) {
    const d=s.decisions;
    const code=d.D1_CODE===undefined?null:s.codeShared?(s.savingsTransferred?'Код передан, переведено 180 BYN':'Код передан; перевод остановлен'):'Код остался у Пети';
    const table={shared:'Таблица отправлена Артёму',refused:'Петя отказался передавать таблицу',verified:'Поручение проверено у старосты и мастера'}[s.dataOutcome];
    const voice=s.voiceOutcome==='transferred'?'Переведено 120 BYN':s.voiceOutcome==='verified'?'Проверено звонком по сохранённому номеру':null;
    const pub={forwarded:'Оба изображения пересланы',masked:'Имя закрыто, изображения опубликованы',supported:'Петя не пересылал и поддержал Кристину'}[s.publicationOutcome];
    return [
      {chapter:'CH01',decision:'D1_CODE',title:'Код и доверие',action:code,consequence:code?(s.codeShared?(s.savingsTransferred?'Посторонний получил доступ к аккаунту. Потеряно 180 BYN; возврат не подтверждён.':'Посторонний получил доступ к аккаунту. Петя остановил дальнейший перевод и попросил помощи.'):'Профиль Ани оказался поддельным. Аккаунт сохранил защиту.'):null,advice:'Прочитайте назначение кода. Не передавайте код входа. Необычную просьбу друга проверьте через знакомый контакт.'},
      {chapter:'CH02',decision:'D2_TABLE',title:'Данные группы',action:table,consequence:table?(s.dataOutcome==='shared'?'Контакты ушли неизвестному через посредника. Нужно сообщить ответственному сотруднику и предупредить затронутых людей.':s.dataOutcome==='verified'?'Неизвестный не получил таблицу. Проверка помогла остановить сбор данных.':'Подтверждённой передачи нет. Артём продолжил искать контакты, пока схему не заметила староста.'):null,advice:'Уточните цель, получателя и полномочия. Знакомый посредник тоже может ошибиться.'},
      {chapter:'CH03',decision:'D3_VOICE',title:'Знакомый голос',action:voice,detail:s.askedForMoreAudio?'Сначала запрошено ещё одно голосовое из того же аккаунта.':null,consequence:voice?(s.voiceOutcome==='transferred'?'Мама ничего не просила. Потеряно 120 BYN; Петя обратился за помощью.':'Мама подтвердила, что ничего не отправляла. Деньги не переведены.'):null,advice:'Второе сообщение из того же профиля не даёт независимого подтверждения. Перезвоните по сохранённому номеру.'},
      {chapter:'CH04',decision:'D4_SHARE',title:'Чужое изображение',action:pub,consequence:pub?(s.publicationOutcome==='supported'?'Петя не увеличил аудиторию подделки и помог проверить источник без новой публикации.':'Подделка разошлась дальше. Даже после удаления своей публикации могут остаться копии, а Кристине нужно время.'):null,advice:'Скриншот не доказывает обвинение. Скрытое имя не обезличивает узнаваемое лицо. Поддержите пострадавшего и проверяйте без новой пересылки.'}
    ];
  }
  const api={create,derive,lines,record,enter,choose,advance,restore,fork,results,clone,conditions,pendingInteraction,interact};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else g.NovelEngine=api;
})(globalThis);

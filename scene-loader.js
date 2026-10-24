(function(g){
 'use strict';
 class ImageCache{
  constructor(createImage=()=>new Image()){this.createImage=createImage;this.items=new Map();}
  load(url){
   if(this.items.has(url))return this.items.get(url);
   const promise=(async()=>{const image=this.createImage();image.decoding='async';
    if(typeof image.decode==='function'){image.src=url;await image.decode();}
    else await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(new Error('Image unavailable: '+url));image.src=url;});
    if(!image.naturalWidth)throw new Error('Empty image: '+url);return image;
   })().catch(error=>{this.items.delete(url);throw error;});
   this.items.set(url,promise);return promise;
  }
  preload(urls){return Promise.all([...new Set(urls.filter(Boolean))].map(url=>this.load(url)));}
 }
 class ScenePreloader{
  constructor(cache=new ImageCache()){this.cache=cache;this.generation=0;}
  cancel(){this.generation++;}
  async prepare(urls,commit){const generation=++this.generation;await this.cache.preload(urls);if(generation!==this.generation)return false;await commit();return generation===this.generation;}
 }
 function assets(data,state,visual,feeds){
  const scene=data.scenes[state.sceneId],art=Object.fromEntries(visual.assets.map(a=>[a.id,'assets/'+a.file]));
  const urls=new Set([art[scene.bg],art.ILL02]);const roles=new Set(['petya']);
  for(const line of scene.lines){if(!visual.characters[line.speaker])continue;roles.add(line.speaker);const c=visual.characters[line.speaker];urls.add('assets/'+(c.sprites[line.emotion]||c.sprites.neutral));}
  const kind=scene.phone||'';
  if(/anya/i.test(kind)||kind==='threatCall')roles.add('anya');if(/mother|familyMemory/.test(kind))roles.add('mother');
  if(['groupChat','groupInbox','publication','forwarded','masked','support'].includes(kind))for(const role of ['artem','dasha','kristina'])roles.add(role);
  if(kind==='familyMemory')urls.add(art.ILL06);
  if(kind==='official')roles.add('curator');if(kind==='table')roles.add('irina');
  const feed=kind==='feedMorning'?'morning':kind==='feedAfternoon'?'afternoon':kind==='feedEvening'?'epilogue':null;
  for(const card of feeds.filter(f=>f.feed===feed)){if(card.image)urls.add('assets/'+card.image);if(card.avatarCharacter)roles.add(card.avatarCharacter);}
  for(const role of roles){const c=visual.characters[role];if(c?.avatar?.file)urls.add('assets/'+c.avatar.file);}
  return [...urls].filter(Boolean);
 }
 const api={ImageCache,ScenePreloader,assets};if(typeof module!=='undefined'&&module.exports)module.exports=api;else g.NovelScene=api;
})(globalThis);

(()=>{
  const SESSION_KEY='lc.analytics.session';
  const SESSION_TIMEOUT=30*60*1000;
  const MAX_PROPERTY_KEYS=24;
  const now=()=>Date.now();
  const uuid=()=>globalThis.crypto?.randomUUID?globalThis.crypto.randomUUID().replaceAll('-',''):(Date.now().toString(36)+Math.random().toString(36).slice(2)+Math.random().toString(36).slice(2));
  function loadSession(){
    try{
      const raw=localStorage.getItem(SESSION_KEY),parsed=raw?JSON.parse(raw):null,t=now();
      if(parsed?.id&&parsed?.lastAt&&t-parsed.lastAt<SESSION_TIMEOUT){
        parsed.lastAt=t;localStorage.setItem(SESSION_KEY,JSON.stringify(parsed));return parsed.id;
      }
      const next={id:uuid(),lastAt:t};localStorage.setItem(SESSION_KEY,JSON.stringify(next));return next.id;
    }catch{return uuid()}
  }
  let sessionId=loadSession();
  function touchSession(){
    try{
      const raw=localStorage.getItem(SESSION_KEY),parsed=raw?JSON.parse(raw):null,t=now();
      if(!parsed?.id||t-(parsed.lastAt||0)>=SESSION_TIMEOUT){sessionId=uuid();localStorage.setItem(SESSION_KEY,JSON.stringify({id:sessionId,lastAt:t}))}
      else{sessionId=parsed.id;parsed.lastAt=t;localStorage.setItem(SESSION_KEY,JSON.stringify(parsed))}
    }catch{}
    return sessionId;
  }
  function deviceType(){
    const w=Math.max(document.documentElement?.clientWidth||0,innerWidth||0);
    if(w<=620)return'mobile';
    if(w<=900)return'tablet';
    return'desktop';
  }
  function cleanProperties(input){
    if(!input||typeof input!=='object'||Array.isArray(input))return{};
    const out={};let count=0;
    for(const [k,v] of Object.entries(input)){
      if(count>=MAX_PROPERTY_KEYS)break;
      if(!/^[a-zA-Z0-9_]{1,48}$/.test(k))continue;
      if(v===null||typeof v==='boolean'||typeof v==='number')out[k]=v;
      else if(typeof v==='string')out[k]=v.slice(0,240);
      count++;
    }
    return out;
  }
  async function track(eventName,context={},properties={},options={}){
    if(!window.LCSupabase?.rpc)return null;
    touchSession();
    const args={
      p_event_name:eventName,
      p_session_id:sessionId,
      p_path:location.pathname,
      p_course_id:context.courseId||null,
      p_module_id:context.moduleId||null,
      p_lesson_id:context.lessonId||null,
      p_properties:cleanProperties(properties),
      p_device_type:deviceType(),
      p_viewport_width:Math.max(document.documentElement?.clientWidth||0,innerWidth||0)||null,
      p_viewport_height:Math.max(document.documentElement?.clientHeight||0,innerHeight||0)||null
    };
    try{return await LCSupabase.rpc('track_product_event',args,options)}
    catch{return null}
  }
  async function identify(){
    if(!window.LCSupabase?.rpc)return false;
    touchSession();
    try{await LCSupabase.rpc('identify_analytics_session',{p_session_id:sessionId});return true}catch{return false}
  }
  function once(key,fn){
    const k='lc.analytics.once.'+sessionId+'.'+key;
    try{if(sessionStorage.getItem(k))return false;sessionStorage.setItem(k,'1')}catch{}
    fn();return true;
  }
  function beginLesson(context){
    const ctx={courseId:context.courseId,moduleId:context.moduleId,lessonId:context.lessonId};
    once('lesson-open-'+context.lessonId,()=>track('lesson_opened',ctx,{
      lesson_position:Number(context.lessonPosition||0),
      estimated_minutes:Number(context.estimatedMinutes||0),
      lab_type:String(context.labType||'')
    }));
    if(context.labType)once('lab-open-'+context.lessonId,()=>track('lab_opened',ctx,{lab_type:String(context.labType)}));

    let activeStart=document.visibilityState==='visible'?performance.now():null;
    let activeMs=0,maxScroll=0,sent=false,labComplete=false;
    const collect=()=>{
      if(activeStart!==null){activeMs+=performance.now()-activeStart;activeStart=null}
    };
    const resume=()=>{if(document.visibilityState==='visible'&&activeStart===null)activeStart=performance.now()};
    const measureScroll=()=>{
      const doc=document.documentElement,den=Math.max(1,doc.scrollHeight-innerHeight);
      maxScroll=Math.max(maxScroll,Math.round(Math.min(100,Math.max(0,scrollY/den*100))));
    };
    const send=()=>{
      if(sent)return;collect();measureScroll();
      const seconds=Math.min(1800,Math.round(activeMs/1000));
      if(seconds<3)return;
      sent=true;
      track('lesson_engagement',ctx,{duration_seconds:seconds,max_scroll_percent:maxScroll},{keepalive:true});
    };
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')collect();else resume()});
    addEventListener('scroll',measureScroll,{passive:true});
    addEventListener('pagehide',send,{once:true});
    addEventListener('beforeunload',send,{once:true});
    addEventListener('lc:lab-complete',e=>{
      if(labComplete)return;labComplete=true;
      track('lab_completed',ctx,{lab_type:String(context.labType||e.detail?.type||''),result_type:String(e.detail?.type||'')});
    });
    addEventListener('lc:inline-check',e=>track('inline_check_answered',ctx,{
      correct:!!e.detail?.correct,
      block_index:Number(e.detail?.blockIndex??-1)
    }));
    return{finish:send};
  }
  window.LCAnalytics={track,identify,once,beginLesson,sessionId:()=>sessionId,deviceType};
})();
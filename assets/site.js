(() => {
  'use strict';
  const root=document.documentElement;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const editing=new URLSearchParams(location.search).get('bearbeiten')==='1';
  root.classList.toggle('is-editing',editing);
  document.querySelectorAll('button[data-video]').forEach(button=>button.addEventListener('click',()=>{
    if(editing||!/^[A-Za-z0-9_-]{11}$/.test(button.dataset.video))return;
    const player=document.createElement('iframe');
    player.className='video-player';
    player.src='https://www.youtube-nocookie.com/embed/'+button.dataset.video+'?autoplay=1&rel=0';
    player.title=button.dataset.videoTitle||'Erklärvideo';
    player.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';
    player.allowFullscreen=true;
    player.referrerPolicy='strict-origin-when-cross-origin';
    button.replaceWith(player);
    player.focus();
  }));
  const local=['127.0.0.1','localhost','::1','[::1]'].includes(location.hostname);
  const privatePreview=location.hostname==='wunsch-indikator-neu.lofty-grebe-4026.chatgpt.site';
  if((local||privatePreview)&&!editing&&window.self===window.top){
    const slug=location.pathname.replace(/^\/+|\/+$/g,'');
    const editorLink=document.createElement('a');
    editorLink.className='editor-launch';
    editorLink.textContent='✎ Texte & Bilder bearbeiten';
    editorLink.href=local?`http://127.0.0.1:8083/__editor/?seite=${encodeURIComponent(slug)}`:`/bearbeiten.html?seite=${encodeURIComponent(slug)}`;
    editorLink.setAttribute('aria-label','Diese Seite im Text- und Bildeditor bearbeiten');
    document.body.append(editorLink);
  }
  const menu=document.querySelector('.menu-toggle'),nav=document.getElementById('navigation');
  function closeMenu(){nav?.classList.remove('is-open');menu?.setAttribute('aria-expanded','false');}
  menu?.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));nav.classList.toggle('is-open',open);});
  nav?.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu?.getAttribute('aria-expanded')==='true'){closeMenu();menu.focus();}});
  addEventListener('resize',()=>{if(innerWidth>1000)closeMenu();},{passive:true});
  let observer;
  const revealElements=[...document.querySelectorAll('.reveal')];
  if('IntersectionObserver' in window&&!editing&&!reduced.matches){
    root.classList.add('motion-ready');
    document.querySelectorAll('.service-grid,.process-grid,.project-grid,.three-col,.review-grid').forEach(group=>{[...group.children].forEach((el,i)=>el.style.setProperty('--delay',`${i*100}ms`));});
    observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}},{threshold:.06,rootMargin:'0px 0px -25px 0px'});
    revealElements.forEach(el=>observer.observe(el));
  }
  const animated=[...document.querySelectorAll('[data-chart],[data-bot-demo]')];
  document.querySelectorAll('[data-chart]').forEach(el=>{const toggle=document.createElement('button');toggle.type='button';toggle.className='motion-toggle chart-toggle';toggle.textContent='Animation pausieren';toggle.setAttribute('aria-pressed','false');el.querySelector('.terminal-bottom').append(toggle);toggle.addEventListener('click',()=>{const paused=el.classList.toggle('is-paused');toggle.setAttribute('aria-pressed',String(paused));toggle.textContent=paused?'Animation fortsetzen':'Animation pausieren';syncMotion();});});
  const inView=new Set();
  const botFlows=[...document.querySelectorAll('[data-bot-demo]')].map(el=>{
    const nodes=[...el.querySelectorAll('[data-step]')];
    const wires=[...el.querySelectorAll('.flow-wire')];
    const status=el.querySelector('.bot-status');
    const statuses=[status.textContent.trim(),'Signal erkannt → Risikoregeln prüfen','Risiko geprüft → Order vorbereiten','Order nach Regeln ausgeführt.'];
    let elapsed=0,previousTime=null,frame=null,previousPhase=-1,previousWire=-1;

    function render(){
      const phase=elapsed<3000?0:elapsed<6000?1:elapsed<7500?2:3;
      if(phase!==previousPhase){
        nodes.forEach((node,i)=>node.classList.toggle('is-active',i===Math.min(phase,2)));
        // Im Editor bleibt das Textfeld erhalten, auch während der Ablauf läuft.
        if(!editing)status.textContent=statuses[phase];
        el.classList.toggle('is-complete',phase===3&&!editing);
        previousPhase=phase;
      }
      const wireIndex=elapsed<3000?0:1;
      if(wireIndex!==previousWire){
        wires.forEach((wire,i)=>wire.classList.toggle('is-transmitting',i===wireIndex));
        previousWire=wireIndex;
      }
      const departure=wireIndex===0?1800:4800;
      const progress=Math.max(0,Math.min(1,(elapsed-departure)/1200));
      wires[wireIndex]?.style.setProperty('--flow-progress',progress.toFixed(4));
    }

    function tick(now){
      if(previousTime!==null)elapsed=(elapsed+Math.min(now-previousTime,100))%9000;
      previousTime=now;
      render();
      frame=requestAnimationFrame(tick);
    }

    function setPlaying(playing){
      if(playing&&frame===null){
        previousTime=null;
        frame=requestAnimationFrame(tick);
      }else if(!playing&&frame!==null){
        cancelAnimationFrame(frame);
        frame=null;
        previousTime=null;
      }
    }

    el.querySelector('.motion-toggle')?.addEventListener('click',e=>{
      const paused=el.classList.toggle('is-paused');
      e.currentTarget.setAttribute('aria-pressed',String(paused));
      e.currentTarget.textContent=paused?'Animation fortsetzen':'Animation pausieren';
      syncMotion();
    });
    render();
    return {element:el,setPlaying};
  });
  function syncMotion(){
    root.classList.toggle('reduce-motion',reduced.matches);
    animated.forEach(el=>el.classList.toggle('is-playing',inView.has(el)&&!document.hidden&&!reduced.matches&&(!editing||el.matches('[data-bot-demo],[data-structure-demo]'))&&!el.classList.contains('is-paused')));
    botFlows.forEach(flow=>flow.setPlaying(flow.element.classList.contains('is-playing')));
    if(reduced.matches){root.classList.remove('motion-ready');observer?.disconnect();}
  }
  if('IntersectionObserver' in window){const motionObserver=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting)inView.add(e.target);else inView.delete(e.target);});syncMotion();},{threshold:.1});animated.forEach(el=>motionObserver.observe(el));}
  reduced.addEventListener('change',syncMotion);document.addEventListener('visibilitychange',syncMotion);syncMotion();
  const progress=document.querySelector('.reading-progress');let ticking=false;
  function updateProgress(){const max=document.documentElement.scrollHeight-innerHeight;const p=max>0?Math.min(1,scrollY/max):0;if(progress)progress.style.transform=`scaleX(${p})`;ticking=false;}
  addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(updateProgress);}},{passive:true});updateProgress();
})();

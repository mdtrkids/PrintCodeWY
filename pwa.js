(() => {
  const panel=document.getElementById('install-panel');
  const button=document.getElementById('install-app');
  const help=document.getElementById('install-help');
  const standalone=window.matchMedia('(display-mode: standalone)');
  let pendingPrompt=null;
  const sync=()=>{panel.hidden=standalone.matches||navigator.standalone===true;};
  sync();standalone.addEventListener('change',sync);
  if(/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1)){
    help.textContent='บน iPhone / iPad เปิดด้วย Safari → แชร์ → เพิ่มไปยังหน้าจอโฮม';
  }
  if(location.protocol==='file:')help.textContent='นำเว็บขึ้น GitHub Pages แล้วเปิดลิงก์ HTTPS บนมือถือ เพื่อติดตั้งบนหน้าจอหลัก';
  window.addEventListener('beforeinstallprompt',event=>{
    event.preventDefault();pendingPrompt=event;button.hidden=false;
  });
  button.addEventListener('click',async()=>{
    if(!pendingPrompt)return;
    const prompt=pendingPrompt;pendingPrompt=null;button.hidden=true;
    try{await prompt.prompt();await prompt.userChoice;}catch{help.textContent='เปิดเมนูเบราว์เซอร์ แล้วเลือกติดตั้งแอปหรือเพิ่มลงในหน้าจอหลัก';}
  });
  window.addEventListener('appinstalled',()=>{pendingPrompt=null;panel.hidden=true;});
  if('serviceWorker' in navigator&&['https:','http:'].includes(location.protocol)){
    window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{
      help.textContent+=' · ยังเตรียมใช้งานออฟไลน์ไม่สำเร็จ กรุณาเชื่อมต่ออินเทอร์เน็ตแล้วเปิดเว็บอีกครั้ง';
    }));
  }
})();

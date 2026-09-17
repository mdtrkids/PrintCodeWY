const $=id=>document.getElementById(id);
let workbook=null,sourceRows=[],codes=[],loading=false,revision=0;
const purpose=()=>document.querySelector('input[name=purpose]:checked').value;
const expiryText=()=>$('expiry').value.split('-').reverse().join('/');
$('expiry').value=`${new Date().getFullYear()}-12-31`;
function refresh(){
  const lotNumber=Number($('lot-number').value);
  $('lot').value=$('lot-number').value&&$('lot-number').validity.valid&&Number.isInteger(lotNumber)?`WY${String(new Date().getFullYear()).slice(-2)} LOT.${String(lotNumber).padStart(2,'0')}`:'';
  const data=CodeExport.extract(sourceRows,Number($('header-row').value)-1,Number($('column').value),$('dedupe').checked);
  codes=data.codes;$('count').textContent=`${codes.length.toLocaleString('th-TH')} รายการ`;
  $('rows').replaceChildren();
  for(const code of codes.slice(0,100)){
    const tr=document.createElement('tr');
    for(const value of [code,expiryText()||'—',$('lot').value.trim()||'—',purpose()]){const td=document.createElement('td');td.textContent=value;tr.append(td);}
    $('rows').append(tr);
  }
  $('empty').hidden=codes.length>0;
  $('stats').textContent=`แสดง ${Math.min(codes.length,100)} จาก ${codes.length.toLocaleString('th-TH')} รายการ · ข้ามช่องว่าง ${data.blanks} · พบ CODE ซ้ำ ${data.duplicates}${$('dedupe').checked?' (ตัดออกแล้ว)':''}`;
  const valid=!loading&&codes.length>0&&$('lot').value.trim()&&$('expiry').value&&$('expiry').validity.valid&&$('header-row').validity.valid;
  $('export').disabled=!valid;$('ready').textContent=valid?'พร้อมส่งออกข้อมูลครบทุกแถว':'อัปโหลดไฟล์และกรอกชื่อ Lot / วันหมดอายุให้ครบ';
}
function setColumns(){
  const index=Number($('header-row').value)-1;
  $('column').replaceChildren();
  const row=sourceRows[index]||[];
  const width=Math.max(row.length,...sourceRows.slice(0,100).map(r=>r.length),0);
  for(let c=0;c<width;c++)$('column').add(new Option(`${XLSX.utils.encode_col(c)} · ${row[c]||'ไม่มีหัวคอลัมน์'}`,c));
  const detected=row.findIndex(v=>String(v).trim().toLowerCase()==='code');
  if(detected>=0)$('column').value=String(detected);
  $('status').textContent=detected<0?'ไม่พบหัวคอลัมน์ CODE ในแถวนี้ กรุณาเลือกแถวหัวตารางและคอลัมน์ที่ต้องการ':'';
  refresh();
}
function setSheet(){
  sourceRows=XLSX.utils.sheet_to_json(workbook.Sheets[$('sheet').value],{header:1,raw:false,defval:'',blankrows:true});
  let index=sourceRows.findIndex(r=>r.some(v=>String(v).trim().toLowerCase()==='code'));
  $('header-row').value=index<0?1:index+1;$('header-row').max=Math.max(sourceRows.length,1);setColumns();
}
async function loadFile(file){
  if(!file)return;const token=++revision;loading=true;workbook=null;sourceRows=[];$('mapping').hidden=true;refresh();$('file-name').textContent=file.name;
  try{
    if(!/\.xlsx?$/i.test(file.name))throw new Error('กรุณาเลือกไฟล์ .xls หรือ .xlsx');
    if(file.size>20*1024*1024)throw new Error('รองรับไฟล์ขนาดไม่เกิน 20 MB');
    if(!window.XLSX)throw new Error('โหลดตัวอ่าน Excel ไม่สำเร็จ กรุณาตรวจสอบไฟล์ vendor/xlsx.full.min.js');
    $('status').textContent='กำลังอ่านไฟล์…';
    const buffer=await file.arrayBuffer();if(token!==revision)return;
    const text=new TextDecoder('utf-8').decode(buffer);
    if(/^\s*(?:<|\uFEFF)/.test(text)&&/<table[\s>]/i.test(text)){
      // Parse as inert text. Never insert uploaded markup into the page.
      const doc=new DOMParser().parseFromString(text,'text/html');const table=doc.querySelector('table');
      const rows=Array.from(table.rows,r=>Array.from(r.cells,c=>c.textContent));
      workbook=XLSX.utils.book_new();XLSX.utils.book_append_sheet(workbook,XLSX.utils.aoa_to_sheet(rows),'Sheet1');
    }else workbook=XLSX.read(buffer,{type:'array',cellText:true});
    if(!workbook.SheetNames.length)throw new Error('ไม่พบชีตในไฟล์');
    $('sheet').replaceChildren();for(const name of workbook.SheetNames)$('sheet').add(new Option(name,name));
    const best=workbook.SheetNames.find(n=>XLSX.utils.sheet_to_json(workbook.Sheets[n],{header:1,raw:false}).some(r=>r.some(v=>String(v).trim().toLowerCase()==='code')));
    if(!best)throw new Error('ไม่พบหัวคอลัมน์ CODE กรุณาเพิ่มหัวคอลัมน์ code ในไฟล์แล้วอัปโหลดอีกครั้ง');
    $('sheet').value=best;
    setSheet();
  }catch(error){workbook=null;sourceRows=[];$('mapping').hidden=true;$('status').textContent=error.message||'อ่านไฟล์ไม่ได้ กรุณาตรวจสอบไฟล์ Excel';}
  finally{if(token===revision){loading=false;refresh();}}
}
$('file').addEventListener('change',e=>loadFile(e.target.files[0]));
$('sheet').addEventListener('change',setSheet);$('header-row').addEventListener('input',setColumns);
for(const id of ['column','lot-number','expiry','dedupe'])$(id).addEventListener('input',refresh);
document.querySelectorAll('[name=purpose]').forEach(el=>el.addEventListener('change',refresh));
for(const event of ['dragenter','dragover'])$('drop').addEventListener(event,e=>{e.preventDefault();$('drop').classList.add('drag');});
for(const event of ['dragleave','drop'])$('drop').addEventListener(event,e=>{e.preventDefault();$('drop').classList.remove('drag');});
$('drop').addEventListener('drop',e=>loadFile(e.dataTransfer.files[0]));
$('export').addEventListener('click',()=>{
  refresh();if($('export').disabled)return;
  const blob=new Blob([CodeExport.csv(codes,expiryText(),$('lot').value.trim(),purpose(),$('excel-mode').checked)],{type:'text/csv;charset=utf-8;'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='Code.csv';
  document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
});refresh();

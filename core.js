(function(root){
  function cleanCode(value){return String(value??'').trim().replace(/^'/,'');}
  function extract(rows,header,column,dedupe){
    const codes=[];const seen=new Set();let blanks=0,duplicates=0;
    for(const row of rows.slice(header+1)){
      const code=cleanCode(row[column]);if(!code){blanks++;continue;}
      if(seen.has(code)){duplicates++;if(dedupe)continue;}seen.add(code);codes.push(code);
    }return {codes,blanks,duplicates};
  }
  function csv(codes,exp,lot,purpose,excelMode=false){
    const quote=v=>'"'+String(v).replace(/"/g,'""')+'"';
    // Only wrap digits in a literal Excel formula; never interpolate arbitrary formulas.
    const codeValue=c=>excelMode&&/^\d+$/.test(c)?`="${c}"`:c;
    return '\uFEFF'+[['CODE','EXP','Lot','ใช้สำหรับ'],...codes.map(c=>[codeValue(c),exp,lot,purpose])].map(r=>r.map(quote).join(',')).join('\r\n')+'\r\n';
  }
  root.CodeExport={cleanCode,extract,csv};if(typeof module!=='undefined')module.exports=root.CodeExport;
})(typeof window!=='undefined'?window:globalThis);

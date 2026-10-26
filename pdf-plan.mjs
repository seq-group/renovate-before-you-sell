// Small, self-contained PDF export. No visitor details leave the device.
const ascii=s=>String(s).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[’‘]/g,"'").replace(/[–—−]/g,'-').replace(/[^\x20-\x7e]/g,' ');
const literal=s=>ascii(s).replace(/[\\()]/g,'\\$&');
function wrap(text,width=83){const words=ascii(text).split(/\s+/);const lines=[];let line='';for(const word of words){if((line+' '+word).trim().length>width&&line){lines.push(line);line=word}else line=(line+' '+word).trim()}if(line)lines.push(line);return lines}
export function generatePlanPdf(items,dateLabel){
 const pages=[];let commands=[],y;
 const text=(s,x,y,size=10,bold=false,gray=0)=>commands.push(`${gray} g BT /${bold?'F2':'F1'} ${size} Tf 1 0 0 1 ${x} ${y} Tm (${literal(s)}) Tj ET`);
 function page(){if(commands.length)pages.push(commands.join('\n'));commands=[];commands.push('0 g 0 744 595 98 re f');text('NGU / TEAM CYRIL',42,807,10,true,1);text('MY PRE-SALE PLAN',42,773,26,true,1);text(items.length+' selected job'+(items.length===1?'':'s')+' | '+ascii(dateLabel),42,721,10,false,.4);y=689}
 function room(height){if(y-height<95)page()}
 page();
 const labels={spend:'SPEND - PRIORITISE THE ESSENTIALS',fix:'FIX - INVESTIGATE AND REPAIR',ask:'ASK FIRST - CHECK BEFORE COMMITTING',skip:'SKIP - RECONSIDER BEFORE SPENDING'};
 for(const [key,label] of Object.entries(labels)){
  const group=items.filter(j=>j[2]===key);if(!group.length)continue;
  room(105);commands.push(`0.82 G 0.5 w 42 ${y+9} m 553 ${y+9} l S`);text(label,42,y-9,11,true);y-=35;
  for(const item of group){const names=wrap('[ ] '+item[1],74),reasons=wrap(item[3],88);const height=names.length*15+reasons.length*13+16;room(height);for(const line of names){text(line,42,y,11,true);y-=15}for(const line of reasons){text(line,57,y,9,false,.35);y-=13}y-=16}
  y-=12;
 }
 pages.push(commands.join('\n'));
 const objects=[];const add=o=>{objects.push(o);return objects.length};add('<< /Type /Catalog /Pages 2 0 R >>');add('');const f1=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'),f2=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');const kids=[];
 pages.forEach((body,index)=>{const footer=`0.4 g BT /F1 7 Tf 1 0 0 1 42 82 Tm (GENERAL GUIDE ONLY. Discuss costs, timing and suitability with Cyril before committing to work.) Tj ET\nBT /F1 7 Tf 1 0 0 1 42 71 Tm (Use qualified trades. No renovation return or sale outcome is guaranteed.) Tj ET\n0.65 G 42 60 m 553 60 l S\n0.3 g BT /F1 8 Tf 1 0 0 1 42 49 Tm (CYRIL TEXIER / NGU REAL ESTATE - 0402 293 358) Tj ET\nBT /F1 8 Tf 1 0 0 1 488 49 Tm (PAGE ${index+1} / ${pages.length}) Tj ET`;
 const stream=body+'\n'+footer;const content=add(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);const pageId=add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${f1} 0 R /F2 ${f2} 0 R >> >> /Contents ${content} 0 R >>`);kids.push(`${pageId} 0 R`)});
 objects[1]=`<< /Type /Pages /Count ${pages.length} /Kids [${kids.join(' ')}] >>`;let pdf='%PDF-1.4\n',offsets=[0];objects.forEach((o,i)=>{offsets.push(pdf.length);pdf+=`${i+1} 0 obj\n${o}\nendobj\n`});const xref=pdf.length;pdf+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`+offsets.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('');pdf+=`trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;return new TextEncoder().encode(pdf);
}

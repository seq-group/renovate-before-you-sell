(async()=>{
'use strict';
const {AREAS}=await import('./jobs.js');
const labels={spend:'Spend',fix:'Fix',ask:'Ask first',skip:'Skip'};
const jobs=new Map(AREAS.flatMap(a=>a.items.map(i=>[i[0],i])));
let selected=new Set();
try{const stored=JSON.parse(localStorage.getItem('ngu-renovate-plan')||'[]');if(Array.isArray(stored))selected=new Set(stored.filter(id=>jobs.has(id)))}catch{}
const areas=document.getElementById('jobAreas');
AREAS.forEach((area,index)=>{
 const section=document.createElement('details');section.className='job-area';section.open=index===0;
 const summary=document.createElement('summary');summary.innerHTML='<span>0'+(index+1)+'</span><span class="area-name"></span><b class="icon-plus" aria-hidden="true"></b>';summary.querySelector('.area-name').textContent=area.name;section.append(summary);
 const list=document.createElement('div');list.className='job-list';
 area.items.forEach(item=>{
  const row=document.createElement('label');row.className='job';
  const input=document.createElement('input');input.type='checkbox';input.value=item[0];input.id='job-'+item[0];input.checked=selected.has(item[0]);
  const copy=document.createElement('span');const name=document.createElement('span');name.className='job-name';name.textContent=item[1];const reason=document.createElement('span');reason.className='job-reason';reason.textContent=item[3];copy.append(name,reason);
  const badge=document.createElement('span');badge.className='badge '+item[2];badge.textContent=labels[item[2]];
  row.append(input,copy,badge);list.append(row);
  input.addEventListener('change',()=>{if(input.checked)selected.add(item[0]);else selected.delete(item[0]);sync();save()});
 });section.append(list);areas.append(section);
});
function save(){try{localStorage.setItem('ngu-renovate-plan',JSON.stringify([...selected]))}catch{}}
function planText(){return Object.keys(labels).map(key=>{const rows=[...selected].map(id=>jobs.get(id)).filter(j=>j[2]===key);return rows.length?labels[key].toUpperCase()+'\n'+rows.map(j=>'- '+j[1]).join('\n'):''}).filter(Boolean).join('\n\n')}
function sync(){
 const n=selected.size;document.getElementById('jobCount').textContent=n+' job'+(n===1?'':'s');document.getElementById('attachedCount').textContent='('+n+' job'+(n===1?'':'s')+')';document.getElementById('mobileCount').textContent=n;
 const container=document.getElementById('planGroups');container.replaceChildren();
 if(!n){const empty=document.createElement('p');empty.className='empty';empty.textContent='Choose a few jobs from the list. Your plan will take shape here.';container.append(empty)}
 Object.keys(labels).forEach(key=>{const rows=[...selected].map(id=>jobs.get(id)).filter(j=>j[2]===key);if(!rows.length)return;const group=document.createElement('div');group.className='plan-group';const badge=document.createElement('span');badge.className='badge '+key;badge.textContent=labels[key];const ul=document.createElement('ul');rows.forEach(j=>{const li=document.createElement('li');li.textContent=j[1];ul.append(li)});group.append(badge,ul);container.append(group)});
 document.getElementById('planField').value=planText()||'No jobs selected';
}
sync();
document.getElementById('clearPlan').addEventListener('click',()=>{selected.clear();areas.querySelectorAll('input').forEach(i=>i.checked=false);sync();save();document.getElementById('planStatus').textContent='Your list is clear. Choose the jobs you’re considering.'});
document.getElementById('copyPlan').addEventListener('click',async()=>{const status=document.getElementById('planStatus');if(!selected.size){status.textContent='Choose at least one job first.';return}try{await navigator.clipboard.writeText('My pre-sale preparation plan\n\n'+planText());status.textContent='Copied. Keep it somewhere useful.'}catch{status.textContent='Copy isn’t available in this browser. Your selections are still saved here.'}});
document.getElementById('downloadPlan').addEventListener('click',async()=>{
 const status=document.getElementById('planStatus');
 if(!selected.size){status.textContent='Choose at least one job to download your personal plan.';return}
 try{
  const {generatePlanPdf}=await import('./pdf-plan.mjs');
  const date=new Date().toLocaleDateString('en-AU',{day:'numeric',month:'long',year:'numeric'});
  const bytes=generatePlanPdf([...selected].map(id=>jobs.get(id)),date);
  const url=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));
  const a=document.createElement('a');a.href=url;a.download='My-Pre-Sale-Plan-Team-Cyril.pdf';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
  status.textContent='Your personal PDF is ready. The same selected jobs can be included with your inquiry.';
 }catch{status.textContent='The download could not be prepared. Please use Copy my list or try again.'}
});
const form=document.getElementById('inquiryForm'),submit=document.getElementById('submitButton'),error=document.getElementById('formError');
document.getElementById('returnUrl').value=new URL('thank-you.html',location.href).href;
let inFlight=false;
form.addEventListener('submit',async event=>{
 event.preventDefault();if(inFlight)return;error.hidden=true;
 if(!form.reportValidity())return;
 const phone=document.getElementById('phone'),normal=phone.value.replace(/[\s().-]/g,'');
 if(!/^(?:\+61|0061|0)[23478]\d{8}$/.test(normal)){phone.setCustomValidity('Please enter a valid Australian phone number, such as 0402 293 358.');phone.reportValidity();return}
 if(document.getElementById('website').value)return;
 inFlight=true;submit.disabled=true;submit.textContent='Sending your request…';
 const payload=Object.fromEntries(new FormData(form));
 payload.name=payload.name.trim();payload.email=payload.email.trim();payload._subject='Seller appraisal inquiry — '+payload.suburb.trim();payload._url=location.href.split('#')[0];
 payload['Preparation plan']=document.getElementById('attachPlan').checked?planText()||'No jobs selected':'Not included';delete payload._next;
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
 try{
  const response=await fetch('https://formsubmit.co/ajax/teamcyril@ngurealestate.com.au',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(payload),signal:controller.signal});
  const result=await response.json();
  if(!response.ok||!(result.success===true||result.success==='true'))throw new Error('submission');
  // Confirmation is based on acceptance by the delivery service, not a claim of inbox receipt.
  form.hidden=true;const success=document.getElementById('success');success.hidden=false;success.focus();
 }catch{
  error.textContent='We couldn’t confirm delivery. Your details are still here. Please try again, or call Cyril on 0402 293 358. If the connection timed out, check with Cyril before resending.';error.hidden=false;error.scrollIntoView({block:'center',behavior:'smooth'});
 }finally{clearTimeout(timer);inFlight=false;submit.disabled=false;submit.innerHTML='Request my plan &amp; appraisal <svg class="icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14"/></svg>'}
});
document.getElementById('phone').addEventListener('input',event=>event.target.setCustomValidity(''));
if('IntersectionObserver' in window){const dock=document.getElementById('mobileCta');new IntersectionObserver(entries=>{const hidden=entries[0].isIntersecting;dock.classList.toggle('hide',hidden);dock.inert=hidden}).observe(document.getElementById('enquire'))}
})();

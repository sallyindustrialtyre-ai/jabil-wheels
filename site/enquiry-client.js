(()=>{
const forms=[...document.querySelectorAll('[data-enquiry-form]')];
const language=document.documentElement.lang?.slice(0,2)||'en';
const dataPromise=Promise.all([fetch('/product-models.json').then(r=>r.json()),fetch('/upgrade-language.json').then(r=>r.json())]);
const html=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
dataPromise.then(([models,translations])=>{
 const t=translations[language]||translations.en;
 const read=()=>{try{return JSON.parse(localStorage.getItem('jabil-wheel-enquiry')||'[]')}catch{return []}};
 const queryId=new URLSearchParams(location.search).get('reference')||new URLSearchParams(location.search).get('product');
 let selected=read();if(queryId&&!selected.some(x=>x.id===queryId))selected.push({id:queryId,quantity:1});
 const model=id=>models.find(m=>m.id===id||m.variants.some(v=>v.id===id));
 const render=()=>{selected=selected.filter(x=>model(x.id));forms.forEach(f=>{f.dataset.products=JSON.stringify(selected);const box=f.querySelector('.selected-enquiry-products');if(box)box.innerHTML='<strong>'+html(t.select)+'</strong>'+ (selected.length?selected.map(x=>'<p>'+html(model(x.id).names[['en','es','ru'].indexOf(language)]||model(x.id).name)+' · '+html(x.id)+' <input aria-label="Quantity" type="number" min="1" max="99999" value="'+x.quantity+'" data-enquiry-qty="'+html(x.id)+'"> <button type="button" data-enquiry-remove="'+html(x.id)+'">'+html(t.remove)+'</button></p>').join(''):'<p>'+html(t.empty)+'</p>')})};
 const sync=()=>{localStorage.setItem('jabil-wheel-enquiry',JSON.stringify(selected));document.dispatchEvent(new CustomEvent('enquiry-basket-updated'));render()};
 document.addEventListener('change',e=>{if(e.target.dataset.enquiryQty){const x=selected.find(x=>x.id===e.target.dataset.enquiryQty);x.quantity=Math.max(1,Math.min(99999,Number(e.target.value)||1));sync()}else if(e.target.dataset.quantity)setTimeout(()=>{selected=read();render()},0)});
 document.addEventListener('click',e=>{const rm=e.target.closest('[data-enquiry-remove]');if(rm){selected=selected.filter(x=>x.id!==rm.dataset.enquiryRemove);sync()}else if(e.target.closest('[data-add],[data-remove],[data-clear-basket]'))setTimeout(()=>{selected=read();render()},0)});
 render();
 const $=id=>document.getElementById('up-'+id);
 if(!$('search'))return;
 const diameter=m=>m.source!=='catalogue'?'':m.rim.split(/[-*×]/).at(-1)?.match(/^\d+(?:\.\d+)?/)?.[0]||'';
 for(const [key,values] of [['diameter',models.map(diameter)],['structure',models.map(m=>m.structure)],['tyre',models.filter(m=>m.source==='catalogue').flatMap(m=>m.tyres)]])for(const v of [...new Set(values.filter(Boolean))].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}))){const o=document.createElement('option');o.value=v;o.textContent=v;$(key).append(o)}
 const normalize=v=>String(v||'').toLowerCase().normalize('NFKC').replace(/[×*]/g,'x').replace(/(\d)\.0+(?=\D|$)/g,'$1').replace(/[^a-z0-9]/g,'');
 const apply=()=>{let count=0;document.querySelectorAll('[data-model]').forEach(card=>{const m=models.find(m=>m.id===card.dataset.model);if(!m)return;const q=normalize($('search').value),rim=m.rim.split(/[×*x]/i).reverse().join('x');const text=normalize([m.id,m.rim,rim,m.name,...m.tyres,...m.variants.map(v=>v.id)].join(' '));const mount=m.variants.map(v=>normalize(v.bore+' '+v.pcd)).join(' ');const show=(!$('category').value||m.category===$('category').value)&&(!$('diameter').value||diameter(m)===$('diameter').value)&&(!$('structure').value||m.structure===$('structure').value)&&(!$('tyre').value||m.tyres.includes($('tyre').value))&&(!q||text.includes(q))&&(!$('mount').value||mount.includes(normalize($('mount').value)));card.hidden=!show;if(show)count++});$('result-count').textContent=count;$('empty').hidden=count>0};
 for(const key of ['search','category','diameter','structure','tyre','mount'])$(key).addEventListener('input',apply);$('reset').addEventListener('click',()=>{for(const key of ['search','category','diameter','structure','tyre','mount'])$(key).value='';apply()});apply();
}).catch(()=>{});

for(const f of forms){
 const status=f.querySelector('[role=status],.form-result')||f.appendChild(document.createElement('p'));status.setAttribute('role','status');
 f.addEventListener('submit',async e=>{e.preventDefault();if(!f.reportValidity())return;const button=f.querySelector('[type=submit]');if(button.disabled)return;button.disabled=true;status.hidden=false;status.textContent={en:'Submitting…',es:'Enviando…',ru:'Отправка…'}[language]||'Submitting…';
 try{const [models]=await dataPromise;const data=new FormData(f);const files=[1,2,3].map(i=>data.get('attachment'+i)).filter(x=>x&&x.size);if(files.reduce((n,f)=>n+f.size,0)>7*1024*1024)throw Error({en:'Attachments must total 7 MB or less.',es:'Los archivos deben sumar 7 MB como máximo.',ru:'Общий размер файлов: не более 7 МБ.'}[language]||'Attachments must total 7 MB or less.');for(const file of files)if(!/\.(pdf|jpe?g|png|webp|xlsx|csv)$/i.test(file.name))throw Error('Use PDF, JPG, PNG, WebP, XLSX or CSV.');
 const basket=JSON.parse(f.dataset.products||localStorage.getItem('jabil-wheel-enquiry')||'[]');const requestId=f.dataset.requestId ||=crypto.randomUUID();data.set('form-name','wheel-enquiry');data.set('requestId',requestId);data.set('consent',f.elements.consent.checked?'yes':'');data.set('products',JSON.stringify(basket));data.set('productSummary',basket.map(x=>{const m=models.find(m=>m.id===x.id||m.variants.some(v=>v.id===x.id));return x.id+' | '+(m?.name||'')+' | Quantity: '+x.quantity}).join('\n'));data.set('sourcePage',location.href);data.set('language',language);
 for(const key of ['attachment1','attachment2','attachment3'])if(!data.get(key)?.size)data.delete(key);
 const response=await fetch('/__forms.html',{method:'POST',body:data});if(!response.ok)throw Error('Unable to submit (HTTP '+response.status+'). Please contact info@jabiltyre.com.');status.textContent=({en:'Thank you. Your enquiry has been submitted. Tracking reference: ',es:'Gracias. Consulta enviada. Referencia de seguimiento: ',ru:'Спасибо. Запрос отправлен. Код для обращения: '}[language]||'Submitted. Tracking reference: ')+requestId;f.querySelectorAll('input,textarea,select,button').forEach(x=>x.disabled=true);localStorage.removeItem('jabil-wheel-enquiry');document.dispatchEvent(new CustomEvent('enquiry-basket-updated'));
 }catch(error){status.textContent=error.message;button.disabled=false;}
 });
}

const norm=v=>String(v||'').toLowerCase().replace(/[×*]/g,'x').replace(/(\d)\.0+(?=\D|$)/g,'$1').replace(/[^a-z0-9]/g,'');
const search=document.querySelector('#product-search');
if(search){const apply=()=>{let count=0;document.querySelectorAll('[data-sample]').forEach(c=>{const category=document.querySelector('#product-filter')?.value;const show=(!category||category===c.dataset.category)&&norm(c.dataset.search+' '+c.textContent).includes(norm(search.value));c.hidden=!show;if(show)count++});const empty=document.querySelector('.no-matches');if(empty)empty.hidden=count>0};search.addEventListener('input',apply);document.querySelector('#product-filter')?.addEventListener('change',apply)}
})();

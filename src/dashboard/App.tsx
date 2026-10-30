import {useState} from 'react';
import {createRoot} from 'react-dom/client';
import {dashboard,demo,type DashboardInput} from './model';
import './style.css';

const rub=(n:number)=>new Intl.NumberFormat('ru-RU',{style:'currency',currency:'RUB',minimumFractionDigits:0,maximumFractionDigits:2}).format(n);
const num=(n:number)=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:2}).format(n);
function App(){
 const [input,setInput]=useState<DashboardInput>(()=>{
  try {const plan=JSON.parse(localStorage.getItem('rop-monthly-plans-v1')||'{}')[demo.month];return {...demo,salesPlan:Number.isSafeInteger(plan)&&plan>0?plan:demo.salesPlan};} catch {return {...demo};}
 });
 const [edited,setEdited]=useState(false);
 const [view,setView]=useState<'salary'|'settings'>('salary');
 const [savedPlans,setSavedPlans]=useState<Record<string,number>>(()=>{
  try {
   const stored=JSON.parse(localStorage.getItem('rop-monthly-plans-v1')||'{}');
   return Object.fromEntries(Object.entries(stored).filter(([month,plan])=>/^\d{4}-\d{2}$/.test(month)&&Number.isSafeInteger(plan)&&Number(plan)>0&&Number(plan)<=100000).map(([month,plan])=>[month,Number(plan)]));
  } catch {return {};}
 });
 const [notice,setNotice]=useState('');
 const [draftPlan,setDraftPlan]=useState(()=>String(savedPlans[demo.month]??demo.salesPlan));
 const state=dashboard(input);
 function update(key:keyof DashboardInput,value:number|string){setInput(old=>({...old,[key]:value}));setEdited(true);}
 function field(key:keyof DashboardInput,label:string,help?:string,step=1,max?:number){
  return <label className="field" key={key}><span>{label}</span><input type="number" min="0" max={max} step={step} value={Number.isFinite(input[key])?input[key]:''} onChange={e=>update(key,e.target.value===''?NaN:Number(e.target.value))}/>{help&&<small>{help}</small>}</label>;
 }
 function changeMonth(month:string){setInput(old=>({...old,month,salesPlan:savedPlans[month]??demo.salesPlan}));setDraftPlan(String(savedPlans[month]??demo.salesPlan));setNotice('');}
 function savePlan(){
  const plan=Number(draftPlan);
  if(!Number.isSafeInteger(plan)||plan<=0||plan>100000||!/^\d{4}-(0[1-9]|1[0-2])$/.test(input.month)||input.month<'2026-10'){setNotice('Укажите месяц с октября 2026 года и целый план от 1 до 100 000.');return;}
  try {const next={...savedPlans,[input.month]:plan};localStorage.setItem('rop-monthly-plans-v1',JSON.stringify(next));setSavedPlans(next);setInput(old=>({...old,salesPlan:plan}));setNotice('План сохранён. Зарплатный дашборд обновлён.');}
  catch {setNotice('Браузер не разрешает сохранение. План не изменён.');}
 }
 
 return <div className="shell">
  <aside className="sidebar"><a href="../" className="brand"><img src="./logo.svg" alt="До Нуля"/></a><span className="workspace">КАБИНЕТ РУКОВОДИТЕЛЯ</span><nav><button className={view==='salary'?'selected':''} onClick={()=>setView('salary')}>Моя зарплата</button><button className={view==='settings'?'selected':''} onClick={()=>setView('settings')}>Настройки</button><a href="../#plan-coefficient">Правила мотивации ↗</a></nav><div className="sidebar-note">РОП · МПП 2<small>Доход команды начинается<br/>с понятной цели.</small></div></aside>
  <main>
   <header><div><span className="eyebrow">ДО НУЛЯ / РУКОВОДИТЕЛЬ</span><h1>{view==='salary'?'Моя зарплата':'Настройки'}</h1></div><label className="month">Расчётный месяц<input type="month" min="2026-10" value={input.month} onChange={e=>changeMonth(e.target.value)}/></label></header>
   <div className="view-switch"><button className={view==='salary'?'selected':'secondary'} onClick={()=>setView('salary')}>Моя зарплата</button><button className={view==='settings'?'selected':'secondary'} onClick={()=>setView('settings')}>Настройки</button></div>
   <div className="banner"><b>Макет кабинета РОПа</b><span>{edited?'Показатели введены вручную.':'Показатели команды демонстрационные.'} CRM пока не подключена.</span></div>
   {view==='salary'&&<>
   {state.error!==null?<div className="error" role="alert">Расчёт недоступен: {state.error} Исправьте показатели в настройках.</div>:<>
    <section className="hero" id="salary"><div><span className="muted">Расчётная выплата за месяц</span><strong className="amount" aria-live="polite">{rub(state.currentPayout)}</strong><p>Оклад + премии после коэффициента − демотивация<br/>+ подтверждённые декларации прошлого месяца.</p><span className="pill">Предварительно · оклад за полный месяц</span></div><div className="hero-aside"><span>За декларации текущих продаж — позже</span><strong>{rub(state.result.declarationPayable)}</strong><p>Оценка на текущих данных. Окончательно — по подписям на конец следующего месяца. В сумму слева не входит.</p><small>Сохраняется коэффициент месяца продаж.</small></div></section>
    <section className="panel plan"><div className="section-top"><div><h2>План команды управляет всеми премиями</h2><p><b>{input.sales} / {input.salesPlan}</b> продаж · выполнение {num(input.sales/input.salesPlan*100)}%</p></div><span className={'coefficient '+(state.result.coefficient===1?'full':'')}>{state.result.coefficient*100}% премий к выплате</span></div><progress max={input.salesPlan} value={Math.min(input.sales,input.salesPlan)} aria-label="Выполнение плана продаж"/>
     <div className="steps">{[[0,'Менее 85%','0%'],[.5,'85–<90%','50%'],[.7,'90–<95%','70%'],[1,'От 95%','100%']].map(([k,label,pay])=><div className={state.result.coefficient===k?'active':''} key={label}><span>{label}</span><b>{pay} премий</b></div>)}</div>
     <div className="plan-bottom"><span>По шкалам до коэффициента <b>{rub(state.result.earnedBonus)}</b><small>Включая {rub(state.result.declarationBonus)} за декларации, выплачиваемые позже.</small></span><span>Уменьшение из-за плана <b className={state.withheld?'red':''}>{rub(state.withheld)}</b><small>{state.nextSales?`До ${state.next}% плана: ещё ${state.nextSales-input.sales} продаж.`:'План выполнен. Все заработанные премии сохранены.'}</small></span></div>
    </section>
    <section id="components"><div className="section-top"><h2>Из чего складывается выплата</h2><span className="muted">Все суммы ниже уже после коэффициента</span></div><div className="cards"><article className="card"><span>Оклад</span><strong>{rub(100000)}</strong><small>За полный месяц. Коэффициент не применяется.</small></article>{state.rows.map(row=><details className="card" key={row.key}><summary><span>{row.label}</span><strong>{rub(row.paid)}</strong><small>{row.hint}</small><em>Как посчитано</em></summary><p>{rub(row.base)} × {state.result.coefficient} = <b>{rub(row.paid)}</b></p></details>)}<details className="card negative"><summary><span>Демотивация</span><strong>{state.result.penalties>0?'−':''}{rub(state.result.penalties)}</strong><small>После коэффициента, без уменьшения</small><em>Раскрыть основания</em></summary><p>Расторги: {rub(Math.floor(input.cancellations/3)*5000)}<br/>Слитые лиды: {rub(Math.floor(input.lostLeads/5)*3000)}<br/>Расхождения: {rub(Math.floor(input.discrepancies/3)*3000)}<br/>Неверные цифры: {rub(input.incorrectFigures*5000)}<br/>Запрос рекомендаций: {rub(input.referralPercent<90?5000:0)}<br/>Дисциплина: {rub(input.discipline)}</p></details><article className="card"><span>Декларации прошлого месяца</span><strong>{rub(input.previousDeclarations)}</strong><small>Подтверждённая сумма к выплате. Повторно не умножается на коэффициент.</small></article></div></section>
    <div className="insights"><section className="panel"><h2>Качество · цель {state.target}%</h2>{state.qualityRows.map(q=><div className="metric" key={q.label}><div><b>{q.label}</b><small>{num(q.actual)} / {q.max} · цель {num(q.threshold)}</small></div><strong className={q.passed?'green':'muted'}>{q.passed?rub(5000*state.result.coefficient):'Не достигнута'}</strong></div>)}<p className="note">Каждая цель: 5 000 ₽ до общего коэффициента. Сравниваются точные оценки, без округления вверх.</p></section><section className="panel"><h2>Что ещё влияет на доход</h2><div className="metric"><div><b>Продуктивность</b><small>{num(state.result.productivity.average!)} продажи на боевого · {num(state.result.productivity.effectiveManagers!)} боевого по дням</small></div></div><div className="metric"><div><b>Доппродукты</b><small>{num(state.result.productPercent)}% · ступени 15 / 20 / 25%</small></div><strong>{input.sales>0&&input.productActual*4<input.sales?`Ещё ${Math.ceil(input.sales*.25)-input.productActual} до 25%`:'—'}</strong></div><div className="metric"><div><b>Рекомендации</b><small>{input.referrals} из {state.result.referralGoal} · запрос в {num(input.referralPercent)}% разговоров</small></div><strong>{Math.max(0,state.result.referralGoal-input.referrals)} до плана</strong></div><p className="note">Остатки по долям указаны при неизменном числе продаж.</p></section></div>
   </>}
   </>}
   {view==='settings'&&<>
   <section className="panel plan-settings"><h2>План продаж на месяц</h2><p>Укажите согласованный план команды для выбранного месяца. Он определяет коэффициент всех премий и бонус за выполнение плана.</p><div className="plan-editor"><label className="field"><span>План продаж · {input.month}</span><input type="number" min="1" max="100000" step="1" value={draftPlan} onChange={e=>{setDraftPlan(e.target.value);setNotice('');}}/></label><button onClick={savePlan}>Сохранить план</button></div><p className="note">{savedPlans[input.month]?'Сохранённый план: '+savedPlans[input.month]+' продаж.':'Для этого месяца план ещё не сохранён; в макете используется пример: '+demo.salesPlan+' продаж.'} Планы хранятся в этом браузере отдельно для каждого месяца.</p>{notice&&<p className="save-notice" role="status">{notice}</p>}</section>
   <section className="panel inputs" id="inputs"><div className="section-top"><div><h2>Демонстрационные показатели</h2><p>Для просмотра макета можно указать фактические значения вручную. Они не сохраняются после обновления страницы; сохранённые планы остаются.</p></div><button className="secondary" onClick={()=>{setInput({...demo,month:input.month,salesPlan:savedPlans[input.month]??demo.salesPlan});setEdited(false);}}>Вернуть пример</button></div>
    <details open={state.error!==null||undefined}><summary>Продажи и состав команды</summary><div className="fields">{field('sales','Продажи команды')}{field('activeSales','Продажи боевых','Включая партнёрку; не больше продаж команды')}{field('activeDays','Человеко-дни боевых','Сумма рабочих дней всех сотрудников в статусе боевого')}{field('monthDays','Рабочих дней в месяце','Численность боевых = человеко-дни / дни месяца')}</div></details>
    <details open={state.error!==null||undefined}><summary>Декларации, продукты и рекомендации</summary><div className="fields">{field('declarations','Декларации текущих продаж','Подписи именно по продажам выбранного месяца')}{field('previousDeclarations','Прошлые декларации к выплате, ₽','Уже после коэффициента месяца исходных продаж; 0 — ничего не включено',.01)}{field('vipActual','Оплаченные ВИП')}{field('productActual','Продажи с доппродуктом','Уникальные продажи с подтверждённой оплатой, без возвратов')}{field('referrals','Переданные клиенты по рекомендации')}{field('referralPercent','Доля запросов рекомендации, %','Менее 90% — демотивация 5 000 ₽',.01,100)}</div></details>
    <details open={state.error!==null||undefined}><summary>Средние оценки качества</summary><div className="fields">{field('gates','Гейты / 16','Средняя оценка команды',.01,16)}{field('saleQuality','Продажа / 7','Средняя оценка команды',.01,7)}{field('followupQuality','Касания / 8','Средняя оценка команды',.01,8)}</div></details>
    <details open={state.error!==null||undefined}><summary>Подтверждённые нарушения</summary><div className="fields">{field('cancellations','Расторги по вине МПП','5 000 ₽ за каждые полные 3')}{field('lostLeads','Слитые лиды','3 000 ₽ за каждые полные 5')}{field('discrepancies','Приёмки с расхождениями','3 000 ₽ за каждые полные 3')}{field('incorrectFigures','Случаи неверных цифр','5 000 ₽ за каждый')}{field('discipline','Дисциплина, ₽','По подтверждённому решению руководителя')}</div></details>
   </section></>}<footer>Расчёт по последней мотивации РОП. Макет кабинета, не утверждённый расчётный листок. Оклад — за полный месяц; неполный месяц здесь не рассчитывается. <a href="../">Открыть все условия →</a></footer>
  </main>
 </div>;
}
createRoot(document.getElementById('root')!).render(<App/>);

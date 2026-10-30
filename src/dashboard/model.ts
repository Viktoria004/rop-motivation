import {calculate, reference, type Input} from '../calculation.ts';

export type DashboardInput = Omit<Input,'qualityPassed'> & {
  month:string; gates:number; saleQuality:number; followupQuality:number;
  previousDeclarations:number;
};
export const demo:DashboardInput={...reference, month:'2026-10',sales:180,salesPlan:200,
  activeSales:180,activeDays:220,monthDays:22,declarations:162,productActual:38,
  vipActual:5,referrals:28,gates:12.4,saleQuality:5.5,followupQuality:6.2,
  previousDeclarations:0};

export function qualityTarget(month:string) {
  if(!/^\d{4}-\d{2}$/.test(month)||month<'2026-10'||Number(month.slice(5))<1||Number(month.slice(5))>12) return null;
  return month==='2026-10'?77:month==='2026-11'?80:month==='2026-12'?85:90;
}
export function dashboard(input:DashboardInput){
  const target=qualityTarget(input.month);
  if(target===null)return {error:'Выберите месяц с октября 2026 года.'} as const;
  const quality=[{label:'Гейты',actual:input.gates,max:16},{label:'Продажа',actual:input.saleQuality,max:7},{label:'Касания',actual:input.followupQuality,max:8}];
  if(quality.some(q=>!Number.isFinite(q.actual)||q.actual<0||q.actual>q.max))return {error:'Укажите оценки качества в пределах шкал 0–16, 0–7 и 0–8.'} as const;
  if(!Number.isFinite(input.previousDeclarations)||input.previousDeclarations<0||!Number.isSafeInteger(Math.round(input.previousDeclarations*100)))return {error:'Проверьте подтверждённую выплату за прошлые декларации.'} as const;
  const {month,gates,saleQuality,followupQuality,previousDeclarations,...base}=input;
  const qualityRows=quality.map(q=>({...q,threshold:q.max*target/100,passed:q.actual>=q.max*target/100}));
  const result=calculate({...base,qualityPassed:qualityRows.filter(q=>q.passed).length});
  if(result.error!==null)return {error:result.error} as const;
  const rows=[
    {key:'sales',label:'Продажи',base:result.salesBonus,hint:`${input.sales} продаж по накопительной шкале`},
    {key:'plan',label:'Выполнение плана',base:result.planBonus,hint:'10 000 ₽ только при 100% плана'},
    {key:'productivity',label:'Продуктивность',base:result.productivity.bonus!,hint:`${result.productivity.average!.toFixed(2)} продажи на боевого`},
    {key:'vip',label:'ВИП',base:result.vipBonus,hint:`${input.vipActual} оплаченных ВИП`},
    {key:'products',label:'Доппродукты',base:result.productBonus,hint:`${input.productActual} из ${input.sales} продаж`},
    {key:'referrals',label:'Рекомендации',base:result.referralBonus,hint:`${input.referrals} из ${result.referralGoal} переданных клиентов`},
    {key:'quality',label:'Качество',base:result.qualityBonus,hint:`${qualityRows.filter(q=>q.passed).length} из 3 целей достигнуты`},
  ].map(row=>({...row,paid:Math.round(row.base*result.coefficient*100)/100}));
  const next=[85,90,95,100].find(t=>input.sales*100<input.salesPlan*t);
  const nextSales=next?Math.ceil(input.salesPlan*next/100):null;
  return {error:null,result,rows,qualityRows,target,next,nextSales,
    currentPayout:Math.round((result.currentMonthTotal+previousDeclarations)*100)/100,
    withheld:Math.round((result.earnedBonus-result.payableBonus)*100)/100};
}

// A sales-only scenario never invents signatures, VIP, products or recommendations.
export function withSales(input:DashboardInput,extra:number):DashboardInput {
  return {...input,sales:input.sales+extra,activeSales:input.activeSales+extra};
}

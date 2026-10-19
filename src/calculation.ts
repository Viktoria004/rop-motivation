import { calculateProductivity } from './productivity.ts';
export const reference = { sales:220, salesPlan:220, declarations:205, activeSales:220, activeDays:220, monthDays:22, referrals:30, referralPercent:90, vipActual:7, productActual:55, qualityPassed:3, cancellations:0, lostLeads:0, discrepancies:0, incorrectFigures:0, discipline:0 };
export type Input = typeof reference;
export function calculate(input:Input) {
  const values=Object.entries(input);
  if(values.some(([key,v])=>!Number.isFinite(v)||v<0||(key!=='referralPercent'&&!Number.isSafeInteger(v)))) return {error:'Заполните поля неотрицательными числами; количества — целыми.'} as const;
  if([input.salesPlan,input.monthDays,input.activeDays].some(v=>v<=0)||input.referralPercent>100||input.qualityPassed>3||input.activeSales>input.sales) return {error:'Планы и рабочие дни должны быть больше нуля. Качество: 0–3 цели, доля запросов: 0–100%. Продажи боевых не могут превышать продажи отдела.'} as const;
  const productivity=calculateProductivity(input.activeSales,input.activeDays,input.monthDays);
  if(productivity.error) return {error:productivity.error} as const;
  // Marginal rates yield 30000 at 130 sales and 80000 at 220.
  const salesBonus=input.sales*100<input.salesPlan*85?0:Math.min(input.sales,100)*180+Math.min(Math.max(input.sales-100,0),50)*400+Math.max(input.sales-150,0)*600;
  if (input.declarations > input.sales || input.vipActual > input.sales || input.productActual > input.sales) return {error:'Декларации, ВИП и продажи с доппродуктом учитываются среди этих же продаж и не могут превышать их количество.'} as const;
  // Cross-products keep exact percentage thresholds; zero sales never earns a share bonus.
  const declarationPercent=input.sales ? input.declarations/input.sales*100 : 0;
  const productPercent=input.sales ? input.productActual/input.sales*100 : 0;
  const declarationBonus=!input.sales ? 0 : input.declarations*100>=input.sales*93 ? 40000 : input.declarations*100>=input.sales*90 ? 30000 : input.declarations*100>=input.sales*85 ? 10000 : 0;
  const vipBonus=input.vipActual>=7 ? 18000 : input.vipActual>=5 ? 12000 : input.vipActual>=3 ? 6000 : 0;
  const productBonus=!input.sales ? 0 : input.productActual*100>=input.sales*25 ? 15000 : input.productActual*100>=input.sales*20 ? 10000 : input.productActual*100>=input.sales*15 ? 5000 : 0;
  const coefficient=1;
  const commercial=Math.round((salesBonus+declarationBonus+vipBonus+productBonus)*coefficient*100)/100;
  const planBonus=input.sales>=input.salesPlan?10000:0;
  const referralGoal=Math.ceil(3*input.activeDays/input.monthDays);
  const referralBonus=input.referrals>=referralGoal?5000:0;
  const qualityBonus=input.qualityPassed*5000;
  const penalties=Math.floor(input.cancellations/3)*5000+Math.floor(input.lostLeads/5)*3000+Math.floor(input.discrepancies/3)*3000+input.incorrectFigures*5000+input.discipline+(input.referralPercent<90?5000:0);
  const total=Math.round((100000+commercial+planBonus+productivity.bonus+referralBonus+qualityBonus-penalties)*100)/100;
  if(!Number.isSafeInteger(Math.round(total*100))) return {error:'Слишком большие значения для точного расчёта.'} as const;
  return {error:null,declarationPercent,productPercent,productivity,salesBonus,declarationBonus,vipBonus,productBonus,coefficient,commercial,planBonus,referralGoal,referralBonus,qualityBonus,penalties,total,currentMonthTotal:total-declarationBonus} as const;
}

import { calculate, reference } from './calculation';
import styles from './rop-motivation.module.css';
const money=(n:number)=>new Intl.NumberFormat('ru-RU').format(n);
export default function EarningsExamples(){
 return <section className={styles.section} id="earnings-examples">
  <h2>Выполняю план — сколько получаю</h2>
  <p>В каждой карточке свой план выполнен на 100%, дополнительные показатели достигнуты, нарушений нет. Средняя продаж на боевого задана как условие примера: 17, 18, 20 и 22 соответственно.</p>
  <div className={styles.earningsCards}>
   {[160,180,200,220].map(sales=>{
    const declarations=Math.ceil(sales*93/100),products=Math.ceil(sales*.25);
    const average=sales===160?17:sales/10;
    const r=calculate({...reference,sales,salesPlan:sales,activeSales:sales,activeDays:sales,monthDays:average,declarations,productActual:products});
    if(r.error!==null)return null;
    return <article className={styles.earningsCard} key={sales}>
     <h3>План {sales} продаж — выполнен</h3>
     <span>Всего получаю со всеми положенными бонусами</span>
     <strong className={styles.earningsTotal}>{money(r.total)} ₽</strong>
     <div className={styles.earningsPayments}>{[
      ['Оклад',100000],
      [`За ${sales} продаж`,r.salesBonus],
      ['За выполнение плана на 100%',r.planBonus],
      [`Продуктивность: ${average} продаж на боевого`,r.productivity.bonus!],
      ['7 оплаченных ВИП',r.vipBonus],
      [`Доппродукты: ${products} из ${sales} продаж (от 25%)`,r.productBonus],
      ['План рекомендаций выполнен: 3 на боевого',r.referralBonus],
      ['Качество: все 3 цели выполнены',r.qualityBonus],
      [`Декларации: ${declarations} из ${sales} (от 93%)`,r.declarationBonus],
     ].map(([label,value])=><div key={String(label)}><span>{label}</span><b>{money(Number(value))} ₽</b></div>)}</div>
     <div className={styles.paymentSummary}>
      <p>За текущий месяц <strong>{money(r.currentMonthTotal)} ₽</strong></p>
      <p>Со следующей зарплатой за декларации <strong>{money(r.declarationBonus)} ₽</strong></p>
     </div>
     {r.productivity.bonus===0&&<p className={styles.smallNote}>Бонус за продуктивность начинается со средней 17 продаж на боевого.</p>}
    </article>;
   })}
  </div>
  <p className={styles.smallNote}>40 000 ₽ за декларации уже входят в крупную итоговую сумму. Подписи фиксируем в конце следующего месяца и выплачиваем этот бонус со следующей зарплатой. Бонус за декларации предыдущего месяца сюда не включён. ВИП входят в общий объём продаж; запрос рекомендации есть минимум в 90% подходящих разговоров. Все продажи — продажи боевых, включая партнёрку. Средняя учитывает рабочее время в статусе боевого: первый пример предполагает среднюю 17, а не 10 боевых полный месяц.</p>
 </section>;
}

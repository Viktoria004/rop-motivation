import test from 'node:test';
import assert from 'node:assert/strict';
import {calculate,reference} from '../src/calculation.ts';

test('exact plan boundaries without rounding up',()=>{
 for(const [sales,coefficient] of [[849,0],[850,.5],[899,.5],[900,.7],[949,.7],[950,1],[1000,1],[1100,1]]) {
  const r=calculate({...reference,sales,salesPlan:1000});
  assert.equal(r.error,null);assert.equal(r.coefficient,coefficient);
 }
});
test('every earned bonus is reduced, deferred declaration uses same coefficient once',()=>{
 for(const [salesPlan,k] of [[260,0],[250,.5],[240,.7],[230,1],[220,1]]) {
  const r=calculate({...reference,salesPlan});
  assert.equal(r.error,null);
  const earned=80000+40000+18000+15000+25000+5000+15000+(salesPlan===220?10000:0);
  assert.equal(r.earnedBonus,earned);
  assert.equal(r.payableBonus,earned*k);
  assert.equal(r.declarationPayable,40000*k);
  assert.equal(r.total,100000+earned*k);
  assert.equal(r.currentMonthTotal,100000+(earned-40000)*k);
  assert.equal(r.total,r.currentMonthTotal+r.declarationPayable);
 }
});
test('salary is preserved, penalties are not reduced',()=>{
 for(const salesPlan of [260,250,240,230]) {
  const base=calculate({...reference,salesPlan});
  const r=calculate({...reference,salesPlan,referralPercent:89,cancellations:3});
  assert.equal(r.penalties,10000);assert.equal(r.total,base.total-10000);
 }
});
test('full-plan examples retain totals and plan bonus starts only at 100%',()=>{
 assert.equal(calculate({...reference,salesPlan:230}).planBonus,0);
 for(const [sales,total] of [[160,252000],[180,269000],[200,291000],[220,308000]]) {
  const r=calculate({...reference,sales,salesPlan:sales,activeSales:sales,activeDays:sales,monthDays:sales===160?17:sales/10,declarations:Math.ceil(sales*.93),productActual:Math.ceil(sales*.25)});
  assert.equal(r.total,total);assert.equal(r.planBonus,10000);
 }
});
test('invalid plan rejected and zero sales cannot earn premiums',()=>{
 assert.ok(calculate({...reference,salesPlan:0}).error);
 const r=calculate({...reference,sales:0,activeSales:0,declarations:0,vipActual:0,productActual:0});
 assert.equal(r.payableBonus,0);assert.equal(r.total,100000);
});

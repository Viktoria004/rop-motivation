import test from 'node:test';
import assert from 'node:assert/strict';
import {dashboard,demo,qualityTarget} from '../src/dashboard/model.ts';

test('separates current payout and deferred declarations; cards reconcile',()=>{
 const s=dashboard(demo);assert.equal(s.error,null);
 assert.equal(s.currentPayout,172100);assert.equal(s.result.declarationPayable,21000);
 assert.equal(s.currentPayout,100000+s.rows.reduce((sum,row)=>sum+row.paid,0)-s.result.penalties);
 const prior=dashboard({...demo,previousDeclarations:40000});
 assert.equal(prior.currentPayout,212100);assert.equal(prior.result.declarationPayable,21000);
});
test('quality schedule has exact inclusive boundaries and never resets in new year',()=>{
 assert.equal(qualityTarget('2026-10'),77);assert.equal(qualityTarget('2026-11'),80);
 assert.equal(qualityTarget('2026-12'),85);assert.equal(qualityTarget('2027-10'),90);
 assert.equal(qualityTarget('2026-13'),null);assert.equal(qualityTarget('2026-09'),null);
 for(const [scores,expected] of [[[12.32,5.39,6.16],3],[[12.319,5.389,6.159],0]]){
  const s=dashboard({...demo,gates:scores[0],saleQuality:scores[1],followupQuality:scores[2]});
  assert.equal(s.qualityRows.filter(q=>q.passed).length,expected);
 }
 assert.equal(dashboard({...demo,month:'2026-11'}).currentPayout,161600);
});
test('invalid or missing values cannot render an apparent valid zero payout',()=>{
 for(const patch of [{gates:NaN},{gates:17},{saleQuality:-1},{previousDeclarations:NaN},{previousDeclarations:-1},{salesPlan:0},{month:''},{productActual:181},{sales:1.5}])assert.ok(dashboard({...demo,...patch}).error);
});
test('next plan stage uses ceil on actual sales and preserves full-plan salary',()=>{
 const s=dashboard({...demo,salesPlan:201});assert.equal(s.next,90);assert.equal(s.nextSales,181);
 const full=dashboard({...demo,sales:220,salesPlan:220,activeSales:220,declarations:205,vipActual:7,productActual:55,referrals:30});
 assert.equal(full.currentPayout,268000);assert.equal(full.result.declarationPayable,40000);assert.equal(full.nextSales,null);
});

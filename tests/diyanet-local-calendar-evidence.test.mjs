import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';

const root=new URL('../',import.meta.url);
const evidence=JSON.parse(fs.readFileSync(new URL('methods/diyanet/research/local-calendar-comparison-2026-09-26.json',root)));
const sum=xs=>xs.reduce((a,b)=>a+b,0);
const models=['civilUTC00','localSPA'];
function checkMetric(m){
  const entries=Object.entries(m.signedMinuteHistogram).map(([key,n])=>[Number(key),n]);
  for(const [delta,n] of entries){assert(Number.isInteger(delta));assert(Number.isInteger(n)&&n>0);}
  assert.equal(sum(entries.map(([,n])=>n)),m.compared);
  assert.equal(sum(entries.filter(([d])=>d===0).map(([,n])=>n)),m.exact);
  assert.equal(sum(entries.filter(([d])=>Math.abs(d)<=1).map(([,n])=>n)),m.withinOne);
  assert.equal(m.maximumAbsoluteMinutes,m.compared?Math.max(...entries.map(([d])=>Math.abs(d))):null);
  if(m.compared){
    assert(Math.abs(m.meanAbsoluteMinutes-sum(entries.map(([d,n])=>Math.abs(d)*n))/m.compared)<1e-10);
    assert(Math.abs(m.exactPercent-m.exact/m.compared*100)<1e-10);
    assert(Math.abs(m.withinOnePercent-m.withinOne/m.compared*100)<1e-10);
  }else assert.deepEqual([m.meanAbsoluteMinutes,m.exactPercent,m.withinOnePercent],[null,null,null]);
}

test('archived local/calendar evidence identifies unchanged numerical inputs and independent recount',()=>{
  assert.equal(evidence.schema,'local-diyanet-calendar-comparison/v1');
  assert.equal(evidence.denominators.caseYears,59);assert.equal(evidence.denominators.days,21535);
  assert.equal(evidence.denominators.fields,129210);assert.equal(evidence.newSourceRequests,0);
  assert.equal(evidence.publication.independentVerificationResult,'PASS');
  for(const [file,expected] of Object.entries(evidence.publication.modelPins)){
    const url=new URL(file,root);assert(url.href.startsWith(root.href));
    const actual=crypto.createHash('sha256').update(fs.readFileSync(url)).digest('hex');
    assert.equal(actual,expected,`Stale archived comparison after numerical input changed: ${file}`);
  }
  // These public checks intentionally cannot revalidate the private source clocks.
  assert.match(evidence.publication.reproducibility,/private reference corpus/);
});

test('all published denominators, availability subsets and paired gains/losses reconcile',()=>{
  assert.equal(Object.keys(evidence.results).length,2);
  for(const result of Object.values(evidence.results)){
    const overall=result.groups.overall;
    assert.equal(overall.planned,129210);assert.equal(overall.excludedAmbiguousZero,455);
    for(const group of Object.values(result.groups)){
      assert.equal(group.planned,group.sourceUsable+group.excludedAmbiguousZero+group.excludedOtherSource);
      for(const name of models){const model=group.models[name];
        assert.equal(sum(Object.values(model.statusCounts)),group.planned);
        assert.equal(model.availableRegardlessOfSource,(model.statusCounts.calculated??0)+(model.statusCounts.estimated??0));
        assert.equal(sum(Object.values(model.blockedOrAbsentReasons))+model.availableRegardlessOfSource,group.planned);
        assert.equal(model.availableSourceComparison.compared+model.sourceUsableButUnavailable,group.sourceUsable);
        checkMetric(model.availableSourceComparison);
      }
      assert(group.bothCalculated.compared<=group.pairedAvailable.compared);
      for(const subset of [group.pairedAvailable,group.bothCalculated]){
        for(const name of models){checkMetric(subset.models[name]);
          assert.equal(subset.models[name].compared,subset.compared);
          assert(subset.compared<=group.models[name].availableSourceComparison.compared);
        }
        assert.equal(subset.correctedToExact-subset.regressedFromExact,subset.models.localSPA.exact-subset.models.civilUTC00.exact);
        assert.equal(subset.withinOneImproved-subset.withinOneWorsened,subset.models.localSPA.withinOne-subset.models.civilUTC00.withinOne);
        assert.equal(subset.absoluteErrorImproved+subset.absoluteErrorWorsened+subset.absoluteErrorTied,subset.compared);
      }
    }
    for(const prefix of ['event/','case/','region/','cohort/','year/','month/','season/']){
      const groups=Object.entries(result.groups).filter(([key])=>key.startsWith(prefix)).map(([,g])=>g);
      assert(groups.length>0,prefix);
      for(const key of ['planned','sourceUsable','excludedAmbiguousZero','excludedOtherSource'])assert.equal(sum(groups.map(g=>g[key])),overall[key],`${prefix}/${key}`);
      for(const subset of ['pairedAvailable','bothCalculated'])for(const name of models)for(const key of ['compared','exact','withinOne'])
        assert.equal(sum(groups.map(g=>g[subset].models[name][key])),overall[subset].models[name][key],`${prefix}/${subset}/${name}/${key}`);
    }
  }
});

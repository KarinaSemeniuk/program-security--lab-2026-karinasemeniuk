// Automated build-equivalence check, not the deferred Appendix A coursework experiment.
import ts from 'typescript';import vm from 'node:vm';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {resolve} from 'node:path';
import {protectBookingSelection} from '../../frontend/tools/client-protection.mjs';
const path=resolve('frontend/src/Domain/Booking/Service/BookingSelectionService.ts'),source=readFileSync(path,'utf8');
const protectedSource=protectBookingSelection(source,path);
function load(text){const code=ts.transpileModule(text,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;const sandbox={exports:{}};vm.runInNewContext(code,sandbox,{timeout:1000});return new sandbox.exports.BookingSelectionService();}
const original=load(source),protectedService=load(protectedSource);let cases=0;
for(let seed=0;seed<40;seed++){
 const slots=Array.from({length:12},(_,i)=>({startAt:String(i),endAt:String(i+1),available:((seed*17+i*3)%7)!==0}));
 if(seed%3===0)slots[5].startAt='gap';
 for(const start of [-1,0,2,5,10,12,NaN,0.5])for(const units of [-1,0,1,2,5,12,NaN,0.5]){
  assert.equal(original.contiguous(slots,start),protectedService.contiguous(slots,start));
  assert.equal(JSON.stringify(original.select(slots,start,units)),JSON.stringify(protectedService.select(slots,start,units)));cases++;
 }
}
assert.ok(protectedSource.includes('while (true)')&&protectedSource.includes('switch (_rbState)')&&protectedSource.includes('_rbDecode'));
const moduleBytes=text=>Buffer.byteLength(ts.transpileModule(text,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText);
console.log(JSON.stringify({result:'passed',equivalentScenarios:cases,originalModuleBytes:moduleBytes(source),protectedModuleBytes:moduleBytes(protectedSource),techniques:['local symbol renaming','encoded string table','control-flow dispatcher'],scope:'one pure client selection module; server authorization remains mandatory'},null,2));

import {FileHashChain} from '../../dist/Infrastructure/Audit/FileHashChain.js';
import {mkdtempSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const dir=mkdtempSync(join(tmpdir(),'roombook-chain-'));
try {
 const path=join(dir,'chain.jsonl'),chain=new FileHashChain(path);
 for(let i=0;i<6;i++)chain.append({operation:i===0?'genesis':'booking.recorded',sequence:i});
 const original=readFileSync(path,'utf8'),head=chain.checkpoint();assert.ok(chain.verify());
 const blocks=original.trim().split('\n').map(JSON.parse);blocks[2].data.operation='altered';writeFileSync(path,blocks.map(JSON.stringify).join('\n')+'\n');
 assert.throws(()=>new FileHashChain(path));
 const changed=join(dir,'rebuilt.jsonl');writeFileSync(changed,blocks.slice(0,2).map(JSON.stringify).join('\n')+'\n');const rebuilt=new FileHashChain(changed);
 for(const block of blocks.slice(2))rebuilt.append(block.data);
 assert.ok(rebuilt.verify());assert.notEqual(rebuilt.checkpoint().head,head.head);
 console.log(JSON.stringify({blocks:6,initialIntegrity:true,tamperingDetected:true,rebuiltIntegrity:true,originalCheckpoint:head,rebuiltCheckpoint:rebuilt.checkpoint(),checkpointChanged:true,originalBlocks:original.trim().split('\n').map(JSON.parse)},null,2));
} finally {rmSync(dir,{recursive:true,force:true})}

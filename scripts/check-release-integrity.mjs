import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';import {generateKeyPairSync} from 'node:crypto';import assert from 'node:assert/strict';import {signRelease,verifyRelease} from './lib/release-integrity.mjs';
const root=mkdtempSync(join(tmpdir(),'roombook-release-check-'));const pair=generateKeyPairSync('rsa',{modulusLength:3072,publicKeyEncoding:{type:'spki',format:'pem'},privateKeyEncoding:{type:'pkcs8',format:'pem'}});
try{
 mkdirSync(join(root,'dist'));mkdirSync(join(root,'frontend/dist/assets'),{recursive:true});
 writeFileSync(join(root,'dist/main.js'),'synthetic backend');writeFileSync(join(root,'frontend/dist/assets/app.js'),'synthetic frontend');
 const signed=signRelease(root,pair.privateKey);assert.equal(verifyRelease(root,signed,pair.publicKey).verifiedFiles,2);
 writeFileSync(join(root,'dist/main.js'),'changed');assert.throws(()=>verifyRelease(root,signed,pair.publicKey));writeFileSync(join(root,'dist/main.js'),'synthetic backend');
 const changed=JSON.parse(signed);const bytes=Buffer.from(changed.signature,'base64');bytes[0]^=1;changed.signature=bytes.toString('base64');assert.throws(()=>verifyRelease(root,JSON.stringify(changed),pair.publicKey));
 writeFileSync(join(root,'frontend/dist/assets/extra.js'),'unlisted');assert.throws(()=>verifyRelease(root,signed,pair.publicKey));
 console.log(JSON.stringify({result:'passed',checks:['valid signed inventory','changed build file','changed signature','unlisted extra file']},null,2));
}finally{rmSync(root,{recursive:true,force:true});}

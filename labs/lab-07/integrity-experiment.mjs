/** Lab 07: disposable learning keys; no RoomBook secrets or dependencies. */
import {createHash,createHmac,createCipheriv,createDecipheriv,randomBytes,timingSafeEqual} from 'node:crypto';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
const original='2026_КБЗІ-23-2_Семенюк_Каріна_варіант:08';
const modified=original.slice(0,-1)+'9';
const p=Buffer.from(original,'utf8'),p2=Buffer.from(modified,'utf8');
function distance(a,b){assert.equal(a.length,b.length);let n=0;for(let i=0;i<a.length;i++){let x=a[i]^b[i];while(x){n+=x&1;x>>>=1;}}return n;}
const hash=p=>createHash('sha256').update(p).digest();
const mac=(p,k)=>createHmac('sha256',k).update(p).digest();
const equal=(a,b)=>a.length===b.length&&timingSafeEqual(a,b);
assert.equal([...original].length,40);assert.equal(p.length,64);assert.equal(distance(p,p2),1);
const h1=hash(p),h2=hash(p2);assert.ok(!equal(h1,h2));
const key1=randomBytes(32),key2=Buffer.from(key1);key2[0]^=1;
assert.equal(distance(key1,key2),1);
const m1=mac(p,key1),m2=mac(p,key2),changedMessageMac=mac(p2,key1);
const originalAccepted=equal(m1,mac(p,key1));
const changedMessageAccepted=equal(m1,changedMessageMac),changedKeyAccepted=equal(m1,m2);
assert.equal(originalAccepted,true);assert.equal(changedMessageAccepted,false);assert.equal(changedKeyAccepted,false);
const aesKey=randomBytes(32),nonce=randomBytes(12);
const cipher=createCipheriv('aes-256-gcm',aesKey,nonce,{authTagLength:16});
const ciphertext=Buffer.concat([cipher.update(p),cipher.final()]);const tag=cipher.getAuthTag();
function decrypt(bytes){
 const d=createDecipheriv('aes-256-gcm',aesKey,nonce,{authTagLength:16});d.setAuthTag(tag);
 // Do not return provisional plaintext from update() before final() checks authentication.
 return Buffer.concat([d.update(bytes),d.final()]);
}
const recovered=decrypt(ciphertext).toString('utf8');assert.equal(recovered,original);
const damaged=Buffer.from(ciphertext);damaged[0]^=1;assert.equal(distance(ciphertext,damaged),1);
let corruptionRejected=false,rejectionMessage='';
try{decrypt(damaged);}catch(error){corruptionRejected=true;rejectionMessage=error.message;}
assert.equal(corruptionRejected,true);
const hex=b=>b.toString('hex');
const results={result:'passed',generatedAt:new Date().toISOString(),nodeVersion:process.version,encoding:'UTF-8',
 original,modified,originalHex:hex(p),modifiedHex:hex(p2),characters:[...original].length,bytes:p.length,
 sha256:{hash1:hex(h1),hash2:hex(h2),changedInputBits:distance(p,p2),changedHashBits:distance(h1,h2),totalHashBits:256},
 hmacSha256:{key1:hex(key1),key2:hex(key2),changedKeyBits:distance(key1,key2),hmac1:hex(m1),hmac2:hex(m2),
 modifiedMessageHmac:hex(changedMessageMac),originalAccepted,changedMessageAccepted,changedKeyAccepted,
 changedHmacBits:distance(m1,m2),totalHmacBits:256},
 aesGcm:{algorithm:'aes-256-gcm',key:hex(aesKey),nonce:hex(nonce),ciphertext:hex(ciphertext),tag:hex(tag),aadHex:'',
 recovered,modifiedCiphertext:hex(damaged),modifiedByteIndex:0,changedCiphertextBits:distance(ciphertext,damaged),
 corruptionRejected,rejectionMessage,plaintextReturnedOnCorruption:false},
 note:'Disposable experiment keys, independent from RoomBook secrets. Each run uses new random keys and nonce.'};
writeFileSync(new URL('./integrity-results.json',import.meta.url),JSON.stringify(results,null,2)+'\n');
console.log('Лабораторна №7 — SHA-256, HMAC-SHA-256, AES-256-GCM');
console.log('Початковий рядок:',original,'\nЗмінений рядок:  ',modified);
console.log('Довжина: 40 символів, 64 байти UTF-8; змінено один біт повідомлення.');
console.log('\nSHA-256 №1:',hex(h1),'\nSHA-256 №2:',hex(h2));
console.log('Змінено бітів хешу:',distance(h1,h2),'із 256');
console.log('\nHMAC №1:',hex(m1),'\nHMAC №2:',hex(m2));
console.log('Змінено бітів ключа: 1; змінено бітів HMAC:',distance(m1,m2),'із 256');
console.log('Справжнє повідомлення прийнято:',originalAccepted);
console.log('Змінене повідомлення прийнято:',changedMessageAccepted);
console.log('Змінений ключ прийнято:',changedKeyAccepted);
console.log('\nAES-GCM — справжній шифротекст розшифровано:',recovered===original);
console.log('AES-GCM — зміну одного байта відхилено:',corruptionRejected);
console.log('Відкритий текст при помилці повернуто: false');
console.log('\nУсі перевірки пройшли. Повні навчальні значення: integrity-results.json');

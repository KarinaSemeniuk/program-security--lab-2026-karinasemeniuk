/** Lab 08: exact OpenSSL 3.x RSA-PSS exercise with disposable issuer key. */
import {spawnSync} from 'node:child_process';
import {mkdtempSync,readFileSync,writeFileSync,copyFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
const destination=new URL('./',import.meta.url),temporary=mkdtempSync(join(tmpdir(),'roombook-lab08-'));
const commands=[];
function run(args,expected){const r=spawnSync('openssl',args,{cwd:temporary,encoding:'utf8'});if(r.error)throw r.error;assert.equal(r.status,expected,`openssl ${args.join(' ')}: ${r.stderr}`);const row={command:'openssl '+args.join(' '),exitCode:r.status,stdout:r.stdout.trim(),stderr:r.stderr.trim()};commands.push(row);return row;}
try{
 const version=run(['version'],0).stdout;assert.match(version,/^OpenSSL 3\./);
 const license={productId:'roombook',holder:'Karina Semeniuk — educational installation',expiresAt:'2027-10-30T23:59:59.000Z',features:['booking','private-notes','resource-admin'],licenseId:randomUUID()};
 const original=JSON.stringify(license,null,2)+'\n';writeFileSync(join(temporary,'license.json'),original);
 run(['genpkey','-algorithm','RSA','-pkeyopt','rsa_keygen_bits:3072','-out','private.pem'],0);
 run(['pkey','-in','private.pem','-pubout','-out','public.pem'],0);
 run(['dgst','-sha256','-sign','private.pem','-sigopt','rsa_padding_mode:pss','-sigopt','rsa_pss_saltlen:digest','-out','license.sig','license.json'],0);
 const verify=['dgst','-sha256','-verify','public.pem','-signature','license.sig','-sigopt','rsa_padding_mode:pss','-sigopt','rsa_pss_saltlen:auto','license.json'];
 const valid=run(verify,0);assert.match(valid.stdout,/Verified OK/);
 const modified={...license,expiresAt:'2030-10-30T23:59:59.000Z'};const changed=JSON.stringify(modified,null,2)+'\n';writeFileSync(join(temporary,'license.json'),changed);
 const invalid=run(verify,1);assert.match(invalid.stdout+invalid.stderr,/Verification failure|verification failure/i);
 writeFileSync(new URL('license.json',destination),original);writeFileSync(new URL('license-tampered.json',destination),changed);
 copyFileSync(join(temporary,'public.pem'),new URL('public.pem',destination));copyFileSync(join(temporary,'license.sig'),new URL('license.sig',destination));
 const results={result:'passed',generatedAt:new Date().toISOString(),opensslVersion:version,rsaBits:3072,scheme:'RSA-PSS',digest:'SHA-256',saltLengthSigning:'digest',saltLengthVerification:'auto',license,modifiedLicense:modified,signatureBytes:readFileSync(join(temporary,'license.sig')).length,valid,invalid,commands:commands.map(row=>row.command),realInstallationUntouched:true,privateKey:'Generated as temporary private.pem, never exported; removed after experiment.'};
 writeFileSync(new URL('openssl-results.json',destination),JSON.stringify(results,null,2)+'\n');
 console.log(version);for(const row of commands.slice(1)){console.log('$ '+row.command);console.log('exitCode='+row.exitCode);if(row.stdout)console.log(row.stdout);}
 console.log('Changed field: expiresAt; signature unchanged. Signature: 384 bytes. All assertions passed.');
}finally{rmSync(temporary,{recursive:true,force:true});}

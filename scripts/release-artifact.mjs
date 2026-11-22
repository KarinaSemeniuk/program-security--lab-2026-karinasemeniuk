import {readFileSync,writeFileSync,mkdirSync,existsSync,openSync,closeSync,renameSync,lstatSync} from 'node:fs';
import {generateKeyPairSync,createPrivateKey,createPublicKey,randomUUID} from 'node:crypto';
import {signRelease,verifyRelease} from './lib/release-integrity.mjs';
const mode=process.argv[2],privatePath='.secrets/release-signing-private.pem',publicPath='data/release-public.pem',manifest='artifacts/release-manifest.json';
function atomic(path,value,permissions){const temporary=path+'.tmp-'+randomUUID();const descriptor=openSync(temporary,'wx',permissions);try{writeFileSync(descriptor,value);}finally{closeSync(descriptor);}renameSync(temporary,path);}
try{
 if(!['sign','verify'].includes(mode))throw new Error('Invalid command');
 if(mode==='sign'){
  mkdirSync('.secrets',{recursive:true,mode:0o700});mkdirSync('data',{recursive:true});mkdirSync('artifacts',{recursive:true});
  if(!existsSync(privatePath)){if(existsSync(publicPath))throw new Error('Issuer key missing');const pair=generateKeyPairSync('rsa',{modulusLength:3072,publicKeyEncoding:{type:'spki',format:'pem'},privateKeyEncoding:{type:'pkcs8',format:'pem'}});atomic(privatePath,pair.privateKey,0o600);atomic(publicPath,pair.publicKey,0o644);}
  const info=lstatSync(privatePath);if(!info.isFile()||info.isSymbolicLink()||(info.mode&0o077)!==0)throw new Error('Unsafe issuer key permissions');
  const privatePem=readFileSync(privatePath);const derived=createPublicKey(createPrivateKey(privatePem)).export({type:'spki',format:'pem'}).toString();
  if(!existsSync(publicPath))atomic(publicPath,derived,0o644);
  else if(createPublicKey(readFileSync(publicPath)).export({type:'spki',format:'pem'}).toString()!==derived)throw new Error('Release trust mismatch');
  atomic(manifest,signRelease(process.cwd(),privatePem),0o644);
 }
 const result=verifyRelease(process.cwd(),readFileSync(manifest,'utf8'),readFileSync(publicPath));console.log(JSON.stringify({result:'verified',...result}));
}catch{console.error('Release verification/signing failed. Verify build files, manifest and pinned release public key; no release should be published.');process.exitCode=1;}

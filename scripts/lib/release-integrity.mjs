import {readFileSync,readdirSync,existsSync} from 'node:fs';import {join,resolve,relative} from 'node:path';
import {createHash,createPublicKey,createPrivateKey,sign,verify,constants} from 'node:crypto';
function inventory(root){const files=[];for(const directory of ['dist','frontend/dist']){
 const base=join(root,directory);if(!existsSync(base))throw new Error('Build outputs missing');
 function walk(path){for(const item of readdirSync(path,{withFileTypes:true})){if(item.isSymbolicLink())throw new Error('Symlink in release');const absolute=join(path,item.name);if(item.isDirectory())walk(absolute);else if(item.isFile())files.push(relative(root,absolute).replaceAll('\\','/'));else throw new Error('Unsupported release entry');}}
 walk(base);
}return files.sort();}
function digest(path){return createHash('sha256').update(readFileSync(path)).digest('hex');}
function rsa(key){if(key.asymmetricKeyType!=='rsa'||key.asymmetricKeyDetails?.modulusLength!==3072)throw new Error('Wrong release key profile');return key;}
/** Signs exact SHA-256 inventories of backend/frontend builds with a separate RSA-PSS release key. */
export function signRelease(root,privatePem){
 root=resolve(root);const files=inventory(root).map(path=>({path,sha256:digest(join(root,path))}));
 const payload=Buffer.from(JSON.stringify({kind:'roombook-release',version:1,createdAt:new Date().toISOString(),files}));
 const signature=sign('sha256',payload,{key:rsa(createPrivateKey(privatePem)),padding:constants.RSA_PKCS1_PSS_PADDING,saltLength:constants.RSA_PSS_SALTLEN_DIGEST});
 return JSON.stringify({payload:payload.toString('base64'),signature:signature.toString('base64')});
}
/** Verifies signature before using manifest paths, then checks exact file inventory and every content hash. */
export function verifyRelease(root,envelopeText,publicPem){
 root=resolve(root);if(envelopeText.length>2_000_000)throw new Error('Oversized release manifest');const envelope=JSON.parse(envelopeText);
 if(!envelope||typeof envelope.payload!=='string'||typeof envelope.signature!=='string'||Object.keys(envelope).length!==2)throw new Error('Invalid envelope');
 const payload=Buffer.from(envelope.payload,'base64'),signature=Buffer.from(envelope.signature,'base64');
 if(payload.toString('base64')!==envelope.payload||signature.toString('base64')!==envelope.signature||signature.length!==384||!verify('sha256',payload,{key:rsa(createPublicKey(publicPem)),padding:constants.RSA_PKCS1_PSS_PADDING,saltLength:constants.RSA_PSS_SALTLEN_DIGEST},signature))throw new Error('Invalid release signature');
 const data=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(payload));
 if(data.kind!=='roombook-release'||data.version!==1||!Array.isArray(data.files)||!data.files.length||data.files.length>10000||typeof data.createdAt!=='string'||!Number.isFinite(Date.parse(data.createdAt)))throw new Error('Invalid release claims');
 const paths=[];
 for(const entry of data.files){if(!entry||typeof entry.path!=='string'||typeof entry.sha256!=='string'||! /^(dist|frontend\/dist)\/[a-zA-Z0-9_./-]+$/.test(entry.path)||entry.path.split('/').some(part=>['','.','..'].includes(part))||!/^[a-f0-9]{64}$/.test(entry.sha256))throw new Error('Unsafe manifest entry');paths.push(entry.path);}
 const current=inventory(root);if(new Set(paths).size!==paths.length||JSON.stringify([...paths].sort())!==JSON.stringify(current))throw new Error('Release inventory mismatch');
 for(const entry of data.files)if(digest(join(root,entry.path))!==entry.sha256)throw new Error('Release content changed');
 return {verifiedFiles:paths.length};
}

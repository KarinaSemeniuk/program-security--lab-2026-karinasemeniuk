import { InstallationLicense } from "../dist/Domain/Licensing/Entity/InstallationLicense.js";
import { readFileSync,writeFileSync,existsSync,mkdirSync,openSync,closeSync,renameSync,lstatSync } from 'node:fs';
import { dirname } from 'node:path';
import { generateKeyPairSync,createPrivateKey,createPublicKey,sign,constants,randomUUID } from 'node:crypto';
const [mode,...args]=process.argv.slice(2);
const artifact=process.env.LICENSE_PATH||'data/installation-license.json',publicPath=process.env.LICENSE_PUBLIC_KEY_PATH||'data/license-public.pem';
const privatePath=process.env.LICENSE_ISSUER_PRIVATE_KEY_PATH||'.secrets/license-issuer-private.pem';
const atomic=(path,text,permissions)=>{mkdirSync(dirname(path),{recursive:true,mode:0o700});const temp=path+'.tmp-'+randomUUID();const fd=openSync(temp,'wx',permissions);try{writeFileSync(fd,text);}finally{closeSync(fd);}renameSync(temp,path);};
try{
 if(!['init','issue'].includes(mode))throw new Error('invalid mode');
 let installationId=process.env.ROOMBOOK_INSTALLATION_ID;
 if(!installationId){if(mode!=='init')throw new Error('installation missing');installationId=randomUUID();let env=readFileSync('.env','utf8');env=/^ROOMBOOK_INSTALLATION_ID=.*$/m.test(env)?env.replace(/^ROOMBOOK_INSTALLATION_ID=.*$/m,'ROOMBOOK_INSTALLATION_ID='+installationId):env+'\nROOMBOOK_INSTALLATION_ID='+installationId+'\n';atomic('.env',env,0o600);}
 if(!existsSync(privatePath)){
  if(mode!=='init'||existsSync(publicPath)||existsSync(artifact))throw new Error('issuer unavailable');
  mkdirSync(dirname(privatePath),{recursive:true,mode:0o700});
  const pair=generateKeyPairSync('rsa',{modulusLength:3072,publicKeyEncoding:{type:'spki',format:'pem'},privateKeyEncoding:{type:'pkcs8',format:'pem'}});
  atomic(privatePath,pair.privateKey,0o600);atomic(publicPath,pair.publicKey,0o644);
 }
 const keyInfo=lstatSync(privatePath);if(!keyInfo.isFile()||keyInfo.isSymbolicLink()||(keyInfo.mode&0o077)!==0)throw new Error('unsafe private key permissions');
 const key=createPrivateKey(readFileSync(privatePath));if(key.asymmetricKeyType!=='rsa'||key.asymmetricKeyDetails?.modulusLength!==3072)throw new Error('invalid issuer');
 const derived=createPublicKey(key).export({type:'spki',format:'pem'}).toString();
 if(!existsSync(publicPath))atomic(publicPath,derived,0o644);
 else if(createPublicKey(readFileSync(publicPath)).export({type:'spki',format:'pem'}).toString()!==derived)throw new Error('trust mismatch');
 if(mode==='init'&&existsSync(artifact)){console.log('Existing signed installation license preserved.');}
 else{
  const options={holder:'RoomBook local development',days:365,features:'booking,private-notes,resource-admin'};
  if(args.length%2!==0)throw new Error('invalid options');
  for(let i=0;i<args.length;i+=2){const name=args[i].slice(2);if(!['holder','days','features'].includes(name)||!args[i].startsWith('--'))throw new Error('invalid option');options[name]=args[i+1];}
  const days=Number(options.days);const features=options.features?options.features.split(','):[];
  if(!Number.isInteger(days)||days<1||days>3660||!options.holder.trim()||[...options.holder].length>100||features.some(x=>!['booking','private-notes','resource-admin'].includes(x))||new Set(features).size!==features.length)throw new Error('invalid claims');
  const now=new Date();const claims={productId:'roombook',installationId,licenseId:randomUUID(),holder:options.holder,issuedAt:now.toISOString(),notBefore:new Date(now.getTime()-60_000).toISOString(),expiresAt:new Date(now.getTime()+days*86400_000).toISOString(),features};
  InstallationLicense.parse(claims,installationId);
  const payload=Buffer.from(JSON.stringify(claims),'utf8');const signature=sign('sha256',payload,{key,padding:constants.RSA_PKCS1_PSS_PADDING,saltLength:constants.RSA_PSS_SALTLEN_DIGEST});
  atomic(artifact,JSON.stringify({payload:payload.toString('base64'),signature:signature.toString('base64')}),0o644);
  console.log('Signed installation license issued. Private key material was not displayed.');
 }
}catch{console.error('Cannot initialize/issue license. Check private issuer key, installation binding, paths and --holder/--days/--features options.');process.exitCode=1;}

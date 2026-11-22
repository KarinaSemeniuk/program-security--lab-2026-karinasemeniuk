// Local read-only check; prints no secret values and never uploads any files.
import {readFileSync,readdirSync,existsSync} from 'node:fs';import {join} from 'node:path';
const values=[process.env.JWT_SECRET,process.env.DATABASE_URL].filter(Boolean);
const keyPath=process.env.NOTE_KEYRING_PATH||'.secrets/note-keys.json';
if(existsSync(keyPath)){const ring=JSON.parse(readFileSync(keyPath,'utf8'));values.push(...Object.values(ring.keys));}
const files=[];function walk(path){for(const item of readdirSync(path,{withFileTypes:true})){const full=join(path,item.name);if(item.isDirectory())walk(full);else if(item.isFile())files.push(full);}}
try{
 walk('dist');walk('frontend/dist');
 for(const path of files){const text=readFileSync(path,'utf8');if(values.some(value=>value.length>=16&&text.includes(value))||/-----BEGIN (?:RSA )?PRIVATE KEY-----/.test(text))throw new Error('Secret detected');}
 console.log(JSON.stringify({result:'passed',checkedBuildFiles:files.length,secretValuesDisplayed:false}));
}catch{console.error('Build secret check failed. Inspect generated artifacts privately before distribution.');process.exitCode=1;}

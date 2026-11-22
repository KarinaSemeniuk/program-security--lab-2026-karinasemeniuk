// Initializes a backend-only local key file without printing any secret material.
import { mkdirSync, openSync, writeFileSync, closeSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { randomBytes } from 'node:crypto';
import { FileNoteKeyring } from '../dist/Infrastructure/Configuration/FileNoteKeyring.js';
const path=process.env.NOTE_KEYRING_PATH||'.secrets/note-keys.json';
try {
 if(existsSync(path)){new FileNoteKeyring(path).load();console.log('Existing private key file validated and preserved.');}
 else {
  mkdirSync(dirname(path),{recursive:true,mode:0o700});
  const descriptor=openSync(path,'wx',0o600);
  try{writeFileSync(descriptor,JSON.stringify({version:1,activeId:'k-initial',keys:{'k-initial':randomBytes(32).toString('hex')}}));}finally{closeSync(descriptor);}
  console.log('Private note key file initialized. No key material was displayed.');
 }
}catch{console.error('Cannot initialize note keys. Verify private path and owner-only file permissions.');process.exitCode=1;}

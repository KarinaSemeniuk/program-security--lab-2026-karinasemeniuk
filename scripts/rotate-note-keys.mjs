// Coordinated rotation for server instances sharing this exact private key file and DB.
import { FileNoteKeyring } from '../dist/Infrastructure/Configuration/FileNoteKeyring.js';
import { PrismaNoteKeyRotation } from '../dist/Infrastructure/Persistence/PrismaNoteKeyRotation.js';
if(process.argv.slice(2).some(arg=>arg!=='--resume')){console.error('Usage: npm run notes:rotate -- [--resume]');process.exit(1);}
try{
 const result=await new PrismaNoteKeyRotation(process.env.DATABASE_URL,new FileNoteKeyring(process.env.NOTE_KEYRING_PATH||'.secrets/note-keys.json')).rotate(process.argv.includes('--resume'));
 console.log(JSON.stringify({result:'completed',activeId:result.activeId,reencryptedNotes:result.processed,oldKeysRetained:true}));
}catch{console.error('Rotation failed safely. Old keys were retained. Resolve the failure and use --resume; do not remove key files.');process.exitCode=1;}

// Explicit local administrative command, never exposed through the public API.
import { PrismaClient } from '@prisma/client';
const email = process.argv[2]?.trim().toLowerCase();
if (!email || process.argv.length !== 3) {
  console.error('Usage: npm run admin:promote -- your-registered-email'); process.exit(1);
}
const db = new PrismaClient();
try {
  const user = await db.userModel.findUnique({ where: { email }, select: { id: true, isBlocked: true } });
  if (!user || user.isBlocked) { console.error('Active registered account not found.'); process.exitCode = 1; }
  else { await db.userModel.update({ where: { id: user.id }, data: { role: 'ADMIN' }, select: { id: true } }); console.log('Registered account promoted to ADMIN. Sign in again or refresh the page.'); }
} catch { console.error('Cannot update the account. Check the local database configuration.'); process.exitCode = 1; }
finally { await db.$disconnect(); }

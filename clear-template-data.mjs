/**
 * clear-template-data.mjs
 * ─────────────────────────────────────────────
 * Wipes ALL seeded / template documents from the
 * notx-saas Firestore database using the REST API.
 *
 * Collections cleared:
 *   users · events · announcements · albums
 *   certificates · event_winners · tenants
 *   registrations · invitations
 *   appSettings (seed_status doc only)
 *
 * Run: node clear-template-data.mjs
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dir = dirname(__filename);

// ── Load firebase config ────────────────────────────────────────────────────
const config = JSON.parse(
  readFileSync(join(__dir, 'firebase-applet-config.json'), 'utf8')
);
const { projectId, apiKey } = config;
const BASE = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
const KEY  = `?key=${apiKey}`;

// ── Collections to fully wipe ───────────────────────────────────────────────
const COLLECTIONS_TO_WIPE = [
  'users',
  'events',
  'announcements',
  'albums',
  'certificates',
  'event_winners',
  'tenants',
  'registrations',
  'invitations',
];

// ── Helpers ─────────────────────────────────────────────────────────────────
async function listDocs(col) {
  const url = `${BASE}/${col}${KEY}&pageSize=300`;
  const res  = await fetch(url);
  if (!res.ok) {
    const t = await res.text();
    console.warn(`  ⚠  listDocs(${col}) → ${res.status}: ${t}`);
    return [];
  }
  const json = await res.json();
  return (json.documents || []).map(d => d.name); // full resource name
}

async function deleteDoc(name) {
  const url = `https://firestore.googleapis.com/v1/${name}${KEY}`;
  const res  = await fetch(url, { method: 'DELETE' });
  if (!res.ok && res.status !== 404) {
    console.warn(`  ⚠  DELETE ${name} → ${res.status}`);
  }
}

async function deleteDoc_byPath(col, docId) {
  const name = `projects/${projectId}/databases/(default)/documents/${col}/${docId}`;
  await deleteDoc(name);
}

// ── Main ─────────────────────────────────────────────────────────────────────
console.log('\n🗑️  Starting template data cleanup for project:', projectId);
console.log('─'.repeat(60));

let totalDeleted = 0;

for (const col of COLLECTIONS_TO_WIPE) {
  process.stdout.write(`  Clearing  "${col}" … `);
  const docs = await listDocs(col);
  if (docs.length === 0) {
    console.log('(empty, nothing to do)');
    continue;
  }
  for (const name of docs) {
    await deleteDoc(name);
  }
  console.log(`deleted ${docs.length} doc(s)`);
  totalDeleted += docs.length;
}

// ── Reset seed_status so app won't think it's already seeded ─────────────────
process.stdout.write('  Deleting  "appSettings/seed_status" … ');
await deleteDoc_byPath('appSettings', 'seed_status');
console.log('done');

console.log('─'.repeat(60));
console.log(`✅  Done! ${totalDeleted} documents deleted across ${COLLECTIONS_TO_WIPE.length} collections.`);
console.log('   The seed_status flag has been cleared.\n');

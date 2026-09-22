// One-off: creates Supabase Storage buckets. Run: node scripts/setup-storage.mjs
// Reads keys from .env.local (never commit that file).
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  fs
    .readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const sb = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SECRET_KEY
);

const buckets = [
  { name: "product-images", public: true },
  { name: "design-images", public: true },
  { name: "payment-proofs", public: false },
];

for (const b of buckets) {
  const { error } = await sb.storage.createBucket(b.name, { public: b.public });
  if (!error) console.log(`${b.name}: created (public=${b.public})`);
  else if (/already exists|duplicate/i.test(error.message))
    console.log(`${b.name}: already exists`);
  else console.log(`${b.name}: ERROR ${error.message}`);
}

// Payment reconciliation.
//
// Reads payments.jsonl and works out how much money we actually collected.
// Run:  node reconcile.js

const fs = require("fs");

function parseAmount(value) {
  if (typeof value === "string") {
    return Number(value.replace(/,/g, "").trim());
  }
  return Number(value);
}

// Keep only the latest attempt for each txn_id
const latest = new Map();

const lines = fs
  .readFileSync("payments.jsonl", "utf8")
  .split("\n")
  .filter((l) => l.trim().length > 0);
for (const line of lines) {
  let event;
  try {
    event = JSON.parse(line);
  } catch {
    continue; // unreadable line
  }
  if (!event || !event.txn_id) continue; // no txn_id

  const current = latest.get(event.txn_id);
  // Lines are not in time order, so compare timestamps (ISO 8601 UTC sorts as text)
  if (!current || event.ts > current.ts) {
    latest.set(event.txn_id, event);
  }
}

let total = 0;
let count = 0;
for (const event of latest.values()) {
  if (event.status === "success") {
    total += parseAmount(event.amount);
    count += 1;
  }
}

const expected = parseInt(fs.readFileSync("expected.txt", "utf8").trim(), 10);

if (count !== expected) {
  console.log(
    `Check failed: counted ${count} successful payments, expected ${expected}.`,
  );
  console.log(
    "Something in the data isn't being handled the way the README describes.",
  );
} else {
  console.log(`Check passed: ${count} successful payments.`);
  console.log(`Your code: KOYA-${Math.round(total)}`);
}

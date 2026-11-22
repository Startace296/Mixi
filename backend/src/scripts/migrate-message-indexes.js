/**
 * Brings the messages collection's indexes in line with models/Message.js, safely.
 *
 *   node src/scripts/migrate-message-indexes.js            # apply
 *   node src/scripts/migrate-message-indexes.js --dry-run  # only print the plan
 *
 * Mongoose's syncIndexes() drops stale indexes *before* building new ones, leaving
 * queries without a usable index while the build runs. This script does it in the
 * safe order instead:
 *   1. create the missing indexes (online builds on MongoDB 4.2+, no collection lock),
 *   2. check with explain() that timeline queries now use the new index,
 *   3. only then drop the indexes the schema no longer declares.
 * Run it once per deploy that changes Message indexes. It is idempotent.
 */
import "dotenv/config";
import mongoose from "mongoose";

import Message from "../models/Message.js";
import { buildKeysetFilter } from "../utils/pagination.utils.js";

const TIMELINE_INDEX = "conversation_timeline";
const DELETED_INDEX = "conversation_deleted";
const isDryRun = process.argv.includes("--dry-run");

function describeIndex(index) {
  return typeof index === "string" ? index : JSON.stringify(index);
}

/** Name of the index the winning plan scans, or null for a collection scan. */
function findPlanIndexName(plan) {
  if (!plan || typeof plan !== "object") return null;
  if (plan.indexName) return plan.indexName;
  for (const child of [plan.inputStage, ...(plan.inputStages || []), plan.queryPlan]) {
    const name = findPlanIndexName(child);
    if (name) return name;
  }
  return null;
}

async function winningIndexFor(query) {
  const explained = await query.explain("queryPlanner");
  const planner = explained.queryPlanner || explained[0]?.queryPlanner;
  return findPlanIndexName(planner?.winningPlan);
}

async function verifyQueriesUseNewIndexes() {
  const conversationId = new mongoose.Types.ObjectId();
  const cursor = { createdAt: new Date(), id: new mongoose.Types.ObjectId() };
  const checks = [
    {
      label: "newest page",
      expected: TIMELINE_INDEX,
      query: Message.find({ conversationId }).sort({ createdAt: -1, _id: -1 }).limit(51),
    },
    {
      label: "older page (before)",
      expected: TIMELINE_INDEX,
      query: Message.find({ conversationId, $and: [buildKeysetFilter(cursor, "before")] })
        .sort({ createdAt: -1, _id: -1 })
        .limit(51),
    },
    {
      label: "catch-up page (after)",
      expected: TIMELINE_INDEX,
      query: Message.find({ conversationId, $and: [buildKeysetFilter(cursor, "after")] })
        .sort({ createdAt: 1, _id: 1 })
        .limit(51),
    },
    {
      label: "deleted since",
      expected: DELETED_INDEX,
      query: Message.find({ conversationId, deletedAt: { $type: "date", $gt: new Date(0) } }).select("_id"),
    },
  ];

  for (const { label, expected, query } of checks) {
    const used = await winningIndexFor(query);
    if (used !== expected) {
      throw new Error(`${label}: expected index ${expected}, planner chose ${used || "a collection scan"}`);
    }
    console.log(`  ok  ${label} -> ${used}`);
  }
}

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is required");
  }

  await mongoose.connect(process.env.MONGODB_URI, { autoIndex: false });
  console.log(`Connected to ${mongoose.connection.name}${isDryRun ? " (dry run)" : ""}`);

  const { toCreate, toDrop } = await Message.diffIndexes();
  console.log(`Indexes to create: ${toCreate.length ? toCreate.map(describeIndex).join(", ") : "none"}`);
  console.log(`Indexes to drop:   ${toDrop.length ? toDrop.map(describeIndex).join(", ") : "none"}`);
  if (isDryRun) return;

  console.log("1/3 Creating missing indexes...");
  await Message.createIndexes();

  console.log("2/3 Checking query plans...");
  await verifyQueriesUseNewIndexes();

  console.log("3/3 Dropping indexes the schema no longer declares...");
  const { toDrop: stale } = await Message.diffIndexes();
  for (const name of stale) {
    await Message.collection.dropIndex(name);
    console.log(`  dropped ${name}`);
  }

  console.log("Done.");
}

main()
  .catch((err) => {
    console.error(`Migration failed: ${err.message}`);
    console.error("Nothing was dropped after the failing step; old indexes are still in place.");
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());

import { createRxDatabase } from "rxdb/plugins/core";
import { getRxStorageLoki } from "rxdb/plugins/lokijs";
const LokiIncrementalIndexedDBAdapter = require("lokijs/src/incremental-indexeddb-adapter");

export const initDatabase = async () => {
  if (!global.window) {
    return null;
  }

  if (window.db) {
    return window.db;
  }

  console.log("init db");
  const db = await createRxDatabase({
    name: "withloki",
    storage: getRxStorageLoki({
      adapter: new LokiIncrementalIndexedDBAdapter(),
    }),
  });

  window.db = db;

  await db.addCollections({
    counters: {
      schema: {
        type: "object",
        version: 0,
        primaryKey: "id",
        required: ["id"],
        properties: {
          id: { type: "string" },
          counter: { type: "string" },
        },
      },
    },
  });

  await db.counters.upsert({ id: "doc1", counter: "initial" });

  return db;
};

async function run() {
  const db = await initDatabase();
  if (!db) {
    return null;
  }

  console.log("Add change listener and wait for change event");
  const doc1 = await db.counters.findOne({ selector: { id: "doc1" } }).exec();

  document.addEventListener("click", () => {
    doc1.atomicUpdate((doc) => {
      console.time("update");
      doc.counter = Math.random().toString();
      return doc;
    });
  });

  doc1.get$("counter").subscribe((next) => {
    console.log("counter", next);
    console.timeEnd("update");
  });
}

run()
import { MongoClient } from "mongodb";

const localURI = "mongodb://localhost:27017/soho_fragrance";
const atlasURI = "mongodb+srv://zahoorjamali32_db_user:F6e0NQibIASCwYG9@cluster0.hngg579.mongodb.net/soho_fragrance?retryWrites=true&w=majority";

async function migrate() {
  console.log("=== Starting MongoDB Migration to Atlas ===");
  console.log("Source: ", localURI);
  console.log("Destination: ", atlasURI.replace(/:[^:]*@/, ":****@"));

  const sourceClient = new MongoClient(localURI);
  const destClient = new MongoClient(atlasURI);

  try {
    await sourceClient.connect();
    console.log("Connected to source local MongoDB.");

    await destClient.connect();
    console.log("Connected to destination MongoDB Atlas.");

    const sourceDb = sourceClient.db("soho_fragrance");
    const destDb = destClient.db("soho_fragrance");

    const collections = await sourceDb.listCollections().toArray();
    console.log(`Found ${collections.length} collections to migrate:`, collections.map(c => c.name));

    for (const colInfo of collections) {
      const colName = colInfo.name;
      if (colName.startsWith("system.")) continue;

      console.log(`\n--- Migrating collection: [${colName}] ---`);
      const srcCol = sourceDb.collection(colName);
      const destCol = destDb.collection(colName);

      const count = await srcCol.countDocuments();
      console.log(`Found ${count} documents in source [${colName}].`);

      if (count > 0) {
        const docs = await srcCol.find({}).toArray();

        // Clear destination collection first for clean migration
        try {
          await destCol.drop();
        } catch (e) {
          // Ignore if collection didn't exist
        }

        const insertRes = await destCol.insertMany(docs);
        console.log(`Inserted ${insertRes.insertedCount} documents into Atlas [${colName}].`);
      } else {
        console.log(`Collection [${colName}] is empty, ensuring collection exists on Atlas.`);
        try {
          await destDb.createCollection(colName);
        } catch (e) {}
      }

      // Copy indexes (except default _id_)
      try {
        const indexes = await srcCol.indexes();
        for (const idx of indexes) {
          if (idx.name === "_id_") continue;
          const { key, name, unique, sparse, ...options } = idx;
          const indexOpts = { name };
          if (unique) indexOpts.unique = true;
          if (sparse) indexOpts.sparse = true;
          try {
            await destCol.createIndex(key, indexOpts);
            console.log(`  Copied index [${name}] on ${JSON.stringify(key)}`);
          } catch (idxErr) {
            console.warn(`  Warning copying index ${name}:`, idxErr.message);
          }
        }
      } catch (err) {
        console.warn(`Could not read indexes for ${colName}:`, err.message);
      }

      // Verification
      const destCount = await destCol.countDocuments();
      console.log(`Verification: Source=${count}, Atlas=${destCount} (${count === destCount ? "MATCH SUCCESS" : "MISMATCH WARNING"})`);
    }

    console.log("\n=== Migration Completed Successfully! ===");
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  } finally {
    await sourceClient.close();
    await destClient.close();
  }
}

migrate();

import { SqliteMemoryProvider } from '../src/memory/providers/SqliteMemoryProvider.js';
import fs from 'fs';
import path from 'path';

async function runSqliteProviderTest() {
  console.log("\n" + "=".repeat(50));
  console.log("🧪 TDD: RUNNING SQLITE MEMORY PROVIDER TEST 🧪");
  console.log("=".repeat(50));

  const testDbPath = path.join(process.cwd(), 'test_state.db');
  
  // Cleanup if exists
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }

  console.log("[STEP 1] Initializing SqliteMemoryProvider...");
  const provider = new SqliteMemoryProvider(testDbPath);
  console.log("  [SUCCESS]");

  console.log("[STEP 2] Testing initial load (should be null)...");
  const initialState = await provider.load();
  if (initialState !== null) {
    throw new Error(`Expected initial state to be null, got: ${JSON.stringify(initialState)}`);
  }
  console.log("  [SUCCESS]");

  console.log("[STEP 3] Testing save and load...");
  const testState = {
    user: 'test-user',
    lastSession: new Date().toISOString(),
    preferences: {
      theme: 'dark'
    }
  };

  await provider.save(testState);
  const loadedState = await provider.load();
  
  if (JSON.stringify(loadedState) !== JSON.stringify(testState)) {
    throw new Error(`State mismatch!\nSaved: ${JSON.stringify(testState)}\nLoaded: ${JSON.stringify(loadedState)}`);
  }
  console.log("  [SUCCESS]");

  console.log("[STEP 4] Testing update (upsert)...");
  const updatedState = { ...testState, user: 'updated-user' };
  await provider.save(updatedState);
  const newlyLoadedState = await provider.load();
  
  if (newlyLoadedState.user !== 'updated-user') {
    throw new Error(`Upsert failed! Expected user 'updated-user', got: ${newlyLoadedState.user}`);
  }
  console.log("  [SUCCESS]");

  console.log("[STEP 5] Verifying database file exists...");
  if (!fs.existsSync(testDbPath)) {
    throw new Error("Database file was not created.");
  }
  console.log("  [SUCCESS]");

  // Close and cleanup
  provider.close();
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }

  console.log("\n" + "=".repeat(50));
  console.log("🧪 TDD SQLITE MEMORY PROVIDER: NOMINAL 🧪");
  console.log("=".repeat(50) + "\n");
}

runSqliteProviderTest().catch(err => {
  console.error("\n❌ TEST FAILED:", err.message);
  process.exit(1);
});

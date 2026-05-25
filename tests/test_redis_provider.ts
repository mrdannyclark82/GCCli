import { RedisMemoryProvider } from '../src/memory/providers/RedisMemoryProvider.js';

async function runRedisProviderTest() {
  console.log("\n" + "=".repeat(50));
  console.log("🧪 TDD: RUNNING REDIS MEMORY PROVIDER TEST 🧪");
  console.log("=".repeat(50));

  console.log("[STEP 1] Initializing RedisMemoryProvider with mock client...");
  // Use a dummy URL for the mock
  const provider = new RedisMemoryProvider('redis://localhost:6379');
  
  // Mocking the client
  let mockRedisStore: Record<string, string> = {};
  const mockClient = {
    isOpen: false,
    on: (event: string, cb: Function) => {},
    connect: async function() { 
      this.isOpen = true; 
    },
    set: async (key: string, val: string) => { 
      mockRedisStore[key] = val; 
    },
    get: async (key: string) => { 
      return mockRedisStore[key] || null; 
    },
    quit: async function() { 
      this.isOpen = false; 
    }
  };
  
  // Force inject the mock client
  (provider as any).client = mockClient;
  console.log("  [SUCCESS]");

  console.log("[STEP 2] Testing initial load (should be null)...");
  const initialState = await provider.load();
  if (initialState !== null) {
    throw new Error(`Expected initial state to be null, got: ${JSON.stringify(initialState)}`);
  }
  console.log("  [SUCCESS]");

  console.log("[STEP 3] Testing save and load...");
  const testState = {
    user: 'redis-user',
    lastSession: new Date().toISOString(),
    preferences: {
      theme: 'light'
    }
  };

  await provider.save(testState);
  const loadedState = await provider.load();
  
  if (JSON.stringify(loadedState) !== JSON.stringify(testState)) {
    throw new Error(`State mismatch!\nSaved: ${JSON.stringify(testState)}\nLoaded: ${JSON.stringify(loadedState)}`);
  }
  console.log("  [SUCCESS]");

  console.log("[STEP 4] Testing update...");
  const updatedState = { ...testState, user: 'updated-redis-user' };
  await provider.save(updatedState);
  const newlyLoadedState = await provider.load();
  
  if (newlyLoadedState.user !== 'updated-redis-user') {
    throw new Error(`Update failed! Expected user 'updated-redis-user', got: ${newlyLoadedState.user}`);
  }
  console.log("  [SUCCESS]");

  console.log("[STEP 5] Verifying mock storage content...");
  if (!mockRedisStore['gccli:state:default']) {
    throw new Error("Data was not saved to the expected key 'gccli:state:default'");
  }
  console.log("  [SUCCESS]");

  await provider.close();
  console.log("\n" + "=".repeat(50));
  console.log("🧪 TDD REDIS MEMORY PROVIDER: NOMINAL 🧪");
  console.log("=".repeat(50) + "\n");
}

runRedisProviderTest().catch(err => {
  console.error("\n❌ TEST FAILED:", err.message);
  console.error(err.stack);
  process.exit(1);
});

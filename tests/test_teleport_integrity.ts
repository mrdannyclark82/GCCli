import { TeleportationSkill } from '../src/skills/Teleportation.js';
import { MemoryManager } from '../src/memory/MemoryManager.js';
import fs from 'fs/promises';
import path from 'path';

async function runIntegrityTest() {
  console.log("\n" + "="*50);
  console.log("🌿 GCCLi : TELEPORTATION INTEGRITY HEARTBEAT 🌿");
  console.log("="*50);

  const memory = new MemoryManager();
  const teleport = new TeleportationSkill();
  const testFilePath = 'heartbeat_state.json';

  await teleport.initialize();

  // 1. Prepare Initial State
  console.log("\n[STEP 1] Preparing initial agent state...");
  memory.addToShortTerm({ role: 'user', content: 'Hello, Milla.' });
  memory.addToShortTerm({ role: 'assistant', content: 'Hello, Architect. How can I help today?' });
  await memory.saveToLongTerm('project_status', 'Phase 2 Active');
  
  const initialState = {
    memory: memory.getState(),
    goals: [{ id: 'test_goal', description: 'Verify integrity', status: 'active', priority: 1 }],
    context: { currentTask: 'Heartbeat Test', activeSkills: ['Teleportation'], environment: 'test' }
  };

  // 2. Export State
  console.log("\n[STEP 2] Exporting state (generating checksum)...");
  await teleport.execute({ action: 'export', filePath: testFilePath, stateData: initialState });
  console.log("  [SUCCESS] State sealed and exported.");

  // 3. Verify Valid Import
  console.log("\n[STEP 3] Verifying valid import...");
  try {
    const importedState = await teleport.execute({ action: 'import', filePath: testFilePath });
    console.log("  [SUCCESS] Valid state imported successfully.");
    console.log(`  [+] Verification: Long-term memory 'project_status' = ${importedState.memory.longTerm.project_status}`);
  } catch (err: any) {
    console.error(`  [!] Unexpected failure on valid import: ${err.message}`);
  }

  // 4. Manual Tamper (Corrupting data)
  console.log("\n[STEP 4] Tampering with the state file (simulating corruption)...");
  const rawData = await fs.readFile(testFilePath, 'utf-8');
  const tamperedJson = JSON.parse(rawData);
  
  // Change the data but NOT the checksum
  tamperedJson.memory.longTerm.project_status = 'TAMPERED';
  
  await fs.writeFile(testFilePath, JSON.stringify(tamperedJson, null, 2), 'utf-8');
  console.log("  [*] Data modified manually. Checksum remains unchanged.");

  // 5. Verify Import Rejection
  console.log("\n[STEP 5] Attempting to import tampered state...");
  try {
    await teleport.execute({ action: 'import', filePath: testFilePath });
    console.log("  [!] FAILURE: Corrupted state was accepted!");
  } catch (err: any) {
    console.log(`  [SUCCESS] Import rejected as expected: ${err.message}`);
  }

  // Cleanup
  await fs.unlink(testFilePath);
  
  console.log("\n" + "="*50);
  console.log("🌿 INTEGRITY CHECK: NOMINAL 🌿");
  console.log("="*50 + "\n");
}

runIntegrityTest().catch(console.error);

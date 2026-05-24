export class MemoryManager {
  private shortTermMemory: any[] = [];
  private longTermMemory: Map<string, any> = new Map();

  addToShortTerm(entry: any) {
    this.shortTermMemory.push(entry);
    // Simple cap for now
    if (this.shortTermMemory.length > 50) {
      this.shortTermMemory.shift();
    }
  }

  async saveToLongTerm(key: string, value: any) {
    this.longTermMemory.set(key, value);
    // TODO: Persist to disk / vector store later
  }

  getShortTerm(): any[] {
    return this.shortTermMemory;
  }

  getLongTerm(key: string): any {
    return this.longTermMemory.get(key);
  }
}

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

  getState() {
    return {
      shortTerm: this.shortTermMemory,
      longTerm: this.mapToObj(this.longTermMemory)
    };
  }

  loadState(state: any) {
    if (state.shortTerm) {
      this.shortTermMemory = state.shortTerm;
    }
    if (state.longTerm) {
      this.longTermMemory = this.objToMap(state.longTerm);
    }
  }

  private mapToObj(map: Map<string, any>): Record<string, any> {
    const obj: Record<string, any> = {};
    for (const [key, value] of map) {
      obj[key] = (value instanceof Map) ? this.mapToObj(value) : value;
    }
    return obj;
  }

  private objToMap(obj: Record<string, any>): Map<string, any> {
    const map = new Map<string, any>();
    for (const [key, value] of Object.entries(obj)) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        map.set(key, this.objToMap(value));
      } else {
        map.set(key, value);
      }
    }
    return map;
  }
}

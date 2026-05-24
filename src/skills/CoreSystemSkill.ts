export abstract class CoreSystemSkill {
  abstract name: string;
  abstract description: string;

  abstract initialize(): Promise<void>;
  abstract execute(context: any): Promise<any>;
}

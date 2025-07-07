import { injectable } from "tsyringe";

@injectable()
export class Nested {
  get(): string {
    return 'nested';
  }
}

@injectable()
export class Sample {
  constructor(private readonly nested: Nested) {}

  get(): string {
    return this.nested.get();
  }
}

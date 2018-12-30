export class KeyHistory {
  key: string;
  time: number;
  constructor(options: Pick<KeyHistory, 'key'>) {
    this.key = options.key;
    this.time = Date.now();
  }
  toString() {
    return this.key;
  }
}

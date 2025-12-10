class UniqueArray<T> {
  private readonly array: T[];
  public readonly maxLength: number;
  constructor(maxLength: number = Infinity) {
    this.array = [];
    this.maxLength = maxLength;
  }

  *[Symbol.iterator](): Generator<T, void, unknown> {
    for (let i = 0; i < this.array.length; i++) {
      yield this.array[i];
    }
  }

  public add(element: T): void {
    if (this.array.includes(element) || this.array.length === this.maxLength) {
      return;
    }

    this.array.push(element);
  }

  public remove(element: T): void {
    const index = this.array.indexOf(element);

    if (index === -1) {
      return;
    }

    this.array.splice(index, 1);
  }

  public get(index: number): T {
    return this.array[index];
  }

  public has(element: T): boolean {
    return this.array.includes(element);
  }

  public indexOf(element: T): number {
    return this.array.indexOf(element);
  }

  public clear(): void {
    this.array.length = 0;
  }

  public get size(): number {
    return this.array.length;
  }
}

export { UniqueArray };

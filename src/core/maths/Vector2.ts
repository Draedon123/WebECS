class Vector2 {
  public readonly components: Float32Array;

  constructor(x: number = 0, y: number = 0) {
    this.components = new Float32Array([x, y]);
  }

  *[Symbol.iterator]() {
    yield this.x;
    yield this.y;
  }

  public get x(): number {
    return this.components[0];
  }

  public get y(): number {
    return this.components[1];
  }

  public set x(x: number) {
    this.components[0] = x;
  }

  public set y(y: number) {
    this.components[1] = y;
  }
}

export { Vector2 };

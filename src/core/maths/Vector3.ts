class Vector3 {
  private readonly components: Float32Array;
  constructor(x: number = 0, y: number = 0, z: number = 0) {
    this.components = new Float32Array([x, y, z]);
  }

  *[Symbol.iterator]() {
    yield this.x;
    yield this.y;
    yield this.z;
  }

  public static add(a: Vector3, b: Vector3): Vector3 {
    return new Vector3(a.x + b.x, a.y + b.y, a.z + b.z);
  }

  public add(vector3: Vector3): this {
    this.x += vector3.x;
    this.y += vector3.y;
    this.z += vector3.z;

    return this;
  }

  public static subtract(a: Vector3, b: Vector3): Vector3 {
    return new Vector3(a.x - b.x, a.y - b.y, a.z - b.z);
  }

  public scale(factor: number): this {
    this.x *= factor;
    this.y *= factor;
    this.z *= factor;

    return this;
  }

  public normalise(): this {
    const magnitude = this.magnitude;

    if (magnitude < 1e-6) {
      console.warn("Vector magnitude too close to 0 to be normalised");
      return this;
    }

    this.scale(1 / magnitude);

    return this;
  }

  public get magnitude(): number {
    return Math.hypot(this.x, this.y, this.z);
  }

  public get x(): number {
    return this.components[0];
  }

  public get y(): number {
    return this.components[1];
  }

  public get z(): number {
    return this.components[2];
  }

  public set x(x: number) {
    this.components[0] = x;
  }

  public set y(y: number) {
    this.components[1] = y;
  }

  public set z(z: number) {
    this.components[2] = z;
  }
}

export { Vector3 };

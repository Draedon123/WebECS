class Vector3 {
  private readonly components: Float32Array;
  constructor(x: number = 0, y: number = 0, z: number = 0) {
    this.components = new Float32Array(3);

    this.components[0] = x;
    this.components[1] = y;
    this.components[2] = z;
  }

  *[Symbol.iterator]() {
    yield this.components[0];
    yield this.components[1];
    yield this.components[2];
  }

  public static cross(a: Vector3, b: Vector3): Vector3 {
    const ax = a.components[0];
    const ay = a.components[1];
    const az = a.components[2];
    const bx = b.components[0];
    const by = b.components[1];
    const bz = b.components[2];

    return new Vector3(ay * bz - az * by, az * bx - ax * bz, ax * by - ay * bx);
  }

  public static add(a: Vector3, b: Vector3): Vector3 {
    return new Vector3(
      a.components[0] + b.components[0],
      a.components[1] + b.components[1],
      a.components[2] + b.components[2]
    );
  }

  public add(vector3: Vector3): this {
    this.components[0] += vector3.components[0];
    this.components[1] += vector3.components[1];
    this.components[2] += vector3.components[2];

    return this;
  }

  public static subtract(a: Vector3, b: Vector3): Vector3 {
    return new Vector3(
      a.components[0] - b.components[0],
      a.components[1] - b.components[1],
      a.components[2] - b.components[2]
    );
  }

  public clone(): Vector3 {
    return new Vector3(
      this.components[0],
      this.components[1],
      this.components[2]
    );
  }

  public scale(factor: number): this {
    this.components[0] *= factor;
    this.components[1] *= factor;
    this.components[2] *= factor;

    return this;
  }

  public normalise(): this {
    const magnitude = this.magnitude;

    if (magnitude < 1e-6) {
      console.warn("Vector magnitude too close to 0 to be normalised");
      return this;
    }

    const scale = 1 / magnitude;

    this.components[0] *= scale;
    this.components[1] *= scale;
    this.components[2] *= scale;

    return this;
  }

  public get magnitude(): number {
    return Math.hypot(
      this.components[0],
      this.components[1],
      this.components[2]
    );
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

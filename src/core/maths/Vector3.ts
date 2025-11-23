class Vector3 {
  public x: number;
  public y: number;
  public z: number;
  constructor(x: number = 0, y: number = 0, z: number = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  *[Symbol.iterator]() {
    yield this.x;
    yield this.y;
    yield this.z;
  }

  public static cross(a: Vector3, b: Vector3): Vector3 {
    const ax = a.x;
    const ay = a.y;
    const az = a.z;
    const bx = b.x;
    const by = b.y;
    const bz = b.z;

    return new Vector3(ay * bz - az * by, az * bx - ax * bz, ax * by - ay * bx);
  }

  public static dot(a: Vector3, b: Vector3): number {
    return a.x * b.x + a.y * b.y + a.z * b.z;
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

  public subtract(vector3: Vector3): this {
    this.x -= vector3.x;
    this.y -= vector3.y;
    this.z -= vector3.z;

    return this;
  }

  public clone(): Vector3 {
    return new Vector3(this.x, this.y, this.z);
  }

  public static scale(vector3: Vector3, factor: number): Vector3 {
    return new Vector3(
      vector3.x * factor,
      vector3.y * factor,
      vector3.z * factor
    );
  }

  public scale(factor: number): this {
    this.x *= factor;
    this.y *= factor;
    this.z *= factor;

    return this;
  }

  public static normalise(vector3: Vector3): Vector3 {
    return vector3.clone().normalise();
  }

  public normalise(): this {
    const magnitude = this.magnitude;

    if (magnitude < 1e-6) {
      console.warn("Vector magnitude too close to 0 to be normalised");
      return this;
    }

    const scale = 1 / magnitude;

    this.x *= scale;
    this.y *= scale;
    this.z *= scale;

    return this;
  }

  public get magnitude(): number {
    return Math.hypot(this.x, this.y, this.z);
  }
}

export { Vector3 };

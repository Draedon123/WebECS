class Quaternion {
  public readonly components: Float32Array;
  constructor(x: number = 0, y: number = 0, z: number = 0, w: number = 1) {
    this.components = new Float32Array([x, y, z, w]);
  }

  public multiply(quaternion: Quaternion): this {
    const ax = this.x;
    const ay = this.y;
    const az = this.z;
    const aw = this.w;

    const bx = quaternion.x;
    const by = quaternion.y;
    const bz = quaternion.z;
    const bw = quaternion.w;

    this.x = aw * bx + ax * bw + ay * bz - az * by;
    this.y = aw * by - ax * bz + ay * bw + az * bx;
    this.z = aw * bz + ax * by - ay * bx + az * bw;
    this.w = aw * bw - ax * bx - ay * by - az * bz;

    return this;
  }

  public static clone(quaternion: Quaternion): Quaternion {
    return new Quaternion(
      quaternion.x,
      quaternion.y,
      quaternion.z,
      quaternion.w
    );
  }

  public copyFrom(quaternion: Quaternion): this {
    this.components[0] = quaternion.components[0];
    this.components[1] = quaternion.components[1];
    this.components[2] = quaternion.components[2];
    this.components[3] = quaternion.components[3];

    return this;
  }

  public static invert(quaternion: Quaternion): Quaternion {
    return Quaternion.clone(quaternion).invert();
  }

  public invert(): this {
    const magnitude = this.magnitude;

    if (magnitude < 1e-8) {
      console.error("Magnitude of vector too close to 0 to invert");
      return this;
    }

    const scale = 1 / (magnitude * magnitude);

    this.x *= -scale;
    this.y *= -scale;
    this.z *= -scale;
    this.w *= scale;

    return this;
  }

  public normalise(): this {
    const magnitude = this.magnitude;

    if (magnitude < 1e-8) {
      console.error("Magnitude of vector too close to 0 to normalise");
      return this;
    }

    const inverseMagnitude = 1 / magnitude;

    this.components[0] *= inverseMagnitude;
    this.components[1] *= inverseMagnitude;
    this.components[2] *= inverseMagnitude;
    this.components[3] *= inverseMagnitude;

    return this;
  }

  public get magnitude(): number {
    return Math.hypot(
      this.components[0],
      this.components[1],
      this.components[2],
      this.components[3]
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

  public get w(): number {
    return this.components[3];
  }

  public set x(value: number) {
    this.components[0] = value;
  }

  public set y(value: number) {
    this.components[1] = value;
  }

  public set z(value: number) {
    this.components[2] = value;
  }

  public set w(value: number) {
    this.components[3] = value;
  }
}

export { Quaternion };

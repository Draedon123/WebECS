class Quaternion {
  public x: number;
  public y: number;
  public z: number;
  public w: number;

  constructor(x: number = 0, y: number = 0, z: number = 0, w: number = 1) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
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
    this.x = quaternion.x;
    this.y = quaternion.y;
    this.z = quaternion.z;
    this.w = quaternion.w;

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

    this.x *= inverseMagnitude;
    this.y *= inverseMagnitude;
    this.z *= inverseMagnitude;
    this.w *= inverseMagnitude;

    return this;
  }

  public get magnitude(): number {
    return Math.hypot(this.x, this.y, this.z, this.w);
  }
}

export { Quaternion };

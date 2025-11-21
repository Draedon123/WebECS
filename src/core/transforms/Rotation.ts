import { Matrix4, Quaternion, clamp, toDegrees, toRadians } from "../maths";

class Rotation {
  public quaternion: Quaternion;

  /** degrees */
  constructor(x: number = 0, y: number = 0, z: number = 0) {
    x = toRadians(x);
    y = toRadians(y);
    z = toRadians(z);

    const sinX = Math.sin(x / 2);
    const cosX = Math.cos(x / 2);
    const sinY = Math.sin(y / 2);
    const cosY = Math.cos(y / 2);
    const sinZ = Math.sin(z / 2);
    const cosZ = Math.cos(z / 2);

    this.quaternion = new Quaternion(
      sinX * cosY * cosZ - cosX * sinY * sinZ,
      cosX * sinY * cosZ + sinX * cosY * sinZ,
      cosX * cosY * sinZ - sinX * sinY * cosZ,
      cosX * cosY * cosZ + sinX * sinY * sinZ
    );
  }

  /** degrees */
  public getEulerAngles(): [number, number, number] {
    this.quaternion.normalise();

    const matrix = this.calculateRotationMatrix();
    let x: number;
    let z: number;

    const y = Math.asin(-clamp(matrix.components[2], -1, 1));
    if (Math.abs(matrix.components[2]) < 0.9999999) {
      x = Math.atan2(matrix.components[6], matrix.components[10]);
      z = Math.atan2(matrix.components[1], matrix.components[0]);
    } else {
      x = 0;
      z = Math.atan2(-matrix.components[4], matrix.components[5]);
    }

    return [toDegrees(x), toDegrees(y), toDegrees(z)];
  }

  /** pitch, degrees. for incrementing angle instead of setting, use `rotateX` instead to avoid gimbal lock */
  public get eulerX(): number {
    return this.getEulerAngles()[0];
  }

  /** yaw, degrees. for incrementing angle instead of setting, use `rotateY` instead to avoid gimbal lock */
  public get eulerY(): number {
    return this.getEulerAngles()[1];
  }

  /** roll, degrees. for incrementing angle instead of setting, use `rotateZ` instead to avoid gimbal lock */
  public get eulerZ(): number {
    return this.getEulerAngles()[2];
  }

  public set eulerX(degrees: number) {
    const euler = this.getEulerAngles();
    this.quaternion.copyFrom(
      new Rotation(degrees, euler[1], euler[2]).quaternion
    );
  }

  public set eulerY(degrees: number) {
    const euler = this.getEulerAngles();
    this.quaternion.copyFrom(
      new Rotation(euler[0], degrees, euler[2]).quaternion
    );
  }

  public set eulerZ(degrees: number) {
    const euler = this.getEulerAngles();
    this.quaternion.copyFrom(
      new Rotation(euler[0], euler[1], degrees).quaternion
    );
  }

  public rotateX(degrees: number) {
    this.quaternion.multiply(new Rotation(degrees, 0, 0).quaternion);
  }

  public rotateY(degrees: number) {
    this.quaternion.multiply(new Rotation(0, degrees, 0).quaternion);
  }

  public rotateZ(degrees: number) {
    this.quaternion.multiply(new Rotation(0, 0, degrees).quaternion);
  }

  public calculateRotationMatrix(): Matrix4 {
    const x = this.quaternion.x;
    const y = this.quaternion.y;
    const z = this.quaternion.z;
    const w = this.quaternion.w;

    const matrix = new Matrix4();

    matrix.components[0] = 1 - 2 * (y * y + z * z);
    matrix.components[1] = 2 * (x * y + z * w);
    matrix.components[2] = 2 * (x * z - y * w);
    matrix.components[4] = 2 * (x * y - z * w);
    matrix.components[5] = 1 - 2 * (x * x + z * z);
    matrix.components[6] = 2 * (w * x + y * z);
    matrix.components[8] = 2 * (y * w + x * z);
    matrix.components[9] = 2 * (y * z - x * w);
    matrix.components[10] = 1 - 2 * (x * x + y * y);

    return matrix;
  }
}

export { Rotation };

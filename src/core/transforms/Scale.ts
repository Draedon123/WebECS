import { Vector3 } from "../maths";

class Scale {
  public scale: Vector3;

  constructor(scale?: Vector3 | number);
  constructor(x: number, y: number, z: number);
  constructor(scale: number | Vector3 = 1, y?: number, z?: number) {
    if (typeof scale === "number") {
      if (y !== undefined) {
        scale = new Vector3(scale, y, z as number);
      } else {
        scale = new Vector3(scale, scale, scale);
      }
    }

    this.scale = scale;
  }

  public get x(): number {
    return this.scale.x;
  }

  public get y(): number {
    return this.scale.y;
  }

  public get z(): number {
    return this.scale.z;
  }

  public set x(x: number) {
    this.scale.x = x;
  }

  public set y(y: number) {
    this.scale.y = y;
  }

  public set z(z: number) {
    this.scale.z = z;
  }

  public scaleBy(factor: number): void {
    this.scale.scale(factor);
  }

  public setScale(scale: number): void {
    this.scale.x = scale;
    this.scale.y = scale;
    this.scale.z = scale;
  }
}

export { Scale };

import { Vector3 } from "../maths";

class Position {
  public position: Vector3;
  constructor(position: Vector3 = new Vector3(0, 0, 0)) {
    this.position = position;
  }

  public translate(translation: Vector3): void;
  public translate(x: number, y: number, z: number): void;
  public translate(
    translation: number | Vector3,
    y?: number,
    z?: number
  ): void {
    if (typeof translation === "number") {
      translation = new Vector3(translation, y, z);
    }

    this.position.add(translation);
  }

  public get x(): number {
    return this.position.x;
  }

  public get y(): number {
    return this.position.y;
  }

  public get z(): number {
    return this.position.z;
  }

  public set x(x: number) {
    this.position.x = x;
  }

  public set y(y: number) {
    this.position.y = y;
  }

  public set z(z: number) {
    this.position.z = z;
  }
}

export { Position };

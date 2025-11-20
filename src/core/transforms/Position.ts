import { Vector3 } from "../maths/Vector3";

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
}

export { Position };

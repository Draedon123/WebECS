import type { Vector3 } from "src/core/maths";
import { Component } from "src/ecs";

class DirectionalLight extends Component {
  public static readonly tag: string = "DirectionalLight";
  public static readonly byteLength: number = 8 * 4;

  public direction: Vector3;
  // TODO: REPLACE WITH ROTATION
  constructor(direction: Vector3) {
    super(DirectionalLight.tag);

    this.direction = direction;
  }
}

export { DirectionalLight };

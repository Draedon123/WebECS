import { Vector3 } from "src/core/maths";
import { Component } from "src/ecs";

class AmbientLight extends Component {
  public static readonly tag: string = "AmbientLight";
  public static readonly byteLength: number = 4 * 4;

  public colour: Vector3;
  public ambientStrength: number;
  /**
   * @param { Vector3 } colour 0-255
   * @param { number } ambientStrength 0-1
   */
  constructor(colour: Vector3, ambientStrength: number) {
    super(AmbientLight.tag);

    this.colour = colour;
    this.ambientStrength = ambientStrength;
  }
}

export { AmbientLight };

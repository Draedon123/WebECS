import type { Vector3 } from "src/core/maths";
import { Component } from "src/ecs";

class Light extends Component {
  public static readonly tag: string = "Light";

  /** 0-255 */
  public colour: Vector3;
  public intensity: number;
  /**
   * @param { Vector3 } colour 0-255
   * @param { number } intensity
   */
  constructor(colour: Vector3, intensity: number) {
    super(Light.tag);

    this.colour = colour;
    this.intensity = intensity;
  }
}

export { Light };

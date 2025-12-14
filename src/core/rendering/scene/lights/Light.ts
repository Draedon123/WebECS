import { Vector3 } from "src/core/maths";
import { Component } from "src/ecs";

type LightSettings = {
  /** 0-255 */
  colour: Vector3;
  /** 0-1 */
  intensity: number;
};

class Light extends Component {
  public static readonly tag: string = "Light";

  /** 0-255 */
  public colour: Vector3;
  public intensity: number;

  constructor(settings: Partial<LightSettings> = {}) {
    super(Light.tag);

    this.colour = settings.colour ?? new Vector3(255, 255, 255);
    this.intensity = settings.intensity ?? 1;
  }
}

export { Light };

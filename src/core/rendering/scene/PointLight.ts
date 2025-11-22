import { Component } from "src/ecs";

class PointLight extends Component {
  public static readonly tag: string = "PointLight";
  public static readonly byteLength: number = 12 * 4;

  // https://lisyarus.github.io/blog/posts/point-light-attenuation.html
  public maxDistance: number;
  public decayRate: number;
  constructor(maxDistance: number, decayRate: number) {
    super(PointLight.tag);

    this.maxDistance = maxDistance;
    this.decayRate = decayRate;
  }
}

export { PointLight };

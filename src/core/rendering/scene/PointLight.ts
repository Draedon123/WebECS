import { Component } from "src/ecs";

class PointLight extends Component {
  public static readonly tag: string = "PointLight";
  public static readonly byteLength: number = (4 + 3 + 1) * 4;

  constructor() {
    super(PointLight.tag);
  }
}

export { PointLight };

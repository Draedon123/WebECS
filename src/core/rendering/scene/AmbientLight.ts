import { Component } from "src/ecs";

class AmbientLight extends Component {
  public static readonly tag: string = "AmbientLight";
  public static readonly byteLength: number = 4 * 4;

  constructor() {
    super(AmbientLight.tag);
  }
}

export { AmbientLight };

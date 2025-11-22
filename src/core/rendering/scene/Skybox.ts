import { Component } from "src/ecs";

class Skybox extends Component {
  public static readonly tag: "Skybox";

  constructor() {
    super(Skybox.tag);
  }
}

export { Skybox };

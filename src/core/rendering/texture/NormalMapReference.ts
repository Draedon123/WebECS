import { Component } from "src/ecs";

class NormalMapReference extends Component {
  public static readonly tag: string = "NormalMapReference";

  public textureKey: string;
  constructor(textureKey: string) {
    super(NormalMapReference.tag);

    this.textureKey = textureKey;
  }
}

export { NormalMapReference };

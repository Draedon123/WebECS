import { Component } from "src/ecs";

class MeshReference extends Component {
  public static readonly tag: string = "MeshReference";

  public meshKey: string;
  constructor(meshKey: string) {
    super(MeshReference.tag);

    this.meshKey = meshKey;
  }
}

export { MeshReference };

import { Component } from "src/ecs";
import type { Material } from "src/core/managers/IndividualMaterialManager";

class MaterialReference extends Component {
  public static readonly tag: string = "MaterialReference";

  public activeMaterial: Material;
  constructor(activeMaterial: Material) {
    super(MaterialReference.tag);

    this.activeMaterial = activeMaterial;
  }
}

export { MaterialReference };

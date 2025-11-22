import { Component } from "./Component";
import type { Entity } from "./EntityManager";

class Parent extends Component {
  public static readonly tag: string = "Parent";

  public parent: Entity | null;
  constructor(parent: Entity | null = null) {
    super(Parent.tag);

    this.parent = parent;
  }
}

export { Parent };

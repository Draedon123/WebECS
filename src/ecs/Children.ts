import { Component } from "./Component";
import type { Entity } from "./EntityManager";

class Children extends Component {
  public static readonly tag: string = "Children";

  public children: Entity[];
  constructor(children: Entity[] = []) {
    super(Children.tag);

    this.children = children;
  }
}

export { Children };

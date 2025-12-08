abstract class Component {
  private static nextId: number = 0;

  public readonly tag: string;
  public readonly id: number;

  constructor(tag: string) {
    this.tag = tag;
    this.id = Component.nextId++;
  }
}

type ComponentConstructor = {
  new (...args: any[]): Component;
  readonly tag: string;
};

export { Component, type ComponentConstructor };

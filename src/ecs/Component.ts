abstract class Component {
  public readonly tag: string;

  constructor(tag: string) {
    this.tag = tag;
  }
}

type ComponentConstructor = {
  new (...args: any[]): Component;
  readonly tag: string;
};

export { Component, type ComponentConstructor };

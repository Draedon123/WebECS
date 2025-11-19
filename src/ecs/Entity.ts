abstract class Entity {
  private static nextId: number;

  public readonly id: number;
  constructor() {
    this.id = Entity.nextId++;
  }
}

export { Entity };

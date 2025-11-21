import type { Model } from "./Model";

class Scene {
  public objects: Model[];

  constructor() {
    this.objects = [];
  }

  public addObjects(...objects: Model[]): void {
    for (const object of objects) {
      this.objects.push(object);
    }
  }
}

export { Scene };

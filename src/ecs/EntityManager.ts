import type { Component, ComponentConstructor } from "./Component";

type Entity = number;

type SingularQuery =
  | {
      type: "union" | "intersection";
      components: (string | ComponentConstructor)[];
    }
  | {
      type: "singleMatch";
      component: string | ComponentConstructor;
    };

type MultiQuery = {
  type: "union" | "intersection";
  queries: SingularQuery[];
};

class EntityManager {
  private static instance: EntityManager | null;

  private readonly entityComponentMap: Map<Entity, Component[]>;
  private readonly componentEntityMap: Map<string, Entity[]>;

  private nextId: number;
  private readonly freeIds: Entity[];

  private constructor() {
    this.entityComponentMap = new Map();
    this.componentEntityMap = new Map();

    this.nextId = 0;
    this.freeIds = [];
  }

  public static getInstance(): EntityManager {
    if (EntityManager.instance === null) {
      EntityManager.instance = new EntityManager();
    }

    return EntityManager.instance;
  }

  public queryMultiple(query: MultiQuery): Entity[] {
    const candidates = query.queries.map(this.querySingular);

    switch (query.type) {
      case "union": {
        return union(candidates);
      }
      case "intersection": {
        return intersection(candidates);
      }
    }
  }

  public querySingular(query: SingularQuery): Entity[] {
    const tags =
      "components" in query
        ? query.components.map((component) =>
            typeof component === "string" ? component : component.tag
          )
        : [
            typeof query.component === "string"
              ? query.component
              : query.component.tag,
          ];

    const candidates = tags.map(
      (tag) => this.componentEntityMap.get(tag) ?? []
    );

    switch (query.type) {
      case "union": {
        return union(candidates);
      }

      case "intersection": {
        return intersection(candidates);
      }

      case "singleMatch": {
        return candidates[0];
      }
    }
  }

  public createEntity(): Entity {
    const entity =
      this.freeIds.length > 0 ? (this.freeIds.pop() as Entity) : this.nextId++;

    this.entityComponentMap.set(entity, []);

    return entity;
  }

  public destroyEntity(entity: Entity): void {
    const components = this.entityComponentMap.get(entity);

    if (components === undefined) {
      console.error(`Entity ${entity} does not exist`);
      return;
    }

    this.entityComponentMap.delete(entity);

    for (const component of components) {
      const map = this.componentEntityMap.get(component.tag) as Entity[];

      map.splice(map.indexOf(entity), 1);
    }
  }

  public addComponent(entity: Entity, component: Component): void {
    const components = this.entityComponentMap.get(entity);

    if (components === undefined) {
      console.error(`Entity ${entity} does not exist`);
      return;
    }

    components.push(component);

    const newComponentMap = this.componentEntityMap.get(component.tag) ?? [];
    newComponentMap.push(entity);

    this.componentEntityMap.set(component.tag, newComponentMap);
  }

  public getComponent<T extends Component = Component>(
    entity: Entity,
    componentTag: string
  ): T | null {
    const components = this.entityComponentMap.get(entity);

    if (components === undefined) {
      console.error(`Entity ${entity} does not exist`);
      return null;
    }

    const component =
      components.find((component) => component.tag === componentTag) ?? null;

    return component as T | null;
  }
}

function union<T>(array: T[][]): T[] {
  const seen: Map<T, true> = new Map();

  // remove duplicates
  return array
    .flat()
    .filter((element) =>
      seen.has(element) ? false : (seen.set(element, true), true)
    );
}

function intersection<T>(array: T[][]): T[] {
  const flattened = array.flat();
  const count: Map<T, number> = new Map();
  for (const element of flattened) {
    if (!count.has(element)) {
      count.set(element, 1);
    } else {
      count.set(element, (count.get(element) as number) + 1);
    }
  }

  return flattened.filter(
    (element) => (count.get(element) as number) === array.length
  );
}

export { EntityManager, type Entity };

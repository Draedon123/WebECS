import { EntityManager, type Entity } from "src/ecs";
import { IndexArray, MeshReference, VertexArray, type Vertex } from "../meshes";
import { type Renderer } from "../rendering";
import { Children } from "src/ecs/Children";
import { Parent } from "src/ecs/Parent";
import { loadObj } from "../meshes/loaders/obj";
import { initialiseMesh } from "../meshes/initialiseMesh";
import { TextureManager } from "./TextureManager";
import { TransformBindings } from "./TransformBindings";
import { MaterialsManager } from "./MaterialsManager";
import type { Material } from "./IndividualMaterialManager";
import { MaterialReference } from "../rendering/materials/MaterialReference";

type MeshEntry = {
  vertices: VertexArray;
  indices?: IndexArray;
};

type ModelEntry = {
  meshReference: string;
  material: Material;
}[];

type ModelType = "obj";

class ResourceManager {
  public readonly textures: TextureManager;
  public readonly materials: MaterialsManager;
  private readonly meshes: Map<string, MeshEntry>;
  private readonly models: Map<string, ModelEntry>;

  // private readonly renderer: Renderer;
  private readonly device: GPUDevice;
  public readonly transformBindings: TransformBindings;

  constructor(renderer: Renderer, device: GPUDevice, maxObjects: number) {
    this.transformBindings = new TransformBindings(
      renderer,
      device,
      maxObjects
    );

    this.textures = new TextureManager(device);
    this.materials = new MaterialsManager(renderer, device);
    this.meshes = new Map();
    this.models = new Map();

    // this.renderer = renderer;
    this.device = device;
  }

  public addMesh(key: string, mesh: MeshEntry): void;
  public addMesh(key: string, vertices: Vertex[], indices?: number[]): void;
  public addMesh(
    key: string,
    verticesOrMesh: Vertex[] | MeshEntry,
    indices?: number[]
  ): void {
    const existingMesh = this.meshes.get(key);
    if (existingMesh) {
      existingMesh.vertices.destroy();
      existingMesh.indices?.destroy();
    }

    const mesh: MeshEntry =
      verticesOrMesh instanceof Array
        ? {
            vertices: new VertexArray(verticesOrMesh, key + " Vertex Array"),
            indices: indices
              ? new IndexArray(indices, key + " Index Array")
              : undefined,
          }
        : verticesOrMesh;

    initialiseMesh(this.device, mesh.vertices, mesh.indices);
    this.meshes.set(key, mesh);
  }

  public getMesh(key: string): MeshEntry | null {
    return this.meshes.get(key) ?? null;
  }

  public deleteMesh(key: string): boolean {
    const mesh = this.getMesh(key);

    if (mesh === null) {
      return false;
    }

    this.meshes.delete(key);
    mesh.vertices.destroy();
    mesh.indices?.destroy();

    return true;
  }

  public async loadModel(
    modelPath: string,
    modelKey: string,
    type: ModelType
  ): Promise<void> {
    const start = performance.now();

    switch (type) {
      case "obj": {
        const model = await loadObj(modelPath);

        for (const texture of Object.values(model.textures)) {
          this.textures.add(texture.name, texture.texture);
        }

        for (let i = 0; i < model.meshes.length; i++) {
          const mesh = model.meshes[i];
          this.addMesh(mesh.name, mesh);
        }

        this.models.set(
          modelKey,
          Object.values(model.meshes).map((mesh) => {
            return {
              meshReference: mesh.name,
              material: model.materials[mesh.materialName],
            };
          })
        );

        break;
      }

      default: {
        console.error(`Unsupported model type ${type}`);
        break;
      }
    }

    const end = performance.now();
    const elapsed_ms = end - start;

    console.debug(
      `Took ${elapsed_ms.toFixed(2)}ms to load the model "${modelKey}"`
    );
  }

  public getModel(key: string): ModelEntry | null {
    return this.models.get(key) ?? null;
  }

  public deleteModel(
    key: string,
    deleteOptions: Partial<{ mesh: boolean; textures: boolean }> = {}
  ): boolean {
    const model = this.getModel(key);

    if (model === null) {
      return false;
    }

    for (const mesh of model) {
      if (deleteOptions?.mesh) {
        this.deleteMesh(mesh.meshReference);
      }

      // TODO:
      // if (deleteOptions?.textures) {
      //   if (mesh.textureReference) {
      //     this.textures.delete(mesh.textureReference);
      //   }

      //   if (mesh.normalMapReference) {
      //     this.textures.delete(mesh.normalMapReference);
      //   }
      // }
    }

    return true;
  }

  public spawnModel(modelKey: string): Entity {
    const model = this.getModel(modelKey);

    if (model === null) {
      throw new Error(`Model with key ${modelKey} not found`);
    }

    const entityManager = EntityManager.getInstance();
    const children = new Children();
    const modelEntity = entityManager.createEntity(children);

    for (const object of model) {
      const meshReference = new MeshReference(object.meshReference);
      const parent = new Parent(modelEntity);

      const child = entityManager.createEntity(
        meshReference,
        parent,
        new MaterialReference(object.material)
      );

      children.children.push(child);
    }

    return modelEntity;
  }
}

export { ResourceManager };
export type { MeshEntry };

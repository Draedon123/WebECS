import { EntityManager, type Entity } from "src/ecs";
import { IndexArray, MeshReference, VertexArray, type Vertex } from "./meshes";
import {
  NormalMapReference,
  Texture,
  TextureReference,
  type Renderer,
} from "./rendering";
import { Children } from "src/ecs/Children";
import { Parent } from "src/ecs/Parent";
import { loadObj } from "./meshes/loaders/obj";
import { initialiseMesh } from "./meshes/initialiseMesh";
import { TextureManager } from "./TextureManager";
import { TransformBindings } from "./TransformBindings";

type MeshEntry = {
  vertices: VertexArray;
  indices?: IndexArray;
};

type ModelEntry = {
  meshReference: string;
  textureReference?: string;
  normalMapReference?: string;
}[];

type ModelType = "obj";

class ResourceManager {
  private readonly textureManager: TextureManager;
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
    this.textureManager = new TextureManager(renderer, device);
    this.meshes = new Map();
    this.models = new Map();

    // this.renderer = renderer;
    this.device = device;
  }

  public addTexture(key: string, texture: Texture): void {
    this.textureManager.addTexture(key, texture);
  }

  public getTexture(key: string): Texture | null {
    return this.textureManager.getTexture(key);
  }

  public deleteTexture(key: string): boolean {
    return this.textureManager.deleteTexture(key);
  }

  public getTextureBindGroup(
    texture?: Texture,
    normalMap?: Texture
  ): GPUBindGroup {
    return this.textureManager.getTextureBindGroup(texture, normalMap);
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
            vertices: new VertexArray(verticesOrMesh),
            indices: indices ? new IndexArray(indices) : undefined,
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
    switch (type) {
      case "obj": {
        const model = await loadObj(modelPath);

        for (const texture of Object.values(model.textures)) {
          this.addTexture(texture.name, texture.texture);
        }

        for (let i = 0; i < model.meshes.length; i++) {
          const mesh = model.meshes[i];
          this.addMesh(mesh.name, mesh);
        }

        this.models.set(
          modelKey,
          Object.values(model.meshes).map((mesh) => {
            const texture = model.materials[mesh.materialName].texture;
            const normalMap = model.materials[mesh.materialName].normalMap;

            return {
              meshReference: mesh.name,
              textureReference: texture
                ? model.textures[texture].name
                : undefined,
              normalMapReference: normalMap
                ? model.textures[normalMap].name
                : undefined,
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

      if (deleteOptions?.textures) {
        if (mesh.textureReference) {
          this.deleteTexture(mesh.textureReference);
        }

        if (mesh.normalMapReference) {
          this.deleteTexture(mesh.normalMapReference);
        }
      }
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

    for (const mesh of model) {
      const meshReference = new MeshReference(mesh.meshReference);
      const parent = new Parent(modelEntity);

      const child = entityManager.createEntity(meshReference, parent);

      if (mesh.textureReference) {
        entityManager.addComponent(
          child,
          new TextureReference(mesh.textureReference)
        );
      }

      if (mesh.normalMapReference) {
        entityManager.addComponent(
          child,
          new NormalMapReference(mesh.normalMapReference)
        );
      }

      children.children.push(child);
    }

    return modelEntity;
  }
}

export { ResourceManager };
export type { MeshEntry };

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
import { roundUp } from "./maths";
import { loadObj } from "./meshes/loaders/obj";
import { initialiseMesh } from "./meshes/initialiseMesh";

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
  public static readonly DEFAULT_TEXTURE_KEY: string = "default";

  private readonly textures: Map<string, Texture>;
  private readonly meshes: Map<string, MeshEntry>;
  private readonly models: Map<string, ModelEntry>;
  private readonly textureBindGroups: Map<string, GPUBindGroup>;
  private readonly textureToBindGroupsMap: Map<Texture, string[]>;

  private readonly renderer: Renderer;
  private readonly device: GPUDevice;

  public readonly transformsBindGroup: GPUBindGroup;
  public readonly transformsBuffer: GPUBuffer;
  public readonly transformByteLength: number;
  public readonly transformsPadding: number;

  constructor(renderer: Renderer, device: GPUDevice, maxObjects: number) {
    this.textures = new Map();
    this.meshes = new Map();
    this.models = new Map();
    this.textureBindGroups = new Map();
    this.textureToBindGroupsMap = new Map();

    this.renderer = renderer;
    this.device = device;

    this.transformByteLength = (16 + 12 + 4) * 4;
    const actualByteLength = roundUp(
      this.transformByteLength,
      device.limits.minUniformBufferOffsetAlignment
    );
    this.transformsPadding = actualByteLength - this.transformByteLength;

    this.transformsBuffer = device.createBuffer({
      label: "Transforms Buffer",
      size: actualByteLength * maxObjects,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.transformsBindGroup = device.createBindGroup({
      label: "Transforms Bind Group",
      layout: renderer.perObjectBindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: {
            buffer: this.transformsBuffer,
            size: this.transformByteLength + this.transformsPadding,
          },
        },
      ],
    });

    const defaultTexture = Texture.colour(255, 255, 255);
    defaultTexture.initialise(device);
    this.addTexture(ResourceManager.DEFAULT_TEXTURE_KEY, defaultTexture);
  }

  public addTexture(key: string, texture: Texture): void {
    this.getTexture(key)?.destroy();
    texture.initialise(this.device);
    this.textures.set(key, texture);
  }

  public getTexture(key: string): Texture | null {
    return this.textures.get(key) ?? null;
  }

  public deleteTexture(key: string): boolean {
    const texture = this.getTexture(key);

    if (texture === null) {
      return false;
    }

    texture.destroy();
    this.textures.delete(key);
    const bindGroups = this.textureToBindGroupsMap.get(texture) as string[];

    for (const key of bindGroups) {
      this.textureBindGroups.delete(key);
    }

    return true;
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

  public getTextureBindGroup(
    texture?: Texture,
    normalMap?: Texture
  ): GPUBindGroup {
    const key = this.getTextureBindGroupsKey(texture, normalMap);
    const existingBindGroup = this.textureBindGroups.get(key);

    if (existingBindGroup) {
      return existingBindGroup;
    }

    const bindGroup = this.createTextureBindGroup(
      // default texture is guaranteed to be defined
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      texture ?? this.getTexture(ResourceManager.DEFAULT_TEXTURE_KEY)!,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      normalMap ?? this.getTexture(ResourceManager.DEFAULT_TEXTURE_KEY)!
    );

    this.textureBindGroups.set(key, bindGroup);

    if (texture) {
      const textureBindGroups = this.textureToBindGroupsMap.get(texture) ?? [];
      textureBindGroups.push(key);
      this.textureToBindGroupsMap.set(texture, textureBindGroups);
    }

    if (normalMap) {
      const textureBindGroups =
        this.textureToBindGroupsMap.get(normalMap) ?? [];
      textureBindGroups.push(key);
      this.textureToBindGroupsMap.set(normalMap, textureBindGroups);
    }

    return bindGroup;
  }

  private createTextureBindGroup(
    texture: Texture,
    normalMap: Texture
  ): GPUBindGroup {
    return this.device.createBindGroup({
      layout: this.renderer.texureBindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: texture.texture.createView(),
        },
        {
          binding: 1,
          resource: normalMap.texture.createView(),
        },
      ],
    });
  }

  private getTextureBindGroupsKey(
    texture?: Texture,
    normalMap?: Texture
  ): string {
    return `${texture?.id ?? -1},${normalMap?.id ?? -1}`;
  }
}

export { ResourceManager };
export type { MeshEntry };

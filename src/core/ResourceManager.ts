import { EntityManager, type Entity } from "src/ecs";
import { IndexArray, MeshReference, VertexArray, type Vertex } from "./meshes";
import { Texture, TextureReference, type Renderer } from "./rendering";
import { Children } from "src/ecs/Children";
import { Parent } from "src/ecs/Parent";
import { roundUp } from "./maths";
import { loadObj } from "./meshes/loaders/obj";

type TextureEntry = {
  texture: Texture;
  bindGroup: GPUBindGroup;
};

type MeshEntry = {
  vertices: VertexArray;
  indices?: IndexArray;
};

type ModelEntry = {
  meshReference: string;
  textureReference: string;
}[];

type ModelType = "obj";

class ResourceManager {
  public static readonly DEFAULT_TEXTURE_KEY: string = "default";

  private readonly textures: Record<string, TextureEntry>;
  private readonly meshes: Record<string, MeshEntry>;
  private readonly models: Record<string, ModelEntry>;

  private readonly renderer: Renderer;
  private readonly device: GPUDevice;

  public readonly transformsBuffer: GPUBuffer;
  public readonly transformByteLength: number;
  public readonly transformsPadding: number;

  constructor(renderer: Renderer, device: GPUDevice, maxObjects: number) {
    this.textures = {};
    this.meshes = {};
    this.models = {};

    this.renderer = renderer;
    this.device = device;

    this.transformByteLength = (16 + 12) * 4;
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

    const defaultTexture = Texture.colour(255, 255, 255);
    defaultTexture.initialise(device);
    this.addTexture(ResourceManager.DEFAULT_TEXTURE_KEY, defaultTexture);
  }

  public addTexture(key: string, texture: Texture): void {
    if (key in this.textures) {
      this.textures[key].texture?.texture.destroy();
    }

    texture.initialise(this.device);

    if (texture.texture.depthOrArrayLayers === 1) {
      this.textures[key] = {
        texture,
        bindGroup: this.device.createBindGroup({
          layout: this.renderer.perObjectBindGroupLayout,
          entries: [
            {
              binding: 0,
              resource: {
                buffer: this.transformsBuffer,
                size: this.transformByteLength + this.transformsPadding,
              },
            },
            {
              binding: 1,
              resource: texture.texture.createView(),
            },
          ],
        }),
      };
    } else {
      // @ts-expect-error duct-tape fix. will fix later
      this.textures[key] = { texture };
    }
  }

  public getTexture(key: string): TextureEntry | null {
    return this.textures[key] ?? null;
  }

  public addMesh(key: string, mesh: MeshEntry): void;
  public addMesh(key: string, vertices: Vertex[], indices?: number[]): void;
  public addMesh(
    key: string,
    verticesOrMesh: Vertex[] | MeshEntry,
    indices?: number[]
  ): void {
    if (key in this.meshes) {
      this.meshes[key].vertices.vertexBuffer?.destroy();
      this.meshes[key]?.indices?.indexBuffer?.destroy();
    }

    const mesh: MeshEntry =
      verticesOrMesh instanceof Array
        ? {
            vertices: new VertexArray(verticesOrMesh),
            indices: indices ? new IndexArray(indices) : undefined,
          }
        : verticesOrMesh;

    mesh.vertices.initialise(this.device);
    mesh.indices?.initialise(this.device);
    this.meshes[key] = mesh;
  }

  public getMesh(key: string): MeshEntry | null {
    return this.meshes[key] ?? null;
  }

  public async loadModel(
    modelPath: string,
    modelKey: string,
    type: ModelType
  ): Promise<void> {
    switch (type) {
      case "obj": {
        const model = await loadObj(modelPath);

        for (const material of Object.values(model.materials)) {
          this.addTexture(material.name, material.texture);
        }

        for (let i = 0; i < model.meshes.length; i++) {
          const mesh = model.meshes[i];
          this.addMesh(mesh.name, mesh);
        }

        this.models[modelKey] = Object.values(model.meshes).map((mesh) => ({
          meshReference: mesh.name,
          textureReference: mesh.materialName,
        }));

        break;
      }

      default: {
        console.error(`Unsupported model type ${type}`);
        break;
      }
    }
  }

  public getModel(modelKey: string): ModelEntry | null {
    return this.models[modelKey] ?? null;
  }

  public spawnModel(modelKey: string): Entity {
    if (!(modelKey in this.models)) {
      throw new Error(`Model with key ${modelKey} not found`);
    }

    const entityManager = EntityManager.getInstance();
    const model = this.models[modelKey];
    const children = new Children();
    const modelEntity = entityManager.createEntity(children);

    for (const mesh of model) {
      const meshReference = new MeshReference(mesh.meshReference);
      const textureReference = new TextureReference(mesh.textureReference);
      const parent = new Parent(modelEntity);

      const child = entityManager.createEntity(
        meshReference,
        textureReference,
        parent
      );

      children.children.push(child);
    }

    return modelEntity;
  }
}

export { ResourceManager };
export type { TextureEntry, MeshEntry };

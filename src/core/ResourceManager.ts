import type { Entity } from "src/ecs";
import type { IndexArray, VertexArray } from "./meshes";
import type { Renderer, Texture } from "./rendering";

type TextureEntry = {
  texture: Texture;
};

type MeshEntry = {
  vertices: VertexArray;
  indices?: IndexArray;
};

type ObjectData = {
  bindGroup: GPUBindGroup;
  transformBuffer: GPUBuffer;
};

class ResourceManager {
  private readonly textures: Record<string, TextureEntry>;
  private readonly meshes: Record<string, MeshEntry>;

  private readonly objectData: Record<Entity, ObjectData>;

  private readonly renderer: Renderer;
  private readonly device: GPUDevice;

  constructor(renderer: Renderer, device: GPUDevice) {
    this.textures = {};
    this.meshes = {};
    this.objectData = {};

    this.renderer = renderer;
    this.device = device;
  }

  public addTexture(key: string, texture: TextureEntry): void {
    if (key in this.textures) {
      this.textures[key].texture?.texture.destroy();
    }

    this.textures[key] = texture;
  }

  public getTexture(key: string): TextureEntry | null {
    return this.textures[key] ?? null;
  }

  public addMesh(key: string, mesh: MeshEntry): void {
    if (key in this.meshes) {
      this.meshes[key].vertices.vertexBuffer?.destroy();
      this.meshes[key]?.indices?.indexBuffer?.destroy();
    }

    mesh.vertices.initialise(this.device);
    mesh.indices?.initialise(this.device);
    this.meshes[key] = mesh;
  }

  public getMesh(key: string): MeshEntry | null {
    return this.meshes[key] ?? null;
  }

  public addObject(object: Entity, textureKey: string): void {
    if (object in this.objectData) {
      this.objectData[object].transformBuffer?.destroy();
    }

    const texture = this.getTexture(textureKey);

    if (texture === null) {
      console.error(`Could not find texture with key ${textureKey}`);
      return;
    }

    texture.texture.initialise(this.device);

    const transformBuffer = this.device.createBuffer({
      size: (16 + 12) * 4,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const bindGroup = this.device.createBindGroup({
      layout: this.renderer.perObjectBindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: transformBuffer,
        },
        {
          binding: 1,
          resource: texture.texture.texture.createView(),
        },
      ],
    });

    this.objectData[object] = {
      transformBuffer,
      bindGroup,
    };
  }

  public getObject(object: Entity): ObjectData | null {
    return this.objectData[object] ?? null;
  }
}

export { ResourceManager };

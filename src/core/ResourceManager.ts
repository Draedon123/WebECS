import type { IndexArray, VertexArray } from "./meshes";
import type { Renderer, Texture } from "./rendering";

type TextureEntry = {
  texture: Texture;
  bindGroup: GPUBindGroup;
};

type MeshEntry = {
  vertices: VertexArray;
  indices?: IndexArray;
};

class ResourceManager {
  private readonly textures: Record<string, TextureEntry>;
  private readonly meshes: Record<string, MeshEntry>;

  private readonly renderer: Renderer;
  private readonly device: GPUDevice;

  public readonly transformsBuffer: GPUBuffer;
  public readonly transformByteLength: number;
  public readonly transformsPadding: number;

  constructor(renderer: Renderer, device: GPUDevice, maxObjects: number) {
    this.textures = {};
    this.meshes = {};

    this.renderer = renderer;
    this.device = device;

    this.transformByteLength = (16 + 12) * 4;
    const actualByteLength =
      this.transformByteLength +
      device.limits.minUniformBufferOffsetAlignment -
      (this.transformByteLength %
        device.limits.minUniformBufferOffsetAlignment);
    this.transformsPadding = actualByteLength - this.transformByteLength;

    this.transformsBuffer = device.createBuffer({
      label: "Transforms Buffer",
      size: actualByteLength * maxObjects,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
  }

  public addTexture(key: string, texture: Texture): void {
    if (key in this.textures) {
      this.textures[key].texture?.texture.destroy();
    }

    texture.initialise(this.device);

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
}

export { ResourceManager };

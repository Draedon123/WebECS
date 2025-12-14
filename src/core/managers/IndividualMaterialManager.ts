import type { Component } from "src/ecs";
import type { Renderer } from "../rendering";
import type { Shader } from "../rendering/Shader";
import { BufferWriter } from "../gpu/BufferWriter";
import { UniqueArray } from "../utils/UniqueArray";

type Material = Component & {
  writeToBuffer(bufferWriter: BufferWriter): void;
};

type MaterialBindGroupCreator<T extends Material> = (
  material: T,
  device: GPUDevice
) => GPUBindGroup;
type MaterialHasher<T extends Material> = (material: T) => string;

class IndividualMaterialManager<T extends Material> {
  public static readonly MAX_MATERIALS: number = 128;

  public readonly renderPipeline: GPURenderPipeline;
  public readonly materialsBuffer: GPUBuffer;

  private readonly materials: UniqueArray<T>;
  private readonly bindGroups: Map<string, GPUBindGroup>;
  private readonly device: GPUDevice;
  private readonly createBindGroup: MaterialBindGroupCreator<T>;
  private readonly hashMaterial: MaterialHasher<T>;
  private readonly materialByteLength: number;

  constructor(
    renderer: Renderer,
    device: GPUDevice,
    materialByteLength: number,
    bindGroupLayout: GPUBindGroupLayout,
    shader: Shader,
    createBindGroup: MaterialBindGroupCreator<T>,
    hashMaterial: MaterialHasher<T>
  ) {
    this.bindGroups = new Map();
    this.materials = new UniqueArray();
    this.materialByteLength = materialByteLength;

    this.device = device;
    this.createBindGroup = createBindGroup;
    this.hashMaterial = hashMaterial;

    this.materialsBuffer = device.createBuffer({
      label: "Materials Buffer",
      size: this.bufferByteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    const renderPipelineLayout = device.createPipelineLayout({
      label: "Material Render Pipeline Layout",
      bindGroupLayouts: [
        renderer.bindGroup0Layout,
        renderer.perObjectBindGroupLayout,
        bindGroupLayout,
      ],
    });

    this.renderPipeline = device.createRenderPipeline({
      label: "Renderer Render Pipeline",
      layout: renderPipelineLayout,
      vertex: {
        module: shader.shader,
        entryPoint: "vertexMain",
        buffers: [
          {
            arrayStride: (3 + 2 + 3 + 4) * 4,
            attributes: [
              // position
              {
                shaderLocation: 0,
                format: "float32x3",
                offset: 0,
              },
              // uv
              {
                shaderLocation: 1,
                format: "float32x2",
                offset: 3 * 4,
              },
              // normal
              {
                shaderLocation: 2,
                format: "float32x3",
                offset: (3 + 2) * 4,
              },
              // tangent
              {
                shaderLocation: 3,
                format: "float32x4",
                offset: (3 + 2 + 3) * 4,
              },
            ],
          },
        ],
      },
      fragment: {
        module: shader.shader,
        entryPoint: "fragmentMain",
        targets: [
          {
            format: renderer.canvasFormat,
          },
        ],
      },
      primitive: {
        cullMode: "back",
      },
      depthStencil: {
        format: "depth24plus",
        depthCompare: "less",
        depthWriteEnabled: true,
      },
    });
  }

  public getBindGroup(material: T): GPUBindGroup {
    const hash = this.hashMaterial(material);
    const existingBindGroup = this.bindGroups.get(hash);

    if (existingBindGroup !== undefined) {
      this.materials.add(material);
      this.updateBuffer();

      return existingBindGroup;
    }

    const bindGroup = this.createBindGroup(material, this.device);

    this.bindGroups.set(hash, bindGroup);
    return bindGroup;
  }

  public getMaterialIndex(material: T): number {
    return this.materials.indexOf(material);
  }

  public updateBuffer(): void {
    const bufferWriter = new BufferWriter(
      this.materials.size * this.materialByteLength
    );

    for (const material of this.materials) {
      material.writeToBuffer(bufferWriter);
    }

    this.device.queue.writeBuffer(this.materialsBuffer, 0, bufferWriter.buffer);
  }

  private get bufferByteLength(): number {
    return IndividualMaterialManager.MAX_MATERIALS * this.materialByteLength;
  }
}

export { IndividualMaterialManager };
export type { MaterialBindGroupCreator, MaterialHasher, Material };

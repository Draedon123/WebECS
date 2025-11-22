import { EntityManager } from "src/ecs";
import { Matrix4 } from "../maths";
import { Shader } from "./Shader";
import { Texture } from "./Texture";
import { TextureReference } from "./TextureReference";
import type { ResourceManager } from "../ResourceManager";
import { Skybox } from "./scene";

class SkyboxRenderer {
  private readonly inversePespectiveViewMatrix: GPUBuffer;
  private readonly bindGroups: WeakMap<Texture, GPUBindGroup>;
  private readonly device: GPUDevice;
  private renderBindGroupLayout!: GPUBindGroupLayout;
  private renderPipeline!: GPURenderPipeline;

  public sampler!: GPUSampler;
  constructor(
    device: GPUDevice,
    shader: Shader,
    canvasFormat: GPUTextureFormat
  ) {
    this.device = device;
    this.bindGroups = new WeakMap();
    this.inversePespectiveViewMatrix = device.createBuffer({
      label: "Inverse Perspective View Matrix",
      size: 16 * 4,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.sampler = this.device.createSampler({
      label: "Skybox Sampler",
      minFilter: "linear",
      magFilter: "linear",
    });

    this.renderBindGroupLayout = this.device.createBindGroupLayout({
      label: "Skybox Bind Group Layout",
      entries: [
        {
          binding: 0,
          sampler: {},
          visibility: GPUShaderStage.FRAGMENT,
        },
        {
          binding: 1,
          texture: {
            viewDimension: "cube",
          },
          visibility: GPUShaderStage.FRAGMENT,
        },
        {
          binding: 2,
          buffer: {},
          visibility: GPUShaderStage.FRAGMENT,
        },
      ],
    });

    const renderPipelineLayout = this.device.createPipelineLayout({
      label: "Skybox Render Pipeline Layout",
      bindGroupLayouts: [this.renderBindGroupLayout],
    });

    this.renderPipeline = this.device.createRenderPipeline({
      label: "Skybox Render Pipeline",
      layout: renderPipelineLayout,
      vertex: {
        module: shader.shader,
        entryPoint: "vertexMain",
      },
      fragment: {
        module: shader.shader,
        entryPoint: "fragmentMain",
        targets: [{ format: canvasFormat }],
      },
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: "less-equal",
        format: "depth24plus",
      },
    });
  }

  public static async create(
    device: GPUDevice,
    canvasFormat: GPUTextureFormat
  ): Promise<SkyboxRenderer> {
    const shader = await Shader.fetch(
      import.meta.env.BASE_URL + "/skybox.wgsl",
      "Skybox Shader Module"
    );

    shader.initialise(device);

    return new SkyboxRenderer(device, shader, canvasFormat);
  }

  public render(
    resourceManager: ResourceManager,
    renderPass: GPURenderPassEncoder,
    perspectiveViewMatrix: Matrix4
  ): void {
    const entityManager = EntityManager.getInstance();
    const skybox = entityManager.querySingular({
      type: "intersection",
      components: [Skybox, TextureReference],
    })[0];

    if (!skybox) {
      return;
    }

    const textureReference =
      EntityManager.getInstance().getComponent<TextureReference>(
        skybox,
        "TextureReference"
      ) as TextureReference;

    const texture = resourceManager.getTexture(
      textureReference.textureKey
    )?.texture;

    if (!texture) {
      console.error(`No texture with key ${textureReference.textureKey} found`);
      return;
    }

    if (!this.bindGroups.has(texture)) {
      const renderBindGroup = this.device.createBindGroup({
        label: `Skybox ${textureReference.textureKey} Bind Group`,
        layout: this.renderBindGroupLayout,
        entries: [
          {
            binding: 0,
            resource: this.sampler,
          },
          {
            binding: 1,
            resource: texture.texture.createView({
              dimension: "cube",
            }),
          },
          {
            binding: 2,
            resource: {
              buffer: this.inversePespectiveViewMatrix,
            },
          },
        ],
      });

      this.bindGroups.set(texture, renderBindGroup);
    }

    const inversePespectiveViewMatrix = Matrix4.copyFrom(
      perspectiveViewMatrix
    ).invert();

    this.device.queue.writeBuffer(
      this.inversePespectiveViewMatrix,
      0,
      inversePespectiveViewMatrix.components.buffer
    );

    renderPass.setPipeline(this.renderPipeline);
    renderPass.setBindGroup(0, this.bindGroups.get(texture) as GPUBindGroup);
    renderPass.draw(3);
  }
}

export { SkyboxRenderer };

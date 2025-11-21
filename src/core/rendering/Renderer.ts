import { EntityManager, type Entity } from "src/ecs";
import { Shader } from "./Shader";
import { Position, Rotation } from "../transforms";
import { PerspectiveCamera } from "../cameras/PerspectiveCamera";
import { render } from "./render";
import { ResourceManager } from "../ResourceManager";

type RendererSettings = {
  clearColour: GPUColor;
};

class Renderer {
  public readonly canvas: HTMLCanvasElement;

  public settings: RendererSettings;

  private readonly device: GPUDevice;
  private readonly ctx: GPUCanvasContext;
  private readonly canvasFormat: GPUTextureFormat;

  private bindGroup0!: GPUBindGroup;
  private renderPipeline!: GPURenderPipeline;
  private depthTexture!: GPUTexture;

  public readonly resourceManager: ResourceManager;
  public readonly perObjectBindGroupLayout: GPUBindGroupLayout;
  private readonly perspectiveViewMatrixBuffer: GPUBuffer;
  private readonly sampler: GPUSampler;

  private constructor(
    canvas: HTMLCanvasElement,
    device: GPUDevice,
    settings: Partial<RendererSettings> = {}
  ) {
    const ctx = canvas.getContext("webgpu");

    if (ctx === null) {
      throw new Error("Could not create WebGPU Canvas Context");
    }

    this.canvas = canvas;
    this.device = device;
    this.ctx = ctx;
    this.canvasFormat = "rgba8unorm";
    this.settings = {
      clearColour: settings.clearColour ?? [0, 0, 0, 1],
    };

    this.perspectiveViewMatrixBuffer = device.createBuffer({
      label: "Perspective View Matrix Buffer",
      size: 16 * 4,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.perObjectBindGroupLayout = this.device.createBindGroupLayout({
      label: "Renderer Per Object Bind Group Layout",
      entries: [
        {
          binding: 0,
          buffer: { type: "uniform", hasDynamicOffset: true },
          visibility: GPUShaderStage.VERTEX,
        },
        {
          binding: 1,
          texture: {},
          visibility: GPUShaderStage.FRAGMENT,
        },
      ],
    });
    this.resourceManager = new ResourceManager(this, device, 128);

    this.depthTexture = this.createDepthTexture();
    this.sampler = device.createSampler();
  }

  public async initialise(): Promise<void> {
    new ResizeObserver((entries) => {
      const canvas = entries[0];

      const width = canvas.devicePixelContentBoxSize[0].inlineSize;
      const height = canvas.devicePixelContentBoxSize[0].blockSize;

      this.canvas.width = width;
      this.canvas.height = height;

      this.depthTexture?.destroy();
      this.depthTexture = this.createDepthTexture();
    }).observe(this.canvas);

    await this.initialiseRendering();
  }

  private createDepthTexture(): GPUTexture {
    return this.device.createTexture({
      label: "Renderer Depth Texture",
      size: [this.canvas.width, this.canvas.height],
      format: "depth24plus",
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
  }

  private async initialiseRendering(): Promise<void> {
    this.ctx.configure({
      device: this.device,
      format: this.canvasFormat,
    });

    const shader = await Shader.fetch(
      import.meta.env.BASE_URL + "/blinnPhong.wgsl"
    );
    shader.initialise(this.device);

    const bindGroup0Layout = this.device.createBindGroupLayout({
      label: "Renderer Bind Group Layout 0",
      entries: [
        {
          binding: 0,
          buffer: { type: "uniform" },
          visibility: GPUShaderStage.VERTEX,
        },
        {
          binding: 1,
          sampler: {},
          visibility: GPUShaderStage.FRAGMENT,
        },
      ],
    });

    this.bindGroup0 = this.device.createBindGroup({
      label: "Renderer Bind Group 0",
      layout: bindGroup0Layout,
      entries: [
        {
          binding: 0,
          resource: { buffer: this.perspectiveViewMatrixBuffer },
        },
        {
          binding: 1,
          resource: this.sampler,
        },
      ],
    });

    const renderPipelineLayout = this.device.createPipelineLayout({
      label: "Renderer Render Pipeline Layout",
      bindGroupLayouts: [bindGroup0Layout, this.perObjectBindGroupLayout],
    });

    this.renderPipeline = this.device.createRenderPipeline({
      label: "Renderer Render Pipeline",
      layout: renderPipelineLayout,
      vertex: {
        module: shader.shader,
        entryPoint: "vertexMain",
        buffers: [
          {
            arrayStride: (3 + 2 + 3) * 4,
            attributes: [
              {
                shaderLocation: 0,
                format: "float32x3",
                offset: 0,
              },
              {
                shaderLocation: 1,
                format: "float32x2",
                offset: 3 * 4,
              },
              {
                shaderLocation: 2,
                format: "float32x3",
                offset: (3 + 2) * 4,
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
            format: this.canvasFormat,
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

  public render(camera: Entity): void {
    const encoder = this.device.createCommandEncoder();
    const renderPass = encoder.beginRenderPass({
      colorAttachments: [
        {
          loadOp: "clear",
          storeOp: "store",
          view: this.ctx.getCurrentTexture().createView(),
          clearValue: this.settings.clearColour,
        },
      ],
      depthStencilAttachment: {
        view: this.depthTexture.createView(),
        depthLoadOp: "clear",
        depthStoreOp: "store",
        depthClearValue: 1,
      },
    });

    const entityManager = EntityManager.getInstance();
    const cameraPosition = entityManager.getComponent<Position>(
      camera,
      "Position"
    );
    const cameraRotation = entityManager.getComponent<Rotation>(
      camera,
      "Rotation"
    );
    const cameraComponent = entityManager.getComponent<PerspectiveCamera>(
      camera,
      "PerspectiveCamera"
    );

    if (cameraComponent === null) {
      console.error("No camera found");
      return;
    }

    if (cameraPosition === null) {
      console.error("Camera does not have position component");
      return;
    }

    if (cameraRotation === null) {
      console.error("Camera does not have rotation component");
      return;
    }

    const perspectiveViewMatrix =
      cameraComponent.calculatePerspectiveViewMatrix(
        cameraPosition,
        cameraRotation
      );

    this.device.queue.writeBuffer(
      this.perspectiveViewMatrixBuffer,
      0,
      perspectiveViewMatrix.components.buffer
    );

    renderPass.setPipeline(this.renderPipeline);
    renderPass.setBindGroup(0, this.bindGroup0);

    render(this.resourceManager, this.device, renderPass);

    renderPass.end();
    this.device.queue.submit([encoder.finish(renderPass)]);
  }

  public static async create(
    canvas: HTMLCanvasElement,
    settings: Partial<RendererSettings> = {}
  ): Promise<Renderer> {
    if (!("gpu" in navigator)) {
      throw new Error("WebGPU not supported");
    }

    const adapter = await navigator.gpu.requestAdapter();

    if (adapter === null) {
      throw new Error(
        "Could not find suitable GPU Adapter. Maybe your browser doesn't support WebGPU?"
      );
    }

    const device = await adapter.requestDevice({
      requiredFeatures: Renderer.requestFeatures(adapter, "timestamp-query"),
    });

    if (device === null) {
      throw new Error(
        "Could not find suitable GPU Device. Maybe your browser doesn't support WebGPU?"
      );
    }

    return new Renderer(canvas, device, settings);
  }

  private static requestFeatures(
    adapter: GPUAdapter,
    ...features: GPUFeatureName[]
  ): GPUFeatureName[] {
    return features.filter((feature) => {
      const supported = adapter.features.has(feature);

      if (!supported) {
        console.warn(`GPU Feature ${feature} not supported`);
      }

      return supported;
    });
  }
}

export { Renderer, type RendererSettings };

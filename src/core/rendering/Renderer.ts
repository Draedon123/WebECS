import { Shader } from "./Shader";
import { render } from "./render";
import { ResourceManager } from "../ResourceManager";
import { writePerspectiveViewMatrixToBuffer } from "../cameras/writePerspectiveViewMatrixToBuffer";
import type { Entity } from "src/ecs";
import { writeAmbientLightToBuffer } from "./scene/writeAmbientLightToBuffer";
import { PointLight } from "./scene/PointLight";
import { writeAllPointLightsToBuffer } from "./scene/writeAllPointLightsToBuffer";
import { SkyboxRenderer } from "./SkyboxRenderer";
import { getPerspectiveViewMatrixToBuffer } from "../cameras/getPerspectiveViewMatrix";

type RendererSettings = {
  clearColour: GPUColor;
  readonly maxPointLights: number;
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
  private skyboxRenderer!: SkyboxRenderer;

  public readonly resourceManager: ResourceManager;
  public readonly perObjectBindGroupLayout: GPUBindGroupLayout;
  private readonly perspectiveViewMatrixBuffer: GPUBuffer;
  private readonly ambientLightBuffer: GPUBuffer;
  private readonly pointLightsBuffer: GPUBuffer;
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
      maxPointLights: settings.maxPointLights ?? 32,
    };

    this.perspectiveViewMatrixBuffer = device.createBuffer({
      label: "Perspective View Matrix Buffer",
      size: 16 * 4,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.ambientLightBuffer = device.createBuffer({
      label: "Renderer Ambient Light Buffer",
      size: 4 * 4,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.pointLightsBuffer = device.createBuffer({
      label: "Renderer Point Lights Buffer",
      size: 4 * 4 + PointLight.byteLength * this.settings.maxPointLights,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
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
        {
          binding: 2,
          buffer: { type: "uniform" },
          visibility: GPUShaderStage.FRAGMENT,
        },
        {
          binding: 3,
          buffer: { type: "read-only-storage" },
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
        {
          binding: 2,
          resource: { buffer: this.ambientLightBuffer },
        },
        {
          binding: 3,
          resource: { buffer: this.pointLightsBuffer },
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

    this.skyboxRenderer = await SkyboxRenderer.create(
      this.device,
      this.canvasFormat
    );
  }

  public render(scene: Entity, camera: Entity): void {
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

    writePerspectiveViewMatrixToBuffer(
      camera,
      this.perspectiveViewMatrixBuffer,
      this.device
    );

    writeAmbientLightToBuffer(scene, this.ambientLightBuffer, this.device);
    writeAllPointLightsToBuffer(this.pointLightsBuffer, this.device);
    this.skyboxRenderer.render(
      this.resourceManager,
      renderPass,
      getPerspectiveViewMatrixToBuffer(camera)
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

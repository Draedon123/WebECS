import { EntityManager, type Entity } from "src/ecs";
import { Shader } from "./Shader";
import { Position, Rotation } from "../transforms";
import { PerspectiveCamera } from "../cameras/PerspectiveCamera";
import { render } from "../meshes";

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

  public readonly modelMatrixBindGroupLayout: GPUBindGroupLayout;
  private readonly perspectiveViewMatrixBuffer: GPUBuffer;

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

    this.modelMatrixBindGroupLayout = this.device.createBindGroupLayout({
      label: "Renderer Bind Group Layout 1",
      entries: [
        {
          binding: 0,
          buffer: { type: "uniform" },
          visibility: GPUShaderStage.VERTEX,
        },
      ],
    });
  }

  public async initialise(): Promise<void> {
    new ResizeObserver((entries) => {
      const canvas = entries[0];

      const width = canvas.devicePixelContentBoxSize[0].inlineSize;
      const height = canvas.devicePixelContentBoxSize[0].blockSize;

      this.canvas.width = width;
      this.canvas.height = height;
    }).observe(this.canvas);

    await this.initialiseRendering();
  }

  private async initialiseRendering(): Promise<void> {
    this.ctx.configure({
      device: this.device,
      format: this.canvasFormat,
    });

    const shader = await Shader.fetch(import.meta.env.BASE_URL + "flat.wgsl");
    shader.initialise(this.device);

    const bindGroup0Layout = this.device.createBindGroupLayout({
      label: "Renderer Bind Group Layout 0",
      entries: [
        {
          binding: 0,
          buffer: { type: "uniform" },
          visibility: GPUShaderStage.VERTEX,
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
      ],
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

    const perspectiveMatrix = cameraComponent.calculatePerspectiveViewMatrix(
      cameraPosition,
      cameraRotation
    );

    this.device.queue.writeBuffer(
      this.perspectiveViewMatrixBuffer,
      0,
      perspectiveMatrix.components.buffer
    );

    renderPass.setBindGroup(0, this.bindGroup0);

    render(this.device, renderPass);

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

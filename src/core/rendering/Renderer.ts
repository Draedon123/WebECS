type RendererSettings = {
  clearColour: GPUColor;
};

class Renderer {
  public readonly canvas: HTMLCanvasElement;

  public settings: RendererSettings;

  private readonly device: GPUDevice;
  private readonly ctx: GPUCanvasContext;
  private readonly canvasFormat: GPUTextureFormat;

  private bindGroup!: GPUBindGroup;

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
  }

  public async initialise(): Promise<void> {
    new ResizeObserver((entries) => {
      const canvas = entries[0];

      const width = canvas.devicePixelContentBoxSize[0].inlineSize;
      const height = canvas.devicePixelContentBoxSize[0].blockSize;

      this.canvas.width = width;
      this.canvas.height = height;

      this.render();
    }).observe(this.canvas);

    await this.initialiseRendering();
  }

  private async initialiseRendering(): Promise<void> {
    this.ctx.configure({
      device: this.device,
      format: this.canvasFormat,
    });

    const bindGroupLayout = this.device.createBindGroupLayout({
      label: "Renderer Bind Group Layout",
      entries: [],
    });
  }

  public render(): void {
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

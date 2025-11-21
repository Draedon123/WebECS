import { Component } from "src/ecs";

type BufferOptions = GPUBufferDescriptor;

class Buffer extends Component {
  public static readonly tag: string = "Buffer";

  public buffer!: GPUBuffer;

  public readonly label?: string;
  public readonly size: number;
  public readonly usage: number;
  public readonly mappedAtCreation: boolean;

  constructor(options: BufferOptions) {
    super(Buffer.tag);

    this.label = options.label;
    this.size = options.size;
    this.usage = options.usage;
    this.mappedAtCreation = options.mappedAtCreation ?? false;
  }

  public get initialised(): boolean {
    return this.buffer !== undefined;
  }

  public initialise(device: GPUDevice): void {
    if (this.initialised) {
      return;
    }

    this.buffer = device.createBuffer({
      label: this.label,
      size: this.size,
      usage: this.usage,
      mappedAtCreation: this.mappedAtCreation,
    });
  }
}

export { Buffer };

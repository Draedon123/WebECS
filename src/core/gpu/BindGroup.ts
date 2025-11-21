import { Component } from "src/ecs";

class BindGroup extends Component {
  public static readonly tag: string = "BindGroup";

  public bindGroup!: GPUBindGroup;
  private readonly descriptor: GPUBindGroupDescriptor;
  constructor(descriptor: GPUBindGroupDescriptor) {
    super(BindGroup.tag);

    this.descriptor = descriptor;
  }

  public get initialised(): boolean {
    return this.bindGroup !== undefined;
  }

  public initialise(device: GPUDevice): void {
    if (this.initialised) {
      return;
    }

    this.bindGroup = device.createBindGroup(this.descriptor);
  }
}

export { BindGroup };

import { roundUp } from "../maths";
import type { Renderer } from "../rendering";

class TransformBindings {
  public readonly transformsBindGroup: GPUBindGroup;
  public readonly transformsBuffer: GPUBuffer;
  public readonly transformByteLength: number;
  public readonly transformsPadding: number;

  constructor(renderer: Renderer, device: GPUDevice, maxObjects: number) {
    this.transformByteLength = (16 + 12) * 4;
    const actualByteLength = roundUp(
      this.transformByteLength,
      device.limits.minUniformBufferOffsetAlignment
    );
    this.transformsPadding = actualByteLength - this.transformByteLength;

    this.transformsBuffer = device.createBuffer({
      label: "Transforms Buffer",
      size: actualByteLength * maxObjects,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.transformsBindGroup = device.createBindGroup({
      label: "Transforms Bind Group",
      layout: renderer.perObjectBindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: {
            buffer: this.transformsBuffer,
            size: this.transformByteLength + this.transformsPadding,
          },
        },
      ],
    });
  }
}

export { TransformBindings };

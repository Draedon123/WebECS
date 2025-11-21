import type { Matrix3, Matrix4, Vector3 } from "../maths";

class BufferWriter {
  public readonly buffer: ArrayBuffer;
  private readonly dataview: DataView;
  public readonly littleEndian: boolean;
  private offset: number;
  constructor(
    byteLength: number,
    littleEndian: boolean = true,
    offset: number = 0
  ) {
    this.buffer = new ArrayBuffer(byteLength);
    this.dataview = new DataView(this.buffer);
    this.littleEndian = littleEndian;
    this.offset = offset;
  }

  public writeUint8(uint8: number): void {
    this.dataview.setUint8(this.offset, uint8);
    this.offset += 1;
  }

  public writeUint32(uint32: number): void {
    this.dataview.setUint32(this.offset, uint32, this.littleEndian);
    this.offset += 4;
  }

  public writeFloat32(float32: number): void {
    this.dataview.setFloat32(this.offset, float32, this.littleEndian);
    this.offset += 4;
  }

  public writeVec3f(vec3f: Vector3): void {
    this.writeFloat32(vec3f.x);
    this.writeFloat32(vec3f.y);
    this.writeFloat32(vec3f.z);
  }

  public writeMat3x3f(mat3x3f: Matrix3): void {
    this.writeFloat32(mat3x3f.components[0]);
    this.writeFloat32(mat3x3f.components[1]);
    this.writeFloat32(mat3x3f.components[2]);
    this.pad(4);
    this.writeFloat32(mat3x3f.components[3]);
    this.writeFloat32(mat3x3f.components[4]);
    this.writeFloat32(mat3x3f.components[5]);
    this.pad(4);
    this.writeFloat32(mat3x3f.components[6]);
    this.writeFloat32(mat3x3f.components[7]);
    this.writeFloat32(mat3x3f.components[8]);
  }

  public writeMat4x4f(mat4x4f: Matrix4): void {
    new Float32Array(this.buffer, this.offset, 16).set(mat4x4f.components);
    this.offset += 16 * 4;
  }

  public pad(bytes: number): void {
    this.offset += bytes;
  }
}

export { BufferWriter };

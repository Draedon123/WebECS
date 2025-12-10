import {
  IndividualMaterialManager,
  type Material,
  type MaterialBindGroupCreator,
  type MaterialHasher,
} from "./IndividualMaterialManager";
import { PhongMaterial, type Renderer } from "../rendering";
import type { Shader } from "../rendering/Shader";

class MaterialsManager {
  private readonly materials: Map<string, IndividualMaterialManager<any>>;
  private readonly device: GPUDevice;
  private readonly renderer: Renderer;

  constructor(renderer: Renderer, device: GPUDevice) {
    this.materials = new Map();
    this.device = device;
    this.renderer = renderer;
  }

  public registerMaterialType<T extends Material>(
    materialTag: string,
    bindGroupLayout: GPUBindGroupLayout,
    shader: Shader,
    createBindGroup: MaterialBindGroupCreator<T>,
    hashMaterial: MaterialHasher<T>
  ): void {
    if (this.materials.has(materialTag)) {
      throw new Error("Material already registered");
    }

    this.materials.set(
      materialTag,
      new IndividualMaterialManager<T>(
        this.renderer,
        this.device,
        PhongMaterial.BYTE_LENGTH,
        bindGroupLayout,
        shader,
        createBindGroup,
        hashMaterial
      )
    );
  }

  public getBindGroup(material: Material): GPUBindGroup {
    const manager = this.materials.get(material.tag);
    if (manager === undefined) {
      throw new Error(`Material with tag ${material.tag} not registered`);
    }

    return manager.getBindGroup(material);
  }

  public getRenderPipeline(material: Material): GPURenderPipeline {
    const manager = this.materials.get(material.tag);
    if (manager === undefined) {
      throw new Error(`Material ${material.tag} not registered`);
    }

    return manager.renderPipeline;
  }

  public getMaterialIndex(material: Material): number {
    const manager = this.materials.get(material.tag);
    if (manager === undefined) {
      throw new Error(`Material ${material.tag} not registered`);
    }

    return manager.getMaterialIndex(material);
  }
}

export { MaterialsManager };

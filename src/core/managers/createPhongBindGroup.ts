import type { PhongMaterial } from "../rendering";

let phongBindGroupLayout: GPUBindGroupLayout | null = null;
function createPhongBindGroup(
  phong: PhongMaterial,
  device: GPUDevice
): GPUBindGroup {
  if (phongBindGroupLayout === null) {
    phongBindGroupLayout = createPhongBindGroupLayout(device);
  }

  return device.createBindGroup({
    label: "Phong Bind Group",
    layout: phongBindGroupLayout,
    entries: [
      {
        binding: 0,
        resource: phong.normalMap.texture.createView(),
      },
      {
        binding: 1,
        resource: phong.ambientMap.texture.createView(),
      },
      {
        binding: 2,
        resource: phong.diffuseMap.texture.createView(),
      },
      {
        binding: 3,
        resource: phong.specularMap.texture.createView(),
      },
    ],
  });
}

function createPhongBindGroupLayout(device: GPUDevice): GPUBindGroupLayout {
  return device.createBindGroupLayout({
    label: "Phong Bind Group Layout",
    entries: [
      {
        binding: 0,
        texture: {},
        visibility: GPUShaderStage.FRAGMENT,
      },
      {
        binding: 1,
        texture: {},
        visibility: GPUShaderStage.FRAGMENT,
      },
      {
        binding: 2,
        texture: {},
        visibility: GPUShaderStage.FRAGMENT,
      },
      {
        binding: 3,
        texture: {},
        visibility: GPUShaderStage.FRAGMENT,
      },
    ],
  });
}

export { createPhongBindGroup };

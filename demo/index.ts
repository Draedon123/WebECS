import {
  EntityManager,
  loadObj,
  MeshReference,
  PerspectiveCamera,
  Position,
  Renderer,
  Rotation,
  TextureReference,
  // Texture
} from "webecs";

async function main(): Promise<void> {
  const canvas = document.getElementById("main") as HTMLCanvasElement;
  const renderer = await Renderer.create(canvas);
  const entityManager = EntityManager.getInstance();

  await renderer.initialise();
  renderer.settings.clearColour = [0.1, 0.1, 0.1, 1];

  const cameraComponent = new PerspectiveCamera({});
  const camera = entityManager.createEntity(
    cameraComponent,
    new Position(0, 2, 10),
    new Rotation(0, 0, 0)
  );

  // const diamondOreTexture = await Texture.fetch(
  //   import.meta.env.BASE_URL + "/web-assets/diamond_ore.png"
  // );

  const teapot = await loadObj(
    import.meta.env.BASE_URL + "/web-assets/teapot.obj"
  );

  // renderer.resourceManager.addTexture("diamond_ore", diamondOreTexture);
  renderer.resourceManager.addMesh("Teapot", teapot.mesh);
  for (const material of Object.values(teapot.materials)) {
    renderer.resourceManager.addTexture(material.name, material.texture);
  }

  const teapotRotation = new Rotation(0, 0, 0);
  entityManager.createEntity(
    new MeshReference("Teapot"),
    new TextureReference("FrontColor"),
    teapotRotation
  );

  function render() {
    cameraComponent.aspectRatio = canvas.width / canvas.height;

    teapotRotation.rotateY(0.3);

    renderer.render(camera);
    requestAnimationFrame(render);
  }

  render();
}

main();

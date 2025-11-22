import {
  createCubeMesh,
  EntityManager,
  Light,
  lookAt,
  MeshReference,
  PerspectiveCamera,
  PointLight,
  Position,
  Renderer,
  Rotation,
  Scale,
  Skybox,
  Texture,
  TextureReference,
  Vector3,
} from "webecs";

async function main(): Promise<void> {
  const canvas = document.getElementById("main") as HTMLCanvasElement;
  const renderer = await Renderer.create(canvas);
  const entityManager = EntityManager.getInstance();

  await renderer.initialise();
  renderer.settings.clearColour = [0.1, 0.1, 0.1, 1];

  const cameraComponent = new PerspectiveCamera({});
  const cameraPosition = new Position(0, 3, 0);
  const camera = entityManager.createEntity(
    cameraComponent,
    cameraPosition,
    new Rotation(0, 0, 0)
  );

  await renderer.resourceManager.loadModel(
    import.meta.env.BASE_URL + "/web-assets/plane/plane.obj",
    "Plane",
    "obj"
  );
  const plane = renderer.resourceManager.spawnModel("Plane");

  entityManager.addComponent(plane, new Position(0, 0, 0));
  entityManager.addComponent(plane, new Scale(0.5));
  entityManager.addComponent(plane, new Rotation(0, 180, 0));

  entityManager.createEntity(
    new Light(new Vector3(255, 255, 255), 3),
    new PointLight(10, 2),
    new Position(-3, 6, 3)
  );

  entityManager.createEntity(
    new Light(new Vector3(255, 255, 255), 3),
    new PointLight(10, 2),
    new Position(3, 6, -3)
  );

  entityManager.createEntity(
    new Light(new Vector3(255, 255, 255), 3),
    new PointLight(10, 2),
    new Position(-3, 6, -3)
  );

  entityManager.createEntity(
    new Light(new Vector3(255, 255, 255), 3),
    new PointLight(10, 2),
    new Position(3, 6, 3)
  );

  renderer.resourceManager.addMesh("Cube", createCubeMesh());
  entityManager.createEntity(
    new MeshReference("Cube"),
    new Position(0, -2, 0),
    new Scale(100, 0.1, 100)
  );

  const scene = entityManager.createEntity();
  const skyboxTexture = await Texture.createCubemap(
    import.meta.env.BASE_URL + "/web-assets/skybox"
  );

  renderer.resourceManager.addTexture("Skybox", skyboxTexture);
  entityManager.createEntity(new Skybox(), new TextureReference("Skybox"));

  const start = Date.now();
  function render() {
    cameraComponent.aspectRatio = canvas.width / canvas.height;

    cameraPosition.x = 10 * Math.sin((Date.now() - start) * 3e-4);
    cameraPosition.z = 10 * Math.cos((Date.now() - start) * 3e-4);

    lookAt(camera, new Vector3(0, 0, 0));

    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }

  render();
}

main();

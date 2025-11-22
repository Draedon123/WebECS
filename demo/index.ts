import {
  EntityManager,
  lookAt,
  PerspectiveCamera,
  Position,
  Renderer,
  Rotation,
  Scale,
  Vector3,
} from "webecs";

async function main(): Promise<void> {
  const canvas = document.getElementById("main") as HTMLCanvasElement;
  const renderer = await Renderer.create(canvas);
  const entityManager = EntityManager.getInstance();

  await renderer.initialise();
  renderer.settings.clearColour = [0.1, 0.1, 0.1, 1];

  const cameraComponent = new PerspectiveCamera({});
  const cameraPosition = new Position(0, 10, 0);
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
  entityManager.addComponent(plane, new Scale(2));
  entityManager.addComponent(plane, new Rotation(0, 180, 0));

  const scene = entityManager.createEntity();

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

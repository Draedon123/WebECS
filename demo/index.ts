import {
  EntityManager,
  PerspectiveCamera,
  Position,
  Renderer,
  Rotation,
  Scale,
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
    new Position(0, 10, 10),
    new Rotation(-45, 0, 0)
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

  function render() {
    cameraComponent.aspectRatio = canvas.width / canvas.height;

    renderer.render(camera);
    requestAnimationFrame(render);
  }

  render();
}

main();

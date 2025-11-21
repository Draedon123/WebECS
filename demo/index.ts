import { MeshReference } from "src/core/meshes/MeshReference";
import { Texture } from "src/core/rendering/Texture";
import {
  createCubeMesh,
  EntityManager,
  PerspectiveCamera,
  Position,
  Renderer,
  Rotation,
  Scale,
  VertexArray,
} from "webecs";

async function main(): Promise<void> {
  const canvas = document.getElementById("main") as HTMLCanvasElement;
  const renderer = await Renderer.create(canvas);
  const entityManager = EntityManager.getInstance();

  await renderer.initialise();
  renderer.settings.clearColour = [0.1, 0.1, 0.1, 1];

  const camera = entityManager.createEntity();
  const cameraComponent = new PerspectiveCamera({});
  entityManager.addComponent(camera, cameraComponent);
  entityManager.addComponent(camera, new Position(0, 2, 10));
  entityManager.addComponent(camera, new Rotation(0, 0, 0));

  const cubeMesh = createCubeMesh();
  const cube = entityManager.createEntity();
  const cubeRotation = new Rotation();
  const diamondOreTexture = await Texture.fetch(
    import.meta.env.BASE_URL + "/web-assets/diamond_ore.png"
  );

  renderer.resourceManager.addTexture("diamond_ore", {
    texture: diamondOreTexture,
  });
  renderer.resourceManager.addObject(cube, "diamond_ore");
  renderer.resourceManager.addMesh("cube", {
    vertices: new VertexArray(cubeMesh, "Cube"),
  });

  entityManager.addComponent(cube, new MeshReference("cube"));
  entityManager.addComponent(cube, new Position(0, 0, 0));
  entityManager.addComponent(cube, cubeRotation);
  entityManager.addComponent(cube, new Scale(2));

  function render() {
    cameraComponent.aspectRatio = canvas.width / canvas.height;

    cubeRotation.rotateX(0.3);
    cubeRotation.rotateY(0.2);
    cubeRotation.rotateZ(0.4);

    renderer.render(camera);
    requestAnimationFrame(render);
  }

  render();
}

main();

import { MeshReference } from "src/core/meshes/MeshReference";
import { Texture } from "src/core/rendering/Texture";
import { TextureReference } from "src/core/rendering/TextureReference";
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
  const cube1 = entityManager.createEntity();
  const cube2 = entityManager.createEntity();
  const cube1Rotation = new Rotation();
  const cube2Rotation = new Rotation();
  const diamondOreTexture = await Texture.fetch(
    import.meta.env.BASE_URL + "/web-assets/diamond_ore.png"
  );

  renderer.resourceManager.addTexture("diamond_ore", diamondOreTexture);
  renderer.resourceManager.addMesh("cube", {
    vertices: new VertexArray(cubeMesh, "Cube"),
  });

  entityManager.addComponent(cube1, new MeshReference("cube"));
  entityManager.addComponent(cube1, new TextureReference("diamond_ore"));
  entityManager.addComponent(cube1, new Position(-3, 0, 0));
  entityManager.addComponent(cube1, cube1Rotation);
  entityManager.addComponent(cube1, new Scale(2));

  entityManager.addComponent(cube2, new MeshReference("cube"));
  entityManager.addComponent(cube2, new TextureReference("diamond_ore"));
  entityManager.addComponent(cube2, new Position(3, 0, 0));
  entityManager.addComponent(cube2, cube2Rotation);
  entityManager.addComponent(cube2, new Scale(2));

  function render() {
    cameraComponent.aspectRatio = canvas.width / canvas.height;

    cube1Rotation.rotateX(0.3);
    cube1Rotation.rotateY(0.2);
    cube1Rotation.rotateZ(0.4);

    cube2Rotation.rotateX(-0.2);
    cube2Rotation.rotateY(-0.4);
    cube2Rotation.rotateZ(-0.3);

    renderer.render(camera);
    requestAnimationFrame(render);
  }

  render();
}

main();

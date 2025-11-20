import { Renderer } from "webecs";

async function main(): Promise<void> {
  const canvas = document.getElementById("main") as HTMLCanvasElement;
  const renderer = await Renderer.create(canvas);

  await renderer.initialise();

  renderer.settings.clearColour = [1, 0, 1, 1];
  renderer.render();
}

main();

class Shader {
  public shader!: GPUShaderModule;

  private readonly code: string;
  private readonly label?: string;

  constructor(code: string, label?: string) {
    this.code = code;
    this.label = label;
  }

  public get initialised(): boolean {
    return this.shader !== undefined;
  }

  public initialise(device: GPUDevice): void {
    if (this.initialised) {
      return;
    }

    this.shader = device.createShaderModule({
      label: this.label,
      code: this.code,
    });
  }

  public static async fetch(
    url: string,
    label?: string,
    preprocess: (raw: string) => string = (raw) => raw
  ): Promise<Shader> {
    const raw = await (await fetch(url)).text();
    const processed = await Shader.preprocess(url, raw);

    return new Shader(preprocess(processed), label);
  }

  private static async preprocess(url: string, code: string): Promise<string> {
    return Shader.resolveImports(url, code);
  }

  private static async resolveImports(
    url: string,
    code: string,
    imported: string[] = []
  ): Promise<string> {
    const IMPORT_MATCH: RegExp = /#!import.*\s/g;

    const splitURL = url.split("/");
    const directory = splitURL.slice(0, splitURL.length - 1).join("/") + "/";
    const imports =
      code
        .match(IMPORT_MATCH)
        ?.map((match) => match.replaceAll(/(#!import)|\s/g, ""))
        .filter((imports) => !imported.includes(imports))
        .map((url) => directory + url + ".wgsl") ?? [];

    const importedCode = await Promise.all(
      imports.map(async (url) => {
        const response = await fetch(url);

        if (!response.ok) {
          return "";
        }

        const code = await response.text();

        return Shader.resolveImports(url, code, imported);
      })
    );

    return (importedCode.join("") + code).replaceAll(IMPORT_MATCH, "");
  }
}

export { Shader };

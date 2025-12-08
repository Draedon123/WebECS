import { Component } from "src/ecs";

class TextureReference extends Component {
  public static readonly tag: string = "TextureReference";

  public textureKey: string;
  constructor(textureKey: string) {
    super(TextureReference.tag);

    this.textureKey = textureKey;
  }
}

export { TextureReference };

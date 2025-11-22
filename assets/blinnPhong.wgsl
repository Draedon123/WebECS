struct Vertex {
  @location(0) position: vec3f,
  @location(1) uv: vec2f,
  @location(2) normal: vec3f,
}

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
  @location(1) normal: vec3f,
}

struct ObjectTransforms {
  modelMatrix: mat4x4f,
  normalMatrix: mat3x3f,
}

struct AmbientLight {
  colour: vec3f,
  strength: f32,
}

@group(0) @binding(0) var <uniform> perspectiveViewMatrix: mat4x4f; 
@group(0) @binding(1) var textureSampler: sampler;
@group(0) @binding(2) var <uniform> ambientLight: AmbientLight;

@group(1) @binding(0) var <uniform> objectTransforms: ObjectTransforms;
@group(1) @binding(1) var texture: texture_2d<f32>;

@vertex
fn vertexMain(vertex: Vertex) -> VertexOutput {
  var output: VertexOutput;

  output.position = perspectiveViewMatrix * objectTransforms.modelMatrix * vec4f(vertex.position, 1.0);
  output.uv = vertex.uv;
  output.normal = normalize(objectTransforms.normalMatrix * vertex.normal);

  return output;
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
  let textureColour: vec4f = textureSample(texture, textureSampler, input.uv);

  let ambient: vec3f = ambientLight.strength * ambientLight.colour;

  return vec4f(ambient, 1.0);
  // return vec4f(input.normal, 1.0);
}

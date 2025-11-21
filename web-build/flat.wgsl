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

@group(0) @binding(0) var <uniform> perspectiveViewMatrix: mat4x4f; 

@group(1) @binding(0) var <uniform> modelMatrix: mat4x4f;

@vertex
fn vertexMain(vertex: Vertex) -> VertexOutput {
  var output: VertexOutput;

  output.position = perspectiveViewMatrix * modelMatrix * vec4f(vertex.position, 1.0);
  output.uv = vertex.uv;
  output.normal = vertex.normal;

  return output;
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
  return vec4f(1.0);
}

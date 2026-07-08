const SEGMENTS = {
  0: ['a', 'b', 'c', 'd', 'e', 'f'],
  1: ['b', 'c'],
  2: ['a', 'b', 'g', 'e', 'd'],
  3: ['a', 'b', 'c', 'd', 'g'],
  4: ['f', 'g', 'b', 'c'],
  5: ['a', 'f', 'g', 'c', 'd'],
  6: ['a', 'f', 'e', 'd', 'c', 'g'],
  7: ['a', 'b', 'c'],
  8: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
  9: ['a', 'b', 'c', 'd', 'f', 'g'],
}

const SEGMENT_LAYOUT = {
  a: { horizontal: true, x: 0, y: 0.86 },
  b: { horizontal: false, x: 0.47, y: 0.44 },
  c: { horizontal: false, x: 0.47, y: -0.44 },
  d: { horizontal: true, x: 0, y: -0.86 },
  e: { horizontal: false, x: -0.47, y: -0.44 },
  f: { horizontal: false, x: -0.47, y: 0.44 },
  g: { horizontal: true, x: 0, y: 0 },
}

const COLORS = {
  frameFront: [0.085, 0.082, 0.078],
  frameBack: [0.01, 0.011, 0.014],
  frameSide: [0.02, 0.019, 0.02],
  panelFront: [1, 0.39, 0.2],
  panelBack: [0.39, 0.055, 0.028],
  panelSide: [0.9, 0.16, 0.06],
  colonFront: [1, 0.42, 0.2],
}

function createShader(gl, type, source) {
  const shader = gl.createShader(type)
  gl.shaderSource(shader, source)
  gl.compileShader(shader)

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader)
    return null
  }

  return shader
}

function createProgram(gl) {
  const vertexShader = createShader(
    gl,
    gl.VERTEX_SHADER,
    `
      attribute vec3 a_position;
      attribute vec3 a_normal;
      attribute vec3 a_color;

      uniform mat4 u_projection;
      uniform mat4 u_view;
      uniform mat4 u_model;
      uniform vec3 u_light_dir;

      varying vec3 v_color;
      varying float v_light;
      varying float v_rim;

      void main() {
        vec4 world_position = u_model * vec4(a_position, 1.0);
        vec3 normal = normalize(mat3(u_model) * a_normal);
        vec3 view_dir = normalize(vec3(0.0, 0.0, 1.0));
        float key = max(dot(normal, normalize(u_light_dir)), 0.0);
        float fill = max(dot(normal, normalize(vec3(-0.55, 0.12, 0.62))), 0.0);

        v_color = a_color;
        v_light = 0.24 + key * 0.88 + fill * 0.2;
        v_rim = pow(1.0 - max(dot(normal, view_dir), 0.0), 2.0);
        gl_Position = u_projection * u_view * world_position;
      }
    `,
  )
  const fragmentShader = createShader(
    gl,
    gl.FRAGMENT_SHADER,
    `
      precision mediump float;

      uniform float u_alpha;
      uniform vec3 u_rim_color;

      varying vec3 v_color;
      varying float v_light;
      varying float v_rim;

      void main() {
        vec3 color = v_color * v_light + u_rim_color * v_rim * 0.42;
        gl_FragColor = vec4(color, u_alpha);
      }
    `,
  )

  if (!vertexShader || !fragmentShader) {
    return null
  }

  const program = gl.createProgram()
  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)
  gl.deleteShader(vertexShader)
  gl.deleteShader(fragmentShader)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program)
    return null
  }

  return program
}

function identity() {
  return [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,
  ]
}

function multiply(a, b) {
  const out = new Array(16)

  for (let column = 0; column < 4; column += 1) {
    for (let row = 0; row < 4; row += 1) {
      out[column * 4 + row] =
        a[0 * 4 + row] * b[column * 4 + 0] +
        a[1 * 4 + row] * b[column * 4 + 1] +
        a[2 * 4 + row] * b[column * 4 + 2] +
        a[3 * 4 + row] * b[column * 4 + 3]
    }
  }

  return out
}

function translate(matrix, x, y, z) {
  return multiply(matrix, [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    x, y, z, 1,
  ])
}

function rotateX(matrix, radians) {
  const c = Math.cos(radians)
  const s = Math.sin(radians)

  return multiply(matrix, [
    1, 0, 0, 0,
    0, c, s, 0,
    0, -s, c, 0,
    0, 0, 0, 1,
  ])
}

function rotateY(matrix, radians) {
  const c = Math.cos(radians)
  const s = Math.sin(radians)

  return multiply(matrix, [
    c, 0, -s, 0,
    0, 1, 0, 0,
    s, 0, c, 0,
    0, 0, 0, 1,
  ])
}

function perspective(fovRadians, aspect, near, far) {
  const f = 1 / Math.tan(fovRadians / 2)
  const rangeInv = 1 / (near - far)

  return [
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (near + far) * rangeInv, -1,
    0, 0, near * far * rangeInv * 2, 0,
  ]
}

function subtract(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
}

function normalize(vector) {
  const length = Math.hypot(vector[0], vector[1], vector[2]) || 1
  return [vector[0] / length, vector[1] / length, vector[2] / length]
}

function cross(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ]
}

function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

function lookAt(eye, target, up) {
  const zAxis = normalize(subtract(eye, target))
  const xAxis = normalize(cross(up, zAxis))
  const yAxis = cross(zAxis, xAxis)

  return [
    xAxis[0], yAxis[0], zAxis[0], 0,
    xAxis[1], yAxis[1], zAxis[1], 0,
    xAxis[2], yAxis[2], zAxis[2], 0,
    -dot(xAxis, eye), -dot(yAxis, eye), -dot(zAxis, eye), 1,
  ]
}

function chamferedRect(width, height, chamfer) {
  const halfWidth = width / 2
  const halfHeight = height / 2
  const cut = Math.min(chamfer, halfWidth * 0.7, halfHeight * 0.7)

  return [
    [-halfWidth + cut, -halfHeight],
    [halfWidth - cut, -halfHeight],
    [halfWidth, -halfHeight + cut],
    [halfWidth, halfHeight - cut],
    [halfWidth - cut, halfHeight],
    [-halfWidth + cut, halfHeight],
    [-halfWidth, halfHeight - cut],
    [-halfWidth, -halfHeight + cut],
  ]
}

function polygonForSegment(segment, options = {}) {
  const layout = SEGMENT_LAYOUT[segment]
  const width = layout.horizontal ? options.length : options.thickness
  const height = layout.horizontal ? options.thickness : options.length
  const polygon = chamferedRect(width, height, options.chamfer)

  return polygon.map(([x, y]) => [x + layout.x + options.x, y + layout.y + options.y])
}

function octagon(cx, cy, radius) {
  const points = []

  for (let index = 0; index < 8; index += 1) {
    const angle = (Math.PI * 2 * index) / 8 + Math.PI / 8
    points.push([cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius])
  }

  return points
}

function addVertex(buffers, position, normal, color) {
  buffers.positions.push(position[0], position[1], position[2])
  buffers.normals.push(normal[0], normal[1], normal[2])
  buffers.colors.push(color[0], color[1], color[2])
}

function addTriangle(buffers, vertices, normal, color) {
  vertices.forEach((vertex) => addVertex(buffers, vertex, normal, color))
}

function addPrism(buffers, polygon, zFront, zBack, colors) {
  const center = polygon.reduce(
    (sum, point) => [sum[0] + point[0] / polygon.length, sum[1] + point[1] / polygon.length],
    [0, 0],
  )
  const frontCenter = [center[0], center[1], zFront]
  const backCenter = [center[0], center[1], zBack]

  for (let index = 0; index < polygon.length; index += 1) {
    const nextIndex = (index + 1) % polygon.length
    const current = polygon[index]
    const next = polygon[nextIndex]
    const frontA = [current[0], current[1], zFront]
    const frontB = [next[0], next[1], zFront]
    const backA = [current[0], current[1], zBack]
    const backB = [next[0], next[1], zBack]
    const edge = [next[0] - current[0], next[1] - current[1]]
    const sideNormal = normalize([edge[1], -edge[0], 0])

    addTriangle(buffers, [frontCenter, frontA, frontB], [0, 0, 1], colors.front)
    addTriangle(buffers, [backCenter, backB, backA], [0, 0, -1], colors.back)
    addTriangle(buffers, [frontA, backA, backB], sideNormal, colors.side)
    addTriangle(buffers, [frontA, backB, frontB], sideNormal, colors.side)
  }
}

function addSegment(buffers, segment, x, y, active) {
  const framePolygon = polygonForSegment(segment, {
    x,
    y,
    length: 1.02,
    thickness: 0.34,
    chamfer: 0.12,
  })

  addPrism(buffers, framePolygon, 0.08, -0.72, {
    front: COLORS.frameFront,
    back: COLORS.frameBack,
    side: COLORS.frameSide,
  })

  if (!active) {
    return
  }

  const panelPolygon = polygonForSegment(segment, {
    x,
    y,
    length: 0.78,
    thickness: 0.18,
    chamfer: 0.07,
  })

  addPrism(buffers, panelPolygon, 0.32, 0.095, {
    front: COLORS.panelFront,
    back: COLORS.panelBack,
    side: COLORS.panelSide,
  })
}

function addDigit(buffers, digit, x, y) {
  const activeSegments = new Set(SEGMENTS[digit] || [])

  Object.keys(SEGMENT_LAYOUT).forEach((segment) => {
    if (activeSegments.has(segment)) {
      addSegment(buffers, segment, x, y, true)
    }
  })
}

function addColon(buffers, x, y) {
  ;[0.34, -0.34].forEach((offsetY) => {
    addPrism(buffers, octagon(x, y + offsetY, 0.14), 0.24, -0.22, {
      front: COLORS.colonFront,
      back: COLORS.panelBack,
      side: COLORS.panelSide,
    })
  })
}

function buildGeometry(text) {
  const buffers = {
    positions: [],
    normals: [],
    colors: [],
  }
  const glyphs = [...text]
  const widths = glyphs.map((glyph) => (glyph === ':' ? 0.42 : 1.2))
  const totalWidth = widths.reduce((sum, width) => sum + width, 0) + (glyphs.length - 1) * 0.08
  let cursor = -totalWidth / 2

  glyphs.forEach((glyph, index) => {
    const width = widths[index]
    const x = cursor + width / 2

    if (glyph === ':') {
      addColon(buffers, x, 0)
    } else {
      addDigit(buffers, Number(glyph), x, 0)
    }

    cursor += width + 0.08
  })

  return {
    positions: new Float32Array(buffers.positions),
    normals: new Float32Array(buffers.normals),
    colors: new Float32Array(buffers.colors),
    vertexCount: buffers.positions.length / 3,
    totalWidth,
  }
}

function createBuffer(gl, data) {
  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
  return buffer
}

function deleteBuffers(gl, buffers) {
  Object.values(buffers).forEach((buffer) => {
    if (buffer) {
      gl.deleteBuffer(buffer)
    }
  })
}

function setAttribute(gl, location, buffer) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.enableVertexAttribArray(location)
  gl.vertexAttribPointer(location, 3, gl.FLOAT, false, 0, 0)
}

export function createCountdownWebglRenderer(canvas) {
  const gl =
    canvas.getContext('webgl', {
      alpha: true,
      antialias: true,
      premultipliedAlpha: false,
      preserveDrawingBuffer: true,
    }) ||
    canvas.getContext('experimental-webgl')

  if (!gl) {
    return null
  }

  const program = createProgram(gl)

  if (!program) {
    return null
  }

  const attributes = {
    position: gl.getAttribLocation(program, 'a_position'),
    normal: gl.getAttribLocation(program, 'a_normal'),
    color: gl.getAttribLocation(program, 'a_color'),
  }
  const uniforms = {
    projection: gl.getUniformLocation(program, 'u_projection'),
    view: gl.getUniformLocation(program, 'u_view'),
    model: gl.getUniformLocation(program, 'u_model'),
    lightDir: gl.getUniformLocation(program, 'u_light_dir'),
    rimColor: gl.getUniformLocation(program, 'u_rim_color'),
    alpha: gl.getUniformLocation(program, 'u_alpha'),
  }

  let geometryBuffers = {}
  let vertexCount = 0
  let totalWidth = 1
  let animationFrame = 0
  let start = performance.now()
  let destroyed = false

  const uploadGeometry = (text) => {
    deleteBuffers(gl, geometryBuffers)

    const geometry = buildGeometry(text)
    geometryBuffers = {
      positions: createBuffer(gl, geometry.positions),
      normals: createBuffer(gl, geometry.normals),
      colors: createBuffer(gl, geometry.colors),
    }
    vertexCount = geometry.vertexCount
    totalWidth = geometry.totalWidth
  }

  const resize = () => {
    const rect = canvas.getBoundingClientRect()
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
    const width = Math.max(Math.floor(rect.width * pixelRatio), 1)
    const height = Math.max(Math.floor(rect.height * pixelRatio), 1)

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width
      canvas.height = height
    }

    gl.viewport(0, 0, width, height)
  }

  const render = () => {
    if (destroyed) {
      return
    }

    resize()

    const width = canvas.width
    const height = canvas.height
    const aspect = width / height
    const elapsed = (performance.now() - start) / 1000
    const fov = Math.PI / 4.8
    const horizontalFov = 2 * Math.atan(Math.tan(fov / 2) * aspect)
    const cameraZForWidth = totalWidth / (2 * Math.tan(horizontalFov / 2)) * 1.28
    const cameraZForHeight = 2.35 / (2 * Math.tan(fov / 2)) * 1.02
    const cameraZ = Math.max(cameraZForWidth, cameraZForHeight, 3.8)
    const projection = perspective(fov, aspect, 0.1, 80)
    const view = lookAt([0, 0.04, cameraZ], [0, -0.04, 0], [0, 1, 0])
    let model = identity()

    model = translate(model, 0, -0.03, 0)
    model = rotateX(model, -0.075 + Math.sin(elapsed * 0.55) * 0.006)
    model = rotateY(model, -0.26 + Math.sin(elapsed * 0.42) * 0.012)

    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.enable(gl.DEPTH_TEST)
    gl.enable(gl.CULL_FACE)
    gl.cullFace(gl.BACK)
    gl.useProgram(program)

    setAttribute(gl, attributes.position, geometryBuffers.positions)
    setAttribute(gl, attributes.normal, geometryBuffers.normals)
    setAttribute(gl, attributes.color, geometryBuffers.colors)

    gl.uniformMatrix4fv(uniforms.projection, false, new Float32Array(projection))
    gl.uniformMatrix4fv(uniforms.view, false, new Float32Array(view))
    gl.uniformMatrix4fv(uniforms.model, false, new Float32Array(model))
    gl.uniform3fv(uniforms.lightDir, new Float32Array([-0.42, 0.76, 0.5]))
    gl.uniform3fv(uniforms.rimColor, new Float32Array([1, 0.22, 0.08]))
    gl.uniform1f(uniforms.alpha, 1)
    gl.drawArrays(gl.TRIANGLES, 0, vertexCount)

    animationFrame = window.requestAnimationFrame(render)
  }

  uploadGeometry('00:00:00:00')
  render()

  return {
    setText(text) {
      uploadGeometry(text)
    },
    destroy() {
      destroyed = true
      window.cancelAnimationFrame(animationFrame)
      deleteBuffers(gl, geometryBuffers)
      gl.deleteProgram(program)
    },
  }
}

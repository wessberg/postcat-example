export const page = { width: 600, height: 400 }

export function multiply(a, b) {
  return [
    a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1],
    a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3],
    a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5],
  ]
}

export function point(matrix, p) {
  return { x: matrix[0] * p.x + matrix[2] * p.y + matrix[4], y: matrix[1] * p.x + matrix[3] * p.y + matrix[5] }
}

export function inverse(m) {
  const d = m[0] * m[3] - m[1] * m[2]
  return [m[3] / d, -m[1] / d, -m[2] / d, m[0] / d, (m[2] * m[5] - m[3] * m[4]) / d, (m[1] * m[4] - m[0] * m[5]) / d]
}

export const translate = (x, y) => [1, 0, 0, 1, x, y]
export const scale = value => [value, 0, 0, value, 0, 0]
export function rotate(degrees) {
  const radians = degrees * Math.PI / 180
  return [Math.cos(radians), Math.sin(radians), -Math.sin(radians), Math.cos(radians), 0, 0]
}

export function fitViewport(size) {
  return Math.max(.1, Math.min((size.width - 64) / page.width, (size.height - 64) / page.height))
}

export function cameraMatrix(camera, size) {
  return multiply(translate(size.width / 2 + camera.x, size.height / 2 + camera.y),
    multiply(rotate(camera.angle), multiply(scale(fitViewport(size) * camera.zoom), translate(-page.width / 2, -page.height / 2))))
}

export function zoomAt(camera, size, anchor, zoom) {
  const before = point(inverse(cameraMatrix(camera, size)), anchor)
  const next = { ...camera, zoom: Math.max(.5, Math.min(2.5, zoom)) }
  const after = point(inverse(cameraMatrix(next, size)), anchor)
  const correction = point(scale(fitViewport(size) * next.zoom), { x: after.x - before.x, y: after.y - before.y })
  return { ...next, x: next.x + correction.x, y: next.y + correction.y }
}

export function layerMatrix(layer) {
  return multiply(translate(layer.x, layer.y), rotate(layer.angle))
}

export function hitTest(layers, p) {
  return [...layers].reverse().find(layer => {
    const local = point(inverse(layerMatrix(layer)), p)
    return Math.abs(local.x) <= layer.width / 2 && Math.abs(local.y) <= layer.height / 2
  })
}

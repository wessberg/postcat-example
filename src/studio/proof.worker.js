const proofs = new Map()

function escape(value) {
  return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[character])
}

function render(document) {
  const layers = document.layers.map(layer => {
    const content = layer.kind === 'text'
      ? `<text text-anchor="middle" dominant-baseline="central" font-family="Georgia,serif" font-size="${layer.fontSize}" fill="${escape(layer.color)}">${escape(layer.text)}</text>`
      : `<path d="M-52 46 Q-65 8-42-18 L-47-58 -17-35 Q0-43 17-35 L47-58 42-18 Q65 8 52 46Z" fill="${escape(layer.color)}"/><circle cx="-18" cy="-3" r="5" fill="${escape(document.paper)}"/><circle cx="18" cy="-3" r="5" fill="${escape(document.paper)}"/>`
    return `<g transform="translate(${layer.x} ${layer.y}) rotate(${layer.angle})">${content}</g>`
  }).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 600 400"><rect width="600" height="400" fill="${escape(document.paper)}"/>${layers}</svg>`
}

self.onmessage = ({ data: { request, document, revision } }) => {
  const key = `${document.id}:${revision}`
  let svg = proofs.get(key)
  if (!svg) {
    svg = render(document)
    proofs.set(key, svg)
    if (proofs.size > 24) proofs.delete(proofs.keys().next().value)
  }
  self.postMessage({ request, svg })
}

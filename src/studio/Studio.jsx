import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { cameraMatrix, hitTest, inverse, layerMatrix, page, point, zoomAt } from './geometry.js'
import { useHistory } from './history.js'
import { useProof } from './useProof.js'
import './studio.css'

function initialDocument(cat) {
  return {
    id: cat.pose, paper: cat.bg,
    layers: [
      { id: 'cat', kind: 'cat', x: 300, y: 160, width: 130, height: 130, angle: 0, color: cat.color },
      { id: 'message', kind: 'text', x: 300, y: 285, width: 380, height: 54, angle: 0, text: 'Wish you were here', fontSize: 32, color: cat.color },
    ],
  }
}

const defaultCamera = { x: 0, y: 0, zoom: 1, angle: 0 }
const svgMatrix = matrix => `matrix(${matrix.join(' ')})`

export function Studio({ cat, onClose }) {
  const dialog = useRef(null)
  const viewport = useRef(null)
  const gesture = useRef(null)
  const [history, dispatch] = useHistory(initialDocument(cat))
  const [selectedId, setSelectedId] = useState('message')
  const [camera, setCamera] = useState(defaultCamera)
  const [size, setSize] = useState({ width: 700, height: 460 })
  const selected = history.document.layers.find(layer => layer.id === selectedId)
  const proof = useProof(history.document, history.revision, Boolean(history.transaction))
  const matrix = cameraMatrix(camera, size)
  const live = useRef(null)
  live.current = { matrix, camera, size, document: history.document }

  useEffect(() => {
    const element = dialog.current
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    element.showModal()
    return () => { element.close(); document.body.style.overflow = overflow }
  }, [])

  useLayoutEffect(() => {
    const element = viewport.current
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    function keydown(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        dispatch({ type: event.shiftKey ? 'redo' : 'undo' })
      }
    }
    const element = dialog.current
    element.addEventListener('keydown', keydown)
    return () => element.removeEventListener('keydown', keydown)
  }, [dispatch])

  useEffect(() => {
    const element = viewport.current
    function wheel(event) {
      event.preventDefault()
      const rect = element.getBoundingClientRect()
      const anchor = { x: event.clientX - rect.left, y: event.clientY - rect.top }
      const { size } = live.current
      setCamera(current => zoomAt(current, size, anchor, current.zoom * Math.exp(-event.deltaY * .002)))
    }
    element.addEventListener('wheel', wheel, { passive: false })
    return () => element.removeEventListener('wheel', wheel)
  }, [])

  function localPointer(event) {
    const rect = viewport.current.getBoundingClientRect()
    return { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }

  function startGesture(event) {
    if (event.button !== 0 || gesture.current) return
    const screen = localPointer(event)
    const current = live.current
    const world = point(inverse(current.matrix), screen)
    const layer = hitTest(current.document.layers, world)
    event.currentTarget.setPointerCapture(event.pointerId)
    if (layer) {
      setSelectedId(layer.id)
      dispatch({ type: 'begin' })
      gesture.current = { pointer: event.pointerId, type: 'layer', id: layer.id, x: layer.x, y: layer.y, origin: world }
    } else {
      gesture.current = { pointer: event.pointerId, type: 'pan', x: camera.x, y: camera.y, origin: screen }
    }
  }

  function moveGesture(event) {
    const active = gesture.current
    if (!active || active.pointer !== event.pointerId) return
    const screen = localPointer(event)
    if (active.type === 'pan') {
      setCamera(current => ({ ...current, x: active.x + screen.x - active.origin.x, y: active.y + screen.y - active.origin.y }))
    } else {
      const world = point(inverse(live.current.matrix), screen)
      dispatch({ type: 'patch', id: active.id, values: { x: active.x + world.x - active.origin.x, y: active.y + world.y - active.origin.y } })
    }
  }

  function endGesture(event, cancel = false) {
    if (gesture.current?.pointer !== event.pointerId) return
    if (gesture.current.type === 'layer') dispatch({ type: cancel ? 'cancel' : 'commit' })
    gesture.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }

  function edit(values) { dispatch({ type: 'patch', id: selectedId, values }) }
  const fieldEvents = { onFocus: () => dispatch({ type: 'begin' }), onBlur: () => dispatch({ type: 'commit' }) }
  const proofUrl = proof.svg ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(proof.svg)}` : undefined

  return <dialog ref={dialog} className="studio" aria-labelledby="studio-title" onCancel={event => { event.preventDefault(); onClose() }}>
    <header className="studio-header"><div><p className="eyebrow">The postcard studio</p><h2 id="studio-title">Make it yours.</h2></div><button type="button" onClick={onClose} aria-label="Close studio">Close ×</button></header>
    <div className="studio-toolbar">
      <div className="studio-history"><button onMouseDown={event => event.preventDefault()} disabled={!history.past.length && !history.transaction} onClick={() => dispatch({ type: 'undo' })}>Undo</button><button onMouseDown={event => event.preventDefault()} disabled={!history.future.length} onClick={() => dispatch({ type: 'redo' })}>Redo</button></div>
      <div><button onClick={() => setCamera(current => ({ ...current, angle: (current.angle + 30) % 360 }))}>Rotate view <span>{camera.angle}°</span></button><button onClick={() => setCamera(defaultCamera)}>Fit card</button></div>
      <output aria-label="Zoom">{Math.round(camera.zoom * 100)}%</output>
    </div>
    <div className="studio-layout">
      <div className="studio-canvas-column"><div ref={viewport} className="studio-viewport" onPointerDown={startGesture} onPointerMove={moveGesture} onPointerUp={event => endGesture(event)} onPointerCancel={event => endGesture(event, true)}>
        <svg width="100%" height="100%" role="img" aria-label="Editable postcard">
          <g transform={svgMatrix(matrix)}>
            <rect width={page.width} height={page.height} fill={history.document.paper} className="studio-paper" />
            {history.document.layers.map(layer => <g key={layer.id} data-layer={layer.id} transform={svgMatrix(layerMatrix(layer))}>
              {layer.kind === 'text' ? <text textAnchor="middle" dominantBaseline="central" fontFamily="Georgia,serif" fontSize={layer.fontSize} fill={layer.color}>{layer.text}</text> : <><path d="M-52 46 Q-65 8-42-18 L-47-58 -17-35 Q0-43 17-35 L47-58 42-18 Q65 8 52 46Z" fill={layer.color} /><circle cx="-18" cy="-3" r="5" fill={history.document.paper} /><circle cx="18" cy="-3" r="5" fill={history.document.paper} /></>}
              {selectedId === layer.id && <rect className="studio-selection" x={-layer.width / 2} y={-layer.height / 2} width={layer.width} height={layer.height} />}
            </g>)}
          </g>
        </svg>
      </div><p className="studio-hint">Drag the cat or message to move it. Drag the paper to pan. Scroll to zoom around your pointer.</p></div>
      <aside className="studio-inspector">
        <label>Selected element<select aria-label="Selected element" value={selectedId} onChange={event => setSelectedId(event.target.value)}><option value="message">Message</option><option value="cat">Cat illustration</option></select></label>
        {selected.kind === 'text' && <label>Message<input aria-label="Message" value={selected.text} maxLength={36} {...fieldEvents} onChange={event => edit({ text: event.target.value })} /></label>}
        <div className="studio-fields">{[['x', 'Horizontal'], ['y', 'Vertical'], ['angle', 'Rotation']].map(([property, label]) => <label key={property}>{label}<input aria-label={label} type="number" value={Math.round(selected[property] * 10) / 10} step={property === 'angle' ? 5 : 1} {...fieldEvents} onChange={event => { if (event.target.value !== '') edit({ [property]: Number(event.target.value) }) }} /></label>)}</div>
        <label>Ink<select aria-label="Ink" value={selected.color} onChange={event => edit({ color: event.target.value })}><option value={cat.color}>Original</option><option value="#1b1b1a">Midnight</option><option value="#fffdf8">Cream</option></select></label>
        <section className="studio-proof" aria-label="Print proof"><div><h3>Print proof</h3><span role="status">{proof.pending ? 'Preparing…' : 'Up to date'}</span></div>{proofUrl && <img src={proofUrl} alt="Postcard print proof" />}<a className="button dark" href={proof.pending ? undefined : proofUrl} download={`${cat.pose}-postcard.svg`} aria-disabled={proof.pending}>Download postcard ↗</a></section>
      </aside>
    </div>
  </dialog>
}

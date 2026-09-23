import { useEffect, useRef, useState } from 'react'

export function useProof(document, revision, editing) {
  const worker = useRef(null)
  const sequence = useRef(0)
  const [proof, setProof] = useState({ svg: '', pending: true })

  useEffect(() => {
    const instance = new Worker(new URL('./proof.worker.js', import.meta.url), { type: 'module' })
    worker.current = instance
    instance.onmessage = ({ data }) => {
      if (data.request === sequence.current) setProof({ svg: data.svg, pending: false })
    }
    return () => { instance.terminate(); worker.current = null }
  }, [])

  useEffect(() => {
    const request = ++sequence.current
    setProof(previous => ({ ...previous, pending: true }))
    if (editing) return
    const timer = setTimeout(() => worker.current?.postMessage({ request, document, revision }), 120)
    return () => clearTimeout(timer)
  }, [document, revision, editing])

  return proof
}

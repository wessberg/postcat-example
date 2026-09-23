import { useReducer } from 'react'

export function createHistory(document) {
  return { document, past: [], future: [], transaction: null, revision: 0 }
}

function patchDocument(document, patch) {
  return { ...document, layers: document.layers.map(layer => layer.id === patch.id ? { ...layer, ...patch.values } : layer) }
}

export function historyReducer(state, action) {
  switch (action.type) {
    case 'begin':
      return state.transaction ? state : { ...state, transaction: { document: state.document, revision: state.revision } }
    case 'patch': {
      const document = patchDocument(state.document, action)
      if (state.transaction) return { ...state, document }
      return { ...state, document, past: [...state.past, state.document], future: [], revision: state.revision + 1 }
    }
    case 'commit': {
      if (!state.transaction) return state
      if (state.document === state.transaction.document) return { ...state, transaction: null }
      return { ...state, past: [...state.past, state.transaction.document], future: [], transaction: null, revision: state.revision + 1 }
    }
    case 'cancel':
      return state.transaction ? { ...state, document: state.transaction.document, transaction: null } : state
    case 'undo': {
      const previous = state.past.at(-1)
      if (!previous) return state
      return { ...state, document: previous, past: state.past.slice(0, -1), future: [state.document, ...state.future], revision: state.revision - 1 }
    }
    case 'redo': {
      const next = state.future[0]
      if (!next) return state
      return { ...state, document: next, past: [...state.past, state.document], future: state.future.slice(1), revision: state.revision + 1 }
    }
    default:
      return state
  }
}

export function useHistory(document) {
  return useReducer(historyReducer, document, createHistory)
}

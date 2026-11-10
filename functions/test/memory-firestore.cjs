// Test-only Firestore contract double. Serial transactions exercise atomic races.
module.exports = function memoryDb() {
  const documents = new Map()
  let queue = Promise.resolve()
  const ref = (path) => ({
    path, id: path.split('/').pop(),
    async get() { return snapshot(this) },
    async set(value, options) { write(this, value, options) },
  })
  const snapshot = (reference) => ({
    ref: reference, id: reference.id, exists: documents.has(reference.path),
    data: () => structuredClone(documents.get(reference.path)),
  })
  const write = (reference, value, options) => {
    documents.set(reference.path, structuredClone(options?.merge
      ? { ...documents.get(reference.path), ...value } : value))
  }
  const collection = (name, state = { filters: [], sort: [], limit: Infinity }) => ({
    doc: (id) => ref(`${name}/${id}`),
    where(field, operator, value) {
      if (operator !== '==') throw new Error('Unsupported test query')
      return collection(name, { ...state, filters: [...state.filters, [field, value]] })
    },
    orderBy(field, direction) { return collection(name, { ...state, sort: [...state.sort, [field, direction]] }) },
    startAfter(...cursor) { return collection(name, { ...state, cursor }) },
    limit(limit) { return collection(name, { ...state, limit }) },
    async get() {
      let matches = [...documents].filter(([path, data]) => path.startsWith(`${name}/`)
        && state.filters.every(([key, value]) => data[key] === value))
      const compare = (a, b) => {
        for (const [key, direction] of state.sort) {
          const left = key === '__name__' ? a[0].split('/').pop() : a[1][key]
          const right = key === '__name__' ? b[0].split('/').pop() : b[1][key]
          const comparison = left < right ? -1 : left > right ? 1 : 0
          if (comparison) return direction === 'desc' ? -comparison : comparison
        }
        return 0
      }
      matches.sort(compare)
      if (state.cursor) {
        const data = Object.fromEntries(state.sort.map(([key], i) => [key, state.cursor[i]]))
        matches = matches.filter((entry) => compare(entry, [`${name}/${data.__name__}`, data]) > 0)
      }
      return { docs: matches.slice(0, state.limit).map(([path]) => snapshot(ref(path))) }
    },
  })
  return {
    documents, collection,
    runTransaction(callback) {
      const task = queue.then(async () => {
        const writes = []
        const result = await callback({
          get: async (reference) => reference.path ? snapshot(reference) : reference.get(),
          set: (...args) => writes.push(args),
        })
        writes.forEach((args) => write(...args))
        return result
      })
      queue = task.catch(() => {})
      return task
    },
  }
}

// In-memory SSE registry for the 'client' channel (our tablet / mini-PC per restaurant).
// One process only — if you scale to multiple nodes, back this with Redis pub/sub
// (the same caveat already applies to the Socket.io layer).

/** @type {Map<string, Set<import('http').ServerResponse>>} */
const connections = new Map();

/**
 * Register an open SSE response for a restaurant. Returns a cleanup function.
 * @param {string} restaurantId
 * @param {import('http').ServerResponse} res
 */
export function addClient(restaurantId, res) {
  let set = connections.get(restaurantId);
  if (!set) {
    set = new Set();
    connections.set(restaurantId, set);
  }
  set.add(res);
  return () => {
    const current = connections.get(restaurantId);
    if (!current) return;
    current.delete(res);
    if (current.size === 0) connections.delete(restaurantId);
  };
}

/** Is there at least one live kitchen client for this restaurant? */
export function hasClients(restaurantId) {
  const set = connections.get(restaurantId);
  return !!set && set.size > 0;
}

/**
 * Push an SSE event to every open client of a restaurant.
 * @param {string} restaurantId
 * @param {{ event: string, id?: string|number, data: any }} message
 * @returns {number} how many clients received it
 */
export function pushToRestaurant(restaurantId, { event, id, data }) {
  const set = connections.get(restaurantId);
  if (!set || set.size === 0) return 0;
  const payload =
    (id != null ? `id: ${id}\n` : '') +
    (event ? `event: ${event}\n` : '') +
    `data: ${JSON.stringify(data)}\n\n`;
  let delivered = 0;
  for (const res of set) {
    try {
      res.write(payload);
      delivered += 1;
    } catch {
      // broken pipe — will be cleaned up on its own 'close'
    }
  }
  return delivered;
}

interface Coords {
  lat: number
  lng: number
}

const cache = new Map<string, Coords | null>()

export async function geocodeAddress(address: string): Promise<Coords | null> {
  const key = address.trim().toLowerCase()
  if (cache.has(key)) return cache.get(key)!

  try {
    const res = await fetch('/api/geocode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address }),
    })
    const data = await res.json() as { lat?: number; lng?: number; error?: string }
    if (!res.ok || data.error || data.lat === undefined) {
      cache.set(key, null)
      return null
    }
    const coords: Coords = { lat: data.lat, lng: data.lng! }
    cache.set(key, coords)
    return coords
  } catch {
    cache.set(key, null)
    return null
  }
}

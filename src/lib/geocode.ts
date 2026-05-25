interface Coords {
  lat: number
  lng: number
}

const cache = new Map<string, Coords | null>()

export async function geocodeAddress(address: string): Promise<Coords | null> {
  const key = address.trim().toLowerCase()
  if (cache.has(key)) return cache.get(key)!

  const apiKey = import.meta.env.VITE_GOOGLE_GEOCODING_API_KEY
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`

  try {
    const res = await fetch(url)
    const data = await res.json() as { status: string; results: Array<{ geometry: { location: { lat: number; lng: number } } }> }
    if (data.status !== 'OK' || !data.results[0]) {
      cache.set(key, null)
      return null
    }
    const { lat, lng } = data.results[0].geometry.location
    const coords: Coords = { lat, lng }
    cache.set(key, coords)
    return coords
  } catch {
    cache.set(key, null)
    return null
  }
}

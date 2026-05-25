import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json({ message: 'Use node -e to generate VAPID keys locally — do not expose via HTTP' })
}

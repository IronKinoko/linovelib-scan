import type { NextApiRequest, NextApiResponse } from 'next'
import cp from 'child_process'
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.redirect(`${process.env.basePath}`)
  cp.exec('git pull && pm2 restart linovelib-scan', { cwd: process.cwd() })
}

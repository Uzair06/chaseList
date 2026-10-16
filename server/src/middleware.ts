import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { config, isProduction } from './config.js'

declare global {
  namespace Express {
    interface Request {
      bookkeeperId?: string
    }
  }
}

export function setSessionCookie(res: Response, userId: string) {
  const token = jwt.sign({ userId }, config.jwtSecret, { expiresIn: '7d' })
  res.cookie('chase_session', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.chase_session
  if (!token) {
    res.status(401).json({ message: 'Please sign in to continue.' })
    return
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret)
    if (typeof decoded === 'string' || typeof decoded.userId !== 'string') throw new Error('Invalid session')
    req.bookkeeperId = decoded.userId
    next()
  } catch {
    res.clearCookie('chase_session', { path: '/' })
    res.status(401).json({ message: 'Your session expired. Please sign in again.' })
  }
}

export function requireTrustedOrigin(req: Request, res: Response, next: NextFunction) {
  const origin = req.get('origin')
  if (!origin || origin !== config.clientOrigin) {
    res.status(403).json({ message: 'This request did not come from your ChaseList workspace.' })
    return
  }
  next()
}

export function requireBookkeeperId(req: Request, res: Response, next: NextFunction) {
  if (!req.bookkeeperId) {
    res.status(401).json({ message: 'Please sign in to continue.' })
    return
  }
  next()
}

/**
 * PharmaChain API Service
 * 
 * All calls to the Flask backend go through this file.
 * In development: Vite proxy forwards /api/* to localhost:5000
 * In production: Uses environment variable or relative path
 */

import axios from 'axios'

// Use environment variable in production, fallback to relative path
const API_URL = 'https://pharmachain-9ale.onrender.com'  // Your Render URL
const BASE = `${API_URL}/api`

// Create axios instance with default config
const api = axios.create({
  baseURL: BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// ── GET requests ────────────────────────────────────────────

export const getChain    = ()        => api.get('/chain').then(r => r.data)
export const getBlock    = (idx)     => api.get(`/chain/${idx}`).then(r => r.data)
export const getVerify   = ()        => api.get('/verify').then(r => r.data)
export const getStats    = ()        => api.get('/stats').then(r => r.data)
export const getBatch    = (id)      => api.get(`/batch/${id}`).then(r => r.data)
export const getQR       = (id)      => api.get(`/qr/${id}`).then(r => r.data)

// ── POST requests ───────────────────────────────────────────

export const addBatch = (data) => api.post('/batch', data).then(r => r.data)

export const addTransfer = (data) => api.post('/transfer', data).then(r => r.data)

export const addDispense = (data) => api.post('/dispense', data).then(r => r.data)

export const flagBatch = (data) => api.post('/flag', data).then(r => r.data)

export const tamperBlock = (index, newData) =>
  api.post('/tamper', { index, new_data: newData }).then(r => r.data)

export const resetChain = () => api.post('/reset').then(r => r.data)

// ── Health check ─────────────────────────────────────────────
export const checkHealth = async () => {
  try {
    const r = await api.get('/stats', { timeout: 2000 })
    return r.status === 200
  } catch {
    return false
  }
}

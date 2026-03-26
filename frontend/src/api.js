/**
 * PharmaChain API Service
 * 
 * All calls to the Flask backend go through this file.
 * The Vite proxy forwards /api/* to http://localhost:5000
 * so we just use relative paths like '/api/chain'.
 */

import axios from 'axios'

const BASE = '/api'

// ── GET requests ────────────────────────────────────────────

export const getChain    = ()        => axios.get(`${BASE}/chain`).then(r => r.data)
export const getBlock    = (idx)     => axios.get(`${BASE}/chain/${idx}`).then(r => r.data)
export const getVerify   = ()        => axios.get(`${BASE}/verify`).then(r => r.data)
export const getStats    = ()        => axios.get(`${BASE}/stats`).then(r => r.data)
export const getBatch    = (id)      => axios.get(`${BASE}/batch/${id}`).then(r => r.data)
export const getQR       = (id)      => axios.get(`${BASE}/qr/${id}`).then(r => r.data)

// ── POST requests ───────────────────────────────────────────

export const addBatch = (data) => axios.post(`${BASE}/batch`, data).then(r => r.data)

export const addTransfer = (data) => axios.post(`${BASE}/transfer`, data).then(r => r.data)

export const addDispense = (data) => axios.post(`${BASE}/dispense`, data).then(r => r.data)

export const flagBatch = (data) => axios.post(`${BASE}/flag`, data).then(r => r.data)

export const tamperBlock = (index, newData) =>
  axios.post(`${BASE}/tamper`, { index, new_data: newData }).then(r => r.data)

export const resetChain = () => axios.post(`${BASE}/reset`).then(r => r.data)

// ── Health check ─────────────────────────────────────────────
export const checkHealth = async () => {
  try {
    const r = await axios.get(`${BASE}/stats`, { timeout: 2000 })
    return r.status === 200
  } catch {
    return false
  }
}

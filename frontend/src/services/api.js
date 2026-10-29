const BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'
export async function calculateInvestment(payload) {
  const response = await fetch(`${BASE}/api/calculate`, {
    method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'Could not calculate investment.')
  return data
}
export async function getHistory() {
  const response = await fetch(`${BASE}/api/history`)
  if (!response.ok) throw new Error('Could not load history.')
  return response.json()
}
export async function saveHistory(item) {
  const response = await fetch(`${BASE}/api/history`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(item)})
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'Could not save calculation.')
  return data
}
export async function deleteHistory(id) {
  const response = await fetch(`${BASE}/api/history/${id}`, {method:'DELETE'})
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'Could not delete calculation.')
  return data
}

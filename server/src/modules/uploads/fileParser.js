import * as XLSX from 'xlsx'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const pdfParse = require('pdf-parse')
import mammoth from 'mammoth'

export function parseCSV(buffer) {
  const text = buffer.toString('utf-8')
  const lines = text.split('\n').filter(Boolean)
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())
  return lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim())
    const entry = {}
    headers.forEach((h, i) => { entry[h] = values[i] || '' })
    return entry
  })
}

export function parseJSON(buffer) {
  const text = buffer.toString('utf-8')
  const data = JSON.parse(text)
  return Array.isArray(data) ? data : [data]
}

export function parseExcel(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' })
  return rows
}

export async function parsePDF(buffer) {
  const data = await pdfParse(buffer)
  return data.text
}

export async function parseDOCX(buffer) {
  const result = await mammoth.extractRawText({ buffer })
  return result.value
}

export function parseTXT(buffer) {
  return buffer.toString('utf-8')
}

import * as XLSX from 'xlsx'
import mammoth from 'mammoth'

export function parseCSV(buffer) {
  const text = buffer.toString('utf-8')
  const lines = text.split('\n').filter(Boolean)
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map((h) => h.trim())
  return lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim())
    const entry = {}
    headers.forEach((h, i) => {
      entry[h] = values[i] || ''
      entry[h.toLowerCase()] = values[i] || ''
    })
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
  const { PDFParse } = await import('pdf-parse')
  const uint8 = new Uint8Array(buffer)
  const parser = new PDFParse({ data: uint8 })
  const result = await parser.getText()
  return result.text
}

export async function parseDOCX(buffer) {
  const result = await mammoth.extractRawText({ buffer })
  return result.value
}

export function parseTXT(buffer) {
  return buffer.toString('utf-8')
}

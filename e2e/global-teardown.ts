import fs from 'fs'
import path from 'path'

export default function globalTeardown() {
  // Clean up test DB after all tests finish
  const dbPath = path.join(process.cwd(), 'data', 'test.db')
  if (fs.existsSync(dbPath)) {
    try {
      fs.unlinkSync(dbPath)
    } catch {
      // file still locked - that's ok for cleanup
    }
  }
}

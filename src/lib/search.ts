import { Member } from '@/types/database.types'

// We map a lowercase string prefix to a set of member IDs
// E.g., "yog" -> Set('id1', 'id2')
class MemberSearchIndex {
  private index: Map<string, Set<string>> = new Map()
  private membersMap: Map<string, Member> = new Map()

  // Generate all prefixes for a strong up to length 5
  // to save memory while still giving instant search feel
  private getPrefixes(str: string): string[] {
    const s = str.toLowerCase().replace(/[^a-z0-9\s]/g, '')
    const prefixes: string[] = []
    
    // Index by full word prefixes
    const words = s.split(/\s+/)
    for (const word of words) {
      for (let i = 1; i <= Math.min(word.length, 10); i++) {
        prefixes.push(word.substring(0, i))
      }
    }
    return prefixes
  }

  public rebuildIndex(members: Member[]) {
    this.index.clear()
    this.membersMap.clear()

    for (const m of members) {
      if (m.status === 'ex-member') continue; // Optionally hide from search or index separately
      
      this.membersMap.set(m.id, m)

      // Index tokens: name, sec_id, department
      const searchableStrings = [
        m.name,
        m.sec_id,
        m.department || '',
      ].filter(Boolean)

      for (const str of searchableStrings) {
        const prefixes = this.getPrefixes(str)
        for (const p of prefixes) {
          if (!this.index.has(p)) {
            this.index.set(p, new Set())
          }
          this.index.get(p)!.add(m.id)
        }
      }
    }
  }

  public search(query: string, limit = 20): Member[] {
    if (!query) return []
    
    const terms = query.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean)
    if (terms.length === 0) return []

    // Get matching IDs for the first term
    let resultIds = new Set(this.index.get(terms[0]) || [])

    // Intersect for subsequent terms (AND search)
    for (let i = 1; i < terms.length; i++) {
      const termIds = this.index.get(terms[i]) || new Set()
      resultIds = new Set([...resultIds].filter(id => termIds.has(id)))
    }

    const results: Member[] = []
    for (const id of resultIds) {
      if (results.length >= limit) break
      const m = this.membersMap.get(id)
      if (m) results.push(m)
    }

    // Sort by score ascending so lower scores get more priority in suggestive results
    return results.sort((a, b) => a.total_score - b.total_score)
  }
}

export const memberSearch = new MemberSearchIndex()

import { Evidence } from '../domain/entities'

export interface EvidenceFilters {
  kind: string
  childMemberId: string
  tag: string
}

export function filterEvidence(evidence: Evidence[], filters: EvidenceFilters): Evidence[] {
  return evidence.filter(ev => {
    const kindMatch = filters.kind === 'all' || ev.kind === filters.kind
    const childMatch = filters.childMemberId === 'all' || ev.childMemberId === filters.childMemberId
    const tagMatch = filters.tag === 'all' || (ev.tags && ev.tags.includes(filters.tag as any))
    return kindMatch && childMatch && tagMatch
  })
}

export function sortEvidenceByDate(evidence: Evidence[]): Evidence[] {
  return [...evidence].sort((a, b) => b.createdAt - a.createdAt)
}

export function getFilteredAndSortedEvidence(evidence: Evidence[], filters: EvidenceFilters): Evidence[] {
  const filtered = filterEvidence(evidence, filters)
  return sortEvidenceByDate(filtered)
}
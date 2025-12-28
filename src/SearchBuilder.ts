import { Collection, Db, Document, Filter, Sort } from "mongodb"
import { Attributes, build } from "./metadata"
import { StringMap } from "./mongo"
import { buildSort as bs, buildSearchResult, SearchResult } from "./search"
import { buildQuery as buildQ } from "./query"

export class SearchBuilder<T, S> {
  attrs?: Attributes
  id?: string
  map?: StringMap
  collection: Collection
  q?: string
  excluding?: string
  buildSort: (s: string, m?: Attributes | StringMap) => Sort
  protected buildQuery: (s: S, m?: Attributes, q?: string, ex?: string) => Filter<Document>
  protected deleteSort?: boolean
  constructor(
    db: Db,
    collectionName: string,
    metadata: Attributes | string,
    buildQuery?: (s: S, m?: Attributes, q?: string, ex?: string) => Filter<Document>,
    protected toBson?: (v: T) => T,
    protected sort?: string,
    q?: string,
    excluding?: string,
    buildSort?: (s: string, m?: Attributes | StringMap) => Sort,
  ) {
    if (metadata) {
      if (typeof metadata === "string") {
        this.id = metadata
      } else {
        this.attrs = metadata
        const meta = build(metadata)
        this.id = meta.id
        this.map = meta.map
      }
    }
    this.deleteSort = buildQuery ? undefined : true
    this.buildQuery = buildQuery ? buildQuery : buildQ
    this.collection = db.collection(collectionName)
    this.buildSort = buildSort ? buildSort : bs
    this.q = q && q.length > 0 ? q : "q"
    this.excluding = excluding && excluding.length > 0 ? excluding : "excluding"
    this.search = this.search.bind(this)
  }
  search(filter: S, limit: number, page?: number | string, fields?: string[]): Promise<SearchResult<T>> {
    let offset = 0
    if (typeof page === "number" && page >= 1) {
      offset = getOffset(limit, page)
    }
    const st = this.sort ? this.sort : "sort"
    const sn = (filter as any)[st] as string
    const so = this.buildSort(sn, this.attrs)
    if (this.deleteSort) {
      delete (filter as any)[st]
    }
    const query = this.buildQuery(filter, this.attrs, this.q, this.excluding)
    return buildSearchResult<T>(this.collection, query, so, limit, page, fields, this.id, this.map, this.toBson)
  }
}
export function getOffset(limit: number, page: number, ifirstPageSize?: number): number {
  if (ifirstPageSize && ifirstPageSize > 0) {
    const offset = limit * (page - 2) + ifirstPageSize
    return offset < 0 ? 0 : offset
  } else {
    const offset = limit * (page - 1)
    return offset < 0 ? 0 : offset
  }
}

import { Collection, Db, Document, Filter, Sort } from "mongodb"
import { Attributes, build } from "./metadata"
import { StringMap } from "./mongo"
import { buildSort as bs, buildSearchResult, SearchResult } from "./search"

export class SearchBuilder<T, S> {
  attributes?: Attributes
  id?: string
  map?: StringMap
  collection: Collection
  q?: string
  excluding?: string
  buildSort: (s: string, m?: Attributes | StringMap) => Sort
  constructor(
    db: Db,
    collectionName: string,
    public buildQuery: (s: S, m?: Attributes, q?: string, ex?: string) => Filter<Document>,
    metadata: Attributes | string,
    public toBson?: (v: T) => T,
    public sort?: string,
    q?: string,
    excluding?: string,
    buildSort?: (s: string, m?: Attributes | StringMap) => Sort,
  ) {
    if (metadata) {
      if (typeof metadata === "string") {
        this.id = metadata
      } else {
        this.attributes = metadata
        const meta = build(metadata)
        this.id = meta.id
        this.map = meta.map
      }
    }
    this.collection = db.collection(collectionName)
    this.buildSort = buildSort ? buildSort : bs
    this.q = q && q.length > 0 ? q : "q"
    this.excluding = excluding && excluding.length > 0 ? excluding : "excluding"
    this.search = this.search.bind(this)
  }
  search(s: S, limit?: number, skip?: number | string, fields?: string[]): Promise<SearchResult<T>> {
    const st = this.sort ? this.sort : "sort"
    const sn = (s as any)[st] as string
    const so = this.buildSort(sn, this.attributes)
    delete (s as any)[st]
    const query = this.buildQuery(s, this.attributes, this.q, this.excluding)
    return buildSearchResult<T>(this.collection, query, so, limit, skip, fields, this.id, this.map, this.toBson)
  }
}

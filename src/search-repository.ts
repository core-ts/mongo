import { Collection, Db, Document, Filter, ObjectId, Sort } from "mongodb"
import { Attributes, build } from "./metadata"
import { count, findOne, findWithMap, StringMap } from "./mongo"
import { buildQuery as buildQ } from "./query"
import { buildSort as bs, buildSearchResult, SearchResult } from "./search"

export class SearchRepository<T, S> {
  attrs?: Attributes
  id?: string
  map?: StringMap
  collection: Collection
  q?: string
  excluding?: string
  buildSort: (s: string, m?: Attributes | StringMap) => Sort
  protected buildQuery: (s: S, m?: Attributes, q?: string, ex?: string) => Filter<Document>
  // protected deleteSort?: boolean
  constructor(
    db: Db,
    collectionName: string,
    metadata: Attributes | string,
    buildQuery?: (s: S, m?: Attributes, q?: string, ex?: string) => Filter<Document>,
    protected fromBson?: (v: T) => T,
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
    // this.deleteSort = buildQuery ? undefined : true
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
    const query = this.buildQuery(filter, this.attrs, this.q, this.excluding)
    return buildSearchResult<T>(this.collection, query, so, limit, offset, fields, this.id, this.map, this.fromBson)
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
export const SearchBuilder = SearchRepository
export class Query<T, ID, S> extends SearchRepository<T, S> {
  protected idObjectId?: boolean
  constructor(
    db: Db,
    collectionName: string,
    metadata: Attributes | string,
    buildQuery?: (s: S, m?: Attributes, q?: string, ex?: string) => Filter<Document>,
    fromBson?: (v: T) => T,
    sort?: string,
    q?: string,
    excluding?: string,
    buildSort?: (s: string, m?: Attributes | StringMap) => Sort,
    idObjectId?: boolean,
  ) {
    super(db, collectionName, metadata, buildQuery, fromBson, sort, q, excluding, buildSort)
    this.idObjectId = idObjectId
  }
  metadata(): Attributes | undefined {
    return this.attrs
  }
  all(): Promise<T[]> {
    const fn = this.fromBson
    if (fn) {
      return findWithMap<T>(this.collection, {}, this.id, this.map).then((v) => v.map((o) => fn(o)))
    } else {
      return findWithMap<T>(this.collection, {}, this.id, this.map)
    }
  }
  load(id: ID): Promise<T> {
    const query: any = { _id: this.idObjectId ? new ObjectId("" + id) : "" + id }
    return findOne<T>(this.collection, query, this.id, this.map).then((v) => {
      if (v) {
        if (this.fromBson) {
          return this.fromBson(v)
        } else {
          return v
        }
      } else {
        return v
      }
    })
  }
  exist(id: ID): Promise<boolean> {
    const query: any = { _id: this.idObjectId ? new ObjectId("" + id) : "" + id }
    return count(this.collection, query).then((c) => c > 0)
  }
}

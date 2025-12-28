import { Db, Document, Filter, Sort } from "mongodb"
import { Attributes } from "./metadata"
import { MongoWriter } from "./MongoWriter"
import { buildSort as bs, buildSearchResult, SearchResult } from "./search"
import { StringMap } from "./mongo"
import { getOffset } from "./SearchBuilder"
import { buildQuery as buildQ } from "./query"

export class MongoSearchWriter<T, ID, S> extends MongoWriter<T, ID> {
  constructor(
    protected find: (s: S, limit?: number, offset?: number | string, fields?: string[]) => Promise<SearchResult<T>>,
    protected db: Db,
    collectionName: string,
    attributes: Attributes | string,
    toBson?: (v: T) => T,
    fromBson?: (v: T) => T,
  ) {
    super(db, collectionName, attributes, toBson, fromBson)
    this.search = this.search.bind(this)
  }
  search(s: S, limit?: number, offset?: number, fields?: string[]): Promise<SearchResult<T>> {
    return this.find(s, limit, offset, fields)
  }
}

export class Repository<T, ID, S> extends MongoWriter<T, ID> {
  q?: string
  excluding?: string
  buildSort: (s: string, m?: Attributes | StringMap) => Sort
  protected buildQuery: (s: S, m?: Attributes, q?: string, ex?: string) => Filter<Document>
  protected deleteSort?: boolean
  constructor(
    db: Db,
    collectionName: string,
    attributes: Attributes | string,
    buildQuery?: (s: S, m?: Attributes, q?: string, ex?: string) => Filter<Document>,
    toBson?: (v: T) => T,
    fromBson?: (v: T) => T,
    protected sort?: string,
    q?: string,
    excluding?: string,
    buildSort?: (s: string, m?: Attributes | StringMap) => Sort,
  ) {
    super(db, collectionName, attributes, toBson, fromBson)
    this.deleteSort = buildQuery ? undefined : true
    this.buildQuery = buildQuery ? buildQuery : buildQ
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
    const so = this.buildSort(sn, this.attributes)
    if (this.deleteSort) {
      delete (filter as any)[st]
    }
    const query = this.buildQuery(filter, this.attributes, this.q, this.excluding)
    return buildSearchResult<T>(this.collection, query, so, limit, page, fields, this.id, this.map, this.toBson)
  }
}

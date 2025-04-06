import { Db, Filter, Sort } from "mongodb"
import { Attributes, getCollectionName, Model } from "./metadata"
import { PointMapper, StringMap } from "./mongo"
import { MongoWriter } from "./MongoWriter"
import { buildQuery } from "./query"
import { buildSearchResult, buildSort, SearchResult } from "./search"

export class MongoLowCodeService<T, ID, S> extends MongoWriter<T, ID> {
  sort: string
  buildQuery: (s: S, m?: Attributes) => Filter<T>
  buildSort: (s: string, m?: Attributes | StringMap) => Sort
  constructor(
    public db: Db,
    public model: Model,
    buildQ?: (s: S, m?: Attributes) => Filter<T>,
    buildOrder?: (s: string, m?: Attributes | StringMap) => Sort,
    toBson?: (v: T) => T,
    fromBson?: (v: T) => T,
  ) {
    super(db, getCollectionName(model), model.attributes)
    this.sort = model.sort && model.sort.length > 0 ? model.sort : "sort"
    this.buildQuery = buildQ ? buildQ : buildQuery
    this.buildSort = buildOrder ? buildOrder : buildSort
    this.toBson = toBson
    this.fromBson = fromBson
    if (
      !fromBson &&
      !toBson &&
      model.geo &&
      model.latitude &&
      model.longitude &&
      model.geo.length > 0 &&
      model.latitude.length > 0 &&
      model.longitude.length > 0
    ) {
      const mapper = new PointMapper<T>(model.geo, model.latitude, model.longitude)
      this.toBson = mapper.toPoint
      this.fromBson = mapper.fromPoint
    }
    this.search = this.search.bind(this)
  }
  search(s: S, limit?: number, skip?: number, fields?: string[]): Promise<SearchResult<T>> {
    const st = this.sort ? this.sort : "sort"
    const sn = (s as any)[st] as string
    const so = this.buildSort(sn, this.attributes)
    delete (s as any)[st]
    const query = this.buildQuery(s, this.attributes)
    return buildSearchResult<T>(this.collection, query, so, limit, skip, fields, this.id, this.map, this.fromBson)
  }
}

import { Db } from "mongodb"
import { Attributes } from "./metadata"
import { MongoWriter } from "./MongoWriter"
import { SearchResult } from "./search"

export class MongoSearchWriter<T, ID, S> extends MongoWriter<T, ID> {
  constructor(
    protected find: (s: S, limit?: number, offset?: number | string, fields?: string[]) => Promise<SearchResult<T>>,
    public db: Db,
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

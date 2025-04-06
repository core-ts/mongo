import { ObjectId } from "bson"
import { Collection, Db } from "mongodb"
import { Attributes, build } from "./metadata"
import { count, findOne, findWithMap, StringMap } from "./mongo"

export type Load<T, ID> = (id: ID, ctx?: any) => Promise<T | null>
export type Get<T, ID> = Load<T, ID>
export function useGet<T, ID>(db: Db, collectionName: string, attributes: Attributes | string, fromBson?: (v: T) => T): Load<T, ID> {
  const l = new MongoLoader<T, ID>(db, collectionName, attributes, fromBson)
  return l.load
}
export const useLoad = useGet
export class MongoLoader<T, ID> {
  protected id?: string
  protected attributes?: Attributes
  protected idObjectId?: boolean
  protected map?: StringMap
  protected collection: Collection
  constructor(db: Db, collectionName: string, attributes: Attributes | string, protected fromBson?: (v: T) => T) {
    if (typeof attributes === "string") {
      this.id = attributes
    } else {
      this.attributes = attributes
      const meta = build(attributes)
      this.id = meta.id
      this.idObjectId = meta.objectId
      this.map = meta.map
    }
    this.collection = db.collection(collectionName)
    if (this.metadata) {
      this.metadata = this.metadata.bind(this)
    }
    this.all = this.all.bind(this)
    this.load = this.load.bind(this)
    this.exist = this.exist.bind(this)
  }
  metadata?(): Attributes | undefined {
    return this.attributes
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

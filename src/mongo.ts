import {
  AnyBulkWriteOperation,
  Collection,
  Db,
  Document,
  Filter,
  FindOneAndUpdateOptions,
  MatchKeysAndValues,
  MongoClient,
  MongoClientOptions,
  OptionalId,
  PullOperator,
  PushOperator,
  Sort,
  UpdateFilter,
  WithId,
} from "mongodb"

export interface MongoConfig {
  uri: string
  db: string
  auth_source?: string
  pool_size?: number
}
export interface StringMap {
  [key: string]: string
}
export function connectToDb(uri: string, db: string, authSource: string = "admin", maxPoolSize: number = 5): Promise<Db> {
  const options: MongoClientOptions = { authSource, maxPoolSize }
  return connect(uri, options).then((client) => client.db(db))
}
export function connect(uri: string, options: MongoClientOptions): Promise<MongoClient> {
  return MongoClient.connect(uri, options)
    .then((client) => {
      console.log("Connected successfully to MongoDB.")
      return client
    })
    .catch((err) => {
      console.log("Failed to connect to MongoDB.")
      throw err
    })
}
export function findOne<T>(collection: Collection, query: Filter<Document>, idName?: string, m?: StringMap): Promise<T> {
  return _findOne<T>(collection, query).then((obj) => mapOne(obj, idName, m))
}
function _findOne<T>(collection: Collection, query: Filter<Document>): Promise<T> {
  return collection.findOne(query).then((item) => item as any)
}
export function getFields(fields: string[], all?: string[]): string[] | undefined {
  if (!fields || fields.length === 0) {
    return undefined
  }
  const ex: string[] = []
  if (all) {
    for (const s of fields) {
      if (all.includes(s)) {
        ex.push(s)
      }
    }
    if (ex.length === 0) {
      return undefined
    } else {
      return ex
    }
  } else {
    return fields
  }
}
export function valueOf<T>(collection: Collection, field: string, values: T[], noSort?: boolean): Promise<T[]> {
  const query: any = {}
  query[field] = { $in: values }
  const project: any = {}
  project[field] = 1
  let sort: any
  if (!noSort) {
    sort = {}
    sort[field] = 1
  }
  return find(collection, query, sort, undefined, undefined, project).then((v) => {
    const r: T[] = []
    for (const s of v) {
      r.push((s as any)[field])
    }
    return r
  })
}
export function findAllWithMap<T>(
  collection: Collection,
  query: Filter<Document>,
  id?: string,
  m?: StringMap,
  sort?: Sort | string,
  project?: any,
): Promise<T[]> {
  return findWithMap(collection, query, id, m, sort, undefined, undefined, project)
}
export function findWithMap<T>(
  collection: Collection,
  query: Filter<Document>,
  id?: string,
  m?: StringMap,
  sort?: Sort,
  limit?: number,
  skip?: number,
  project?: any,
): Promise<T[]> {
  return find<T>(collection, query, sort, limit, skip, project).then((objects) => {
    for (const obj of objects) {
      if (id && id !== "") {
        ;(obj as any)[id] = (obj as any)["_id"]
        delete (obj as any)["_id"]
      }
    }
    if (!m) {
      return objects
    } else {
      return mapArray(objects, m)
    }
  })
}
export function findAll<T>(collection: Collection, query: Filter<Document>, sort?: Sort | string, project?: Document): Promise<T[]> {
  return find<T>(collection, query, sort, undefined, undefined, project)
}
export function find<T>(
  collection: Collection,
  query: Filter<Document>,
  sort?: Sort | string,
  limit?: number,
  skip?: number,
  project?: Document,
): Promise<T[]> {
  let cursor = collection.find(query)
  if (sort) {
    cursor = cursor.sort(sort)
  }
  if (limit) {
    cursor = cursor.limit(limit)
  }
  if (skip) {
    cursor = cursor.skip(skip)
  }
  if (project) {
    cursor = cursor.project(project)
  }
  return cursor.toArray().then((items) => items as any)
}

export function insert<T>(
  collection: Collection,
  obj0: T,
  id?: string,
  handleDuplicate?: boolean,
  toBson?: (v: T) => T,
  fromBson?: (v: T) => T,
): Promise<number> {
  let obj: any = revertOne(obj0, id)
  if (toBson) {
    obj = toBson(obj as any)
  }
  return collection
    .insertOne(obj)
    .then((value) => {
      mapOne(obj, id)
      if (toBson && fromBson) {
        fromBson(obj as any)
      }
      return value.acknowledged ? 1 : 0
    })
    .catch((err) => {
      mapOne(obj, id)
      if (toBson && fromBson) {
        fromBson(obj as any)
      }
      if (handleDuplicate && err && (err as any).errmsg) {
        if ((err as any).errmsg.indexOf("duplicate key error collection:") >= 0) {
          if ((err as any).errmsg.indexOf("dup key: { _id:") >= 0) {
            return 0
          } else {
            return -1
          }
        }
      }
      throw err
    })
}
export function insertMany<T>(collection: Collection, objs: T[], id?: string): Promise<number> {
  return collection
    .insertMany(revertArray(objs, id))
    .then((value) => {
      /*
    if (id) {
      for (let i = 0; i < objs.length; i++) {
        const v = value.insertedIds[i];
        if (v) {
          (objs[i] as any)[id] = v.toHexString();
        }
        delete (objs[i] as any)['_id'];
      }
    }
    */
      return value.insertedCount
    })
    .catch((err) => {
      if (err) {
        if ((err as any).errmsg.indexOf("duplicate key error collection:") >= 0) {
          if ((err as any).errmsg.indexOf("dup key: { _id:") >= 0) {
            return 0
          } else {
            return -1
          }
        }
      }
      throw err
    })
}
export function patch<T>(collection: Collection, obj: Partial<T>, id?: string, toBson?: (v: T) => T, fromBson?: (v: T) => T): Promise<number> {
  revertOne(obj, id)
  if (!(obj as any)["_id"]) {
    throw new Error("Cannot patch an object that do not have _id field: " + JSON.stringify(obj))
  }
  if (toBson) {
    obj = toBson(obj as any)
  }
  return collection.findOneAndUpdate({ _id: (obj as any)["_id"] }, { $set: obj as any }).then((res) => {
    mapOne(obj, id)
    if (toBson && fromBson) {
      fromBson(obj as any)
    }
    return getAffectedRow(res)
  })
}
export function getAffectedRow<T>(res: WithId<Document> | null): number {
  if (!res) {
    return 0
  }
  if (res.lastErrorObject) {
    return res.lastErrorObject.n
  } else {
    return res.ok
  }
}
export function patchWithFilter<T>(
  collection: Collection,
  obj: Partial<T>,
  filter: Filter<Document>,
  toBson?: (v: T) => T,
  fromBson?: (v: T) => T,
): Promise<number> {
  if (toBson) {
    obj = toBson(obj as any)
  }
  return collection.findOneAndUpdate(filter, { $set: obj }).then((res) => {
    if (toBson && fromBson) {
      fromBson(obj as any)
    }
    return getAffectedRow(res)
  })
}
export function update<T>(collection: Collection, obj: T, id?: string, toBson?: (v: T) => T, fromBson?: (v: T) => T): Promise<number> {
  revertOne(obj, id)
  if (!(obj as any)["_id"]) {
    throw new Error("Cannot update an object that do not have _id field: " + JSON.stringify(obj))
  }
  if (toBson) {
    obj = toBson(obj)
  }
  return collection.findOneAndReplace({ _id: (obj as any)["_id"] }, obj as any).then((res) => {
    mapOne(obj, id)
    if (toBson && fromBson) {
      fromBson(obj)
    }
    return getAffectedRow(res)
  })
}
export function updateWithFilter<T>(collection: Collection, obj: T, filter: Filter<Document>, toBson?: (v: T) => T, fromBson?: (v: T) => T): Promise<number> {
  if (toBson) {
    obj = toBson(obj)
  }
  return collection.findOneAndReplace(filter, obj as any).then((res) => {
    if (toBson && fromBson) {
      fromBson(obj)
    }
    return getAffectedRow(res)
  })
}
export function updateFields<T>(
  collection: Collection,
  object: T,
  arr: PushOperator<T>,
  id?: string,
  toBson?: (v: T) => T,
  fromBson?: (v: T) => T,
): Promise<T> {
  let obj: any = revertOne(object, id)
  if (!obj["_id"]) {
    throw new Error("Cannot update an object that do not have _id field: " + JSON.stringify(obj))
  }
  if (toBson) {
    obj = toBson(obj)
  }
  return collection.findOneAndUpdate({ _id: obj["_id"] }, { $push: arr }).then((res) => {
    if (!res) {
      return 0
    }
    if (res.value) {
      if (fromBson) {
        return fromBson(res.value as any)
      } else {
        return res.value as any
      }
    } else {
      return object
    }
  })
}
export function updateByQuery<T>(collection: Collection, query: Filter<Document>, setValue: MatchKeysAndValues<T>): Promise<T> {
  return collection.findOneAndUpdate(query, { $set: setValue }).then((res) => {
    if (!res) {
      return 0
    }
    if (res.value) {
      return res.value as any
    } else {
      return setValue as any
    }
  })
}
/*
export function updateMany<T>(collection: Collection, filter: FilterQuery<T>, update: UpdateQuery<T> | Partial<T>): Promise<number> {
  return new Promise<number>(((resolve, reject) => {
    collection.updateMany(filter, update, (err, result: UpdateWriteOpResult) => {
      if (err) {
        return reject(err);
      }
      return resolve(result.modifiedCount);
    });
  }));
}
*/
export function updateMany<T>(collection: Collection, objects: T[], id?: string): Promise<number> {
  // tslint:disable-next-line:array-type
  const operations: AnyBulkWriteOperation<Document>[] = []
  revertArray(objects, id)
  for (const object of objects) {
    const obj: any = object
    if (obj["_id"]) {
      operations.push({
        updateOne: {
          filter: { _id: obj["_id"] },
          update: { $set: obj },
        },
      })
    }
  }
  if (operations.length === 0) {
    return Promise.resolve(0)
  }
  return collection.bulkWrite(operations).then((res) => res.modifiedCount)
}
export function upsert<T>(collection: Collection, object: T, id?: string, toBson?: (v: T) => T, fromBson?: (v: T) => T): Promise<number> {
  let obj: any = revertOne(object, id)
  if (obj["_id"]) {
    if (toBson) {
      obj = toBson(obj)
    }
    return collection.findOneAndUpdate({ _id: obj["_id"] }, { $set: obj }).then((res) => {
      if (id) {
        mapOne(obj, id)
      }
      if (toBson && fromBson) {
        fromBson(obj)
      }
      return getAffectedRow(res)
    })
  } else {
    return collection.insertOne(object as any).then((r) => {
      const v = r["insertedId"]
      if (v && id && id.length > 0) {
        ;(object as any)[id] = v
      }
      if (fromBson) {
        fromBson(object)
      }
      return r.acknowledged ? 1 : 0
    })
  }
}
export function upsertWithFilter<T>(collection: Collection, obj: T, filter: Filter<Document>, toBson?: (v: T) => T, fromBson?: (v: T) => T): Promise<number> {
  if (toBson) {
    obj = toBson(obj)
  }
  const opts: FindOneAndUpdateOptions = { upsert: true }
  return collection.findOneAndUpdate(filter, { $set: obj as any }, opts).then((res) => {
    if (toBson && fromBson) {
      fromBson(obj)
    }
    return getAffectedRow(res)
  })
}
export function upsertMany<T>(collection: Collection, objects: T[], id?: string): Promise<number> {
  // tslint:disable-next-line:array-type
  const operations: AnyBulkWriteOperation<Document>[] = []
  revertArray(objects, id)
  for (const object of objects) {
    if ((object as any)["_id"]) {
      operations.push({
        updateOne: {
          filter: { _id: (object as any)["_id"] },
          update: { $set: object as any },
          upsert: true,
        },
      })
    } else {
      operations.push({
        insertOne: {
          document: object as any,
        },
      })
    }
  }
  return collection.bulkWrite(operations).then((res) => {
    return res.insertedCount + res.modifiedCount + res.upsertedCount
  })
}
export function deleteMany<T>(collection: Collection, query: Filter<Document>): Promise<number> {
  return collection.deleteMany(query).then((res) => res.deletedCount)
}
export function deleteOne<T>(collection: Collection, query: Filter<Document>): Promise<number> {
  return collection.deleteOne(query).then((res) => res.deletedCount)
}
export function deleteById(collection: Collection, _id: any): Promise<number> {
  return collection.deleteOne({ _id }).then((res) => res.deletedCount)
}
export function deleteByIds(collection: Collection, _ids: any[]): Promise<number> {
  if (!_ids || _ids.length === 0) {
    return Promise.resolve(0)
  }
  // tslint:disable-next-line:array-type
  const operations: AnyBulkWriteOperation<Document>[] = [
    {
      deleteMany: {
        filter: {
          _id: {
            $in: _ids,
          },
        },
      },
    },
  ]
  return collection.bulkWrite(operations).then((res) => res.deletedCount)
}
export function deleteFields<T>(collection: Collection, object: T, filter: PullOperator<T>, id?: string): Promise<number> {
  const obj: any = revertOne(object, id)
  if (!obj["_id"]) {
    throw new Error("Cannot delete an object that do not have _id field: " + JSON.stringify(obj))
  }
  const ft: UpdateFilter<Document> = { $pull: filter }
  return collection.findOneAndUpdate({ _id: obj["_id"] }, ft).then((res) => {
    if (!res) {
      return 0
    }
    return res.ok
  })
}
export function count<T>(collection: Collection, query: Filter<Document>): Promise<number> {
  return collection.countDocuments(query)
}
export function findWithAggregate<T>(collection: Collection, pipeline: Document[]): Promise<T[]> {
  const res = collection.aggregate(pipeline)
  return res.toArray() as any
}
export function revertOne(obj: any, idName?: string): OptionalId<Document> {
  if (idName && idName.length > 0) {
    obj["_id"] = obj[idName]
    delete obj[idName]
  }
  return obj as any
}
// tslint:disable-next-line:array-type
export function revertArray<T>(objs: T[], id?: string): OptionalId<Document>[] {
  if (!objs || !id) {
    return objs as any
  }
  if (id && id.length > 0) {
    const length = objs.length
    for (let i = 0; i < length; i++) {
      const obj: any = objs[i]
      obj["_id"] = obj[id]
      delete obj[id]
    }
  }
  return objs as any
}
export function mapOne(obj: any, id?: string, m?: StringMap): any {
  if (!obj || !id) {
    return obj
  }
  if (id && id.length > 0) {
    obj[id] = obj["_id"]
    delete obj["_id"]
  }
  if (m) {
    return _mapOne(obj, m)
  } else {
    return obj
  }
}
export function _mapOne<T>(obj: T, m: StringMap): any {
  const obj2: any = {}
  const keys = Object.keys(obj as any)
  for (const key of keys) {
    let k0 = m[key]
    if (!k0) {
      k0 = key
    }
    obj2[k0] = (obj as any)[key]
  }
  return obj2
}
export function map<T>(obj: T, m?: StringMap): any {
  if (!m) {
    return obj
  }
  const mkeys = Object.keys(m as any)
  if (mkeys.length === 0) {
    return obj
  }
  const obj2: any = {}
  const keys = Object.keys(obj as any)
  for (const key of keys) {
    let k0 = m[key]
    if (!k0) {
      k0 = key
    }
    obj2[k0] = (obj as any)[key]
  }
  return obj2
}
export function mapArray<T>(results: T[], m?: StringMap): T[] {
  if (!m) {
    return results
  }
  const mkeys = Object.keys(m)
  if (mkeys.length === 0) {
    return results
  }
  const objs = []
  const length = results.length
  for (let i = 0; i < length; i++) {
    const obj = results[i]
    const obj2: any = {}
    const keys = Object.keys(obj as any)
    for (const key of keys) {
      let k0 = m[key]
      if (!k0) {
        k0 = key
      }
      obj2[k0] = (obj as any)[key]
    }
    objs.push(obj2)
  }
  return objs
}
export function buildProject<T>(fields?: string[], all?: string[], mp?: StringMap, notIncludeId?: boolean): Document | undefined {
  if (!fields || fields.length === 0) {
    return undefined
  }
  const p: any = {}
  if (mp) {
    if (all) {
      for (const s of fields) {
        if (all.includes(s)) {
          const s2 = mp[s]
          if (s2) {
            p[s2] = 1
          } else {
            p[s] = 1
          }
        }
      }
    } else {
      for (const s of fields) {
        const s2 = mp[s]
        if (s2) {
          p[s2] = 1
        } else {
          p[s] = 1
        }
      }
    }
  } else {
    if (all) {
      for (const s of fields) {
        if (all.includes(s)) {
          p[s] = 1
        }
      }
    } else {
      for (const s of fields) {
        p[s] = 1
      }
    }
  }
  if (!notIncludeId) {
    p["_id"] = 1
  }
  return p
}
export function getMapField(name: string, mp?: StringMap): string {
  if (!mp) {
    return name
  }
  const x = mp[name]
  if (!x) {
    return name
  }
  if (typeof x === "string") {
    return x
  }
  return name
}

export function fromPoints<T>(s: T[], geo?: string, latitude?: string, longitude?: string): T[] {
  const g = geo ? geo : "geo"
  const lat = latitude ? latitude : "latitude"
  const long = longitude ? longitude : "longitude"
  return s.map((o) => fromPoint(o, g, lat, long))
}
export function fromPoint<T>(v: T, geo: string, latitude: string, longitude: string): T {
  if (!v) {
    return v
  }
  const point: any = (v as any)[geo]
  if (!point) {
    return v
  }
  const coordinates = point["coordinates"]
  if (!coordinates || !Array.isArray(coordinates)) {
    return v
  }
  if (coordinates.length < 2) {
    return v
  }
  const lat = coordinates[0]
  const long = coordinates[1]
  if (typeof lat !== "number" || typeof long !== "number") {
    return v
  }
  ;(v as any)[latitude] = lat
  ;(v as any)[longitude] = long
  delete (v as any)[geo]
  return v
}
export function toPoints<T>(s: T[], geo?: string, latitude?: string, longitude?: string): T[] {
  const g = geo ? geo : "geo"
  const lat = latitude ? latitude : "latitude"
  const long = longitude ? longitude : "longitude"
  return s.map((o) => toPoint(o, g, lat, long))
}
export function toPoint<T>(v: T, geo: string, latitude: string, longitude: string): T {
  if (!v) {
    return v
  }
  const lat = (v as any)[latitude]
  const long = (v as any)[longitude]
  if (typeof lat !== "number" || typeof long !== "number") {
    return v
  }
  const point = { type: "Point", coordinates: [lat, long] }
  ;(v as any)[geo] = point
  delete (v as any)[latitude]
  delete (v as any)[longitude]
  return v
}

export class PointMapper<T> {
  geo: string
  latitude: string
  longitude: string
  constructor(geo?: string, latitude?: string, longitude?: string) {
    this.geo = geo ? geo : "geo"
    this.latitude = latitude ? latitude : "latitude"
    this.longitude = longitude ? longitude : "longitude"
    this.fromPoint = this.fromPoint.bind(this)
    this.toPoint = this.toPoint.bind(this)
  }
  fromPoint(model: T): T {
    return fromPoint(model, this.geo, this.latitude, this.longitude)
  }
  toPoint(model: T): T {
    return toPoint(model, this.geo, this.latitude, this.longitude)
  }
}

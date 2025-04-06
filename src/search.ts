import { Collection, Document, Filter, Sort } from "mongodb"
import { Attributes } from "./metadata"
import { buildProject, count, find, mapArray, StringMap } from "./mongo"

export interface SearchResult<T> {
  list: T[]
  total?: number
  last?: boolean
}
export function buildSearchResult<T>(
  collection: Collection,
  query: Filter<Document>,
  sort?: Sort | string,
  limit?: number,
  skipOrRef?: number | string,
  fields?: string[],
  idName?: string,
  map?: StringMap,
  mp?: (v: T) => T,
): Promise<SearchResult<T>> {
  const project = buildProject(fields)
  if (limit) {
    let skip = 0
    if (skipOrRef && typeof skipOrRef === "number" && skipOrRef >= 0) {
      skip = skipOrRef
    }
    const p1 = find<T>(collection, query, sort, limit, skip, project)
    const p2 = count(collection, query)
    return Promise.all([p1, p2]).then((values) => {
      const [list2, total] = values
      let list = list2
      if (idName && idName !== "") {
        for (const obj of list) {
          ;(obj as any)[idName] = (obj as any)["_id"]
          delete (obj as any)["_id"]
        }
      }
      if (map) {
        list = mapArray(list, map)
      }
      if (mp) {
        list = list.map((o) => mp(o))
      }
      const r: SearchResult<T> = { list, total, last: skip + list.length >= total }
      return r
    })
  } else {
    return find<T>(collection, query, sort, undefined, undefined, project).then((list) => {
      if (idName && idName !== "") {
        for (const obj of list) {
          ;(obj as any)[idName] = (obj as any)["_id"]
          delete (obj as any)["_id"]
        }
      }
      if (map) {
        list = mapArray(list, map)
      }
      if (mp) {
        list = list.map((o) => mp(o))
      }
      const r = { list }
      return r
    })
  }
}
export function buildSort<T>(sort: string, map?: Attributes | StringMap): Sort {
  const sort2: any = {}
  if (sort && sort.length > 0) {
    const sorts = sort.split(",")
    for (const st of sorts) {
      if (st.length > 0) {
        let field = st
        const tp = st.charAt(0)
        if (tp === "-" || tp === "+") {
          field = st.substr(1)
        }
        const sortType = tp === "-" ? -1 : 1
        sort2[getField(field.trim(), map)] = sortType
      }
    }
  }
  return sort2
}
export function getField(name: string, map?: Attributes | StringMap): string {
  if (!map) {
    return name
  }
  const x = map[name]
  if (!x) {
    return name
  }
  if (typeof x === "string") {
    return x
  }
  if (x.key) {
    return "_id"
  }
  if (x.field) {
    return x.field
  }
  return name
}

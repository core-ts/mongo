import { Filter } from "mongodb"
import { Attribute, Attributes } from "./metadata"

export function buildQuery<T, S>(s0: S, attrs?: Attributes, sq?: string, strExcluding?: string): Filter<T> {
  const a: any = {}
  const b: any = {}
  const s: any = s0
  let q: string | undefined
  let excluding: string[] | number[] | undefined
  if (sq && sq.length > 0) {
    q = s[sq]
    delete s[sq]
    if (q === "") {
      q = undefined
    }
  }
  if (strExcluding && strExcluding.length > 0) {
    excluding = s[strExcluding]
    delete s[strExcluding]
    if (typeof excluding === "string") {
      excluding = (excluding as string).split(",")
    }
    if (excluding && excluding.length === 0) {
      excluding = undefined
    }
  }
  const ex: string[] = []
  const keys = Object.keys(s)
  for (const key of keys) {
    const v = s[key]
    let field = key
    if (v !== undefined && v != null) {
      if (attrs) {
        const attr: Attribute = attrs[key]
        if (attr) {
          field = attr.field ? attr.field : key
          if (attr.key) {
            field = "_id"
          }
          if (typeof v === "string") {
            if (attr.q) {
              ex.push(key)
            }
            const exg = buildMatch(v, attr.operator)
            a[field] = exg
          } else if (v instanceof Date) {
            if (attr.operator === ">=") {
              b["$gte"] = v
            } else if (attr.operator === ">") {
              b["$gt"] = v
            } else if (attr.operator === "<") {
              b["$lt"] = v
            } else {
              b["$lte"] = v
            }
            a[field] = b
          } else if (typeof v === "number") {
            if (attr.operator === ">=") {
              b["$gte"] = v
            } else if (attr.operator === ">") {
              b["$gt"] = v
            } else if (attr.operator === "<") {
              b["$lt"] = v
            } else {
              b["$lte"] = v
            }
            a[field] = b
          } else if (attr.type === "ObjectId") {
            a[field] = v
          } else if (typeof v === "object") {
            if (Array.isArray(v)) {
              if (v.length > 0) {
                a[field] = { $in: v }
              }
            } else if (attr.type === "date" || attr.type === "datetime") {
              if (isDateRange(v)) {
                if (v["max"]) {
                  b["$lte"] = v["max"]
                } else if (v["top"]) {
                  b["$lt"] = v["top"]
                } else if (v["endDate"]) {
                  b["$lte"] = v["endDate"]
                } else if (v["upper"]) {
                  b["$lt"] = v["upper"]
                } else if (v["endTime"]) {
                  b["$lt"] = v["endTime"]
                }
                if (v["min"]) {
                  b["$gte"] = v["min"]
                } else if (v["startTime"]) {
                  b["$gte"] = v["startTime"]
                } else if (v["startDate"]) {
                  b["$gte"] = v["startDate"]
                } else if (v["lower"]) {
                  b["$gt"] = v["lower"]
                }
                a[field] = b
              }
            } else if (attr.type === "number" || attr.type === "integer") {
              if (isNumberRange(v)) {
                if (v["max"]) {
                  b["$lte"] = v["max"]
                } else if (v["top"]) {
                  b["$lt"] = v["top"]
                } else if (v["upper"]) {
                  b["$lt"] = v["upper"]
                }
                if (v["min"]) {
                  b["$gte"] = v["min"]
                } else if (v["lower"]) {
                  b["$gt"] = v["lower"]
                }
                a[field] = b
              }
            }
          }
        } else if (typeof v === "string" && v.length > 0) {
          a[field] = buildMatch(v, "")
        }
      } else if (typeof v === "string" && v.length > 0) {
        a[field] = buildMatch(v, "")
      }
    }
  }
  if (excluding) {
    a._id = { $nin: excluding }
  }
  const c = []
  if (q && attrs) {
    const qkeys = Object.keys(attrs)
    for (const field of qkeys) {
      const attr = attrs[field]
      if (attr.q && (attr.type === undefined || attr.type === "string") && !ex.includes(field)) {
        c.push(buildQ(field, q, attr.operator))
      }
    }
  }
  if (c.length === 1) {
    const json: any = Object.assign(a, c[0])
    return json
  } else if (c.length > 1) {
    a.$or = c
    return a
  } else {
    return a
  }
}
export function isEmpty(s: string): boolean {
  return !(s && s.length > 0)
}
export function buildQ(field: string, q: string, match?: string): any {
  const o: any = {}
  if (match === "=") {
    o[field] = q
  } else if (match === "like") {
    o[field] = new RegExp(`\\w*${q}\\w*`)
  } else {
    o[field] = new RegExp(`^${q}`)
  }
  return o
}
export function buildMatch(v: string, match?: string): string | RegExp {
  if (match === "=") {
    return v
  } else if (match === "like") {
    return new RegExp(`\\w*${v}\\w*`)
  } else {
    return new RegExp(`^${v}`)
  }
}
export function isDateRange<T>(obj: T): boolean {
  const keys: string[] = Object.keys(obj as any)
  for (const key of keys) {
    const v = (obj as any)[key]
    if (!(v instanceof Date)) {
      return false
    }
  }
  return true
}
export function isNumberRange<T>(obj: T): boolean {
  const keys: string[] = Object.keys(obj as any)
  for (const key of keys) {
    const v = (obj as any)[key]
    if (typeof v !== "number") {
      return false
    }
  }
  return true
}

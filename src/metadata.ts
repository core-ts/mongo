export function getCollectionName(model: Model, collectionName?: string): string {
  const n = collectionName ? collectionName : model.collection ? model.collection : model.source ? model.source : model.name
  return n ? n : ""
}

interface StringMap {
  [key: string]: string
}
export type DataType =
  | "ObjectId"
  | "date"
  | "datetime"
  | "time"
  | "boolean"
  | "number"
  | "integer"
  | "string"
  | "text"
  | "object"
  | "array"
  | "binary"
  | "primitives"
  | "booleans"
  | "numbers"
  | "integers"
  | "strings"
  | "dates"
  | "datetimes"
  | "times"
export type FormatType = "currency" | "percentage" | "email" | "url" | "phone" | "fax" | "ipv4" | "ipv6"
export type MatchType = "equal" | "prefix" | "contain" | "max" | "min" // contain: default for string, min: default for Date, number

export interface Model {
  name?: string
  attributes: Attributes
  source?: string
  table?: string
  collection?: string
  sort?: string
  geo?: string
  latitude?: string
  longitude?: string
}
export interface Attribute {
  name?: string
  field?: string
  column?: string
  type?: DataType
  format?: FormatType
  required?: boolean
  match?: MatchType
  default?: string | number | Date | boolean
  key?: boolean
  unique?: boolean
  enum?: string[] | number[]
  q?: boolean
  noinsert?: boolean
  noupdate?: boolean
  nopatch?: boolean
  version?: boolean
  length?: number
  min?: number
  max?: number
  gt?: number
  lt?: number
  precision?: number
  scale?: number
  exp?: RegExp | string
  code?: string
  noformat?: boolean
  ignored?: boolean
  jsonField?: string
  link?: string
  typeof?: Attributes
}
export interface Attributes {
  [key: string]: Attribute
}

export interface Metadata {
  id?: string
  objectId?: boolean
  map?: StringMap
}
export function getVersion(attributes?: Attributes): string | undefined {
  if (!attributes) {
    return undefined
  }
  const keys: string[] = Object.keys(attributes)
  for (const key of keys) {
    const attr: Attribute = attributes[key]
    if (attr.version === true) {
      return key
    }
  }
  return undefined
}
export function build(attributes?: Attributes): Metadata {
  const sub: Metadata = { id: "id" }
  if (!attributes) {
    return sub
  }
  const keys: string[] = Object.keys(attributes)
  for (const key of keys) {
    const attr: Attribute = attributes[key]
    if (attr.key === true) {
      const meta: Metadata = { id: key }
      meta.objectId = attr.type === "ObjectId" ? true : false
      meta.map = buildMap(attributes)
      return meta
    }
  }
  return sub
}
export function buildMap(attributes?: Attributes): StringMap | undefined {
  if (!attributes) {
    return undefined
  }
  const map: any = {}
  const keys: string[] = Object.keys(attributes)
  let c = 0
  for (const key of keys) {
    const attr: Attribute = attributes[key]
    if (attr) {
      attr.name = key
      if (attr.field && attr.field.length > 0 && attr.field !== key) {
        map[attr.field] = key
        c = c + 1
      }
    }
  }
  return c > 0 ? map : undefined
}

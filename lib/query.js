"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function buildQuery(s0, attrs, sq, strExcluding) {
  var a = {};
  var b = {};
  var s = s0;
  var q;
  var excluding;
  if (sq && sq.length > 0) {
    q = s[sq];
    delete s[sq];
    if (q === "") {
      q = undefined;
    }
  }
  if (strExcluding && strExcluding.length > 0) {
    excluding = s[strExcluding];
    delete s[strExcluding];
    if (typeof excluding === "string") {
      excluding = excluding.split(",");
    }
    if (excluding && excluding.length === 0) {
      excluding = undefined;
    }
  }
  var ex = [];
  var keys = Object.keys(s);
  for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
    var key = keys_1[_i];
    var v = s[key];
    var field = key;
    if (v !== undefined && v != null) {
      if (attrs) {
        var attr = attrs[key];
        if (attr) {
          field = attr.field ? attr.field : key;
          if (attr.key) {
            field = "_id";
          }
          if (typeof v === "string") {
            if (attr.q) {
              ex.push(key);
            }
            var exg = buildMatch(v, attr.operator);
            a[field] = exg;
          }
          else if (v instanceof Date) {
            if (attr.operator === ">=") {
              b["$gte"] = v;
            }
            else if (attr.operator === ">") {
              b["$gt"] = v;
            }
            else if (attr.operator === "<") {
              b["$lt"] = v;
            }
            else {
              b["$lte"] = v;
            }
            a[field] = b;
          }
          else if (typeof v === "number") {
            if (attr.operator === ">=") {
              b["$gte"] = v;
            }
            else if (attr.operator === ">") {
              b["$gt"] = v;
            }
            else if (attr.operator === "<") {
              b["$lt"] = v;
            }
            else {
              b["$lte"] = v;
            }
            a[field] = b;
          }
          else if (attr.type === "ObjectId") {
            a[field] = v;
          }
          else if (typeof v === "object") {
            if (Array.isArray(v)) {
              if (v.length > 0) {
                a[field] = { $in: v };
              }
            }
            else if (attr.type === "date" || attr.type === "datetime") {
              if (isDateRange(v)) {
                if (v["max"]) {
                  b["$lte"] = v["max"];
                }
                else if (v["top"]) {
                  b["$lt"] = v["top"];
                }
                else if (v["endDate"]) {
                  b["$lte"] = v["endDate"];
                }
                else if (v["upper"]) {
                  b["$lt"] = v["upper"];
                }
                else if (v["endTime"]) {
                  b["$lt"] = v["endTime"];
                }
                if (v["min"]) {
                  b["$gte"] = v["min"];
                }
                else if (v["startTime"]) {
                  b["$gte"] = v["startTime"];
                }
                else if (v["startDate"]) {
                  b["$gte"] = v["startDate"];
                }
                else if (v["lower"]) {
                  b["$gt"] = v["lower"];
                }
                a[field] = b;
              }
            }
            else if (attr.type === "number" || attr.type === "integer") {
              if (isNumberRange(v)) {
                if (v["max"]) {
                  b["$lte"] = v["max"];
                }
                else if (v["top"]) {
                  b["$lt"] = v["top"];
                }
                else if (v["upper"]) {
                  b["$lt"] = v["upper"];
                }
                if (v["min"]) {
                  b["$gte"] = v["min"];
                }
                else if (v["lower"]) {
                  b["$gt"] = v["lower"];
                }
                a[field] = b;
              }
            }
          }
        }
      }
      else if (typeof v === "string" && v.length > 0) {
        a[field] = buildMatch(v, "");
      }
    }
  }
  if (excluding) {
    a._id = { $nin: excluding };
  }
  var c = [];
  if (q && attrs) {
    var qkeys = Object.keys(attrs);
    for (var _a = 0, qkeys_1 = qkeys; _a < qkeys_1.length; _a++) {
      var field = qkeys_1[_a];
      var attr = attrs[field];
      if (attr.q && (attr.type === undefined || attr.type === "string") && !ex.includes(field)) {
        c.push(buildQ(field, q, attr.operator));
      }
    }
  }
  if (c.length === 1) {
    var json = Object.assign(a, c[0]);
    return json;
  }
  else if (c.length > 1) {
    a.$or = c;
    return a;
  }
  else {
    return a;
  }
}
exports.buildQuery = buildQuery;
function isEmpty(s) {
  return !(s && s.length > 0);
}
exports.isEmpty = isEmpty;
function buildQ(field, q, match) {
  var o = {};
  if (match === "=") {
    o[field] = q;
  }
  else if (match === "like") {
    o[field] = new RegExp("\\w*" + q + "\\w*");
  }
  else {
    o[field] = new RegExp("^" + q);
  }
  return o;
}
exports.buildQ = buildQ;
function buildMatch(v, match) {
  if (match === "=") {
    return v;
  }
  else if (match === "like") {
    return new RegExp("\\w*" + v + "\\w*");
  }
  else {
    return new RegExp("^" + v);
  }
}
exports.buildMatch = buildMatch;
function isDateRange(obj) {
  var keys = Object.keys(obj);
  for (var _i = 0, keys_2 = keys; _i < keys_2.length; _i++) {
    var key = keys_2[_i];
    var v = obj[key];
    if (!(v instanceof Date)) {
      return false;
    }
  }
  return true;
}
exports.isDateRange = isDateRange;
function isNumberRange(obj) {
  var keys = Object.keys(obj);
  for (var _i = 0, keys_3 = keys; _i < keys_3.length; _i++) {
    var key = keys_3[_i];
    var v = obj[key];
    if (typeof v !== "number") {
      return false;
    }
  }
  return true;
}
exports.isNumberRange = isNumberRange;

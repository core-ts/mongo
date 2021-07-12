"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function buildQuery(s, attrs) {
  var a = {};
  var b = {};
  var keys = Object.keys(s);
  for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
    var key = keys_1[_i];
    var v = s[key];
    var field = key;
    if (v) {
      if (attrs) {
        var attr = attrs[key];
        if (attr) {
          field = (attr.field ? attr.field : key);
          if (attr.key) {
            field = '_id';
          }
          if (typeof v === 'string') {
            var exg = buildMatch(v, attr.match);
            a[field] = exg;
          }
          else if (v instanceof Date) {
            if (attr.match === 'max') {
              b['$lte'] = v;
            }
            else {
              b['$gte'] = v;
            }
            a[field] = b;
          }
          else if (typeof v === 'number') {
            if (attr.match === 'max') {
              b['$lte'] = v;
            }
            else {
              b['$gte'] = v;
            }
            a[field] = b;
          }
          else if (attr.type === 'ObjectId') {
            a[field] = v;
          }
          else if (typeof v === 'object') {
            if (attr.type === 'date' || attr.type === 'datetime') {
              if (isDateRange(v)) {
                if (v['max']) {
                  b['$lte'] = v['max'];
                }
                else if (v['endDate']) {
                  b['$lte'] = v['endDate'];
                }
                else if (v['upper']) {
                  b['$lt'] = v['upper'];
                }
                else if (v['endTime']) {
                  b['$lt'] = v['endTime'];
                }
                if (v['min']) {
                  b['$gte'] = v['min'];
                }
                else if (v['startTime']) {
                  b['$gte'] = v['startTime'];
                }
                else if (v['startDate']) {
                  b['$gte'] = v['startDate'];
                }
                else if (v['lower']) {
                  b['$gt'] = v['lower'];
                }
                a[field] = b;
              }
            }
            else if (attr.type === 'number' || attr.type === 'integer') {
              if (isNumberRange(v)) {
                if (v['max']) {
                  b['$lte'] = v['max'];
                }
                else if (v['upper']) {
                  b['$lt'] = v['upper'];
                }
                if (v['min']) {
                  b['$gte'] = v['min'];
                }
                else if (v['lower']) {
                  b['$gt'] = v['lower'];
                }
                a[field] = b;
              }
            }
          }
        }
        else if (typeof v === 'string' && v.length > 0) {
          a[field] = buildMatch(v, '');
        }
      }
      else if (typeof v === 'string' && v.length > 0) {
        a[field] = buildMatch(v, '');
      }
    }
  }
  var json = Object.assign({}, a);
  return json;
}
exports.buildQuery = buildQuery;
function buildMatch(v, match) {
  if (match === 'equal') {
    return v;
  }
  else if (match === 'prefix') {
    return new RegExp("^" + v);
  }
  else {
    return new RegExp("\\w*" + v + "\\w*");
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
    if (typeof v !== 'number') {
      return false;
    }
  }
  return true;
}
exports.isNumberRange = isNumberRange;

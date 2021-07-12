"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongo_1 = require("./mongo");
function buildSearchResult(collection, query, sort, limit, skipOrRef, fields, idName, map, mp) {
  var project = mongo_1.buildProject(fields);
  if (limit) {
    var skip_1 = 0;
    if (skipOrRef && typeof skipOrRef === 'number' && skipOrRef >= 0) {
      skip_1 = skipOrRef;
    }
    var p1 = mongo_1.find(collection, query, sort, limit, skip_1, project);
    var p2 = mongo_1.count(collection, query);
    return Promise.all([p1, p2]).then(function (values) {
      var list2 = values[0], total = values[1];
      var list = list2;
      if (idName && idName !== '') {
        for (var _i = 0, list_1 = list; _i < list_1.length; _i++) {
          var obj = list_1[_i];
          obj[idName] = obj['_id'];
          delete obj['_id'];
        }
      }
      if (map) {
        list = mongo_1.mapArray(list, map);
      }
      if (mp) {
        list = list.map(function (o) { return mp(o); });
      }
      var r = { list: list, total: total, last: skip_1 + list.length >= total };
      return r;
    });
  }
  else {
    return mongo_1.find(collection, query, sort, undefined, undefined, project).then(function (list) {
      if (idName && idName !== '') {
        for (var _i = 0, list_2 = list; _i < list_2.length; _i++) {
          var obj = list_2[_i];
          obj[idName] = obj['_id'];
          delete obj['_id'];
        }
      }
      if (map) {
        list = mongo_1.mapArray(list, map);
      }
      if (mp) {
        list = list.map(function (o) { return mp(o); });
      }
      var r = { list: list };
      return r;
    });
  }
}
exports.buildSearchResult = buildSearchResult;
function buildSort(sort, map) {
  var sort2 = {};
  if (sort && sort.length > 0) {
    var sorts = sort.split(',');
    for (var _i = 0, sorts_1 = sorts; _i < sorts_1.length; _i++) {
      var st = sorts_1[_i];
      if (st.length > 0) {
        var field = st;
        var tp = st.charAt(0);
        if (tp === '-' || tp === '+') {
          field = st.substr(1);
        }
        var sortType = (tp === '-' ? -1 : 1);
        sort2[getField(field.trim(), map)] = sortType;
      }
    }
  }
  return sort2;
}
exports.buildSort = buildSort;
function getField(name, map) {
  if (!map) {
    return name;
  }
  var x = map[name];
  if (!x) {
    return name;
  }
  if (typeof x === 'string') {
    return x;
  }
  if (x.field) {
    return x.field;
  }
  return name;
}
exports.getField = getField;

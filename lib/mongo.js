"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongodb_1 = require("mongodb");
function connectToDb(uri, db, authSource, maxPoolSize) {
  if (authSource === void 0) { authSource = 'admin'; }
  if (maxPoolSize === void 0) { maxPoolSize = 5; }
  var options = { authSource: authSource, maxPoolSize: maxPoolSize };
  return connect(uri, options).then(function (client) { return client.db(db); });
}
exports.connectToDb = connectToDb;
function connect(uri, options) {
  return mongodb_1.MongoClient.connect(uri, options).then(function (client) {
    console.log('Connected successfully to MongoDB.');
    return client;
  }).catch(function (err) {
    console.log('Failed to connect to MongoDB.');
    throw err;
  });
}
exports.connect = connect;
function findOne(collection, query, idName, m) {
  return _findOne(collection, query).then(function (obj) { return mapOne(obj, idName, m); });
}
exports.findOne = findOne;
function _findOne(collection, query) {
  return collection.findOne(query).then(function (item) { return item; });
}
function getFields(fields, all) {
  if (!fields || fields.length === 0) {
    return undefined;
  }
  var ex = [];
  if (all) {
    for (var _i = 0, fields_1 = fields; _i < fields_1.length; _i++) {
      var s = fields_1[_i];
      if (all.includes(s)) {
        ex.push(s);
      }
    }
    if (ex.length === 0) {
      return undefined;
    }
    else {
      return ex;
    }
  }
  else {
    return fields;
  }
}
exports.getFields = getFields;
function valueOf(collection, field, values, noSort) {
  var query = {};
  query[field] = { $in: values };
  var project = {};
  project[field] = 1;
  var sort;
  if (!noSort) {
    sort = {};
    sort[field] = 1;
  }
  return find(collection, query, sort, undefined, undefined, project).then(function (v) {
    var r = [];
    for (var _i = 0, v_1 = v; _i < v_1.length; _i++) {
      var s = v_1[_i];
      r.push(s[field]);
    }
    return r;
  });
}
exports.valueOf = valueOf;
function findAllWithMap(collection, query, id, m, sort, project) {
  return findWithMap(collection, query, id, m, sort, undefined, undefined, project);
}
exports.findAllWithMap = findAllWithMap;
function findWithMap(collection, query, id, m, sort, limit, skip, project) {
  return find(collection, query, sort, limit, skip, project).then(function (objects) {
    for (var _i = 0, objects_1 = objects; _i < objects_1.length; _i++) {
      var obj = objects_1[_i];
      if (id && id !== '') {
        obj[id] = obj['_id'];
        delete obj['_id'];
      }
    }
    if (!m) {
      return objects;
    }
    else {
      return mapArray(objects, m);
    }
  });
}
exports.findWithMap = findWithMap;
function findAll(collection, query, sort, project) {
  return find(collection, query, sort, undefined, undefined, project);
}
exports.findAll = findAll;
function find(collection, query, sort, limit, skip, project) {
  var cursor = collection.find(query);
  if (sort) {
    cursor = cursor.sort(sort);
  }
  if (limit) {
    cursor = cursor.limit(limit);
  }
  if (skip) {
    cursor = cursor.skip(skip);
  }
  if (project) {
    cursor = cursor.project(project);
  }
  return cursor.toArray().then(function (items) { return items; });
}
exports.find = find;
function insert(collection, obj, id, handleDuplicate, toBson, fromBson) {
  obj = revertOne(obj, id);
  if (toBson) {
    obj = toBson(obj);
  }
  return collection.insertOne(obj).then(function (value) {
    mapOne(obj, id);
    if (toBson && fromBson) {
      fromBson(obj);
    }
    return value.acknowledged ? 1 : 0;
  }).catch(function (err) {
    mapOne(obj, id);
    if (toBson && fromBson) {
      fromBson(obj);
    }
    if (handleDuplicate && err && err.errmsg) {
      if (err.errmsg.indexOf('duplicate key error collection:') >= 0) {
        if (err.errmsg.indexOf('dup key: { _id:') >= 0) {
          return 0;
        }
        else {
          return -1;
        }
      }
    }
    throw err;
  });
}
exports.insert = insert;
function insertMany(collection, objs, id) {
  return collection.insertMany(revertArray(objs, id)).then(function (value) {
    return value.insertedCount;
  }).catch(function (err) {
    if (err) {
      if (err.errmsg.indexOf('duplicate key error collection:') >= 0) {
        if (err.errmsg.indexOf('dup key: { _id:') >= 0) {
          return 0;
        }
        else {
          return -1;
        }
      }
    }
    throw err;
  });
}
exports.insertMany = insertMany;
function patch(collection, obj, id, toBson, fromBson) {
  revertOne(obj, id);
  if (!obj['_id']) {
    throw new Error('Cannot patch an object that do not have _id field: ' + JSON.stringify(obj));
  }
  if (toBson) {
    obj = toBson(obj);
  }
  return collection.findOneAndUpdate({ _id: obj['_id'] }, { $set: obj }).then(function (res) {
    mapOne(obj, id);
    if (toBson && fromBson) {
      fromBson(obj);
    }
    return getAffectedRow(res);
  });
}
exports.patch = patch;
function getAffectedRow(res) {
  if (res.lastErrorObject) {
    return res.lastErrorObject.n;
  }
  else {
    return res.ok;
  }
}
exports.getAffectedRow = getAffectedRow;
function patchWithFilter(collection, obj, filter, toBson, fromBson) {
  if (toBson) {
    obj = toBson(obj);
  }
  return collection.findOneAndUpdate(filter, { $set: obj }).then(function (res) {
    if (toBson && fromBson) {
      fromBson(obj);
    }
    return getAffectedRow(res);
  });
}
exports.patchWithFilter = patchWithFilter;
function update(collection, obj, id, toBson, fromBson) {
  revertOne(obj, id);
  if (!obj['_id']) {
    throw new Error('Cannot update an object that do not have _id field: ' + JSON.stringify(obj));
  }
  if (toBson) {
    obj = toBson(obj);
  }
  return collection.findOneAndReplace({ _id: obj['_id'] }, obj).then(function (res) {
    mapOne(obj, id);
    if (toBson && fromBson) {
      fromBson(obj);
    }
    return getAffectedRow(res);
  });
}
exports.update = update;
function updateWithFilter(collection, obj, filter, toBson, fromBson) {
  if (toBson) {
    obj = toBson(obj);
  }
  return collection.findOneAndReplace(filter, obj).then(function (res) {
    if (toBson && fromBson) {
      fromBson(obj);
    }
    return getAffectedRow(res);
  });
}
exports.updateWithFilter = updateWithFilter;
function updateFields(collection, object, arr, id, toBson, fromBson) {
  var obj = revertOne(object, id);
  if (!obj['_id']) {
    throw new Error('Cannot update an object that do not have _id field: ' + JSON.stringify(obj));
  }
  if (toBson) {
    obj = toBson(obj);
  }
  return collection.findOneAndUpdate({ _id: obj['_id'] }, { $push: arr }).then(function (res) {
    if (res.value) {
      if (fromBson) {
        return fromBson(res.value);
      }
      else {
        return res.value;
      }
    }
    else {
      return object;
    }
  });
}
exports.updateFields = updateFields;
function updateByQuery(collection, query, setValue) {
  return collection.findOneAndUpdate(query, { $set: setValue }).then(function (res) {
    if (res.value) {
      return res.value;
    }
    else {
      return setValue;
    }
  });
}
exports.updateByQuery = updateByQuery;
function updateMany(collection, objects, id) {
  var operations = [];
  revertArray(objects, id);
  for (var _i = 0, objects_2 = objects; _i < objects_2.length; _i++) {
    var object = objects_2[_i];
    var obj = object;
    if (obj['_id']) {
      operations.push({
        updateOne: {
          filter: { _id: obj['_id'] },
          update: { $set: obj },
        },
      });
    }
  }
  if (operations.length === 0) {
    return Promise.resolve(0);
  }
  return collection.bulkWrite(operations).then(function (res) { return res.modifiedCount; });
}
exports.updateMany = updateMany;
function upsert(collection, object, id, toBson, fromBson) {
  var obj = revertOne(object, id);
  if (obj['_id']) {
    if (toBson) {
      obj = toBson(obj);
    }
    return collection.findOneAndUpdate({ _id: obj['_id'] }, { $set: obj }).then(function (res) {
      if (id) {
        mapOne(obj, id);
      }
      if (toBson && fromBson) {
        fromBson(obj);
      }
      return getAffectedRow(res);
    });
  }
  else {
    return collection.insertOne(object).then(function (r) {
      var v = r['insertedId'];
      if (v && id && id.length > 0) {
        object[id] = v;
      }
      if (fromBson) {
        fromBson(object);
      }
      return r.acknowledged ? 1 : 0;
    });
  }
}
exports.upsert = upsert;
function upsertWithFilter(collection, obj, filter, toBson, fromBson) {
  if (toBson) {
    obj = toBson(obj);
  }
  var opts = { upsert: true };
  return collection.findOneAndUpdate(filter, { $set: obj }, opts).then(function (res) {
    if (toBson && fromBson) {
      fromBson(obj);
    }
    return getAffectedRow(res);
  });
}
exports.upsertWithFilter = upsertWithFilter;
function upsertMany(collection, objects, id) {
  var operations = [];
  revertArray(objects, id);
  for (var _i = 0, objects_3 = objects; _i < objects_3.length; _i++) {
    var object = objects_3[_i];
    if (object['_id']) {
      operations.push({
        updateOne: {
          filter: { _id: object['_id'] },
          update: { $set: object },
          upsert: true,
        },
      });
    }
    else {
      operations.push({
        insertOne: {
          document: object,
        },
      });
    }
  }
  return collection.bulkWrite(operations).then(function (res) {
    return res.insertedCount + res.modifiedCount + res.upsertedCount;
  });
}
exports.upsertMany = upsertMany;
function deleteMany(collection, query) {
  return collection.deleteMany(query).then(function (res) { return res.deletedCount; });
}
exports.deleteMany = deleteMany;
function deleteOne(collection, query) {
  return collection.deleteOne(query).then(function (res) { return res.deletedCount; });
}
exports.deleteOne = deleteOne;
function deleteById(collection, _id) {
  return collection.deleteOne({ _id: _id }).then(function (res) { return res.deletedCount; });
}
exports.deleteById = deleteById;
function deleteByIds(collection, _ids) {
  if (!_ids || _ids.length === 0) {
    return Promise.resolve(0);
  }
  var operations = [{
    deleteMany: {
      filter: {
        _id: {
          $in: _ids,
        },
      },
    },
  },
  ];
  return collection.bulkWrite(operations).then(function (res) { return res.deletedCount; });
}
exports.deleteByIds = deleteByIds;
function deleteFields(collection, object, filter, id) {
  var obj = revertOne(object, id);
  if (!obj['_id']) {
    throw new Error('Cannot delete an object that do not have _id field: ' + JSON.stringify(obj));
  }
  var ft = { $pull: filter };
  return collection.findOneAndUpdate({ _id: obj['_id'] }, ft).then(function (res) { return res.ok; });
}
exports.deleteFields = deleteFields;
function count(collection, query) {
  return collection.countDocuments(query);
}
exports.count = count;
function findWithAggregate(collection, pipeline) {
  var res = collection.aggregate(pipeline);
  return res.toArray();
}
exports.findWithAggregate = findWithAggregate;
function revertOne(obj, idName) {
  if (idName && idName.length > 0) {
    obj['_id'] = obj[idName];
    delete obj[idName];
  }
  return obj;
}
exports.revertOne = revertOne;
function revertArray(objs, id) {
  if (!objs || !id) {
    return objs;
  }
  if (id && id.length > 0) {
    var length_1 = objs.length;
    for (var i = 0; i < length_1; i++) {
      var obj = objs[i];
      obj['_id'] = obj[id];
      delete obj[id];
    }
  }
  return objs;
}
exports.revertArray = revertArray;
function mapOne(obj, id, m) {
  if (!obj || !id) {
    return obj;
  }
  if (id && id.length > 0) {
    obj[id] = obj['_id'];
    delete obj['_id'];
  }
  if (m) {
    return _mapOne(obj, m);
  }
  else {
    return obj;
  }
}
exports.mapOne = mapOne;
function _mapOne(obj, m) {
  var obj2 = {};
  var keys = Object.keys(obj);
  for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
    var key = keys_1[_i];
    var k0 = m[key];
    if (!k0) {
      k0 = key;
    }
    obj2[k0] = obj[key];
  }
  return obj2;
}
exports._mapOne = _mapOne;
function map(obj, m) {
  if (!m) {
    return obj;
  }
  var mkeys = Object.keys(m);
  if (mkeys.length === 0) {
    return obj;
  }
  var obj2 = {};
  var keys = Object.keys(obj);
  for (var _i = 0, keys_2 = keys; _i < keys_2.length; _i++) {
    var key = keys_2[_i];
    var k0 = m[key];
    if (!k0) {
      k0 = key;
    }
    obj2[k0] = obj[key];
  }
  return obj2;
}
exports.map = map;
function mapArray(results, m) {
  if (!m) {
    return results;
  }
  var mkeys = Object.keys(m);
  if (mkeys.length === 0) {
    return results;
  }
  var objs = [];
  var length = results.length;
  for (var i = 0; i < length; i++) {
    var obj = results[i];
    var obj2 = {};
    var keys = Object.keys(obj);
    for (var _i = 0, keys_3 = keys; _i < keys_3.length; _i++) {
      var key = keys_3[_i];
      var k0 = m[key];
      if (!k0) {
        k0 = key;
      }
      obj2[k0] = obj[key];
    }
    objs.push(obj2);
  }
  return objs;
}
exports.mapArray = mapArray;
function buildProject(fields, all, mp, notIncludeId) {
  if (!fields || fields.length === 0) {
    return undefined;
  }
  var p = {};
  if (mp) {
    if (all) {
      for (var _i = 0, fields_2 = fields; _i < fields_2.length; _i++) {
        var s = fields_2[_i];
        if (all.includes(s)) {
          var s2 = mp[s];
          if (s2) {
            p[s2] = 1;
          }
          else {
            p[s] = 1;
          }
        }
      }
    }
    else {
      for (var _a = 0, fields_3 = fields; _a < fields_3.length; _a++) {
        var s = fields_3[_a];
        var s2 = mp[s];
        if (s2) {
          p[s2] = 1;
        }
        else {
          p[s] = 1;
        }
      }
    }
  }
  else {
    if (all) {
      for (var _b = 0, fields_4 = fields; _b < fields_4.length; _b++) {
        var s = fields_4[_b];
        if (all.includes(s)) {
          p[s] = 1;
        }
      }
    }
    else {
      for (var _c = 0, fields_5 = fields; _c < fields_5.length; _c++) {
        var s = fields_5[_c];
        p[s] = 1;
      }
    }
  }
  if (!notIncludeId) {
    p['_id'] = 1;
  }
  return p;
}
exports.buildProject = buildProject;
function getMapField(name, mp) {
  if (!mp) {
    return name;
  }
  var x = mp[name];
  if (!x) {
    return name;
  }
  if (typeof x === 'string') {
    return x;
  }
  return name;
}
exports.getMapField = getMapField;
function fromPoints(s, geo, latitude, longitude) {
  var g = (geo ? geo : 'geo');
  var lat = (latitude ? latitude : 'latitude');
  var long = (longitude ? longitude : 'longitude');
  return s.map(function (o) { return fromPoint(o, g, lat, long); });
}
exports.fromPoints = fromPoints;
function fromPoint(v, geo, latitude, longitude) {
  if (!v) {
    return v;
  }
  var point = v[geo];
  if (!point) {
    return v;
  }
  var coordinates = point['coordinates'];
  if (!coordinates || !Array.isArray(coordinates)) {
    return v;
  }
  if (coordinates.length < 2) {
    return v;
  }
  var lat = coordinates[0];
  var long = coordinates[1];
  if (typeof lat !== 'number' || typeof long !== 'number') {
    return v;
  }
  v[latitude] = lat;
  v[longitude] = long;
  delete v[geo];
  return v;
}
exports.fromPoint = fromPoint;
function toPoints(s, geo, latitude, longitude) {
  var g = (geo ? geo : 'geo');
  var lat = (latitude ? latitude : 'latitude');
  var long = (longitude ? longitude : 'longitude');
  return s.map(function (o) { return toPoint(o, g, lat, long); });
}
exports.toPoints = toPoints;
function toPoint(v, geo, latitude, longitude) {
  if (!v) {
    return v;
  }
  var lat = v[latitude];
  var long = v[longitude];
  if (typeof lat !== 'number' || typeof long !== 'number') {
    return v;
  }
  var point = { type: 'Point', coordinates: [lat, long] };
  v[geo] = point;
  delete v[latitude];
  delete v[longitude];
  return v;
}
exports.toPoint = toPoint;
var PointMapper = (function () {
  function PointMapper(geo, latitude, longitude) {
    this.geo = (geo ? geo : 'geo');
    this.latitude = (latitude ? latitude : 'latitude');
    this.longitude = (longitude ? longitude : 'longitude');
    this.fromPoint = this.fromPoint.bind(this);
    this.toPoint = this.toPoint.bind(this);
  }
  PointMapper.prototype.fromPoint = function (model) {
    return fromPoint(model, this.geo, this.latitude, this.longitude);
  };
  PointMapper.prototype.toPoint = function (model) {
    return toPoint(model, this.geo, this.latitude, this.longitude);
  };
  return PointMapper;
}());
exports.PointMapper = PointMapper;

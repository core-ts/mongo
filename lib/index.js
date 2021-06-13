"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
  function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
  return new (P || (P = Promise))(function (resolve, reject) {
    function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
    function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
    function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
  var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
  return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
  function verb(n) { return function (v) { return step([n, v]); }; }
  function step(op) {
    if (f) throw new TypeError("Generator is already executing.");
    while (_) try {
      if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
      if (y = 0, t) op = [op[0] & 2, t.value];
      switch (op[0]) {
        case 0: case 1: t = op; break;
        case 4: _.label++; return { value: op[1], done: false };
        case 5: _.label++; y = op[1]; op = [0]; continue;
        case 7: op = _.ops.pop(); _.trys.pop(); continue;
        default:
          if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
          if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
          if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
          if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
          if (t[2]) _.ops.pop();
          _.trys.pop(); continue;
      }
      op = body.call(thisArg, _);
    } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
    if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
  }
};
Object.defineProperty(exports, "__esModule", { value: true });
var mongodb_1 = require("mongodb");
function connectToDb(uri, db, authSource, poolSize) {
  if (authSource === void 0) { authSource = 'admin'; }
  if (poolSize === void 0) { poolSize = 5; }
  return __awaiter(this, void 0, void 0, function () {
    var options, client;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          options = { useNewUrlParser: true, authSource: authSource, poolSize: poolSize, useUnifiedTopology: true };
          return [4, connect(uri, options)];
        case 1:
          client = _a.sent();
          return [2, client.db(db)];
      }
    });
  });
}
exports.connectToDb = connectToDb;
function connect(uri, options) {
  return new Promise(function (resolve, reject) {
    mongodb_1.MongoClient.connect(uri, options, function (err, client) {
      if (err) {
        console.log('Failed to connect to MongoDB.');
        reject(err);
      }
      else {
        console.log('Connected successfully to MongoDB.');
        resolve(client);
      }
    });
  });
}
exports.connect = connect;
function findOne(collection, query, idName, m) {
  return _findOne(collection, query).then(function (obj) { return mapOne(obj, idName, m); });
}
exports.findOne = findOne;
function _findOne(collection, query) {
  return new Promise(function (resolve, reject) {
    collection.findOne(query, function (err, item) { return err ? reject(err) : resolve(item); });
  });
}
function findWithMap(collection, query, idName, m, sort, limit, skip, project) {
  return __awaiter(this, void 0, void 0, function () {
    var objects, _i, objects_1, obj;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0: return [4, find(collection, query, sort, limit, skip, project)];
        case 1:
          objects = _a.sent();
          for (_i = 0, objects_1 = objects; _i < objects_1.length; _i++) {
            obj = objects_1[_i];
            if (idName && idName !== '') {
              obj[idName] = obj['_id'];
            }
            delete obj['_id'];
          }
          if (!!m) return [3, 2];
          return [2, objects];
        case 2: return [4, mapArray(objects, m)];
        case 3: return [2, _a.sent()];
      }
    });
  });
}
exports.findWithMap = findWithMap;
function find(collection, query, sort, limit, skip, project) {
  return new Promise(function (resolve, reject) {
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
    cursor.toArray(function (err, items) { return err ? reject(err) : resolve(items); });
  });
}
exports.find = find;
function insert(collection, obj, idName) {
  return __awaiter(this, void 0, void 0, function () {
    var value, err_1;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          _a.trys.push([0, 2, , 3]);
          return [4, collection.insertOne(revertOne(obj, idName))];
        case 1:
          value = _a.sent();
          mapOne(obj, idName);
          return [2, value.insertedCount];
        case 2:
          err_1 = _a.sent();
          if (err_1) {
            if (err_1.errmsg.indexOf('duplicate key error collection:') >= 0) {
              if (err_1.errmsg.indexOf('dup key: { _id:') >= 0) {
                return [2, 0];
              }
              else {
                throw -1;
              }
            }
          }
          throw err_1;
        case 3: return [2];
      }
    });
  });
}
exports.insert = insert;
function insertMany(collection, objs, idName) {
  return __awaiter(this, void 0, void 0, function () {
    var value, i, err_2;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          _a.trys.push([0, 2, , 3]);
          return [4, collection.insertMany(revertArray(objs))];
        case 1:
          value = _a.sent();
          if (idName) {
            for (i = 0; i < value.ops.length; i++) {
              objs[i][idName] = value.ops[i]['_id'];
              delete objs[i]['_id'];
            }
          }
          return [2, value.insertedCount];
        case 2:
          err_2 = _a.sent();
          if (err_2) {
            if (err_2.errmsg.indexOf('duplicate key error collection:') >= 0) {
              if (err_2.errmsg.indexOf('dup key: { _id:') >= 0) {
                return [2, 0];
              }
              else {
                return [2, -1];
              }
            }
          }
          throw err_2;
        case 3: return [2];
      }
    });
  });
}
exports.insertMany = insertMany;
function patch(collection, obj, idName) {
  return new Promise((function (resolve, reject) {
    revertOne(obj, idName);
    if (!obj['_id']) {
      return reject(new Error('Cannot updateOne an Object that do not have _id field.'));
    }
    collection.findOneAndUpdate({ _id: obj['_id'] }, { $set: obj }, { returnOriginal: false }, function (err, result) {
      if (err) {
        reject(err);
      }
      else {
        mapOne(obj, idName);
        resolve(result.ok ? result.ok : 1);
      }
    });
  }));
}
exports.patch = patch;
function update(collection, obj, idName) {
  return new Promise((function (resolve, reject) {
    revertOne(obj, idName);
    if (!obj['_id']) {
      return reject(new Error('Cannot updateOne an Object that do not have _id field.'));
    }
    collection.findOneAndReplace({ _id: obj['_id'] }, obj, { returnOriginal: false }, function (err, result) {
      if (err) {
        reject(err);
      }
      else {
        mapOne(obj, idName);
        resolve(result.ok ? result.ok : 1);
      }
    });
  }));
}
exports.update = update;
function updateFields(collection, object, arr, idName) {
  return new Promise((function (resolve, reject) {
    var obj = revertOne(object, idName);
    if (!obj['_id']) {
      return reject(new Error('Cannot updateOne an Object that do not have _id field.'));
    }
    collection.findOneAndUpdate({ _id: obj['_id'] }, { $push: arr }, { returnOriginal: false }, function (err, result) {
      if (err) {
        return reject(err);
      }
      else {
        return resolve(result.value ? result.value : null);
      }
    });
  }));
}
exports.updateFields = updateFields;
function updateByQuery(collection, query, setValue) {
  return new Promise((function (resolve, reject) {
    collection.findOneAndUpdate(query, { $set: setValue }, { returnOriginal: false }, function (err, result) {
      if (err) {
        return reject(err);
      }
      else {
        return resolve(result.value ? result.value : null);
      }
    });
  }));
}
exports.updateByQuery = updateByQuery;
function updateMany(collection, objects, idName) {
  return new Promise((function (resolve, reject) {
    var operations = [];
    revertArray(objects, idName);
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
      return resolve(0);
    }
    collection.bulkWrite(operations, function (err, result) {
      if (err) {
        return reject(err);
      }
      var i = 0;
      if (result.modifiedCount) {
        i = i + result.modifiedCount;
      }
      if (result.upsertedCount) {
        i = i + result.upsertedCount;
      }
      if (result.matchedCount) {
        i = i + result.matchedCount;
      }
      return resolve(i);
    });
  }));
}
exports.updateMany = updateMany;
function upsert(collection, object, idName) {
  var obj = revertOne(object, idName);
  if (obj['_id']) {
    return new Promise((function (resolve, reject) {
      collection.findOneAndUpdate({ _id: obj['_id'] }, { $set: obj }, {
        upsert: true,
        returnOriginal: false,
      }, function (err, result) {
        if (err) {
          reject(err);
        }
        else {
          if (idName) {
            mapOne(obj, idName);
          }
          resolve(result.ok ? result.ok : 1);
        }
      });
    }));
  }
  else {
    return insert(collection, object);
  }
}
exports.upsert = upsert;
function upsertMany(collection, objects, idName) {
  return new Promise((function (resolve, reject) {
    var operations = [];
    revertArray(objects, idName);
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
    collection.bulkWrite(operations, function (err, result) {
      if (err) {
        return reject(err);
      }
      var i = 0;
      if (result.modifiedCount) {
        i = i + result.modifiedCount;
      }
      if (result.upsertedCount) {
        i = i + result.upsertedCount;
      }
      if (result.matchedCount) {
        i = i + result.matchedCount;
      }
      return resolve(i);
    });
  }));
}
exports.upsertMany = upsertMany;
function deleteMany(collection, query) {
  return new Promise((function (resolve, reject) {
    collection.deleteMany(query, function (err, result) { return err ? reject(err) : resolve(result.deletedCount ? result.deletedCount : 1); });
  }));
}
exports.deleteMany = deleteMany;
function deleteOne(collection, query) {
  return new Promise((function (resolve, reject) {
    collection.deleteOne(query, function (err, result) { return err ? reject(err) : resolve(result.deletedCount ? result.deletedCount : 1); });
  }));
}
exports.deleteOne = deleteOne;
function deleteById(collection, _id) {
  return new Promise((function (resolve, reject) {
    if (!_id) {
      return resolve(0);
    }
    collection.deleteOne({ _id: _id }, function (err, result) { return err ? reject(err) : resolve(result.deletedCount ? result.deletedCount : 1); });
  }));
}
exports.deleteById = deleteById;
function deleteByIds(collection, _ids) {
  return new Promise((function (resolve, reject) {
    if (!_ids || _ids.length === 0) {
      return resolve(0);
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
    collection.bulkWrite(operations, function (err, result) {
      return err ? reject(err) : resolve(result.deletedCount ? result.deletedCount : 1);
    });
  }));
}
exports.deleteByIds = deleteByIds;
function deleteFields(collection, object, filter, idName) {
  return new Promise((function (resolve, reject) {
    var obj = revertOne(object, idName);
    if (!obj['_id']) {
      return reject(new Error('Cannot updateOne an Object that do not have _id field.'));
    }
    collection.findOneAndUpdate({ _id: obj['_id'] }, { $pull: filter }, {
      returnOriginal: false,
    }, function (err, result) {
      if (err) {
        return reject(err);
      }
      else {
        return resolve(result.ok ? result.ok : 1);
      }
    });
  }));
}
exports.deleteFields = deleteFields;
function count(collection, query) {
  return new Promise(function (resolve, reject) {
    collection.countDocuments(query, function (err, result) { return err ? reject(err) : resolve(result); });
  });
}
exports.count = count;
function findWithAggregate(collection, query) {
  return new Promise((function (resolve, reject) {
    collection.aggregate(query, function (error, result) {
      result.toArray(function (err, items) { return err ? reject(err) : resolve(items ? items : []); });
    });
  }));
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
function revertArray(objs, idName) {
  if (!objs || !idName) {
    return objs;
  }
  if (idName && idName.length > 0) {
    var length_1 = objs.length;
    for (var i = 0; i < length_1; i++) {
      var obj = objs[i];
      obj['_id'] = obj[idName];
      delete obj[idName];
    }
  }
  return objs;
}
exports.revertArray = revertArray;
function mapOne(obj, idName, m) {
  if (!obj || !idName) {
    return obj;
  }
  if (idName && idName.length > 0) {
    obj[idName] = obj['_id'];
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
function mapArray(results, m) {
  if (!m) {
    return results;
  }
  var objs = [];
  var length = results.length;
  for (var i = 0; i < length; i++) {
    var obj = results[i];
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
    objs.push(obj2);
  }
  return objs;
}
exports.mapArray = mapArray;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getCollectionName(model, collectionName) {
  var n = (collectionName ? collectionName : (model.collection ? model.collection : (model.source ? model.source : model.name)));
  return (n ? n : '');
}
exports.getCollectionName = getCollectionName;
function getVersion(attributes) {
  if (!attributes) {
    return undefined;
  }
  var keys = Object.keys(attributes);
  for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
    var key = keys_1[_i];
    var attr = attributes[key];
    if (attr.version === true) {
      return key;
    }
  }
  return undefined;
}
exports.getVersion = getVersion;
function build(attributes) {
  var sub = { id: 'id' };
  if (!attributes) {
    return sub;
  }
  var keys = Object.keys(attributes);
  for (var _i = 0, keys_2 = keys; _i < keys_2.length; _i++) {
    var key = keys_2[_i];
    var attr = attributes[key];
    if (attr.key === true) {
      var meta = { id: key };
      meta.objectId = (attr.type === 'ObjectId' ? true : false);
      meta.map = buildMap(attributes);
      return meta;
    }
  }
  return sub;
}
exports.build = build;
function buildMap(attributes) {
  if (!attributes) {
    return undefined;
  }
  var map = {};
  var keys = Object.keys(attributes);
  var c = 0;
  for (var _i = 0, keys_3 = keys; _i < keys_3.length; _i++) {
    var key = keys_3[_i];
    var attr = attributes[key];
    if (attr) {
      attr.name = key;
      if (attr.field && attr.field.length > 0 && attr.field !== key) {
        map[attr.field] = key;
        c = c + 1;
      }
    }
  }
  return (c > 0 ? map : undefined);
}
exports.buildMap = buildMap;

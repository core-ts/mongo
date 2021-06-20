"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function build(model) {
  var sub = { id: 'id' };
  if (!model) {
    return sub;
  }
  var keys = Object.keys(model.attributes);
  for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
    var key = keys_1[_i];
    var attr = model.attributes[key];
    if (attr) {
      if (attr.key === true) {
        var meta = { id: key };
        meta.objectId = (attr.type === 'ObjectId' ? true : false);
        meta.map = buildMap(model);
        return meta;
      }
    }
  }
  return sub;
}
exports.build = build;
function buildMap(model) {
  var map = {};
  var keys = Object.keys(model.attributes);
  var c = 0;
  for (var _i = 0, keys_2 = keys; _i < keys_2.length; _i++) {
    var key = keys_2[_i];
    var attr = model.attributes[key];
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

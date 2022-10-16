"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function initializeAuditLogConfig(conf) {
  if (conf) {
    return conf;
  }
  else {
    var c = {
      user: 'user',
      ip: 'ip',
      resource: 'resource',
      action: 'action',
      timestamp: 'timestamp',
      status: 'status',
      remark: 'remark'
    };
    return c;
  }
}
exports.initializeAuditLogConfig = initializeAuditLogConfig;
var AuditLogWriter = (function () {
  function AuditLogWriter(db, collectionName, generate, config) {
    this.generate = generate;
    this.collection = db.collection(collectionName);
    this.config = initializeAuditLogConfig(config);
    this.write = this.write.bind(this);
  }
  AuditLogWriter.prototype.write = function (user, ip, resource, action, success, remark) {
    var log = {};
    if (this.generate) {
      log._id = this.generate();
    }
    var c = this.config;
    log[c.user] = user;
    log[c.ip] = ip;
    log[c.resource] = resource;
    log[c.action] = action;
    log[c.status] = success;
    if (remark && remark.length > 0) {
      log[c.remark] = remark;
    }
    return this.collection.insertOne(log).then(function (r) { return r.acknowledged ? 1 : 0; });
  };
  return AuditLogWriter;
}());
exports.AuditLogWriter = AuditLogWriter;

import { MongoLoader } from "./MongoLoader"
import { Repository, MongoSearchWriter } from "./MongoSearchWriter"
import { MongoWriter } from "./MongoWriter"
import { SearchBuilder } from "./SearchBuilder"

import { MongoLowCodeService } from "./MongoLowCodeService"
export * from "./MongoLowCodeService"
export { MongoLowCodeService as MongoLowCodeRepository }

export {
  SearchBuilder as SearchRepository,
  SearchBuilder as MongoSearchRepository,
  MongoWriter as GenericRepository,
  MongoWriter as CRUDRepository,
  Repository as MongoRepository,
  MongoWriter as GenericService,
  MongoLoader as LoadRepository,
  MongoLoader as LoadService,
  MongoWriter as MongoGenericRepository,
  MongoWriter as MongoGenericService,
  MongoLoader as MongoLoadRepository,
  MongoLoader as MongoLoadService,
  MongoLoader as MongoViewRepository,
  MongoLoader as MongoViewService,
  MongoLoader as ViewRepository,
  MongoLoader as ViewService,
}

export {
  MongoSearchWriter as GenericSearchRepository,
  MongoSearchWriter as GenericSearchService,
  MongoSearchWriter as MongoGenericSearchRepository,
  MongoSearchWriter as MongoGenericSearchService,
  MongoSearchWriter as MongoService,
  MongoSearchWriter as Service,
}

export * from "./AuditLogWriter"
export * from "./batch"
export * from "./FieldLoader"
export * from "./metadata"
export * from "./mongo"
export * from "./MongoChecker"
export * from "./MongoLoader"
export * from "./MongoWriter"
export * from "./one"
export * from "./query"
export * from "./search"
export * from "./SearchBuilder"

import { Db } from "mongodb"

export interface AnyMap {
  [key: string]: any
}
export interface HealthChecker {
  name(): string
  build(data: AnyMap, error: any): AnyMap
  check(): Promise<AnyMap>
}

export class MongoChecker implements HealthChecker {
  protected service: string
  constructor(
    protected readonly db: Db,
    service?: string,
    protected readonly timeout = 4500,
  ) {
    this.service = service ? service : "mongodb"
  }

  name(): string {
    return this.service
  }

  build(data: AnyMap, error: any): AnyMap {
    if (error) {
      data.status = "DOWN"
      data.error = error.message || String(error)
    } else {
      data.status = "UP"
    }
    return data
  }

  async check(): Promise<AnyMap> {
    const start = Date.now()

    try {
      await Promise.race([
        this.db.admin().ping(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("MongoDB health check timeout")), this.timeout)),
      ])

      return this.build(
        {
          responseTime: Date.now() - start,
        },
        null,
      )
    } catch (err) {
      return this.build(
        {
          responseTime: Date.now() - start,
        },
        err,
      )
    }
  }
}

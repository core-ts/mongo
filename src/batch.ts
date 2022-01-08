import {Collection} from 'mongodb';
import {insertMany, updateMany, upsertMany} from './mongo';

export class MongoBatchInserter<T> {
  constructor(protected collection: Collection, protected id?: string, protected map?: (v: T) => T) {
    this.write = this.write.bind(this);
  }
  write(list: T[]): Promise<number> {
    const fn = this.map;
    if (fn) {
      list = list.map(o => fn(o));
    }
    return insertMany(this.collection, list, this.id);
  }
}
// tslint:disable-next-line:max-classes-per-file
export class MongoBatchUpdater<T> {
  constructor(protected collection: Collection, protected id?: string, protected map?: (v: T) => T) {
    this.write = this.write.bind(this);
  }
  write(list: T[]): Promise<number> {
    const fn = this.map;
    if (fn) {
      list = list.map(o => fn(o));
    }
    return updateMany(this.collection, list, this.id);
  }
}
// tslint:disable-next-line:max-classes-per-file
export class MongoBatchWriter<T> {
  constructor(protected collection: Collection, protected id?: string, protected map?: (v: T) => T) {
    this.write = this.write.bind(this);
  }
  write(list: T[]): Promise<number> {
    const fn = this.map;
    if (fn) {
      list = list.map(o => fn(o));
    }
    return upsertMany(this.collection, list, this.id);
  }
}

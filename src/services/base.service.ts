import { Model, Document, FilterQuery, QueryOptions, UpdateQuery } from 'mongoose';

export interface CursorPaginationOptions {
  limit?: number;
  after?: string;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export class BaseService<T extends Document> {
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  async bulkCreate(data: Partial<T>[], options = {}) {
    return this.model.insertMany(data, options);
  }

  async create(data: Partial<T>) {
    return this.model.create(data);
  }

  async update(id: string, data: UpdateQuery<T>, options: QueryOptions = { new: true }) {
    return this.model.findByIdAndUpdate(id, data, options);
  }

  async delete(id: string) {
    return this.model.findByIdAndDelete(id);
  }

  async hardDestroy(filter: FilterQuery<T>) {
    return this.model.deleteMany(filter);
  }

  async findOne(filter: FilterQuery<T>, projection: any = {}, options: QueryOptions = {}) {
    return this.model.findOne(filter, projection, options);
  }

  async findAll(filter: FilterQuery<T> = {}, projection: any = {}, options: QueryOptions = {}) {
    return this.model.find(filter, projection, options);
  }

  async findById(id: string, projection: any = {}, options: QueryOptions = {}) {
    return this.model.findById(id, projection, options);
  }

  async count(filter: FilterQuery<T> = {}) {
    return this.model.countDocuments(filter);
  }

  async sum(field: string, filter: FilterQuery<T> = {}): Promise<number> {
    const result = await this.model.aggregate([{ $match: filter }, { $group: { _id: null, total: { $sum: `$${field}` } } }]);
    return result[0]?.total || 0;
  }

  async getDeletedIds(filter: FilterQuery<T> = {}): Promise<string[]> {
    const results = await this.model.find(filter).select('_id').lean();
    return results.map((doc: any) => doc._id.toString());
  }

  async getPagingData(data: T[], page: number, limit: number, totalItems: number) {
    const totalPages = Math.ceil(totalItems / limit);
    return {
      totalItems,
      totalPages,
      currentPage: page,
      data,
    };
  }

  async findAllWithPagination(
    filter: FilterQuery<T> = {},
    { page = 1, limit = 10 }: PaginationOptions = {},
    projection: any = {},
    options: QueryOptions = {},
  ) {
    const skip = (page - 1) * limit;
    const data = await this.model.find(filter, projection, { ...options, skip, limit });
    const totalItems = await this.count(filter);
    return this.getPagingData(data, page, limit, totalItems);
  }

  parseCursor(cursor?: string): { _id: string } | null {
    try {
      return cursor ? JSON.parse(Buffer.from(cursor, 'base64').toString('utf8')) : null;
    } catch {
      return null;
    }
  }

  serializeCursor(doc: T): string | null {
    if (!doc || !doc._id) return null;
    return Buffer.from(JSON.stringify({ _id: doc._id.toString() })).toString('base64');
  }

  async findAllWithCursor(
    filter: FilterQuery<T> = {},
    { limit = 10, after }: CursorPaginationOptions = {},
    projection: any = {},
    options: QueryOptions = {},
  ) {
    if (after) {
      const cursor = this.parseCursor(after);
      if (cursor && cursor._id) {
        filter._id = { $gt: cursor._id };
      }
    }

    const docs = await this.model.find(filter, projection, { ...options, limit }).sort({ _id: 1 });
    const nextCursor = docs.length === limit ? this.serializeCursor(docs[docs.length - 1]) : null;

    return {
      data: docs,
      nextCursor,
    };
  }

  scope(scopedFn: (model: Model<T>) => any) {
    return scopedFn(this.model);
  }
}

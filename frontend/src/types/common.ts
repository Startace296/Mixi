/** Dates arrive over JSON as ISO-8601 strings, never as Date objects. */
export type ISODateString = string;

/** Mongo ObjectId serialized to a string. */
export type Id = string;

/** Every successful backend response carries `success: true`; errors are rejected by the axios interceptor. */
export interface ApiSuccess {
  success: true;
  message?: string;
}

/** Cursor pagination used by message and post lists: pass `nextBefore` as `before` for the next page. */
export interface PageInfo {
  hasMore: boolean;
  nextBefore: ISODateString | null;
}

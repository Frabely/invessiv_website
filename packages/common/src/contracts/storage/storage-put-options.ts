export interface StoragePutOptions {
  contentType: string;
  /** Browser and edge cache lifetime; only immutable objects should set a long one. */
  cacheMaxAgeSeconds: number;
}

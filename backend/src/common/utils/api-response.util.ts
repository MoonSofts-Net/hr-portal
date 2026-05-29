export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

export function ok<T>(data: T): ApiSuccessResponse<T> {
  return { success: true, data };
}

export function paginated<T>(data: T[], meta: PaginationMeta): ApiSuccessResponse<T[]> {
  return { success: true, data, meta };
}

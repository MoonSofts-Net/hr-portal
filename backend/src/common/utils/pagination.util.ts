import { PaginationMeta } from './api-response.util';
import { PaginationQueryDto, SortOrder } from '../dto/pagination-query.dto';

export function resolvePagination(query: PaginationQueryDto) {
  const page = Math.max(1, query.page ?? 1);
  const limit = Math.min(100, Math.max(1, query.limit ?? 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip, take: limit, sortOrder: query.sortOrder ?? SortOrder.DESC };
}

export function buildMeta(total: number, page: number, limit: number): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / limit),
  };
}

export function buildOrderBy(
  sortBy: string | undefined,
  sortOrder: SortOrder,
  allowed: Record<string, string>,
  defaultField: string,
) {
  const field = sortBy && allowed[sortBy] ? allowed[sortBy] : defaultField;
  return { [field]: sortOrder };
}

import { apiRequest } from "./client";
import { MOCK_TENANTS } from "@/mocks/seed";
import type { Tenant } from "@/types";
import type { RequestContext } from "./client";

export async function getTenants(
  context: RequestContext
): Promise<Tenant[]> {
  return apiRequest(() => MOCK_TENANTS, context);
}

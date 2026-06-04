/**
 * Employee endpoints of the B2B Sellers Store API.
 *
 * Thin, typed wrappers over the request-scoped {@link B2bSellersClient}
 * (`context.client`, wired by `../middleware/defineB2bSellers`). No canonical
 * mapping — that lives in the Orchestr handler layer (later iteration).
 */
import type { B2bSellersClient } from '../client/b2bSellersClient';

/** List employees of the current business customer (paginated). */
export function listEmployees(client: B2bSellersClient, body: { page?: number; limit?: number } = {}) {
  return client.invoke('listEmployees post /store-api/employees', { body });
}

/** Fetch a single employee by id. */
export function getEmployee(client: B2bSellersClient, id: string) {
  return client.invoke('getEmployee get /store-api/employee/{id}', { pathParams: { id } });
}

/** Create a new employee. */
export function createEmployee(client: B2bSellersClient, body: Record<string, unknown>) {
  return client.invoke('createEmployee post /store-api/employee', { body });
}

/** Invite/add an existing account as an employee. */
export function addEmployee(client: B2bSellersClient, body: { email: string; roleId?: string }) {
  return client.invoke('addEmployee post /store-api/employee/add', { body });
}

/** Update an employee. */
export function updateEmployee(client: B2bSellersClient, id: string, body: Record<string, unknown>) {
  return client.invoke('updateEmployee patch /store-api/employee/{id}', { pathParams: { id }, body });
}

/** Delete an employee. */
export function deleteEmployee(client: B2bSellersClient, id: string) {
  return client.invoke('deleteEmployee delete /store-api/employee/{id}', { pathParams: { id } });
}

/** List assignable employee roles. */
export function listEmployeeRoles(client: B2bSellersClient, body: { page?: number; limit?: number } = {}) {
  return client.invoke('listEmployeeRoles post /store-api/employee-roles', { body });
}

/** List assignable employee permissions. */
export function listEmployeePermissions(client: B2bSellersClient, body: { page?: number; limit?: number } = {}) {
  return client.invoke('listEmployeePermissions post /store-api/employee-permissions', { body });
}

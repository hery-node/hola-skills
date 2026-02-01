---
name: hola-code
description: HTTP status and error codes for Hola framework. Use when returning responses from routers, handling errors, or implementing CRUD operations. Provides standardized codes for success, auth errors, validation errors, reference errors, and integrity errors.
---

# Hola HTTP Status Codes

Standardized HTTP status and error codes for the Hola framework server responses.

## Code Reference

### Success & General

| Code | Constant | HTTP Status | Description |
|------|----------|-------------|-------------|
| 200 | `SUCCESS` | OK | Operation completed successfully |
| 500 | `ERROR` | Internal Server Error | Unexpected server error |

### Authentication & Authorization

| Code | Constant | HTTP Status | Description |
|------|----------|-------------|-------------|
| 401 | `NO_SESSION` | Unauthorized | No valid session/token |
| 403 | `NO_RIGHTS` | Forbidden | Insufficient permissions |

### Validation Errors

| Code | Constant | HTTP Status | Description |
|------|----------|-------------|-------------|
| 400 | `NO_PARAMS` | Bad Request | Required parameters missing |
| 404 | `NOT_FOUND` | Not Found | Resource does not exist |
| 422 | `INVALID_PARAMS` | Unprocessable Entity | Invalid parameter values |

### Import Errors

| Code | Constant | HTTP Status | Description |
|------|----------|-------------|-------------|
| 400 | `IMPORT_EMPTY_KEY` | Bad Request | Missing key in import data |
| 406 | `IMPORT_WRONG_FIELDS` | Not Acceptable | Fields don't match schema |
| 409 | `IMPORT_DUPLICATE_KEY` | Conflict | Duplicate key in import |
| 424 | `IMPORT_NO_FOUND_REF` | Failed Dependency | Referenced entity not found |

### Reference Errors

| Code | Constant | HTTP Status | Description |
|------|----------|-------------|-------------|
| 424 | `REF_NOT_FOUND` | Failed Dependency | Referenced entity lookup failed |
| 300 | `REF_NOT_UNIQUE` | Multiple Choices | Ambiguous reference (multiple matches) |

### Integrity Errors

| Code | Constant | HTTP Status | Description |
|------|----------|-------------|-------------|
| 423 | `HAS_REF` | Locked | Cannot delete - has dependent references |
| 409 | `DUPLICATE_UNIQUE` | Conflict | Unique field value already exists |

### Resource Errors

| Code | Constant | HTTP Status | Description |
|------|----------|-------------|-------------|
| 410 | `NO_RESOURCE` | Gone | Resource no longer available |

## Conventions

1. **Import from `http/code`** - Always import codes from the central module
2. **Use constants, not raw numbers** - Use `SUCCESS` instead of `200`
3. **Match semantics** - Choose the code that best describes the actual error condition
4. **Auth checks first** - Return `NO_SESSION`/`NO_RIGHTS` before validation errors
5. **Specific over general** - Use `DUPLICATE_UNIQUE` over generic `ERROR` for constraint violations

## Categories by Use Case

### CRUD Operations
- **Create**: `SUCCESS`, `NO_PARAMS`, `INVALID_PARAMS`, `DUPLICATE_UNIQUE`, `REF_NOT_FOUND`
- **Read**: `SUCCESS`, `NOT_FOUND`, `NO_SESSION`, `NO_RIGHTS`
- **Update**: `SUCCESS`, `NOT_FOUND`, `INVALID_PARAMS`, `DUPLICATE_UNIQUE`
- **Delete**: `SUCCESS`, `NOT_FOUND`, `HAS_REF`

### Import Operations
- `IMPORT_EMPTY_KEY`, `IMPORT_WRONG_FIELDS`, `IMPORT_DUPLICATE_KEY`, `IMPORT_NO_FOUND_REF`

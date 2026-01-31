---
name: fix-typescript-types
description: Fix TypeScript `unknown` and `any` types with proper type definitions. Use when (1) `tsc` or `bun run typecheck` shows type errors involving `unknown` or `any`, (2) refactoring code for better type safety, (3) user explicitly asks to fix loose types, or (4) reviewing code that uses `any` or `unknown` inappropriately.
---

# Fix TypeScript Types

Replace `unknown` and `any` types with proper type definitions to improve type safety and code quality.

## Workflow

1. **Identify** the problematic type (`unknown` or `any`)
2. **Analyze** the context and data flow
3. **Apply** the appropriate fix pattern
4. **Verify** with `tsc` or `bun run typecheck`

## Fixing `unknown` Types

`unknown` is the type-safe counterpart of `any`. It requires type narrowing before use.

### Pattern 1: Type Guards

```typescript
// Before
function process(data: unknown) {
  console.log(data.name); // Error: 'data' is of type 'unknown'
}

// After - Type guard
function process(data: unknown) {
  if (typeof data === 'object' && data !== null && 'name' in data) {
    console.log((data as { name: string }).name);
  }
}
```

### Pattern 2: Type Assertion with Validation

```typescript
// Before
const response: unknown = await fetch('/api').then(r => r.json());

// After - Define interface and assert
interface ApiResponse {
  id: string;
  data: Record<string, unknown>;
}

const response = await fetch('/api').then(r => r.json()) as ApiResponse;
```

### Pattern 3: Generic Type Parameter

```typescript
// Before
function parse(json: string): unknown {
  return JSON.parse(json);
}

// After - Generic with constraint
function parse<T>(json: string): T {
  return JSON.parse(json) as T;
}

// Usage
const user = parse<{ name: string; age: number }>('{"name":"John","age":30}');
```

## Fixing `any` Types

Replace `any` with specific types to enable type checking.

### Pattern 1: Define Explicit Interface

```typescript
// Before
function handleEvent(event: any) {
  console.log(event.target.value);
}

// After
function handleEvent(event: React.ChangeEvent<HTMLInputElement>) {
  console.log(event.target.value);
}
```

### Pattern 2: Use Built-in Utility Types

```typescript
// Before
const config: any = { timeout: 1000 };

// After - Use Record for key-value objects
const config: Record<string, number | string | boolean> = { timeout: 1000 };

// Or define specific interface
interface Config {
  timeout: number;
  retries?: number;
}
const config: Config = { timeout: 1000 };
```

### Pattern 3: Function Parameter Types

```typescript
// Before
function merge(a: any, b: any): any {
  return { ...a, ...b };
}

// After - Generic types
function merge<T, U>(a: T, b: U): T & U {
  return { ...a, ...b };
}
```

### Pattern 4: Array Types

```typescript
// Before
const items: any[] = [1, 'two', { three: 3 }];

// After - Union type or tuple
const items: (number | string | { three: number })[] = [1, 'two', { three: 3 }];

// Or if order matters, use tuple
const items: [number, string, { three: number }] = [1, 'two', { three: 3 }];
```

## Common Scenarios

### API Response Handling

```typescript
// Before
async function fetchUser(id: string): Promise<any> {
  const res = await fetch(`/api/users/${id}`);
  return res.json();
}

// After
interface User {
  id: string;
  name: string;
  email: string;
}

async function fetchUser(id: string): Promise<User> {
  const res = await fetch(`/api/users/${id}`);
  return res.json() as User;
}
```

### Event Handlers

```typescript
// Before
const handleClick = (e: any) => { ... }

// After - DOM events
const handleClick = (e: MouseEvent) => { ... }

// React events
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => { ... }
```

### Third-Party Libraries

```typescript
// Before - Library returns any
const result: any = someLibrary.parse(data);

// After - Check @types package or define
import type { ParseResult } from 'some-library';
const result: ParseResult = someLibrary.parse(data);

// Or create local type
interface ParseResult {
  success: boolean;
  data: string[];
}
const result: ParseResult = someLibrary.parse(data);
```

### Callback Functions

```typescript
// Before
function process(callback: any) {
  callback('result');
}

// After
function process(callback: (result: string) => void) {
  callback('result');
}
```

## Quick Reference

| Problem | Solution |
|---------|----------|
| `data: unknown` | Type guard, assertion, or generic |
| `param: any` | Define interface or use built-in type |
| `returns any` | Specify return type explicitly |
| `any[]` | Use `T[]` or tuple type |
| `Record<string, any>` | Use `Record<string, SpecificType>` |
| Callback `any` | Define function signature type |

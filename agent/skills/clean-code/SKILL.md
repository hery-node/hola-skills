---
name: clean-code
description: Refactor code to improve quality and maintainability. Use when the user says "clean the code", "refactor", "improve code quality", or requests code cleanup. Applies DRY principle, improves naming, simplifies logic, and follows language-specific best practices.
---

# Clean Code - Refactoring Skill

Refactor code to improve readability, maintainability, and quality by applying software engineering best practices.

## Trigger Phrases

- "clean the code"
- "refactor"
- "improve code quality"
- "clean up this code"
- "make this better"

## Scope Detection

Determine what to refactor based on user context:

1. **If text is selected**: Refactor only the selected code
2. **If no selection, but active file is open**: Refactor the entire file
3. **If no active file**: Ask the user which file to refactor

## Core Refactoring Principles

### 1. DRY (Don't Repeat Yourself)

**Extract repeated code into reusable functions:**

**Before:**
```python
# Repeated validation logic
if user.name == "" or user.name is None:
    raise ValueError("Name required")
if user.email == "" or user.email is None:
    raise ValueError("Email required")
if user.phone == "" or user.phone is None:
    raise ValueError("Phone required")
```

**After:**
```python
def validate_field(value, field_name):
    if not value:
        raise ValueError(f"{field_name} required")

validate_field(user.name, "Name")
validate_field(user.email, "Email")
validate_field(user.phone, "Phone")
```

### 2. Simple and Direct Naming

**Use clear, descriptive names that reveal intent:**

| ❌ Bad | ✅ Good |
|--------|---------|
| `d`, `dt`, `temp` | `date`, `datetime`, `temperature` |
| `getData()` | `fetch_user_profile()` |
| `x`, `y`, `z` | `width`, `height`, `depth` |
| `flag`, `flag2` | `is_valid`, `has_permission` |

**Naming conventions by language:**
- **Python**: `snake_case` for functions/variables, `PascalCase` for classes
- **JavaScript/TypeScript**: `camelCase` for functions/variables, `PascalCase` for classes
- **Boolean variables**: Prefix with `is_`, `has_`, `should_`, `can_`

### 3. Simplify Logic

#### 3.1 Early Returns (Guard Clauses)

**Before:**
```python
def process_order(order):
    if order is not None:
        if order.is_valid():
            if order.amount > 0:
                # Process order
                return process(order)
            else:
                return None
        else:
            return None
    else:
        return None
```

**After:**
```python
def process_order(order):
    if not order:
        return None
    if not order.is_valid():
        return None
    if order.amount <= 0:
        return None
    
    return process(order)
```

#### 3.2 Replace Complex Conditionals

**Before:**
```python
if user.role == "admin" or user.role == "moderator" or user.role == "owner":
    grant_access()
```

**After:**
```python
PRIVILEGED_ROLES = {"admin", "moderator", "owner"}
if user.role in PRIVILEGED_ROLES:
    grant_access()
```

### 4. Extract Methods/Functions

**Break down large functions into smaller, focused ones:**

**Before:**
```python
def handle_request(request):
    # Validate (20 lines)
    if not request.user:
        return error("No user")
    if not request.token:
        return error("No token")
    # ... more validation
    
    # Process (30 lines)
    data = parse_data(request.body)
    # ... processing logic
    
    # Save (15 lines)
    db.save(data)
    # ... save logic
```

**After:**
```python
def handle_request(request):
    validate_request(request)
    data = process_request_data(request)
    save_to_database(data)

def validate_request(request):
    if not request.user:
        raise ValueError("No user")
    if not request.token:
        raise ValueError("No token")

def process_request_data(request):
    return parse_data(request.body)

def save_to_database(data):
    db.save(data)
```

### 5. Remove Dead Code

- Delete commented-out code (use version control instead)
- Remove unused imports
- Remove unused variables and functions

### 6. Improve Comments

**Remove obvious comments, keep only non-obvious ones:**

**Before:**
```python
# Increment counter by 1
counter += 1

# Calculate total price
total = price * quantity
```

**After:**
```python
counter += 1  # No comment needed - self-explanatory

# Apply 15% discount for bulk orders (business rule)
total = price * quantity * 0.85 if quantity > 100 else price * quantity
```

### 7. Consistent Formatting

- Use consistent indentation
- Add blank lines to separate logical blocks
- Keep line length under 80-100 characters
- Group related code together

### 8. Language-Specific Best Practices

#### Python
- Use list comprehensions instead of loops where appropriate
- Use context managers (`with`) for resource handling
- Use `f-strings` for string formatting
- Follow PEP 8 conventions

#### JavaScript/TypeScript
- Use `const` and `let`, avoid `var`
- Use arrow functions for callbacks
- Use template literals for string interpolation
- Use destructuring where appropriate
- Remove unused variables and functions and imports


## Refactoring Workflow

1. **Read and understand** the code
2. **Identify issues**: Duplication, complex logic, poor naming, etc.
3. **Apply refactorings** one at a time
4. **Test after each change** (if tests exist)
5. **Show what changed** with a summary

## Output Format

After refactoring, explain what was improved:

```
**Refactored Code:**
[show the cleaned code]

**Improvements Made:**
- ✅ Extracted 3 duplicate validation blocks into `validate_field()`
- ✅ Renamed `getData()` → `fetch_user_profile()`
- ✅ Simplified nested conditionals with early returns
- ✅ Removed 15 lines of commented-out code
- ✅ Added descriptive variable names
```

## When NOT to Refactor

- Don't change functionality or behavior
- Don't refactor if breaking tests (fix tests separately)
- Don't over-abstract (balance DRY with readability)
- Don't refactor generated code unless explicitly asked

---
name: clarify-user-intent
description: Help the AI ask clarifying questions when user ideas or solutions are unclear. Use when discussing new features, technical solutions, or requirements where ambiguity exists. Triggers on technical ambiguity (unclear tech stack, architecture), business/scope ambiguity (undefined requirements, success criteria), or user intent ambiguity (what the user actually wants to achieve).
---

# Clarify User Intent

Ask clarifying questions to understand user ideas before implementation. This skill helps avoid wasted effort from misunderstood requirements.

## When to Use

- User describes an idea/solution with vague or incomplete details
- Technical requirements are ambiguous (e.g., missing tech stack, architecture decisions)
- Business scope is unclear (e.g., undefined success criteria, edge cases)
- User intent is uncertain (e.g., solving root cause vs. symptom)

## Question Strategy

### Priority: Ask ONE Question at a Time

**IMPORTANT: Ask only ONE question per message.** Wait for the user's response before asking the next question.

Identify the most impactful gaps and prioritize them, but ask them sequentially - never bundle multiple questions together.

**Critical questions typically cover (in order of priority):**

1. **Core intent** - What is the primary goal?
2. **Constraints** - What limitations must be respected?
3. **Success criteria** - How will we know it's done correctly?

### Format: AI Decides Based on Question Type

Choose the best format for each question:

**Use Multiple-Choice (A/B/C/D) when:**

- Options are clearly defined and finite
- User might not know all possibilities
- Quick decision needed

**Example:**

```
What authentication method should we use?

| Option | Answer |
|--------|--------|
| A | JWT tokens |
| B | Session-based auth |
| C | OAuth 2.0 |
| D | Other (describe in comments) |
```

**Use Open-Ended when:**

- Creative input needed
- Options are too numerous to list
- Context-specific details required

**Example:**

```
What specific business rules should apply to this feature?
```

## Question Flow

1. **Identify gaps** - Review user's description for ambiguity
2. **Prioritize** - Rank questions by importance
3. **Ask ONE question** - Ask only the most critical question first
4. **Wait for response** - Let the user answer before proceeding
5. **Ask next question** - Continue with the next most important question
6. **Format appropriately** - Use table format for choices, plain text for open-ended
7. **Summarize understanding** - After all questions answered, confirm comprehension
8. **Continue during work** - Ask additional questions as they arise during implementation

## Example Conversation

**User:** I want to add a notification system to my app.

**AI Response:**

> Let me clarify a few things before we start:
>
> **Question 1:** What types of notifications should the system support?
>
> | Option | Answer                      |
> | ------ | --------------------------- |
> | A      | In-app notifications only   |
> | B      | Email notifications only    |
> | C      | Push notifications (mobile) |
> | D      | All of the above            |
> | E      | Other (describe)            |

**User:** D

**AI Response:**

> Got it! All notification types.
>
> **Question 2:** Should notifications be real-time or can they be batched/delayed?
>
> | Option | Answer                         |
> | ------ | ------------------------------ |
> | A      | Real-time (immediate delivery) |
> | B      | Batched (e.g., daily digest)   |
> | C      | User-configurable preference   |
> | D      | Other                          |

## Anti-Patterns to Avoid

- ❌ **Asking multiple questions at once (NEVER DO THIS)** - Always ask ONE question per message
- ❌ Asking obvious questions that can be inferred
- ❌ Proceeding without clarifying critical ambiguities
- ❌ Using only open-ended questions when options are clear
- ❌ Re-asking questions already answered
- ❌ Batching or bundling questions together - this overwhelms users

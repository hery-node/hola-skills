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

### Priority: Ask 2-3 Critical Questions First

Identify the most impactful gaps and ask only the essential questions upfront. Additional questions can be asked during implementation as needed.

**Critical questions typically cover:**

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
2. **Prioritize** - Select 2-3 most critical questions
3. **Format appropriately** - Use table format for choices, plain text for open-ended
4. **Ask one at a time** - If many questions, batch 2-3 max per message
5. **Summarize understanding** - Confirm comprehension before proceeding
6. **Continue during work** - Ask additional questions as they arise

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

- ❌ Asking too many questions at once (overwhelming)
- ❌ Asking obvious questions that can be inferred
- ❌ Proceeding without clarifying critical ambiguities
- ❌ Using only open-ended questions when options are clear
- ❌ Re-asking questions already answered

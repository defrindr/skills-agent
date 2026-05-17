# [Flow Name] Flow

## Overview
[Satu paragraf jelasin tujuan flow ini]

## Actors
- [User role 1]
- [External system, e.g., Stripe]

## Preconditions
- [State yang harus ada sebelum flow ini run]

## Steps

### Step 1: [Action Name]
- **Trigger**: [Apa yang start step ini]
- **Endpoint**: `[METHOD] /api/...`
- **Payload**: [schema input]
- **Validation**: [rules]
- **Action**: [apa yang terjadi]
- **State change**: [DB/cache changes]
- **Output**: [response]
- **Errors**: [error handling]
- **Next**: [step berikutnya / end]

### Step 2: ...

## API Contracts

### [METHOD] /api/[endpoint]

**Request:**
```json
{ "field": "type" }
```

**Response (200):**
```json
{ "result": "type" }
```

**Errors:**
- 400: validation error
- 401: unauthorized
- 404: not found
- 422: business rule violation

## State Management
- **Frontend**: [Zustand/Context/server-only]
- **Backend**: [tables affected]
- **Cache**: [invalidation strategy]

## Database Touchpoints
- Tables read: `[tables]`
- Tables written: `[tables]`
- Transactions: [yes/no]

## Security
- Auth: [required/optional]
- Roles: [allowed roles]
- Validation: [critical fields]
- Rate limit: [yes (n/min) / no]

## Testing
- Unit: [list functions to test]
- Integration: [API endpoints]
- E2E: [user journeys]

## Related Flows
- Depends on: `[flow-name.md]`
- Triggers: `[flow-name.md]`

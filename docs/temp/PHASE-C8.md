# Core C8 — Public API JWT Guard

> **Status:** Complete.  
> **Depends on:** [C7](./PHASE-C7.md).

## Deliverables

| Unit | Location | Purpose |
|------|----------|---------|
| `JwtAuthGuard` | `auth/guards/jwt-auth.guard.ts` | Validates `Authorization: Bearer` access tokens |
| `PublicApiController` | `GET /public/v1/me` | Smoke endpoint for JWT-authenticated clients |
| `PublicApiModule` | Wired into `AppModule` | Imports `AuthModule` |
| `AuthModule` exports | `TokenService`, `JwtAuthGuard`, `UserRepository` | Shared auth primitives for public routes |

## Token flow

1. Client obtains access token via existing auth endpoints (`POST /auth/token` or OIDC flow — see auth module).
2. Public routes require header: `Authorization: Bearer <accessToken>`.
3. Guard verifies JWT, loads user by `claims.sub` (user public id), attaches `userId` / `userPublicId` on the request.

## HTTP example

```http
GET /public/v1/me
Authorization: Bearer eyJhbG…
```

```json
{
  "userPublicId": "user_abc",
  "userId": "550e8400-e29b-41d4-a716-446655440000"
}
```

Invalid or missing token → **401 Unauthorized**.

## References

- Product plan C8
- `CORE-ARCHITECTURE.md` — Public API row in auth table

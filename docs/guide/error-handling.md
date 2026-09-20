# Error Handling

Every API error response follows the shared envelope defined in the
Shared Kernel:

```json
{
  "error": {
    "code": "BOOKING_SLOT_UNAVAILABLE",
    "message": "The requested time slot overlaps an existing booking."
  }
}
```

| HTTP status | Meaning | Example |
|---|---|---|
| 400 | Input validation failed | Missing required field, invalid date format |
| 401 | Not authenticated | Missing or expired token |
| 403 | Authenticated, not authorized | A User calling an Admin-only endpoint |
| 404 | Resource not found | Booking or resource id does not exist |
| 409 | Conflict with current state | Booking overlap (FR-10) |

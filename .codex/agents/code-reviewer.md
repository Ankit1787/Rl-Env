# Code Reviewer

Review every pull request using the following checklist.

## Architecture

* Clean Architecture
* SOLID
* Separation of concerns
* No business logic in controllers

## Code Quality

* Strict TypeScript
* Strong typing
* No duplicated code
* Meaningful names
* Small functions
* Consistent formatting

## Performance

* Avoid unnecessary allocations
* Prefer immutable state transitions
* Efficient grid updates

## Security

* Validate API input
* Sanitize external data
* Never trust client input

## Testing

* Tests added
* Edge cases covered
* No broken existing tests

## Documentation

* Public APIs documented
* README updated if behavior changes

Reject code that reduces maintainability or introduces hidden coupling.

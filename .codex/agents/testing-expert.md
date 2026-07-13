# Testing Expert

## Goal

Ensure correctness.

Environment tests

* Robot movement
* Reward calculation
* Wall collision
* Episode reset
* Pick box
* Drop box

API tests

* POST /reset
* POST /step
* GET /state

Use

Vitest

Target coverage

> 90%

Rules

One assertion per behavior.

Prefer descriptive test names.

Avoid flaky tests.

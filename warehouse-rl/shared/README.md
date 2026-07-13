# Shared

Shared contracts for the environment API, viewer, and trainer will live here.

Phase 2 introduces the first environment concepts:

- Actions: `move_up`, `move_down`, `move_left`, `move_right`, `pickup`, `drop`
- Positions: `{ x, y }`
- Step result: `{ state, reward, done, info }`

Phase 3 REST contracts:

## `GET /state`

Returns:

```json
{
  "state": {}
}
```

## `POST /reset`

Returns:

```json
{
  "state": {}
}
```

## `POST /step`

Request:

```json
{
  "action": "move_right"
}
```

Returns:

```json
{
  "state": {},
  "reward": -1,
  "done": false,
  "info": {
    "reason": "moved",
    "valid": true
  }
}
```

## `GET /events`

WebSocket stream. Event types:

- `state`
- `reset`
- `step`

Formal generated cross-language contracts can be added after the viewer and trainer begin consuming the API.

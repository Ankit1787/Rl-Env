from enum import IntEnum


class WarehouseAction(IntEnum):
    MOVE_UP = 0
    MOVE_DOWN = 1
    MOVE_LEFT = 2
    MOVE_RIGHT = 3
    PICKUP = 4
    DROP = 5


ACTION_NAMES: tuple[str, ...] = (
    "move_up",
    "move_down",
    "move_left",
    "move_right",
    "pickup",
    "drop",
)


def action_name(action_index: int) -> str:
    if action_index < 0 or action_index >= len(ACTION_NAMES):
        raise ValueError(f"Unsupported action index: {action_index}")

    return ACTION_NAMES[action_index]

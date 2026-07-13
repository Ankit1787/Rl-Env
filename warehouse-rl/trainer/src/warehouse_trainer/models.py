from typing import Any, Protocol, TypedDict


class Position(TypedDict):
    x: int
    y: int


class RobotState(TypedDict):
    position: Position
    carryingBox: bool


class BoxState(TypedDict):
    position: Position
    isDelivered: bool


class WarehouseState(TypedDict, total=False):
    episode: int
    stepCount: int
    maxSteps: int
    done: bool
    robot: RobotState
    box: BoxState
    goal: Position
    walls: list[Position]
    width: int
    height: int
    lastAction: str
    lastReward: float
    terminalReason: str


class StepInfo(TypedDict):
    reason: str
    valid: bool


class StepResult(TypedDict):
    state: WarehouseState
    reward: float
    done: bool
    info: StepInfo


class WarehouseApiClient(Protocol):
    def reset(self) -> WarehouseState:
        ...

    def step(self, action: str) -> StepResult:
        ...

    def state(self) -> WarehouseState:
        ...


JsonObject = dict[str, Any]

import requests

from warehouse_trainer.models import StepResult, WarehouseState


class HttpWarehouseClient:
    def __init__(self, base_url: str, timeout_seconds: float = 5.0) -> None:
        self._base_url = base_url.rstrip("/")
        self._timeout_seconds = timeout_seconds

    def reset(self) -> WarehouseState:
        response = requests.post(f"{self._base_url}/reset", timeout=self._timeout_seconds)
        response.raise_for_status()
        return response.json()["state"]

    def step(self, action: str) -> StepResult:
        response = requests.post(
            f"{self._base_url}/step",
            json={"action": action},
            timeout=self._timeout_seconds,
        )
        response.raise_for_status()
        return response.json()

    def state(self) -> WarehouseState:
        response = requests.get(f"{self._base_url}/state", timeout=self._timeout_seconds)
        response.raise_for_status()
        return response.json()["state"]

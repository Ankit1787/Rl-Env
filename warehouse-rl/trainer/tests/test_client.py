import pytest
import requests

from warehouse_trainer.client import HttpWarehouseClient


class FakeResponse:
    def __init__(self, payload: dict, status_ok: bool = True) -> None:
        self._payload = payload
        self._status_ok = status_ok

    def raise_for_status(self) -> None:
        if not self._status_ok:
            raise requests.HTTPError("failed")

    def json(self) -> dict:
        return self._payload


def test_client_reset_posts_to_reset_endpoint(monkeypatch: pytest.MonkeyPatch) -> None:
    calls: list[tuple[str, float]] = []

    def fake_post(url: str, timeout: float, **_: object) -> FakeResponse:
        calls.append((url, timeout))
        return FakeResponse({"state": {"episode": 1}})

    monkeypatch.setattr(requests, "post", fake_post)

    client = HttpWarehouseClient("http://environment:3001/", timeout_seconds=3)
    state = client.reset()

    assert calls == [("http://environment:3001/reset", 3)]
    assert state == {"episode": 1}


def test_client_step_posts_action_payload(monkeypatch: pytest.MonkeyPatch) -> None:
    payloads: list[dict] = []

    def fake_post(url: str, json: dict, timeout: float) -> FakeResponse:
        payloads.append({"url": url, "json": json, "timeout": timeout})
        return FakeResponse({"reward": 1, "done": False, "state": {}, "info": {}})

    monkeypatch.setattr(requests, "post", fake_post)

    client = HttpWarehouseClient("http://environment:3001", timeout_seconds=2)
    result = client.step("move_right")

    assert payloads == [
        {
            "url": "http://environment:3001/step",
            "json": {"action": "move_right"},
            "timeout": 2,
        }
    ]
    assert result["reward"] == 1


def test_client_state_gets_state_endpoint(monkeypatch: pytest.MonkeyPatch) -> None:
    calls: list[tuple[str, float]] = []

    def fake_get(url: str, timeout: float) -> FakeResponse:
        calls.append((url, timeout))
        return FakeResponse({"state": {"stepCount": 0}})

    monkeypatch.setattr(requests, "get", fake_get)

    client = HttpWarehouseClient("http://environment:3001", timeout_seconds=4)
    state = client.state()

    assert calls == [("http://environment:3001/state", 4)]
    assert state == {"stepCount": 0}

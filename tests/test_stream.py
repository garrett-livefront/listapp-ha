import asyncio

from homeassistant.core import HomeAssistant
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from pytest_homeassistant_custom_component.test_util.aiohttp import AiohttpClientMocker

from custom_components.listapp.const import API_BASE_URL
from custom_components.listapp.stream import ListAppEventStream, StreamEvent, parse_sse

STREAM_URL = f"{API_BASE_URL}/me/events/selected"


class _FakeContent:
    def __init__(self, lines: list[bytes]) -> None:
        self._lines = list(lines)

    async def readline(self) -> bytes:
        if not self._lines:
            return b""
        return self._lines.pop(0)


async def _collect(lines: list[bytes]) -> list[StreamEvent]:
    return [event async for event in parse_sse(_FakeContent(lines))]


async def test_parse_sse_multiline_data() -> None:
    events = await _collect(
        [b"event: item.upserted\n", b"data: line one\n", b"data: line two\n", b"\n"]
    )
    assert events == [StreamEvent(event="item.upserted", data="line one\nline two")]


async def test_parse_sse_comments_are_ignored() -> None:
    events = await _collect([b": heartbeat\n", b"data: hi\n", b"\n"])
    assert events == [StreamEvent(event="message", data="hi")]


async def test_parse_sse_default_event_type_resets() -> None:
    events = await _collect([b"event: list.deleted\n", b"data: a\n", b"\n", b"data: b\n", b"\n"])
    assert [e.event for e in events] == ["list.deleted", "message"]


async def test_parse_sse_eof_ends_stream() -> None:
    events = await _collect([b"data: incomplete\n"])
    assert events == []


def _stream(
    hass: HomeAssistant,
    *,
    on_event=None,
    on_state_change=None,
    on_auth_failed=None,
    on_selection_rejected=None,
) -> ListAppEventStream:
    async def token() -> str:
        return "test-token"

    return ListAppEventStream(
        session=async_get_clientsession(hass),
        get_access_token=token,
        base_url=API_BASE_URL,
        list_ids=["a", "b"],
        heartbeat_timeout=0.2,
        on_event=on_event or (lambda event: None),
        on_state_change=on_state_change or (lambda connected: None),
        on_auth_failed=on_auth_failed or (lambda: None),
        on_selection_rejected=on_selection_rejected or (lambda: None),
    )


async def test_connect_success_delivers_events(
    hass: HomeAssistant, aioclient_mock: AiohttpClientMocker
) -> None:
    aioclient_mock.get(STREAM_URL, content=b"event: item.deleted\ndata: {}\n\n")
    events: list[StreamEvent] = []
    states: list[bool] = []
    stream = _stream(hass, on_event=events.append, on_state_change=states.append)

    stream.start()
    await asyncio.sleep(0.05)
    await stream.stop()

    assert events == [StreamEvent(event="item.deleted", data="{}")]
    assert states[0] is True


async def test_401_triggers_auth_failed(
    hass: HomeAssistant, aioclient_mock: AiohttpClientMocker
) -> None:
    aioclient_mock.get(STREAM_URL, status=401)
    called = asyncio.Event()
    stream = _stream(hass, on_auth_failed=called.set)

    stream.start()
    await asyncio.wait_for(called.wait(), timeout=1)
    await stream.stop()


async def test_400_falls_back_to_polling(
    hass: HomeAssistant, aioclient_mock: AiohttpClientMocker
) -> None:
    aioclient_mock.get(STREAM_URL, status=400)
    called = asyncio.Event()
    stream = _stream(hass, on_selection_rejected=called.set)

    stream.start()
    await asyncio.wait_for(called.wait(), timeout=1)
    await stream.stop()


async def test_503_reconnects_with_backoff(
    hass: HomeAssistant, aioclient_mock: AiohttpClientMocker
) -> None:
    aioclient_mock.get(STREAM_URL, status=503)
    states: list[bool] = []
    stream = _stream(hass, on_state_change=states.append)

    stream.start()
    await asyncio.sleep(0.05)
    await stream.stop()

    # A 503 never reaches "connected" and doesn't call the auth/selection callbacks.
    assert True not in states


async def test_backoff_resets_after_successful_connection(
    hass: HomeAssistant, aioclient_mock: AiohttpClientMocker, monkeypatch
) -> None:
    from custom_components.listapp import stream as stream_module

    aioclient_mock.get(STREAM_URL, content=b"")
    monkeypatch.setattr(stream_module, "STREAM_BACKOFF_INITIAL_SECONDS", 0.01)
    jitter_bounds: list[float] = []
    monkeypatch.setattr(
        stream_module.random, "uniform", lambda low, high: jitter_bounds.append(high) or 0
    )
    stream = _stream(hass)

    stream.start()
    await asyncio.sleep(0.1)
    await stream.stop()

    assert len(jitter_bounds) >= 3
    assert set(jitter_bounds) == {0.005}


async def test_backoff_grows_while_never_connecting(
    hass: HomeAssistant, aioclient_mock: AiohttpClientMocker, monkeypatch
) -> None:
    from custom_components.listapp import stream as stream_module

    aioclient_mock.get(STREAM_URL, status=503)
    monkeypatch.setattr(stream_module, "STREAM_BACKOFF_INITIAL_SECONDS", 0.005)
    jitter_bounds: list[float] = []
    monkeypatch.setattr(
        stream_module.random, "uniform", lambda low, high: jitter_bounds.append(high) or 0
    )
    stream = _stream(hass)

    stream.start()
    await asyncio.sleep(0.1)
    await stream.stop()

    assert jitter_bounds[:3] == [0.0025, 0.005, 0.01]


async def test_stop_cancels_task(hass: HomeAssistant, aioclient_mock: AiohttpClientMocker) -> None:
    aioclient_mock.get(STREAM_URL, content=b"")
    stream = _stream(hass)
    stream.start()
    await asyncio.sleep(0.01)

    await stream.stop()

    assert stream._task is None

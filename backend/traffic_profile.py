"""Assumed, synthetic Lusaka traffic profile for time-of-day demonstrations.

These parameters represent typical rush-hour behavior, not measured traffic data.
Recalibrate PROFILE_CONFIG against observed speeds before operational use.
"""

from datetime import datetime, timedelta, timezone
from math import exp
from zoneinfo import ZoneInfo

LUSAKA_TIMEZONE = "Africa/Lusaka"
LUSAKA_OFFSET = timezone(timedelta(hours=2))
PROFILE_CONFIG = {
    "weekday": {
        "base": 0.04,
        "peaks": [(0.85, 450, 50), (0.45, 765, 55), (1.00, 1050, 65)],
    },
    "weekend": {
        "base": 0.04,
        "peaks": [(0.50, 690, 90), (0.30, 1020, 70)],
    },
}


def lusaka_timezone():
    try:
        return ZoneInfo(LUSAKA_TIMEZONE)
    except Exception:
        return LUSAKA_OFFSET


def local_datetime(at_ms: int) -> datetime:
    return datetime.fromtimestamp(at_ms / 1000, timezone.utc).astimezone(lusaka_timezone())


def resolve_day_type(local: datetime, day_type: str) -> str:
    if day_type in ("weekday", "weekend"):
        return day_type
    return "weekend" if local.weekday() >= 5 else "weekday"


def traffic_index(minutes_of_day: float, day_type: str) -> float:
    config = PROFILE_CONFIG[day_type]
    value = config["base"]
    for amplitude, center, spread in config["peaks"]:
        value += amplitude * exp(-((minutes_of_day - center) ** 2) / (2 * spread ** 2))
    return max(0.03, min(1.0, value))


def traffic_level(index: float) -> str:
    if index >= 0.75:
        return "peak"
    if index >= 0.45:
        return "busy"
    if index >= 0.20:
        return "moderate"
    return "off-peak"


def bucket_ms(at_ms: int, step_min: int = 5) -> int:
    step_ms = step_min * 60 * 1000
    return (at_ms // step_ms) * step_ms


def traffic_meta(at_ms: int, day_type: str) -> dict[str, object]:
    bucket = bucket_ms(at_ms)
    local = local_datetime(bucket)
    resolved = resolve_day_type(local, day_type)
    minutes = local.hour * 60 + local.minute
    index = traffic_index(minutes, resolved)
    level = traffic_level(index)
    label = {"peak": "Peak", "busy": "Busy", "moderate": "Moderate", "off-peak": "Off-peak"}[level]
    if level == "peak":
        if minutes < 600:
            label = "Morning peak"
        elif minutes <= 900:
            label = "Midday"
        else:
            label = "Evening peak"
    return {
        "atMs": bucket,
        "bucketMs": bucket,
        "localTime": local.strftime("%H:%M"),
        "weekday": local.strftime("%a"),
        "dayType": resolved,
        "index": round(index, 6),
        "level": level,
        "label": label,
        "modelSource": "time_profile",
    }


def edge_speed(free_flow: float, seed_current: float, index: float) -> int:
    sensitivity = max(0.05, min(0.85, 1 - seed_current / free_flow))
    return round(max(5, free_flow * (1 - sensitivity * index)))


def traffic_profile(day_type: str, reference_ms: int) -> dict[str, object]:
    local = local_datetime(reference_ms)
    resolved = resolve_day_type(local, day_type)
    values = [round(traffic_index(step * 5, resolved), 6) for step in range(288)]
    peaks: list[dict[str, object]] = []
    start: int | None = None
    for index, value in enumerate(values + [0.0]):
        if value >= 0.60 and start is None:
            start = index * 5
        if value < 0.60 and start is not None:
            peaks.append({"label": "Peak", "startMin": start, "endMin": index * 5})
            start = None
    return {"dayType": resolved, "stepMin": 5, "index": values, "peaks": peaks}

import re
from datetime import datetime, timedelta, time
from zoneinfo import ZoneInfo

WEEKDAYS = {
    "monday": 0,
    "mon": 0,
    "tuesday": 1,
    "tue": 1,
    "tues": 1,
    "wednesday": 2,
    "wed": 2,
    "thursday": 3,
    "thu": 3,
    "thurs": 3,
    "friday": 4,
    "fri": 4,
    "saturday": 5,
    "sat": 5,
    "sunday": 6,
    "sun": 6,
}

_TIME_RE = re.compile(r"\b(?P<h>\d{1,2})(?::(?P<m>\d{2}))?\s*(?P<ampm>am|pm)?\b")


def _parse_time(expr: str) -> time:
    m = _TIME_RE.search(expr)
    if not m:
        raise ValueError("No time found (expected e.g. '4am' or '9:30')")

    h = int(m.group("h"))
    minute = int(m.group("m") or 0)
    ampm = m.group("ampm")

    if ampm:
        if h == 12:
            h = 0
        if ampm == "pm":
            h += 12

    if not (0 <= h <= 23 and 0 <= minute <= 59):
        raise ValueError("Invalid time.")

    return time(hour=h, minute=minute)


def _next_weekday_date(now: datetime, target_wd: int, allow_today_if_future: bool):
    days_ahead = (target_wd - now.weekday()) % 7
    if days_ahead == 0 and not allow_today_if_future:
        days_ahead = 7
    return (now + timedelta(days=days_ahead)).date()


def resolve_run_at(time_expression: str, now: datetime, tz: ZoneInfo) -> datetime:
    expr = time_expression.strip().lower()
    t = _parse_time(expr)

    if "tomorrow" in expr:
        d = (now + timedelta(days=1)).date()
    elif "today" in expr:
        d = now.date()
    else:
        # check if weekday mentioned
        wd = next((WEEKDAYS[k] for k in WEEKDAYS if re.search(rf"\b{k}\b", expr)), None)
        if wd is not None:
            # if expr is monday at 9am, but its monday and alr past 9am, go to next week
            tentative = datetime.combine(now.date(), t, tzinfo=tz)
            allow_today = wd == now.weekday() and tentative > now
            d = _next_weekday_date(now, wd, allow_today_if_future=allow_today)
        else:
            # no date, next occurence of that time
            tentative = datetime.combine(now.date(), t, tzinfo=tz)
            d = now.date() if tentative > now else (now + timedelta(days=1)).date()

    run_at = datetime.combine(d, t, tzinfo=tz)

    if run_at <= now:
        run_at = datetime.combine(d + timedelta(days=1), t, tzinfo=tz)

    return run_at

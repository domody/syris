from ..models.intent import Lane, Subaction, LaneConfig, SubactionBias
from syris_core.tools.registry import TOOL_PROMPT_LIST

FULL_LANE_REGISTRY: dict[str, Lane] = {
        "ha": Lane(
        id="ha",
        prompt_line=(
            "Choose ha for smart-home device control or device state questions "
            "(lights, climate, covers, switches, media players, locks)."
        ),
        keywords=[
        # Domains / entities
        "light", "lights", "lamp", "brightness", "color", "scene",
        "climate", "thermostat", "temperature", "heat", "cool", "hvac",
        "cover", "blinds", "curtains", "shutter",
        "switch", "outlet", "plug",
        "media", "tv", "speaker", "volume", "music",
        "lock", "door", "garage",
            # Verbs
            "turn on", "turn off", "switch", "set", "open", "close", "unlock", "lock", "dim", "brighten", "increase", "decrease", "mute", "unmute", "play", "pause", "stop"
            # Query
            "state", "status", "how bright", "what temperature", "on", "off"
        ],
        examples=[
            "Turn on the kitchen lights.",
            "Set the thermostat to 21 degrees.",
            "Is the front door locked?",
            "Open the living room blinds halfway.",
        ],
        subactions={
            "control": Subaction(
                id="control",
                prompt_line="Control a device (on/off, set level, open/close, lock/unlock, media controls).\nNever guess an entity id. If you are unsure, use a name scope.",
                fill_guidance="If user intent is turning on/off/toggling, use power_on/power_off/power_toggle.\nUse set_brightness only if a brightness/percent is mentioned or “dim/brighten”.\nUse set_color_temp only if warmth/coolness/temperature is mentioned or a color temp value is provided.",
                keywords=["turn on", "turn off", "set", "open", "close", "lock", "unlock", "volume", "play", "pause"],
                examples=["Turn off the bedroom lights.", "Lock the front door.", "Set volume to 30%."],
                schema_id="ha.control",
            ),
            "query": Subaction(
                id="query",
                prompt_line="Query device/entity state or attributes.\nNever guess an entity id. If you are unsure, use a name scope.",
                keywords=["is", "are", "status", "state", "what is", "how many"],
                examples=["Is the garage door open?", "What temperature is the hallway thermostat?"],
                schema_id="ha.query",
            ),
            # "list_entities": Subaction(
            #     id="list_entities",
            #     prompt_line="List devices/entities matching a location/type/name.",
            #     keywords=["list", "show", "what devices", "available", "entities"],
            #     examples=["Show lights in the kitchen.", "List all locks."],
            #     schema_id="ha.list_entities",
            # ),
        },
        config=LaneConfig(
            subaction_bias={
                "control": SubactionBias(
                    on_imperative=0.8,
                    on_imperative_beats_question=0.4
                ),
                "query": SubactionBias(
                    on_interrogative=0.8,
                    on_question_mark=0.4
                )
            }
        )
    ),
        "schedule": Lane(
        id="schedule",
        prompt_line="Choose schedule for timers, alarms, reminders, or anything with a specific time/date/duration.",
        keywords=[
        "timer", "alarm", "remind", "reminder",
        "countdown", "wake me", "snooze",
        "schedule", "set a timer", "set an alarm",
        ],
        examples=[
            "Set a timer for 10 minutes.",
            "Remind me tomorrow at 9am to call Alex.",
            "Set an alarm for 7:30.",
        ],
        subactions={
            "set_timer": Subaction(
                id="set_timer",
                prompt_line="Create a timer with a duration.",
                keywords=["timer", "countdown", "for", "minutes", "hours"],
                examples=["Set a timer for 25 minutes.", "Start a 2 hour timer."],
                schema_id="schedule.set_timer",
            ),
            "set_alarm": Subaction(
                id="set_alarm",
                prompt_line="Create an alarm at a specific time.",
                keywords=["alarm", "wake", "at", "am", "pm"],
                examples=["Set an alarm for 6:45am.", "Wake me up at 7."],
                schema_id="schedule.set_alarm",
            ),
            "set_reminder": Subaction(
                id="set_reminder",
                prompt_line="Create a reminder at a specific date/time (optionally with a message).",
                keywords=["remind", "reminder", "tomorrow", "next", "at", "on"],
                examples=["Remind me on Friday at 3pm to send the invoice."],
                schema_id="schedule.set_reminder",
            ),
        },
    ),
        "email": Lane(
        id="email",
        prompt_line="Choose email for reading, searching, or sending emails.",
        keywords=[
            "email", "mail", "inbox", "message", "reply", "forward", "send",
            "search", "find", "subject", "from", "to", "attachment", "unread",
        ],
        examples=[
            "Search my inbox for emails from Sam about the contract.",
            "Send an email to Jordan about the meeting.",
            "Read my latest unread email.",
        ],
        subactions={
            "search": Subaction(
                id="search",
                prompt_line="Search emails by query (sender, subject, keywords, date ranges, etc.).",
                keywords=["search", "find", "from", "subject", "about", "before", "after", "unread"],
                examples=["Find emails from Sara last week.", "Search for 'invoice' in my inbox."],
                schema_id="email.search",
            ),
            "read": Subaction(
                id="read",
                prompt_line="Read one or more emails (latest, unread, by thread/id).",
                keywords=["read", "open", "latest", "unread", "show"],
                examples=["Read my latest email.", "Open the most recent unread message."],
                schema_id="email.read",
            ),
            "send": Subaction(
                id="send",
                prompt_line="Compose and send an email.",
                keywords=["send", "compose", "email to", "reply", "forward"],
                examples=["Email Alex: 'Running 10 minutes late'.", "Reply to that email and say thanks."],
                schema_id="email.send",
            ),
        },
    ),
        "calendar": Lane(
        id="calendar",
        prompt_line="Choose calendar for creating, viewing, updating, or asking about calendar events/meetings.",
        keywords=[
            "calendar", "event", "meeting", "invite", "appointment", "schedule",
            "availability", "free", "busy", "reschedule", "move", "cancel",
            "next week", "tomorrow", "today", "at", "on",
        ],
        examples=[
            "What’s on my calendar tomorrow?",
            "Schedule a meeting with Dana next Tuesday at 2pm.",
            "Move my 1:1 to Friday.",
        ],
        subactions={
            "list_events": Subaction(
                id="list_events",
                prompt_line="List calendar events in a time range or matching a query.",
                keywords=["what's on", "show", "list", "calendar", "events", "tomorrow", "next week"],
                examples=["What meetings do I have today?", "Show my events next Monday."],
                schema_id="calendar.list_events",
            ),
            "create_event": Subaction(
                id="create_event",
                prompt_line="Create a new calendar event/meeting.",
                keywords=["create", "schedule", "add", "book", "meeting", "invite"],
                examples=["Add a meeting tomorrow at 10am called 'Budget review'."],
                schema_id="calendar.create_event",
            ),
            "update_event": Subaction(
                id="update_event",
                prompt_line="Update/reschedule an existing event (time, title, attendees, location).",
                keywords=["update", "change", "move", "reschedule", "edit"],
                examples=["Move the team sync to 4pm.", "Change the location to Zoom."],
                schema_id="calendar.update_event",
            ),
        },
    ),
    "autonomy": Lane(
        id="autonomy",
        prompt_line="Choose autonomy for “if/when/then” rules, routines, or recurring automation logic across devices/services.",
        keywords=[
            "if", "when", "then", "rule", "automation", "routine", "whenever",
            "every day", "every weekday", "recurring", "trigger", "condition",
            "schedule rule", "sunset", "sunrise",
        ],
        examples=[
            "If the front door unlocks after 10pm, turn on the hallway light.",
            "Every weekday at 7am, start the coffee maker.",
        ],
        subactions={
            "create_rule": Subaction(
                id="create_rule",
                prompt_line="Create an automation/rule from trigger + conditions + actions.",
                keywords=["if", "when", "then", "create rule", "automation", "routine"],
                examples=["When motion is detected, then turn on the lights for 5 minutes."],
                schema_id="autonomy.create_rule",
            ),
            "list_rules": Subaction(
                id="list_rules",
                prompt_line="List existing automations/rules.",
                keywords=["list", "show", "what rules", "automations", "routines"],
                examples=["Show my automations.", "List rules related to lights."],
                schema_id="autonomy.list_rules",
            ),
            "update_rule": Subaction(
                id="update_rule",
                prompt_line="Update/enable/disable/delete an existing rule.",
                keywords=["update", "edit", "change", "enable", "disable", "delete"],
                examples=["Disable the bedtime routine.", "Update the rule to trigger at 9pm."],
                schema_id="autonomy.update_rule",
            ),
        },
    ),
    "plan": Lane(
        id="plan",
        prompt_line="Choose plan for multi-step workflows, reports, diagnostics, or tasks requiring multiple actions/tools.",
        keywords=[
            "plan", "steps", "workflow", "report", "diagnose", "investigate",
            "analyze", "root cause", "compare", "summarize", "checklist",
            "multi-step", "procedure",
        ],
        examples=[
            "Create a step-by-step plan to troubleshoot why the thermostat isn't responding.",
            "Generate a report of device connectivity issues and likely causes.",
        ],
        subactions={
            "create_plan": Subaction(
                id="create_plan",
                prompt_line="Generate a multi-step plan/workflow with ordered steps.",
                keywords=["plan", "steps", "workflow", "procedure", "checklist"],
                examples=["Plan how to migrate my smart-home hub to a new server."],
                schema_id="plan.create_plan",
            ),
            "generate_report": Subaction(
                id="generate_report",
                prompt_line="Generate a structured report (findings, recommendations, next steps).",
                keywords=["report", "summary", "findings", "recommendations"],
                examples=["Write a report on why automations are failing."],
                schema_id="plan.generate_report",
            ),
            "run_diagnostics": Subaction(
                id="run_diagnostics",
                prompt_line="Run diagnostics workflow (gather info, propose tests, interpret results).",
                keywords=["diagnose", "debug", "troubleshoot", "investigate"],
                examples=["Diagnose why the living room speaker keeps disconnecting."],
                schema_id="plan.run_diagnostics",
            ),
        },
    ),
       "tool": Lane(
        id="tool",
        prompt_line="Choose tool for local/system/hardware information (time/date, CPU, memory, disk, OS, uptime) or non-HA utilities.",
        keywords=[
        "cpu", "processor", "load", "usage",
        "memory", "ram",
        "disk", "storage", "drive",
        "os", "system", "hostname",
        "uptime", "boot",
        "ip", "network",
        "process", "logs",

        # Strong time/date phrases
        "what time is it", "current time", "what's the time",
        "what date is it", "today's date", "current date",
        "timezone",
        ],
        examples=[
            "What time is it right now?",
            "How much disk space is left?",
            "What OS is this machine running?",
        ],
        subactions={
        },
    ),
    "chat": Lane(
        id="chat",
        prompt_line="Choose 'chat' for general conversation, explanations, brainstorming, or anything not covered above.",
    )
}

DISALLOWED = ["calendar", "plan", "email", "autonomy"]

LANE_REGISTRY = {id: lane for id, lane in FULL_LANE_REGISTRY.items() if lane.id not in DISALLOWED}
LANES = [lane.id for id, lane in LANE_REGISTRY.items()]

if "tool" in LANES:
    tool_reg = LANE_REGISTRY.get("tool")

    if tool_reg:
        for tool_entry in TOOL_PROMPT_LIST.split("\n"):
            try:
                _name, description = tool_entry.split(": ", 1)
                name = _name.split("- ", 1)[1]
                
                if tool_reg.subactions is None:
                    tool_reg.subactions = {}

                tool_reg.subactions[name] = Subaction(
                    id=name,
                    prompt_line=description,
                    keywords=None,
                    schema_id=name
                )
            except:
                continue


IMPERATIVE_VERBS = {
    "turn", "switch", "set", "open", "close", "toggle", "dim", "brighten",
    "increase", "decrease", "raise", "lower", "start", "stop", "pause", "resume",
    "play", "mute", "unmute", "lock", "unlock",
}

INTERROGATIVES = {
    "what", "which", "who", "when", "where", "why", "how",
    "is", "are", "am", "do", "does", "did", "can", "could", "would", "will",
    "status",
}

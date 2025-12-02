import { Streamdown } from "streamdown";

export function Note() {
  return (
    <div className="flex flex-col w-full h-screen relative max-w-2xl mx-auto">
      <div className="w-full h-full px-2 pt-8 pb-8 overflow-y-auto space-y-8 no-scrollbar">
        <Streamdown>{roadmap_content}</Streamdown>
      </div>
    </div>
  );
}

// chatgpt roadmap 🔥🔥🔥
const roadmap_content = `
Got you — with the **JARVIS-style persistent assistant** direction in mind, the roadmap needs to shift away from “chat app improvements” and toward **system-level autonomy, continuous context, voice interaction, and tool-driven action**.

Below is an updated roadmap that aligns tightly with a *permanently running*, *tool-empowered*, *context-aware*, *personality-consistent* AI agent — not a chatbot.

---

# 🧠 **SYRIS Roadmap — JARVIS-Oriented Edition**

This roadmap focuses on SYRIS as a **persistent intelligence layer**, capable of *listening*, *responding*, *acting*, and *adapting* — rather than staying inside a chat UI.

---

# 🟦 **FOUNDATION: Persistent, Unified SYRIS Identity**

### **1. Single Global Personality Pipeline (KEEP)**

* One system prompt governing the entire AI personality.
* All chats / voice sessions reuse the same identity.
* No per-chat overrides — only temporary “context injections”.

### **2. Global Context Memory (Long-Horizon Awareness)**

* Instead of chat-level memory, SYRIS maintains:

  * **User preferences**
  * **Ongoing tasks**
  * **Recent activity context**
  * **Pinned projects**
* This forms the “ongoing awareness” layer similar to JARVIS remembering what Tony is doing.

### **3. Runtime State Manager**

* In-memory state store that tracks:

  * Active tool processes
  * Timers
  * System events
  * Ongoing tasks
* Survives across interactions.

---

# 🟧 **VOICE-FIRST EXPERIENCES**

### **4. Voice Input + Wake Word (“SYRIS?”)**

* Real-time microphone listening (toggleable).
* Hotword detection → “siris?” or custom phrase.

### **5. Low-Latency Voice Streaming**

* Partial transcription pipeline (think VAD + whisper streaming).
* Immediate model response.
* Audio output using instant TTS streaming.

### **6. Ambient Mode**

* SYRIS runs passively in the background.
* Can interrupt with relevant information:

  * Calendar reminder
  * Notification summary
  * Background tasks finishing

---

# 🟨 **AGENT INTELLIGENCE**

### **7. Tooling Framework V2 (Core of JARVIS-Like Behavior)**

You’re already halfway there. Next steps:

#### **A. Tool Descriptions & Schema**

* Each tool gets AI-readable metadata:

  * What it does
  * When to use it
  * Input structure
  * Error patterns
* This massively improves autonomous behaviour.

#### **B. Chained Tool Execution**

* SYRIS can plan:

  > “To complete this, I’ll need to call A → then B → then lookup C.”
* No user micromanagement.

#### **C. Error Recovery**

* If a tool fails:

  * Retry
  * Self-correct arguments
  * Ask for clarity only if required

#### **D. Long Running Tasks**

* Example: downloading files, parsing data, automating builds
* SYRIS notifies when done, like:

  > “The analysis is ready, sir.”

---

# 🟩 **ENVIRONMENT AWARENESS**

### **8. OS-Level Tools**

To become JARVIS-like, SYRIS must interact with the system:

* File system access
* Running/closing programs
* Fetching system stats
* Controlling brightness/volume
* Managing notifications

With tight permission boundaries.

### **9. Event Subscriptions**

Let SYRIS *react* to triggers:

* File changes
* System hooks
* Network events
* Calendar events
* GitHub webhooks (e.g., “new PR opened”)

---

# 🟪 **AUTONOMY LAYER (The JARVIS Feel)**

### **10. Proactive Behaviour**

SYRIS should be able to initiate dialog or action when useful:

* “Sir, a new folder appeared in your workspace.”
* “Your build crashed with an error.”
* “Your meeting is in 5 minutes.”

Dynamic importance scoring prevents spam.

### **11. Goal-Oriented Routines**

Users can say:

> “SYRIS, optimize my project build speed.”

SYRIS:

* Plans steps
* Uses tools
* Tracks progress
* Reports outcomes

### **12. Internal Reflection Pass**

Before each output:

* Quick self-check for tool correctness
* Detect hallucinated paths
* Ensure tone consistency
* Validate next action

---

# 🟥 **APP (LOW PRIORITY, BUT NICE TO HAVE)**

Since app usage will reduce over time, but still exists for debugging:

### **13. Command Palette**

Like VSCode → quick actions:

* “Run tool”
* “Search logs”
* “View system state”
* “See active tasks”

### **14. Enhanced Sidebar (Minimal Dev Effort)**

* Global search
* Filter by tool runs
* Quick-open previous voice sessions

### **15. Agent Logs Viewer**

View:

* Tool call sequences
* Reasoning tokens (thinking)
* Voice interactions
* Errors

---

# 🟫 **FUTURE (OPTIONAL BUT INCREDIBLY COOL)**

### **16. SYRIS Extensions**

Allow developers to ship plugins/tools like:

* “syris-spotify”
* “syris-homeassistant”
* “syris-notion”

### **17. Multi-Device SYRIS**

Run on:

* PC
* Phone
* VR device
* Smart speaker

Using the same shared memory/context.

### **18. Personality Modulation (Without Breaking the Core)**

Not replacing the personality — but allowing:

* Calm mode
* Humorous mode
* Short mode
* Detailed mode

Still recognizably SYRIS.

---

# ⭐ **TOP 6 TO BUILD NEXT (To Transform It Into JARVIS)**

1. **Voice pipeline (wake word + real-time transcription + TTS)**
2. **Tooling Framework V2 with schemas + chain execution**
3. **OS-level tool suite (file, system control, events)**
4. **Runtime State Manager for ongoing tasks**
5. **Autonomous behaviour triggers + notifications**
6. **Proactive goal routines + planning**

These will take SYRIS from “a great chat assistant” → **an intelligent, persistent system woven into the user’s computer**.

---

If you want, I can also produce:

✅ An architecture diagram
✅ A repo folder structure for JARVIS version
✅ A step-by-step plan for implementing wake word listening
✅ Example tool metadata schema
or
✅ A “SYRIS API” spec for tools to follow

Just tell me which one.

`;

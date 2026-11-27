# Walkthroughs — show how something works

A dashboard tells you *what* is happening; a walkthrough shows *how* it happens. Use one when the
user wants to explain a process, a pipeline, an integration, an AI agent run, a checkout flow, an
incident timeline or an onboarding path — "show me how this works", "visualise the flow",
"walk me through it", "animate the steps", "simulate it".

Everything is driven by one engine in `vista-motion.js`: a `[data-vx-sequence]` root plays its
`[data-vx-step]` children in DOM order with real timings, and offers play / pause / step / speed /
reset. The visuals are ordinary Vista components, so a walkthrough sits inside any page and theme.

Live reference: `examples/orchid-agent-walkthrough.html`.

## 1. Pick the picture before writing markup

Ask: *what would make this obvious to someone seeing it for the first time?* Say the choice in one
sentence, then build it. Don't default to a chat window.

| The process looks like… | Show it as | Components |
|---|---|---|
| A job with stages that run, wait, fail, retry (CI, ETL, agent run, order fulfilment) | **Run trace** | `.vx-steps` + `.vx-step` rows, expandable payloads |
| Two or three systems talking (API call, OAuth, webhook, payment, handshake) | **Sequence diagram** | `.vx-seq` lanes + `.vx-seq__msg` arrows |
| A person moving through screens (checkout, sign-up, refund in an app) | **Product walkthrough** | `.vx-device` + `.vx-screens` + `.vx-stepper` + spotlights |
| A few big phases with a clear order (plan → build → launch) | **Stages** | `.vx-stepper` (alone or above a trace) |
| A narrative or a comparison (why churn drops, before/after) | **Story cards** | `.vx-story` cards revealed one by one |
| Work items flowing between columns | **Board** | `.vx-board` (+ `VistaMotion.insert/remove`) |
| Numbers changing over time | **Live chart / counters** | `VistaCharts.update` (morph) + `data-vx-odometer` |

Combine at most two (trace + device, stepper + seq) and drive them from **one** sequence so they move together.

## 2. Plan the story

Write the stage list first, with durations — it becomes the markup almost line by line:

```
trigger      Customer asks for a refund on order A-20931
understand   Classify intent                         400 ms
             Retrieve policy passages                700 ms
verify       ┬ Fetch order                           600 ms   (parallel)
             ├ Fraud score                           500 ms
             └ Payment status                        800 ms
             Payment status again (Loop 2)           600 ms
decide       Eligibility → Eligible (branch)         300 ms
resolve      Draft reply (model)                    2400 ms
             Policy check                            400 ms
             Issue refund · send reply               900 ms
done         "9 steps · 8.1s · Refund sent"
```
Name every stage with a verb, mark parallel groups, loops (with their count), branches (with the path
taken) and the end state. Keep a linear story under ~20 seconds at 1×.

## 3. Timing

Time is paced for the viewer, not copied from production.

| Kind of step | Duration (`data-ms`) |
|---|---|
| Flag, validation, cache hit | 150 – 300 |
| Parse, classify, small computation | 300 – 600 |
| Database / internal API | 500 – 900 |
| External API, payment, webhook | 700 – 1200 |
| Model call, large generation | 1800 – 3500 |
| A person reading / clicking a screen | 1000 – 2000 |
| Arrow in a sequence diagram | 500 – 900 |

- Each run adds ±15% jitter so replays feel live (`data-vx-jitter="0"` on the root for exact timings).
- Loops repeat with the same duration — never speed up iterations.
- The displayed duration of a finished step is its simulated time, independent of the 0.5×/2× speed.
- **No auto-play** for traces and walkthroughs: the viewer presses Run. Small, self-explanatory diagrams
  may use `data-vx-autoplay` (plays once when 40% visible). After the end, Run becomes Replay.

## 4. Markup

**Root + player**
```html
<section class="vx-card" data-vx-sequence data-vx-done="Refund sent" data-vx-failed="Escalated">
  <div class="vx-run__head"><div class="vx-card__title"><h2 class="vx-h2">Refund run</h2></div>
  <div class="vx-player">
    <button class="vx-btn vx-btn--cta vx-btn--sm" data-vx-run="play"><i data-lucide="play"></i><span data-vx-run-label>Run</span></button>
    <button class="vx-iconbtn vx-iconbtn--sm vx-iconbtn--ink" data-vx-run="pause" aria-label="Pause"><i data-lucide="pause"></i></button>
    <button class="vx-iconbtn vx-iconbtn--sm vx-iconbtn--ink" data-vx-run="step" aria-label="Next step"><i data-lucide="step-forward"></i></button>
    <button class="vx-iconbtn vx-iconbtn--sm vx-iconbtn--ink" data-vx-run="reset" aria-label="Reset"><i data-lucide="rotate-ccw"></i></button>
    <div class="vx-seg vx-seg--light" data-vx-group data-vx-run-speed>
      <button data-speed="0.5">0.5×</button><button class="is-active" data-speed="1">1×</button><button data-speed="2">2×</button>
    </div>
    <span class="vx-run__status" data-vx-run-status>Ready · 9 steps</span>
  </div></div>
  <ol class="vx-stepper vx-run__stages">…</ol>        <!-- optional stages under the header -->
  … steps …
</section>
```
Buttons disable themselves by state (no Pause while idle, no Step while running…). The status reads
the running step's name, "Paused · 3/7", then `9 steps · 8.1s · Refund sent` (a pure sequence diagram says
"messages"; set your own word with `data-vx-unit`). Reset rewinds the steps, the stepper and the screens.

**Run trace**
```html
<div class="vx-run__scroll" style="--h:440px">           <!-- optional own scroll box -->
<ol class="vx-steps">
  <li class="vx-step" data-vx-step data-ms="400" data-vx-stage="0">
    <span class="vx-step__ico"><i data-lucide="tag"></i></span>
    <details class="vx-step__body">                    <!-- or <div class="vx-step__body"> when there is no payload -->
      <summary><span class="vx-step__name">Classify intent</span><span class="vx-step__sub">refund_request · 0.97</span></summary>
      <pre class="vx-code">{ "intent": "refund_request", "confidence": 0.97, "tokens": 182 }</pre>
    </details>
    <span class="vx-step__meta"></span>                <!-- Waiting → ··· Running → 0.4s / Failed / Skipped -->
  </li>
  <li><div class="vx-steps__fork">In parallel</div>
    <ol class="vx-steps" data-vx-parallel>             <!-- these start together; the next step waits for all -->
      <li class="vx-step" data-vx-step data-ms="600">…</li>
      <li class="vx-step" data-vx-step data-ms="800" data-vx-result="skip">…</li>
    </ol>
  </li>
  <li class="vx-step" data-vx-step data-ms="600"> … <span class="vx-step__name">Payment status <span class="vx-status vx-status--warn">Loop 2</span></span> …</li>
  <li class="vx-step" data-vx-step data-ms="300"> … <span class="vx-step__name">Eligibility <span class="vx-status vx-status--info">→ Eligible</span></span> …</li>
</ol></div>
```
Pending rows are dimmed, the running row spins and shows animated dots, finished rows get a check
(`is-done`), a red `!` (`data-vx-result="fail"`, stops the run unless `data-vx-continue`) or a strike
(`data-vx-result="skip"`). The connector line fills as steps finish. Finished rows with a `<details>`
body expand to show their payload.

**Sequence diagram**
```html
<div class="vx-seq">
  <div class="vx-seq__lanes"><span><i data-lucide="bot"></i>Agent</span><span>Payments API</span><span>Card network</span></div>
  <ol class="vx-seq__msgs">
    <li class="vx-seq__msg" data-vx-step data-from="1" data-to="2" data-ms="700"><b>POST /v1/refunds</b>order=A-20931 · 84.00</li>
    <li class="vx-seq__msg" data-vx-step data-from="2" data-to="3" data-ms="900"><b>REFUND auth</b>card •• 4127</li>
    <li class="vx-seq__msg" data-vx-step data-from="3" data-to="2" data-ms="600"><b>00 Approved</b></li>
    <li class="vx-seq__msg" data-vx-step data-from="2" data-to="2" data-ms="400">idempotency key stored</li>   <!-- note on one lane -->
    <li class="vx-seq__msg" data-vx-step data-from="2" data-to="1" data-ms="600"><b>201 Created</b>re_7Hq2…</li>
  </ol>
</div>
```
Lanes and lifelines are built from the lane count; each message waits as a faint preview, then on its
turn its arrow draws from the sender (replies are grey and point back; `data-vx-result="fail"` turns it red).

**Stages**
```html
<ol class="vx-stepper"><li>Understand</li><li>Verify</li><li>Decide</li><li>Resolve</li></ol>
```
Steps move it with `data-vx-stage="2"`; from code: `VistaMotion.stepTo(el, 2)`. The track fills with a spring.

**Product walkthrough**
```html
<div class="vx-device">
  <div class="vx-device__bar"><i></i><i></i><i></i><span>app.relay.dev/orders/A-20931</span></div>
  <div class="vx-device__view vx-screens" style="--h:360px">
    <div class="vx-screen" id="scr-chat">…</div>
    <div class="vx-screen" id="scr-refund">… <button class="vx-btn vx-btn--cta" id="refund-btn">Refund $84.00</button></div>
    <div class="vx-screen" id="scr-done">…</div>
  </div>
</div>
…
<li class="vx-step" data-vx-step data-vx-screen="#scr-refund" data-vx-spot="#refund-btn" data-vx-coach="One tap — no form">…</li>
```
Screens share one grid cell (no height jump) and slide in the direction of travel. `data-vx-spot`
rings the element (and shows the coach label) before the step runs: `VistaMotion.spotlight(el, {label})`.
A screen switch from a control: a `data-vx-group data-vx-screens-nav` whose options carry `data-vx-screen="#id"`.

**Story cards** — `<div class="vx-story">` with `.vx-card[data-vx-step]` children (and `<span class="vx-story__n"></span>`
for 01, 02…): waiting cards are dimmed, each rises when its turn comes.

## 5. Script it

```js
const run = VistaMotion.sequence(document.querySelector("#refund-run"));   // also created automatically
run.play(); run.pause(); run.step(); run.speed(2); run.reset(); run.complete(); run.state();
root.addEventListener("vx:step", (e) => {           // { index, el, state: active|done|fail|skip }
  if (e.detail.state === "done" && e.detail.el.id === "charge") VistaMotion.countTo(total, 84);
});
root.addEventListener("vx:done", (e) => console.log(e.detail.ok, e.detail.ms));
```
`VistaMotion.finish()` (screenshots, print) completes running sequences instantly.

## 6. Rules that keep it smooth and readable

- **Never scroll the page for a step.** A step only scrolls its own `overflow: auto` box (e.g. `.vx-run__scroll`),
  by setting `scrollTop` — no `scrollIntoView`, no stacked smooth scrolls (they fight each other and stutter).
- One accent per walkthrough: the theme primary. Semantic colours only for meaning (fail, loop = amber, branch = blue).
- Realistic data in every label and payload: `order=A-20931`, `card •• 4127`, `201 Created`, `tokens 1,204`,
  `2026-11-27T14:20:31Z`, `p95 182 ms`. Never `…`, `foo`, `lorem` or `[value]` as content.
- Payloads in `<pre class="vx-code">` stay short (≤ 12 lines); the step name says what happened, the sub line says the key result.
- Mobile: the trace keeps working at 390px (the meta column stays, names wrap); device mockups shrink with the card.
- Reduced motion: the run still progresses with its timings (it's information), but nothing slides, spins or pulses.

## 7. Checklist

- [ ] The representation was chosen on purpose (table in §1) and stated.
- [ ] Every stage from the plan exists; parallel groups, loops and branches are visible as such.
- [ ] Nothing auto-plays except a small diagram with `data-vx-autoplay`; Replay appears after the end.
- [ ] Controls disable correctly; status ends with `N steps · Xs · <result>`.
- [ ] Finished rows expand to realistic payloads; failed / skipped rows read clearly.
- [ ] No page scroll jumps while it runs; it works at 390px and with reduced motion.
- [ ] `screenshot.py` prints no `[error]`; a completed-state screenshot (`run.complete()`) looks right.

import { MetricBars, type MetricRow } from "./MetricBars";
import {
  BOND_DOLLARS_PER_MILE,
  HILL_SEASONS,
  NATIVE_LAND_EVENTS,
  PACIFIC_SEASONS,
  SCANDAL_RISK_IF_INSIDER,
  acknowledgeRecord,
  createRailroad,
  playHillSeason,
  playPacificSeason,
  railroadDebrief,
  setInsiderContract,
  type GradeChoice,
  type Pace,
  type RailroadState,
} from "../lib/railroad";

function money(n: number): string {
  const sign = n < 0 ? "-" : "";
  return `${sign}$${Math.abs(Math.round(n)).toLocaleString("en-US")}`;
}

function meters(state: RailroadState): MetricRow[] {
  const books = state.books;
  const profit = state.path === "pacific" ? books.insiderProfit : books.trafficIncome;
  return [
    {
      key: "subsidy",
      label: state.path === "pacific" ? "Bond subsidy" : "Federal subsidy",
      value: books.subsidyCash,
      scale: state.path === "pacific" ? 20_000_000 : 1,
      hint: state.path === "pacific" ? "Paid per mile. Mountains pay the most." : "Hill’s line collects none.",
      tone: state.path === "pacific" ? "neutral" : "low",
      display: money(books.subsidyCash),
    },
    {
      key: "profit",
      label: state.path === "pacific" ? "Insider profit" : "Traffic income",
      value: Math.max(0, profit),
      scale: state.path === "pacific" ? 4_000_000 : 1_500_000,
      hint: state.path === "pacific" ? "The construction company pocket, if you signed." : "What the line earns from hauling.",
      tone: "high",
      display: money(profit),
    },
    {
      key: "quality",
      label: "Track quality",
      value: books.quality,
      scale: 100,
      hint: "Speed and steep grades wear this down. Rebuild comes later.",
      tone: "high",
      display: `${books.quality}`,
    },
    {
      key: "maintenance",
      label: "Rebuild bill",
      value: books.maintenance,
      scale: 2_000_000,
      hint: "Charged when the build ends. Shoddy track costs more.",
      tone: "low",
      display: money(books.maintenance),
    },
  ];
}

export function BuildLineView({
  railroad,
  onChange,
  onResults,
}: {
  railroad: RailroadState | null;
  onChange: (state: RailroadState | null) => void;
  onResults: () => void;
}) {
  if (!railroad) {
    return (
      <div className="pane">
        <p className="lede">
          Pick one company. The Pacific Railway Act pays by the mile and grants land. James J. Hill’s Great Northern
          earns only what traffic will pay. Both paths include a Native land record that does not touch the score.
        </p>
        <div className="hub-grid">
          <button
            type="button"
            className="path-card"
            onClick={() => onChange(createRailroad("pacific", Math.random()))}
          >
            <h2>Pacific Railway Act</h2>
            <p>
              Bonds of {money(BOND_DOLLARS_PER_MILE.flat)} / {money(BOND_DOLLARS_PER_MILE.foothills)} /{" "}
              {money(BOND_DOLLARS_PER_MILE.mountains)} per mile. Land grant doubled in 1864. A Credit Mobilier-style
              card comes next.
            </p>
          </button>
          <button type="button" className="path-card" onClick={() => onChange(createRailroad("hill", Math.random()))}>
            <h2>Great Northern</h2>
            <p>No federal subsidy. Choose grades. Slower, finished in 1893, paid by traffic.</p>
          </button>
        </div>
      </div>
    );
  }

  if (railroad.done) {
    const debrief = railroadDebrief(railroad);
    return (
      <div className="pane">
        <section className="insight">
          <h2>{debrief.headline}</h2>
          {railroad.exposed ? (
            <p>
              1872: the insider construction deal is exposed. Scandal risk was{" "}
              {Math.round(SCANDAL_RISK_IF_INSIDER * 100)}% because you signed.
            </p>
          ) : railroad.path === "pacific" && railroad.tookInsider ? (
            <p>You signed the insider contract. The 1872 roll missed you. The historical scandal did not miss Congress.</p>
          ) : null}
          {debrief.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </section>
        <MetricBars metrics={meters(railroad)} />
        <section className="record">
          <h2>Land record you read</h2>
          <ul>
            {NATIVE_LAND_EVENTS[railroad.path]
              .filter((event) => railroad.seenEventIds.includes(event.id))
              .map((event) => (
                <li key={event.id}>
                  {event.year}: {event.title}
                </li>
              ))}
          </ul>
        </section>
        <div className="row-actions">
          <button type="button" className="primary" onClick={onResults}>
            Open results
          </button>
          <button type="button" className="text-btn" onClick={() => onChange(null)}>
            Build the other way
          </button>
        </div>
      </div>
    );
  }

  if (railroad.path === "pacific" && railroad.tookInsider === null) {
    return (
      <div className="pane">
        <section className="temptation">
          <p className="eyebrow-inline">Temptation card</p>
          <h2>Insider construction company</h2>
          <p>
            Union Pacific insiders chartered Credit Mobilier to build their own railroad and bill it. The contract
            pays you for miles. An insider company skims a fifth of the bond subsidy into construction profit. It also
            sets scandal risk at {Math.round(SCANDAL_RISK_IF_INSIDER * 100)}%. The books were exposed in 1872.
          </p>
          <p>Refusing the card does not erase the historical scandal. It keeps your own profit on the subsidy at zero.</p>
        </section>
        <div className="choice-grid">
          <button type="button" className="choice" onClick={() => onChange(setInsiderContract(railroad, true))}>
            <strong>Sign the insider contract</strong>
            <span>Higher construction profit. Higher scandal risk.</span>
          </button>
          <button type="button" className="choice" onClick={() => onChange(setInsiderContract(railroad, false))}>
            <strong>Build in house</strong>
            <span>No skim. Scandal risk stays at zero on your books.</span>
          </button>
        </div>
      </div>
    );
  }

  const events = NATIVE_LAND_EVENTS[railroad.path];
  const event = events[railroad.seasonIndex];
  const needsRead = railroad.recordAck !== railroad.seasonIndex;
  const pacific = railroad.path === "pacific" ? PACIFIC_SEASONS[railroad.seasonIndex] : null;
  const hill = railroad.path === "hill" ? HILL_SEASONS[railroad.seasonIndex] : null;

  function choosePacific(pace: Pace) {
    onChange(playPacificSeason(railroad!, pace));
  }

  function chooseHill(choice: GradeChoice) {
    onChange(playHillSeason(railroad!, choice));
  }

  return (
    <div className="pane">
      <p className="eyebrow-inline">
        Season {railroad.seasonIndex + 1} of {events.length}
        {pacific ? ` · ${pacific.year} · ${pacific.place}` : ""}
        {hill ? ` · ${hill.year} · ${hill.place}` : ""}
      </p>
      {event ? (
        <section className="record">
          <h2>{event.title}</h2>
          <p>{event.body}</p>
          <p className="note">This record does not change cash, miles, quality, or the rebuild bill.</p>
          {needsRead ? (
            <button type="button" className="primary" onClick={() => onChange(acknowledgeRecord(railroad))}>
              I have read this record
            </button>
          ) : (
            <p>Record noted. Choose how to build.</p>
          )}
        </section>
      ) : null}
      <MetricBars metrics={meters(railroad)} />
      {railroad.path === "pacific" && pacific ? (
        <div className="choice-grid">
          <button type="button" className="choice" disabled={needsRead} onClick={() => choosePacific("fast")}>
            <strong>Push the miles</strong>
            <span>
              90 miles on {pacific.terrain} ground at {money(BOND_DOLLARS_PER_MILE[pacific.terrain])} per mile. Quality
              drops. The contract pays you to be fast.
            </span>
          </button>
          <button type="button" className="choice" disabled={needsRead} onClick={() => choosePacific("careful")}>
            <strong>Lay it to last</strong>
            <span>45 miles. Less subsidy this season. The track holds up when the rebuild bill arrives.</span>
          </button>
        </div>
      ) : null}
      {railroad.path === "hill" && hill ? (
        <div className="choice-grid">
          <button type="button" className="choice" disabled={needsRead} onClick={() => chooseHill("low-grade")}>
            <strong>Follow the low grade</strong>
            <span>Fewer miles this season. Trains can haul more, so traffic income is higher. This is Hill’s habit.</span>
          </button>
          <button type="button" className="choice" disabled={needsRead} onClick={() => chooseHill("steep")}>
            <strong>Take the steep shortcut</strong>
            <span>More miles now. Grades cut the traffic and raise operating cost. No bond check is coming.</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}

import { useState } from "react";
import { REFLECTION_PROMPTS } from "../lib/content";
import { homesteadDebrief, type HomesteadState } from "../lib/homestead";
import { finishedRailroads, type Progress, type Reflections } from "../lib/progress";
import { railroadDebrief, type RailroadState } from "../lib/railroad";
import { TIMELINE } from "../lib/timeline";

function money(n: number): string {
  const sign = n < 0 ? "-" : "";
  return `${sign}$${Math.abs(Math.round(n)).toLocaleString("en-US")}`;
}

function homesteadSummary(state: HomesteadState | null): string {
  if (!state) return "Round 1 is not started.";
  if (!state.provedUp && !state.abandoned) return "Round 1 is still in progress.";
  const debrief = homesteadDebrief(state);
  const freight = state.log.reduce((sum, row) => sum + row.freight, 0);
  return `${debrief.outcome} Claim: ${state.distanceMiles} miles from the rail. Cash ${money(state.cash)}. Debt ${money(state.debt)}. Freight paid over the years: ${money(freight)}.`;
}

function railroadSummary(state: RailroadState | null): string {
  if (!state) return "Round 2 is not started.";
  if (!state.done) return "Round 2 is still in progress.";
  const debrief = railroadDebrief(state);
  const books = state.books;
  if (state.path === "pacific") {
    return `${debrief.headline}. Subsidy ${money(books.subsidyCash)}. Insider profit ${money(books.insiderProfit)}. Quality ${books.quality}. Rebuild bill ${money(books.maintenance)}. Scandal ${state.exposed ? "exposed in 1872" : "not drawn on your books"}.`;
  }
  return `${debrief.headline}. Subsidy ${money(books.subsidyCash)}. Traffic income ${money(books.trafficIncome)}. Quality ${books.quality}. Rebuild bill ${money(books.maintenance)}. Completed ${TIMELINE.greatNorthernCompleted}.`;
}

export function ResultsView({
  progress,
  onReflections,
  onReset,
}: {
  progress: Progress;
  onReflections: (next: Reflections) => void;
  onReset: () => void;
}) {
  const [armed, setArmed] = useState(false);

  return (
    <div className="pane" id="results">
      <p className="lede">
        Short record of both rounds, then the constructed-response prompts for packet question 10. Print this page or
        copy the prompts into the packet.
      </p>
      <section className="summary-card">
        <h2>Round 1 · Prove Up</h2>
        <p>{homesteadSummary(progress.homestead)}</p>
      </section>
      <section className="summary-card">
        <h2>Round 2 · Build the Line</h2>
        {finishedRailroads(progress).length === 0 ? (
          <p>{railroadSummary(progress.railroad)}</p>
        ) : (
          finishedRailroads(progress).map((line) => <p key={line.path}>{railroadSummary(line)}</p>)
        )}
        {progress.railroad && !progress.railroad.done ? <p>The path you are on now is still in progress.</p> : null}
        <p>
          The Pacific Railway bonds were federal loans to be repaid, not grants. The Great Northern got no federal
          Pacific Railway Act grant, but it did inherit a predecessor’s state and territorial land grants. Market
          case: Hill still had to earn income from traffic, and Credit Mobilier is a cost of cronyism. Subsidy case:
          no traffic yet in empty territory, a wartime Union tying California to the rest of the country, and very
          high risk. The Native land record is not part of either cash score.
        </p>
      </section>
      {REFLECTION_PROMPTS.map((item, index) => (
        <section key={item.id} className="prompt-card">
          <h2>Q10 prompt {index + 1}</h2>
          <p>{item.prompt}</p>
          <label htmlFor={item.id}>Your notes</label>
          <textarea
            id={item.id}
            value={progress.reflections[item.id]}
            onChange={(event) =>
              onReflections({ ...progress.reflections, [item.id]: event.target.value })
            }
          />
        </section>
      ))}
      <div className="row-actions no-print">
        <button type="button" className="primary" onClick={() => window.print()}>
          Print or save as PDF
        </button>
        {armed ? (
          <button
            type="button"
            className="reset-btn"
            onClick={() => {
              setArmed(false);
              onReset();
            }}
          >
            Confirm reset — wipe this device
          </button>
        ) : (
          <button type="button" className="reset-btn" onClick={() => setArmed(true)}>
            Teacher: Reset
          </button>
        )}
      </div>
    </div>
  );
}

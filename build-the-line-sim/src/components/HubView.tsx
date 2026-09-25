import { residencyComplete } from "../lib/homestead";
import type { Progress } from "../lib/progress";
import type { Mode } from "../lib/routing";
import { TIMELINE_FACTS } from "../lib/timeline";

const PATHS: { id: Mode; key: string; title: string; body: string }[] = [
  {
    id: "prove",
    key: "P",
    title: "Round 1 · Prove Up",
    body: "Run a 160-acre Plains homestead from 1870 through 1874. Crop, fence, debt, and miles to the rail.",
  },
  {
    id: "line",
    key: "B",
    title: "Round 2 · Build the Line",
    body: "Take a Pacific Railway Act contract or build like James J. Hill. Read what the line cost Native nations.",
  },
  {
    id: "results",
    key: "R",
    title: "Results",
    body: "Both rounds, three Q10 prompts, and a print layout. Teachers can reset this device.",
  },
];

export function HubView({ progress, onOpen }: { progress: Progress; onOpen: (mode: Mode) => void }) {
  const proved = progress.homestead?.provedUp === true;
  const left = progress.homestead?.abandoned === true;
  const homesteadDone = proved || left || (progress.homestead ? residencyComplete(progress.homestead) : false);
  const lineDone = progress.railroad?.done === true;

  return (
    <div className="pane">
      <p className="lede">
        Federal land and railroad policy, 1862–1890. Round 1 is a homestead claim. Round 2 is a railroad contract.
        About ten minutes each. No login. Progress stays on this device.
      </p>
      <aside className="rule">
        <h2>How to read the scores</h2>
        <p>
          Cash, debt, subsidy, and track quality are the company and the farm. The Native land cards are a record of
          treaties broken, war, bison, and reservations. They are not a point total.
        </p>
      </aside>
      <div className="hub-grid">
        {PATHS.map((path) => (
          <button key={path.id} type="button" className="path-card" onClick={() => onOpen(path.id)}>
            <span>
              <kbd>{path.key}</kbd>
            </span>
            <h2>{path.title}</h2>
            <p>{path.body}</p>
          </button>
        ))}
      </div>
      <section className="progress-strip" aria-label="Progress on this device">
        <h2>On this device</h2>
        <ul>
          <li>
            <span className={`dot${homesteadDone ? " is-on" : ""}`} aria-hidden="true" />
            Prove Up {proved ? "proved up" : left ? "abandoned" : homesteadDone ? "five years kept" : "not finished"}
          </li>
          <li>
            <span className={`dot${lineDone ? " is-on" : ""}`} aria-hidden="true" />
            Build the Line {lineDone ? "finished" : "not finished"}
          </li>
        </ul>
      </section>
      <section className="idea-card">
        <h2>Timeline you will be held to</h2>
        <ul className="timeline">
          {TIMELINE_FACTS.map((fact) => (
            <li key={fact}>{fact}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

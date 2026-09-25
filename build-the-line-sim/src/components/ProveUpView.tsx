import { useState } from "react";
import { MetricBars, type MetricRow } from "./MetricBars";
import {
  CROP_PRICE,
  DISTANCE_CHOICES,
  FENCE_COST,
  GRASSHOPPER_YEAR,
  LOAN_AMOUNT,
  LOAN_INTEREST_RATE,
  SEASON_YEARS,
  abandonClaim,
  canProveUp,
  createHomestead,
  drawWeather,
  fenceChoices,
  freightCost,
  homesteadDebrief,
  proveUp,
  resolveYear,
  type Crop,
  type DistanceMiles,
  type FenceChoice,
  type HomesteadState,
  type Weather,
} from "../lib/homestead";

function money(n: number): string {
  const sign = n < 0 ? "-" : "";
  return `${sign}$${Math.abs(Math.round(n)).toLocaleString("en-US")}`;
}

function meters(state: HomesteadState, lastFreight: number): MetricRow[] {
  return [
    {
      key: "cash",
      label: "Cash",
      value: Math.max(0, state.cash),
      scale: 600,
      hint: "Below zero and the claim fails.",
      tone: "high",
      display: money(state.cash),
    },
    {
      key: "debt",
      label: "Debt",
      value: state.debt,
      scale: 800,
      hint: `Loans compound at ${Math.round(LOAN_INTEREST_RATE * 100)}% a year.`,
      tone: "low",
      display: money(state.debt),
    },
    {
      key: "freight",
      label: "Last freight bill",
      value: lastFreight,
      scale: 400,
      hint: "Scales with miles to the rail and with bushels.",
      tone: "neutral",
      display: money(lastFreight),
    },
    {
      key: "acres",
      label: "Acres broken",
      value: state.acresCultivated,
      scale: 160,
      hint: state.hasHouse ? "Sod house is up. Improvements count." : "The house comes in the first year you stay.",
      tone: "high",
      display: `${state.acresCultivated} / 160`,
    },
  ];
}

export function ProveUpView({
  homestead,
  weather,
  onChange,
  onResults,
}: {
  homestead: HomesteadState | null;
  weather: Weather[];
  onChange: (state: HomesteadState | null, weather: Weather[], seed: number) => void;
  onResults: () => void;
}) {
  const [crop, setCrop] = useState<Crop>("wheat");
  const [fence, setFence] = useState<FenceChoice>("sod");
  const [borrow, setBorrow] = useState(false);

  if (!homestead) {
    return (
      <div className="pane">
        <p className="lede">
          It is 1870. You file a 160-acre claim on the Plains. Before the first planting, choose how far you are from
          the rail. Freight is charged on every bushel you ship.
        </p>
        <div className="hub-grid">
          {DISTANCE_CHOICES.map((item) => (
            <button
              key={item.miles}
              type="button"
              className="path-card"
              onClick={() => {
                const seed = Math.floor(Math.random() * 1_000_000_000);
                onChange(createHomestead(item.miles as DistanceMiles), drawWeather(seed), seed);
              }}
            >
              <h2>{item.miles} miles</h2>
              <p>{item.note}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const closed = homestead.provedUp || homestead.abandoned;
  if (closed) {
    const debrief = homesteadDebrief(homestead);
    return (
      <div className="pane">
        <section className="insight">
          <h2>{homestead.provedUp ? "Patent issued" : "Claim abandoned"}</h2>
          <p>{debrief.outcome}</p>
          {debrief.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </section>
        <MetricBars metrics={meters(homestead, homestead.log.at(-1)?.freight ?? 0)} />
        <div className="row-actions">
          <button type="button" className="primary" onClick={onResults}>
            Go to Round 2, or open results
          </button>
          <button
            type="button"
            className="text-btn"
            onClick={() => {
              onChange(null, [], 0);
            }}
          >
            Replay this claim
          </button>
        </div>
      </div>
    );
  }

  if (homestead.yearIndex >= SEASON_YEARS.length) {
    const ready = canProveUp(homestead);
    return (
      <div className="pane">
        <section className="rule">
          <h2>1875 · Prove up or walk away</h2>
          <p>
            The Homestead Act requires five years of residency plus improvements. You have a sod house and{" "}
            {homestead.acresCultivated} acres broken. Debt does not block the patent. Leaving does.
          </p>
          {ready ? (
            <p>You met the five-year rule. You may prove up, or abandon the claim.</p>
          ) : (
            <p>The five-year residency rule is not met, so the patent is not available.</p>
          )}
        </section>
        <MetricBars metrics={meters(homestead, homestead.log.at(-1)?.freight ?? 0)} />
        <div className="row-actions">
          <button
            type="button"
            className="primary"
            disabled={!ready}
            onClick={() => onChange(proveUp(homestead), weather, 0)}
          >
            Prove up
          </button>
          <button type="button" className="text-btn" onClick={() => onChange(abandonClaim(homestead), weather, 0)}>
            Abandon the claim
          </button>
        </div>
      </div>
    );
  }

  const year = SEASON_YEARS[homestead.yearIndex] ?? 1870;
  const fences = fenceChoices(year);
  const fencePick = fences.includes(fence) ? fence : "sod";
  const sampleBushels = 200;
  const last = homestead.log.at(-1);

  return (
    <div className="pane">
      <section className="year-head">
        <p className="eyebrow-inline">
          Year {homestead.yearIndex + 1} of {SEASON_YEARS.length} · {homestead.distanceMiles} miles from the rail
        </p>
        <h2>{year}</h2>
        <p>
          Plant before you know the weather. {year === GRASSHOPPER_YEAR
            ? "This is 1874. The Rocky Mountain locust plague hits the Plains no matter what you plant."
            : "Rain or drought is revealed after you lock the year."}{" "}
          Barbed wire is Glidden’s 1874 patent — it is not for sale before then.
        </p>
        {last ? (
          <p className="note">
            Last year: {last.weather}
            {last.grasshoppers ? ", grasshoppers" : ""}, {last.bushels} bushels, freight {money(last.freight)}.
          </p>
        ) : null}
      </section>
      <MetricBars metrics={meters(homestead, last?.freight ?? freightCost(homestead.distanceMiles, sampleBushels))} />
      <fieldset className="q-block">
        <legend>Crop</legend>
        {(["wheat", "corn"] as const).map((item) => (
          <button
            key={item}
            type="button"
            className={`choice${crop === item ? " is-on" : ""}`}
            aria-pressed={crop === item}
            onClick={() => setCrop(item)}
          >
            <strong>{item === "wheat" ? "Wheat" : "Corn"}</strong>
            <span>
              {money(CROP_PRICE[item])} a bushel. Corn yields more in a wet year and fails harder in drought. Corn is
              bulkier, so freight hurts more.
            </span>
          </button>
        ))}
      </fieldset>
      <fieldset className="q-block">
        <legend>Fence</legend>
        <div className="choice-grid">
          {fences.map((item) => (
            <button
              key={item}
              type="button"
              className={`choice${fencePick === item ? " is-on" : ""}`}
              aria-pressed={fencePick === item}
              onClick={() => setFence(item)}
            >
              <strong>{item === "none" ? "No fence" : item === "sod" ? "Sod fence" : "Barbed wire"}</strong>
              <span>
                {item === "barbed"
                  ? `Glidden patent, ${year}. ${money(FENCE_COST.barbed)}. Stops open-range cattle.`
                  : item === "sod"
                    ? `${money(FENCE_COST.sod)}. Cuts cattle loss. Wood is scarce on the Plains.`
                    : "Open range. Cattle take a large share of the crop."}
              </span>
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="q-block">
        <legend>Borrow</legend>
        <div className="choice-grid">
          <button
            type="button"
            className={`choice${borrow ? " is-on" : ""}`}
            aria-pressed={borrow}
            onClick={() => setBorrow(true)}
          >
            <strong>Borrow {money(LOAN_AMOUNT)}</strong>
            <span>Interest is {Math.round(LOAN_INTEREST_RATE * 100)}% and compounds on the whole debt.</span>
          </button>
          <button
            type="button"
            className={`choice${!borrow ? " is-on" : ""}`}
            aria-pressed={!borrow}
            onClick={() => setBorrow(false)}
          >
            <strong>Do not borrow</strong>
            <span>If cash ends the year below zero, you abandon.</span>
          </button>
        </div>
      </fieldset>
      <button
        type="button"
        className="primary"
        onClick={() => {
          const nextWeather = weather[homestead.yearIndex] ?? "rainfall";
          onChange(
            resolveYear(homestead, { crop, fence: fencePick, borrow }, nextWeather),
            weather,
            0,
          );
        }}
      >
        Face {year}
      </button>
    </div>
  );
}

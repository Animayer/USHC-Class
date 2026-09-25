import { givePlayerFromRivals, giveRivalsFromPlayer, retune, transferShare } from "./market";
import type { EventView, TeamState } from "./types";

export interface EventResult {
  team: TeamState;
  event: EventView;
}

function usedRebates(team: TeamState, year?: number): boolean {
  return team.played.some(
    (card) => (card.id === "rebates" || card.id === "drawbacks") && (year === undefined || card.year === year),
  );
}

export function applyYearEvent(team: TeamState, year: number, previousYear: number | null): EventResult {
  switch (year) {
    case 1870:
      return {
        team: retune(team, { opinion: team.opinion + 2 }),
        event: {
          id: "founding",
          title: "Standard Oil, Cleveland",
          yearLabel: "1870",
          severity: "info",
          body: "A Cleveland partnership incorporates Standard Oil. Kerosene lights American homes, and it costs about 26¢ a gallon. Your stills are small. The refineries around the lake are not.",
          fact: "Standard Oil was founded in Cleveland in 1870. The price line on your chart starts at about 26¢ a gallon (approximate).",
        },
      };
    case 1872: {
      const played = usedRebates(team, 1872);
      return {
        team: retune(team, {
          heat: team.heat + (played ? 11 : 5),
          opinion: team.opinion - (played ? 7 : 3),
        }),
        event: {
          id: "sic",
          title: "South Improvement Company",
          yearLabel: "1872",
          severity: "major",
          body: "Railroads offer a secret pool: rebates to big shippers, and drawbacks taken from what independents pay. The Oil Regions erupt when it leaks. The company is dropped. The rebate habit is not.",
          fact: "This is the 1872 scheme Tarbell later called loaded dice: special privileges obtained by persistent secret effort.",
        },
      };
    }
    case 1874: {
      const weak = team.cost >= 14;
      let next = giveRivalsFromPlayer(team, weak ? 4 : 1);
      next = retune(next, { price: next.price - 2, opinion: next.opinion - 3 });
      return {
        team: next,
        event: {
          id: "panic",
          title: "Panic of 1873",
          yearLabel: "1874",
          severity: "major",
          body: weak
            ? "The panic reaches the oil trade. Your costs are high, so orders jump to cheaper stills. Weak refineries sell or shut. This is the climate of the Cleveland buyouts."
            : "The panic reaches the oil trade. Banks fail and orders dry up, but a low-cost still keeps its lamps lit. High-cost rivals are the ones selling out.",
          fact: "The Panic of 1873 was a national depression. In Cleveland it sat behind the wave of refinery buyouts.",
        },
      };
    }
    case 1876: {
      const shielded = team.pipelineOwned;
      let next = giveRivalsFromPlayer(team, shielded ? 1 : 3);
      next = retune(next, { cost: next.cost + (shielded ? 0 : 1), heat: next.heat + 2 });
      return {
        team: next,
        event: {
          id: "strike",
          title: "The trains stop",
          yearLabel: "1877",
          severity: "major",
          body: shielded
            ? "The Great Railroad Strike stops freight. Your pipeline keeps some oil moving, so the barrels do not all sit on a siding."
            : "The Great Railroad Strike stops freight. Barrels sit. Refiners who live by the railroad feel it first.",
          fact: "The Great Railroad Strike of 1877 showed how completely the oil trade depended on the same roads that paid secret rebates.",
        },
      };
    }
    case 1878:
      return tidewater(team, false);
    case 1880: {
      const giant = team.share >= 70;
      return {
        team: retune(team, {
          heat: team.heat + (giant ? 8 : 0),
          opinion: team.opinion + (giant ? -4 : 2),
        }),
        event: {
          id: "ninety",
          title: "About ninety percent",
          yearLabel: "1880",
          severity: "info",
          body: giant
            ? "Around 1880 a Standard-style refiner handled about 90 percent of America's oil. Your share is in that neighborhood. The papers are already drawing you as a giant over the Senate."
            : "Around 1880 a Standard-style refiner handled about 90 percent of America's oil. You are not there. Independents still have customers.",
          fact: "About 90 percent of U.S. refining by ~1880 is the textbook figure. Your percentage is the game, not that fact.",
        },
      };
    }
    case 1882: {
      const gap = previousYear === null || previousYear < 1878;
      let next = team;
      let tideLine = "";
      if (gap) {
        const hit = tidewater(team, true);
        next = hit.team;
        tideLine =
          " Since your last season, the Tidewater Pipeline (1879) let independents skip the railroad, and by about 1880 a Standard-style firm refined about 90 percent of U.S. oil.";
      }
      next = retune(next, { heat: next.heat + (next.trustFormed ? 6 : 2) });
      return {
        team: next,
        event: {
          id: "trust-year",
          title: "The Standard Oil Trust",
          yearLabel: "1882",
          severity: "major",
          body: `Stockholders of dozens of oil companies hand control to one board of trustees. Many signs on the door. One set of orders.${tideLine}`,
          fact: "A trust (1882) is horizontal combination. Vertical integration, Carnegie's steel strategy, owns the steps of making the product instead.",
        },
      };
    }
    case 1884: {
      const good = team.quality >= 4;
      let next = good ? givePlayerFromRivals(team, 2) : team;
      next = retune(next, {
        price: next.price - (good ? 1 : 0),
        opinion: next.opinion + (good ? 3 : 1),
      });
      return {
        team: next,
        event: {
          id: "lamp-bill",
          title: "The lamp bill",
          yearLabel: "1885",
          severity: "info",
          body: good
            ? "Families notice the gallon price. Paraffin, lubricants, and petroleum jelly make the barrel worth more than kerosene alone. Buyers can tell."
            : "Families notice the gallon price. The historical slide runs from about 26¢ in the early 1870s toward about 8¢ by 1885. Byproducts would have helped you ride it.",
          fact: "The drop from about 26¢ to about 8¢ a gallon is approximate, for class, not one surviving receipt.",
        },
      };
    }
    case 1886: {
      const exposed = usedRebates(team);
      let next = team;
      if (exposed) next = giveRivalsFromPlayer(next, 5);
      next = retune(next, {
        rebatesIllegal: true,
        heat: next.heat + (exposed ? 12 : -5),
        opinion: next.opinion + (exposed ? -6 : 5),
      });
      return {
        team: next,
        event: {
          id: "icc",
          title: "Interstate Commerce Act",
          yearLabel: "1887",
          severity: "major",
          body: exposed
            ? "The Interstate Commerce Act tells the railroads to stop unpublished favors. Your rebates are now a hearing, not a discount."
            : "The Interstate Commerce Act tells the railroads to stop unpublished favors. You did not live on those rates, so the law mostly hits the other side.",
          fact: "1887 starts federal railroad regulation. The Sherman Antitrust Act follows in 1890. Subsidy is giving way to rules.",
        },
      };
    }
    case 1890: {
      const target = team.share >= 70 || team.trustFormed;
      let next = team;
      if (target) next = giveRivalsFromPlayer(next, 8);
      next = retune(next, {
        trustBuster: target || next.trustBuster,
        heat: next.heat + (target ? 20 : 3),
        opinion: next.opinion + (target ? -8 : 2),
      });
      return {
        team: next,
        event: {
          id: "sherman",
          title: "Sherman Antitrust Act",
          yearLabel: "1890",
          severity: "major",
          body: target
            ? "Every trust that restrains trade, and every attempt to monopolize, is declared illegal. The Senate votes 51–1. The House votes 242–0. Your name is on the poster. Enforcement is weak at first. The target is not."
            : "Every trust that restrains trade, and every attempt to monopolize, is declared illegal. The Senate votes 51–1. The House votes 242–0. You are not the poster. The rules have still changed.",
          fact: "July 2, 1890. Standard Oil is broken up by the Supreme Court in 1911, after this game ends. The vote was nearly unanimous.",
        },
      };
    }
    default:
      return {
        team,
        event: {
          id: "quiet",
          title: "A quiet season",
          yearLabel: String(year),
          severity: "info",
          body: "The lamps stay lit. No new statute, no panic. The stills and the railroads keep their argument going.",
          fact: "Between the famous years, refining was a weekly fight over cost and freight.",
        },
      };
  }
}

function tidewater(team: TeamState, mild: boolean): EventResult {
  const loss = team.pipelineOwned ? (mild ? 1 : 2) : mild ? 3 : 6;
  let next = transferShare(team, "player", "oilcreek", loss);
  if (!next.rivals.some((rival) => rival.id === "oilcreek" && rival.alive)) {
    next = giveRivalsFromPlayer(team, loss);
  }
  next = retune(next, {
    tidewater: true,
    opinion: next.opinion + (team.pipelineOwned ? 3 : -2),
  });
  return {
    team: next,
    event: {
      id: "tidewater",
      title: "Tidewater Pipeline",
      yearLabel: "1879",
      severity: "major",
      body: team.pipelineOwned
        ? "Independents open a long pipeline to the coast and skip the railroad. You already laid pipe, so the lesson stings less."
        : "Independents open a long pipeline to the coast and skip the railroad. Secret rebates matter less when oil can move without a freight agent.",
      fact: "The Tidewater Pipeline (1879) was the independents' way around the rail-and-rebate system.",
    },
  };
}

export function tarbellEpilogue(): EventView {
  return {
    id: "tarbell",
    title: "History's verdict",
    yearLabel: "1902–1904",
    severity: "info",
    body: "The rounds are over. Years later, Ida M. Tarbell publishes The History of the Standard Oil Company in McClure's (1902–1904). Her father was an independent oil man hurt in the rebate years. She writes that Rockefeller played with loaded dice: special privileges, not a fair start. Burton Folsom, writing much later, splits the era into market entrepreneurs and political entrepreneurs. They agree privilege is the thing to condemn. They disagree about which column of your scoreboard it fills.",
    fact: "Use Tarbell as an after-the-period source, the way DBQ Source B is used. She did not publish during the years you just played. The Supreme Court breaks Standard Oil up in 1911.",
  };
}

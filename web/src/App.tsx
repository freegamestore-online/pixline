import { GameShell, GameTopbar, GameAuth } from "@freegamestore/games";
import { Grid, PUZZLES } from "./puzzle";

const puzzle = PUZZLES[0]!;

export default function App() {
  return (
    <GameShell topbar={<GameTopbar title="Pixline" score={0} />}>
      <GameAuth />
      <main className="mx-auto flex h-full w-full max-w-md flex-col items-center justify-center gap-4 p-4">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "Fraunces, serif" }}>
          {puzzle.name}
        </h1>
        <div className="w-full">
          <Grid
            key={puzzle.id}
            rowClues={puzzle.rowClues}
            colClues={puzzle.colClues}
            solution={puzzle.solution}
            onSolved={() => console.log("Solved!")}
          />
        </div>
      </main>
    </GameShell>
  );
}

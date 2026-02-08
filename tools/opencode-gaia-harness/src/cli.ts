import {
  commandBootstrap,
  commandBug,
  commandGaiaInitSmoke,
  commandLeanSubagentsSmoke,
  commandListFreeModels,
  commandLockedSmoke,
  commandOpenCode,
  commandServeApi,
  commandServeWeb,
  commandSmoke,
  commandSuite,
  suiteModesHelp,
} from "./commands.js";
import { resolveRepoRoot } from "./paths.js";

function printHelp(): void {
  const modes = suiteModesHelp().join("|");

  console.log("Usage: bun run src/cli.ts <command> [args]");
  console.log("");
  console.log("Commands:");
  console.log("  bootstrap");
  console.log("  list-free-models");
  console.log("  smoke [prompt]");
  console.log("  bug [bug-report-file]");
  console.log("  gaia-init-smoke");
  console.log("  lean-subagents-smoke");
  console.log("  locked-smoke");
  console.log("  serve-web");
  console.log("  serve-api");
  console.log(`  suite [${modes}] [bug-report-file]`);
  console.log("  opencode [opencode args...]");
}

async function main(): Promise<void> {
  const [command, ...args] = process.argv.slice(2);
  const repoRoot = process.env.GAIA_REPO_ROOT ?? resolveRepoRoot();
  const context = { repoRoot };

  switch (command) {
    case "bootstrap":
      await commandBootstrap(context);
      return;
    case "list-free-models":
      await commandListFreeModels(context);
      return;
    case "smoke": {
      const prompt = args.length > 0 ? args.join(" ") : undefined;
      await commandSmoke(context, prompt);
      return;
    }
    case "bug":
      await commandBug(context, args[0]);
      return;
    case "gaia-init-smoke":
      await commandGaiaInitSmoke(context);
      return;
    case "lean-subagents-smoke":
      await commandLeanSubagentsSmoke(context);
      return;
    case "locked-smoke":
      await commandLockedSmoke(context);
      return;
    case "serve-web":
      await commandServeWeb(context);
      return;
    case "serve-api":
      await commandServeApi(context);
      return;
    case "suite":
      await commandSuite(context, args[0] ?? "basic", args[1]);
      return;
    case "opencode":
      await commandOpenCode(context, args);
      return;
    case "-h":
    case "--help":
    case "help":
      printHelp();
      return;
    default:
      printHelp();
      throw new Error(`Unknown command: ${command ?? "<none>"}`);
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});

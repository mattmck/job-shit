import { Command } from 'commander';
import { startWorkbenchServer } from '../server.js';

export function registerServeCommand(program: Command): void {
  program
    .command('serve')
    .description('Run the local job-shit workbench and API server.')
    .option('-p, --port <port>', 'Port to listen on', '4312')
    .action(async (opts: { port: string }) => {
      const port = Number(opts.port);
      const { port: actualPort } = await startWorkbenchServer(port);
      console.log(`job-shit workbench listening on http://localhost:${actualPort}`);
    });
}

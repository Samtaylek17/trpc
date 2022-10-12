import { createTRPCProxyClient, httpBatchLink, splitLink } from '@trpc/client';
import fetch from 'node-fetch';
import type { AppRouter } from '../server-gateway/index';

if (!global.fetch) {
  (global as any).fetch = fetch;
}

const client = createTRPCProxyClient<AppRouter>({
  links: [
    // create a custom ending link
    (runtime) => {
      // initialize the different links for different targets
      const servers = {
        serverA: httpBatchLink({ url: 'http://localhost:2021' })(runtime),
        serverB: httpBatchLink({ url: 'http://localhost:2022' })(runtime),
      };
      return (ctx) => {
        const { op } = ctx;
        // split the path by `.` as the first part will signify the server target name
        const pathParts = op.path.split('.');

        // first part of the query should be `server1` or `server2`
        const serverName = pathParts.shift() as string as keyof typeof servers;

        // combine the rest of the parts of the paths
        // -- this is what we're actually calling the target server with
        const path = pathParts.join('.');
        console.log(`calling ${serverName} on path ${path}`, {
          input: op.input,
        });

        const link = servers[serverName];

        return link({
          ...ctx,
          op: {
            ...op,
            // override the target path with the prefix removed
            path,
          },
        });
      };
    },
  ],
});

async function main() {
  {
    const result = await client.serverA.greet.query('tRPC');

    console.log(result.greeting.toUpperCase());
  }
  {
    const result = await client.serverB.foo.query();

    console.log(result.toUpperCase());
  }
}

main();

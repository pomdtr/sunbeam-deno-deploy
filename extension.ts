#!/usr/bin/env -S deno run -A
// deno-lint-ignore-file no-explicit-any
import { formatDistanceToNow } from "date-fns";
import { readAll } from "streams/read_all.ts";

const input = new TextDecoder().decode(await readAll(Deno.stdin));
const { command, args, prefs } = JSON.parse(input);

async function fetchDenoDeploy(path: string, init?: RequestInit) {
  const res = await fetch(`https://dash.deno.com/api/${path}`, {
    ...init,
    headers: {
      ...init?.headers,
      Authorization: `Bearer ${prefs.token}`,
    },
  });

  return res.json();
}

switch (command) {
  case "list-projects": {
    const projects = await fetchDenoDeploy("projects");

    console.log(
      JSON.stringify({
        title: "Deno Deploy Projects",
        type: "list",
        items: projects.map((project: any) => ({
          title: project.name,
          subtitle: project.type,
          accessories: [
            formatDistanceToNow(new Date(project.updatedAt), {
              addSuffix: true,
            }),
          ],
          actions: [
            {
              type: "open",
              title: "Open Project in Browser",
              target: `https://dash.deno.com/projects/${project.name}`,
            },
            {
              type: "open",
              title: "Open Latest Deployment in Browser",
              target: `https://${project.name}.deno.dev`,
            },
            {
              type: "run",
              title: "View Deployments",
              command: {
                name: "list-deployments",
                args: {
                  project: project.name,
                },
              },
            },
          ],
        })),
      })
    );
    break;
  }
  case "list-deployments": {
    const deployments = await fetchDenoDeploy(
      `projects/${args.project}/deployments`
    );

    console.log(
      JSON.stringify({
        title: `Deno Deploy Deployments for ${args.project}`,
        type: "list",
        items: deployments[0].map((d: any) => {
          const { deployment, createdAt } = d;
          return {
            title: deployment.id,
            accessories: [
              formatDistanceToNow(new Date(createdAt), {
                addSuffix: true,
              }),
            ],
            actions: [
              {
                type: "open",
                title: "Open in Browser",
                target: `https://${args.project}-${deployment.id}.deno.dev`,
              },
            ],
          };
        }),
      })
    );
    break;
  }
  default:
    console.error("Unknown endpoint", Deno.args[0]);
    Deno.exit(1);
}

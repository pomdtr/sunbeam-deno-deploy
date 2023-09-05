#!/usr/bin/env -S deno run -A
// deno-lint-ignore-file no-explicit-any

const deployToken = Deno.env.get("DEPLOY_TOKEN");
if (!deployToken) {
  console.error(
    "DEPLOY environment variable is required to use this extension."
  );
  Deno.exit(1);
}

async function fetchDenoDeploy(path: string, init?: RequestInit) {
  const res = await fetch(`https://dash.deno.com/api/${path}`, {
    ...init,
    headers: {
      ...init?.headers,
      Authorization: `Bearer ${deployToken}`,
    },
  });

  return res.json();
}

const manifest = {
      title: "Deno Deploy",
      description: "Manage Deno Deploy websites from sunbeam",
      homepage: "https://dash.deno.com/projects/sunbeam-deno-deploy",
      entrypoint: "./extension.ts",
      commands: [
        {
          name: "list-projects",
          title: "List all projects",
          mode: "filter",
        },
        {
          name: "list-deployments",
          mode: "filter",
          title: "List Deployments",
          args: [
            {
              name: "id",
              "type": "string"
            }
          ]
        }
      ],
    } as const

const handler = async (req: Request) => {
  if (req.method === "GET") {
    return Response.json(manifest);
  }

  const { command, args } = await req.json();
  switch (command) {
    case "list-projects": {
      const projects = await fetchDenoDeploy("projects");
      return Response.json({
        title: "Deno Deploy Projects",
        type: "list",
        items: projects.map((project: any) => ({
          title: project.name,
          subtitle: project.type,
          actions: [
            {
              type: "open",
              title: "Open Project in Browser",
              url: `https://dash.deno.com/projects/${project.name}`,
            },
            {
              type: "open",
              title: "Open Latest Deployment in Browser",
              url: `https://${project.name}.deno.dev`,
            },
            {
              type: "run",
              title: "View Deployments",
              command: {
                name: "list-deployments",
                args: {
                  id: project.name,
                },
              },
            },
          ],
        })),
      });
    }
    case "list-deployments": {
      const projectID = args.id
      const deployments = await fetchDenoDeploy(
        `projects/${projectID}/deployments`
      );

      return Response.json({
        title: `Deno Deploy Deployments for ${args.project}`,
        type: "list",
        items: deployments[0].map((d: any) => {
          const { deployment, createdAt } = d;
          return {
            title: deployment.id,
            actions: [
              {
                type: "open",
                title: "Open in Browser",
            url: `https://${args.project}-${deployment.id}.deno.dev`,
              },
            ],
          };
        }),
      });
    }
    default:
      return new Response(`Unknown command: ${command}`, { status: 400 });
  }
};


Deno.serve(handler);

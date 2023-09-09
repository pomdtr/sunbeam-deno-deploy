// deno-lint-ignore-file no-explicit-any
import { formatDistanceToNow } from "npm:date-fns@2.30.0";
import {
  List,
  Listitem,
  createExtension,
} from "../sunbeam/types/typescript/mod.ts";
import { load } from "https://deno.land/std@0.201.0/dotenv/mod.ts";

const env = await load();

const deployToken =
  env["DENO_DEPLOY_TOKEN"] || Deno.env.get("DENO_DEPLOY_TOKEN");
if (!deployToken) {
  console.error(
    "DENO_DEPLOY_TOKEN environment variable is required to use this extension."
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

const extension = createExtension({
  title: "Deno Deploy",
  description: "Manage Deno Deploy",
})
  .addCommand({
    title: "List all projects",
    name: "list-projects",
    mode: "filter",
    run: async () => {
      const projects = await fetchDenoDeploy("projects");
      return {
        title: "Deno Deploy Projects",
        items: projects.map(
          (project: any) =>
            ({
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
                    params: {
                      project: project.name,
                    },
                  },
                },
              ],
            } as Listitem)
        ),
      } as List;
    },
  })
  .addCommand({
    title: "List all deployments",
    name: "list-deployments",
    mode: "filter",
    params: [
      {
        name: "project",
        type: "string",
      },
    ],
    run: async ({ params }) => {
      if (!params || !params.project) {
        throw new Error("Missing required param: project");
      }
      const deployments = await fetchDenoDeploy(
        `projects/${params.project}/deployments`
      );
      return {
        title: `Deno Deploy Deployments for ${params.project}`,
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
                url: `https://${params.project}-${deployment.id}.deno.dev`,
              },
            ],
          };
        }),
      };
    },
  });

export default extension;

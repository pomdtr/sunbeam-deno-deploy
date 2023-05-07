import * as sunbeam from "https://deno.land/x/sunbeam@v1.0.0-rc.1/index.d.ts";
import * as dotenv from "https://deno.land/std@0.186.0/dotenv/mod.ts";
import * as path from "https://deno.land/std@0.186.0/path/mod.ts";
import { parse } from "https://deno.land/std@0.186.0/flags/mod.ts";
import { formatDistanceToNow } from "npm:date-fns";

const dirname = decodeURI(new URL(".", import.meta.url).pathname);
const entrypoint = path.join(dirname, "sunbeam-extension");

async function loadToken() {
  if (Deno.env.get("DENO_DEPLOY_TOKEN")) {
    return Deno.env.get("DENO_DEPLOY_TOKEN");
  }

  const configData = await dotenv.load();
  if (configData.DENO_DEPLOY_TOKEN) {
    return configData.DENO_DEPLOY_TOKEN;
  }

  throw new Error("Missing DENO_DEPLOY_TOKEN");
}

const DENO_DEPLOY_TOKEN = await loadToken();
async function request(path: string) {
  const res = await fetch(`https://dash.deno.com/api/${path}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${DENO_DEPLOY_TOKEN}`,
      "Content-Type": "application/json",
    },
  });

  return res.json();
}

const args = parse(Deno.args, {
  string: ["project"],
});

if (args._.length == 0 || args._[0] == "projects") {
  const projects = await request("projects");

  const page: sunbeam.Page = {
    title: "Deno Deploy Projects",
    type: "list",
    // showPreview: true,
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
          // preview: {
          //   text: JSON.stringify(project, null, 2),
          //   highlight: "json",
          // },
          actions: [
            {
              type: "open",
              title: "Open in Browser",
              target: `https://dash.deno.com/projects/${project.name}`,
            },
            {
              type: "open",
              title: "Open Latest Deployment",
              target: `https://${project.productionDeployment.domainMappings[0].domain}`,
            },
            {
              type: "push",
              title: "View Deployments",
              command: [entrypoint, "deployments", "--project", project.name],
            },
          ],
        } as sunbeam.Listitem)
    ),
  };

  console.log(JSON.stringify(page));
  Deno.exit(0);
}

if (args._[0] == "deployments") {
  if (!args.project) {
    console.error("Missing --project");
    Deno.exit(1);
  }

  const deployments = await request(`projects/${args.project}/deployments`);

  const page: sunbeam.Page = {
    title: `Deno Deploy Deployments for ${args.project}`,
    type: "list",
    items: deployments[0].map(
      (deployment: any) =>
        ({
          title: deployment.domainMappings[0].domain,
          subtitle: deployment.relatedCommit.message,
          actions: [
            {
              type: "open",
              title: "Open in Browser",
              target: `https://${deployment.domainMappings[0].domain}`,
            },
          ],
        } as sunbeam.Listitem)
    ),
  };

  console.log(JSON.stringify(page));
  Deno.exit(0);
}

console.error("Unknown endpoint", args._[0]);
Deno.exit(1);

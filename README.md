# Deno Deploy Integration for Sunbeam

## Requirements

- [Sunbeam](https://github.com/pomdtr/sunbeam)
- [Deno](https://deno.land/)

The `DENO_DEPLOY_TOKEN` environment variable must be set.

## Installation

```bash
sunbeam extension install deno https://github.com/pomdtr/sunbeam-deno-deploy
```

## Usage

```bash
sunbeam deno # Show Project
sunbeam deno deployments --project <project> # Show Deployments
```

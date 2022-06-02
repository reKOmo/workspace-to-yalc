## Description

Looks for `workspace` protocol packages and adds them to yalc.lock for easy install in docker containsers.

## Run

To run `npx workspace-to-yalc`.

## Example

1. Run `npx workspace-to-yalc`
2. Mount yalc store folder to docker container
3. In Dockerfile
a. Install yalc with `npm i -g yalc`
b. Run `yalc update --store-folder <path-to-mounted-store>` in project directory

## Options

>`--lockfile-only`

Only generates yalc.lock file.

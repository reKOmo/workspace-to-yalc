#! /usr/bin/env node

import { readdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import detectIndent from "detect-indent";


function getIndent(str) {
    return detectIndent(str).indent || '    ';
}

function readPackage() {
    try {
        const file = readFileSync("package.json", 'utf-8').toString();

        const indent = getIndent(file);

        const pkg = JSON.parse(file);

        pkg.__indent = indent;

        return pkg;
    } catch {
        console.error("Package.json couldn't be loaded");
    }
}

function getWorkspacePackagesFromPkg(pkg) {
    const workspacePackages = [];

    if (pkg.dependencies) {
        for (const key in pkg.dependencies) {
            const val = pkg.dependencies[key];
            if (val.startsWith("workspace:")) {
                workspacePackages.push(key);
            }
        }
    }

    if (pkg.devDependencies) {
        for (const [key, val] in pkg.devDependencies) {
            if (val.startsWith("workspace:")) {
                workspacePackages.push(key);
            }
        }
    }

    return workspacePackages;
}

function packagesToYalc(workspacePackages) {
    const ob = { version: "v1", packages: {} };

    workspacePackages.forEach(p => {
        ob.packages[p] = { signature: "", link: true }
    })

    return ob;
}

function deleteOldLockfile() {
    const files = readdirSync("./")
    if (files.includes("yalc.lock")) {
        rmSync("yalc.lock");
    }
}

function main() {

    const pkg = readPackage();

    const workspacePackages = getWorkspacePackagesFromPkg(pkg);

    const newYalcLock = packagesToYalc(workspacePackages);

    try {
        deleteOldLockfile();

        writeFileSync("yalc.lock", JSON.stringify(newYalcLock, null, pkg.__indent));
    } catch {
        console.error("Couldn't save new lockfile")
    }



}

main();
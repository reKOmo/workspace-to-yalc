#! /usr/bin/env node

import { readdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import detectIndent from "detect-indent";

function argumentPassed(arg) {
    return process.argv.includes(arg, 2);
}

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

function saveJSON(path, obj) {
    const indent = "    "
    if (obj.__indent) {
        indent = pkg.__indent;
        delete pkg.__indent;
    }

    writeFileSync(path, JSON.stringify(obj, null, indent));
}

function savePackage(pkg) {
    pkg = Object.assign({}, pkg);

    const indent = pkg.__indent;
    delete pkg.__indent;

    try {
        saveJSON("package.json", pkg);
    } catch {
        console.error("Package.json couldn't be modified");
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
        for (const key in pkg.devDependencies) {
            const val = pkg.devDependencies[key];
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

function modifyDepsInPkg(pkg, workspacePackages) {
    pkg = Object.assign({}, pkg);

    workspacePackages.forEach(p => {
        if (pkg.dependencies[p]) {
            pkg.dependencies[p] = "link:.yalc/" + p;
        } else if (pkg.devDependencies[p]) {
            pkg.devDependencies[p] = "link:.yalc/" + p;
        }
    })

    return pkg;
}

function main() {

    const pkg = readPackage();

    const workspacePackages = getWorkspacePackagesFromPkg(pkg);

    const newYalcLock = packagesToYalc(workspacePackages);

    try {
        deleteOldLockfile();

        newYalcLock.__indent = pkg.__indent;

        saveJSON("yalc.lock", newYalcLock);
    } catch {
        console.error("Couldn't save new lockfile")
    }

    if (!argumentPassed("--lockfile-only")) {
        const modPkg = modifyDepsInPkg(pkg, workspacePackages);

        savePackage(modPkg);
    }



}

let exports = {};
if (process.env.NODE_ENV == "test") {
    exports = {
        modifyDepsInPkg,
        packagesToYalc,
        getWorkspacePackagesFromPkg
    };
} else {
    main();
}

export default exports;
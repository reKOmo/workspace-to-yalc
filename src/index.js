#! /usr/bin/env node

import { readdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import detectIndent from "detect-indent";

const config = {
    protocol: argumentPassed("--file") ? "file" : "link",
    lockfileOnly: argumentPassed("--lockfile-only")
}

function argumentPassed(arg) {
    return process.argv.includes(arg, 2);
}

function getIndent(str) {
    return detectIndent(str).indent || "  ";
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
    let indent = "  ";
    if (obj.__indent) {
        indent = obj.__indent;
        delete obj.__indent;
    }

    writeFileSync(path, JSON.stringify(obj, null, indent));
}

function savePackage(pkg) {
    pkg = Object.assign({}, pkg);

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
        ob.packages[p] = { signature: "" }
        ob.packages[p][config.protocol] = true;
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
        const packageVersion = `${config.protocol}:.yalc/` + p;
        if (pkg.dependencies[p]) {
            pkg.dependencies[p] = packageVersion;
        } else if (pkg.devDependencies[p]) {
            pkg.devDependencies[p] = packageVersion;
        }
    })

    return pkg;
}

function main() {
    console.log(">> Reading package.json");
    const pkg = readPackage();

    const workspacePackages = getWorkspacePackagesFromPkg(pkg);

    const newYalcLock = packagesToYalc(workspacePackages);

    try {
        console.log(">> Generating yalc.lock");
        deleteOldLockfile();

        newYalcLock.__indent = pkg.__indent;

        saveJSON("yalc.lock", newYalcLock);
    } catch (err) {
        console.error("Couldn't save new lockfile", err);
    }

    if (!config.lockfileOnly) {
        console.log(">> Generating new package.json");
        const modPkg = modifyDepsInPkg(pkg, workspacePackages);
        try {
            savePackage(modPkg);
        } catch (err) {
            console.error("Failed to save package.json\n", err);
        }
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
import test from "ava";
import fs from "fs";
import path from "path";
import indexModule from "../src/index.js"

const testDirPath = path.dirname(test.meta.file.substring(8));
const testFolderPath = path.join(testDirPath, "test_dump_" + Math.floor(Math.random() * 10000));


function readJSON(path) {
    const file = fs.readFileSync(path, "utf-8");
    return JSON.parse(file.toString());
}

test.before(t => {
    //create test folder
    fs.mkdirSync(testFolderPath);

    const pkgFull = readJSON(path.join(testDirPath, "sample_files", "full/package.json"));
    const pkgNoDev = readJSON(path.join(testDirPath, "sample_files", "no_dev/package.json"));
    const pkgNone = readJSON(path.join(testDirPath, "sample_files", "no_workspace/package.json"));

    const pkgModFull = readJSON(path.join(testDirPath, "sample_files", "full/package.moded.json"));
    const pkgModNoDev = readJSON(path.join(testDirPath, "sample_files", "no_dev/package.moded.json"));

    const lockFull = readJSON(path.join(testDirPath, "sample_files", "full/yalc.lock"));
    const lockNoDev = readJSON(path.join(testDirPath, "sample_files", "no_dev/yalc.lock"));
    const lockNone = readJSON(path.join(testDirPath, "sample_files", "no_workspace/yalc.lock"));

    t.context.data = { pkgFull, pkgNoDev, pkgNone, pkgModFull, pkgModNoDev, lockFull, lockNoDev, lockNone };
});

test.after.always(_ => {
    try {
        fs.rmSync(testFolderPath, { recursive: true })
    } catch { }
})

// GET PACKAGES
test("Get workspace packages: none", t => {
    const result = indexModule.getWorkspacePackagesFromPkg(t.context.data.pkgNone);
    t.deepEqual(result, []);
})

test("Get workspace packages: no_dev", t => {
    const result = indexModule.getWorkspacePackagesFromPkg(t.context.data.pkgNoDev);
    t.deepEqual(result, ["eslint-config-custom", "interfaces", "tsconfig"]);
});

test("Get workspace packages: full", t => {
    const result = indexModule.getWorkspacePackagesFromPkg(t.context.data.pkgFull);
    t.deepEqual(result, ["eslint-config-custom", "interfaces", "tsconfig", "nodemon-config"]);
});


// CREATE YALC.LOCK OBJECT
test("Generate yalc.lock", t => {
    const packages = indexModule.getWorkspacePackagesFromPkg(t.context.data.pkgFull);
    const lockfile = indexModule.packagesToYalc(packages);
    t.deepEqual(lockfile, t.context.data.lockFull);
});

// MODIFY PACKAGE.JSON
test("Generate new package.json: none", t => {
    const packages = indexModule.getWorkspacePackagesFromPkg(t.context.data.pkgNone);
    const result = indexModule.modifyDepsInPkg(t.context.data.pkgNone, packages);
    t.deepEqual(result, t.context.data.pkgNone);
})

test("Generate new package.json: no_dev", t => {
    const packages = indexModule.getWorkspacePackagesFromPkg(t.context.data.pkgNoDev);
    const result = indexModule.modifyDepsInPkg(t.context.data.pkgNoDev, packages);
    t.deepEqual(result, t.context.data.pkgModNoDev);
});

test("Generate new package.json: full", t => {
    const packages = indexModule.getWorkspacePackagesFromPkg(t.context.data.pkgFull);
    const result = indexModule.modifyDepsInPkg(t.context.data.pkgFull, packages);
    t.deepEqual(result, t.context.data.pkgModFull);
});

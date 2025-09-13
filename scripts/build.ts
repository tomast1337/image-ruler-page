import {watch} from "node:fs";
import {join} from "node:path";
import * as Bun from "bun";

const isWatching = process.argv.includes("--watch");

const build = async () => {
    console.log("Building...");

    const buildResult = await Bun.build({
        entrypoints: ["./src/index.ts"],
        outdir: "./dist",
        target: "browser",
        format: "esm",
        minify: true,
        sourcemap: true,
    });

    if (buildResult.success) {
        console.log("Build complete");
        console.log(buildResult.outputs);
        console.log(buildResult.logs);
    } else {
        console.error("Build failed");
        console.error(buildResult.logs);
    }
};

if (isWatching) {
    console.log("Watch mode enabled. Watching ./src for changes...");

    // Use Node.js fs.watch for reliable file watching
    const watcher = watch("./src", {recursive: true}, (eventType, filename) => {
        if (filename) {
            console.log(`File ${eventType}: ${filename}`);
            console.log("Rebuilding...");
            build();
        }
    });

    watcher.on("error", (error) => {
        console.error("Watch error:", error);
    });

    console.log("Watching ./src for changes. Press Ctrl+C to stop.");

    // Initial build
    build();
} else {
    build();
}
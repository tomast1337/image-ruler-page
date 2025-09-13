#!/usr/bin/env bun

import {serve} from "bun";
import {readFileSync, statSync} from "fs";
import {join, extname} from "path";

const PORT = process.env.PORT || 8000;

const MIME_TYPES: Record<string, string> = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
    ".ts": "application/typescript",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
};

function getMimeType(path: string): string {
    const ext = extname(path);
    return MIME_TYPES[ext] || "text/plain";
}

function serveFile(path: string): Response {
    try {
        const fullPath = join(process.cwd(), path);
        const stats = statSync(fullPath);

        if (stats.isDirectory()) {
            return serveFile(join(path, "index.html"));
        }

        const content = readFileSync(fullPath);
        const mimeType = getMimeType(path);

        return new Response(content, {
            headers: {
                "Content-Type": mimeType,
                "Cache-Control": "no-cache",
            },
        });
    } catch (error) {
        return new Response("File not found", {status: 404});
    }
}

console.log(`🚀 Development server running at http://localhost:${PORT}`);

serve({
    port: PORT,
    fetch(req) {
        const url = new URL(req.url);
        let path = url.pathname;

        // Default to index.html for root
        if (path === "/") {
            path = "/index.html";
        }

        // Handle source maps
        if (path.endsWith(".map")) {
            path = path.replace("/dist/", "/src/");
        }

        return serveFile(path);
    },
}); 
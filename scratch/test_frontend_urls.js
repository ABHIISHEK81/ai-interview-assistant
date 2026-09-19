// Test frontend URL resolution across all runtime environments
const assert = require("assert");
const fs = require("fs");

// Read frontend/script.js content and extract resolveApiBaseUrl
const scriptContent = fs.readFileSync("frontend/script.js", "utf8");
const funcMatch = scriptContent.match(/function resolveApiBaseUrl\(\) \{[\s\S]*?\n\}/);
if (!funcMatch) {
    throw new Error("Could not find resolveApiBaseUrl in frontend/script.js");
}

const resolveApiBaseUrl = new Function(`
    ${funcMatch[0]}
    return resolveApiBaseUrl();
`);

console.log("Testing Frontend URL Resolution:\n");

// Scenario 1: Production on Netlify with VITE_API_URL set
{
    global.window = {
        __API_URL__: "https://ai-interview-assistant.onrender.com",
        location: { hostname: "ai-interview-assistant.netlify.app", port: "", protocol: "https:" }
    };
    const url = resolveApiBaseUrl();
    console.log("1. Netlify production with VITE_API_URL:", url);
    assert.strictEqual(url, "https://ai-interview-assistant.onrender.com");
    assert(!url.includes("127.0.0.1:8000"), "Must NOT contain 127.0.0.1:8000");
    assert(!url.includes("localhost:8000"), "Must NOT contain localhost:8000");
    console.log("   PASS: Correctly resolves to deployed backend URL without 127.0.0.1:8000\n");
}

// Scenario 2: Production on Netlify WITHOUT VITE_API_URL (fallback to relative)
{
    global.window = {
        __API_URL__: "",
        location: { hostname: "ai-interview-assistant.netlify.app", port: "", protocol: "https:" }
    };
    const url = resolveApiBaseUrl();
    console.log("2. Netlify production WITHOUT VITE_API_URL:", `"${url}"`);
    assert.strictEqual(url, "");
    assert(!url.includes("127.0.0.1:8000"), "Must NOT contain 127.0.0.1:8000");
    assert(!url.includes("localhost:8000"), "Must NOT contain localhost:8000");
    console.log("   PASS: Correctly falls back to relative path without 127.0.0.1:8000\n");
}

// Scenario 3: Production on custom domain
{
    global.window = {
        __API_URL__: "https://api.myinterviewapp.com",
        location: { hostname: "myinterviewapp.com", port: "", protocol: "https:" }
    };
    const url = resolveApiBaseUrl();
    console.log("3. Custom domain production:", url);
    assert.strictEqual(url, "https://api.myinterviewapp.com");
    assert(!url.includes("127.0.0.1:8000"), "Must NOT contain 127.0.0.1:8000");
    assert(!url.includes("localhost:8000"), "Must NOT contain localhost:8000");
    console.log("   PASS: Correctly uses custom API URL without 127.0.0.1:8000\n");
}

// Scenario 4: Local development (FastAPI serving frontend on port 8000)
{
    global.window = {
        __API_URL__: "",
        location: { hostname: "localhost", port: "8000", protocol: "http:" }
    };
    const url = resolveApiBaseUrl();
    console.log("4. Local dev (FastAPI port 8000):", `"${url}"`);
    assert.strictEqual(url, "");
    console.log("   PASS: Uses relative path when served by FastAPI\n");
}

// Scenario 5: Local development (Standalone frontend on port 3000)
{
    global.window = {
        __API_URL__: "",
        location: { hostname: "localhost", port: "3000", protocol: "http:" }
    };
    const url = resolveApiBaseUrl();
    console.log("5. Local dev (Standalone port 3000):", url);
    assert.strictEqual(url, "http://localhost:8000");
    console.log("   PASS: Targets local backend for local multi-server dev\n");
}

console.log("ALL FRONTEND URL RESOLUTION TESTS PASSED!");

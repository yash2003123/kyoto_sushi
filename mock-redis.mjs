// Minimal Upstash-REST-compatible server, enough to exercise the store's
// real code paths: JSON round-trip, TTLs, and the atomic HINCRBY slot cap.
import { createServer } from "node:http";

const strings = new Map();
const hashes = new Map();

function run(cmd) {
  const [nameRaw, ...args] = cmd;
  const name = String(nameRaw).toUpperCase();
  switch (name) {
    case "SET": {
      strings.set(args[0], String(args[1]));
      return "OK";
    }
    case "GET":
      return strings.has(args[0]) ? strings.get(args[0]) : null;
    case "HINCRBY": {
      const h = hashes.get(args[0]) ?? new Map();
      hashes.set(args[0], h);
      const next = (h.get(String(args[1])) ?? 0) + Number(args[2]);
      h.set(String(args[1]), next);
      return next;
    }
    case "HGETALL": {
      const h = hashes.get(args[0]);
      if (!h) return [];
      return [...h.entries()].flatMap(([k, v]) => [k, String(v)]);
    }
    case "EXPIRE":
      return 1;
    default:
      return null;
  }
}

createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    let payload;
    try { payload = JSON.parse(body || "[]"); } catch { payload = []; }
    res.setHeader("content-type", "application/json");
    // /pipeline and /multi-exec take an array of commands
    if (req.url.includes("pipeline") || req.url.includes("multi-exec")) {
      res.end(JSON.stringify(payload.map((c) => ({ result: run(c) }))));
    } else {
      res.end(JSON.stringify({ result: run(payload) }));
    }
  });
}).listen(6399, () => console.log("mock redis on 6399"));

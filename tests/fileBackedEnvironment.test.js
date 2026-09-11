const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const {
  loadFileBackedEnvironmentVariables,
} = require("../dist/lib/functions.js");

function withSecretFile(value, callback) {
  const tmpRoot = path.join(process.cwd(), "tmp");
  fs.mkdirSync(tmpRoot, { recursive: true });
  const directory = fs.mkdtempSync(path.join(tmpRoot, "secret-test-"));
  const secretPath = path.join(directory, "secret");
  fs.writeFileSync(secretPath, value, { mode: 0o600 });

  try {
    callback(secretPath);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

test("loads Docker secret files and trims the trailing newline", () => {
  withSecretFile("discord-secret\n", (secretPath) => {
    delete process.env.DISCORD_TOKEN;
    process.env.DISCORD_TOKEN_FILE = secretPath;

    loadFileBackedEnvironmentVariables();

    assert.equal(process.env.DISCORD_TOKEN, "discord-secret");
    delete process.env.DISCORD_TOKEN;
    delete process.env.DISCORD_TOKEN_FILE;
  });
});

test("does not replace an explicitly supplied environment variable", () => {
  withSecretFile("file-secret", (secretPath) => {
    process.env.SEAT_TOKEN = "environment-secret";
    process.env.SEAT_TOKEN_FILE = secretPath;

    loadFileBackedEnvironmentVariables();

    assert.equal(process.env.SEAT_TOKEN, "environment-secret");
    delete process.env.SEAT_TOKEN;
    delete process.env.SEAT_TOKEN_FILE;
  });
});

test("rejects an empty Docker secret", () => {
  withSecretFile("\n", (secretPath) => {
    delete process.env.DISCORD_TOKEN;
    process.env.DISCORD_TOKEN_FILE = secretPath;

    assert.throws(
      () => loadFileBackedEnvironmentVariables(),
      /DISCORD_TOKEN_FILE points to an empty file/,
    );
    delete process.env.DISCORD_TOKEN_FILE;
  });
});

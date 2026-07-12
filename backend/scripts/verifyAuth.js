const assert = require("assert");
const app = require("../src/app");
const db = require("../src/config/db");
const { runMigrations } = require("./migrate");

async function request(baseUrl, path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
  };

  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  const json = text ? JSON.parse(text) : {};
  return {
    status: response.status,
    json,
  };
}

function listen() {
  return new Promise((resolve) => {
    const server = app.listen(0, () => resolve(server));
  });
}

async function main() {
  await runMigrations();
  const server = await listen();
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api`;
  const runId = Date.now();
  const orgA = `TransitOps Auth Verification A ${runId}`;
  const orgB = `TransitOps Auth Verification B ${runId}`;

  const managerEmail = `manager.${runId}@transitops.test`;
  const dispatcherEmail = `dispatcher.${runId}@transitops.test`;
  const otherManagerEmail = `other.manager.${runId}@transitops.test`;
  const otherUserEmail = `other.user.${runId}@transitops.test`;
  const password = "Verification123!";

  try {
    const registerManager = await request(baseUrl, "/auth/register", {
      method: "POST",
      body: {
        organizationName: orgA,
        name: "Verification Manager",
        email: managerEmail,
        password,
      },
    });
    assert.strictEqual(registerManager.status, 201, "register manager should return 201");
    assert.strictEqual(registerManager.json.success, true);
    const managerToken = registerManager.json.data.token;
    assert(managerToken, "register should return a token");

    const validLogin = await request(baseUrl, "/auth/login", {
      method: "POST",
      body: { email: managerEmail, password },
    });
    assert.strictEqual(validLogin.status, 200, "valid login should return 200");
    assert.strictEqual(validLogin.json.data.user.role, "fleet_manager");

    const invalidPassword = await request(baseUrl, "/auth/login", {
      method: "POST",
      body: { email: managerEmail, password: "WrongPassword123!" },
    });
    assert.strictEqual(invalidPassword.status, 401, "invalid password should return 401");

    const unauthorizedMe = await request(baseUrl, "/auth/me");
    assert.strictEqual(unauthorizedMe.status, 401, "protected route without token should return 401");

    const createDispatcher = await request(baseUrl, "/users", {
      method: "POST",
      token: managerToken,
      body: {
        name: "Verification Dispatcher",
        email: dispatcherEmail,
        password,
        role: "dispatcher",
      },
    });
    assert.strictEqual(createDispatcher.status, 201, "manager should create dispatcher");
    const dispatcherId = createDispatcher.json.data.user.id;

    const dispatcherLogin = await request(baseUrl, "/auth/login", {
      method: "POST",
      body: { email: dispatcherEmail, password },
    });
    assert.strictEqual(dispatcherLogin.status, 200, "dispatcher login should return 200");
    const dispatcherToken = dispatcherLogin.json.data.token;

    const roleBlocked = await request(baseUrl, "/users", { token: dispatcherToken });
    assert.strictEqual(roleBlocked.status, 403, "dispatcher should be blocked from user management");

    const duplicateEmail = await request(baseUrl, "/users", {
      method: "POST",
      token: managerToken,
      body: {
        name: "Duplicate User",
        email: dispatcherEmail,
        password,
        role: "financial_analyst",
      },
    });
    assert.strictEqual(duplicateEmail.status, 409, "duplicate user email should return 409");

    const invalidRole = await request(baseUrl, "/users", {
      method: "POST",
      token: managerToken,
      body: {
        name: "Invalid Role",
        email: `invalid.role.${runId}@transitops.test`,
        password,
        role: "viewer",
      },
    });
    assert.strictEqual(invalidRole.status, 400, "invalid role should return 400");

    const registerOtherManager = await request(baseUrl, "/auth/register", {
      method: "POST",
      body: {
        organizationName: orgB,
        name: "Other Manager",
        email: otherManagerEmail,
        password,
      },
    });
    assert.strictEqual(registerOtherManager.status, 201, "second org manager should register");
    const otherManagerToken = registerOtherManager.json.data.token;

    const createOtherUser = await request(baseUrl, "/users", {
      method: "POST",
      token: otherManagerToken,
      body: {
        name: "Other Org User",
        email: otherUserEmail,
        password,
        role: "financial_analyst",
      },
    });
    assert.strictEqual(createOtherUser.status, 201, "second org user should be created");
    const otherUserId = createOtherUser.json.data.user.id;

    const crossOrgUpdate = await request(baseUrl, `/users/${otherUserId}`, {
      method: "PUT",
      token: managerToken,
      body: { name: "Cross Org Attempt" },
    });
    assert.strictEqual(crossOrgUpdate.status, 404, "cross-organization user update should return 404");

    const disableDispatcher = await request(baseUrl, `/users/${dispatcherId}/status`, {
      method: "PATCH",
      token: managerToken,
      body: { isActive: false },
    });
    assert.strictEqual(disableDispatcher.status, 200, "manager should disable user");

    const disabledLogin = await request(baseUrl, "/auth/login", {
      method: "POST",
      body: { email: dispatcherEmail, password },
    });
    assert.strictEqual(disabledLogin.status, 401, "disabled user login should return 401");

    console.log("Authentication verification passed");
  } finally {
    await db.query("DELETE FROM organizations WHERE name = ANY($1)", [[orgA, orgB]]);
    await new Promise((resolve) => server.close(resolve));
    await db.pool.end();
  }
}

main().catch((error) => {
  console.error("Authentication verification failed");
  console.error(error);
  process.exitCode = 1;
});

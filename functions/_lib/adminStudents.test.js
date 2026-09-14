import assert from "node:assert/strict";
import test from "node:test";

import { createAdminStudentHandler } from "./adminStudents.js";

const setup = ({ adminProfile = { role: "admin", allowedModules: ["students"] },
  authError, writeError, rollbackError, existingProfileExists = true } = {}) => {
  const calls = [];
  const auth = {
    createUser: async (data) => {
      calls.push(["createAuth", data]);
      if (authError) throw authError;
      return { uid: "new-student", email: data.email, photoURL: undefined };
    },
    deleteUser: async (uid) => {
      calls.push(["deleteAuth", uid]);
      if (rollbackError) throw rollbackError;
    },
    getUserByEmail: async () => ({ uid: "existing-user" }),
  };
  const db = {
    collection: (name) => ({
      doc: (uid) => ({
        dataPath: `${name}/${uid}`,
        get: async () => ({
          exists: uid === "existing-user" ? existingProfileExists : true,
          data: () => adminProfile,
        }),
        create: async (data) => {
          calls.push(["createProfile", uid, data]);
          if (writeError) throw writeError;
        },
      }),
    }),
  };
  const handler = createAdminStudentHandler({
    getDb: () => db,
    getAuth: () => auth,
    fieldValue: { serverTimestamp: () => "SERVER_TIME" },
    json: (data, status) => ({ data, status }),
  });
  const run = (body = { name: "  New Student  ", email: " Student@Example.test ", password: "secure123" },
    adminUser = { uid: "admin-1", email: "admin@example.test", email_verified: false }) =>
    handler({ adminUser, request: { json: async () => body } });
  return { calls, run };
};

test("creates Auth user and matching student profile for an authorized admin", async () => {
  const { calls, run } = setup();
  const response = await run();
  assert.equal(response.status, 201);
  assert.deepEqual(response.data, { uid: "new-student", email: "student@example.test" });
  assert.deepEqual(calls[0], ["createAuth", {
    email: "student@example.test", password: "secure123", displayName: "New Student",
  }]);
  assert.equal(calls[1][0], "createProfile");
  assert.equal(calls[1][1], "new-student");
  assert.deepEqual(calls[1][2], {
    uid: "new-student", email: "student@example.test", displayName: "New Student",
    role: "student", createdAt: "SERVER_TIME", photoURL: null,
  });
});

test("rejects admins without students access before creating an Auth user", async () => {
  const { calls, run } = setup({ adminProfile: { role: "admin", allowedModules: ["orders"] } });
  await assert.rejects(run(), { status: 403, code: "admin/students-forbidden" });
  assert.deepEqual(calls, []);
});

test("rejects malformed input before creating an Auth user", async () => {
  const { calls, run } = setup();
  await assert.rejects(run({ name: "X", email: "bad", password: "123" }), {
    status: 400, code: "request/invalid-student",
  });
  assert.deepEqual(calls, []);
});

test("does not create a profile or change an existing Auth account", async () => {
  const { calls, run } = setup({ authError: Object.assign(new Error("exists"), { code: "auth/email-already-exists" }) });
  await assert.rejects(run(), { status: 409, code: "auth/email-already-exists" });
  assert.equal(calls.length, 1);
});

test("identifies an Auth account left without a profile by the old flow", async () => {
  const { calls, run } = setup({
    authError: Object.assign(new Error("exists"), { code: "auth/email-already-exists" }),
    existingProfileExists: false,
  });
  await assert.rejects(run(), { status: 409, code: "auth/missing-student-profile" });
  assert.equal(calls.length, 1);
});

test("rolls back the newly created Auth user if profile creation fails", async () => {
  const { calls, run } = setup({ writeError: new Error("Firestore unavailable") });
  await assert.rejects(run(), { status: 503, code: "student/profile-write-failed" });
  assert.deepEqual(calls.map(([operation]) => operation), ["createAuth", "createProfile", "deleteAuth"]);
});

test("reports an orphan if profile creation and Auth rollback both fail", async () => {
  const { calls, run } = setup({ writeError: new Error("Firestore unavailable"), rollbackError: new Error("Auth unavailable") });
  await assert.rejects(run(), { status: 503, code: "student/profile-orphaned" });
  assert.deepEqual(calls.map(([operation]) => operation), ["createAuth", "createProfile", "deleteAuth"]);
});

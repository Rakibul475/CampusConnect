// Checks the database's access rules against a running Supabase project.
// Run against a local stack: `supabase start`, then
//   SUPABASE_URL=http://127.0.0.1:54321 SUPABASE_ANON_KEY=<key> npm run test:db
import { createClient } from "@supabase/supabase-js";
import { beforeAll, describe, expect, it } from "vitest";

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const run = Date.now().toString(36);

async function newUser(name) {
  const client = createClient(url, anonKey, { auth: { persistSession: false } });
  const { data, error } = await client.auth.signUp({
    email: `${name.toLowerCase()}-${run}@example.com`,
    password: "password123",
    options: { data: { full_name: name } },
  });
  if (error) throw error;
  return { client, id: data.user.id, name };
}

const ok = ({ data, error }) => {
  if (error) throw new Error(error.message);
  return data;
};

describe.skipIf(!url || !anonKey)("database permissions", () => {
  let prof, otherProf, ana, ben, cal, outsider, cls, g1, g2;

  beforeAll(async () => {
    [prof, otherProf, ana, ben, cal, outsider] = await Promise.all(
      ["Professor", "OtherProf", "Ana", "Ben", "Cal", "Outsider"].map(newUser)
    );

    cls = ok(await prof.client.from("classes").insert({ name: "CSC 131", owner_id: prof.id }).select().single());
    for (const s of [ana, ben, cal]) ok(await s.client.rpc("join_class", { p_code: cls.join_code.toLowerCase() }));

    g1 = ok(await prof.client.from("groups").insert({ class_id: cls.id, name: "Team 1", max_members: 2 }).select().single());
    g2 = ok(await prof.client.from("groups").insert({ class_id: cls.id, name: "Team 2" }).select().single());

    ok(await ana.client.rpc("join_group", { p_group_id: g1.id }));
    ok(await ben.client.rpc("join_group", { p_group_id: g1.id }));
    ok(await cal.client.rpc("join_group", { p_group_id: g2.id }));

    ok(await ana.client.from("messages").insert({ group_id: g1.id, body: "Team 1 plan" }));
    ok(await prof.client.from("messages").insert({ group_id: g2.id, body: "Hi Team 2" }));
  });

  it("gives every class a 6-character join code and creates profiles from sign-up names", async () => {
    expect(cls.join_code).toMatch(/^[A-Z2-9]{6}$/);
    const me = ok(await ana.client.from("profiles").select("full_name").eq("id", ana.id).single());
    expect(me.full_name).toBe("Ana");
  });

  it("rejects bad join codes", async () => {
    const { error } = await outsider.client.rpc("join_class", { p_code: "ZZZZZZ" });
    expect(error.message).toMatch(/No class has that join code/);
  });

  it("hides a class from people who are not in it", async () => {
    expect(ok(await outsider.client.from("classes").select()).length).toBe(0);
    expect(ok(await otherProf.client.from("groups").select()).length).toBe(0);
    expect(ok(await outsider.client.rpc("group_sizes", { p_class_id: cls.id })).length).toBe(0);
  });

  it("lets only the professor create groups or edit the class", async () => {
    const { error } = await ana.client.from("groups").insert({ class_id: cls.id, name: "Mine" });
    expect(error).toBeTruthy();
    ok(await ana.client.from("classes").update({ name: "Hacked" }).eq("id", cls.id));
    const fresh = ok(await prof.client.from("classes").select("name").eq("id", cls.id).single());
    expect(fresh.name).toBe("CSC 131");
  });

  it("enforces group size and one group per class", async () => {
    const extra = await newUser("Dee");
    ok(await extra.client.rpc("join_class", { p_code: cls.join_code }));
    const full = await extra.client.rpc("join_group", { p_group_id: g1.id });
    expect(full.error.message).toMatch(/full/);
    const twice = await ana.client.rpc("join_group", { p_group_id: g2.id });
    expect(twice.error.message).toMatch(/already in a group/);
  });

  it("does not let students add themselves to classes or groups directly", async () => {
    const a = await outsider.client.from("class_members").insert({ class_id: cls.id, user_id: outsider.id });
    expect(a.error).toBeTruthy();
    const b = await cal.client.from("group_members").insert({ class_id: cls.id, group_id: g1.id, user_id: cal.id });
    expect(b.error).toBeTruthy();
  });

  it("shows students only their own group's members, and the professor everyone", async () => {
    const anaSees = ok(await ana.client.from("group_members").select("user_id").eq("class_id", cls.id));
    expect(anaSees.map((m) => m.user_id).sort()).toEqual([ana.id, ben.id].sort());

    const calSees = ok(await cal.client.from("group_members").select("user_id").eq("class_id", cls.id));
    expect(calSees.map((m) => m.user_id)).toEqual([cal.id]);

    const profSees = ok(await prof.client.from("group_members").select("user_id").eq("class_id", cls.id));
    expect(profSees.length).toBeGreaterThanOrEqual(3);
  });

  it("shows the roster only to the professor", async () => {
    const anaRoster = ok(await ana.client.from("class_members").select("user_id").eq("class_id", cls.id));
    expect(anaRoster.map((m) => m.user_id)).toEqual([ana.id]);
    const profRoster = ok(await prof.client.from("class_members").select("user_id").eq("class_id", cls.id));
    expect(profRoster.length).toBeGreaterThanOrEqual(3);
  });

  it("limits whose names a student can see", async () => {
    const names = ok(await ana.client.from("profiles").select("full_name")).map((p) => p.full_name).sort();
    expect(names).toEqual(["Ana", "Ben", "Professor"]);
    const profNames = ok(await prof.client.from("profiles").select("full_name")).map((p) => p.full_name);
    expect(profNames).toEqual(expect.arrayContaining(["Ana", "Ben", "Cal"]));
  });

  it("keeps each group's chat private to its members and the professor", async () => {
    expect(ok(await cal.client.from("messages").select().eq("group_id", g1.id))).toEqual([]);
    expect(ok(await ben.client.from("messages").select("body").eq("group_id", g1.id))).toEqual([{ body: "Team 1 plan" }]);
    expect(ok(await prof.client.from("messages").select("body").eq("group_id", g1.id))).toEqual([{ body: "Team 1 plan" }]);
    expect(ok(await otherProf.client.from("messages").select())).toEqual([]);

    const { error } = await ana.client.from("messages").insert({ group_id: g2.id, body: "sneaky" });
    expect(error).toBeTruthy();
    const spoof = await ana.client.from("messages").insert({ group_id: g1.id, body: "as Ben", user_id: ben.id });
    expect(spoof.error).toBeTruthy();
  });

  it("shows students group sizes without names", async () => {
    const sizes = ok(await cal.client.rpc("group_sizes", { p_class_id: cls.id }));
    const byGroup = Object.fromEntries(sizes.map((s) => [s.group_id, s.member_count]));
    expect(byGroup[g1.id]).toBe(2);
    expect(byGroup[g2.id]).toBe(1);
  });

  it("lets authors and the professor delete messages, but not other students", async () => {
    const msg = ok(await ben.client.from("messages").insert({ group_id: g1.id, body: "oops" }).select().single());
    ok(await ana.client.from("messages").delete().eq("id", msg.id));
    expect(ok(await ben.client.from("messages").select().eq("id", msg.id)).length).toBe(1);
    ok(await prof.client.from("messages").delete().eq("id", msg.id));
    expect(ok(await ben.client.from("messages").select().eq("id", msg.id)).length).toBe(0);
  });

  it("lets the professor move students between groups", async () => {
    ok(await prof.client.from("group_members").delete().eq("class_id", cls.id).eq("user_id", cal.id));
    ok(await prof.client.from("group_members").insert({ class_id: cls.id, group_id: g1.id, user_id: cal.id }));
    const calSees = ok(await cal.client.from("group_members").select("user_id").eq("group_id", g1.id));
    expect(calSees.length).toBe(3);
    ok(await prof.client.from("group_members").delete().eq("class_id", cls.id).eq("user_id", cal.id));
  });

  it("removes a student's group membership and chat access when they leave the class", async () => {
    ok(await ben.client.from("class_members").delete().eq("class_id", cls.id).eq("user_id", ben.id));
    expect(ok(await ben.client.from("messages").select())).toEqual([]);
    expect(ok(await ben.client.from("classes").select())).toEqual([]);
    const team = ok(await prof.client.from("group_members").select("user_id").eq("group_id", g1.id));
    expect(team.map((m) => m.user_id)).toEqual([ana.id]);
  });
});

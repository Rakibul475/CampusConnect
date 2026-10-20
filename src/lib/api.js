import { summarizeMessages } from "./participation";
import { supabase } from "./supabase";

function check({ data, error }) {
  if (error) throw new Error(error.message);
  return data;
}

// Auth -----------------------------------------------------------------------

export async function signUp({ fullName, email, password }) {
  const data = check(
    await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        // Come back to the same page (e.g. an invite link) after confirming.
        emailRedirectTo: window.location.href,
      },
    })
  );
  // No session means the project requires email confirmation first.
  return { needsConfirmation: !data.session };
}

export async function signIn({ email, password }) {
  check(await supabase.auth.signInWithPassword({ email, password }));
}

export async function signOut() {
  check(await supabase.auth.signOut());
}

export async function getProfile(userId) {
  return check(await supabase.from("profiles").select("id, full_name").eq("id", userId).single());
}

// Classes --------------------------------------------------------------------

export async function listClasses(userId) {
  const classes = check(
    await supabase
      .from("classes")
      .select("id, name, term, join_code, owner_id, owner:profiles!classes_owner_id_fkey(full_name)")
      .order("created_at", { ascending: false })
  );
  return {
    teaching: classes.filter((c) => c.owner_id === userId),
    enrolled: classes.filter((c) => c.owner_id !== userId),
  };
}

export async function createClass({ name, term, ownerId }) {
  return check(
    await supabase
      .from("classes")
      .insert({ name, term: term || null, owner_id: ownerId })
      .select("id")
      .single()
  );
}

export async function deleteClass(classId) {
  check(await supabase.from("classes").delete().eq("id", classId));
}

export async function joinClass(code) {
  return check(await supabase.rpc("join_class", { p_code: code }));
}

export async function leaveClass(classId, userId) {
  check(await supabase.from("class_members").delete().eq("class_id", classId).eq("user_id", userId));
}

export async function getClass(classId) {
  return check(
    await supabase
      .from("classes")
      .select("id, name, term, join_code, owner_id, owner:profiles!classes_owner_id_fkey(full_name)")
      .eq("id", classId)
      .maybeSingle()
  );
}

// Groups ---------------------------------------------------------------------

export async function listGroups(classId) {
  const [groups, sizes] = await Promise.all([
    supabase.from("groups").select("id, name, max_members").eq("class_id", classId).order("name"),
    supabase.rpc("group_sizes", { p_class_id: classId }),
  ]);
  const counts = new Map(check(sizes).map((s) => [s.group_id, s.member_count]));
  return check(groups).map((g) => ({ ...g, memberCount: counts.get(g.id) ?? 0 }));
}

export async function createGroup({ classId, name, maxMembers }) {
  check(
    await supabase.from("groups").insert({
      class_id: classId,
      name,
      max_members: maxMembers || null,
    })
  );
}

export async function deleteGroup(groupId) {
  check(await supabase.from("groups").delete().eq("id", groupId));
}

export async function getGroup(groupId) {
  return check(
    await supabase.from("groups").select("id, name, class_id, max_members").eq("id", groupId).maybeSingle()
  );
}

export async function joinGroup(groupId) {
  check(await supabase.rpc("join_group", { p_group_id: groupId }));
}

export async function leaveGroup(groupId, userId) {
  check(await supabase.from("group_members").delete().eq("group_id", groupId).eq("user_id", userId));
}

// Group members a user can see: everyone in the class for the professor,
// just their own group for a student.
export async function listGroupMembers(classId) {
  return check(
    await supabase
      .from("group_members")
      .select("group_id, user_id, profile:profiles!group_members_user_id_fkey(full_name)")
      .eq("class_id", classId)
  );
}

export async function placeStudent({ classId, groupId, userId }) {
  check(await supabase.from("group_members").delete().eq("class_id", classId).eq("user_id", userId));
  if (groupId) {
    check(await supabase.from("group_members").insert({ class_id: classId, group_id: groupId, user_id: userId }));
  }
}

// Professor only: everyone enrolled in the class.
export async function listRoster(classId) {
  return check(
    await supabase
      .from("class_members")
      .select("user_id, joined_at, profile:profiles!class_members_user_id_fkey(full_name)")
      .eq("class_id", classId)
      .order("joined_at")
  );
}

export async function removeStudent(classId, userId) {
  check(await supabase.from("class_members").delete().eq("class_id", classId).eq("user_id", userId));
}

// Messages -------------------------------------------------------------------

export async function listMessages(groupId) {
  return check(
    await supabase
      .from("messages")
      .select("id, body, created_at, user_id, author:profiles!messages_user_id_fkey(full_name)")
      .eq("group_id", groupId)
      .order("created_at")
      .limit(500)
  );
}

// PostgREST returns at most 1000 rows per request, so page through.
async function fetchAllMessages(groupIds, columns) {
  if (groupIds.length === 0) return [];
  const pageSize = 1000;
  const rows = [];
  for (let from = 0; ; from += pageSize) {
    const page = check(
      await supabase
        .from("messages")
        .select(columns)
        .in("group_id", groupIds)
        .order("id")
        .range(from, from + pageSize - 1)
    );
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}

// Professor only: message counts per group and per student.
export async function messageStats(groupIds) {
  return summarizeMessages(await fetchAllMessages(groupIds, "group_id, user_id, created_at"));
}

// Professor only: every message in the given groups, oldest first.
export async function exportMessages(groupIds) {
  return fetchAllMessages(
    groupIds,
    "group_id, created_at, body, user_id, author:profiles!messages_user_id_fkey(full_name)"
  );
}

export async function sendMessage(groupId, body) {
  check(await supabase.from("messages").insert({ group_id: groupId, body }));
}

export async function deleteMessage(messageId) {
  check(await supabase.from("messages").delete().eq("id", messageId));
}

export function subscribeToMessages(groupId, onChange) {
  const channel = supabase
    .channel(`messages:${groupId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "messages", filter: `group_id=eq.${groupId}` },
      onChange
    )
    .subscribe();
  return () => supabase.removeChannel(channel);
}

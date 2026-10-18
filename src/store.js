import { useEffect, useReducer } from "react";
import { addDays, toDateString } from "./lib/dates";
import { makeId } from "./lib/id";

const STORAGE_KEY = "campusconnect:v1";
const MAX_NOTIFICATIONS = 50;

export function createSeedState(now = new Date()) {
  const day = (offset) => toDateString(addDays(now, offset));
  const minutesAgo = (m) => new Date(now.getTime() - m * 60000).toISOString();

  const groups = [
    {
      id: "csc-131",
      name: "CSC 131 Study Group",
      course: "CSC 131",
      meets: "Tue & Thu, 4 PM, Library 2nd floor",
      members: ["Maya", "Alex"],
      createdBy: "Maya",
    },
    {
      id: "calc-review",
      name: "Calculus Review Group",
      course: "MATH 30",
      meets: "Wed, 6 PM, Zoom",
      members: ["Jordan"],
      createdBy: "Jordan",
    },
    {
      id: "philosophy-reading",
      name: "Philosophy Reading Group",
      course: "PHIL 4",
      meets: "Fri, 2 PM, Student Center",
      members: ["Sam", "Priya"],
      createdBy: "Sam",
    },
  ];

  return {
    user: "",
    events: [
      {
        id: "career-fair",
        title: "Career Fair",
        date: day(3),
        time: "10:00",
        location: "University Union",
        description: "Meet employers hiring for internships and full-time roles. Bring your resume.",
        createdBy: "Career Center",
        rsvps: ["Maya"],
      },
      {
        id: "ai-club-workshop",
        title: "AI Club Workshop",
        date: day(5),
        time: "17:30",
        location: "Riverside Hall",
        description: "Hands-on intro to building with machine learning. Laptops recommended.",
        createdBy: "AI Club",
        rsvps: ["Alex", "Priya"],
      },
      {
        id: "finals-wellness-night",
        title: "Finals Wellness Night",
        date: day(8),
        time: "19:00",
        location: "Student Center",
        description: "Snacks, games and a break from studying before finals week.",
        createdBy: "Student Health",
        rsvps: [],
      },
    ],
    groups,
    messages: [
      {
        id: "m1",
        groupId: "csc-131",
        author: "Maya",
        text: "Anyone want to review UML diagrams?",
        sentAt: minutesAgo(45),
      },
      {
        id: "m2",
        groupId: "csc-131",
        author: "Alex",
        text: "I can meet after class.",
        sentAt: minutesAgo(30),
      },
      {
        id: "m3",
        groupId: "calc-review",
        author: "Jordan",
        text: "Practice problems for chapter 5 are posted. Let's go over them Wednesday.",
        sentAt: minutesAgo(120),
      },
    ],
    notifications: [],
  };
}

function notify(state, text) {
  const notification = {
    id: makeId(),
    text,
    createdAt: new Date().toISOString(),
    read: false,
  };
  return [notification, ...state.notifications].slice(0, MAX_NOTIFICATIONS);
}

function toggle(list, value) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function reducer(state, action) {
  const { user } = state;

  switch (action.type) {
    case "signIn": {
      const name = action.name.trim();
      if (!name) return state;
      return { ...state, user: name, notifications: notify(state, `Welcome to CampusConnect, ${name}!`) };
    }

    case "signOut":
      return { ...state, user: "" };

    case "addEvent": {
      if (!user) return state;
      const event = { id: makeId(), ...action.event, createdBy: user, rsvps: [user] };
      return {
        ...state,
        events: [...state.events, event],
        notifications: notify(state, `You posted ${event.title}.`),
      };
    }

    case "deleteEvent":
      return {
        ...state,
        events: state.events.filter((e) => !(e.id === action.id && e.createdBy === user)),
      };

    case "toggleRsvp": {
      if (!user) return state;
      const event = state.events.find((e) => e.id === action.id);
      if (!event) return state;
      const going = !event.rsvps.includes(user);
      return {
        ...state,
        events: state.events.map((e) =>
          e.id === action.id ? { ...e, rsvps: toggle(e.rsvps, user) } : e
        ),
        notifications: going ? notify(state, `You're going to ${event.title}.`) : state.notifications,
      };
    }

    case "addGroup": {
      if (!user) return state;
      const group = { id: makeId(), ...action.group, members: [user], createdBy: user };
      return {
        ...state,
        groups: [group, ...state.groups],
        notifications: notify(state, `You created ${group.name}.`),
      };
    }

    case "deleteGroup":
      if (!state.groups.some((g) => g.id === action.id && g.createdBy === user)) return state;
      return {
        ...state,
        groups: state.groups.filter((g) => g.id !== action.id),
        messages: state.messages.filter((m) => m.groupId !== action.id),
      };

    case "toggleMembership": {
      if (!user) return state;
      const group = state.groups.find((g) => g.id === action.id);
      if (!group) return state;
      const joining = !group.members.includes(user);
      return {
        ...state,
        groups: state.groups.map((g) =>
          g.id === action.id ? { ...g, members: toggle(g.members, user) } : g
        ),
        notifications: notify(state, joining ? `You joined ${group.name}.` : `You left ${group.name}.`),
      };
    }

    case "sendMessage": {
      const text = action.text.trim();
      const group = state.groups.find((g) => g.id === action.groupId);
      if (!user || !text || !group?.members.includes(user)) return state;
      const message = {
        id: makeId(),
        groupId: action.groupId,
        author: user,
        text,
        sentAt: new Date().toISOString(),
      };
      return { ...state, messages: [...state.messages, message] };
    }

    case "deleteMessage":
      return {
        ...state,
        messages: state.messages.filter((m) => !(m.id === action.id && m.author === user)),
      };

    case "markNotificationsRead":
      if (!state.notifications.some((n) => !n.read)) return state;
      return { ...state, notifications: state.notifications.map((n) => ({ ...n, read: true })) };

    case "resetDemo":
      return createSeedState();

    default:
      return state;
  }
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...createSeedState(), ...JSON.parse(saved) };
  } catch {
    // Private mode or corrupted data: fall back to the demo content.
  }
  return createSeedState();
}

export function useCampusStore() {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage full or blocked: the app still works for this visit.
    }
  }, [state]);

  return [state, dispatch];
}

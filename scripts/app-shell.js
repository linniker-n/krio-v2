const firebaseConfig = {
  apiKey: "AIzaSyDIg5h2gdXTXVRKYwtvpbqEDlJWxue81Ow",
  authDomain: "krio-app-fe0c3.firebaseapp.com",
  databaseURL: "https://krio-app-fe0c3-default-rtdb.firebaseio.com",
  projectId: "krio-app-fe0c3",
  storageBucket: "krio-app-fe0c3.appspot.com",
  appId: "1:527271527417:web:f320fac3656b6914ae3328"
};

const views = {
  dashboard: {
    title: "Dashboard",
    subtitle: "Visao geral, aprovacoes e gargalos da agencia."
  },
  tracker: {
    title: "Tracker",
    subtitle: "Demandas, semanas e produção da equipe."
  },
  operations: {
    title: "Operação",
    subtitle: "Leitura operacional em tempo real."
  },
  approval: {
    title: "Clientes",
    subtitle: "Clientes, peças e retornos centralizados."
  }
};

const LICENSE_PRODUCT = {
  id: "manual_license",
  name: "Licença ativa",
  price: "Venda direta",
  description: "Acesso integral liberado manualmente após fechamento comercial.",
  limits: { profiles: Infinity, clients: Infinity, creatives: Infinity, demands: Infinity },
  features: ["tracker", "approval", "operations", "reports", "manualAccess"]
};

const demandTypes = [
  { id: "mensal", label: "Mensal" },
  { id: "avulso", label: "Avulso" },
  { id: "aprovacao", label: "Aprovação" },
  { id: "agendamento", label: "Agendamento" },
  { id: "planejamento", label: "Planejamento" }
];

const workspaceAccessRoles = [
  { id: "admin", label: "Gestão — acesso integral" },
  { id: "creator", label: "Criador — dashboard e Tracker" },
  { id: "operations", label: "Operação — agenda, relatórios, histórico e clientes" }
];

const validAccessRoles = new Set(["owner", "admin", "member", "creator", "operations", "client", "guest"]);

const agendaEventTypes = [
  { id: "meeting", label: "Reunião" },
  { id: "delivery", label: "Entrega" },
  { id: "briefing", label: "Briefing" },
  { id: "internal", label: "Interno" }
];

const approvalStatuses = {
  prov: "Provisório",
  internalApproved: "Aprovado internamente",
  internalRejected: "Refação",
  clientReview: "Quadro do cliente",
  scheduled: "Agendamento",
  posted: "Postados",
};

const approvalStatusTabs = [
  { id: "prov", label: "Provisório" },
  { id: "internalApproved", label: "Interno" },
  { id: "internalRejected", label: "Refação" },
  { id: "clientReview", label: "Cliente" },
  { id: "scheduled", label: "Agendamento" },
  { id: "posted", label: "Postados" },
];

const approvalStatusAliases = {
  aprov: "internalApproved",
  reprov: "internalRejected",
  post: "posted",
};

const appRoute = parseAppRoute();

const state = {
  firebase: null,
  user: null,
  tenantId: "demo",
  membership: { role: "owner", status: "active" },
  tenantMeta: {},
  data: null,
  route: appRoute,
  portalIndex: null,
  activeView: appRoute.mode === "clientPortal" ? "approval" : "dashboard",
  trackerView: "week",
  trackerFilter: "all",
  currentWeekIndex: 0,
  approvalOpenClientFolders: {},
  agendaView: "month",
  agendaCursor: isoDate(new Date()),
  approvalClientId: null,
  approvalStatus: "prov",
  saveTimer: null,
  timerTick: null,
  realtimeUnsubs: [],
  realtimeRenderTimer: null,
  localWritePending: false,
  localWriteBlockUntil: 0,
  trackerDrag: null,
  approvalDrag: null,
  accessRequests: [],
  demoMode: new URLSearchParams(window.location.search).has("demo")
};

const icons = {
  plus: '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M8 3v10M3 8h10"/></svg>',
  week: '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="12" height="11" rx="2"/><path d="M5 1.8v2.6M11 1.8v2.6M2 6.5h12"/></svg>',
  agenda: '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 2.5h10a1 1 0 0 1 1 1V13a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1Z"/><path d="M5 1v3M11 1v3M2 6h12"/></svg>',
  report: '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 13V7M8 13V3M13 13V5"/><path d="M2 13.5h12"/></svg>',
  history: '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3.5 4.5A6 6 0 1 1 2 8.5"/><path d="M2 3v4h4M8 5v3.5l2.4 1.4"/></svg>',
  trash: '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2.5 4h11M6 4V2.5h4V4M4 4l.7 9h6.6L12 4"/><path d="M7 6.5v4M9 6.5v4"/></svg>',
  team: '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="6" cy="5" r="2.5"/><path d="M2 13c.6-2 2-3 4-3s3.4 1 4 3"/><circle cx="11.5" cy="6" r="1.7"/><path d="M10.5 10.2c1.6.2 2.7 1 3.2 2.3"/></svg>',
  settings: '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="2.2"/><path d="M8 1.5v2M8 12.5v2M2.4 4.3l1.7 1M11.9 10.7l1.7 1M1.5 8h2M12.5 8h2M2.4 11.7l1.7-1M11.9 5.3l1.7-1"/></svg>',
  close: '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>',
  edit: '<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9.5 3.2 12.8 6.5 6 13.3 2.7 14l.7-3.3 6.1-7.5Z"/><path d="m8.5 4.2 3.3 3.3"/></svg>',
  check: '<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="m3.2 8.3 3 3L12.8 4.7"/></svg>',
  play: '<svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor"><path d="M5 3.5v9l7-4.5-7-4.5Z"/></svg>',
  pause: '<svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor"><path d="M5 3h2v10H5zM9 3h2v10H9z"/></svg>',
  upload: '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M8 11V3"/><path d="m4.8 6.2 3.2-3.2 3.2 3.2"/><path d="M3 10.5V13h10v-2.5"/></svg>',
  send: '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2 7 14l-1.5-5.5L1 6.5 14 2Z"/><path d="m5.5 8.5 3-2.5"/></svg>',
  calendar: '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2.5" y="3.5" width="11" height="10" rx="2"/><path d="M5.5 2v3M10.5 2v3M2.5 6.5h11"/></svg>',
  sync: '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M13 5a5 5 0 0 0-8.4-2.2L3 4.5"/><path d="M3 2v2.5h2.5M3 11a5 5 0 0 0 8.4 2.2L13 11.5"/><path d="M13 14v-2.5h-2.5"/></svg>',
  print: '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 5V2h8v3M4 11H3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1"/><path d="M4 9h8v5H4z"/></svg>',
  back: '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M10 3 5 8l5 5"/></svg>',
  comment: '<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M3 3.5h10v7H7l-3.2 2.6V10.5H3z"/></svg>'
};

const $ = (selector, root = document) => root.querySelector(selector);

boot();

async function boot() {
  setupShellEvents();
  ensureDialogHosts();

  if (state.demoMode) {
    state.user = { uid: "demo_user", displayName: "Krio Demo", email: "demo@krio.app" };
    state.membership = { role: "owner", status: "active" };
    state.data = loadLocalState() || seedData(state.user);
    finishBoot();
    return;
  }

  state.firebase = await loadFirebase();
  if (isClientPortalRoute()) {
    if (!state.firebase) {
      failClosed("Não foi possível carregar o portal do cliente. Verifique o link e tente novamente.");
      return;
    }
    try {
      await loadClientPortalForRoute();
      finishClientPortalBoot();
    } catch (error) {
      failClosed("Não encontramos peças para este link de aprovação.");
    }
    return;
  }

  if (!state.firebase) {
    if (!isLocalFallbackAllowed()) {
      failClosed("Não foi possível validar seu acesso. Verifique a conexão e tente novamente.");
      return;
    }
    state.user = { uid: "local_user", displayName: "Krio Local", email: "" };
    state.tenantId = "local";
    state.membership = { role: "owner", status: "active" };
    state.data = loadLocalState() || seedData(state.user);
    setSyncState("offline", "Rodando com dados locais");
    finishBoot();
    return;
  }

  state.firebase.onAuthStateChanged(state.firebase.auth, async (user) => {
    if (!user) {
      stopRealtimeSync();
      window.location.href = "/index.html";
      return;
    }

    try {
      state.user = user;
      await loadTenantForUser(user);
      finishBoot();
    } catch (error) {
      if (["access-pending", "workspace-missing"].includes(error?.message)) return;
      if (!isLocalFallbackAllowed()) {
        failClosed("Não foi possível carregar seu workspace com segurança. Tente novamente em instantes.");
        return;
      }
      state.user = user;
      state.tenantId = user.uid;
      state.membership = { role: "owner", status: "active" };
      state.data = loadLocalState() || seedData(user);
      setSyncState("offline", "Não foi possível carregar o Firebase. Usando cópia local.");
      finishBoot();
    }
  });
}

function isLocalFallbackAllowed() {
  const host = window.location.hostname;
  return window.location.protocol === "file:"
    || host === "localhost"
    || host === "127.0.0.1"
    || host === "::1"
    || host === "";
}

function parseAppRoute() {
  const match = window.location.pathname.match(/\/approval\/([^/?#]+)/);
  return match
    ? { mode: "clientPortal", clientId: decodeURIComponent(match[1]) }
    : { mode: "app", clientId: "" };
}

function isClientPortalRoute() {
  return state?.route?.mode === "clientPortal";
}

function isClientAccessRole(role = currentAccessRole()) {
  return ["client", "guest"].includes(role);
}

function isCreatorAccessRole(role = currentAccessRole()) {
  return ["creator", "member"].includes(role);
}

function isOperationsAccessRole(role = currentAccessRole()) {
  return role === "operations";
}

function isClientExperience() {
  return isClientPortalRoute() || isClientAccessRole();
}

function defaultModuleForRole() {
  if (isClientAccessRole()) return "approval";
  if (isOperationsAccessRole()) return "tracker";
  return "dashboard";
}

function defaultTrackerView() {
  return isOperationsAccessRole() ? "agenda" : "week";
}

function failClosed(message) {
  const loading = $("#loadingState");
  const shell = $("#appShell");
  if (shell) shell.hidden = true;
  if (!loading) return;

  loading.hidden = false;
  const title = $("h1", loading);
  const text = $("p", loading);
  const spinner = $(".spinner", loading);
  if (title) title.textContent = "Acesso não validado";
  if (text) text.textContent = message;
  if (spinner) spinner.hidden = true;
}

function normalizeMembership(membership = {}) {
  const role = validAccessRoles.has(membership.role) ? membership.role : "member";
  return {
    ...membership,
    role,
    status: membership.status || "active"
  };
}

function currentAccessRole() {
  if (isClientPortalRoute()) return "client";
  if (state.demoMode || state.tenantId === "local") return "owner";
  return normalizeMembership(state.membership).role;
}

function canManageWorkspace() {
  return ["owner", "admin"].includes(currentAccessRole());
}

function canEditAgenda() {
  return canManageWorkspace() || isCreatorAccessRole();
}

function canManageDemand(personId) {
  return canManageWorkspace() || (isCreatorAccessRole() && personId === currentPersonId());
}

function isCreatorProfile(person = {}) {
  const accessRole = validAccessRoles.has(person.accessRole) ? person.accessRole : "";
  const jobRole = String(person.role || "").trim().toLocaleLowerCase("pt-BR");
  const isManagementOrOperations = /owner|admin|gestão|gestao|operaç|operac/.test(jobRole);
  if (accessRole === "creator") return true;
  if (accessRole === "member") return !isManagementOrOperations;
  if (["owner", "admin", "operations", "client", "guest"].includes(accessRole)) return false;

  if (isManagementOrOperations) return false;
  return true;
}

function normalizeAssignableAccessRole(role) {
  return workspaceAccessRoles.some((item) => item.id === role) ? role : "creator";
}

function canAccessModule(view) {
  if (isClientExperience()) return view === "approval";
  if (view === "dashboard") return canManageWorkspace() || isCreatorAccessRole();
  if (view === "operations") return canManageWorkspace() || isOperationsAccessRole();
  if (view === "approval") return canManageWorkspace();
  return view === "tracker";
}

function canAccessTrackerView(view) {
  if (canManageWorkspace()) return ["week", "refaction", "agenda", "clients", "reports", "history", "team", "trash"].includes(view);
  if (isOperationsAccessRole()) return ["agenda", "clients", "reports", "history"].includes(view);
  if (isCreatorAccessRole()) return ["week", "refaction", "agenda", "trash"].includes(view);
  return false;
}

function currentPersonId() {
  if (!state.data?.profiles || !state.user?.uid) return "";
  if (state.data.profiles[state.user.uid]) return state.user.uid;
  const profile = Object.values(state.data.profiles).find((item) => item.accessUid === state.user.uid);
  return profile?.id || state.user.uid;
}

function canViewPerson(personId) {
  return canManageWorkspace() || isOperationsAccessRole() || personId === currentPersonId();
}

function resolveClientApprovalId() {
  if (!state.data?.approval?.clients) return null;
  const membership = normalizeMembership(state.membership);
  const candidates = [
    state.route?.clientId,
    state.approvalClientId,
    state.portalIndex?.clientId,
    membership.clientId,
    membership.approvalClientId
  ].filter(Boolean);

  const direct = candidates.find((id) => getClient(id));
  if (direct) return direct;

  const email = String(state.user?.email || "").trim().toLowerCase();
  if (email) {
    const byEmail = getClients().find((client) => String(client.email || "").trim().toLowerCase() === email);
    if (byEmail) return byEmail.id;
  }

  return getClients()[0]?.id || null;
}

function getVisibleProfiles() {
  return getCreatorProfiles().filter((person) => canViewPerson(person.id));
}

function getCreatorProfiles() {
  return getProfiles().filter((person) => isCreatorProfile(person));
}

function defaultAssignedDemandTypes() {
  return demandTypes.map((type) => type.id);
}

function assignedDemandTypes(person = {}) {
  const assigned = Array.isArray(person.assignedTypes)
    ? person.assignedTypes
    : defaultAssignedDemandTypes();
  return assigned.filter((id) => demandTypes.some((type) => type.id === id));
}

function isDemandTypeAssigned(person, typeId) {
  return assignedDemandTypes(person).includes(typeId);
}

function getPersonDemandTypes(person) {
  return demandTypes.filter((type) => isDemandTypeAssigned(person, type.id));
}

function visibleTrashItems() {
  const trash = asArray(state.data?.tracker?.trash);
  if (canManageWorkspace()) return trash;
  const uid = state.user?.uid || "";
  return trash.filter((item) => item.deletedBy?.uid === uid || item.deletedByUid === uid);
}

function flattenTrash(value, ownerUid = "") {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  const values = Object.values(value);
  const nested = values.some((item) => item && typeof item === "object" && !item.id);
  if (nested) {
    return Object.entries(value).flatMap(([uid, items]) => flattenTrash(items, uid));
  }
  return values.map((item) => ({
    ...item,
    deletedBy: item.deletedBy || (ownerUid ? { uid: ownerUid } : null)
  }));
}

async function loadFirebase() {
  try {
    const [firebaseApp, firebaseAuth, firebaseDatabase, firebaseStorage] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js"),
      import("https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js"),
      import("https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js")
    ]);
    const app = firebaseApp.initializeApp(firebaseConfig);
    const storage = firebaseStorage.getStorage(app);
    return {
      app,
      auth: firebaseAuth.getAuth(app),
      db: firebaseDatabase.getDatabase(app),
      storage,
      storageRef: firebaseStorage.ref,
      uploadBytes: firebaseStorage.uploadBytes,
      getDownloadURL: firebaseStorage.getDownloadURL,
      onAuthStateChanged: firebaseAuth.onAuthStateChanged,
      signOut: firebaseAuth.signOut,
      ref: firebaseDatabase.ref,
      get: firebaseDatabase.get,
      set: firebaseDatabase.set,
      update: firebaseDatabase.update,
      onValue: firebaseDatabase.onValue,
      off: firebaseDatabase.off
    };
  } catch (error) {
    return null;
  }
}

async function uploadFileToStorage(file, path) {
  const fb = state.firebase;
  if (!fb?.storage || !file?.size) return "";
  try {
    const storageRef = fb.storageRef(fb.storage, path);
    const snapshot = await fb.uploadBytes(storageRef, file);
    return await fb.getDownloadURL(snapshot.ref);
  } catch {
    return "";
  }
}

async function loadTenantForUser(user) {
  const fb = state.firebase;
  const membershipSnap = await fb.get(fb.ref(fb.db, `memberships/${user.uid}`));
  const memberships = membershipSnap.val() || {};
  const activeMembership = Object.entries(memberships).find(([, membership]) => membership?.status === "active");
  state.tenantId = activeMembership?.[0] || "";
  state.membership = normalizeMembership(activeMembership?.[1]);

  if (!state.tenantId) {
    await registerAccessRequestFromApp(user);
    window.location.href = "/index.html?access=pending";
    throw new Error("access-pending");
  }

  const trashPath = canManageWorkspace()
    ? `tenants/${state.tenantId}/trash`
    : `tenants/${state.tenantId}/trash/${user.uid}`;
  const [metaSnap, billingSnap, profilesSnap, weeksSnap, eventsSnap, approvalSnap, trashSnap] = await Promise.all([
    fb.get(fb.ref(fb.db, `tenants/${state.tenantId}/meta`)),
    canManageWorkspace() ? fb.get(fb.ref(fb.db, `tenants/${state.tenantId}/billing`)) : Promise.resolve({ val: () => ({}), exists: () => false }),
    fb.get(fb.ref(fb.db, `tenants/${state.tenantId}/profiles`)),
    fb.get(fb.ref(fb.db, `tenants/${state.tenantId}/tracker/weeks`)),
    fb.get(fb.ref(fb.db, `tenants/${state.tenantId}/tracker/events`)),
    fb.get(fb.ref(fb.db, `tenants/${state.tenantId}/approval`)),
    fb.get(fb.ref(fb.db, trashPath))
  ]);
  if (!metaSnap.exists() && !profilesSnap.exists() && !weeksSnap.exists() && !approvalSnap.exists()) {
    window.location.href = "/index.html?access=missing";
    throw new Error("workspace-missing");
  }
  const tenant = {
    meta: metaSnap.val() || {},
    billing: billingSnap.val() || {},
    profiles: profilesSnap.val() || {},
    tracker: {
      weeks: weeksSnap.val() || [],
      events: eventsSnap.val() || [],
      trash: flattenTrash(trashSnap.val(), canManageWorkspace() ? "" : user.uid)
    },
    approval: approvalSnap.val() || {}
  };
  state.tenantMeta = tenant.meta || {};
  const localCopy = loadLocalState();
  state.data = normalizeTenant(localCopy || tenant, user);
  await ensureWorkspaceInviteCode();

  if (!asArray(tenant.tracker?.weeks).length || localCopy) {
    await persistNow();
  }
}

async function loadClientPortalForRoute() {
  const clientId = state.route.clientId;
  if (!clientId) throw new Error("portal-missing");
  const fb = state.firebase;
  const portalSnap = await fb.get(fb.ref(fb.db, `approvalPortals/${clientId}`));
  const portal = portalSnap.val() || {};
  const tenantId = portal.tenantId || "";
  const portalClientId = portal.clientId || clientId;
  if (!tenantId || !portalClientId) throw new Error("portal-missing");

  const clientSnap = await fb.get(fb.ref(fb.db, `tenants/${tenantId}/approval/clients/${portalClientId}`));
  if (!clientSnap.exists()) throw new Error("client-missing");

  const client = normalizeApprovalClient(clientSnap.val(), portalClientId);
  state.tenantId = tenantId;
  state.approvalClientId = portalClientId;
  state.portalIndex = {
    ...portal,
    tenantId,
    clientId: portalClientId,
    workspaceName: portal.workspaceName || "Krio"
  };
  state.membership = { role: "client", status: "active" };
  state.user = {
    uid: `guest_${portalClientId}`,
    displayName: client.name || portal.clientName || "Cliente",
    email: client.email || ""
  };
  state.tenantMeta = {
    name: portal.workspaceName || "Krio"
  };
  state.data = {
    meta: state.tenantMeta,
    billing: {},
    profiles: {},
    tracker: { weeks: [], events: [], trash: [] },
    approval: {
      clients: {
        [portalClientId]: client
      }
    }
  };
}

async function registerAccessRequestFromApp(user) {
  const fb = state.firebase;
  if (!fb?.db) return;
  const now = Date.now();
  const requestRef = fb.ref(fb.db, `accessRequests/${user.uid}`);
  const requestSnap = await fb.get(requestRef);
  const current = requestSnap.val() || {};
  if (current.status && current.status !== "pending") return;
  const inviteCode = current.inviteCode || new URLSearchParams(window.location.search).get("invite") || "";
  const inviteTenant = await findTenantByInviteCode(inviteCode, new URLSearchParams(window.location.search).get("workspace") || current.tenantId || "");
  const tenant = inviteTenant;
  const tenantId = tenant?.tenantId || "";
  const agencyName = current.agencyName || tenant?.name || user.email?.split("@")[1]?.split(".")[0] || "Minha Agência";
  if (!tenantId) return;
  const payload = {
    ...current,
    uid: user.uid,
    ...(tenantId ? { tenantId } : {}),
    agencyName,
    userName: user.displayName || user.email?.split("@")[0] || "Usuário",
    email: user.email || "",
    inviteCode: tenant?.inviteCode || current.inviteCode || "",
    status: "pending",
    source: "app",
    requestedAt: current.requestedAt || now,
    updatedAt: now
  };
  const updates = {
    [`accessRequests/${user.uid}`]: payload
  };
  if (tenantId) updates[`tenantAccessRequests/${tenantId}/${user.uid}`] = payload;
  await fb.update(fb.ref(fb.db), updates);
}

async function findTenantByInviteCode(inviteCode = "", workspaceId = "") {
  const fb = state.firebase;
  const code = normalizeInviteCode(inviteCode);
  const workspace = normalizeWorkspaceId(workspaceId) || inviteWorkspaceFromValue(inviteCode);
  if (!fb?.db || !code) return null;
  try {
    const snap = await fb.get(fb.ref(fb.db, `tenantInvites/${code}`));
    const invite = snap.val() || {};
    if (!snap.exists() || invite.status !== "active" || !invite.tenantId) return null;
    if (workspace && invite.tenantId !== workspace) return null;
    return { ...invite, inviteCode: code };
  } catch (error) {
    return null;
  }
}

function normalizeWorkspaceId(value = "") {
  const id = String(value || "").trim();
  return /^tenant_[A-Za-z0-9_-]+$/.test(id) ? id : "";
}

function inviteWorkspaceFromValue(value = "") {
  const raw = String(value || "").trim();
  try {
    if (/^https?:\/\//i.test(raw)) return normalizeWorkspaceId(new URL(raw).searchParams.get("workspace") || "");
  } catch (error) {}
  const queryMatch = raw.match(/[?&]workspace=([^&#]+)/i);
  return queryMatch ? normalizeWorkspaceId(decodeURIComponent(queryMatch[1] || "")) : "";
}

async function ensureWorkspaceInviteCode() {
  if (!canManageWorkspace() || !state.data?.meta) return "";
  const existing = normalizeInviteCode(state.data.meta.inviteCode || "");
  const code = existing || await generateUniqueInviteCode(state.data.meta.name || "KRIO");
  const now = Date.now();
  state.data.meta.inviteCode = code;
  state.tenantMeta = state.data.meta;

  if (!state.firebase?.db || state.demoMode || state.tenantId === "local") return code;

  const invitePayload = workspaceInvitePayload(code, now);
  const updates = {
    [`tenantInvites/${code}`]: invitePayload
  };
  if (!existing) {
    updates[`tenants/${state.tenantId}/meta/inviteCode`] = code;
    updates[`tenants/${state.tenantId}/meta/inviteUpdatedAt`] = now;
  }

  try {
    await state.firebase.update(state.firebase.ref(state.firebase.db), updates);
  } catch (error) {
    // The invite link also carries the workspace id, so this index is optional.
  }
  return code;
}

function workspaceInvitePayload(code, now = Date.now()) {
  const meta = state.data?.meta || state.tenantMeta || {};
  return {
    code,
    tenantId: state.tenantId,
    name: meta.name || "Workspace Krio",
    slug: meta.slug || slugify(meta.name || "workspace"),
    ownerUid: meta.ownerUid || state.user?.uid || "",
    status: "active",
    updatedAt: now,
    createdAt: meta.inviteUpdatedAt || meta.createdAt || now
  };
}

function normalizeInviteCode(value = "") {
  let raw = String(value || "").trim();
  if (!raw) return "";
  try {
    if (/^https?:\/\//i.test(raw)) raw = new URL(raw).searchParams.get("invite") || raw;
  } catch (error) {}
  const queryMatch = raw.match(/[?&]invite=([^&#]+)/i);
  if (queryMatch) raw = decodeURIComponent(queryMatch[1] || "");
  return raw.toUpperCase().replace(/[^A-Z0-9-]/g, "").replace(/-+/g, "-").replace(/(^-|-$)/g, "");
}

function generateInviteCode(seed = "KRIO") {
  const prefix = slugify(seed).replace(/-/g, "").slice(0, 4).toUpperCase() || "KRIO";
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  const values = new Uint32Array(5);
  if (crypto?.getRandomValues) crypto.getRandomValues(values);
  for (let index = 0; index < 5; index += 1) {
    const value = values[index] || Math.floor(Math.random() * alphabet.length);
    suffix += alphabet[value % alphabet.length];
  }
  return `${prefix}-${suffix}`;
}

async function generateUniqueInviteCode(seed = "KRIO") {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const code = generateInviteCode(seed);
    if (!state.firebase?.db || state.demoMode || state.tenantId === "local") return code;
    const snap = await state.firebase.get(state.firebase.ref(state.firebase.db, `tenantInvites/${code}`));
    if (!snap.exists()) return code;
  }
  return `${slugify(seed).replace(/-/g, "").slice(0, 4).toUpperCase() || "KRIO"}-${Date.now().toString(36).toUpperCase()}`;
}

function workspaceInviteLink() {
  const code = normalizeInviteCode(state.data?.meta?.inviteCode || "");
  return code ? `${window.location.origin}/?invite=${encodeURIComponent(code)}&workspace=${encodeURIComponent(state.tenantId)}` : "";
}

function finishBoot() {
  if (isClientPortalRoute()) {
    finishClientPortalBoot();
    return;
  }
  state.tenantMeta = state.data.meta || {};
  state.activeView = defaultModuleForRole();
  if (isClientAccessRole()) {
    state.approvalStatus = "clientReview";
    state.approvalClientId = resolveClientApprovalId();
  }
  state.trackerView = defaultTrackerView();
  const localWeek = currentWeek();
  state.currentWeekIndex = Math.max(0, state.data.tracker.weeks.indexOf(localWeek));
  render();
  $("#loadingState").hidden = true;
  $("#appShell").hidden = false;
  setupRealtimeSync();
  startTimerTick();
  checkConnectionLimit();
}

function finishClientPortalBoot() {
  state.membership = { role: "client", status: "active" };
  state.activeView = "approval";
  state.approvalStatus = "clientReview";
  state.approvalClientId = resolveClientApprovalId();
  state.tenantMeta = state.data?.meta || state.tenantMeta || {};
  render();
  $("#loadingState").hidden = true;
  $("#appShell").hidden = false;
  setupClientPortalSync();
}

function setupClientPortalSync() {
  stopRealtimeSync();
  if (!state.firebase?.db || state.demoMode || state.tenantId === "local" || !state.approvalClientId) return;

  const fb = state.firebase;
  const path = `tenants/${state.tenantId}/approval/clients/${state.approvalClientId}`;
  const unsubscribe = fb.onValue(
    fb.ref(fb.db, path),
    (snapshot) => {
      const client = snapshot.val();
      if (!client) return;
      state.data.approval.clients[state.approvalClientId] = normalizeApprovalClient(client, state.approvalClientId);
      render();
      setSyncState("online", "Portal atualizado");
    },
    () => setSyncState("offline", "Portal indisponível")
  );
  state.realtimeUnsubs.push(unsubscribe);
}

function checkConnectionLimit() {
  if (!canManageWorkspace()) return;
  const profileCount = getProfiles().length;
  if (profileCount < 8) return;
  const existing = document.getElementById("connectionLimitBanner");
  if (existing) return;
  const banner = document.createElement("div");
  banner.id = "connectionLimitBanner";
  banner.style.cssText = "display:flex;align-items:center;justify-content:space-between;gap:12px;padding:8px 20px;background:rgba(217,119,6,0.12);border-bottom:1px solid rgba(217,119,6,0.25);font-size:12px;color:#D97706;z-index:200;position:relative;";
  banner.innerHTML = `<span><strong>Atenção:</strong> Workspace com ${profileCount} membros. O plano Spark suporta até 100 conexões simultâneas. Considere migrar para o plano Blaze conforme o crescimento da equipe.</span><button type="button" aria-label="Fechar aviso" style="background:none;border:none;cursor:pointer;color:#D97706;font-size:16px;line-height:1;padding:0 4px;">✕</button>`;
  banner.querySelector("button").onclick = () => banner.remove();
  document.querySelector(".app-topbar")?.after(banner);
}

function setupRealtimeSync() {
  stopRealtimeSync();
  if (!state.firebase?.db || !state.firebase.onValue || state.demoMode || state.tenantId === "local" || !state.data) return;

  const fb = state.firebase;
  const tenantPath = `tenants/${state.tenantId}`;
  const trashPath = canManageWorkspace()
    ? `${tenantPath}/trash`
    : `${tenantPath}/trash/${state.user?.uid || ""}`;
  const subscriptions = [
    {
      path: `${tenantPath}/meta`,
      apply: (value) => {
        state.data.meta = {
          ...(state.data.meta || {}),
          ...(value || {})
        };
        state.tenantMeta = state.data.meta;
      }
    },
    {
      path: `${tenantPath}/profiles`,
      apply: (value) => {
        state.data.profiles = normalizeProfiles(value, state.user);
        state.data.tracker.weeks = asArray(state.data.tracker.weeks).map((week) => normalizeWeek(week, state.data.profiles));
      }
    },
    {
      path: `${tenantPath}/tracker/weeks`,
      apply: (value) => {
        const weeks = asArray(value);
        state.data.tracker.weeks = weeks.length
          ? weeks.map((week) => normalizeWeek(week, state.data.profiles || {}))
          : [];
        state.currentWeekIndex = Math.min(state.currentWeekIndex, Math.max(0, state.data.tracker.weeks.length - 1));
      }
    },
    {
      path: `${tenantPath}/tracker/events`,
      apply: (value) => {
        state.data.tracker.events = normalizeAgendaEvents(value);
      }
    },
    {
      path: `${tenantPath}/approval`,
      apply: (value) => {
        state.data.approval = normalizeApprovalState(value);
        if (state.approvalClientId && !getClient(state.approvalClientId)) state.approvalClientId = null;
      }
    },
    {
      path: trashPath,
      apply: (value) => {
        state.data.tracker.trash = flattenTrash(value, canManageWorkspace() ? "" : state.user?.uid || "");
      }
    }
  ];

  if (canManageWorkspace()) {
    subscriptions.splice(1, 0, {
      path: `${tenantPath}/billing`,
      apply: (value) => {
        state.data.billing = {
          ...(state.data.billing || {}),
          ...(value || {})
        };
      }
    });
    subscriptions.splice(2, 0, {
      path: `tenantAccessRequests/${state.tenantId}`,
      apply: (value) => {
        state.accessRequests = Object.values(value || {})
          .filter((request) => request?.status === "pending")
          .sort((a, b) => Number(b.requestedAt || b.updatedAt || 0) - Number(a.requestedAt || a.updatedAt || 0));
      }
    });
  }

  let initialCallbacks = subscriptions.length;
  subscriptions.forEach(({ path, apply }) => {
    let initialized = false;
    const unsubscribe = fb.onValue(
      fb.ref(fb.db, path),
      (snapshot) => {
        const isInitial = !initialized;
        initialized = true;
        if (shouldHoldRealtimeSnapshot()) {
          if (isInitial && initialCallbacks > 0) initialCallbacks -= 1;
          return;
        }
        apply(snapshot.val());
        if (isInitial && initialCallbacks > 0) {
          initialCallbacks -= 1;
          if (initialCallbacks === 0) scheduleRealtimeRender("Atualizado em tempo real");
          return;
        }
        scheduleRealtimeRender("Atualizado em tempo real");
      },
      () => setSyncState("offline", "Tempo real indisponível")
    );
    state.realtimeUnsubs.push(unsubscribe);
  });
}

function markLocalWrite() {
  state.localWritePending = true;
  state.localWriteBlockUntil = Date.now() + 4500;
}

function releaseLocalWrite(success = true) {
  state.localWritePending = false;
  state.localWriteBlockUntil = Date.now() + (success ? 700 : 6000);
}

function shouldHoldRealtimeSnapshot() {
  return state.localWritePending || Date.now() < state.localWriteBlockUntil;
}

function stopRealtimeSync() {
  state.realtimeUnsubs.forEach((unsubscribe) => {
    try {
      unsubscribe?.();
    } catch (error) {
      // Firebase may already have closed the listener.
    }
  });
  state.realtimeUnsubs = [];
  if (state.realtimeRenderTimer) {
    cancelAnimationFrame(state.realtimeRenderTimer);
    state.realtimeRenderTimer = null;
  }
}

function scheduleRealtimeRender(message = "Sincronizado") {
  if (state.realtimeRenderTimer) return;
  state.realtimeRenderTimer = requestAnimationFrame(() => {
    state.realtimeRenderTimer = null;
    saveLocalState();
    render();
    setSyncState("online", message);
  });
}

function setupShellEvents() {
  document.querySelectorAll(".app-tab").forEach((button) => {
    button.addEventListener("click", () => switchModule(button.dataset.view));
  });

  $("#sidebarToggle")?.addEventListener("click", () => {
    const shell = $("#appShell");
    const collapsed = !shell.classList.contains("sidebar-collapsed");
    shell.classList.toggle("sidebar-collapsed", collapsed);
    $("#sidebarToggle").setAttribute("aria-expanded", String(!collapsed));
    localStorage.setItem("krio-sidebar-collapsed", collapsed ? "1" : "0");
  });

  if (localStorage.getItem("krio-sidebar-collapsed") === "1") {
    $("#appShell")?.classList.add("sidebar-collapsed");
    $("#sidebarToggle")?.setAttribute("aria-expanded", "false");
  }

  $("#logoutBtn")?.addEventListener("click", async () => {
    if (state.firebase?.auth) {
      await state.firebase.signOut(state.firebase.auth);
    } else {
      window.location.href = "/index.html";
    }
  });

  document.addEventListener("click", handleClick);
  document.addEventListener("submit", handleSubmit);
  document.addEventListener("dragstart", handleApprovalDragStart);
  document.addEventListener("dragend", handleApprovalDragEnd);
  document.addEventListener("dragover", handleApprovalDragOver);
  document.addEventListener("dragleave", handleApprovalDragLeave);
  document.addEventListener("drop", handleApprovalDrop);
  document.addEventListener("pointerdown", handleDialogPointerDown);
  document.addEventListener("change", handleApprovalFieldChange);
  document.addEventListener("keydown", handleApprovalKeydown);
  window.addEventListener("online", () => setSyncState("online", "Online"));
  window.addEventListener("offline", () => setSyncState("offline", "Sem conexão"));
}

function ensureDialogHosts() {
  if (!$("#trackerDialogHost")) {
    const host = document.createElement("div");
    host.id = "trackerDialogHost";
    host.className = "tracker-dialog-host";
    document.body.appendChild(host);
  }
  if (!$("#approvalDialogHost")) {
    const host = document.createElement("div");
    host.id = "approvalDialogHost";
    host.className = "approval-dialog-host";
    document.body.appendChild(host);
  }
}

function handleClick(event) {
  if (event.target.closest("input, textarea, select, label")) return;
  const button = event.target.closest("button, [data-action], [data-tracker-view], [data-approval-client], [data-client-folder], [data-demand-id], [data-creative-id], [data-dialog-backdrop]");
  if (!button) return;

  if (button.matches("[data-dialog-backdrop]") && button === event.target) {
    closeDialogs();
    return;
  }

  const trackerView = button.dataset.trackerView;
  if (trackerView) {
    if (!canAccessTrackerView(trackerView)) return;
    if (trackerView === "reports" && !featureEnabled("reports")) {
      openPlanDialog("Relatórios avançados dependem de uma licença ativa.");
      return;
    }
    state.trackerView = trackerView;
    render();
    return;
  }

  if (button.dataset.approvalClient) {
    state.approvalClientId = button.dataset.approvalClient;
    state.approvalStatus = "prov";
    render();
    return;
  }

  if (button.dataset.clientFolder) {
    const id = button.dataset.clientFolder;
    state.approvalOpenClientFolders[id] = !isClientFolderOpen(id);
    renderModuleActions();
    return;
  }

  const action = button.dataset.action;
  if (!action) return;
  if (!canRunAction(action, button)) return;

  const actions = {
    closeDialog: closeDialogs,
    switchTrackerFilter: () => {
      state.trackerFilter = button.dataset.filter || "all";
      renderTracker();
    },
    prevWeek: () => moveWeek(-1),
    nextWeek: () => moveWeek(1),
    newWeek: createNextWeek,
    deleteWeek: () => deleteCurrentWeek(),
    openAddDemand: () => openDemandDialog("", {
      personId: button.dataset.person || (canManageWorkspace() ? getVisibleProfiles()[0]?.id : currentPersonId()),
      type: button.dataset.type
    }),
    editDemand: () => openDemandDialog(button.dataset.id),
    toggleDemand: () => toggleDemand(button.dataset.id),
    deleteDemand: () => deleteDemand(button.dataset.id),
    restoreDemand: () => restoreDemand(button.dataset.id),
    restoreWeek: () => restoreWeek(button.dataset.id),
    deleteTrashItem: () => deleteTrashItem(button.dataset.id),
    purgeTrash: purgeTrash,
    toggleTimer: () => toggleTimer(button.dataset.id),
    openTimerEdit: () => openTimerEditDialog(button.dataset.id),
    resetTime: () => resetDemandTime(button.dataset.id),
    openDemandNote: () => openDemandNoteDialog(button.dataset.id),
    cycleDifficulty: () => cycleDemandDifficulty(button.dataset.id, button),
    openDashboard: () => {
      state.activeView = "dashboard";
      render();
    },
    openTracker: () => {
      state.activeView = "tracker";
      state.trackerView = defaultTrackerView();
      render();
    },
    openApprovalModule: () => {
      state.activeView = "approval";
      render();
    },
    openClientManagement: () => {
      state.activeView = "tracker";
      state.trackerView = "clients";
      render();
    },
    openBriefingDialog: () => openBriefingDialog(button.dataset.client || ""),
    copyClientPortalLink: () => copyClientPortalLink(button.dataset.client || ""),
    toggleDemandMenu: () => {
      const article = button.closest(".tracker-demand-item");
      if (!article) return;
      const isOpen = article.hasAttribute("data-menu-open");
      document.querySelectorAll(".tracker-demand-item[data-menu-open]").forEach((el) => el.removeAttribute("data-menu-open"));
      if (!isOpen) article.setAttribute("data-menu-open", "");
    },
    openPersonDialog: () => openPersonDialog(button.dataset.id),
    deletePerson: () => deletePerson(button.dataset.id),
    approveAccessRequest: () => approveAccessRequest(button.dataset.uid),
    rejectAccessRequest: () => rejectAccessRequest(button.dataset.uid),
    copyInviteLink: () => copyWorkspaceInvite(workspaceInviteLink(), "Link de convite copiado"),
    togglePersonDemandType: () => togglePersonDemandType(button.dataset.person, button.dataset.type, button),
    setColorValue: () => setColorValue(button),
    agendaPrev: () => moveAgenda(-1),
    agendaNext: () => moveAgenda(1),
    agendaToday: () => {
      state.agendaCursor = isoDate(new Date());
      renderTracker();
    },
    setAgendaView: () => {
      state.agendaView = button.dataset.view || "month";
      if (button.dataset.agendaMonth) {
        const cursor = parseISODate(state.agendaCursor);
        state.agendaCursor = isoDate(new Date(cursor.getFullYear(), Number(button.dataset.agendaMonth || 0), 1));
      }
      renderTracker();
    },
    openAgendaEventDialog: () => openAgendaEventDialog(button.dataset.id || "", button.dataset.date || ""),
    deleteAgendaEvent: () => deleteAgendaEvent(button.dataset.id),
    exportTracker: exportTracker,
    printTracker: printTracker,
    openReportPreview: openReportPreview,
    downloadReportHtml: downloadReportHtml,
    syncNow: () => persistNow(),
    backApproval: () => {
      state.approvalClientId = null;
      render();
    },
    openClientDialog: () => openClientDialog(button.dataset.id),
    deleteClient: () => deleteClient(button.dataset.id),
    openClientFolderDialog: () => openClientFolderDialog(button.dataset.id),
    deleteClientFolder: () => deleteClientFolder(button.dataset.id),
    removeClientFromFolder: () => removeClientFromFolder(button.dataset.folder, button.dataset.client),
    openGroupDialog: () => openGroupDialog(button.dataset.id),
    deleteGroup: () => deleteGroup(button.dataset.id),
    openCreativeDialog: () => openCreativeDialog(button.dataset.id || "", { groupId: button.dataset.group }),
    openCreativeDetail: () => openCreativeDetail(button.dataset.id),
    deleteCreative: () => deleteCreative(button.dataset.id),
    setCreativeStatus: () => setCreativeStatus(button.dataset.id, button.dataset.status),
    openInternalRejectionDialog: () => openInternalRejectionDialog(button.dataset.id),
    sendToClientBoard: () => sendToClientBoard(button.dataset.id),
    clientApproveCreative: () => clientApproveCreative(button.dataset.id),
    openClientRejectionDialog: () => openClientRejectionDialog(button.dataset.id),
    markCreativeCorrected: () => markCreativeCorrected(button.dataset.id),
    markCreativePosted: () => markCreativePosted(button.dataset.id),
    triggerImageUpload: () => triggerImageUpload(),
    setApprovalStatus: () => {
      state.approvalStatus = button.dataset.status || "prov";
      renderApproval();
    },
    openPlanDialog: () => openPlanDialog(),
    requestPlan: () => requestPlan(button.dataset.plan),
    openBillingPortal: () => openBillingPortal(),
    openLightbox: () => openLightbox(button.dataset.src),
    closeLightbox: closeLightbox
  };

  actions[action]?.();
}

function canRunAction(action, button) {
  const workspaceActions = new Set([
    "newWeek",
    "deleteWeek",
    "openPersonDialog",
    "deletePerson",
    "approveAccessRequest",
    "rejectAccessRequest",
    "copyInviteLink",
    "togglePersonDemandType",
    "openPlanDialog",
    "exportTracker",
    "printTracker",
    "openClientDialog",
    "openClientManagement",
    "openBriefingDialog",
    "deleteClient",
    "openClientFolderDialog",
    "deleteClientFolder",
    "removeClientFromFolder",
    "deleteGroup"
  ]);
  if (workspaceActions.has(action)) return canManageWorkspace();
  if (action === "copyClientPortalLink") return canAccessTrackerView("clients") || canManageWorkspace();
  if (action === "openAgendaEventDialog" || action === "deleteAgendaEvent") return canEditAgenda();
  if (action === "openAddDemand") {
    return canManageDemand(button.dataset.person || currentPersonId());
  }
  if (["editDemand", "toggleDemand", "deleteDemand", "toggleTimer", "openTimerEdit", "resetTime", "openDemandNote", "cycleDifficulty"].includes(action)) {
    const found = findDemand(button.dataset.id);
    return Boolean(found && canManageDemand(found.personId));
  }
  return true;
}

function handleSubmit(event) {
  const form = event.target;
  if (!form.matches("form")) return;

  if (form.id === "demandForm") {
    event.preventDefault();
    saveDemandForm(form);
  }
  if (form.id === "personForm") {
    event.preventDefault();
    savePersonForm(form);
  }
  if (form.id === "workspaceForm") {
    event.preventDefault();
    saveWorkspaceForm(form);
  }
  if (form.id === "agendaEventForm") {
    event.preventDefault();
    saveAgendaEventForm(form);
  }
  if (form.id === "clientForm") {
    event.preventDefault();
    saveClientForm(form);
  }
  if (form.id === "clientFolderForm") {
    event.preventDefault();
    saveClientFolderForm(form);
  }
  if (form.id === "groupForm") {
    event.preventDefault();
    saveGroupForm(form);
  }
  if (form.id === "creativeForm") {
    event.preventDefault();
    saveCreativeForm(form);
  }
  if (form.id === "commentForm") {
    event.preventDefault();
    saveCommentForm(form);
  }
  if (form.id === "completeDemandForm") {
    event.preventDefault();
    saveCompleteDemandForm(form);
  }
  if (form.id === "timerEditForm") {
    event.preventDefault();
    saveTimerEditForm(form);
  }
  if (form.id === "demandNoteForm") {
    event.preventDefault();
    saveDemandNoteForm(form);
  }
  if (form.id === "clientRejectionForm") {
    event.preventDefault();
    saveClientRejectionForm(form);
  }
  if (form.id === "internalRejectionForm") {
    event.preventDefault();
    saveInternalRejectionForm(form);
  }
  if (form.id === "briefingForm") {
    event.preventDefault();
    saveBriefingForm(form);
  }
}

function handleApprovalDragStart(event) {
  const clientItem = event.target.closest(".approval-client-nav[draggable='true']");
  if (clientItem && !event.target.closest("[data-action]")) {
    const payload = {
      type: "client",
      clientId: clientItem.dataset.clientDragId
    };
    state.approvalDrag = payload;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("application/json", JSON.stringify(payload));
    requestAnimationFrame(() => clientItem.classList.add("dragging"));
    return;
  }

  if (event.target.closest("button, input, textarea, select, label")) return;

  const demandItem = event.target.closest(".tracker-demand-item[draggable='true']");
  if (demandItem) {
    state.trackerDrag = {
      id: demandItem.dataset.id,
      fromPersonId: demandItem.dataset.person,
      fromType: demandItem.dataset.type
    };
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("application/json", JSON.stringify({ type: "trackerDemand", demandId: demandItem.dataset.id }));
    requestAnimationFrame(() => demandItem.classList.add("dragging"));
    return;
  }

  const card = event.target.closest(".approval-creative[draggable='true']");
  if (card) {
    const payload = {
      type: "creative",
      creativeId: card.dataset.id,
      fromGroupId: card.dataset.group
    };
    state.approvalDrag = payload;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("application/json", JSON.stringify(payload));
    requestAnimationFrame(() => card.classList.add("dragging"));
    return;
  }

  const group = event.target.closest(".approval-kanban-column[draggable='true']");
  if (!group || event.target.closest(".approval-creative")) return;
  const payload = {
    type: "group",
    groupId: group.dataset.approvalGroup
  };
  state.approvalDrag = payload;
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("application/json", JSON.stringify(payload));
  requestAnimationFrame(() => group.classList.add("dragging"));
}

function handleApprovalDragOver(event) {
  if (state.trackerDrag?.id) {
    const dropzone = event.target.closest("[data-tracker-dropzone]");
    if (!dropzone) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    dropzone.classList.add("drag-over");
    document.querySelectorAll(".tracker-demand-item.drag-over").forEach((node) => node.classList.remove("drag-over"));
    const item = event.target.closest(".tracker-demand-item[draggable='true']");
    if (item && item.dataset.id !== state.trackerDrag.id) item.classList.add("drag-over");
    return;
  }

  const uploadZone = event.target.closest("[data-approval-upload-zone]");
  if (uploadZone && Array.from(event.dataTransfer?.types || []).includes("Files")) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    uploadZone.classList.add("drag-over");
    return;
  }

  const payload = readApprovalDragPayload(event);
  if (payload.type === "client") {
    const folderDropzone = event.target.closest("[data-client-folder-dropzone]");
    const clientTarget = event.target.closest("[data-client-drop-target]");
    if (!folderDropzone && !clientTarget) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    folderDropzone?.classList.add("drag-over");
    if (clientTarget && clientTarget.dataset.clientDropTarget !== payload.clientId) {
      clientTarget.classList.add("client-drag-over");
    }
    return;
  }

  if (payload.type === "group") {
    const board = event.target.closest("[data-approval-group-board]");
    if (!board) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    event.target.closest(".approval-kanban-column")?.classList.add("group-drag-over");
    return;
  }

  const dropzone = event.target.closest("[data-approval-dropzone]");
  if (!dropzone) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
  dropzone.classList.add("drag-over");
}

function handleApprovalDragLeave(event) {
  const trackerDropzone = event.target.closest("[data-tracker-dropzone]");
  if (trackerDropzone && !trackerDropzone.contains(event.relatedTarget)) {
    trackerDropzone.classList.remove("drag-over");
  }

  const uploadZone = event.target.closest("[data-approval-upload-zone]");
  if (uploadZone && !uploadZone.contains(event.relatedTarget)) {
    uploadZone.classList.remove("drag-over");
    return;
  }

  const groupColumn = event.target.closest(".approval-kanban-column.group-drag-over");
  if (groupColumn && !groupColumn.contains(event.relatedTarget)) {
    groupColumn.classList.remove("group-drag-over");
  }

  const clientFolder = event.target.closest("[data-client-folder-dropzone]");
  if (clientFolder && !clientFolder.contains(event.relatedTarget)) {
    clientFolder.classList.remove("drag-over");
  }

  const clientTarget = event.target.closest("[data-client-drop-target]");
  if (clientTarget && !clientTarget.contains(event.relatedTarget)) {
    clientTarget.classList.remove("client-drag-over");
  }

  const dropzone = event.target.closest("[data-approval-dropzone]");
  if (!dropzone || dropzone.contains(event.relatedTarget)) return;
  dropzone.classList.remove("drag-over");
}

function handleApprovalDragEnd() {
  document.querySelectorAll(".tracker-demand-item.dragging, .tracker-demand-item.drag-over, .tracker-dropzone.drag-over").forEach((node) => {
    node.classList.remove("dragging", "drag-over");
  });
  state.trackerDrag = null;
  state.approvalDrag = null;

  document.querySelectorAll(".approval-creative.dragging, .approval-kanban-column.dragging, .approval-kanban-column.group-drag-over, .approval-kanban-list.drag-over, .approval-upload-zone.drag-over, .approval-client-nav.dragging, [data-client-folder-dropzone].drag-over, [data-client-drop-target].client-drag-over").forEach((node) => {
    node.classList.remove("dragging", "drag-over", "group-drag-over", "client-drag-over");
  });
}

function handleApprovalDrop(event) {
  if (state.trackerDrag?.id) {
    const dropzone = event.target.closest("[data-tracker-dropzone]");
    if (!dropzone) {
      handleApprovalDragEnd();
      return;
    }
    event.preventDefault();
    const targetItem = event.target.closest(".tracker-demand-item[draggable='true']");
    const rect = targetItem?.getBoundingClientRect();
    const insertAfter = rect ? event.clientY > rect.top + (rect.height / 2) : false;
    moveTrackerDemand(state.trackerDrag.id, dropzone.dataset.person, dropzone.dataset.type, targetItem?.dataset.id || "", insertAfter);
    handleApprovalDragEnd();
    return;
  }

  const uploadZone = event.target.closest("[data-approval-upload-zone]");
  if (uploadZone && Array.from(event.dataTransfer?.types || []).includes("Files")) {
    event.preventDefault();
    handleApprovalUploadDrop(event, uploadZone);
    handleApprovalDragEnd();
    return;
  }

  const payload = readApprovalDragPayload(event);
  if (payload.type === "client") {
    const folderDropzone = event.target.closest("[data-client-folder-dropzone]");
    const clientTarget = event.target.closest("[data-client-drop-target]");
    if (!folderDropzone && !clientTarget) {
      handleApprovalDragEnd();
      return;
    }
    event.preventDefault();
    if (folderDropzone) {
      moveClientToFolder(payload.clientId, folderDropzone.dataset.clientFolderDropzone);
    } else if (clientTarget) {
      createClientFolderFromClients(payload.clientId, clientTarget.dataset.clientDropTarget);
    }
    handleApprovalDragEnd();
    return;
  }

  if (payload.type === "group") {
    const board = event.target.closest("[data-approval-group-board]");
    if (!board) return;
    event.preventDefault();
    const targetGroup = event.target.closest(".approval-kanban-column")?.dataset.approvalGroup || "";
    moveGroupBefore(payload.groupId, targetGroup);
    handleApprovalDragEnd();
    return;
  }

  const dropzone = event.target.closest("[data-approval-dropzone]");
  if (!dropzone) return;
  event.preventDefault();
  dropzone.classList.remove("drag-over");

  const targetGroupId = dropzone.dataset.approvalDropzone;
  if (payload.type !== "creative" || !payload.creativeId || !targetGroupId || payload.fromGroupId === targetGroupId) {
    handleApprovalDragEnd();
    return;
  }

  moveCreativeToGroup(payload.creativeId, targetGroupId);
  handleApprovalDragEnd();
}

function readApprovalDragPayload(event) {
  try {
    const raw = event.dataTransfer?.getData("application/json") || "";
    return raw ? JSON.parse(raw) : state.approvalDrag || {};
  } catch (error) {
    return state.approvalDrag || {};
  }
}

function handleApprovalUploadDrop(event, uploadZone) {
  const input = uploadZone.querySelector('input[type="file"]') || $("#creativeImageFile");
  const files = Array.from(event.dataTransfer?.files || []).filter((item) => item.type.startsWith("image/"));
  if (!input || !files.length) return;
  const transfer = new DataTransfer();
  Array.from(input.files || []).forEach((file) => transfer.items.add(file));
  files.forEach((file) => transfer.items.add(file));
  input.files = transfer.files;
  updateCreativeUploadPreview(input);
}

function handleApprovalFieldChange(event) {
  const colorInput = event.target.closest("[data-color-custom]");
  if (colorInput) {
    updateColorPickerValue(colorInput);
    return;
  }

  const fileInput = event.target.closest("#creativeImageFile");
  if (fileInput) {
    updateCreativeUploadPreview(fileInput);
    return;
  }

  const inline = event.target.closest("[data-approval-inline]");
  if (inline) {
    updateApprovalInlineField(inline);
    return;
  }

  const scheduleField = event.target.closest("[data-schedule-field]");
  if (scheduleField) {
    updateScheduleField(scheduleField);
  }
}

function handleApprovalKeydown(event) {
  const inline = event.target.closest("[data-approval-inline]");
  if (!inline) return;
  if (event.key === "Enter") {
    event.preventDefault();
    inline.blur();
  }
  if (event.key === "Escape") {
    inline.value = inline.dataset.originalValue || "";
    inline.blur();
  }
}

function updateApprovalInlineField(input) {
  const value = String(input.value || "").trim();
  const field = input.dataset.approvalInline;
  if (!value) {
    input.value = input.dataset.originalValue || "";
    return;
  }

  if (field === "groupName") {
    const client = getClient(state.approvalClientId);
    const group = client?.groups?.[input.dataset.id];
    if (!group) return;
    group.name = value;
    group.updatedAt = Date.now();
    input.dataset.originalValue = value;
    persist();
    renderApproval();
    return;
  }

  if (field === "creativeTitle") {
    const found = findCreative(input.dataset.id);
    if (!found?.creative) return;
    found.creative.title = value;
    found.creative.updatedAt = Date.now();
    input.dataset.originalValue = value;
    persist();
    renderApproval();
  }
}

function updateScheduleField(input) {
  const found = findCreative(input.dataset.id);
  if (!found?.creative) return;
  const field = input.dataset.scheduleField;
  if (field === "scheduledDate") {
    found.creative.scheduledDate = String(input.value || "");
  }
  if (field === "scheduledTime") {
    found.creative.scheduledTime = String(input.value || "");
  }
  if (field === "scheduleOrder") {
    found.creative.scheduleOrder = Math.max(0, Number(input.value || 0));
  }
  found.creative.updatedAt = Date.now();
  persist();
  if (syncPostedCreatives() && state.activeView === "approval") renderApproval();
}

function updateCreativeUploadPreview(input) {
  const preview = $("#creativeUploadPreview");
  if (!preview) return;
  const files = Array.from(input.files || []).filter((file) => file.type.startsWith("image/"));
  if (!files.length) return;
  preview.innerHTML = `
    <div class="approval-upload-preview-grid">
      ${files.map((file, index) => `<img src="${attr(URL.createObjectURL(file))}" alt="${attr(file.name || `Imagem ${index + 1}`)}">`).join("")}
    </div>`;
}

function triggerImageUpload() {
  $("#creativeImageFile")?.click();
}

function handleDialogPointerDown(event) {
  const head = event.target.closest(".approval-dialog-head");
  if (!head || event.target.closest("button, input, textarea, select, a")) return;

  const dialog = head.closest(".approval-dialog, .approval-detail");
  if (!dialog) return;

  const rect = dialog.getBoundingClientRect();
  const offsetX = event.clientX - rect.left;
  const offsetY = event.clientY - rect.top;

  dialog.style.position = "fixed";
  dialog.style.left = `${rect.left}px`;
  dialog.style.top = `${rect.top}px`;
  dialog.style.width = `${rect.width}px`;
  dialog.style.margin = "0";
  dialog.style.transform = "none";
  dialog.style.animation = "none";
  head.setPointerCapture?.(event.pointerId);

  const move = (moveEvent) => {
    const maxLeft = Math.max(8, window.innerWidth - rect.width - 8);
    const maxTop = Math.max(8, window.innerHeight - Math.min(rect.height, window.innerHeight - 16) - 8);
    const left = Math.min(Math.max(8, moveEvent.clientX - offsetX), maxLeft);
    const top = Math.min(Math.max(8, moveEvent.clientY - offsetY), maxTop);
    dialog.style.left = `${left}px`;
    dialog.style.top = `${top}px`;
  };

  const up = () => {
    document.removeEventListener("pointermove", move);
    document.removeEventListener("pointerup", up);
    head.releasePointerCapture?.(event.pointerId);
  };

  document.addEventListener("pointermove", move);
  document.addEventListener("pointerup", up, { once: true });
}

function switchModule(view) {
  if (!views[view]) return;
  if (!canAccessModule(view)) return;
  if (view === "operations" && !featureEnabled("operations")) {
    openPlanDialog("O módulo Operação depende de uma licença ativa.");
    return;
  }
  state.activeView = view;
  render();
}

function render() {
  if (isClientExperience()) {
    state.activeView = "approval";
    state.approvalStatus = "clientReview";
    state.approvalClientId = resolveClientApprovalId();
    renderClientPortal();
    applyRoleVisibility();
    return;
  }
  if (!canAccessModule(state.activeView)) state.activeView = defaultModuleForRole();
  if (!canAccessTrackerView(state.trackerView)) state.trackerView = defaultTrackerView();
  renderUser();
  renderShellState();
  renderModuleActions();
  renderTopbarActions();
  renderDashboard();
  renderTracker();
  renderOperations();
  renderApproval();
  applyRoleVisibility();
}

function applyRoleVisibility() {
  const role = currentAccessRole();
  const shell = $("#appShell");
  shell?.setAttribute("data-access-role", role);
  shell?.classList.toggle("client-portal-shell", isClientExperience());
  document.body.classList.toggle("role-admin", canManageWorkspace() && !isClientExperience());
  document.body.classList.toggle("role-member", role === "member");
  document.body.classList.toggle("role-creator", isCreatorAccessRole() && !isClientExperience());
  document.body.classList.toggle("role-operations", isOperationsAccessRole());
  document.body.classList.toggle("role-client", isClientExperience());
  document.querySelectorAll("[data-tracker-view]").forEach((button) => {
    button.hidden = !canAccessTrackerView(button.dataset.trackerView);
  });
  document.querySelectorAll('[data-action="openPersonDialog"], [data-action="deletePerson"], [data-action="togglePersonDemandType"], [data-action="deleteWeek"], [data-action="openPlanDialog"], [data-action="exportTracker"], [data-action="printTracker"], [data-action="openClientDialog"], [data-action="deleteClient"], [data-action="openClientFolderDialog"], [data-action="deleteClientFolder"], [data-action="removeClientFromFolder"], [data-action="deleteGroup"]').forEach((button) => {
    button.hidden = !canManageWorkspace();
  });
  document.querySelectorAll(".side-section-title").forEach((title) => {
    if (title.textContent.trim() === "Perfil" && !canManageWorkspace()) title.hidden = true;
  });
}

function renderUser() {
  const name = state.user?.displayName || state.user?.email?.split("@")[0] || "Usuário";
  const role = `${state.tenantMeta?.name || "Workspace Krio"} · ${accessRoleLabel(currentAccessRole())}`;
  const userBlock = $("#userBlock");
  const avatar = $("#userAvatar");
  const userName = $("#userName");
  const userRole = $("#userRole");
  const userSettingsIcon = $("#userSettingsIcon");
  const canEditProfile = canManageWorkspace();

  if (avatar) {
    avatar.hidden = false;
    avatar.innerHTML = state.user?.photoURL
      ? `<img src="${attr(state.user.photoURL)}" alt="">`
      : initials(name);
  }
  if (userName) {
    userName.hidden = false;
    userName.textContent = name;
  }
  if (userRole) {
    userRole.hidden = false;
    userRole.textContent = role;
  }
  if (userBlock) {
    userBlock.disabled = !canEditProfile;
    userBlock.title = canEditProfile ? "Editar meu perfil" : "Perfil";
    userBlock.setAttribute("aria-label", canEditProfile ? "Editar meu perfil" : "Perfil do usuário");
    if (canEditProfile) {
      userBlock.dataset.action = "openPersonDialog";
      userBlock.dataset.id = currentPersonId();
    } else {
      delete userBlock.dataset.action;
      delete userBlock.dataset.id;
    }
  }
  if (userSettingsIcon) {
    userSettingsIcon.hidden = !canEditProfile;
    userSettingsIcon.innerHTML = icons.settings;
  }
}

function renderShellState() {
  const view = views[state.activeView];
  $("#pageTitle").textContent = view.title;
  $("#pageSubtitle").textContent = view.subtitle;
  document.querySelectorAll(".app-tab").forEach((button) => {
    button.hidden = !canAccessModule(button.dataset.view);
    button.classList.toggle("active", button.dataset.view === state.activeView);
  });
  document.querySelectorAll("[data-module-view]").forEach((viewNode) => {
    viewNode.classList.toggle("active", viewNode.dataset.moduleView === state.activeView);
  });
}

function renderModuleActions() {
  const mount = $("#moduleActions");
  if (!mount) return;

  if (state.activeView === "dashboard") {
    const queue = getApprovalQueueStats();
    mount.innerHTML = `
      <nav class="side-nav" aria-label="Dashboard">
        <div class="side-section-title">Gestor</div>
        <button class="nav-btn active" type="button" data-action="openDashboard">
          <span class="side-icon">${icons.report}</span><span class="side-label">Visão geral</span>
        </button>
        <button class="nav-btn" type="button" data-action="openClientManagement">
          <span class="side-icon">${icons.team}</span><span class="side-label">Gestão de clientes</span>
        </button>
        <button class="nav-btn" type="button" data-action="openBriefingDialog">
          <span class="side-icon">${icons.plus}</span><span class="side-label">Registrar briefing</span>
        </button>
        <div class="side-section-title">Aprovações</div>
        <button class="nav-btn" type="button" data-action="openClientManagement">
          <span class="side-icon">${icons.send}</span><span class="side-label">Links de cliente</span>
          ${queue.clientReview ? `<span class="tracker-head-badge">${queue.clientReview}</span>` : ""}
        </button>
      </nav>`;
    return;
  }

  if (state.activeView === "tracker") {
    const trashCount = visibleTrashItems().length;
    const refactionCount = getRefactionCreatives().length;
    const trackerLinks = [
      canAccessTrackerView("week") ? sideButton("week", "Semana", icons.week, state.trackerView === "week") : "",
      canAccessTrackerView("refaction") ? sideButton("refaction", `Inbox de refação${refactionCount ? `<span class="tracker-head-badge">${refactionCount}</span>` : ""}`, icons.comment, state.trackerView === "refaction") : "",
      canAccessTrackerView("agenda") ? sideButton("agenda", "Agenda", icons.agenda, state.trackerView === "agenda") : "",
      canAccessTrackerView("clients") ? sideButton("clients", "Clientes", icons.team, state.trackerView === "clients") : "",
      canAccessTrackerView("reports") ? sideButton("reports", "Relatórios", icons.report, state.trackerView === "reports") : "",
      canAccessTrackerView("history") ? sideButton("history", "Histórico", icons.history, state.trackerView === "history") : "",
      canAccessTrackerView("team") ? sideButton("team", `Equipe${state.accessRequests.length ? `<span class="tracker-head-badge">${state.accessRequests.length}</span>` : ""}`, icons.team, state.trackerView === "team") : "",
      canAccessTrackerView("trash") ? sideButton("trash", `Lixeira${trashCount ? `<span class="tracker-head-badge">${trashCount}</span>` : ""}`, icons.trash, state.trackerView === "trash") : ""
    ].join("");
    mount.innerHTML = `
      <nav class="side-nav tracker-side-group" aria-label="Tracker">
        <div class="side-section-title">Tracker</div>
        ${trackerLinks}
        ${isCreatorAccessRole() || canManageWorkspace() ? `<button class="tracker-head-btn primary" type="button" data-action="openAddDemand">
          <span class="side-icon">${icons.plus}</span><span class="side-label">Nova demanda</span>
        </button>` : ""}
      </nav>`;
    return;
  }

  if (state.activeView === "operations") {
    mount.innerHTML = `
      <nav class="side-nav" aria-label="Operação">
        <div class="side-section-title">Operação</div>
        <button class="nav-btn active" type="button">
          <span class="side-icon">${icons.report}</span><span class="side-label">Resumo ao vivo</span>
        </button>
      </nav>`;
    return;
  }

  const clients = getClients();
  const folders = getClientFolders();
  const ungroupedClients = getUngroupedClients();
  mount.innerHTML = `
    <nav class="side-nav approval-client-side-nav" aria-label="Clientes">
      <div class="side-section-title">Clientes</div>
      ${folders.map(renderClientFolderNav).join("")}
      ${ungroupedClients.length && folders.length ? `<div class="side-section-title compact">Soltos</div>` : ""}
      ${ungroupedClients.map(renderClientNavButton).join("")}
      ${!clients.length ? `<div class="approval-side-empty">Nenhum cliente cadastrado.</div>` : ""}
      <button class="nav-btn" type="button" data-action="openClientDialog">
        <span class="side-icon">${icons.plus}</span><span class="side-label">Novo cliente</span>
      </button>
    </nav>`;
}

function renderClientFolderNav(folder) {
  const clients = folder.clientIds.map((id) => getClient(id)).filter(Boolean);
  const isOpen = isClientFolderOpen(folder.id) || clients.some((client) => client.id === state.approvalClientId);
  const active = clients.some((client) => client.id === state.approvalClientId);
  return `
    <div class="approval-client-folder ${isOpen ? "open" : ""} ${active ? "active" : ""}" data-client-folder-dropzone="${attr(folder.id)}">
      <button class="nav-btn approval-folder-toggle ${active ? "active" : ""}" type="button" data-client-folder="${attr(folder.id)}" aria-expanded="${isOpen ? "true" : "false"}">
        <span class="side-icon approval-folder-stack">${folderIconMarkup(clients)}</span>
        <span class="side-label">${esc(folder.name)}</span>
        <span class="nav-count">${clients.length}</span>
      </button>
      <div class="approval-folder-actions">
        <button class="krio-icon-btn small" type="button" title="Editar grupo" aria-label="Editar grupo" data-action="openClientFolderDialog" data-id="${attr(folder.id)}">${icons.edit}</button>
        <button class="krio-icon-btn small danger" type="button" title="Excluir grupo" aria-label="Excluir grupo" data-action="deleteClientFolder" data-id="${attr(folder.id)}">${icons.trash}</button>
      </div>
      <div class="approval-folder-children" ${isOpen ? "" : "hidden"}>
        ${clients.map((client) => renderClientNavButton(client, folder.id)).join("") || `<div class="approval-side-empty small">Arraste clientes para este grupo.</div>`}
      </div>
    </div>`;
}

function renderClientNavButton(client, folderId = "") {
  return `
    <button class="nav-btn approval-client-nav ${folderId ? "nested" : ""} ${state.approvalClientId === client.id ? "active" : ""}" type="button" draggable="${canManageWorkspace() ? "true" : "false"}" data-approval-client="${attr(client.id)}" data-client-drag-id="${attr(client.id)}" data-client-drop-target="${attr(client.id)}">
      <span class="side-icon">${clientAvatar(client, "small")}</span>
      <span class="side-label">${esc(client.name)}</span>
      ${folderId ? `<span class="approval-client-unfolder" title="Remover do grupo" aria-label="Remover do grupo" data-action="removeClientFromFolder" data-folder="${attr(folderId)}" data-client="${attr(client.id)}">${icons.close}</span>` : ""}
    </button>`;
}

function folderIconMarkup(clients) {
  const shown = clients.slice(0, 3);
  if (!shown.length) return icons.team;
  return `<span class="approval-folder-mini-stack">${shown.map((client) => clientAvatar(client, "tiny")).join("")}</span>`;
}

function sideButton(view, label, iconMarkup, active) {
  return `
    <button class="tracker-head-btn ${active ? "active" : ""}" type="button" data-tracker-view="${view}">
      <span class="side-icon">${iconMarkup}</span>
      <span class="side-label">${label}</span>
    </button>`;
}

function colorPickerField(label, name, value = "#3B82F6", fieldClass = "tracker-field") {
  const current = value || "#3B82F6";
  const palette = ["#3B82F6", "#34D399", "#A78BFA", "#FBBF24", "#F87171", "#14B8A6", "#F472B6", "#64748B"];
  return `
    <div class="${fieldClass}"><span>${esc(label)}</span>
      <input type="hidden" name="${attr(name)}" value="${attr(current)}" data-color-value="${attr(name)}">
      <div class="krio-color-picker" data-color-picker="${attr(name)}">
        ${palette.map((color) => `
          <button class="krio-color-swatch ${color.toLowerCase() === current.toLowerCase() ? "active" : ""}" type="button" data-action="setColorValue" data-color-input="${attr(name)}" data-color="${attr(color)}" style="--swatch:${attr(color)}" aria-label="Usar cor ${attr(color)}"></button>`).join("")}
        <label class="krio-color-custom-wrap" style="--swatch:${attr(current)}" title="Cor personalizada">
          <input type="color" value="${attr(current)}" data-color-custom="${attr(name)}">
        </label>
      </div>
    </div>`;
}

function setColorValue(button) {
  const name = button.dataset.colorInput || "";
  const color = button.dataset.color || "#3B82F6";
  const form = button.closest("form");
  const input = form?.querySelector(`[data-color-value="${CSS.escape(name)}"]`);
  if (!input) return;
  input.value = color;
  updateColorPickerUi(form, name, color);
}

function updateColorPickerValue(input) {
  const name = input.dataset.colorCustom || "";
  const form = input.closest("form");
  const hidden = form?.querySelector(`[data-color-value="${CSS.escape(name)}"]`);
  if (!hidden) return;
  hidden.value = input.value || "#3B82F6";
  updateColorPickerUi(form, name, hidden.value);
}

function updateColorPickerUi(form, name, color) {
  const picker = form?.querySelector(`[data-color-picker="${CSS.escape(name)}"]`);
  if (!picker) return;
  picker.querySelectorAll(".krio-color-swatch").forEach((swatch) => {
    swatch.classList.toggle("active", swatch.dataset.color?.toLowerCase() === color.toLowerCase());
  });
  const custom = picker.querySelector(".krio-color-custom-wrap");
  if (custom) custom.style.setProperty("--swatch", color);
  const native = picker.querySelector("[data-color-custom]");
  if (native) native.value = color;
}

function renderTopbarActions() {
  const mount = $("#topbarActions");
  if (!mount) return;
  const license = currentPlan();
  const planButton = canManageWorkspace()
    ? `<button class="shell-btn" type="button" title="Licença e acesso" data-action="openPlanDialog">${esc(license.name)}</button>`
    : "";

  if (state.activeView === "tracker" || isOperationsAccessRole()) {
    mount.innerHTML = `${planButton}`;
    return;
  }

  if (state.activeView === "approval") {
    mount.innerHTML = `${planButton}`;
    return;
  }

  mount.innerHTML = `${planButton}<button class="topbar-action-btn" type="button" title="Sincronizar" aria-label="Sincronizar" data-action="syncNow">${icons.sync}</button>`;
}

function renderDashboard() {
  const mount = $("#dashboardModuleMount");
  if (!mount || !state.data) return;
  if (!canAccessModule("dashboard")) {
    mount.innerHTML = "";
    return;
  }

  if (isCreatorAccessRole()) {
    mount.innerHTML = renderCreatorDashboard();
    return;
  }

  const week = currentWeek();
  const creatorWeekRefs = getCreatorWeekDemandRefs(week);
  const weekStats = getWeekStats(week, creatorWeekRefs);
  const queue = getApprovalQueueStats();
  const clients = getClients();
  const refactions = getRefactionCreatives();
  const upcoming = creatorWeekRefs
    .filter(({ demand }) => !demand.done)
    .sort((a, b) => String(a.demand.dueDate || "9999").localeCompare(String(b.demand.dueDate || "9999")))
    .slice(0, 5);

  mount.innerHTML = `
    <section class="krio-dashboard">
      <header class="dashboard-hero">
        <div>
          <div class="dashboard-eyebrow">Dashboard geral</div>
          <h1>${esc(state.tenantMeta?.name || "Workspace Krio")}</h1>
          <p>Visão executiva das demandas, aprovações e gargalos ativos.</p>
        </div>
        <div class="dashboard-actions">
          <button class="krio-btn" type="button" data-action="openClientManagement">${icons.team} Gestão de clientes</button>
          <button class="krio-btn primary" type="button" data-action="openBriefingDialog">${icons.plus} Registrar briefing</button>
        </div>
      </header>

      <div class="dashboard-kpis">
        ${dashboardKpi(weekStats.total, "Demandas na semana", `${weekStats.pending} pendentes`)}
        ${dashboardKpi(`${weekStats.progress}%`, "Progresso", `${weekStats.done} concluídas`)}
        ${dashboardKpi(queue.internalApproved, "A enviar ao cliente", "Aprovadas internamente")}
        ${dashboardKpi(queue.clientReview, "No quadro do cliente", "Aguardando retorno")}
        ${dashboardKpi(refactions.length, "Refações", "Precisam de ajuste")}
      </div>

      <div class="dashboard-grid">
        <section class="dashboard-panel">
          <div class="dashboard-panel-head">
            <div><h2>Fila de aprovação</h2><p>Onde cada peça está agora.</p></div>
            <button class="krio-btn small" type="button" data-action="openApprovalModule">Abrir aprovação</button>
          </div>
          <div class="dashboard-status-list">
            ${approvalStatusTabs.map((tab) => {
              const value = queue[tab.id] || 0;
              return `
                <article class="dashboard-status-row">
                  <span class="approval-status ${attr(tab.id)}">${value}</span>
                  <div><strong>${esc(tab.label)}</strong><small>${esc(approvalStatuses[tab.id] || "")}</small></div>
                </article>`;
            }).join("")}
          </div>
        </section>

        <section class="dashboard-panel">
          <div class="dashboard-panel-head">
            <div><h2>Próximas entregas</h2><p>Demandas pendentes ordenadas por prazo.</p></div>
            <button class="krio-btn small" type="button" data-action="openAddDemand">${icons.plus} Demanda</button>
          </div>
          <div class="dashboard-list">
            ${upcoming.map(({ demand, person }) => `
              <article class="dashboard-demand-row">
                <span class="ops-avatar" style="width:32px;height:32px;background:${attr(person.color)}">${initials(person.name)}</span>
                <div>
                  <strong>${esc(demand.title)}</strong>
                  <small>${esc(demand.client || "Sem cliente")} ${demand.dueDate ? `- ${esc(formatDate(demand.dueDate))}` : ""}</small>
                </div>
              </article>`).join("") || `<div class="approval-empty">Nenhuma demanda pendente nesta semana.</div>`}
          </div>
        </section>
      </div>

      <section class="dashboard-panel">
        <div class="dashboard-panel-head">
          <div><h2>Clientes</h2><p>${clients.length} cliente(s) com portal e peças cadastradas.</p></div>
          <button class="krio-btn small" type="button" data-action="openClientDialog">${icons.plus} Novo cliente</button>
        </div>
        <div class="client-management-grid compact">
          ${clients.slice(0, 6).map(renderClientManagementCard).join("") || `<div class="approval-empty">Cadastre o primeiro cliente para gerar o portal de aprovação.</div>`}
        </div>
      </section>
    </section>`;
}

function renderCreatorDashboard() {
  const person = getProfile(currentPersonId()) || { name: state.user?.displayName || "Criador", color: "#3B82F6" };
  const week = currentWeek();
  const refs = getAllDemandRefs().filter(({ personId }) => personId === person.id);
  const weekRefs = getWeekDemandRefs(week).filter(({ personId }) => personId === person.id);
  const stats = getWeekStats(week, weekRefs);
  const upcoming = weekRefs
    .filter(({ demand }) => !demand.done)
    .sort((a, b) => String(a.demand.dueDate || "9999").localeCompare(String(b.demand.dueDate || "9999")))
    .slice(0, 5);
  const demandMix = demandTypes.map((type) => ({
    ...type,
    total: weekRefs.filter(({ demand }) => demand.type === type.id).length
  })).filter((type) => type.total > 0);

  return `
    <section class="krio-dashboard creator-dashboard">
      <header class="dashboard-hero">
        <div>
          <div class="dashboard-eyebrow">Meu dashboard</div>
          <h1>${esc(person.name)}</h1>
          <p>Prioridades, entregas e tempo registrado no seu fluxo de produção.</p>
        </div>
        <div class="dashboard-actions">
          <button class="krio-btn" type="button" data-action="openTracker">Abrir meu Tracker</button>
          <button class="krio-btn primary" type="button" data-action="openAddDemand">${icons.plus} Nova demanda</button>
        </div>
      </header>

      <div class="dashboard-kpis">
        ${dashboardKpi(stats.total, "Demandas na semana", `${stats.pending} pendentes`) }
        ${dashboardKpi(`${stats.progress}%`, "Progresso", `${stats.done} concluídas`) }
        ${dashboardKpi(formatDuration(stats.minutes), "Tempo registrado", "Nesta semana") }
        ${dashboardKpi(weekRefs.filter(({ demand }) => isOverdue(demand)).length, "Em atraso", "Precisam de atenção") }
        ${dashboardKpi(refs.filter(({ demand }) => !demand.done).length, "Backlog pessoal", "Demandas abertas") }
      </div>

      <div class="dashboard-grid">
        <section class="dashboard-panel">
          <div class="dashboard-panel-head">
            <div><h2>Próximas entregas</h2><p>Demandas abertas ordenadas por prazo.</p></div>
            <button class="krio-btn small" type="button" data-action="openTracker">Ver Tracker</button>
          </div>
          <div class="dashboard-list">
            ${upcoming.map(({ demand }) => `
              <article class="dashboard-demand-row">
                <span class="ops-avatar" style="width:32px;height:32px;background:${attr(person.color)}">${initials(person.name)}</span>
                <div>
                  <strong>${esc(demand.title)}</strong>
                  <small>${esc(demand.client || "Sem cliente")} ${demand.dueDate ? `- ${esc(formatDate(demand.dueDate))}` : ""}</small>
                </div>
              </article>`).join("") || `<div class="approval-empty">Nenhuma demanda pendente nesta semana.</div>`}
          </div>
        </section>

        <section class="dashboard-panel">
          <div class="dashboard-panel-head">
            <div><h2>Distribuição da semana</h2><p>Volume por tipo de demanda.</p></div>
          </div>
          <div class="dashboard-status-list">
            ${demandMix.map((type) => `
              <article class="dashboard-status-row">
                <span class="tracker-type-badge ${attr(type.id)}">${type.total}</span>
                <div><strong>${esc(type.label)}</strong><small>${percent(type.total, weekRefs.length)}% da sua semana</small></div>
              </article>`).join("") || `<div class="approval-empty">Sua semana ainda não tem demandas.</div>`}
          </div>
        </section>
      </div>
    </section>`;
}

function dashboardKpi(value, label, detail) {
  return `<article class="dashboard-kpi"><span>${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(detail)}</small></article>`;
}

function renderTracker() {
  const mount = $("#trackerModuleMount");
  if (!mount || !state.data) return;
  if (!canAccessTrackerView(state.trackerView)) state.trackerView = defaultTrackerView();

  if (state.trackerView === "clients") {
    mount.innerHTML = renderClientManagement();
    return;
  }
  if (state.trackerView === "refaction") {
    mount.innerHTML = renderRefactionInbox();
    return;
  }
  if (state.trackerView === "agenda") {
    mount.innerHTML = renderAgenda();
    return;
  }
  if (state.trackerView === "reports") {
    mount.innerHTML = renderReports();
    return;
  }
  if (state.trackerView === "history") {
    mount.innerHTML = renderHistory();
    return;
  }
  if (state.trackerView === "team") {
    mount.innerHTML = renderTeam();
    return;
  }
  if (state.trackerView === "trash") {
    mount.innerHTML = renderTrash();
    return;
  }

  const week = currentWeek();
  const stats = getWeekStats(week, getCreatorWeekDemandRefs(week).filter(({ personId }) => canViewPerson(personId)));
  const filteredTypes = state.trackerFilter === "all"
    ? demandTypes
    : demandTypes.filter((type) => type.id === state.trackerFilter);

  mount.innerHTML = `
    <section class="krio-tracker">
      <header class="tracker-page-header">
        <div class="tracker-page-header-left">
          <div class="tracker-week-label">${esc(week.title)}</div>
          <h1 class="tracker-page-heading">Semana em <span>movimento</span></h1>
          <p>${esc(formatDate(week.startDate))} até ${esc(formatDate(week.endDate))}</p>
        </div>
        <div class="tracker-page-header-right">
          <div class="tracker-week-nav" aria-label="Navegação de semanas">
            <button class="tracker-week-nav-btn" type="button" data-action="prevWeek" ${state.currentWeekIndex <= 0 ? "disabled" : ""}>‹</button>
            <div class="tracker-week-display">${state.currentWeekIndex + 1} de ${state.data.tracker.weeks.length}</div>
            <button class="tracker-week-nav-btn" type="button" data-action="nextWeek" ${state.currentWeekIndex >= state.data.tracker.weeks.length - 1 ? "disabled" : ""}>›</button>
          </div>
          <div class="tracker-week-actions">
            <button class="tracker-week-action" type="button" data-action="newWeek">Nova semana</button>
            <button class="tracker-week-action danger" type="button" data-action="deleteWeek">Excluir semana</button>
          </div>
        </div>
      </header>

      <div class="tracker-stat-strip">
        ${statCard(stats.total, "Demandas")}
        ${statCard(stats.done, "Concluídas")}
        ${statCard(stats.pending, "Pendentes")}
        ${statCard(`${stats.progress}%`, "Progresso")}
        ${statCard(formatDuration(stats.minutes), "Tempo")}
      </div>

      ${stats.overdue ? `<div class="tracker-warning">${stats.overdue} demanda(s) com prazo vencido nesta semana.</div>` : ""}

      <div class="tracker-progress-card tracker-progress-slim">
        <div class="tracker-progress-meta">
          <strong>Entrega semanal</strong>
          <span>${stats.progress}%</span>
        </div>
        <div class="tracker-progress-track"><div style="width:${stats.progress}%"></div></div>
      </div>

      <div class="tracker-tabs" role="tablist" aria-label="Filtro de demandas">
        <button class="tracker-tab ${state.trackerFilter === "all" ? "active" : ""}" type="button" data-action="switchTrackerFilter" data-filter="all">Todas</button>
        ${demandTypes.map((type) => `<button class="tracker-tab ${state.trackerFilter === type.id ? "active" : ""}" type="button" data-action="switchTrackerFilter" data-filter="${type.id}">${type.label}</button>`).join("")}
      </div>

      <div class="tracker-panel">
        <div class="tracker-team-grid">
          ${getVisibleProfiles().map((person) => renderPersonColumn(week, person, filteredTypes)).join("")}
        </div>
      </div>
    </section>`;
}

function renderPersonColumn(week, person, types) {
  const personWeek = ensureWeekPerson(week, person.id);
  const stats = getPersonStats(personWeek);
  const allowedTypes = types.filter((type) => isDemandTypeAssigned(person, type.id) || asArray(personWeek[type.id]).length);

  return `
    <article class="tracker-person-col">
      <header class="tracker-person-head">
        <div class="tracker-person-avatar" style="background:${attr(person.color)}">${initials(person.name)}</div>
        <div class="tracker-person-info">
          <div class="tracker-person-name">${esc(person.name)}</div>
          <div class="tracker-person-role">${esc(person.role || "Equipe")}</div>
          <div class="tracker-person-progress">
            <div class="tracker-person-progress-track"><div style="width:${stats.progress}%"></div></div>
            <div class="tracker-person-progress-text">${stats.done}/${stats.total} concluídas</div>
          </div>
        </div>
      </header>
      ${allowedTypes.map((type) => renderDemandSection(person.id, type, personWeek[type.id] || [], isDemandTypeAssigned(person, type.id))).join("")}
    </article>`;
}

function renderDemandSection(personId, type, demands, canAdd = true) {
  return `
    <section class="tracker-demand-section">
      <div class="tracker-demand-section-title">
        <span>${esc(type.label)}</span>
        <span class="tracker-type-badge ${type.id}">${demands.length}</span>
      </div>
      <div class="tracker-dropzone" data-tracker-dropzone data-person="${attr(personId)}" data-type="${attr(type.id)}">
        ${demands.length ? demands.map((demand) => renderDemandItem(demand, personId, type.id)).join("") : `<div class="tracker-empty-section">Sem demandas por aqui.</div>`}
      </div>
      ${canAdd ? `<div class="tracker-add-demand-wrap">
        <button class="tracker-add-demand-btn" type="button" data-action="openAddDemand" data-person="${attr(personId)}" data-type="${attr(type.id)}">${icons.plus} Adicionar demanda</button>
      </div>` : ""}
    </section>`;
}

function renderDemandItem(demand, personId, typeId) {
  const running = Boolean(demand.runningStartedAt);
  const time = effectiveMinutes(demand);
  const hasTime = Boolean(running || time);
  const timerText = hasTime ? formatClock(effectiveSeconds(demand)) : "";
  const noteLabel = demand.notes ? demand.notes : "Adicionar observação";
  return `
    <article class="tracker-demand-item ${demand.done ? "done" : ""}" draggable="true" data-id="${attr(demand.id)}" data-person="${attr(personId)}" data-type="${attr(typeId)}">
      <span class="tracker-drag-handle">⋮⋮</span>
      <button class="tracker-demand-check ${demand.done ? "checked" : ""}" type="button" aria-label="Alternar conclusão" data-action="toggleDemand" data-id="${attr(demand.id)}"></button>
      <div class="tracker-demand-body">
        <div class="tracker-demand-text">
          ${demand.client ? `<div class="tracker-demand-client-name">${esc(demand.client)}</div>` : ""}
          <div class="tracker-demand-title">${esc(demand.title)}</div>
        </div>
        <div class="tracker-demand-meta">
          ${!demand.done ? `<button class="tracker-timer-btn ${running ? "running" : ""}" type="button" data-action="toggleTimer" data-id="${attr(demand.id)}">${running ? "Pausar" : "Iniciar"}${hasTime ? ` <span class="tracker-timer-separator">·</span><span class="tracker-timer-live" data-live-timer data-id="${attr(demand.id)}" data-format="clock">${esc(timerText)}</span>` : ""}</button>` : ""}
          ${demand.done && time ? `<button class="tracker-demand-time" type="button" title="Editar tempo" data-action="openTimerEdit" data-id="${attr(demand.id)}">${formatDuration(time)}</button>` : ""}
          ${demand.dueDate ? `<span class="tracker-demand-chip ${isOverdue(demand) ? "warn" : ""}">${esc(formatDate(demand.dueDate))}</span>` : ""}
          <button class="tracker-demand-obs ${demand.notes ? "" : "empty"}" type="button" title="${attr(noteLabel)}" data-action="openDemandNote" data-id="${attr(demand.id)}">${icons.comment}${demand.notes ? `<span>${esc(demand.notes)}</span>` : ""}</button>
        </div>
        <div class="tracker-demand-secondary">
          ${!demand.done && hasTime ? `<button class="tracker-timer-btn timer-edit" type="button" title="Editar tempo acumulado" aria-label="Editar tempo acumulado" data-action="openTimerEdit" data-id="${attr(demand.id)}">${icons.edit} Editar tempo</button>` : ""}
          ${!demand.done && hasTime ? `<button class="tracker-timer-btn timer-reset" type="button" title="Zerar timer" aria-label="Zerar timer" data-action="resetTime" data-id="${attr(demand.id)}">${icons.close} Zerar timer</button>` : ""}
          ${demand.done ? `<button class="diff-badge diff-${attr(demand.difficulty || "none")}" type="button" title="Alterar dificuldade" data-action="cycleDifficulty" data-id="${attr(demand.id)}">${difficultyLabel(demand.difficulty || "none")}</button>` : ""}
        </div>
      </div>
      <div class="tracker-demand-actions">
        ${(!demand.done && hasTime) || demand.done ? `<button class="tracker-demand-action-btn" type="button" title="Mais opções" aria-label="Mais opções" data-action="toggleDemandMenu" data-id="${attr(demand.id)}">···</button>` : ""}
        <button class="tracker-demand-action-btn" type="button" title="Editar" data-action="editDemand" data-id="${attr(demand.id)}">${icons.edit}</button>
        <button class="tracker-demand-action-btn danger" type="button" title="Excluir" data-action="deleteDemand" data-id="${attr(demand.id)}">${icons.trash}</button>
      </div>
    </article>`;
}

function renderClientManagement() {
  const clients = getClients();
  const canManageClients = canManageWorkspace();
  return `
    <section class="client-management">
      <header class="tracker-page-header client-management-head">
        <div class="tracker-page-header-left">
          <div class="tracker-week-label">Gestão de clientes</div>
          <h1 class="tracker-page-heading">Portais, briefings e demandas</h1>
          <p>Cadastre clientes, gere links de aprovação e transforme briefing em tarefa para produção.</p>
        </div>
        ${canManageClients ? `<div class="tracker-week-actions">
          <button class="tracker-week-action" type="button" data-action="openBriefingDialog">${icons.plus} Registrar briefing</button>
          <button class="tracker-week-action" type="button" data-action="openClientDialog">${icons.plus} Novo cliente</button>
        </div>` : ""}
      </header>
      <div class="client-management-grid">
        ${clients.map(renderClientManagementCard).join("") || `<div class="approval-empty">Cadastre o primeiro cliente para gerar o portal de aprovação.</div>`}
      </div>
    </section>`;
}

function renderClientManagementCard(client) {
  const creatives = getCreatives(client);
  const counts = countCreativesByStatus(creatives);
  const portalUrl = clientPortalUrl(client);
  const briefings = asArray(client.briefings).slice(-3).reverse();
  return `
    <article class="client-management-card">
      <header>
        ${clientAvatar(client)}
        <div>
          <strong>${esc(client.name)}</strong>
          <span>${esc(client.email || "Sem email de acesso")}</span>
        </div>
      </header>
      <div class="client-management-status">
        <span><b>${counts.clientReview || 0}</b> no cliente</span>
        <span><b>${counts.internalApproved || 0}</b> a enviar</span>
        <span><b>${counts.internalRejected || 0}</b> refação</span>
      </div>
      <label class="approval-field client-management-link">Link do portal
        <input class="krio-input" readonly value="${attr(portalUrl)}" aria-label="Link do portal de ${attr(client.name)}">
      </label>
      <div class="client-management-actions">
        <button class="krio-btn small" type="button" data-action="copyClientPortalLink" data-client="${attr(client.id)}">${icons.send} Copiar link</button>
        ${canManageWorkspace() ? `
          <button class="krio-btn small" type="button" data-action="openBriefingDialog" data-client="${attr(client.id)}">${icons.plus} Briefing</button>
          <button class="krio-icon-btn" type="button" title="Editar cliente" aria-label="Editar cliente" data-action="openClientDialog" data-id="${attr(client.id)}">${icons.edit}</button>` : ""}
      </div>
      <div class="client-briefing-list">
        ${briefings.length ? briefings.map((briefing) => `
          <article>
            <strong>${esc(briefing.title || "Briefing")}</strong>
            <span>${esc(formatDateTime(briefing.createdAt || Date.now()))}</span>
          </article>`).join("") : `<span class="client-briefing-empty">Sem briefings registrados.</span>`}
      </div>
    </article>`;
}

function renderRefactionInbox() {
  const items = getRefactionCreatives();
  return `
    <section class="refaction-inbox">
      <header class="tracker-page-header">
        <div class="tracker-page-header-left">
          <div class="tracker-week-label">Inbox de refação</div>
          <h1 class="tracker-page-heading">Ajustes pendentes</h1>
          <p>Peças reprovadas interna ou externamente, com o último feedback em destaque.</p>
        </div>
      </header>
      <div class="refaction-grid">
        ${items.map(renderRefactionCard).join("") || `<div class="approval-empty">Nenhuma peça em refação agora.</div>`}
      </div>
    </section>`;
}

function renderRefactionCard(item) {
  const creative = item.creative;
  const source = creative.clientRejectedAt ? "Cliente" : "Interno";
  return `
    <article class="refaction-card">
      ${renderCreativeCover(creative)}
      <div class="refaction-card-body">
        <div>
          <span class="approval-status internalRejected">${esc(source)}</span>
          <h3>${esc(creative.title)}</h3>
          <p>${esc(item.client?.name || "Cliente")}</p>
        </div>
        ${creative.revisionAlert ? `<blockquote>${esc(creative.revisionAlert)}</blockquote>` : `<blockquote>Sem comentario registrado.</blockquote>`}
        <div class="refaction-card-actions">
          <button class="krio-btn small" type="button" data-action="openCreativeDetail" data-id="${attr(creative.id)}">Ver detalhe</button>
          <button class="krio-btn small primary" type="button" data-action="markCreativeCorrected" data-id="${attr(creative.id)}">${icons.check} Corrigido</button>
        </div>
      </div>
    </article>`;
}

function renderAgenda() {
  const cursor = parseISODate(state.agendaCursor);
  const label = state.agendaView === "year"
    ? String(cursor.getFullYear())
    : state.agendaView === "month"
      ? formatMonth(cursor)
      : weekRangeLabel(startOfWeek(cursor));
  return `
    <section class="krio-tracker">
      ${trackerSectionHead("Agenda", "Compromissos, prazos e entregas planejados.", canEditAgenda() ? `<button class="krio-btn primary" type="button" data-action="openAgendaEventDialog">${icons.plus} Compromisso</button>` : "")}
      <div class="agenda-controls">
        <div class="agenda-view-toggle">
          <button class="agenda-view-btn ${state.agendaView === "month" ? "active" : ""}" type="button" data-action="setAgendaView" data-view="month">Mês</button>
          <button class="agenda-view-btn ${state.agendaView === "week" ? "active" : ""}" type="button" data-action="setAgendaView" data-view="week">Semana</button>
          <button class="agenda-view-btn ${state.agendaView === "year" ? "active" : ""}" type="button" data-action="setAgendaView" data-view="year">Ano</button>
        </div>
        <div class="agenda-nav">
          <button class="agenda-nav-btn" type="button" data-action="agendaPrev">‹</button>
          <div class="agenda-nav-label">${esc(label)}</div>
          <button class="agenda-nav-btn" type="button" data-action="agendaNext">›</button>
          <button class="agenda-today-btn" type="button" data-action="agendaToday">Hoje</button>
        </div>
      </div>
      ${state.agendaView === "year" ? renderYearAgenda(cursor) : state.agendaView === "month" ? renderMonthAgenda(cursor) : renderWeekAgenda(cursor)}
    </section>`;
}

function renderMonthAgenda(cursor) {
  const headers = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const gridStart = startOfWeek(first);
  const today = isoDate(new Date());
  const events = getAgendaItems();

  let cells = "";
  for (let i = 0; i < 42; i += 1) {
    const day = addDays(gridStart, i);
    const dayIso = isoDate(day);
    const dayEvents = events.filter((item) => item.date === dayIso);
    cells += `
      <div class="agenda-month-cell ${dayIso === today ? "today" : ""} ${day.getMonth() !== cursor.getMonth() ? "other-month" : ""}" ${canEditAgenda() ? `data-action="openAgendaEventDialog" data-date="${attr(dayIso)}"` : ""}>
        <div class="agenda-day-num">${day.getDate()}</div>
        ${dayEvents.slice(0, 3).map(renderAgendaMonthItem).join("")}
        ${dayEvents.length > 3 ? `<div class="agenda-more-pill">+${dayEvents.length - 3}</div>` : ""}
      </div>`;
  }

  return `
    <div class="agenda-month-grid">
      ${headers.map((label) => `<div class="agenda-month-header-cell">${label}</div>`).join("")}
      ${cells}
    </div>`;
}

function renderWeekAgenda(cursor) {
  const start = startOfWeek(cursor);
  const today = isoDate(new Date());
  const events = getAgendaItems();

  return `
    <div class="agenda-week-grid">
      ${Array.from({ length: 7 }, (_, index) => {
        const day = addDays(start, index);
        const dayIso = isoDate(day);
        const dayEvents = events.filter((item) => item.date === dayIso);
        return `
          <div class="agenda-week-col ${dayIso === today ? "today-col" : ""}">
            <div class="agenda-week-col-head" ${canEditAgenda() ? `data-action="openAgendaEventDialog" data-date="${attr(dayIso)}"` : ""}>
              <div class="agenda-week-col-day">${formatWeekday(day)}</div>
              <div class="agenda-week-col-num">${day.getDate()}</div>
            </div>
            <div class="agenda-week-col-body">
              ${dayEvents.length ? dayEvents.map(renderAgendaWeekItem).join("") : canEditAgenda() ? `<button class="agenda-week-empty" type="button" data-action="openAgendaEventDialog" data-date="${attr(dayIso)}">Livre</button>` : `<div class="agenda-week-empty">Livre</div>`}
            </div>
          </div>`;
      }).join("")}
    </div>`;
}

function renderYearAgenda(cursor) {
  const year = cursor.getFullYear();
  const events = getAgendaItems();
  return `
    <div class="agenda-year-grid">
      ${Array.from({ length: 12 }, (_, month) => {
        const monthEvents = events.filter((item) => {
          const date = parseISODate(item.date);
          return date.getFullYear() === year && date.getMonth() === month;
        });
        const monthDate = new Date(year, month, 1);
        return `
          <button class="agenda-year-card" type="button" data-action="setAgendaView" data-view="month" data-agenda-month="${month}">
            <strong>${esc(formatMonth(monthDate).replace(` de ${year}`, ""))}</strong>
            <span>${monthEvents.length} item(ns)</span>
            <small>${monthEvents.slice(0, 2).map((item) => esc(item.title)).join(" · ") || "Sem compromissos"}</small>
          </button>`;
      }).join("")}
    </div>`;
}

function renderAgendaMonthItem(item) {
  const action = item.kind === "demand"
    ? (canManageDemand(item.personId) ? "editDemand" : "")
    : (canEditAgenda() ? "openAgendaEventDialog" : "");
  if (!action) {
    return `<div class="agenda-month-event-pill ${attr(item.type || "meeting")}" title="${attr(item.title)}">${item.time ? `${esc(item.time)} ` : ""}${esc(item.title)}</div>`;
  }
  return `
    <button class="agenda-month-event-pill ${attr(item.type || "meeting")}" type="button" data-action="${action}" data-id="${attr(item.id)}" title="${attr(item.title)}">
      ${item.time ? `${esc(item.time)} ` : ""}${esc(item.title)}
    </button>`;
}

function renderAgendaWeekItem(item) {
  const action = item.kind === "demand"
    ? (canManageDemand(item.personId) ? "editDemand" : "")
    : (canEditAgenda() ? "openAgendaEventDialog" : "");
  if (!action) {
    return `<div class="agenda-week-event ${attr(item.type || "meeting")}">
      <div class="agenda-week-event-time">${esc(item.time || item.client || item.label || "Compromisso")}</div>
      <div class="agenda-week-event-title">${esc(item.title)}</div>
    </div>`;
  }
  return `
    <button class="agenda-week-event ${attr(item.type || "meeting")}" type="button" data-action="${action}" data-id="${attr(item.id)}">
      <div class="agenda-week-event-time">${esc(item.time || item.client || item.label || "Compromisso")}</div>
      <div class="agenda-week-event-title">${esc(item.title)}</div>
    </button>`;
}

function getAgendaItems() {
  const demandItems = getVisibleDemandRefs()
    .filter(({ demand }) => demand.dueDate)
    .map(({ demand, person }) => ({
      kind: "demand",
      id: demand.id,
      title: demand.title,
      date: demand.dueDate,
      time: "",
      type: demand.type || "mensal",
      client: demand.client || "",
      label: person.name,
      personId: person.id
    }));
  const eventItems = normalizeAgendaEvents(state.data?.tracker?.events || []).map((event) => ({
    ...event,
    kind: "event"
  }));
  return [...demandItems, ...eventItems].sort((a, b) => `${a.date}T${a.time || "00:00"}`.localeCompare(`${b.date}T${b.time || "00:00"}`));
}

function renderReports() {
  const all = getCreatorDemandRefs();
  const week = currentWeek();
  const weekRefs = getCreatorWeekDemandRefs(week);
  const done = all.filter(({ demand }) => demand.done).length;
  const minutes = all.reduce((sum, { demand }) => sum + effectiveMinutes(demand), 0);
  const byType = demandTypes.map((type) => ({
    ...type,
    total: all.filter(({ demand }) => demand.type === type.id).length
  }));

  return `
    <section class="krio-tracker">
      ${trackerSectionHead("Relatórios", "Visualização em HTML, impressão paisagem e exportação adaptadas para o KRIO.", `
        <div class="tracker-toolbar">
          <button class="krio-btn" type="button" data-action="openReportPreview">${icons.report} Ver HTML</button>
          <button class="krio-btn" type="button" data-action="downloadReportHtml">${icons.sync} Baixar HTML</button>
          <button class="krio-btn primary" type="button" data-action="printTracker">${icons.print} Imprimir</button>
        </div>`)}
      <div class="tracker-report-preview-card">
        <div>
          <span>Relatório da semana</span>
          <strong>${esc(week.title)}</strong>
          <p>${weekRefs.length} demanda(s), ${getCreatorProfiles().length} pessoa(s), ${formatDuration(weekRefs.reduce((sum, { demand }) => sum + effectiveMinutes(demand), 0))} registrados.</p>
        </div>
        <button class="krio-btn primary" type="button" data-action="openReportPreview">Abrir prévia</button>
      </div>
      <div class="tracker-report-grid">
        ${statReport("Total de demandas", all.length, "Toda a base ativa")}
        ${statReport("Concluídas", done, `${percent(done, all.length)}% de conclusão`)}
        ${statReport("Tempo registrado", formatDuration(minutes), "Timer acumulado")}
        ${statReport("Em atraso", all.filter(({ demand }) => isOverdue(demand)).length, "Itens pendentes vencidos")}
      </div>
      <div class="tracker-section-head">
        <div><h3>Distribuição por tipo</h3><p>Ajuda a enxergar onde a equipe está concentrando energia.</p></div>
      </div>
      <div class="tracker-list">
        ${byType.map((type) => `
          <div class="tracker-report-card">
            <div><strong>${esc(type.label)}</strong><span>${type.total} demanda(s)</span></div>
            <span class="tracker-type-badge ${type.id}">${percent(type.total, all.length)}%</span>
          </div>`).join("")}
      </div>
    </section>`;
}

function statReport(title, value, label) {
  return `<div class="tracker-report-card"><div><strong>${esc(title)}</strong><span>${esc(label)}</span></div><div class="tracker-history-stat">${esc(value)}</div></div>`;
}

function renderHistory() {
  const weeks = state.data.tracker.weeks;
  return `
    <section class="krio-tracker">
      ${trackerSectionHead("Histórico", "Semanas registradas e entregas finalizadas.")}
      <div>
        ${weeks.map((week, index) => {
          const stats = getWeekStats(week, getCreatorWeekDemandRefs(week));
          return `
            <article class="history-week">
              <button class="history-week-header" type="button" data-action="noop">
                <span class="history-week-title">${esc(week.title)}</span>
                <span class="history-week-stats">
                  <span class="hw-stat"><span class="dot dot-done"></span>${stats.done}</span>
                  <span class="hw-stat"><span class="dot dot-pend"></span>${stats.pending}</span>
                  <span class="hw-stat">${stats.progress}%</span>
                </span>
              </button>
              <div class="history-week-body open">
                ${getCreatorWeekDemandRefs(week).length ? getCreatorWeekDemandRefs(week).map(({ demand, person }) => `
                  <div class="history-item">
                    <span class="history-done-dot" style="background:${demand.done ? "var(--green)" : "var(--muted-2)"}"></span>
                    <span class="history-person-tag">${esc(person.name)}</span>
                    <span>${esc(demand.title)}</span>
                  </div>`).join("") : `<div class="tracker-empty">Semana sem demandas.</div>`}
              </div>
            </article>`;
        }).join("")}
      </div>
    </section>`;
}

function renderTeam() {
  if (!canManageWorkspace()) return `<section class="krio-tracker"><div class="tracker-empty">Acesso restrito ao administrador.</div></section>`;
  const pendingRequests = state.accessRequests;
  const workspaceName = state.data?.meta?.name || state.tenantMeta?.name || "Workspace Krio";
  const workspacePanel = `
    <form id="workspaceForm" class="team-workspace-card">
      <div class="team-workspace-copy">
        <span>Workspace</span>
        <strong>Nome exibido no app</strong>
        <small>Este nome aparece na sidebar, no perfil e nos convites enviados para a equipe.</small>
      </div>
      <div class="team-workspace-actions">
        <input class="team-workspace-input" name="workspaceName" value="${attr(workspaceName)}" maxlength="80" required aria-label="Nome do workspace">
        <button class="krio-btn small primary" type="submit">Salvar</button>
      </div>
    </form>`;
  const inviteCode = normalizeInviteCode(state.data?.meta?.inviteCode || "");
  const inviteLink = workspaceInviteLink();
  const invitePanel = inviteCode ? `
    <div class="team-invite-card">
      <div class="team-invite-copy">
        <span>Convite do workspace</span>
        <strong>${esc(workspaceName)}</strong>
        <small>Envie este link para qualquer colaborador, mesmo com Gmail pessoal.</small>
      </div>
      <div class="team-invite-actions">
        <input class="team-invite-input" value="${attr(inviteLink)}" readonly aria-label="Link de convite">
        <button class="krio-btn small primary" type="button" data-action="copyInviteLink">Copiar link</button>
      </div>
    </div>` : `
    <div class="team-invite-card">
      <div class="team-invite-copy">
        <span>Convite do workspace</span>
        <strong>Gerando convite...</strong>
        <small>Atualize a tela em instantes caso o codigo ainda nao apareca.</small>
      </div>
    </div>`;
  const accessQueue = pendingRequests.length ? `
    <div class="tracker-list team-assignment-list team-access-list">
      ${pendingRequests.map((request) => `
        <div class="tracker-profile-item team-assignment-card team-access-request">
          <div class="tracker-profile-left">
            <span class="tracker-profile-dot" style="background:#FBBF24"></span>
            <div><strong>${esc(request.userName || request.email || "Solicitação")}</strong><span>${esc(request.email || "")} · ${esc(roleRequestLabel(request.role || "member"))}</span></div>
          </div>
          <div class="tracker-toolbar">
            <button class="krio-btn small primary" type="button" data-action="approveAccessRequest" data-uid="${attr(request.uid)}">Aprovar</button>
            <button class="krio-btn small danger" type="button" data-action="rejectAccessRequest" data-uid="${attr(request.uid)}">Recusar</button>
          </div>
        </div>`).join("")}
    </div>` : `
    <div class="team-access-empty">
      <strong>Nenhuma solicitação pendente</strong>
      <span>Quando um colaborador usar o link de convite do workspace, o pedido aparece aqui.</span>
    </div>`;
  return `
    <section class="krio-tracker">
      ${trackerSectionHead("Equipe", "Perfis, acesso e tarefas atribuídas para cada colaborador.", `<button class="krio-btn primary" type="button" data-action="openPersonDialog">${icons.plus} Pessoa</button>`)}
      <div class="team-access-panel">
        <div class="team-access-head">
          <div>
            <strong>Solicitações de acesso</strong>
            <span>Fila de colaboradores aguardando liberação.</span>
          </div>
          <span class="team-access-count">${pendingRequests.length}</span>
        </div>
        ${workspacePanel}
        ${invitePanel}
        ${accessQueue}
      </div>
      <div class="tracker-list team-assignment-list">
        ${getProfiles().map((person) => `
          <div class="tracker-profile-item team-assignment-card">
            <div class="tracker-profile-left">
              <span class="tracker-profile-dot" style="background:${attr(person.color)}"></span>
              <div><strong>${esc(person.name)}</strong><span>${esc(person.role || "Equipe")} · ${esc(accessRoleLabel(person.accessRole || "member"))}</span></div>
            </div>
            <div class="team-assignment-types">
              <span class="team-assignment-label">Tarefas atribuídas</span>
              <div class="team-assignment-toggle-row">
                ${renderAssignedTypeToggles(person)}
              </div>
            </div>
            <div class="tracker-toolbar">
              <button class="krio-btn small" type="button" data-action="openPersonDialog" data-id="${attr(person.id)}">Editar</button>
              <button class="krio-btn small danger" type="button" data-action="deletePerson" data-id="${attr(person.id)}">Remover</button>
            </div>
          </div>`).join("")}
      </div>
    </section>`;
}

function renderAssignedTypeToggles(person) {
  return demandTypes.map((type) => {
    const enabled = isDemandTypeAssigned(person, type.id);
    return `
      <button class="team-type-toggle ${enabled ? "active" : ""} ${attr(type.id)}" type="button" data-action="togglePersonDemandType" data-person="${attr(person.id)}" data-type="${attr(type.id)}" aria-pressed="${enabled ? "true" : "false"}">
        <span class="team-type-toggle-label">${esc(type.label)}</span>
        <span class="team-type-switch" aria-hidden="true"><span></span></span>
        <span class="team-type-state" data-toggle-state>${enabled ? "On" : "Off"}</span>
      </button>`;
  }).join("");
}

function renderTrash() {
  expireTrashQuarantine();
  const trash = visibleTrashItems();
  return `
    <section class="krio-tracker">
      ${trackerSectionHead("Lixeira", "Demandas e semanas removidas ficam em quarentena antes da limpeza definitiva.", trash.length ? `<button class="krio-btn danger" type="button" data-action="purgeTrash">Limpar</button>` : "")}
      <div class="tracker-list">
        ${trash.length ? trash.map((item) => `
          <div class="tracker-trash-item">
            <div>
              <strong>${esc(item.title)}</strong>
              <span>${item.kind === "week" ? "Semana" : "Demanda"} removida em ${esc(formatDateTime(item.deletedAt))}${item.quarantineUntil ? ` · quarentena até ${esc(formatDateTime(item.quarantineUntil))}` : ""}</span>
            </div>
            <div class="tracker-toolbar">
              <button class="krio-btn small" type="button" data-action="${item.kind === "week" ? "restoreWeek" : "restoreDemand"}" data-id="${attr(item.id)}">Restaurar</button>
              <button class="krio-btn small danger" type="button" data-action="deleteTrashItem" data-id="${attr(item.id)}">Excluir</button>
            </div>
          </div>`).join("") : `<div class="tracker-empty">Nada na lixeira.</div>`}
      </div>
    </section>`;
}

function renderOperations() {
  const mount = $("#operationsModuleMount");
  if (!mount || !state.data) return;
  if (!canAccessModule("operations")) {
    mount.innerHTML = "";
    return;
  }

  const week = currentWeek();
  const all = getCreatorWeekDemandRefs(week);
  const stats = getWeekStats(week, all);
  const live = all.filter(({ demand }) => demand.runningStartedAt);
  const people = getCreatorProfiles().map((person) => {
    const personDemands = all.filter((ref) => ref.person.id === person.id);
    const done = personDemands.filter((ref) => ref.demand.done).length;
    return {
      ...person,
      total: personDemands.length,
      done,
      progress: percent(done, personDemands.length),
      minutes: personDemands.reduce((sum, ref) => sum + effectiveMinutes(ref.demand), 0)
    };
  });
  const typeMax = Math.max(1, ...demandTypes.map((type) => all.filter(({ demand }) => demand.type === type.id).length));

  mount.innerHTML = `
    <section class="krio-operations">
      <header class="ops-hero">
        <div>
          <div class="ops-eyebrow">Operação ao vivo</div>
          <h2>${esc(week.title)}</h2>
          <p>${stats.total ? "Acompanhamento de entregas, timers e gargalos da semana." : "Sem demandas nesta semana ainda."}</p>
        </div>
        <div class="ops-hero-status">
          <span class="ops-pill live">${live.length ? `${live.length} timer(s) ativo(s)` : "Sincronizado"}</span>
          <span class="ops-updated">Atualizado agora</span>
        </div>
      </header>

      <div class="ops-kpis">
        ${opsKpi(stats.total, "Demandas", `${stats.pending} pendentes`)}
        ${opsKpi(`${stats.progress}%`, "Progresso", `${stats.done} concluídas`, "green")}
        ${opsKpi(formatDuration(stats.minutes), "Tempo", "Registrado")}
        ${opsKpi(stats.overdue, "Atrasos", "Prazos vencidos", stats.overdue ? "orange" : "")}
        ${opsKpi(live.length, "Timers", "Ativos agora", live.length ? "orange" : "green")}
      </div>

      <div class="ops-progress-card">
        <div class="ops-progress-meta"><span>Saúde da semana</span><strong>${stats.progress}%</strong></div>
        <div class="ops-progress-track"><div style="width:${stats.progress}%"></div></div>
      </div>

      ${live.length ? `
        <section class="ops-live">
          <div class="ops-section-head"><div><h3>Em execução</h3><p>Timers abertos neste momento.</p></div><span class="ops-pill live">Live</span></div>
          <div class="ops-live-grid">
            ${live.map(({ demand, person }) => `
              <article class="ops-live-card">
                <div class="ops-live-person"><span class="ops-avatar" style="width:28px;height:28px;background:${attr(person.color)}">${initials(person.name)}</span>${esc(person.name)}</div>
                <p>${esc(demand.title)}</p>
                <div class="ops-live-foot">
                  <span class="ops-client">${esc(demand.client || "Sem cliente")}</span>
                  <span class="ops-live-time" data-live-timer data-id="${attr(demand.id)}" data-format="clock">${esc(formatClock(effectiveSeconds(demand)))}</span>
                </div>
              </article>`).join("")}
          </div>
        </section>` : ""}

      <div class="ops-grid three">
        <section class="ops-card">
          <div class="ops-section-head"><div><h3>Equipe</h3><p>Volume e progresso por pessoa.</p></div></div>
          <div class="ops-list">
            ${people.map((person) => `
              <article class="ops-person-row">
                <span class="ops-avatar" style="width:34px;height:34px;background:${attr(person.color)}">${initials(person.name)}</span>
                <div class="ops-person-main">
                  <div class="ops-row-title"><strong>${esc(person.name)}</strong><span>${person.done}/${person.total}</span></div>
                  <div class="ops-mini-track"><div style="width:${person.progress}%"></div></div>
                </div>
                <span class="ops-percent">${person.progress}%</span>
              </article>`).join("")}
          </div>
        </section>

        <section class="ops-card">
          <div class="ops-section-head"><div><h3>Distribuição</h3><p>Demandas por tipo.</p></div></div>
          <div class="ops-bars">
            ${demandTypes.map((type) => {
              const total = all.filter(({ demand }) => demand.type === type.id).length;
              return `
                <div class="ops-bar-row">
                  <span>${esc(type.label)}</span>
                  <div class="ops-bar-track"><div style="width:${percent(total, typeMax)}%"></div></div>
                  <strong>${total}</strong>
                </div>`;
            }).join("")}
          </div>
        </section>

        <section class="ops-card">
          <div class="ops-section-head"><div><h3>Nível de dificuldade</h3><p>Leitura rápida dos pontos que podem travar a semana.</p></div></div>
          <div class="ops-difficulty-list">
            ${["none", "some", "hard"].map((level) => {
              const total = all.filter(({ demand }) => (demand.difficulty || "none") === level).length;
              return `
                <article class="ops-difficulty-row ${attr(level)}">
                  <span>${esc(difficultyLabel(level))}</span>
                  <strong>${total}</strong>
                </article>`;
            }).join("")}
          </div>
        </section>
      </div>

      <div class="ops-grid two">
        <section class="ops-card">
          <div class="ops-section-head"><div><h3>Próximas entregas</h3><p>Itens pendentes ordenados por prazo.</p></div></div>
          <div class="ops-list">
            ${all.filter(({ demand }) => !demand.done).sort((a, b) => String(a.demand.dueDate || "9999").localeCompare(String(b.demand.dueDate || "9999"))).slice(0, 6).map(({ demand, person }) => `
              <article class="ops-demand-row">
                <span class="ops-dot ${demand.runningStartedAt ? "running" : ""}"></span>
                <div><p>${esc(demand.title)}</p><div class="ops-demand-meta"><span>${esc(person.name)}</span>${demand.dueDate ? `<span>${esc(formatDate(demand.dueDate))}</span>` : ""}</div></div>
              </article>`).join("") || `<div class="ops-empty">Sem pendências.</div>`}
          </div>
        </section>

        <section class="ops-card">
          <div class="ops-section-head"><div><h3>Atividade recente</h3><p>Últimas demandas concluídas.</p></div></div>
          <div class="ops-list">
            ${all.filter(({ demand }) => demand.done).sort((a, b) => (b.demand.completedAt || 0) - (a.demand.completedAt || 0)).slice(0, 6).map(({ demand, person }) => `
              <article class="ops-activity-row">
                <span class="ops-activity-icon done">${icons.check}</span>
                <div><p><span>${esc(person.name)}</span> concluiu ${esc(demand.title)}</p><span>${esc(formatDateTime(demand.completedAt))}</span></div>
              </article>`).join("") || `<div class="ops-empty">Ainda não há entregas concluídas.</div>`}
          </div>
        </section>
      </div>
    </section>`;
}

function opsKpi(value, label, detail, extraClass = "") {
  return `<div class="ops-kpi ${extraClass}"><span>${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(detail)}</small></div>`;
}

function renderApproval() {
  const mount = $("#approvalModuleMount");
  if (!mount || !state.data) return;

  syncPostedCreatives();

  const clients = getClients();
  const selected = state.approvalClientId ? getClient(state.approvalClientId) : null;

  if (!selected) {
    const totalCreatives = clients.reduce((sum, client) => sum + getCreatives(client).length, 0);
    mount.innerHTML = `
      <section class="krio-approval">
        <header class="approval-hero">
          <div>
            <div class="approval-eyebrow">Clientes</div>
            <h2>Clientes e peças</h2>
            <p>${clients.length} cliente(s), ${totalCreatives} peça(s) em acompanhamento.</p>
          </div>
          <button class="krio-btn primary" type="button" data-action="openClientDialog">${icons.plus} Novo cliente</button>
        </header>
        <div class="approval-client-grid">
          ${clients.map(renderClientCard).join("")}
          <button class="approval-add-card" type="button" data-action="openClientDialog"><strong>+</strong><span>Novo cliente</span></button>
        </div>
      </section>`;
    return;
  }

  const activeStatus = approvalStatuses[state.approvalStatus] ? state.approvalStatus : "prov";
  state.approvalStatus = activeStatus;
  const groups = getApprovalGroups(selected);
  const creatives = getCreatives(selected);
  const visibleCreatives = creatives.filter((creative) => normalizeApprovalStatus(creative.status) === activeStatus);
  const counts = countCreativesByStatus(creatives);
  const sectionCopy = approvalSectionCopy(activeStatus);

  mount.innerHTML = `
    <section class="krio-approval">
      <header class="approval-panel-head">
        <button class="krio-icon-btn" type="button" title="Voltar" aria-label="Voltar" data-action="backApproval">${icons.back}</button>
        ${clientAvatar(selected)}
        <div class="approval-panel-title">
          <h2>${esc(selected.name)}</h2>
          <p>${groups.length} grupo(s), ${creatives.length} peça(s) cadastrada(s)</p>
        </div>
        <div class="approval-panel-actions">
          <button class="krio-btn" type="button" data-action="openClientDialog" data-id="${attr(selected.id)}">Editar cliente</button>
          <button class="krio-btn" type="button" data-action="openGroupDialog">${icons.plus} Novo grupo</button>
        </div>
      </header>

      <div class="approval-tabs">
        ${approvalStatusTabs.map((tab) => approvalTab(tab.id, tab.label, counts[tab.id] || 0)).join("")}
      </div>

      <section class="approval-panel">
        <div class="approval-section-head">
          <div>
            <h3>${esc(sectionCopy.title)}</h3>
            <p>${esc(sectionCopy.text)}</p>
          </div>
          ${activeStatus === "prov" ? `<button class="krio-btn" type="button" data-action="openGroupDialog">${icons.plus} Novo grupo</button>` : ""}
        </div>
        ${renderApprovalStatusView(activeStatus, selected, groups, visibleCreatives)}
      </section>
    </section>`;
}

function renderClientPortal() {
  const mount = $("#approvalModuleMount");
  if (!mount || !state.data) return;
  document.querySelectorAll("[data-module-view]").forEach((viewNode) => {
    viewNode.classList.toggle("active", viewNode.dataset.moduleView === "approval");
  });
  const title = $("#pageTitle");
  const subtitle = $("#pageSubtitle");
  if (title) title.textContent = "Portal do cliente";
  if (subtitle) subtitle.textContent = "";

  const client = getClient(state.approvalClientId) || getClients()[0];
  if (!client) {
    mount.innerHTML = `<section class="client-portal"><div class="approval-empty">Link de aprovação sem peças disponíveis.</div></section>`;
    return;
  }
  state.approvalClientId = client.id;
  syncPostedCreatives();
  const creatives = getCreatives(client);
  const pending = creatives.filter((creative) => normalizeApprovalStatus(creative.status) === "clientReview");
  const history = creatives.filter((creative) => ["scheduled", "posted", "internalRejected"].includes(normalizeApprovalStatus(creative.status)) && (creative.clientApprovedAt || creative.clientRejectedAt || creative.postedAt));

  mount.innerHTML = `
    <section class="client-portal">
      <header class="client-portal-hero">
        <div>
          <span>${esc(state.portalIndex?.workspaceName || state.tenantMeta?.name || "Krio")}</span>
          <h1>${esc(client.name)}</h1>
          <p>${pending.length ? `${pending.length} peça(s) aguardando revisão.` : "Nenhuma peça aguardando revisão."}</p>
        </div>
        ${clientAvatar(client, "client-portal-logo")}
      </header>

      <section class="client-portal-section">
        <div class="approval-section-head">
          <div>
            <h3>Pendentes de revisão</h3>
            <p>Aprove ou solicite ajuste com comentário obrigatório.</p>
          </div>
        </div>
        ${renderClientApprovalBoard(pending, client)}
      </section>

      <section class="client-portal-section">
        <div class="approval-section-head">
          <div>
            <h3>Histórico</h3>
            <p>Peças aprovadas, ajustadas ou publicadas.</p>
          </div>
        </div>
        ${renderClientPortalHistory(history, client)}
      </section>
    </section>`;
}

function renderClientPortalHistory(creatives, client) {
  return renderGroupedCreativeBoard(
    creatives,
    client,
    (creative) => renderCreativeCard(creative, creative.groupId, true, `<span class="approval-status ${attr(normalizeApprovalStatus(creative.status))}">${esc(clientPortalHistoryLabel(creative))}</span>`),
    `<div class="approval-empty">Nenhum historico ainda.</div>`,
    "client-board"
  );
}

function clientPortalHistoryLabel(creative) {
  if (creative.clientRejectedAt) return "Ajuste solicitado";
  if (creative.postedAt || normalizeApprovalStatus(creative.status) === "posted") return "Publicado";
  if (creative.clientApprovedAt || normalizeApprovalStatus(creative.status) === "scheduled") return "Aprovado";
  return approvalStatuses[normalizeApprovalStatus(creative.status)] || "Histórico";
}

function renderClientCard(client) {
  const creatives = getCreatives(client);
  const counts = countCreativesByStatus(creatives);
  return `
    <article class="approval-client-card" role="button" tabindex="0" data-approval-client="${attr(client.id)}">
      ${clientAvatar(client)}
      <div class="approval-client-main">
        <strong>${esc(client.name)}</strong>
        <span>${esc(client.email || `${getApprovalGroups(client).length} grupo(s)`)}</span>
      </div>
      <div class="approval-client-actions">
        <button class="krio-icon-btn" type="button" title="Editar cliente" aria-label="Editar cliente" data-action="openClientDialog" data-id="${attr(client.id)}">${icons.edit}</button>
        <button class="krio-icon-btn danger" type="button" title="Excluir cliente" aria-label="Excluir cliente" data-action="deleteClient" data-id="${attr(client.id)}">${icons.trash}</button>
      </div>
      <div class="approval-status-row">
        <span class="approval-status prov">${counts.prov}</span>
        <span class="approval-status internalApproved">${counts.internalApproved}</span>
        <span class="approval-status internalRejected">${counts.internalRejected}</span>
        <span class="approval-status clientReview">${counts.clientReview}</span>
        <span class="approval-status scheduled">${counts.scheduled}</span>
        <span class="approval-status posted">${counts.posted}</span>
      </div>
    </article>`;
}

function approvalTab(status, label, count) {
  return `<button class="approval-tab ${state.approvalStatus === status ? "active" : ""}" type="button" data-action="setApprovalStatus" data-status="${status}">${esc(label)} <span>${count}</span></button>`;
}

function clientAvatar(client, extraClass = "") {
  const logo = client?.logoUrl || "";
  return `
    <span class="approval-client-avatar ${extraClass}" style="background:${attr(client?.color || "#3B82F6")}">
      ${logo ? `<img src="${attr(logo)}" alt="Logo ${attr(client?.name || "cliente")}">` : initials(client?.name || "K")}
    </span>`;
}

function approvalSectionCopy(status) {
  return {
    prov: {
      title: "Grupos",
      text: "Edite nomes direto no quadro. Arraste grupos ou cards para reorganizar."
    },
    internalApproved: {
      title: "Aprovadas internamente",
      text: "Peças prontas para enviar ao quadro do cliente."
    },
    internalRejected: {
      title: "Reprovadas internamente",
      text: "Peças que precisam de correção antes de voltar ao provisório."
    },
    clientReview: {
      title: "Quadro do cliente",
      text: "Área de revisão com aprovação ou pedido obrigatório de ajuste."
    },
    scheduled: {
      title: "Agendamento",
      text: "Defina data e ordem de publicação. Após a data, a peça entra em Postados."
    },
    posted: {
      title: "Postados",
      text: "Histórico de criativos já publicados."
    }
  }[status] || { title: "Clientes", text: "Acompanhe o fluxo das peças." };
}

function renderApprovalStatusView(status, client, groups, creatives) {
  if (status === "prov") return renderApprovalKanban(client, groups);
  if (status === "clientReview") return renderClientApprovalBoard(creatives, client);
  if (status === "scheduled") return renderScheduleBoard(creatives, client);
  return renderApprovalFlatGrid(creatives, status, client);
}

function renderApprovalKanban(client, groups) {
  if (!groups.length) {
    return `
      <div class="approval-empty">
        Crie o primeiro grupo para começar o quadro de aprovação.
        <div style="margin-top:12px"><button class="krio-btn primary" type="button" data-action="openGroupDialog">${icons.plus} Novo grupo</button></div>
      </div>`;
  }

  return `<div class="approval-kanban" data-approval-group-board>${groups.map((group) => renderApprovalGroupColumn(group, client.id)).join("")}</div>`;
}

function renderApprovalGroupColumn(group, clientId) {
  const cards = getGroupCards(group).filter((creative) => normalizeApprovalStatus(creative.status) === "prov");
  return `
    <article class="approval-kanban-column" draggable="true" data-approval-group="${attr(group.id)}">
      <div class="approval-kanban-head">
        <div>
          <input class="approval-inline-title" data-approval-inline="groupName" data-id="${attr(group.id)}" data-original-value="${attr(group.name || "Grupo")}" value="${attr(group.name || "Grupo")}" aria-label="Nome do grupo">
          <span>${cards.length} card(s)</span>
        </div>
        <div class="approval-inline-actions">
          <button class="krio-icon-btn" type="button" title="Editar grupo" aria-label="Editar grupo" data-action="openGroupDialog" data-id="${attr(group.id)}">${icons.edit}</button>
          <button class="krio-icon-btn danger" type="button" title="Excluir grupo" aria-label="Excluir grupo" data-action="deleteGroup" data-id="${attr(group.id)}">${icons.trash}</button>
        </div>
      </div>
      <div class="approval-kanban-list" data-approval-dropzone="${attr(group.id)}">
        ${cards.map((creative) => renderCreativeCard(creative, group.id)).join("")}
        <button class="approval-add-card-row" type="button" data-action="openCreativeDialog" data-group="${attr(group.id)}">${icons.plus} Adicionar um card</button>
      </div>
    </article>`;
}

function renderApprovalFlatGrid(creatives, status, client = getClient(state.approvalClientId)) {
  return renderGroupedCreativeBoard(
    creatives,
    client,
    (creative) => renderCreativeCard(creative, creative.groupId, true),
    `<div class="approval-empty">Nenhuma peça em ${esc(approvalStatuses[status].toLowerCase())}.</div>`
  );
}

function renderClientApprovalBoard(creatives, client) {
  return renderGroupedCreativeBoard(
    creatives,
    client,
    (creative) => renderCreativeCard(creative, creative.groupId, true, `
        <button class="krio-btn primary" type="button" data-action="clientApproveCreative" data-id="${attr(creative.id)}">${icons.check} Aprovar</button>
        <button class="krio-btn danger" type="button" data-action="openClientRejectionDialog" data-id="${attr(creative.id)}">Solicitar ajuste</button>
      `),
    `<div class="approval-empty">Nenhuma peça enviada para ${esc(client.name)} ainda.</div>`,
    "client-board"
  );
}

function renderGroupedCreativeBoard(creatives, client, cardRenderer, emptyMarkup, extraClass = "") {
  if (!creatives.length) return emptyMarkup;
  const groups = getApprovalGroups(client);
  const grouped = groups
    .map((group) => ({
      group,
      cards: creatives.filter((creative) => creative.groupId === group.id)
    }))
    .filter((item) => item.cards.length);

  return `
    <div class="approval-grouped-board ${extraClass}">
      ${grouped.map(({ group, cards }) => `
        <section class="approval-flow-group-card" data-approval-flow-group="${attr(group.id)}">
          <header class="approval-flow-group-head">
            <div>
              <strong>${esc(group.name || "Grupo")}</strong>
              <span>${cards.length} peça(s)</span>
            </div>
            <span class="approval-flow-group-chip">Grupo</span>
          </header>
          <div class="approval-card-grid flat">
            ${cards.map(cardRenderer).join("")}
          </div>
        </section>`).join("")}
    </div>`;
}

function renderScheduleBoard(creatives, client = getClient(state.approvalClientId)) {
  const sorted = [...creatives].sort((a, b) => {
    const date = scheduleSortKey(a).localeCompare(scheduleSortKey(b));
    if (date !== 0) return date;
    return Number(a.scheduleOrder || 0) - Number(b.scheduleOrder || 0);
  });
  if (!sorted.length) return `<div class="approval-empty">Nenhuma peça aprovada pelo cliente para agendar.</div>`;

  const grouped = getApprovalGroups(client)
    .map((group) => ({
      group,
      cards: sorted.filter((creative) => creative.groupId === group.id)
    }))
    .filter((item) => item.cards.length);

  return `
    <div class="approval-grouped-board schedule-grouped-board">
      ${grouped.map(({ group, cards }) => `
        <section class="approval-flow-group-card schedule-flow-group-card" data-approval-flow-group="${attr(group.id)}">
          <header class="approval-flow-group-head">
            <div>
              <strong>${esc(group.name || "Grupo")}</strong>
              <span>${cards.length} peça(s) em agendamento</span>
            </div>
            <span class="approval-flow-group-chip">Grupo</span>
          </header>
          <div class="approval-card-grid flat schedule-board">
            ${cards.map((creative) => renderCreativeCard(creative, creative.groupId, true, renderScheduleControls(creative))).join("")}
          </div>
        </section>`).join("")}
    </div>`;
}

function renderScheduleControls(creative) {
  return `
    <label class="approval-schedule-field date">Data
      <input class="krio-input" type="date" data-schedule-field="scheduledDate" data-id="${attr(creative.id)}" value="${attr(creative.scheduledDate || "")}">
    </label>
    <label class="approval-schedule-field time">Horário
      <input class="krio-input" type="time" data-schedule-field="scheduledTime" data-id="${attr(creative.id)}" value="${attr(creative.scheduledTime || "")}">
    </label>
    <label class="approval-schedule-field order">Ordem
      <input class="krio-input" type="number" min="0" step="1" data-schedule-field="scheduleOrder" data-id="${attr(creative.id)}" value="${attr(creative.scheduleOrder || 0)}">
    </label>
    <button class="krio-btn schedule-posted-btn" type="button" data-action="markCreativePosted" data-id="${attr(creative.id)}">${icons.calendar} Postado</button>`;
}

function renderCreativeCard(creative, groupId = creative.groupId || "", flat = false, actions = "") {
  const commentCount = asArray(creative.comments).length;
  const status = normalizeApprovalStatus(creative.status);
  const canDrag = status === "prov" && !flat;
  return `
    <article class="approval-creative ${flat ? "flat" : ""} ${attr(status)}${creative.revisionAlert ? " has-revision" : ""}" role="button" tabindex="0" draggable="${canDrag ? "true" : "false"}" data-action="openCreativeDetail" data-id="${attr(creative.id)}" data-group="${attr(groupId)}">
      ${renderCreativeCover(creative)}
      <div class="approval-creative-body">
        <input class="approval-card-title-input" data-approval-inline="creativeTitle" data-id="${attr(creative.id)}" data-original-value="${attr(creative.title || "Sem título")}" value="${attr(creative.title || "Sem título")}" aria-label="Título da peça">
        ${creative.caption ? `<span class="approval-caption">${esc(creative.caption)}</span>` : ""}
        ${creative.groupName && flat ? `<span>${esc(creative.groupName)}</span>` : ""}
        <small>${esc(approvalStatuses[status] || "Provisório")}${commentCount ? ` · ${commentCount} comentário(s)` : ""}</small>
        ${creative.revisionAlert ? `<small class="approval-alert">Refação: ${esc(creative.revisionAlert)}</small>` : ""}
        ${actions ? `<div class="approval-card-actions">${actions}</div>` : ""}
      </div>
    </article>`;
}

function openDemandDialog(id = "", defaults = {}) {
  const existing = id ? findDemand(id)?.demand : null;
  const existingRef = id ? findDemand(id) : null;
  if (existingRef && !canManageDemand(existingRef.personId)) return;
  const week = currentWeek();
  const firstPerson = getVisibleProfiles()[0]?.id || currentPersonId() || getProfiles()[0]?.id || "";
  const selectedPerson = canManageWorkspace()
    ? (existingRef?.personId || (getVisibleProfiles().some((person) => person.id === defaults.personId) ? defaults.personId : firstPerson))
    : currentPersonId();
  const selectedPersonProfile = getProfile(selectedPerson) || getProfiles()[0] || {};
  const availableDemandTypes = getPersonDemandTypes(selectedPersonProfile);
  if (existing?.type && !availableDemandTypes.some((type) => type.id === existing.type)) {
    const legacyType = demandTypes.find((type) => type.id === existing.type);
    if (legacyType) availableDemandTypes.push(legacyType);
  }
  if (!availableDemandTypes.length && !existing) {
    $("#trackerDialogHost").innerHTML = `
      <div class="tracker-dialog-backdrop" data-dialog-backdrop>
        <div class="tracker-dialog tracker-dialog-compact" role="dialog" aria-modal="true">
          <div class="tracker-dialog-head">
            <strong>Sem tarefas atribuídas</strong>
            <button class="krio-icon-btn" type="button" data-action="closeDialog" aria-label="Fechar">${icons.close}</button>
          </div>
          <p class="tracker-dialog-copy">Ative pelo menos um tipo de tarefa para este membro na aba Equipe.</p>
          <div class="tracker-dialog-actions"><button class="krio-btn primary" type="button" data-action="closeDialog">Entendi</button></div>
        </div>
      </div>`;
    return;
  }
  const selectedType = existing?.type || (availableDemandTypes.some((type) => type.id === defaults.type) ? defaults.type : availableDemandTypes[0]?.id) || "mensal";
  const clientOptions = getClients()
    .map((client) => `<option value="${attr(client.name)}" label="${attr(client.email || client.name)}"></option>`)
    .join("");

  $("#trackerDialogHost").innerHTML = `
    <div class="tracker-dialog-backdrop" data-dialog-backdrop>
      <div class="tracker-dialog" role="dialog" aria-modal="true" aria-labelledby="demandDialogTitle">
        <div class="tracker-dialog-head">
          <strong id="demandDialogTitle">${existing ? "Editar demanda" : "Nova demanda"}</strong>
          <button class="krio-icon-btn" type="button" data-action="closeDialog" aria-label="Fechar">${icons.close}</button>
        </div>
        <form id="demandForm" class="tracker-form" data-id="${attr(id)}">
          <label class="tracker-field">Título
            <input class="krio-input" name="title" required value="${attr(existing?.title || "")}" placeholder="Ex: Criar carrossel institucional">
          </label>
          <div class="form-row">
            <label class="tracker-field">Responsável
              <select class="krio-input" name="personId">${getVisibleProfiles().map((person) => `<option value="${attr(person.id)}" ${person.id === selectedPerson ? "selected" : ""}>${esc(person.name)}</option>`).join("")}</select>
            </label>
            <label class="tracker-field">Tipo
              <select class="krio-input" name="type">${availableDemandTypes.map((type) => `<option value="${type.id}" ${type.id === selectedType ? "selected" : ""}>${type.label}</option>`).join("")}</select>
            </label>
          </div>
          <div class="form-row">
            <label class="tracker-field">Cliente
              <input class="krio-input" name="client" list="demandClientOptions" value="${attr(existing?.client || "")}" placeholder="Digite ou selecione um cliente">
              <datalist id="demandClientOptions">${clientOptions}</datalist>
            </label>
            <label class="tracker-field">Prazo
              <input class="krio-input" name="dueDate" type="date" value="${attr(existing?.dueDate || "")}">
            </label>
          </div>
          ${existing ? `
            <div class="form-row">
              <label class="tracker-field">Tempo registrado (min)
                <input class="krio-input" name="timeMinutes" type="number" min="0" step="1" value="${attr(existing?.timeMinutes || 0)}">
              </label>
              <label class="tracker-field">Dificuldade
                <select class="krio-input" name="difficulty">
                  ${["none", "some", "hard"].map((value) => `<option value="${value}" ${value === (existing?.difficulty || "none") ? "selected" : ""}>${difficultyLabel(value)}</option>`).join("")}
                </select>
              </label>
            </div>
            <label class="tracker-field">Observações
              <textarea class="tracker-textarea" name="notes" placeholder="Dificuldade, dependência ou ponto de atenção">${esc(existing?.notes || "")}</textarea>
            </label>` : ""}
          <p class="tracker-dialog-copy">Semana: ${esc(week.title)}</p>
          <div class="tracker-dialog-actions">
            ${existing ? `<button class="krio-btn danger" type="button" data-action="deleteDemand" data-id="${attr(id)}">Excluir</button>` : ""}
            <button class="krio-btn" type="button" data-action="closeDialog">Cancelar</button>
            <button class="krio-btn primary" type="submit">Salvar</button>
          </div>
        </form>
      </div>
    </div>`;
}

function saveDemandForm(form) {
  const formData = new FormData(form);
  const id = form.dataset.id || "";
  if (!id && !withinPlanLimit("demands")) {
    openPlanDialog("Você atingiu o limite configurado para esta licença.");
    return;
  }
  const requestedPersonId = String(formData.get("personId") || "");
  const personId = canManageWorkspace() ? requestedPersonId : currentPersonId();
  if (!personId || !isCreatorProfile(getProfile(personId)) || !canManageDemand(personId)) return;
  const requestedType = String(formData.get("type") || "mensal");
  const allowedTypes = getPersonDemandTypes(getProfile(personId) || {});
  if (!allowedTypes.length && !id) return;
  const type = allowedTypes.some((candidate) => candidate.id === requestedType)
    ? requestedType
    : id && demandTypes.some((candidate) => candidate.id === requestedType)
      ? requestedType
      : allowedTypes[0]?.id || "mensal";
  const payload = {
    id: id || newId("dem"),
    title: String(formData.get("title") || "").trim(),
    client: String(formData.get("client") || "").trim(),
    type,
    dueDate: String(formData.get("dueDate") || ""),
    estimateMinutes: 0,
    difficulty: String(formData.get("difficulty") || "none"),
    notes: String(formData.get("notes") || "").trim(),
    done: false,
    timeMinutes: Number(formData.get("timeMinutes") || 0),
    createdAt: Date.now()
  };

  if (!payload.title) return;

  const existing = id ? findDemand(id) : null;
  if (existing) {
    if (!canManageDemand(existing.personId)) return;
    Object.assign(payload, {
      done: existing.demand.done,
      timeMinutes: Number(formData.get("timeMinutes") || existing.demand.timeMinutes || 0),
      runningStartedAt: existing.demand.runningStartedAt || null,
      createdAt: existing.demand.createdAt || Date.now(),
      completedAt: existing.demand.completedAt || null
    });
    removeDemandFromWeek(existing.week, existing.personId, existing.type, id);
  }

  const week = currentWeek();
  ensureWeekPerson(week, personId);
  week.people[personId][type].push(payload);
  closeDialogs();
  saveAndRender();
}

function openBriefingDialog(clientId = "") {
  const clients = getClients();
  if (!clients.length) {
    openClientDialog();
    return;
  }
  const selectedClientId = clientId || state.approvalClientId || clients[0]?.id || "";
  const selectedPerson = getVisibleProfiles()[0]?.id || "";
  const selectedProfile = getProfile(selectedPerson) || {};
  const availableTypes = getPersonDemandTypes(selectedProfile);
  $("#trackerDialogHost").innerHTML = `
    <div class="tracker-dialog-backdrop" data-dialog-backdrop>
      <div class="tracker-dialog" role="dialog" aria-modal="true" aria-labelledby="briefingDialogTitle">
        <div class="tracker-dialog-head">
          <strong id="briefingDialogTitle">Registrar briefing</strong>
          <button class="krio-icon-btn" type="button" data-action="closeDialog" aria-label="Fechar">${icons.close}</button>
        </div>
        <form id="briefingForm" class="tracker-form">
          <div class="form-row">
            <label class="tracker-field">Cliente
              <select class="krio-input" name="clientId">
                ${clients.map((client) => `<option value="${attr(client.id)}" ${client.id === selectedClientId ? "selected" : ""}>${esc(client.name)}</option>`).join("")}
              </select>
            </label>
            <label class="tracker-field">Responsável
              <select class="krio-input" name="personId">
                ${getVisibleProfiles().map((person) => `<option value="${attr(person.id)}" ${person.id === selectedPerson ? "selected" : ""}>${esc(person.name)}</option>`).join("")}
              </select>
            </label>
          </div>
          <label class="tracker-field">Título da demanda
            <input class="krio-input" name="title" required placeholder="Ex: Campanha de lançamento - posts da semana">
          </label>
          <div class="form-row">
            <label class="tracker-field">Tipo
              <select class="krio-input" name="type">
                ${(availableTypes.length ? availableTypes : demandTypes).map((type) => `<option value="${attr(type.id)}">${esc(type.label)}</option>`).join("")}
              </select>
            </label>
            <label class="tracker-field">Prazo
              <input class="krio-input" name="dueDate" type="date">
            </label>
          </div>
          <label class="tracker-field">Briefing
            <textarea class="tracker-textarea" name="briefing" required placeholder="Objetivo, referências, formatos, canais, restrições e observações do cliente"></textarea>
          </label>
          <div class="tracker-dialog-actions">
            <button class="krio-btn" type="button" data-action="closeDialog">Cancelar</button>
            <button class="krio-btn primary" type="submit">Criar demanda</button>
          </div>
        </form>
      </div>
    </div>`;
}

function saveBriefingForm(form) {
  const formData = new FormData(form);
  const clientId = String(formData.get("clientId") || "");
  const client = getClient(clientId);
  if (!client) return;
  const personId = String(formData.get("personId") || getVisibleProfiles()[0]?.id || "");
  const profile = getProfile(personId) || {};
  if (!personId || !isCreatorProfile(profile) || !canManageWorkspace()) return;
  const allowedTypes = getPersonDemandTypes(profile);
  const requestedType = String(formData.get("type") || "avulso");
  const type = allowedTypes.some((candidate) => candidate.id === requestedType)
    ? requestedType
    : allowedTypes[0]?.id || "avulso";
  const title = String(formData.get("title") || "").trim();
  const briefing = String(formData.get("briefing") || "").trim();
  if (!title || !briefing) return;

  const briefingRecord = {
    id: newId("briefing"),
    title,
    text: briefing,
    personId,
    type,
    dueDate: String(formData.get("dueDate") || ""),
    createdBy: state.user?.uid || "",
    createdAt: Date.now()
  };
  client.briefings = asArray(client.briefings);
  client.briefings.push(briefingRecord);

  const week = currentWeek();
  ensureWeekPerson(week, personId);
  week.people[personId][type].push({
    id: newId("dem"),
    title,
    client: client.name,
    clientId: client.id,
    briefingId: briefingRecord.id,
    type,
    dueDate: briefingRecord.dueDate,
    estimateMinutes: 0,
    difficulty: "none",
    notes: briefing,
    done: false,
    timeMinutes: 0,
    createdAt: Date.now()
  });

  closeDialogs();
  state.activeView = "tracker";
  state.trackerView = "week";
  saveAndRender();
}

function openPersonDialog(id = "") {
  const person = id ? getProfile(id) : null;
  $("#trackerDialogHost").innerHTML = `
    <div class="tracker-dialog-backdrop" data-dialog-backdrop>
      <div class="tracker-dialog" role="dialog" aria-modal="true" aria-labelledby="personDialogTitle">
        <div class="tracker-dialog-head">
          <strong id="personDialogTitle">${person ? "Editar pessoa" : "Nova pessoa"}</strong>
          <button class="krio-icon-btn" type="button" data-action="closeDialog" aria-label="Fechar">${icons.close}</button>
        </div>
        <form id="personForm" class="tracker-form" data-id="${attr(id)}">
          <label class="tracker-field">Nome
            <input class="krio-input" name="name" required value="${attr(person?.name || "")}" placeholder="Nome da pessoa">
          </label>
          <label class="tracker-field">Função de trabalho
            <input class="krio-input" name="role" value="${attr(person?.role || "")}" placeholder="Designer, Editor ou Planejamento">
          </label>
          ${colorPickerField("Cor", "color", person?.color || "#3B82F6", "tracker-field")}
          <div class="tracker-field">Tarefas atribuídas
            <div class="assignment-check-grid">
              ${demandTypes.map((type) => `
                <label class="assignment-check">
                  <input type="checkbox" name="assignedTypes" value="${attr(type.id)}" ${isDemandTypeAssigned(person || {}, type.id) ? "checked" : ""}>
                  <span>${esc(type.label)}</span>
                </label>`).join("")}
            </div>
          </div>
          ${canManageWorkspace() ? `
            <label class="tracker-field">UID de acesso
              <input class="krio-input" name="accessUid" value="${attr(person?.accessUid || (/^person_/.test(person?.id || "") ? "" : person?.id || ""))}" placeholder="UID do login do colaborador">
            </label>
            <label class="tracker-field">Papel no sistema
              <select class="krio-input" name="accessRole">
                ${workspaceAccessRoles.map(({ id: role, label }) => `<option value="${role}" ${role === normalizeAssignableAccessRole(person?.accessRole) ? "selected" : ""}>${esc(label)}</option>`).join("")}
              </select>
            </label>` : ""}
          ${canManageWorkspace() ? `<p class="tracker-dialog-copy">O papel define os módulos visíveis. A função de trabalho identifica quem aparece no Tracker como criador.</p>` : ""}
          <div class="tracker-dialog-actions">
            <button class="krio-btn" type="button" data-action="closeDialog">Cancelar</button>
            <button class="krio-btn primary" type="submit">Salvar</button>
          </div>
        </form>
      </div>
    </div>`;
}

function savePersonForm(form) {
  const formData = new FormData(form);
  const accessUid = String(formData.get("accessUid") || "").trim();
  const id = form.dataset.id || accessUid || newId("person");
  if (!form.dataset.id && !withinPlanLimit("profiles")) {
    openPlanDialog("Você atingiu o limite configurado para esta licença.");
    return;
  }
  const name = String(formData.get("name") || "").trim();
  if (!name) return;
  const existing = state.data.profiles[id] || {};
  const assignedTypes = formData.getAll("assignedTypes").map(String).filter((typeId) => demandTypes.some((type) => type.id === typeId));

  state.data.profiles[id] = {
    id,
    name,
    role: String(formData.get("role") || "Equipe").trim(),
    color: String(formData.get("color") || "#3B82F6"),
    accessUid,
    accessRole: normalizeAssignableAccessRole(String(formData.get("accessRole") || "creator")),
    assignedTypes
  };
  state.data.tracker.weeks.forEach((week) => ensureWeekPerson(week, id));
  if (accessUid && canManageWorkspace()) {
    grantWorkspaceMembership(accessUid, state.data.profiles[id].accessRole);
  }
  closeDialogs();
  saveAndRender();
}

async function saveWorkspaceForm(form) {
  if (!canManageWorkspace()) return;
  const formData = new FormData(form);
  const name = String(formData.get("workspaceName") || "").trim();
  if (!name) return;
  const slug = slugify(name);
  const now = Date.now();
  state.data.meta = {
    ...(state.data.meta || {}),
    name,
    slug,
    updatedAt: now
  };
  state.tenantMeta = state.data.meta;
  state.data.updatedAt = now;
  saveLocalState();
  render();

  if (!state.firebase?.db || state.demoMode || state.tenantId === "local") {
    setSyncState("online", "Nome do workspace salvo localmente");
    return;
  }

  markLocalWrite();
  try {
    const updates = {
      [`tenants/${state.tenantId}/meta/name`]: name,
      [`tenants/${state.tenantId}/meta/slug`]: slug,
      [`tenants/${state.tenantId}/updatedAt`]: now
    };
    const inviteCode = normalizeInviteCode(state.data.meta.inviteCode || "");
    if (inviteCode) {
      updates[`tenantInvites/${inviteCode}/name`] = name;
      updates[`tenantInvites/${inviteCode}/slug`] = slug;
      updates[`tenantInvites/${inviteCode}/updatedAt`] = now;
    }
    await state.firebase.update(state.firebase.ref(state.firebase.db), updates);
    releaseLocalWrite(true);
    setSyncState("online", "Nome do workspace atualizado");
  } catch (error) {
    releaseLocalWrite(false);
    setSyncState("offline", "Nao foi possivel salvar o nome do workspace.");
  }
}

function deletePerson(id) {
  const profiles = getProfiles();
  if (profiles.length <= 1) return;
  const accessUid = state.data.profiles[id]?.accessUid || (/^person_/.test(id) ? "" : id);
  delete state.data.profiles[id];
  state.data.tracker.weeks.forEach((week) => {
    delete week.people[id];
  });
  if (accessUid && canManageWorkspace() && state.firebase?.db && !state.demoMode && state.tenantId !== "local") {
    state.firebase.set(state.firebase.ref(state.firebase.db, `memberships/${accessUid}/${state.tenantId}`), null);
  }
  saveAndRender();
}

function togglePersonDemandType(personId, typeId, button = null) {
  const person = state.data.profiles?.[personId];
  if (!person || !demandTypes.some((type) => type.id === typeId)) return;
  const current = new Set(assignedDemandTypes(person));
  if (current.has(typeId)) {
    current.delete(typeId);
  } else {
    current.add(typeId);
  }
  person.assignedTypes = defaultAssignedDemandTypes().filter((id) => current.has(id));
  const enabled = current.has(typeId);
  if (button) {
    button.classList.toggle("active", enabled);
    button.setAttribute("aria-pressed", String(enabled));
    const stateLabel = button.querySelector("[data-toggle-state]");
    if (stateLabel) stateLabel.textContent = enabled ? "On" : "Off";
  }
  persist();
}

function openClientDialog(id = "") {
  const client = id ? getClient(id) : null;
  $("#approvalDialogHost").innerHTML = `
    <div class="approval-dialog-backdrop" data-dialog-backdrop>
      <div class="approval-dialog" role="dialog" aria-modal="true" aria-labelledby="clientDialogTitle">
        <div class="approval-dialog-head">
          <div><strong id="clientDialogTitle">${client ? "Editar cliente" : "Novo cliente"}</strong><span>Organize as peças por marca.</span></div>
          <button class="krio-icon-btn" type="button" data-action="closeDialog" aria-label="Fechar">${icons.close}</button>
        </div>
        <form id="clientForm" class="approval-form" data-id="${attr(id)}">
          <div class="approval-client-logo-preview">
            ${clientAvatar(client || { name: "Cliente", color: "#3B82F6" })}
            <span>Use um logo para substituir as iniciais do avatar.</span>
          </div>
          <label class="approval-field">Nome
            <input class="krio-input" name="name" required value="${attr(client?.name || "")}" placeholder="Nome do cliente">
          </label>
          <label class="approval-field">Email de acesso
            <input class="krio-input" name="email" type="email" value="${attr(client?.email || "")}" placeholder="cliente@empresa.com">
          </label>
          ${colorPickerField("Cor", "color", client?.color || "#3B82F6", "approval-field")}
          <label class="approval-field">Logo do cliente
            <input class="krio-input" name="logoFile" type="file" accept="image/*">
          </label>
          <div class="approval-dialog-actions">
            ${client ? `<button class="krio-btn danger" type="button" data-action="deleteClient" data-id="${attr(id)}">Excluir</button>` : ""}
            <button class="krio-btn" type="button" data-action="closeDialog">Cancelar</button>
            <button class="krio-btn primary" type="submit">Salvar</button>
          </div>
        </form>
      </div>
    </div>`;
}

async function saveClientForm(form) {
  const formData = new FormData(form);
  const id = form.dataset.id || newId("client");
  if (!form.dataset.id && !withinPlanLimit("clients")) {
    openPlanDialog("Você atingiu o limite configurado para esta licença.");
    return;
  }
  const name = String(formData.get("name") || "").trim();
  if (!name) return;
  const existing = state.data.approval.clients[id] || { groups: {} };
  const logoFile = formData.get("logoFile");
  const logoUrl = logoFile?.size
    ? (await uploadFileToStorage(logoFile, `tenants/${state.tenantId}/clients/${id}/logo_${Date.now()}`) || await fileToDataUrl(logoFile))
    : existing.logoUrl || "";

  state.data.approval.clients[id] = {
    ...existing,
    id,
    name,
    email: String(formData.get("email") || "").trim().toLowerCase(),
    color: String(formData.get("color") || "#3B82F6"),
    logoUrl,
    portalEnabled: true,
    portalCreatedAt: existing.portalCreatedAt || Date.now(),
    portalUpdatedAt: Date.now()
  };
  state.approvalClientId = id;
  state.approvalStatus = "prov";
  closeDialogs();
  saveAndRender();
}

function deleteClient(id) {
  delete state.data.approval.clients[id];
  getClientFolders().forEach((folder) => {
    const stored = getClientFolder(folder.id);
    if (stored) stored.clientIds = uniqueClientIds(stored.clientIds).filter((clientId) => clientId !== id);
  });
  if (state.approvalClientId === id) state.approvalClientId = null;
  removeClientPortalIndex(id);
  closeDialogs();
  saveAndRender();
}

async function removeClientPortalIndex(id) {
  if (!id || !state.firebase?.db || state.demoMode || state.tenantId === "local") return;
  try {
    await state.firebase.set(state.firebase.ref(state.firebase.db, `approvalPortals/${id}`), null);
  } catch {
    setSyncState("offline", "Não foi possível remover o link do portal.");
  }
}
function openClientFolderDialog(id = "") {
  const folder = id ? getClientFolder(id) : null;
  const selected = new Set(uniqueClientIds(folder?.clientIds || []));
  const clients = getClients();
  $("#approvalDialogHost").innerHTML = `
    <div class="approval-dialog-backdrop" data-dialog-backdrop>
      <div class="approval-dialog" role="dialog" aria-modal="true" aria-labelledby="clientFolderDialogTitle">
        <div class="approval-dialog-head">
          <div><strong id="clientFolderDialogTitle">${folder ? "Editar grupo de clientes" : "Novo grupo de clientes"}</strong><span>Organize franquias, unidades ou marcas do mesmo cliente.</span></div>
          <button class="krio-icon-btn" type="button" data-action="closeDialog" aria-label="Fechar">${icons.close}</button>
        </div>
        <form id="clientFolderForm" class="approval-form" data-id="${attr(id)}">
          <label class="approval-field">Nome do grupo
            <input class="krio-input" name="name" required value="${attr(folder?.name || "")}" placeholder="Ex: Rede Norte, Franquias SP...">
          </label>
          <div class="approval-field">
            Clientes dentro do grupo
            <div class="approval-folder-client-list">
              ${clients.length ? clients.map((client) => `
                <label class="approval-folder-client-option">
                  <input type="checkbox" name="clientIds" value="${attr(client.id)}" ${selected.has(client.id) ? "checked" : ""}>
                  ${clientAvatar(client, "small")}
                  <span>${esc(client.name)}</span>
                </label>`).join("") : `<div class="approval-empty small">Cadastre clientes antes de criar grupos.</div>`}
            </div>
          </div>
          <div class="approval-dialog-actions">
            ${folder ? `<button class="krio-btn danger" type="button" data-action="deleteClientFolder" data-id="${attr(id)}">Excluir</button>` : ""}
            <button class="krio-btn" type="button" data-action="closeDialog">Cancelar</button>
            <button class="krio-btn primary" type="submit">Salvar</button>
          </div>
        </form>
      </div>
    </div>`;
}

function saveClientFolderForm(form) {
  const formData = new FormData(form);
  const name = String(formData.get("name") || "").trim();
  if (!name) return;
  const id = form.dataset.id || newId("client_folder");
  const clientIds = uniqueClientIds(formData.getAll("clientIds"));
  state.data.approval.clientFolders ||= {};
  removeClientIdsFromOtherFolders(clientIds, id);
  state.data.approval.clientFolders[id] = {
    ...(state.data.approval.clientFolders[id] || {}),
    id,
    name,
    clientIds,
    createdAt: state.data.approval.clientFolders[id]?.createdAt || Date.now(),
    updatedAt: Date.now()
  };
  state.approvalOpenClientFolders[id] = true;
  closeDialogs();
  saveAndRender();
}

function deleteClientFolder(id) {
  if (!state.data.approval.clientFolders?.[id]) return;
  delete state.data.approval.clientFolders[id];
  delete state.approvalOpenClientFolders[id];
  closeDialogs();
  saveAndRender();
}

function removeClientFromFolder(folderId, clientId) {
  const folder = getClientFolder(folderId);
  if (!folder || !clientId) return;
  folder.clientIds = uniqueClientIds(folder.clientIds).filter((id) => id !== clientId);
  folder.updatedAt = Date.now();
  saveAndRender();
}

function removeClientIdsFromOtherFolders(clientIds, exceptFolderId = "") {
  const ids = new Set(clientIds);
  getClientFolders().forEach((folder) => {
    if (folder.id === exceptFolderId) return;
    const stored = getClientFolder(folder.id);
    if (!stored) return;
    stored.clientIds = uniqueClientIds(stored.clientIds).filter((id) => !ids.has(id));
    stored.updatedAt = Date.now();
  });
}

function findClientFolderByClientId(clientId) {
  return getClientFolders().find((folder) => folder.clientIds.includes(clientId)) || null;
}

function moveClientToFolder(clientId, folderId) {
  const client = getClient(clientId);
  const folder = getClientFolder(folderId);
  if (!client || !folder) return;
  const nextIds = uniqueClientIds([...(folder.clientIds || []), clientId]);
  removeClientIdsFromOtherFolders([clientId], folderId);
  folder.clientIds = nextIds;
  folder.updatedAt = Date.now();
  state.approvalOpenClientFolders[folderId] = true;
  saveAndRender();
}

function createClientFolderFromClients(sourceClientId, targetClientId) {
  if (!sourceClientId || !targetClientId || sourceClientId === targetClientId) return;
  const source = getClient(sourceClientId);
  const target = getClient(targetClientId);
  if (!source || !target) return;

  const targetFolder = findClientFolderByClientId(targetClientId);
  if (targetFolder) {
    moveClientToFolder(sourceClientId, targetFolder.id);
    return;
  }

  const id = newId("client_folder");
  const name = `Grupo ${target.name}`;
  const clientIds = uniqueClientIds([targetClientId, sourceClientId]);
  state.data.approval.clientFolders ||= {};
  removeClientIdsFromOtherFolders(clientIds);
  state.data.approval.clientFolders[id] = {
    id,
    name,
    clientIds,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  state.approvalOpenClientFolders[id] = true;
  saveAndRender();
}

function openGroupDialog(id = "") {
  const client = getClient(state.approvalClientId);
  if (!client) {
    if (!canManageWorkspace()) return;
    openClientDialog();
    return;
  }

  const group = id ? client.groups?.[id] : null;
  $("#approvalDialogHost").innerHTML = `
    <div class="approval-dialog-backdrop" data-dialog-backdrop>
      <div class="approval-dialog" role="dialog" aria-modal="true" aria-labelledby="groupDialogTitle">
        <div class="approval-dialog-head">
          <div><strong id="groupDialogTitle">${group ? "Renomear grupo" : "Novo grupo"}</strong><span>${esc(client.name)}</span></div>
          <button class="krio-icon-btn" type="button" data-action="closeDialog" aria-label="Fechar">${icons.close}</button>
        </div>
        <form id="groupForm" class="approval-form" data-id="${attr(id)}">
          <label class="approval-field">Nome do grupo
            <input class="krio-input" name="name" required value="${attr(group?.name || "")}" placeholder="Semana 1, Janeiro, Stories...">
          </label>
          <div class="approval-dialog-actions">
            <button class="krio-btn" type="button" data-action="closeDialog">Cancelar</button>
            <button class="krio-btn primary" type="submit">Salvar</button>
          </div>
        </form>
      </div>
    </div>`;
}

function saveGroupForm(form) {
  const client = getClient(state.approvalClientId);
  if (!client) return;

  const name = String(new FormData(form).get("name") || "").trim();
  if (!name) return;

  client.groups ||= {};
  const id = form.dataset.id || newId("group");
  client.groups[id] = {
    ...(client.groups[id] || { cards: {} }),
    id,
    name,
    createdAt: client.groups[id]?.createdAt || Date.now()
  };
  state.approvalStatus = "prov";
  closeDialogs();
  saveAndRender();
}

function deleteGroup(id) {
  const client = getClient(state.approvalClientId);
  if (!client?.groups?.[id]) return;
  delete client.groups[id];
  saveAndRender();
}

function openCreativeDialog(id = "", defaults = {}) {
  let client = getClient(state.approvalClientId);
  if (!client) {
    client = getClients()[0];
    state.approvalClientId = client?.id || null;
  }
  if (!client) {
    openClientDialog();
    return;
  }

  const groups = getApprovalGroups(client);
  if (!groups.length) {
    openGroupDialog();
    return;
  }

  const found = id ? findCreative(id, client) : null;
  const creative = found?.creative || null;
  const selectedGroupId = defaults.groupId || found?.groupId || groups[0]?.id || "";
  const media = creative ? getCreativeMedia(creative) : [];
  const preview = renderCreativeMediaPreview(media);
  const driveUrl = creative?.driveUrl || getCreativeLinks(creative || {})[0]?.url || "";
  $("#approvalDialogHost").innerHTML = `
    <div class="approval-dialog-backdrop" data-dialog-backdrop>
      <div class="approval-dialog" role="dialog" aria-modal="true" aria-labelledby="creativeDialogTitle">
        <div class="approval-dialog-head">
          <div><strong id="creativeDialogTitle">${creative ? "Editar peça" : "Nova peça"}</strong><span>${esc(client.name)}</span></div>
          <button class="krio-icon-btn" type="button" data-action="closeDialog" aria-label="Fechar">${icons.close}</button>
        </div>
        <form id="creativeForm" class="approval-form" data-id="${attr(id)}">
          <label class="approval-field">Título
            <input class="krio-input" name="title" required value="${attr(creative?.title || "")}" placeholder="Ex: Post campanha de lançamento">
          </label>
          <label class="approval-field">Legenda
            <textarea class="approval-textarea" name="caption" placeholder="Legenda do post, se houver">${esc(creative?.caption || "")}</textarea>
          </label>
          <label class="approval-field">Link do Drive/Reels
            <input class="krio-input" name="driveUrl" value="${attr(driveUrl)}" placeholder="https://drive.google.com/...">
          </label>
          <label class="approval-field">Grupo
            <select class="krio-input" name="groupId">
              ${groups.map((group) => `<option value="${attr(group.id)}" ${group.id === selectedGroupId ? "selected" : ""}>${esc(group.name)}</option>`).join("")}
            </select>
          </label>
          <div class="approval-field">
            Imagens
            <div class="approval-upload-zone" data-approval-upload-zone>
              <div id="creativeUploadPreview" class="approval-upload-preview">${preview}</div>
              <input id="creativeImageFile" class="approval-file-input" name="imageFiles" type="file" accept="image/*" multiple>
              <button class="approval-upload-button" type="button" data-action="triggerImageUpload" title="Enviar imagens" aria-label="Enviar imagens">${icons.upload}</button>
            </div>
          </div>
          <div class="approval-dialog-actions">
            <button class="krio-btn" type="button" data-action="closeDialog">Cancelar</button>
            <button class="krio-btn primary" type="submit">Salvar</button>
          </div>
        </form>
      </div>
    </div>`;
}

async function saveCreativeForm(form) {
  const client = getClient(state.approvalClientId);
  if (!client) return;

  const formData = new FormData(form);
  const id = form.dataset.id || newId("creative");
  const title = String(formData.get("title") || "").trim();
  if (!title) return;

  client.groups ||= {};
  const groupId = String(formData.get("groupId") || "");
  const targetGroup = client.groups[groupId];
  if (!targetGroup) return;

  const existing = findCreative(id, client);
  if (existing && existing.groupId !== groupId) {
    delete existing.group.cards[id];
  }

  const imageFiles = formData.getAll("imageFiles").filter((file) => file?.size && file.type?.startsWith("image/"));
  const uploadedMedia = await Promise.all(imageFiles.map(async (file, index) => {
    const storagePath = `tenants/${state.tenantId}/creatives/${id}/media_${Date.now()}_${index}`;
    const storageUrl = await uploadFileToStorage(file, storagePath);
    const url = storageUrl || await fileToDataUrl(file, { outputType: "image/jpeg", quality: 0.78, maxSide: 1440, background: "#ffffff" });
    return { id: newId("media"), type: "image", url, label: file.name || `Imagem ${index + 1}`, createdAt: Date.now() };
  }));
  const driveUrl = String(formData.get("driveUrl") || "").trim();
  const existingMedia = existing?.creative ? getCreativeMedia(existing.creative) : [];
  const existingLink = existingMedia.find((item) => item.type === "link");
  const linkMedia = driveUrl
    ? [{
      id: existingLink?.id || newId("media"),
      type: "link",
      url: driveUrl,
      label: "Drive/Reels",
      createdAt: existingLink?.createdAt || Date.now()
    }]
    : [];
  const media = [
    ...existingMedia.filter((item) => item.type === "image"),
    ...uploadedMedia.filter((item) => item.url),
    ...linkMedia
  ];
  const firstImage = media.find((item) => item.type === "image")?.url || "";
  targetGroup.cards ||= {};
  targetGroup.cards[id] = {
    ...(existing?.creative || { comments: [] }),
    id,
    title,
    caption: String(formData.get("caption") || "").trim(),
    status: normalizeApprovalStatus(existing?.creative?.status || "prov"),
    media,
    imageUrl: firstImage,
    driveUrl,
    groupId,
    createdAt: existing?.creative?.createdAt || Date.now(),
    updatedAt: Date.now()
  };
  state.approvalStatus = targetGroup.cards[id].status || "prov";
  closeDialogs();
  saveAndRender();
}

function openCreativeDetail(id) {
  const found = findCreative(id);
  const creative = found?.creative;
  if (!creative) return;
  state.approvalClientId = found.client?.id || state.approvalClientId;
  const status = normalizeApprovalStatus(creative.status);

  $("#approvalDialogHost").innerHTML = `
    <div class="approval-dialog-backdrop" data-dialog-backdrop>
      <div class="approval-detail" role="dialog" aria-modal="true" aria-labelledby="creativeDetailTitle">
        <div class="approval-dialog-head">
          <div><strong id="creativeDetailTitle">${esc(creative.title)}</strong><span>${esc(found.group?.name || "Grupo")} · ${esc(approvalStatuses[status] || "Provisório")}</span></div>
          <button class="krio-icon-btn" type="button" data-action="closeDialog" aria-label="Fechar">${icons.close}</button>
        </div>
        ${renderCreativeMediaDetail(creative)}
        <div class="approval-status-actions">
          ${renderCreativeDetailActions(found)}
        </div>
        ${creative.caption ? `<div class="approval-caption-block"><strong>Legenda</strong><p>${esc(creative.caption)}</p></div>` : ""}
        <div class="approval-dialog-copy">Status atual: <strong>${esc(approvalStatuses[status])}</strong>${creative.revisionAlert ? `<br>Refação: ${esc(creative.revisionAlert)}` : ""}</div>
        <section class="approval-comments">
          <h3>Comentários</h3>
          <div class="approval-comment-list">
            ${asArray(creative.comments).map((comment) => `
              <article class="approval-comment">
                <strong>${esc(comment.author || "Equipe")}</strong>
                <p>${esc(comment.text)}</p>
                <span>${esc(formatDateTime(comment.createdAt))}</span>
              </article>`).join("") || `<div class="approval-empty small">Sem comentários ainda.</div>`}
          </div>
          <form id="commentForm" class="approval-comment-form" data-id="${attr(id)}">
            <input class="krio-input" name="comment" required placeholder="Adicionar comentário">
            <button class="krio-btn primary" type="submit">Enviar</button>
          </form>
        </section>
      </div>
    </div>`;
}

function renderCreativeDetailActions(found) {
  const creative = found.creative;
  const id = creative.id;
  const clientName = found.client?.name || "cliente";
  const status = normalizeApprovalStatus(creative.status);
  const canManage = canManageWorkspace() && !isClientPortalRoute();

  if (status === "prov") {
    if (!canManage) return `<span class="approval-status prov">${esc(approvalStatuses[status])}</span>`;
    return `
      <button class="krio-btn primary" type="button" data-action="setCreativeStatus" data-id="${attr(id)}" data-status="internalApproved">${icons.check} Aprovado internamente</button>
      <button class="krio-btn danger" type="button" data-action="openInternalRejectionDialog" data-id="${attr(id)}">Solicitar refação</button>
      <button class="krio-icon-btn" type="button" title="Editar" aria-label="Editar" data-action="openCreativeDialog" data-id="${attr(id)}">${icons.edit}</button>
      <button class="krio-icon-btn danger" type="button" title="Excluir" aria-label="Excluir" data-action="deleteCreative" data-id="${attr(id)}">${icons.trash}</button>`;
  }

  if (status === "internalApproved") {
    if (!canManage) return `<span class="approval-status internalApproved">${esc(approvalStatuses[status])}</span>`;
    return `
      <button class="krio-btn primary" type="button" data-action="sendToClientBoard" data-id="${attr(id)}">${icons.send} Mandar para quadro do cliente: ${esc(clientName)}</button>
      <button class="krio-icon-btn" type="button" title="Editar mídia" aria-label="Editar mídia" data-action="openCreativeDialog" data-id="${attr(id)}">${icons.edit}</button>`;
  }

  if (status === "internalRejected") {
    if (!canManage) {
      return `<button class="krio-btn primary" type="button" data-action="markCreativeCorrected" data-id="${attr(id)}">${icons.check} Corrigido</button>`;
    }
    return `
      <button class="krio-btn primary" type="button" data-action="markCreativeCorrected" data-id="${attr(id)}">${icons.check} Corrigido</button>
      <button class="krio-icon-btn" type="button" title="Editar" aria-label="Editar" data-action="openCreativeDialog" data-id="${attr(id)}">${icons.edit}</button>
      <button class="krio-icon-btn danger" type="button" title="Excluir" aria-label="Excluir" data-action="deleteCreative" data-id="${attr(id)}">${icons.trash}</button>`;
  }

  if (status === "clientReview") {
    return `<span class="approval-status clientReview">Aguardando ${esc(clientName)}</span>`;
  }

  if (status === "scheduled") {
    if (!canManage) return `<span class="approval-status scheduled">${esc(clientPortalHistoryLabel(creative))}</span>`;
    return `
      <button class="krio-btn" type="button" data-action="markCreativePosted" data-id="${attr(id)}">${icons.calendar} Marcar como postado</button>
      <button class="krio-icon-btn" type="button" title="Editar mídia" aria-label="Editar mídia" data-action="openCreativeDialog" data-id="${attr(id)}">${icons.edit}</button>`;
  }

  return `<span class="approval-status posted">Histórico</span>`;
}

function saveCommentForm(form) {
  const found = findCreative(form.dataset.id);
  if (!found?.creative) return;
  const text = String(new FormData(form).get("comment") || "").trim();
  if (!text) return;
  const creative = found.creative;
  creative.comments ||= [];
  creative.comments.push({
    id: newId("comment"),
    author: isClientPortalRoute() ? (found.client?.name || "Cliente") : (state.user?.displayName || "Equipe"),
    text,
    createdAt: Date.now()
  });
  if (canManageWorkspace() && !isClientPortalRoute()) {
    persist();
  } else {
    persistCreativeCard(found);
  }
  openCreativeDetail(creative.id);
  if (isClientPortalRoute()) renderClientPortal();
  else renderApproval();
}

function openInternalRejectionDialog(id) {
  const found = findCreative(id);
  if (!found?.creative) return;
  $("#approvalDialogHost").innerHTML = `
    <div class="approval-dialog-backdrop" data-dialog-backdrop>
      <div class="approval-dialog" role="dialog" aria-modal="true" aria-labelledby="internalRejectionTitle">
        <div class="approval-dialog-head">
          <div><strong id="internalRejectionTitle">Solicitar refação</strong><span>${esc(found.client?.name || "Cliente")}</span></div>
          <button class="krio-icon-btn" type="button" data-action="closeDialog" aria-label="Fechar">${icons.close}</button>
        </div>
        <form id="internalRejectionForm" class="approval-form" data-id="${attr(id)}">
          <label class="approval-field">Feedback obrigatório
            <textarea class="approval-textarea" name="comment" required placeholder="Descreva o ajuste necessário antes de enviar ao cliente"></textarea>
          </label>
          <div class="approval-dialog-actions">
            <button class="krio-btn" type="button" data-action="closeDialog">Cancelar</button>
            <button class="krio-btn danger" type="submit">Enviar para refação</button>
          </div>
        </form>
      </div>
    </div>`;
}

function saveInternalRejectionForm(form) {
  const found = findCreative(form.dataset.id);
  const creative = found?.creative;
  if (!creative) return;
  const text = String(new FormData(form).get("comment") || "").trim();
  if (!text) return;
  creative.status = "internalRejected";
  creative.revisionAlert = text;
  creative.revisionSource = "internal";
  creative.internalRejectedAt = Date.now();
  creative.updatedAt = Date.now();
  creative.comments ||= [];
  creative.comments.push({
    id: newId("comment"),
    author: state.user?.displayName || "Equipe",
    text,
    createdAt: Date.now()
  });
  state.approvalStatus = "internalRejected";
  closeDialogs();
  saveAndRender();
}

function setCreativeStatus(id, status) {
  const found = findCreative(id);
  const creative = found?.creative;
  if (!creative) return;
  const nextStatus = normalizeApprovalStatus(status);
  if (!approvalStatuses[nextStatus]) return;
  creative.status = nextStatus;
  if (nextStatus === "internalApproved") {
    creative.internalApprovedAt = Date.now();
    creative.revisionAlert = "";
  }
  if (nextStatus === "internalRejected") {
    creative.internalRejectedAt = Date.now();
    creative.revisionSource = "internal";
  }
  creative.updatedAt = Date.now();
  state.approvalStatus = nextStatus || "prov";
  closeDialogs();
  saveAndRender();
}

function sendToClientBoard(id) {
  const found = findCreative(id);
  const creative = found?.creative;
  if (!creative) return;
  creative.status = "clientReview";
  creative.sentToClientAt = Date.now();
  creative.updatedAt = Date.now();
  state.approvalStatus = "clientReview";
  closeDialogs();
  saveAndRender();
}

function completeCreativeMutation(found, nextStatus = "") {
  state.approvalStatus = nextStatus || normalizeApprovalStatus(found?.creative?.status || "prov");
  closeDialogs();
  if (canManageWorkspace() && !isClientPortalRoute()) {
    saveAndRender();
    return;
  }
  persistCreativeCard(found);
  render();
}

async function persistCreativeCard(found) {
  if (!found?.client?.id || !found.groupId || !found?.creative?.id) return;
  markLocalWrite();
  saveLocalState();
  if (!state.firebase?.db || state.demoMode || state.tenantId === "local") {
    releaseLocalWrite(true);
    setSyncState("online", "Alteracao salva localmente");
    return;
  }
  try {
    const path = `tenants/${state.tenantId}/approval/clients/${found.client.id}/groups/${found.groupId}/cards/${found.creative.id}`;
    await state.firebase.set(state.firebase.ref(state.firebase.db, path), JSON.parse(JSON.stringify(found.creative)));
    releaseLocalWrite(true);
    setSyncState("online", "Sincronizado");
  } catch (error) {
    releaseLocalWrite(false);
    setSyncState("offline", "Falha ao sincronizar a peça.");
  }
}

function clientApproveCreative(id) {
  const found = findCreative(id);
  const creative = found?.creative;
  if (!creative) return;
  creative.status = "scheduled";
  creative.clientApprovedAt = Date.now();
  creative.revisionAlert = "";
  creative.updatedAt = Date.now();
  completeCreativeMutation(found, "scheduled");
}

function openClientRejectionDialog(id) {
  const found = findCreative(id);
  if (!found?.creative) return;
  $("#approvalDialogHost").innerHTML = `
    <div class="approval-dialog-backdrop" data-dialog-backdrop>
      <div class="approval-dialog" role="dialog" aria-modal="true" aria-labelledby="clientRejectionTitle">
        <div class="approval-dialog-head">
          <div><strong id="clientRejectionTitle">Pedido de ajuste</strong><span>${esc(found.client?.name || "Cliente")}</span></div>
          <button class="krio-icon-btn" type="button" data-action="closeDialog" aria-label="Fechar">${icons.close}</button>
        </div>
        <form id="clientRejectionForm" class="approval-form" data-id="${attr(id)}">
          <label class="approval-field">Comentário obrigatório
            <textarea class="approval-textarea" name="comment" required placeholder="Explique o que precisa ser alterado"></textarea>
          </label>
          <div class="approval-dialog-actions">
            <button class="krio-btn" type="button" data-action="closeDialog">Cancelar</button>
            <button class="krio-btn danger" type="submit">Enviar reprovação</button>
          </div>
        </form>
      </div>
    </div>`;
}

function saveClientRejectionForm(form) {
  const found = findCreative(form.dataset.id);
  const creative = found?.creative;
  if (!creative) return;
  const text = String(new FormData(form).get("comment") || "").trim();
  if (!text) return;
  creative.status = "internalRejected";
  creative.revisionAlert = text;
  creative.revisionSource = "client";
  creative.clientRejectedAt = Date.now();
  creative.internalRejectedAt = Date.now();
  creative.updatedAt = Date.now();
  creative.comments ||= [];
  creative.comments.push({
    id: newId("comment"),
    author: found.client?.name || "Cliente",
    text,
    createdAt: Date.now()
  });
  completeCreativeMutation(found, "internalRejected");
}

function markCreativeCorrected(id) {
  const found = findCreative(id);
  const creative = found?.creative;
  if (!creative) return;
  creative.status = "prov";
  creative.revisionAlert = "";
  creative.correctedAt = Date.now();
  creative.updatedAt = Date.now();
  completeCreativeMutation(found, "prov");
}

function markCreativePosted(id) {
  const found = findCreative(id);
  const creative = found?.creative;
  if (!creative) return;
  creative.status = "posted";
  creative.postedAt = Date.now();
  creative.updatedAt = Date.now();
  state.approvalStatus = "posted";
  closeDialogs();
  saveAndRender();
}

function deleteCreative(id) {
  const found = findCreative(id);
  if (!found?.group?.cards?.[id]) return;
  delete found.group.cards[id];
  closeDialogs();
  saveAndRender();
}

function moveCreativeToGroup(id, targetGroupId) {
  const client = getClient(state.approvalClientId);
  const found = findCreative(id, client);
  const targetGroup = client?.groups?.[targetGroupId];
  if (!found?.creative || !targetGroup) return;

  targetGroup.cards ||= {};
  targetGroup.cards[id] = {
    ...found.creative,
    groupId: targetGroupId,
    updatedAt: Date.now()
  };
  if (found.groupId !== targetGroupId) delete found.group.cards[id];
  state.approvalStatus = "prov";
  saveAndRender();
}

function moveGroupBefore(groupId, targetGroupId) {
  const client = getClient(state.approvalClientId);
  if (!client?.groups?.[groupId] || groupId === targetGroupId) return;

  const groups = getApprovalGroups(client);
  const groupIds = groups.map((group) => group.id).filter((id) => id !== groupId);
  const targetIndex = targetGroupId ? groupIds.indexOf(targetGroupId) : -1;
  groupIds.splice(targetIndex >= 0 ? targetIndex : groupIds.length, 0, groupId);
  groupIds.forEach((id, index) => {
    client.groups[id].order = index + 1;
    client.groups[id].updatedAt = Date.now();
  });
  saveAndRender();
}

function openLightbox(src) {
  if (!src) return;
  $("#approvalDialogHost").insertAdjacentHTML("beforeend", `
    <div class="approval-lightbox" data-action="closeLightbox">
      <img src="${attr(src)}" alt="">
      <button class="krio-icon-btn" type="button" data-action="closeLightbox" aria-label="Fechar">${icons.close}</button>
    </div>`);
}

function closeLightbox() {
  $(".approval-lightbox")?.remove();
}

function openPlanDialog(message = "") {
  const license = currentPlan();
  const usage = planUsage();
  const meta = state.data?.meta || {};
  const statusLabel = meta.licenseStatus === "active" || meta.status === "active" || state.demoMode || state.tenantId === "local"
    ? "Ativa"
    : "Aguardando liberação manual";
  const activatedAt = meta.licenseActivatedAt ? formatDateTime(meta.licenseActivatedAt) : "";

  $("#trackerDialogHost").innerHTML = `
    <div class="tracker-dialog-backdrop" data-dialog-backdrop>
      <div class="tracker-dialog" role="dialog" aria-modal="true" aria-labelledby="planDialogTitle">
        <div class="tracker-dialog-head">
          <strong id="planDialogTitle">Licença e acesso</strong>
          <button class="krio-icon-btn" type="button" data-action="closeDialog" aria-label="Fechar">${icons.close}</button>
        </div>
        ${message ? `<div class="toast warn" style="margin-bottom:14px">${esc(message)}</div>` : ""}
        <p class="tracker-dialog-copy">Produto atual: <strong>${esc(license.name)}</strong> · ${esc(statusLabel)}${activatedAt ? ` · Liberada em ${esc(activatedAt)}` : ""}</p>
        <div class="tracker-report-grid" style="margin:16px 0">
          ${usageMetric("Pessoas", usage.profiles, license.limits.profiles)}
          ${usageMetric("Clientes", usage.clients, license.limits.clients)}
          ${usageMetric("Peças", usage.creatives, license.limits.creatives)}
          ${usageMetric("Demandas", usage.demands, license.limits.demands)}
        </div>
        <div class="tracker-list">
          <article class="tracker-report-card">
            <div>
              <strong>Acesso integral</strong>
              <span>Tracker, Operação, Clientes, relatórios e uso contínuo dentro do ambiente liberado para o cliente.</span>
              <div class="tracker-demand-meta" style="margin-top:8px">
                ${license.features.map((feature) => `<span class="tracker-demand-chip">${esc(featureLabel(feature))}</span>`).join("")}
              </div>
            </div>
          </article>
          <article class="tracker-report-card">
            <div>
              <strong>Venda manual</strong>
              <span>Pagamento, contrato, suporte e liberação de novos clientes são controlados fora do app por você.</span>
            </div>
          </article>
        </div>
        <div class="divider"></div>
        <div class="tracker-dialog-actions">
          <button class="krio-btn" type="button" data-action="closeDialog">Fechar</button>
        </div>
        <p class="tracker-dialog-copy">Esta licença é gerenciada diretamente pelo responsável do Krio.</p>
      </div>
    </div>`;
}

function usageMetric(label, used, limit) {
  return `<div class="tracker-report-card"><div><strong>${esc(label)}</strong><span>${esc(used)} de ${esc(formatLimit(limit))}</span></div></div>`;
}

async function requestPlan(planId) {
  openPlanDialog("O Krio agora está em modo de licença manual. Novos acessos são liberados por você após a venda direta.");
}

async function openBillingPortal() {
  openPlanDialog("Pagamentos são tratados manualmente fora do app neste modelo comercial.");
}

function currentPlan() {
  return LICENSE_PRODUCT;
}

function featureEnabled(feature) {
  return currentPlan().features.includes(feature);
}

function withinPlanLimit(metric) {
  return true;
}

function planUsage() {
  if (!state.data) return { profiles: 0, clients: 0, creatives: 0, demands: 0 };
  const clients = getClients();
  return {
    profiles: getProfiles().length,
    clients: clients.length,
    creatives: clients.reduce((sum, client) => sum + getCreatives(client).length, 0),
    demands: getAllDemandRefs().length
  };
}

function formatLimit(limit) {
  return Number.isFinite(limit) ? limit : "ilimitado";
}

function featureLabel(feature) {
  return {
    tracker: "Tracker",
    approval: "Clientes",
    operations: "Operação",
    reports: "Relatórios",
    manualAccess: "Licença manual"
  }[feature] || feature;
}

function accessRoleLabel(role) {
  return {
    owner: "Gestão — proprietário",
    admin: "Gestão — acesso integral",
    creator: "Criador",
    member: "Criador",
    operations: "Operação",
    client: "Cliente",
    guest: "Convidado"
  }[role] || "Criador";
}

function roleRequestLabel(role) {
  return {
    member: "Colaborador",
    creator: "Criador",
    operations: "Operação",
    admin: "Gestão",
    client: "Cliente",
    guest: "Convidado",
    designer: "Designer",
    editor_video: "Editor de video",
    fotografo: "Fotografo",
    videomaker: "Videomaker"
  }[role] || accessRoleLabel(role);
}

async function approveAccessRequest(uid) {
  if (!uid || !state.firebase?.db || state.demoMode || state.tenantId === "local" || !canManageWorkspace()) return;
  const request = state.accessRequests.find((item) => item.uid === uid);
  if (!request) return;
  const now = Date.now();
  const roleText = roleRequestLabel(request.role || "member");
  const color = colorFromString(request.email || request.userName || uid);
  const profile = {
    id: uid,
    name: request.userName || request.email || "Colaborador",
    role: roleText,
    color,
    authUid: uid,
    accessUid: uid,
    accessRole: "creator",
    assignedTypes: defaultAssignedDemandTypes(),
    createdAt: now
  };
  const membership = {
    role: "creator",
    status: "active",
    tenantId: state.tenantId,
    updatedAt: now,
    invitedBy: state.user?.uid || ""
  };
  state.data.profiles[uid] = profile;
  state.data.tracker.weeks.forEach((week) => ensureWeekPerson(week, uid));
  try {
    await state.firebase.update(state.firebase.ref(state.firebase.db), {
      [`tenants/${state.tenantId}/profiles/${uid}`]: profile,
      [`memberships/${uid}/${state.tenantId}`]: membership,
      [`tenantAccessRequests/${state.tenantId}/${uid}/status`]: "approved",
      [`tenantAccessRequests/${state.tenantId}/${uid}/approvedAt`]: now,
      [`tenantAccessRequests/${state.tenantId}/${uid}/updatedAt`]: now,
      [`accessRequests/${uid}/status`]: "approved",
      [`accessRequests/${uid}/tenantId`]: state.tenantId,
      [`accessRequests/${uid}/approvedAt`]: now,
      [`accessRequests/${uid}/updatedAt`]: now
    });
    state.accessRequests = state.accessRequests.filter((item) => item.uid !== uid);
    saveAndRender();
  } catch (error) {
    setSyncState("offline", "Não foi possível aprovar o colaborador.");
  }
}

async function rejectAccessRequest(uid) {
  if (!uid || !state.firebase?.db || state.demoMode || state.tenantId === "local" || !canManageWorkspace()) return;
  const now = Date.now();
  try {
    await state.firebase.update(state.firebase.ref(state.firebase.db), {
      [`tenantAccessRequests/${state.tenantId}/${uid}/status`]: "rejected",
      [`tenantAccessRequests/${state.tenantId}/${uid}/updatedAt`]: now,
      [`accessRequests/${uid}/status`]: "rejected",
      [`accessRequests/${uid}/updatedAt`]: now
    });
    state.accessRequests = state.accessRequests.filter((item) => item.uid !== uid);
    render();
  } catch (error) {
    setSyncState("offline", "Não foi possível recusar a solicitação.");
  }
}

async function grantWorkspaceMembership(uid, role = "member") {
  if (!state.firebase?.db || state.demoMode || state.tenantId === "local" || !canManageWorkspace()) return;
  const safeRole = normalizeAssignableAccessRole(role);
  const payload = {
    role: safeRole,
    status: "active",
    tenantId: state.tenantId,
    updatedAt: Date.now(),
    invitedBy: state.user?.uid || ""
  };
  try {
    await state.firebase.set(state.firebase.ref(state.firebase.db, `memberships/${uid}/${state.tenantId}`), payload);
  } catch (error) {
    setSyncState("offline", "Perfil salvo, mas o acesso do colaborador não foi liberado.");
  }
}

async function copyWorkspaceInvite(value, successMessage) {
  const text = String(value || "").trim();
  if (!text) {
    setSyncState("offline", "Convite ainda nao disponivel.");
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    setSyncState("online", successMessage);
  } catch (error) {
    const input = document.createElement("textarea");
    input.value = text;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.left = "-9999px";
    document.body.appendChild(input);
    input.select();
    const copied = document.execCommand("copy");
    input.remove();
    setSyncState(copied ? "online" : "offline", copied ? successMessage : "Nao foi possivel copiar o convite.");
  }
}

function closeDialogs() {
  $("#trackerDialogHost").innerHTML = "";
  $("#approvalDialogHost").innerHTML = "";
}

function moveWeek(delta) {
  state.currentWeekIndex = Math.max(0, Math.min(state.data.tracker.weeks.length - 1, state.currentWeekIndex + delta));
  renderTracker();
}

function createNextWeek() {
  const weeks = state.data.tracker.weeks;
  const last = weeks[weeks.length - 1] || createWeek(startOfWeek(new Date()));
  const start = addDays(parseISODate(last.startDate), 7);
  weeks.push(createWeek(start));
  state.currentWeekIndex = weeks.length - 1;
  persist();
  renderTracker();
}

function deleteCurrentWeek() {
  if (!canManageWorkspace()) return;
  const week = currentWeek();
  const index = state.data.tracker.weeks.findIndex((candidate) => candidate.id === week.id);
  if (index < 0) return;
  const [removed] = state.data.tracker.weeks.splice(index, 1);
  const now = Date.now();
  state.data.tracker.trash.unshift({
    id: newId("trash_week"),
    kind: "week",
    title: removed.title || "Semana",
    deletedAt: now,
    quarantineUntil: now + (40 * 24 * 60 * 60 * 1000),
    deletedBy: {
      uid: state.user?.uid || "local",
      name: state.user?.displayName || state.user?.email || "Usuário"
    },
    deletedByUid: state.user?.uid || "local",
    week: removed
  });
  state.currentWeekIndex = Math.max(0, Math.min(index, state.data.tracker.weeks.length - 1));
  if (!state.data.tracker.weeks.length) {
    state.data.tracker.weeks.push(createWeek(startOfWeek(new Date()), state.data.profiles));
  }
  persist();
  renderModuleActions();
  renderTracker();
  applyRoleVisibility();
}

function toggleDemand(id) {
  const found = findDemand(id);
  if (!found || !canManageDemand(found.personId)) return;
  if (!found.demand.done) {
    openCompleteDemandDialog(id);
    return;
  }
  found.demand.done = false;
  found.demand.completedAt = null;
  saveAndRender();
}

function openCompleteDemandDialog(id) {
  const found = findDemand(id);
  const demand = found?.demand;
  if (!demand || !canManageDemand(found.personId)) return;
  $("#trackerDialogHost").innerHTML = `
    <div class="tracker-dialog-backdrop" data-dialog-backdrop>
      <div class="tracker-dialog" role="dialog" aria-modal="true" aria-labelledby="completeDemandTitle">
        <div class="tracker-dialog-head">
          <strong id="completeDemandTitle">Finalizar demanda</strong>
          <button class="krio-icon-btn" type="button" data-action="closeDialog" aria-label="Fechar">${icons.close}</button>
        </div>
        <form id="completeDemandForm" class="tracker-form" data-id="${attr(id)}">
          <div class="tracker-complete-summary">
            <strong>${esc(demand.title)}</strong>
            <span>${esc(found.person.name)} · ${esc(formatDuration(effectiveMinutes(demand)))}</span>
          </div>
          <label class="tracker-field">Dificuldade
            <select class="krio-input" name="difficulty">
              ${["none", "some", "hard"].map((value) => `<option value="${value}" ${value === (demand.difficulty || "none") ? "selected" : ""}>${difficultyLabel(value)}</option>`).join("")}
            </select>
          </label>
          <label class="tracker-field">Observações
            <textarea class="tracker-textarea" name="notes" placeholder="Alguma dificuldade, dependência ou ponto de atenção?">${esc(demand.notes || "")}</textarea>
          </label>
          <div class="tracker-dialog-actions">
            <button class="krio-btn" type="button" data-action="closeDialog">Cancelar</button>
            <button class="krio-btn primary" type="submit">${icons.check} Finalizar</button>
          </div>
        </form>
      </div>
    </div>`;
}

function saveCompleteDemandForm(form) {
  const found = findDemand(form.dataset.id);
  const demand = found?.demand;
  if (!demand || !canManageDemand(found.personId)) return;
  const formData = new FormData(form);
  stopDemandTimer(demand);
  demand.done = true;
  demand.completedAt = Date.now();
  demand.difficulty = String(formData.get("difficulty") || "none");
  demand.notes = String(formData.get("notes") || "").trim();
  closeDialogs();
  saveAndRender();
}

function deleteDemand(id) {
  const found = findDemand(id);
  if (!found) return;
  if (!canManageDemand(found.personId)) return;
  removeDemandFromWeek(found.week, found.personId, found.type, id);
  state.data.tracker.trash.unshift({
    ...found.demand,
    deletedAt: Date.now(),
    deletedBy: {
      uid: state.user?.uid || "local",
      name: state.user?.displayName || state.user?.email || "Usuário"
    },
    deletedByUid: state.user?.uid || "local",
    sourceWeekId: found.week.id,
    sourcePersonId: found.personId,
    sourceType: found.type
  });
  closeDialogs();
  saveAndRender();
}

function restoreDemand(id) {
  const index = state.data.tracker.trash.findIndex((item) => item.id === id);
  if (index < 0) return;
  if (state.data.tracker.trash[index].kind === "week") return restoreWeek(id);
  if (!canManageWorkspace() && state.data.tracker.trash[index].deletedBy?.uid !== state.user?.uid && state.data.tracker.trash[index].deletedByUid !== state.user?.uid) return;
  const [item] = state.data.tracker.trash.splice(index, 1);
  const week = state.data.tracker.weeks.find((candidate) => candidate.id === item.sourceWeekId) || currentWeek();
  const personId = canManageWorkspace()
    ? (getProfile(item.sourcePersonId) && isCreatorProfile(getProfile(item.sourcePersonId)) ? item.sourcePersonId : getCreatorProfiles()[0]?.id)
    : currentPersonId();
  if (!personId) return;
  const type = demandTypes.some((candidate) => candidate.id === item.sourceType) ? item.sourceType : "mensal";
  ensureWeekPerson(week, personId);
  delete item.deletedAt;
  delete item.deletedBy;
  delete item.deletedByUid;
  week.people[personId][type].push(item);
  saveAndRender();
}

function restoreWeek(id) {
  if (!canManageWorkspace()) return;
  const index = state.data.tracker.trash.findIndex((item) => item.id === id && item.kind === "week");
  if (index < 0) return;
  const [item] = state.data.tracker.trash.splice(index, 1);
  if (item.week) {
    state.data.tracker.weeks.push(normalizeWeek(item.week, state.data.profiles));
    state.data.tracker.weeks.sort((a, b) => a.startDate.localeCompare(b.startDate));
    state.currentWeekIndex = state.data.tracker.weeks.findIndex((week) => week.id === item.week.id);
  }
  saveAndRender();
}

function deleteTrashItem(id) {
  const item = state.data.tracker.trash.find((candidate) => candidate.id === id);
  if (!item) return;
  if (!canManageWorkspace() && item.deletedBy?.uid !== state.user?.uid && item.deletedByUid !== state.user?.uid) return;
  state.data.tracker.trash = state.data.tracker.trash.filter((candidate) => candidate.id !== id);
  saveAndRender();
}

function expireTrashQuarantine() {
  const now = Date.now();
  const before = state.data.tracker.trash.length;
  state.data.tracker.trash = state.data.tracker.trash.filter((item) => !item.quarantineUntil || item.quarantineUntil > now);
  return state.data.tracker.trash.length !== before;
}

function purgeTrash() {
  if (canManageWorkspace()) {
    state.data.tracker.trash = [];
  } else {
    const uid = state.user?.uid || "";
    state.data.tracker.trash = state.data.tracker.trash.filter((item) => item.deletedBy?.uid !== uid && item.deletedByUid !== uid);
  }
  saveAndRender();
}

function toggleTimer(id) {
  const found = findDemand(id);
  if (!found) return;
  if (!canManageDemand(found.personId)) return;
  if (found.demand.runningStartedAt) {
    stopDemandTimer(found.demand);
  } else {
    (canManageWorkspace() ? getAllDemandRefs() : getVisibleDemandRefs()).forEach(({ demand }) => stopDemandTimer(demand));
    found.demand.runningStartedAt = Date.now();
    found.demand.done = false;
  }
  saveAndRender();
}

function stopDemandTimer(demand) {
  if (!demand.runningStartedAt) return;
  const elapsed = Math.max(1, Math.round((Date.now() - demand.runningStartedAt) / 60000));
  demand.timeMinutes = Number(demand.timeMinutes || 0) + elapsed;
  demand.runningStartedAt = null;
}

function resetDemandTime(id) {
  const found = findDemand(id);
  if (!found || !canManageDemand(found.personId)) return;
  found.demand.timeMinutes = 0;
  found.demand.runningStartedAt = null;
  saveAndRender();
}

function cycleDemandDifficulty(id, button = null) {
  const found = findDemand(id);
  if (!found || !canManageDemand(found.personId)) return;
  const order = ["none", "some", "hard"];
  const current = order.indexOf(found.demand.difficulty || "none");
  const next = order[(current + 1) % order.length];
  found.demand.difficulty = next;
  if (button) {
    button.className = `diff-badge diff-${next}`;
    button.textContent = difficultyLabel(next);
  }
  persist();
}

function moveTrackerDemand(id, targetPersonId, targetType, targetId = "", insertAfter = false) {
  if (!id || !targetPersonId || !targetType || !demandTypes.some((type) => type.id === targetType)) return;
  const found = findDemand(id);
  if (!found || !canManageDemand(found.personId) || !canManageDemand(targetPersonId)) return;

  const week = found.week;
  const sourceList = week.people?.[found.personId]?.[found.type] || [];
  const sourceIndex = sourceList.findIndex((demand) => demand.id === id);
  if (sourceIndex < 0) return;

  const [demand] = sourceList.splice(sourceIndex, 1);
  demand.type = targetType;

  const targetPerson = ensureWeekPerson(week, targetPersonId);
  const targetList = targetPerson[targetType];
  let insertIndex = targetList.length;
  if (targetId && targetId !== id) {
    const targetIndex = targetList.findIndex((demandItem) => demandItem.id === targetId);
    if (targetIndex >= 0) insertIndex = targetIndex + (insertAfter ? 1 : 0);
  }

  targetList.splice(Math.max(0, Math.min(insertIndex, targetList.length)), 0, demand);
  saveAndRender();
}

function openTimerEditDialog(id) {
  const found = findDemand(id);
  const demand = found?.demand;
  if (!demand || !canManageDemand(found.personId)) return;
  const minutes = effectiveMinutes(demand);
  $("#trackerDialogHost").innerHTML = `
    <div class="tracker-dialog-backdrop" data-dialog-backdrop>
      <div class="tracker-dialog tracker-dialog-compact" role="dialog" aria-modal="true" aria-labelledby="timerEditTitle">
        <div class="tracker-dialog-head">
          <strong id="timerEditTitle">Editar tempo</strong>
          <button class="krio-icon-btn" type="button" data-action="closeDialog" aria-label="Fechar">${icons.close}</button>
        </div>
        <form id="timerEditForm" class="tracker-form" data-id="${attr(id)}" data-was-running="${demand.runningStartedAt ? "1" : "0"}">
          <div class="tracker-complete-summary">
            <strong>${esc(demand.title)}</strong>
            <span>${esc(found.person.name)} · ${esc(formatDuration(minutes))}</span>
          </div>
          <label class="tracker-field">Tempo registrado
            <input class="krio-input" name="timeText" value="${attr(formatDuration(minutes))}" placeholder="Ex: 1h 30m, 45m ou 90">
          </label>
          <div class="tracker-dialog-actions">
            <button class="krio-btn" type="button" data-action="closeDialog">Cancelar</button>
            <button class="krio-btn primary" type="submit">Salvar</button>
          </div>
        </form>
      </div>
    </div>`;
}

function saveTimerEditForm(form) {
  const found = findDemand(form.dataset.id);
  const demand = found?.demand;
  if (!demand || !canManageDemand(found.personId)) return;
  const formData = new FormData(form);
  demand.timeMinutes = parseDurationToMinutes(String(formData.get("timeText") || ""));
  demand.runningStartedAt = form.dataset.wasRunning === "1" && !demand.done ? Date.now() : null;
  closeDialogs();
  saveAndRender();
}

function openDemandNoteDialog(id) {
  const found = findDemand(id);
  const demand = found?.demand;
  if (!demand || !canManageDemand(found.personId)) return;
  $("#trackerDialogHost").innerHTML = `
    <div class="tracker-dialog-backdrop" data-dialog-backdrop>
      <div class="tracker-dialog tracker-dialog-compact" role="dialog" aria-modal="true" aria-labelledby="demandNoteTitle">
        <div class="tracker-dialog-head">
          <strong id="demandNoteTitle">${demand.notes ? "Editar observação" : "Adicionar observação"}</strong>
          <button class="krio-icon-btn" type="button" data-action="closeDialog" aria-label="Fechar">${icons.close}</button>
        </div>
        <form id="demandNoteForm" class="tracker-form" data-id="${attr(id)}">
          <div class="tracker-complete-summary">
            <strong>${esc(demand.title)}</strong>
            <span>${demand.client ? esc(demand.client) : esc(found.person.name)}</span>
          </div>
          <label class="tracker-field">Observação
            <textarea class="tracker-textarea" name="notes" placeholder="Contexto, bloqueio ou ajuste importante">${esc(demand.notes || "")}</textarea>
          </label>
          <div class="tracker-dialog-actions">
            <button class="krio-btn" type="button" data-action="closeDialog">Cancelar</button>
            <button class="krio-btn primary" type="submit">Salvar</button>
          </div>
        </form>
      </div>
    </div>`;
}

function saveDemandNoteForm(form) {
  const found = findDemand(form.dataset.id);
  const demand = found?.demand;
  if (!demand || !canManageDemand(found.personId)) return;
  const formData = new FormData(form);
  demand.notes = String(formData.get("notes") || "").trim();
  closeDialogs();
  saveAndRender();
}

function moveAgenda(delta) {
  const cursor = parseISODate(state.agendaCursor);
  const next = state.agendaView === "year"
    ? new Date(cursor.getFullYear() + delta, 0, 1)
    : state.agendaView === "month"
      ? new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1)
      : addDays(cursor, delta * 7);
  state.agendaCursor = isoDate(next);
  renderTracker();
}

function openAgendaEventDialog(id = "", date = "") {
  if (!canEditAgenda()) return;
  const event = id ? getAgendaEvent(id) : null;
  const selectedDate = event?.date || date || state.agendaCursor || isoDate(new Date());
  $("#trackerDialogHost").innerHTML = `
    <div class="tracker-dialog-backdrop" data-dialog-backdrop>
      <div class="tracker-dialog" role="dialog" aria-modal="true" aria-labelledby="agendaEventTitle">
        <div class="tracker-dialog-head">
          <strong id="agendaEventTitle">${event ? "Editar compromisso" : "Novo compromisso"}</strong>
          <button class="krio-icon-btn" type="button" data-action="closeDialog" aria-label="Fechar">${icons.close}</button>
        </div>
        <form id="agendaEventForm" class="tracker-form" data-id="${attr(id)}">
          <label class="tracker-field">Título
            <input class="krio-input" name="title" required value="${attr(event?.title || "")}" placeholder="Ex: Reunião de alinhamento">
          </label>
          <div class="form-row">
            <label class="tracker-field">Tipo
              <select class="krio-input" name="type">
                ${agendaEventTypes.map((type) => `<option value="${attr(type.id)}" ${type.id === (event?.type || "meeting") ? "selected" : ""}>${esc(type.label)}</option>`).join("")}
              </select>
            </label>
            <label class="tracker-field">Data
              <input class="krio-input" name="date" type="date" required value="${attr(selectedDate)}">
            </label>
          </div>
          <div class="form-row">
            <label class="tracker-field">Início
              <input class="krio-input" name="time" type="time" value="${attr(event?.time || "")}">
            </label>
            <label class="tracker-field">Fim
              <input class="krio-input" name="endTime" type="time" value="${attr(event?.endTime || "")}">
            </label>
          </div>
          <label class="tracker-field">Observações
            <textarea class="tracker-textarea" name="desc" placeholder="Contexto, link ou participantes">${esc(event?.desc || "")}</textarea>
          </label>
          <div class="tracker-dialog-actions">
            ${event ? `<button class="krio-btn danger" type="button" data-action="deleteAgendaEvent" data-id="${attr(id)}">Excluir</button>` : ""}
            <button class="krio-btn" type="button" data-action="closeDialog">Cancelar</button>
            <button class="krio-btn primary" type="submit">Salvar</button>
          </div>
        </form>
      </div>
    </div>`;
}

function saveAgendaEventForm(form) {
  if (!canEditAgenda()) return;
  const formData = new FormData(form);
  const id = form.dataset.id || newId("event");
  const title = String(formData.get("title") || "").trim();
  const date = String(formData.get("date") || "").trim();
  if (!title || !date) return;
  state.data.tracker.events ||= [];
  const existingIndex = state.data.tracker.events.findIndex((event) => event.id === id);
  const existing = existingIndex >= 0 ? state.data.tracker.events[existingIndex] : {};
  const payload = {
    ...existing,
    id,
    title,
    type: String(formData.get("type") || "meeting"),
    date,
    time: String(formData.get("time") || ""),
    endTime: String(formData.get("endTime") || ""),
    desc: String(formData.get("desc") || "").trim(),
    createdBy: existing.createdBy || state.user?.uid || "local",
    createdAt: existing.createdAt || Date.now(),
    updatedAt: Date.now()
  };
  if (existingIndex >= 0) state.data.tracker.events[existingIndex] = payload;
  else state.data.tracker.events.push(payload);
  state.agendaCursor = date;
  closeDialogs();
  saveAndRender();
}

function deleteAgendaEvent(id) {
  if (!canEditAgenda()) return;
  state.data.tracker.events = asArray(state.data.tracker.events).filter((event) => event.id !== id);
  closeDialogs();
  saveAndRender();
}

function getAgendaEvent(id) {
  return asArray(state.data?.tracker?.events).find((event) => event.id === id) || null;
}

function exportTracker() {
  const rows = getCreatorDemandRefs().map(({ week, person, demand }) => ({
    semana: week.title,
    responsavel: person.name,
    tipo: demand.type,
    titulo: demand.title,
    cliente: demand.client || "",
    prazo: demand.dueDate || "",
    concluida: demand.done ? "sim" : "nao",
    tempo: effectiveMinutes(demand)
  }));
  const blob = new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "krio-tracker.json";
  link.click();
  URL.revokeObjectURL(url);
}

function printTracker() {
  if (state.activeView === "tracker" && state.trackerView === "reports") {
    const win = openReportWindow();
    win?.addEventListener("load", () => win.print(), { once: true });
    return;
  }
  window.print();
}

function openReportPreview() {
  openReportWindow();
}

function openReportWindow() {
  const html = buildTrackerReportHTML(currentWeek());
  const win = window.open("", "_blank");
  if (!win) return null;
  win.document.open();
  win.document.write(html);
  win.document.close();
  return win;
}

function downloadReportHtml() {
  const week = currentWeek();
  const html = buildTrackerReportHTML(week);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `relatorio-krio-${slugify(week.title)}-${isoDate(new Date())}.html`;
  link.click();
  URL.revokeObjectURL(url);
}

function buildTrackerReportHTML(week) {
  const refs = getCreatorWeekDemandRefs(week);
  const stats = getWeekStats(week, refs);
  const people = getCreatorProfiles();
  const generatedAt = new Date().toLocaleString("pt-BR");
  const rowsByPerson = people.map((person) => {
    const personRefs = refs.filter((ref) => ref.person.id === person.id);
    const minutes = personRefs.reduce((sum, { demand }) => sum + effectiveMinutes(demand), 0);
    return { person, refs: personRefs, minutes, done: personRefs.filter(({ demand }) => demand.done).length };
  });

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Relatório KRIO - ${esc(week.title)}</title>
<style>
  :root{--ink:#172033;--muted:#667085;--line:#D8DEE9;--brand:#2563EB;--soft:#F4F7FB;--green:#059669;--orange:#D97706;--red:#DC2626}
  *{box-sizing:border-box}
  body{margin:0;background:#EEF2F7;color:var(--ink);font-family:Arial,Helvetica,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .page{max-width:1100px;width:calc(100% - 32px);min-height:780px;margin:24px auto;background:#fff;border:1px solid var(--line);border-radius:22px;padding:30px;box-shadow:0 24px 80px rgba(23,32,51,.12)}
  @media(max-width:700px){.kpis{grid-template-columns:repeat(2,1fr)!important}.page{padding:16px;border-radius:12px}}
  header{display:flex;align-items:flex-start;justify-content:space-between;border-bottom:1px solid var(--line);padding-bottom:20px;margin-bottom:20px}
  .brand{display:flex;gap:14px;align-items:center}.mark{width:42px;height:42px;border-radius:12px;background:linear-gradient(135deg,#2563EB,#60A5FA);color:#fff;display:grid;place-items:center;font-weight:800}
  h1{margin:0;font-size:28px;letter-spacing:-.04em}.sub{margin-top:5px;color:var(--muted);font-size:13px}
  .kpis{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:20px}.kpi{background:var(--soft);border:1px solid var(--line);border-radius:14px;padding:14px}.kpi span{display:block;color:var(--muted);font-size:10px;text-transform:uppercase;letter-spacing:.08em}.kpi strong{display:block;margin-top:6px;font-size:24px}
  .person{break-inside:avoid;border:1px solid var(--line);border-radius:16px;margin-top:14px;overflow:hidden}.person-head{display:flex;justify-content:space-between;gap:12px;background:#F8FAFC;padding:12px 14px;border-bottom:1px solid var(--line)}.person-head strong{font-size:15px}.person-head span{color:var(--muted);font-size:12px}
  table{width:100%;border-collapse:collapse;font-size:12px;table-layout:fixed}th,td{text-align:left;border-bottom:1px solid #EDF1F6;padding:9px 10px;vertical-align:top;word-break:break-word}th{color:var(--muted);font-size:10px;text-transform:uppercase;letter-spacing:.08em}tr:last-child td{border-bottom:0}
  .tag{display:inline-block;border-radius:999px;padding:2px 7px;background:#EAF2FF;color:var(--brand);font-weight:700;font-size:10px}.done{color:var(--green)}.pend{color:var(--orange)}.hard{color:var(--red)}
  .no-print{display:flex;justify-content:center;margin:18px auto}.no-print button{border:0;border-radius:12px;background:var(--brand);color:#fff;font-weight:800;padding:12px 20px;cursor:pointer}
  @media print{ @page{size:A4 landscape;margin:0} body{background:#fff}.page{width:100vw;min-height:100vh;margin:0;border:0;border-radius:0;box-shadow:none}.no-print{display:none!important} }
</style>
</head>
<body>
<main class="page">
  <header>
    <div class="brand"><div class="mark">K</div><div><h1>Relatório KRIO</h1><div class="sub">${esc(week.title)} · gerado em ${esc(generatedAt)}</div></div></div>
    <div class="sub">${esc(state.data?.meta?.name || "Workspace KRIO")}</div>
  </header>
  <section class="kpis">
    <div class="kpi"><span>Demandas</span><strong>${stats.total}</strong></div>
    <div class="kpi"><span>Concluídas</span><strong>${stats.done}</strong></div>
    <div class="kpi"><span>Pendentes</span><strong>${stats.pending}</strong></div>
    <div class="kpi"><span>Progresso</span><strong>${stats.progress}%</strong></div>
    <div class="kpi"><span>Tempo</span><strong>${esc(formatDuration(stats.minutes))}</strong></div>
  </section>
  ${rowsByPerson.map(({ person, refs: personRefs, minutes, done }) => `
    <section class="person">
      <div class="person-head"><div><strong>${esc(person.name)}</strong><span> · ${esc(person.role || "Equipe")}</span></div><span>${done}/${personRefs.length} concluídas · ${esc(formatDuration(minutes))}</span></div>
      <table>
        <thead><tr><th>Demanda</th><th>Cliente</th><th>Tipo</th><th>Prazo</th><th>Status</th><th>Tempo</th><th>Obs</th></tr></thead>
        <tbody>
          ${personRefs.length ? personRefs.map(({ demand }) => `
            <tr>
              <td>${esc(demand.title)}</td>
              <td>${esc(demand.client || "-")}</td>
              <td><span class="tag">${esc(demandTypes.find((type) => type.id === demand.type)?.label || demand.type)}</span></td>
              <td>${esc(demand.dueDate ? formatDate(demand.dueDate) : "-")}</td>
              <td class="${demand.done ? "done" : "pend"}">${demand.done ? "Concluída" : "Pendente"}</td>
              <td>${esc(formatDuration(effectiveMinutes(demand)))}</td>
              <td class="${demand.difficulty === "hard" ? "hard" : ""}">${esc(demand.notes || difficultyLabel(demand.difficulty || "none"))}</td>
            </tr>`).join("") : `<tr><td colspan="7">Sem demandas nesta semana.</td></tr>`}
        </tbody>
      </table>
    </section>`).join("")}
</main>
<div class="no-print"><button onclick="window.print()">Imprimir / PDF</button></div>
</body>
</html>`;
}

function saveAndRender() {
  persist();
  render();
}

function persist() {
  state.data.updatedAt = Date.now();
  markLocalWrite();
  saveLocalState();
  if (!state.firebase?.db || state.demoMode || state.tenantId === "local") {
    releaseLocalWrite(true);
    return;
  }

  clearTimeout(state.saveTimer);
  state.saveTimer = setTimeout(persistNow, 350);
}

async function persistNow() {
  if (state.saveTimer) {
    clearTimeout(state.saveTimer);
    state.saveTimer = null;
  }
  markLocalWrite();
  state.data.updatedAt = Date.now();
  const localSaved = saveLocalState();
  if (!state.firebase?.db || state.demoMode || state.tenantId === "local") {
    releaseLocalWrite(true);
    setSyncState(localSaved ? "online" : "offline", localSaved ? "Dados salvos localmente" : "Cópia local cheia. Alterações mantidas nesta sessão.");
    return;
  }

  try {
    setSyncState("online", "Sincronizando...");
    const trashPayload = buildTrashPayload();
    const payload = JSON.parse(JSON.stringify({
      ...(canManageWorkspace() ? { [`tenants/${state.tenantId}/profiles`]: state.data.profiles } : {}),
      [`tenants/${state.tenantId}/tracker/weeks`]: state.data.tracker.weeks,
      [`tenants/${state.tenantId}/tracker/events`]: state.data.tracker.events || [],
      ...(canManageWorkspace() ? { [`tenants/${state.tenantId}/approval`]: state.data.approval } : {}),
      ...(canManageWorkspace() ? buildApprovalPortalPayload() : {}),
      [canManageWorkspace() ? `tenants/${state.tenantId}/trash` : `tenants/${state.tenantId}/trash/${state.user.uid}`]: trashPayload,
      [`tenants/${state.tenantId}/updatedAt`]: Date.now()
    }));
    await state.firebase.update(state.firebase.ref(state.firebase.db), payload);
    releaseLocalWrite(true);
    setSyncState("online", "Sincronizado");
  } catch (error) {
    releaseLocalWrite(false);
    setSyncState("offline", "Falha ao sincronizar. Cópia local preservada.");
  }
}

function buildTrashPayload() {
  const trash = asArray(state.data.tracker.trash);
  if (!canManageWorkspace()) {
    const uid = state.user?.uid || "";
    return collectionById(trash.filter((item) => item.deletedBy?.uid === uid || item.deletedByUid === uid));
  }
  return trash.reduce((acc, item) => {
    const uid = item.deletedBy?.uid || item.deletedByUid || "unknown";
    acc[uid] ||= {};
    acc[uid][item.id] = item;
    return acc;
  }, {});
}

function buildApprovalPortalPayload() {
  return getClients().reduce((payload, client) => {
    if (client.portalEnabled === false) return payload;
    payload[`approvalPortals/${client.id}`] = {
      tenantId: state.tenantId,
      clientId: client.id,
      clientName: client.name || "Cliente",
      workspaceName: state.tenantMeta?.name || state.data?.meta?.name || "Krio",
      updatedAt: Date.now()
    };
    return payload;
  }, {});
}

function collectionById(items) {
  return asArray(items).reduce((acc, item) => {
    if (item?.id) acc[item.id] = item;
    return acc;
  }, {});
}

function setSyncState(status, title) {
  const chip = $("#syncChip");
  if (!chip) return;
  chip.classList.toggle("offline", status === "offline");
  chip.title = title || (status === "offline" ? "Offline" : "Sincronizado");
}

function startTimerTick() {
  clearInterval(state.timerTick);
  state.timerTick = setInterval(() => {
    const postedChanged = syncPostedCreatives();
    const trashChanged = expireTrashQuarantine();
    if (trashChanged) persist();
    if (postedChanged && state.activeView === "approval") renderApproval();
    if (trashChanged && state.activeView === "tracker" && state.trackerView === "trash") renderTracker();
    updateLiveTimers();
  }, 1000);
}

function updateLiveTimers() {
  document.querySelectorAll("[data-live-timer]").forEach((node) => {
    const found = findDemand(node.dataset.id);
    if (!found?.demand) return;
    const format = node.dataset.format || "clock";
    node.textContent = format === "duration"
      ? formatDuration(effectiveMinutes(found.demand))
      : formatClock(effectiveSeconds(found.demand));
  });
}

function normalizeTenant(raw, user) {
  const seed = seedData(user);
  const meta = {
    ...(seed.meta || {}),
    ...(raw?.meta || {})
  };
  meta.plan = "manual_license";
  meta.licenseStatus ||= meta.status === "active" || state.demoMode || state.tenantId === "local" ? "active" : "manual";
  meta.licenseType ||= "direct_sale";
  const billing = {
    ...(seed.billing || {}),
    ...(raw?.billing || {})
  };
  billing.status ||= "manual_license";
  billing.provider ||= "manual";

  const profiles = raw?.profiles && Object.keys(raw.profiles).length ? raw.profiles : seed.profiles;
  Object.entries(profiles).forEach(([id, profile]) => {
    profiles[id] = {
      id,
      name: profile.name || "Pessoa",
      role: profile.role || "Equipe",
      color: profile.color || colorFromString(profile.name || id),
      accessUid: profile.accessUid || (/^person_/.test(id) ? "" : id),
      accessRole: validAccessRoles.has(profile.accessRole) ? profile.accessRole : "member",
      assignedTypes: Array.isArray(profile.assignedTypes) ? profile.assignedTypes : defaultAssignedDemandTypes()
    };
  });

  if (user?.uid && !profiles[user.uid]) {
    profiles[user.uid] = {
      id: user.uid,
      name: user.displayName || user.email?.split("@")[0] || "Usuário",
      role: "Owner",
      color: "#3B82F6",
      accessRole: "admin",
      assignedTypes: defaultAssignedDemandTypes()
    };
  }

  const useSeedFallback = state.demoMode || state.tenantId === "local" || !raw?.meta;
  const weeks = asArray(raw?.tracker?.weeks).length
    ? asArray(raw.tracker.weeks).map((week) => normalizeWeek(week, profiles))
    : useSeedFallback ? seed.tracker.weeks.map((week) => normalizeWeek(week, profiles)) : [];

  const clients = raw?.approval?.clients && Object.keys(raw.approval.clients).length
    ? raw.approval.clients
    : useSeedFallback ? seed.approval.clients : {};

  Object.entries(clients).forEach(([id, client]) => {
    clients[id] = normalizeApprovalClient(client, id);
  });
  const clientFolders = normalizeClientFolders(raw?.approval?.clientFolders || (useSeedFallback ? seed.approval.clientFolders : {}), clients);

  return {
    meta,
    billing,
    profiles,
    tracker: {
      weeks,
      events: normalizeAgendaEvents(raw?.tracker?.events),
      trash: flattenTrash(raw?.tracker?.trash || raw?.trash)
    },
    approval: {
      clients,
      clientFolders
    }
  };
}

function normalizeProfiles(rawProfiles, user = state.user) {
  const fallback = state.data?.profiles || seedData(user).profiles;
  const profiles = normalizeObjectCollection(rawProfiles && Object.keys(rawProfiles).length ? rawProfiles : fallback);
  Object.entries(profiles).forEach(([id, profile]) => {
    profiles[id] = {
      id,
      name: profile.name || "Pessoa",
      role: profile.role || "Equipe",
      color: profile.color || colorFromString(profile.name || id),
      logoUrl: profile.logoUrl || "",
      accessUid: profile.accessUid || (/^person_/.test(id) ? "" : id),
      accessRole: validAccessRoles.has(profile.accessRole) ? profile.accessRole : "member",
      assignedTypes: Array.isArray(profile.assignedTypes) ? profile.assignedTypes : defaultAssignedDemandTypes()
    };
  });

  if (user?.uid && !profiles[user.uid]) {
    profiles[user.uid] = {
      id: user.uid,
      name: user.displayName || user.email?.split("@")[0] || "Usuario",
      role: "Owner",
      color: "#3B82F6",
      accessUid: user.uid,
      accessRole: "admin",
      assignedTypes: defaultAssignedDemandTypes()
    };
  }

  return profiles;
}

function normalizeApprovalState(rawApproval = {}) {
  const clients = normalizeObjectCollection(rawApproval?.clients || {});
  Object.entries(clients).forEach(([id, client]) => {
    clients[id] = normalizeApprovalClient(client, id);
  });
  return {
    clients,
    clientFolders: normalizeClientFolders(rawApproval?.clientFolders || {}, clients)
  };
}

function normalizeClientFolders(rawFolders = {}, clients = state.data?.approval?.clients || {}) {
  const folders = normalizeObjectCollection(rawFolders);
  Object.entries(folders).forEach(([id, folder]) => {
    const seen = new Set();
    const clientIds = asArray(folder.clientIds).map(String).filter((clientId) => {
      if (!clientId || seen.has(clientId) || !clients[clientId]) return false;
      seen.add(clientId);
      return true;
    });
    folders[id] = {
      id: folder.id || id,
      name: folder.name || "Grupo de clientes",
      clientIds,
      order: Number(folder.order || 0),
      createdAt: folder.createdAt || Date.now(),
      updatedAt: folder.updatedAt || folder.createdAt || Date.now()
    };
  });
  return folders;
}

function normalizeAgendaEvents(value = []) {
  return asArray(value).map((event) => ({
    id: event.id || newId("event"),
    title: event.title || "Compromisso",
    type: event.type || "meeting",
    date: event.date || isoDate(new Date()),
    time: event.time || "",
    endTime: event.endTime || "",
    desc: event.desc || "",
    createdBy: event.createdBy || "",
    createdAt: event.createdAt || Date.now(),
    updatedAt: event.updatedAt || event.createdAt || Date.now()
  })).sort((a, b) => `${a.date}T${a.time || "00:00"}`.localeCompare(`${b.date}T${b.time || "00:00"}`));
}

function normalizeWeek(week, profiles) {
  const start = week.startDate ? parseISODate(week.startDate) : startOfWeek(new Date());
  const normalized = {
    id: week.id || newId("week"),
    title: week.title || weekRangeLabel(start),
    startDate: week.startDate || isoDate(start),
    endDate: week.endDate || isoDate(addDays(start, 6)),
    people: week.people || {}
  };
  Object.keys(profiles).forEach((personId) => ensureWeekPerson(normalized, personId));
  Object.keys(normalized.people).forEach((personId) => {
    demandTypes.forEach((type) => {
      normalized.people[personId][type.id] = asArray(normalized.people[personId][type.id]).map((demand) => ({
        id: demand.id || newId("dem"),
        title: demand.title || "Demanda",
        client: demand.client || "",
        type: demand.type || type.id,
        dueDate: demand.dueDate || "",
        estimateMinutes: Number(demand.estimateMinutes || 0),
        difficulty: demand.difficulty || "none",
        notes: demand.notes || "",
        done: Boolean(demand.done),
        timeMinutes: Number(demand.timeMinutes || 0),
        runningStartedAt: demand.runningStartedAt || null,
        createdAt: demand.createdAt || Date.now(),
        completedAt: demand.completedAt || null
      }));
    });
  });
  return normalized;
}

function normalizeObjectCollection(value) {
  if (!value) return {};
  if (!Array.isArray(value)) return value;
  return value.filter(Boolean).reduce((acc, item) => {
    const id = item.id || newId("item");
    acc[id] = { ...item, id };
    return acc;
  }, {});
}

function normalizeApprovalStatus(status = "prov") {
  const current = approvalStatusAliases[status] || status || "prov";
  return approvalStatuses[current] ? current : "prov";
}

function normalizeCreativeMedia(card = {}) {
  const items = asArray(card.media).map((item) => normalizeMediaItem(item)).filter(Boolean);
  if (card.imageUrl && !items.some((item) => item.type === "image" && item.url === card.imageUrl)) {
    items.unshift({
      id: card.imageMediaId || newId("media"),
      type: "image",
      url: card.imageUrl,
      label: "Imagem",
      createdAt: card.createdAt || Date.now()
    });
  }
  const linkUrl = card.driveUrl || card.reelUrl || card.videoUrl || card.mediaUrl || "";
  if (linkUrl && !items.some((item) => item.type === "link" && item.url === linkUrl)) {
    items.push({
      id: card.linkMediaId || newId("media"),
      type: "link",
      url: linkUrl,
      label: "Drive/Reels",
      createdAt: card.createdAt || Date.now()
    });
  }
  return items;
}

function normalizeMediaItem(item = {}) {
  const url = String(item.url || item.src || "").trim();
  if (!url) return null;
  const type = item.type === "link" || item.kind === "link" ? "link" : "image";
  return {
    id: item.id || newId("media"),
    type,
    url,
    label: item.label || (type === "link" ? "Drive/Reels" : "Imagem"),
    createdAt: item.createdAt || Date.now()
  };
}

function normalizeApprovalClient(client = {}, id = newId("client")) {
  const normalized = {
    ...client,
    id,
    name: client.name || "Cliente",
    email: client.email || "",
    color: client.color || colorFromString(client.name || id),
    logoUrl: client.logoUrl || "",
    portalEnabled: client.portalEnabled !== false,
    portalCreatedAt: client.portalCreatedAt || client.createdAt || Date.now(),
    portalUpdatedAt: client.portalUpdatedAt || client.updatedAt || Date.now(),
    briefings: asArray(client.briefings),
    groups: normalizeObjectCollection(client.groups)
  };

  const legacyCreatives = normalizeObjectCollection(client.creatives);
  if (Object.keys(legacyCreatives).length) {
    const legacyGroupId = "group_importado";
    normalized.groups[legacyGroupId] ||= {
      id: legacyGroupId,
      name: "Semana 1",
      createdAt: client.createdAt || Date.now(),
      cards: {}
    };
    normalized.groups[legacyGroupId].cards = {
      ...normalizeObjectCollection(normalized.groups[legacyGroupId].cards),
      ...legacyCreatives
    };
  }

  Object.entries(normalized.groups).forEach(([groupId, group]) => {
    const cards = normalizeObjectCollection(group.cards);
    Object.entries(cards).forEach(([cardId, card]) => {
      const media = normalizeCreativeMedia(card);
      const imageUrl = media.find((item) => item.type === "image")?.url || "";
      const driveUrl = media.find((item) => item.type === "link")?.url || "";
      cards[cardId] = {
        id: card.id || cardId,
        title: card.title || "Sem título",
        caption: card.caption || "",
        format: card.format || "Feed",
        status: normalizeApprovalStatus(card.status),
        media,
        imageUrl,
        driveUrl,
        comments: asArray(card.comments),
        revisionAlert: card.revisionAlert || "",
        scheduledDate: card.scheduledDate || "",
        scheduledTime: card.scheduledTime || "",
        scheduleOrder: Number(card.scheduleOrder || 0),
        internalApprovedAt: card.internalApprovedAt || null,
        internalRejectedAt: card.internalRejectedAt || null,
        sentToClientAt: card.sentToClientAt || null,
        clientApprovedAt: card.clientApprovedAt || null,
        clientRejectedAt: card.clientRejectedAt || null,
        correctedAt: card.correctedAt || null,
        postedAt: card.postedAt || null,
        createdAt: card.createdAt || Date.now(),
        updatedAt: card.updatedAt || card.createdAt || Date.now()
      };
    });
    normalized.groups[groupId] = {
      id: group.id || groupId,
      name: group.name || "Grupo",
      order: Number(group.order || 0),
      createdAt: group.createdAt || Date.now(),
      updatedAt: group.updatedAt || group.createdAt || Date.now(),
      cards
    };
  });

  normalized.creatives = {};
  return normalized;
}

function seedData(user) {
  const today = new Date();
  const start = startOfWeek(today);
  const userId = user?.uid || "person_owner";
  const profiles = {
    [userId]: {
      id: userId,
      name: user?.displayName || user?.email?.split("@")[0] || "Linniker",
      role: "Owner",
      color: "#3B82F6",
      accessRole: "admin"
    },
    person_design: { id: "person_design", name: "Ana Design", role: "Designer", color: "#A78BFA", accessRole: "creator" },
    person_social: { id: "person_social", name: "Bruno Social", role: "Social media", color: "#34D399", accessRole: "creator" }
  };

  const week = createWeek(start, profiles);
  week.people[userId].mensal.push(seedDemand("Calendário editorial da semana", "Krio", "mensal", addDays(start, 1), 90));
  week.people[userId].planejamento.push(seedDemand("Roteiro da campanha principal", "Krio", "planejamento", addDays(start, 2), 120));
  week.people.person_design.avulso.push(seedDemand("Criativo para lançamento", "Cliente Alpha", "avulso", addDays(start, 3), 80));
  week.people.person_social.aprovacao.push({ ...seedDemand("Enviar peças para aprovação", "Cliente Beta", "aprovacao", addDays(start, 4), 45), done: true, completedAt: Date.now() - 86400000, timeMinutes: 38 });

  return {
    meta: {
      name: "Workspace Krio",
      slug: "workspace-krio",
      inviteCode: "KRIO-DEMO1",
      inviteUpdatedAt: Date.now(),
      plan: "manual_license",
      licenseStatus: "active",
      licenseType: "direct_sale",
      billingStatus: "manual_license"
    },
    billing: {
      status: "manual_license",
      provider: "manual"
    },
    profiles,
    tracker: { weeks: [week], events: [], trash: [] },
    approval: {
      clientFolders: {},
      clients: {
        client_alpha: {
          id: "client_alpha",
          name: "Cliente Alpha",
          color: "#3B82F6",
          email: "cliente.alpha@exemplo.com",
          groups: {
            group_semana_1: {
              id: "group_semana_1",
              name: "Semana 1",
              createdAt: Date.now() - 172800000,
              cards: {
                creative_1: {
                  id: "creative_1",
                  title: "Post de lançamento",
                  format: "Feed",
                  status: "prov",
                  caption: "Legenda inicial para revisar com a equipe.",
                  imageUrl: "",
                  comments: [{ id: "comment_1", author: "Krio", text: "Aguardando retorno do cliente.", createdAt: Date.now() - 7200000 }],
                  createdAt: Date.now() - 7200000,
                  updatedAt: Date.now()
                }
              }
            }
          }
        },
        client_beta: {
          id: "client_beta",
          name: "Cliente Beta",
          color: "#34D399",
          email: "cliente.beta@exemplo.com",
          groups: {
            group_semana_1: {
              id: "group_semana_1",
              name: "Semana 1",
              createdAt: Date.now() - 86400000,
              cards: {
                creative_2: {
                  id: "creative_2",
                  title: "Story promocional",
                  format: "Story",
                  status: "internalApproved",
                  imageUrl: "",
                  comments: [],
                  createdAt: Date.now() - 86400000,
                  updatedAt: Date.now() - 86400000
                }
              }
            }
          }
        }
      }
    }
  };
}

function seedDemand(title, client, type, dueDate, estimateMinutes) {
  return {
    id: newId("dem"),
    title,
    client,
    type,
    dueDate: isoDate(dueDate),
    estimateMinutes,
    difficulty: "some",
    notes: "",
    done: false,
    timeMinutes: 0,
    runningStartedAt: null,
    createdAt: Date.now(),
    completedAt: null
  };
}

function createWeek(start, profiles = state.data?.profiles || {}) {
  const week = {
    id: newId("week"),
    title: weekRangeLabel(start),
    startDate: isoDate(start),
    endDate: isoDate(addDays(start, 6)),
    people: {}
  };
  Object.keys(profiles).forEach((personId) => ensureWeekPerson(week, personId));
  return week;
}

function ensureWeekPerson(week, personId) {
  week.people ||= {};
  week.people[personId] ||= {};
  demandTypes.forEach((type) => {
    week.people[personId][type.id] ||= [];
  });
  return week.people[personId];
}

function currentWeek() {
  if (!state.data.tracker.weeks.length) {
    state.data.tracker.weeks.push(createWeek(startOfWeek(new Date()), state.data.profiles));
  }

  const today = isoDate(new Date());
  const index = state.data.tracker.weeks.findIndex((week) => week.startDate <= today && week.endDate >= today);
  if (state.currentWeekIndex >= state.data.tracker.weeks.length) state.currentWeekIndex = state.data.tracker.weeks.length - 1;
  if (state.currentWeekIndex < 0) state.currentWeekIndex = Math.max(0, index);
  return state.data.tracker.weeks[state.currentWeekIndex] || state.data.tracker.weeks[0];
}

function getWeekDemandRefs(week) {
  return Object.entries(week.people || {}).flatMap(([personId, groups]) => {
    const person = getProfile(personId) || { id: personId, name: "Pessoa", color: "#3B82F6" };
    return demandTypes.flatMap((type) => asArray(groups[type.id]).map((demand) => ({ week, person, personId, type: type.id, demand })));
  });
}

function getVisibleWeekDemandRefs(week) {
  return getWeekDemandRefs(week).filter(({ personId }) => canViewPerson(personId));
}

function getAllDemandRefs() {
  return state.data.tracker.weeks.flatMap((week) => getWeekDemandRefs(week));
}

function getVisibleDemandRefs() {
  return state.data.tracker.weeks.flatMap((week) => getVisibleWeekDemandRefs(week));
}

function getCreatorWeekDemandRefs(week) {
  return getWeekDemandRefs(week).filter(({ person }) => isCreatorProfile(person));
}

function getCreatorDemandRefs() {
  return getAllDemandRefs().filter(({ person }) => isCreatorProfile(person));
}

function findDemand(id) {
  return getAllDemandRefs().find(({ demand }) => demand.id === id);
}

function removeDemandFromWeek(week, personId, type, id) {
  const list = week.people?.[personId]?.[type] || [];
  const index = list.findIndex((demand) => demand.id === id);
  if (index >= 0) list.splice(index, 1);
}

function getProfiles() {
  return Object.values(state.data.profiles || {}).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

function getProfile(id) {
  return state.data.profiles?.[id] || null;
}

function getClients() {
  return Object.values(state.data.approval.clients || {}).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

function getClient(id) {
  return state.data.approval.clients?.[id] || null;
}

function clientPortalUrl(client) {
  const id = typeof client === "string" ? client : client?.id || "";
  const origin = window.location.origin && window.location.origin !== "null"
    ? window.location.origin
    : window.location.href.replace(/\/[^/]*$/, "");
  const suffix = state.demoMode ? "?demo=1" : "";
  return `${origin}/approval/${encodeURIComponent(id)}${suffix}`;
}

async function copyClientPortalLink(clientId) {
  const client = getClient(clientId);
  if (!client) return;
  const url = clientPortalUrl(client);
  try {
    await navigator.clipboard?.writeText(url);
    setSyncState("online", "Link do portal copiado");
  } catch {
    window.prompt("Copie o link do portal", url);
  }
}
function getClientFolders() {
  return Object.values(state.data.approval.clientFolders || {}).map((folder) => ({
    ...folder,
    clientIds: uniqueClientIds(folder.clientIds)
  })).sort((a, b) => {
    const order = Number(a.order || 0) - Number(b.order || 0);
    if (order !== 0) return order;
    return (a.createdAt || 0) - (b.createdAt || 0);
  });
}

function getClientFolder(id) {
  return state.data.approval.clientFolders?.[id] || null;
}

function uniqueClientIds(ids = []) {
  const seen = new Set();
  return asArray(ids).map(String).filter((id) => {
    if (!id || seen.has(id) || !getClient(id)) return false;
    seen.add(id);
    return true;
  });
}

function groupedClientIdSet(exceptFolderId = "") {
  return getClientFolders().reduce((set, folder) => {
    if (folder.id === exceptFolderId) return set;
    folder.clientIds.forEach((id) => set.add(id));
    return set;
  }, new Set());
}

function getUngroupedClients() {
  const grouped = groupedClientIdSet();
  return getClients().filter((client) => !grouped.has(client.id));
}

function isClientFolderOpen(id) {
  return Boolean(state.approvalOpenClientFolders?.[id]);
}

function getApprovalGroups(client) {
  return Object.values(client?.groups || {}).sort((a, b) => {
    const order = Number(a.order || 0) - Number(b.order || 0);
    if (order !== 0) return order;
    return (a.createdAt || 0) - (b.createdAt || 0);
  });
}

function getGroupCards(group) {
  return Object.values(group?.cards || {}).map((creative) => ({
    ...creative,
    groupId: group.id,
    groupName: group.name,
    status: normalizeApprovalStatus(creative.status)
  })).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
}

function getCreativeMedia(creative = {}) {
  return normalizeCreativeMedia(creative);
}

function getCreativeImages(creative = {}) {
  return getCreativeMedia(creative).filter((item) => item.type === "image");
}

function getCreativeLinks(creative = {}) {
  return getCreativeMedia(creative).filter((item) => item.type === "link");
}

function renderCreativeCover(creative) {
  const media = getCreativeMedia(creative);
  const images = media.filter((item) => item.type === "image");
  const links = media.filter((item) => item.type === "link");
  const firstImage = images[0];
  const badge = media.length > 1
    ? `<span class="approval-media-count">${media.length} anexos</span>`
    : links.length
      ? `<span class="approval-media-count">link</span>`
      : "";

  if (firstImage) {
    return `
      <div class="approval-media-cover">
        <img src="${attr(firstImage.url)}" alt="${attr(creative.title || "Criativo")}">
        ${badge}
      </div>`;
  }

  if (links.length) {
    return `
      <div class="approval-creative-ph approval-link-cover">
        ${icons.send}
        <span>Drive/Reels</span>
        <small>${esc(domainFromUrl(links[0].url))}</small>
        ${badge}
      </div>`;
  }

  return `<div class="approval-creative-ph">Sem imagem</div>`;
}

function renderCreativeMediaDetail(creative) {
  const images = getCreativeImages(creative);
  const links = getCreativeLinks(creative);
  if (!images.length && !links.length) return `<div class="approval-detail-ph">Sem imagem</div>`;

  return `
    <section class="approval-media-detail" aria-label="Midias anexadas">
      ${images.length ? `
        <div class="approval-media-grid ${images.length === 1 ? "single" : ""}">
          ${images.map((item, index) => `
            <button class="approval-image-button" type="button" data-action="openLightbox" data-src="${attr(item.url)}" aria-label="Abrir imagem ${index + 1}">
              <img src="${attr(item.url)}" alt="${attr(creative.title || `Imagem ${index + 1}`)}">
            </button>`).join("")}
        </div>` : ""}
      ${links.length ? `
        <div class="approval-link-list">
          ${links.map((item) => `
            <a class="approval-media-link-card" href="${attr(item.url)}" target="_blank" rel="noopener noreferrer">
              ${icons.send}
              <span>${esc(item.label || "Drive/Reels")}</span>
              <small>${esc(domainFromUrl(item.url))}</small>
            </a>`).join("")}
        </div>` : ""}
    </section>`;
}

function renderCreativeMediaPreview(media = []) {
  const items = asArray(media).map((item) => normalizeMediaItem(item)).filter(Boolean);
  if (!items.length) return `<span>Arraste imagens aqui</span>`;
  return `
    <div class="approval-upload-preview-grid">
      ${items.map((item) => item.type === "image"
        ? `<img src="${attr(item.url)}" alt="${attr(item.label || "Imagem")}">`
        : `<span class="approval-preview-link">${icons.send}<strong>${esc(item.label || "Drive/Reels")}</strong><small>${esc(domainFromUrl(item.url))}</small></span>`
      ).join("")}
    </div>`;
}

function domainFromUrl(url = "") {
  try {
    return new URL(url).hostname.replace(/^www\./, "") || "Link anexado";
  } catch (error) {
    return "Link anexado";
  }
}

function getCreatives(client) {
  return getApprovalGroups(client)
    .flatMap((group) => getGroupCards(group))
    .sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
}

function getCreative(id) {
  return findCreative(id)?.creative || null;
}

function findCreative(id, client = getClient(state.approvalClientId)) {
  if (!id) return null;
  if (!client) {
    for (const candidate of getClients()) {
      const found = findCreative(id, candidate);
      if (found) return found;
    }
    return null;
  }
  for (const group of getApprovalGroups(client)) {
    const creative = group.cards?.[id];
    if (creative) return { client, group, groupId: group.id, creative };
  }
  return null;
}

function countCreativesByStatus(creatives) {
  return creatives.reduce((acc, creative) => {
    const status = normalizeApprovalStatus(creative.status);
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, { prov: 0, internalApproved: 0, internalRejected: 0, clientReview: 0, scheduled: 0, posted: 0 });
}

function getApprovalQueueStats() {
  return getClients().reduce((acc, client) => {
    getCreatives(client).forEach((creative) => {
      const status = normalizeApprovalStatus(creative.status);
      acc[status] = (acc[status] || 0) + 1;
    });
    return acc;
  }, { prov: 0, internalApproved: 0, internalRejected: 0, clientReview: 0, scheduled: 0, posted: 0 });
}

function getRefactionCreatives() {
  return getClients()
    .flatMap((client) => getApprovalGroups(client).flatMap((group) => {
      return getGroupCards(group)
        .filter((creative) => normalizeApprovalStatus(creative.status) === "internalRejected")
        .map((creative) => ({ client, group, groupId: group.id, creative }));
    }))
    .sort((a, b) => Number(b.creative.updatedAt || 0) - Number(a.creative.updatedAt || 0));
}

function syncPostedCreatives() {
  const now = Date.now();
  let changed = false;

  getClients().forEach((client) => {
    getApprovalGroups(client).forEach((group) => {
      Object.values(group.cards || {}).forEach((creative) => {
        if (normalizeApprovalStatus(creative.status) !== "scheduled") return;
        if (!shouldAutoPostCreative(creative, now)) return;
        creative.status = "posted";
        creative.postedAt = creative.postedAt || Date.now();
        creative.updatedAt = Date.now();
        changed = true;
      });
    });
  });

  if (changed) persist();
  return changed;
}

function scheduleSortKey(creative) {
  const date = creative.scheduledDate || "9999-12-31";
  const time = creative.scheduledTime || "23:59";
  return `${date}T${time}`;
}

function shouldAutoPostCreative(creative, now = Date.now()) {
  const scheduledAt = scheduledPublishTime(creative);
  return Number.isFinite(scheduledAt) && scheduledAt <= now;
}

function scheduledPublishTime(creative) {
  if (!creative?.scheduledDate) return NaN;
  const [year, month, day] = String(creative.scheduledDate).split("-").map(Number);
  if (!year || !month || !day) return NaN;
  const [hour = 23, minute = 59] = String(creative.scheduledTime || "23:59").split(":").map(Number);
  return new Date(year, month - 1, day, Number(hour || 0), Number(minute || 0), 0, 0).getTime();
}

function getWeekStats(week, refs = getWeekDemandRefs(week)) {
  const total = refs.length;
  const done = refs.filter(({ demand }) => demand.done).length;
  const pending = total - done;
  const minutes = refs.reduce((sum, { demand }) => sum + effectiveMinutes(demand), 0);
  const overdue = refs.filter(({ demand }) => isOverdue(demand)).length;
  return {
    total,
    done,
    pending,
    minutes,
    overdue,
    progress: percent(done, total)
  };
}

function getPersonStats(personWeek) {
  const all = demandTypes.flatMap((type) => asArray(personWeek[type.id]));
  const done = all.filter((demand) => demand.done).length;
  return { total: all.length, done, progress: percent(done, all.length) };
}

function statCard(value, label) {
  return `<div class="tracker-stat-card"><strong>${esc(value)}</strong><span>${esc(label)}</span></div>`;
}

function trackerSectionHead(title, subtitle, action = "") {
  return `
    <div class="tracker-section-head">
      <div><h3>${esc(title)}</h3><p>${esc(subtitle)}</p></div>
      ${action || ""}
    </div>`;
}

function effectiveMinutes(demand) {
  const base = Number(demand.timeMinutes || 0);
  if (!demand.runningStartedAt) return base;
  return base + Math.max(1, Math.floor((Date.now() - demand.runningStartedAt) / 60000));
}

function effectiveSeconds(demand) {
  const base = Number(demand.timeMinutes || 0) * 60;
  if (!demand.runningStartedAt) return base;
  return base + Math.max(0, Math.floor((Date.now() - demand.runningStartedAt) / 1000));
}

function isOverdue(demand) {
  return Boolean(demand.dueDate && !demand.done && demand.dueDate < isoDate(new Date()));
}

function percent(value, total) {
  if (!total) return 0;
  return Math.round((Number(value || 0) / Number(total)) * 100);
}

function formatDuration(minutes) {
  const total = Number(minutes || 0);
  if (total < 60) return `${total}m`;
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  return mins ? `${hours}h ${mins}m` : `${hours}h`;
}

function parseDurationToMinutes(value) {
  const text = String(value || "").toLowerCase().replace(",", ".").trim();
  if (!text) return 0;
  const clock = text.match(/^(\d+):(\d{1,2})$/);
  if (clock) return Math.max(0, (Number(clock[1]) * 60) + Number(clock[2]));
  const hourMinute = text.match(/(\d+(?:\.\d+)?)\s*h(?:\s*(\d+)\s*m?)?/);
  if (hourMinute) {
    return Math.max(0, Math.round((Number(hourMinute[1]) * 60) + Number(hourMinute[2] || 0)));
  }
  const hours = text.match(/(\d+(?:\.\d+)?)\s*h/);
  const minutes = text.match(/(\d+)\s*(m|min)/);
  if (hours || minutes) {
    return Math.max(0, Math.round((Number(hours?.[1] || 0) * 60) + Number(minutes?.[1] || 0)));
  }
  const numeric = Number(text.replace(/[^\d.]/g, ""));
  return Math.max(0, Math.round(Number.isFinite(numeric) ? numeric : 0));
}

function formatClock(seconds) {
  const total = Math.max(0, Number(seconds || 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hours) return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

function formatDate(value) {
  if (!value) return "Sem prazo";
  const date = parseISODate(value);
  const months = ["jan.", "fev.", "mar.", "abr.", "mai.", "jun.", "jul.", "ago.", "set.", "out.", "nov.", "dez."];
  return `${String(date.getDate()).padStart(2, "0")} de ${months[date.getMonth()]}`;
}

function formatDateTime(value) {
  if (!value) return "Sem registro";
  const date = new Date(value);
  const months = ["jan.", "fev.", "mar.", "abr.", "mai.", "jun.", "jul.", "ago.", "set.", "out.", "nov.", "dez."];
  return `${String(date.getDate()).padStart(2, "0")} de ${months[date.getMonth()]}, ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function fileToDataUrl(file, options = {}) {
  if (!file) return Promise.resolve("");
  const maxSide = Number(options.maxSide || 1600);
  const quality = Number(options.quality || 0.84);
  const outputType = options.outputType || "";
  const background = options.background || "";

  const readRaw = () => new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });

  if (!file.type?.startsWith("image/")) return readRaw();

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(String(reader.result || ""));
          return;
        }
        if (background) {
          ctx.fillStyle = background;
          ctx.fillRect(0, 0, width, height);
        }
        ctx.drawImage(image, 0, 0, width, height);
        const type = outputType || (file.type === "image/png" || file.type === "image/webp" ? file.type : "image/jpeg");
        resolve(canvas.toDataURL(type, quality));
      };
      image.onerror = () => resolve(String(reader.result || ""));
      image.src = String(reader.result || "");
    };
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}

function formatMonth(date) {
  const months = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  return `${months[date.getMonth()]} de ${date.getFullYear()}`;
}

function formatWeekday(date) {
  return ["dom.", "seg.", "ter.", "qua.", "qui.", "sex.", "sáb."][date.getDay()];
}

function weekRangeLabel(start) {
  return `${formatDate(isoDate(start))} - ${formatDate(isoDate(addDays(start, 6)))}`;
}

function parseISODate(value) {
  if (value instanceof Date) return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  const [year, month, day] = String(value || isoDate(new Date())).split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

function isoDate(date) {
  const local = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const year = local.getFullYear();
  const month = String(local.getMonth() + 1).padStart(2, "0");
  const day = String(local.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfWeek(date) {
  const d = parseISODate(isoDate(date));
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return d;
}

function addDays(date, days) {
  const next = parseISODate(isoDate(date));
  next.setDate(next.getDate() + days);
  return next;
}

function asArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (value && typeof value === "object") return Object.values(value).filter(Boolean);
  return [];
}

function saveLocalState() {
  try {
    localStorage.setItem(storageKey(), JSON.stringify(state.data));
    return true;
  } catch (error) {
    setSyncState("offline", "Cópia local cheia. O Firebase continua sendo sincronizado quando disponível.");
    return false;
  }
}

function loadLocalState() {
  try {
    return JSON.parse(localStorage.getItem(storageKey()) || "");
  } catch (error) {
    return null;
  }
}

function storageKey() {
  return `krio-state:${state.tenantId || state.user?.uid || "demo"}`;
}

function newId(prefix = "id") {
  const body = crypto.randomUUID
    ? crypto.randomUUID().replace(/-/g, "").slice(0, 18)
    : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  return prefix ? `${prefix}_${body}` : body;
}

function slugify(text = "") {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 48) || "workspace";
}

function colorFromString(text = "") {
  const colors = ["#3B82F6", "#34D399", "#A78BFA", "#FBBF24", "#F87171", "#60A5FA"];
  const index = String(text).split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) % colors.length;
  return colors[index];
}

function initials(name = "K") {
  return esc(String(name).trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "K");
}

function difficultyLabel(value) {
  return { none: "Sem dificuldade", some: "Leve", hard: "Alta" }[value] || "Leve";
}

function esc(value = "") {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function attr(value = "") {
  return esc(value).replace(/`/g, "&#96;");
}

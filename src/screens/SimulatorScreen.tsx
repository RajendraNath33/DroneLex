// src/screens/SimulatorScreen.tsx  (3D version — requires: npm i three && npm i -D @types/three)
import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { askDgca } from "../lib/dgcaApi";

/* ───────────── Config (adjust to your DGCA manuals) ───────────── */
const WORLD = 1000; // map is 1000 m x 1000 m
const HOME = { x: 500, y: 700 };
const RULES = {
  greenMaxAltM: 120, // 400 ft AGL
  vlosM: 500,
  ceilingM: 250,
  maxSpeed: 25, // m/s
  maxClimb: 12, // m/s
  yawRate: 1.6, // rad/s
};

type ZoneType = "red" | "yellow" | "green";
interface Zone {
  id: string;
  name: string;
  type: Exclude<ZoneType, "green">;
  cx: number;
  cy: number;
  r: number;
}

const ZONES: Zone[] = [
  { id: "apt-y", name: "Airport approach – Yellow", type: "yellow", cx: 760, cy: 230, r: 260 },
  { id: "gov-y", name: "Sensitive area buffer – Yellow", type: "yellow", cx: 210, cy: 620, r: 170 },
  { id: "apt-r", name: "Airport perimeter", type: "red", cx: 760, cy: 230, r: 120 },
  { id: "gov-r", name: "Govt / defence installation", type: "red", cx: 210, cy: 620, r: 80 },
];

const ZONE_COLOR: Record<ZoneType, { hex: number; stroke: string; label: string; chip: string }> = {
  red: { hex: 0xdc2626, stroke: "#B91C1C", label: "Red Zone", chip: "bg-red-600 text-white" },
  yellow: { hex: 0xeab308, stroke: "#A16207", label: "Yellow Zone", chip: "bg-amber-400 text-amber-950" },
  green: { hex: 0x16a34a, stroke: "#15803D", label: "Green Zone", chip: "bg-emerald-600 text-white" },
};

/* ───────────── Rule evaluation ───────────── */
type ViolationCode = "RED_ZONE" | "YELLOW_ZONE" | "MAX_ALTITUDE" | "VLOS";

interface Violation {
  code: ViolationCode;
  title: string;
  summary: string;
  context: string;
}

function zoneAt(x: number, y: number): { type: ZoneType; zone?: Zone } {
  let found: Zone | undefined;
  for (const z of ZONES) {
    if (Math.hypot(x - z.cx, y - z.cy) <= z.r) {
      if (!found || z.type === "red") found = z;
    }
  }
  return found ? { type: found.type, zone: found } : { type: "green" };
}

function evaluate(x: number, y: number, alt: number, hasPermission: boolean): Violation | null {
  const { type, zone } = zoneAt(x, y);
  const distHome = Math.hypot(x - HOME.x, y - HOME.y);
  const altFt = Math.round(alt * 3.281);

  if (type === "red") {
    return {
      code: "RED_ZONE",
      title: "Red Zone में प्रवेश",
      summary: "यह प्रतिबंधित क्षेत्र है। Red Zone में ड्रोन उड़ाने के लिए केंद्र सरकार की अनुमति आवश्यक है।",
      context: `ड्रोन "${zone?.name}" नाम के Red Zone में ${Math.round(alt)} m (${altFt} ft) ऊँचाई पर घुस गया।`,
    };
  }
  if (type === "yellow" && !hasPermission) {
    return {
      code: "YELLOW_ZONE",
      title: "Yellow Zone में बिना अनुमति उड़ान",
      summary: "यह नियंत्रित हवाई क्षेत्र है। उड़ान से पहले संबंधित ATC/प्राधिकरण की अनुमति लेनी होती है।",
      context: `ड्रोन "${zone?.name}" में ${Math.round(alt)} m (${altFt} ft) ऊँचाई पर बिना ATC अनुमति के उड़ रहा था।`,
    };
  }
  if (type === "green" && alt > RULES.greenMaxAltM) {
    return {
      code: "MAX_ALTITUDE",
      title: "अधिकतम ऊँचाई सीमा पार",
      summary: "Green Zone में ड्रोन ज़मीन से अधिकतम 400 ft (120 m) तक ही उड़ाया जा सकता है।",
      context: `ड्रोन Green Zone में ${Math.round(alt)} m (${altFt} ft) पर पहुँच गया, जबकि सीमा 120 m (400 ft) है।`,
    };
  }
  if (distHome > RULES.vlosM) {
    return {
      code: "VLOS",
      title: "Visual Line of Sight (VLOS) टूटी",
      summary: "ड्रोन हमेशा रिमोट पायलट की सीधी नज़र में रहना चाहिए।",
      context: `ड्रोन पायलट से ${Math.round(distHome)} m दूर चला गया, जो VLOS सीमा (लगभग ${RULES.vlosM} m) से ज़्यादा है।`,
    };
  }
  return null;
}

function buildQuestion(v: Violation): string {
  return (
    `मैं ड्रोन सिम्युलेटर में ट्रेनिंग कर रहा हूँ और मुझसे यह उल्लंघन हुआ: ${v.title}. ${v.context} ` +
    `कृपया उपलब्ध DGCA ड्रोन नियम, SOP और एविएशन मैनुअल के आधार पर बताइए: ` +
    `1) कौन सा नियम/प्रावधान टूटा, 2) इसका कारण क्या है, 3) सही तरीका क्या है (अनुमति कैसे और कहाँ से लें), ` +
    `4) असली उड़ान में संभावित परिणाम। जवाब सरल हिंदी में, छोटे बिंदुओं में दें।`
  );
}

/* ───────────── Input mapping ───────────── */
type Action = "forward" | "back" | "left" | "right" | "up" | "down" | "yawL" | "yawR";
const KEY_MAP: Record<string, Action> = {
  w: "forward", arrowup: "forward",
  s: "back", arrowdown: "back",
  a: "left", d: "right",
  q: "yawL", arrowleft: "yawL",
  e: "yawR", arrowright: "yawR",
  r: "up", pageup: "up", " ": "up",
  f: "down", pagedown: "down", shift: "down",
};

const CAMS = ["Chase", "FPV", "Top"] as const;

/* ───────────── Game: maps & levels ───────────── */
type Ring = [number, number, number]; // map x, map y, altitude (m)
interface Level { name: string; par: number; rings: Ring[] }
interface GameMap { name: string; desc: string; atc: boolean; sky: number; ground: number; levels: Level[] }
const RING_R = 9;
const MAPS: GameMap[] = [
  {
    name: "Open Fields", desc: "Green Zone · बुनियादी उड़ान और लैंडिंग", atc: false, sky: 0x9cc7e8, ground: 0x74a86a,
    levels: [
      { name: "First flight", par: 45, rings: [[500, 600, 30], [500, 500, 40], [400, 450, 50]] },
      { name: "Slalom", par: 70, rings: [[600, 600, 40], [700, 520, 60], [650, 400, 80], [500, 380, 60]] },
      { name: "High loop", par: 90, rings: [[350, 600, 50], [300, 450, 90], [450, 350, 110], [600, 420, 70]] },
    ],
  },
  {
    name: "Airport Approach", desc: "Yellow Zone · ATC अनुमति मिली है, Red से दूर रहें", atc: true, sky: 0xd9c9a8, ground: 0xb59f78,
    levels: [
      { name: "Approach", par: 60, rings: [[650, 520, 50], [700, 420, 60], [640, 320, 60]] },
      { name: "Edge run", par: 90, rings: [[700, 500, 50], [820, 430, 60], [880, 500, 70], [780, 380, 60]] },
      { name: "Red edge", par: 110, rings: [[620, 380, 60], [600, 280, 60], [680, 330, 60], [800, 380, 60], [880, 470, 50]] },
    ],
  },
  {
    name: "Restricted Site", desc: "Red Zone के किनारे सटीक उड़ान", atc: true, sky: 0x8fa3b8, ground: 0x6b7f76,
    levels: [
      { name: "Buffer", par: 60, rings: [[330, 720, 40], [380, 600, 60], [300, 480, 70]] },
      { name: "Perimeter", par: 90, rings: [[380, 760, 40], [320, 640, 50], [300, 500, 70], [150, 480, 60]] },
      { name: "Orbit", par: 120, rings: [[210, 500, 50], [320, 570, 50], [320, 680, 50], [210, 750, 50], [100, 680, 50], [100, 570, 50]] },
    ],
  },
];

/* ───────────── 3D helpers ───────────── */
function makeLabel(text: string, color: string) {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 96;
  const g = c.getContext("2d")!;
  g.font = "700 40px system-ui, sans-serif";
  g.textAlign = "center";
  g.fillStyle = "rgba(255,255,255,0.85)";
  g.fillRect(0, 20, 512, 56);
  g.fillStyle = color;
  g.fillText(text, 256, 62);
  const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthWrite: false }));
  spr.scale.set(150, 28, 1);
  return spr;
}

/* ───────────── Component ───────────── */
export default function SimulatorScreen() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);

  const actions = useRef<Set<Action>>(new Set());
  const sim = useRef({
    x: HOME.x, y: HOME.y, alt: 30,
    vx: 0, vy: 0, vz: 0, yaw: 0,
  });
  const safe = useRef({ x: HOME.x, y: HOME.y, alt: 30, yaw: 0 });
  const lastCode = useRef<ViolationCode | null>(null);
  const paused = useRef(true); // starts on the map menu
  const permissionRef = useRef(false);
  const camMode = useRef(0);
  const game = useRef<{ mode: "menu" | "play" | "done"; m: number; l: number; level: Level | null; next: number; time: number; viol: number }>(
    { mode: "menu", m: 0, l: 0, level: null, next: 0, time: 0, viol: 0 },
  );
  const api = useRef<{ load: (rings: Ring[], gm: GameMap) => void } | null>(null);

  const [permission, setPermission] = useState(false);
  const [camLabel, setCamLabel] = useState<string>(CAMS[0]);
  const [violation, setViolation] = useState<Violation | null>(null);
  const [retry, setRetry] = useState(0);
  const [ai, setAi] = useState<{ status: "idle" | "loading" | "done" | "error"; text: string }>({
    status: "idle",
    text: "",
  });
  const [violations, setViolations] = useState(0);
  const [mode, setMode] = useState<"menu" | "play" | "done">("menu");
  const [result, setResult] = useState<{ stars: number; time: number; viol: number } | null>(null);
  const [stars, setStars] = useState<Record<string, number>>(() => {
    try { return JSON.parse(localStorage.getItem("dronelex_stars") || "{}"); } catch { return {}; }
  });
  const [hud, setHud] = useState({ alt: 30, speed: 0, dist: 0, zone: "green" as ZoneType, flight: 0, next: 0, total: 0 });

  useEffect(() => {
    permissionRef.current = permission;
  }, [permission]);

  /* ── Keyboard ── */
  useEffect(() => {
    const isTyping = (t: EventTarget | null) =>
      t instanceof HTMLElement && (t.tagName === "INPUT" || t.tagName === "TEXTAREA");
    const down = (e: KeyboardEvent) => {
      if (isTyping(e.target) || paused.current) return;
      const k = e.key.toLowerCase();
      if (k === "c") return void cycleCam();
      const a = KEY_MAP[k];
      if (a) {
        e.preventDefault();
        actions.current.add(a);
      }
    };
    const up = (e: KeyboardEvent) => {
      const a = KEY_MAP[e.key.toLowerCase()];
      if (a) actions.current.delete(a);
    };
    const clear = () => actions.current.clear();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", clear);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", clear);
    };
  }, []);

  const cycleCam = () => {
    camMode.current = (camMode.current + 1) % CAMS.length;
    setCamLabel(CAMS[camMode.current]);
  };

  /* ── Simulation + 3D rendering loop ── */
  useEffect(() => {
    const wrap = wrapRef.current!;
    const mount = mountRef.current!;
    const M = (x: number, y: number) => new THREE.Vector3(x - WORLD / 2, 0, y - WORLD / 2); // map → 3D

    /* Scene */
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x9cc7e8);
    scene.fog = new THREE.Fog(0x9cc7e8, 500, 2600);
    const camera = new THREE.PerspectiveCamera(60, 1, 0.5, 5000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.cssText = "display:block;width:100%;height:100%";

    scene.add(new THREE.HemisphereLight(0xffffff, 0x4a7a55, 0.9));
    const sun = new THREE.DirectionalLight(0xffffff, 0.9);
    sun.position.set(300, 600, 200);
    scene.add(sun);

    /* Ground */
    const flat = (r: number, hex: number, y: number, op = 1) => {
      const m = new THREE.Mesh(
        new THREE.CircleGeometry(r, 64),
        new THREE.MeshBasicMaterial({ color: hex, transparent: op < 1, opacity: op, depthWrite: false }),
      );
      m.rotation.x = -Math.PI / 2;
      m.position.y = y;
      return m;
    };
    const outer = new THREE.Mesh(
      new THREE.PlaneGeometry(8000, 8000),
      new THREE.MeshLambertMaterial({ color: 0x5f8f5b }),
    );
    outer.rotation.x = -Math.PI / 2;
    outer.position.y = -0.2;
    scene.add(outer);
    const field = new THREE.Mesh(new THREE.PlaneGeometry(WORLD, WORLD), new THREE.MeshLambertMaterial({ color: 0x74a86a }));
    field.rotation.x = -Math.PI / 2;
    scene.add(field);
    const grid = new THREE.GridHelper(WORLD, 10, 0x2f5d3a, 0x3f7a4a);
    grid.position.y = 0.05;
    scene.add(grid);

    /* Zones: ground disc + translucent wall up to the ceiling */
    for (const z of ZONES) {
      const col = ZONE_COLOR[z.type].hex;
      const p = M(z.cx, z.cy);
      const disc = flat(z.r, col, z.type === "red" ? 0.12 : 0.1, 0.35);
      disc.position.x = p.x;
      disc.position.z = p.z;
      scene.add(disc);
      const wall = new THREE.Mesh(
        new THREE.CylinderGeometry(z.r, z.r, RULES.ceilingM, 64, 1, true),
        new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false }),
      );
      wall.position.set(p.x, RULES.ceilingM / 2, p.z);
      scene.add(wall);
      const lbl = makeLabel(z.name, ZONE_COLOR[z.type].stroke);
      lbl.position.set(p.x, z.type === "red" ? 60 : 110, p.z);
      scene.add(lbl);
    }

    /* Airport runway + govt building */
    const apt = M(760, 230);
    const runway = new THREE.Mesh(new THREE.BoxGeometry(190, 0.4, 14), new THREE.MeshLambertMaterial({ color: 0x33363b }));
    runway.position.set(apt.x, 0.2, apt.z);
    runway.rotation.y = 0.4;
    scene.add(runway);
    const gov = M(210, 620);
    const bldg = new THREE.Mesh(new THREE.BoxGeometry(60, 26, 40), new THREE.MeshLambertMaterial({ color: 0x9a8f80 }));
    bldg.position.set(gov.x, 13, gov.z);
    scene.add(bldg);

    /* 120 m altitude limit plane, home pad, VLOS ring */
    const limit = new THREE.Mesh(
      new THREE.PlaneGeometry(WORLD, WORLD),
      new THREE.MeshBasicMaterial({ color: 0xff5a4f, transparent: true, opacity: 0.06, side: THREE.DoubleSide, depthWrite: false }),
    );
    limit.rotation.x = -Math.PI / 2;
    limit.position.y = RULES.greenMaxAltM;
    scene.add(limit);
    const home = M(HOME.x, HOME.y);
    const pad = flat(9, 0x1e40af, 0.15);
    pad.position.set(home.x, 0.15, home.z);
    scene.add(pad);
    const vlos = new THREE.Mesh(
      new THREE.RingGeometry(RULES.vlosM - 1.5, RULES.vlosM, 128),
      new THREE.MeshBasicMaterial({ color: 0x1e40af, transparent: true, opacity: 0.6, side: THREE.DoubleSide }),
    );
    vlos.rotation.x = -Math.PI / 2;
    vlos.position.set(home.x, 0.2, home.z);
    scene.add(vlos);

    /* Trees for depth cues */
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const trees = new THREE.InstancedMesh(
      new THREE.ConeGeometry(4, 14, 6),
      new THREE.MeshLambertMaterial({ color: 0x2f6b3c }),
      160,
    );
    const dummy = new THREE.Object3D();
    let n = 0;
    while (n < 160) {
      const x = rnd() * WORLD;
      const y = rnd() * WORLD;
      if (Math.hypot(x - HOME.x, y - HOME.y) < 50 || zoneAt(x, y).type === "red") continue;
      const p = M(x, y);
      dummy.position.set(p.x, 7, p.z);
      dummy.scale.setScalar(0.7 + rnd() * 0.9);
      dummy.updateMatrix();
      trees.setMatrixAt(n++, dummy.matrix);
    }
    scene.add(trees);

    /* Drone */
    const drone = new THREE.Group();
    drone.rotation.order = "YXZ";
    drone.scale.setScalar(3);
    const dark = new THREE.MeshLambertMaterial({ color: 0x1f2937 });
    drone.add(new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.4, 1.4), dark));
    for (const rot of [Math.PI / 4, -Math.PI / 4]) {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.12, 0.16), dark);
      arm.rotation.y = rot;
      drone.add(arm);
    }
    const rotors: THREE.Mesh[] = [];
    for (const [rx, rz] of [[1.13, 1.13], [-1.13, 1.13], [1.13, -1.13], [-1.13, -1.13]]) {
      const blade = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 0.03, 0.14),
        new THREE.MeshBasicMaterial({ color: 0xf1f5f9, transparent: true, opacity: 0.8 }),
      );
      blade.position.set(rx, 0.12, rz);
      drone.add(blade);
      rotors.push(blade);
    }
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.5, 8), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    nose.rotation.x = -Math.PI / 2;
    nose.position.set(0, 0, -0.85);
    drone.add(nose);
    const ledMat = new THREE.MeshBasicMaterial({ color: ZONE_COLOR.green.hex });
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 12), ledMat);
    led.position.y = 0.3;
    drone.add(led);
    scene.add(drone);

    const shadow = flat(1, 0x000000, 0.25, 0.3);
    scene.add(shadow);
    const linePos = new Float32Array(6);
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.BufferAttribute(linePos, 3));
    const altLine = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0x0f172a, transparent: true, opacity: 0.45 }));
    altLine.frustumCulled = false;
    scene.add(altLine);

    /* Game objects: rings, guide line, landing pad highlight */
    const padMat = pad.material as THREE.MeshBasicMaterial;
    const ringGroup = new THREE.Group();
    scene.add(ringGroup);
    const ringGeo = new THREE.TorusGeometry(RING_R, 0.9, 10, 40);
    const guidePos = new Float32Array(6);
    const guideGeo = new THREE.BufferGeometry();
    guideGeo.setAttribute("position", new THREE.BufferAttribute(guidePos, 3));
    const guide = new THREE.Line(guideGeo, new THREE.LineBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0.7 }));
    guide.frustumCulled = false;
    scene.add(guide);
    api.current = {
      load: (rings, gm) => {
        ringGroup.children.forEach((c) => ((c as THREE.Mesh).material as THREE.Material).dispose());
        ringGroup.clear();
        rings.forEach((r, i) => {
          const mesh = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.4 }));
          const q = M(r[0], r[1]);
          mesh.position.set(q.x, r[2], q.z);
          const a = rings[i - 1] ?? [HOME.x, HOME.y];
          const b = rings[i + 1] ?? [HOME.x, HOME.y];
          mesh.rotation.y = Math.atan2(b[0] - a[0], b[1] - a[1]);
          ringGroup.add(mesh);
        });
        scene.background = new THREE.Color(gm.sky);
        (scene.fog as THREE.Fog).color.set(gm.sky);
        (field.material as THREE.MeshLambertMaterial).color.set(gm.ground);
      },
    };

    /* Sizing */
    const resize = () => {
      const r = wrap.getBoundingClientRect();
      renderer.setSize(r.width, r.height, false);
      camera.aspect = r.width / Math.max(1, r.height);
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    resize();

    const finish = (st: number, time: number, viol: number) => {
      const key = `${game.current.m}-${game.current.l}`;
      setResult({ stars: st, time, viol });
      setMode("done");
      setStars((prev) => {
        const n = { ...prev, [key]: Math.max(prev[key] ?? 0, st) };
        try { localStorage.setItem("dronelex_stars", JSON.stringify(n)); } catch { /* ignore */ }
        return n;
      });
    };

    /* Physics step */
    const step = (dt: number) => {
      const s = sim.current;
      const a = actions.current;
      const f = (a.has("forward") ? 1 : 0) - (a.has("back") ? 1 : 0);
      const r = (a.has("right") ? 1 : 0) - (a.has("left") ? 1 : 0);
      const iz = (a.has("up") ? 1 : 0) - (a.has("down") ? 1 : 0);
      const iyaw = (a.has("yawR") ? 1 : 0) - (a.has("yawL") ? 1 : 0);
      const len = Math.hypot(f, r) || 1;
      const ease = Math.min(1, dt * 2.5);

      s.yaw += iyaw * RULES.yawRate * dt;
      const sy = Math.sin(s.yaw);
      const cy = Math.cos(s.yaw);
      const tx = ((sy * f + cy * r) / len) * RULES.maxSpeed;
      const ty = ((-cy * f + sy * r) / len) * RULES.maxSpeed;
      s.vx += (tx - s.vx) * ease;
      s.vy += (ty - s.vy) * ease;
      s.vz += (iz * RULES.maxClimb - s.vz) * ease;

      s.x = Math.min(WORLD, Math.max(0, s.x + s.vx * dt));
      s.y = Math.min(WORLD, Math.max(0, s.y + s.vy * dt));
      s.alt = Math.min(RULES.ceilingM, Math.max(0, s.alt + s.vz * dt));

      const v = evaluate(s.x, s.y, s.alt, permissionRef.current);
      if (!v) {
        safe.current = { x: s.x, y: s.y, alt: s.alt, yaw: s.yaw };
        lastCode.current = null;
      } else if (v.code !== lastCode.current) {
        lastCode.current = v.code;
        paused.current = true;
        actions.current.clear();
        setViolation(v);
        setViolations((c) => c + 1);
        game.current.viol++;
      }

      const g = game.current;
      if (g.mode === "play" && g.level && !paused.current) {
        g.time += dt;
        const rs = g.level.rings;
        if (g.next < rs.length) {
          const [rx, ry, ra] = rs[g.next];
          if (Math.hypot(s.x - rx, s.y - ry, s.alt - ra) < RING_R) g.next++;
        } else if (Math.hypot(s.x - HOME.x, s.y - HOME.y) < 14 && s.alt < 2 && Math.hypot(s.vx, s.vy) < 6) {
          g.mode = "done";
          paused.current = true;
          actions.current.clear();
          const st = g.viol === 0 && g.time <= g.level.par ? 3 : g.viol <= 1 && g.time <= g.level.par * 1.5 ? 2 : 1;
          finish(st, g.time, g.viol);
        }
      }
    };

    /* Scene update + camera */
    const camPos = new THREE.Vector3();
    const camLook = new THREE.Vector3();
    const tp = new THREE.Vector3();
    const tl = new THREE.Vector3();
    let camInit = false;

    const render = (dt: number) => {
      const s = sim.current;
      const p = M(s.x, s.y);
      const sy = Math.sin(s.yaw);
      const cy = Math.cos(s.yaw);
      const fwdSpeed = s.vx * sy - s.vy * cy;
      const rightSpeed = s.vx * cy + s.vy * sy;

      drone.position.set(p.x, s.alt, p.z);
      drone.rotation.set(-(fwdSpeed / RULES.maxSpeed) * 0.35, -s.yaw, -(rightSpeed / RULES.maxSpeed) * 0.35);
      for (const b of rotors) b.rotation.y += dt * 45;
      ledMat.color.set(ZONE_COLOR[zoneAt(s.x, s.y).type].hex);

      shadow.position.set(p.x, 0.25, p.z);
      shadow.scale.setScalar(3 + s.alt * 0.04);
      (shadow.material as THREE.MeshBasicMaterial).opacity = Math.max(0.1, 0.35 - s.alt / 600);
      linePos.set([p.x, 0.3, p.z, p.x, s.alt, p.z]);
      lineGeo.attributes.position.needsUpdate = true;

      const mode = camMode.current;
      camera.up.set(0, 1, 0);
      if (mode === 0) {
        tp.set(p.x - sy * 24, s.alt + 9, p.z + cy * 24);
        tl.set(p.x + sy * 12, s.alt, p.z - cy * 12);
      } else if (mode === 1) {
        tp.set(p.x + sy * 2.5, s.alt + 0.6, p.z - cy * 2.5);
        tl.set(p.x + sy * 60, s.alt - 6, p.z - cy * 60);
      } else {
        tp.set(p.x, 1000, p.z);
        tl.set(p.x, 0, p.z);
        camera.up.set(0, 0, -1);
      }
      const k = camInit ? 1 - Math.exp(-dt * 5) : 1;
      camInit = true;
      camPos.lerp(tp, k);
      camLook.lerp(tl, k);
      camera.position.copy(camPos);
      camera.lookAt(camLook);
      const g = game.current;
      const total = g.level?.rings.length ?? 0;
      ringGroup.children.forEach((c, i) => {
        const m = c as THREE.Mesh;
        const mat = m.material as THREE.MeshBasicMaterial;
        const cur = i === g.next;
        m.visible = i >= g.next;
        mat.color.set(cur ? 0xfacc15 : 0x38bdf8);
        mat.opacity = cur ? 0.9 : 0.4;
        m.scale.setScalar(cur ? 1 + Math.sin(performance.now() / 200) * 0.06 : 1);
      });
      padMat.color.set(g.mode !== "menu" && total > 0 && g.next >= total ? 0xfacc15 : 0x1e40af);
      const tgt: Ring | null = g.level ? (g.next < total ? g.level.rings[g.next] : [HOME.x, HOME.y, 0]) : null;
      guide.visible = !!tgt && g.mode === "play";
      if (tgt) {
        const q = M(tgt[0], tgt[1]);
        guidePos.set([p.x, s.alt, p.z, q.x, tgt[2], q.z]);
        guideGeo.attributes.position.needsUpdate = true;
      }
      renderer.render(scene, camera);
    };

    let raf = 0;
    let last = performance.now();
    let hudTimer = 0;
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!paused.current) {
        step(dt);
      }
      render(dt);

      hudTimer += dt;
      if (hudTimer > 0.1) {
        hudTimer = 0;
        const s = sim.current;
        setHud({
          alt: s.alt,
          speed: Math.hypot(s.vx, s.vy),
          dist: Math.hypot(s.x - HOME.x, s.y - HOME.y),
          zone: zoneAt(s.x, s.y).type,
          flight: game.current.time,
          next: game.current.next,
          total: game.current.level?.rings.length ?? 0,
        });
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else mat?.dispose();
      });
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  /* ── AI explanation for each violation ── */
  useEffect(() => {
    if (!violation) return;
    const ctrl = new AbortController();
    setAi({ status: "loading", text: "" });
    askDgca(buildQuestion(violation), ctrl.signal)
      .then((text) => setAi({ status: "done", text }))
      .catch(() => {
        if (ctrl.signal.aborted) return;
        setAi({ status: "error", text: "" });
      });
    return () => ctrl.abort();
  }, [violation, retry]);

  const resume = useCallback(() => {
    const s = sim.current;
    Object.assign(s, safe.current, { vx: 0, vy: 0, vz: 0 });
    lastCode.current = null;
    paused.current = false;
    setViolation(null);
    setAi({ status: "idle", text: "" });
  }, []);

  const startLevel = useCallback((m: number, l: number) => {
    const gm = MAPS[m];
    Object.assign(sim.current, { x: HOME.x, y: HOME.y, alt: 30, vx: 0, vy: 0, vz: 0, yaw: 0 });
    safe.current = { x: HOME.x, y: HOME.y, alt: 30, yaw: 0 };
    game.current = { mode: "play", m, l, level: gm.levels[l], next: 0, time: 0, viol: 0 };
    api.current?.load(gm.levels[l].rings, gm);
    actions.current.clear();
    lastCode.current = null;
    paused.current = false;
    setPermission(gm.atc);
    setViolation(null);
    setViolations(0);
    setResult(null);
    setMode("play");
  }, []);

  const reset = useCallback(() => {
    const { m, l, level } = game.current;
    if (level) startLevel(m, l);
  }, [startLevel]);

  const toMenu = useCallback(() => {
    game.current.mode = "menu";
    paused.current = true;
    actions.current.clear();
    setViolation(null);
    setMode("menu");
  }, []);

  const press = (a: Action, on: boolean) => {
    if (paused.current) return;
    if (on) actions.current.add(a);
    else actions.current.delete(a);
  };

  const altOver = hud.alt > RULES.greenMaxAltM;
  const mm = Math.floor(hud.flight / 60);
  const ss = Math.floor(hud.flight % 60).toString().padStart(2, "0");

  return (
    <div className="mx-auto flex h-full w-full max-w-4xl flex-col gap-3 overflow-y-auto p-3 pb-28 md:p-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Drone Flight Simulator 3D</h1>
          <p className="text-sm text-slate-600">DGCA नियमों के साथ सुरक्षित उड़ान की प्रैक्टिस करें</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={permission}
              onChange={(e) => setPermission(e.target.checked)}
              className="h-4 w-4 accent-amber-500"
            />
            ATC अनुमति मिली है
          </label>
          <button
            onClick={reset}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 active:bg-slate-100"
          >
            Restart
          </button>
          <button
            onClick={toMenu}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 active:bg-slate-100"
          >
            Menu
          </button>
        </div>
      </div>

      {/* HUD */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <Stat label="Zone">
          <span className={`rounded px-2 py-0.5 text-sm font-semibold ${ZONE_COLOR[hud.zone].chip}`}>
            {ZONE_COLOR[hud.zone].label}
          </span>
        </Stat>
        <Stat label={`Altitude (limit ${RULES.greenMaxAltM} m)`}>
          <span className={`tabular-nums text-lg font-semibold ${altOver ? "text-red-600" : "text-slate-900"}`}>
            {hud.alt.toFixed(0)} m
          </span>
          <span className="ml-1 text-xs text-slate-500">{Math.round(hud.alt * 3.281)} ft</span>
        </Stat>
        <Stat label="Speed">
          <span className="tabular-nums text-lg font-semibold text-slate-900">{hud.speed.toFixed(0)} m/s</span>
        </Stat>
        <Stat label={`Pilot distance (VLOS ${RULES.vlosM} m)`}>
          <span
            className={`tabular-nums text-lg font-semibold ${hud.dist > RULES.vlosM ? "text-red-600" : "text-slate-900"}`}
          >
            {hud.dist.toFixed(0)} m
          </span>
        </Stat>
        <Stat label="Time · Violations · Rings">
          <span className="tabular-nums text-lg font-semibold text-slate-900">
            {mm}:{ss} · {violations} · {hud.next}/{hud.total}
          </span>
        </Stat>
      </div>

      {/* 3D view */}
      <div
        ref={wrapRef}
        className="relative h-[45vh] min-h-[260px] w-full shrink-0 overflow-hidden rounded-xl border border-slate-300 bg-sky-200"
      >
        <div ref={mountRef} className="absolute inset-0" />

        <div className="pointer-events-none absolute left-2 top-2 flex flex-col gap-1 rounded-lg bg-white/85 p-2 text-xs text-slate-800 shadow-sm">
          <Legend color="bg-emerald-600" text="Green – 400 ft तक अनुमति" />
          <Legend color="bg-amber-400" text="Yellow – ATC अनुमति ज़रूरी" />
          <Legend color="bg-red-600" text="Red – प्रतिबंधित" />
        </div>

        <button
          onClick={cycleCam}
          className="absolute right-2 top-2 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm active:bg-slate-200"
        >
          Camera: {camLabel}
        </button>

        {mode === "play" && (
          <div className="pointer-events-none absolute left-1/2 top-2 -translate-x-1/2 rounded-full bg-slate-900/80 px-3 py-1 text-xs font-semibold text-white">
            {hud.next < hud.total ? `Ring ${hud.next + 1}/${hud.total} से उड़ें` : "अब H पैड पर धीरे से उतरें"}
          </div>
        )}

        {mode === "menu" && (
          <div className="absolute inset-0 overflow-y-auto bg-slate-900/85 p-3 text-white">
            <h2 className="mb-2 text-base font-semibold">Map और level चुनें</h2>
            {MAPS.map((gm, m) => (
              <div key={gm.name} className="mb-2 rounded-lg bg-white/10 p-2">
                <div className="text-sm font-semibold">{gm.name}</div>
                <div className="mb-1.5 text-xs text-slate-300">{gm.desc}</div>
                <div className="flex gap-1.5">
                  {gm.levels.map((lv, l) => {
                    const open = l === 0 || (stars[`${m}-${l - 1}`] ?? 0) > 0;
                    const st = stars[`${m}-${l}`] ?? 0;
                    return (
                      <button
                        key={lv.name}
                        disabled={!open}
                        onClick={() => startLevel(m, l)}
                        className="flex-1 rounded-md bg-white px-2 py-1.5 text-left text-xs font-medium text-slate-900 disabled:opacity-40"
                      >
                        <div>{open ? lv.name : "🔒 Locked"}</div>
                        <div className="text-amber-500">{"★".repeat(st)}{"☆".repeat(3 - st)}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {mode === "done" && result && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/70 p-3">
            <div className="w-full max-w-sm rounded-xl bg-white p-4 text-center">
              <h2 className="text-lg font-semibold text-slate-900">Level पूरा!</h2>
              <div className="my-1 text-3xl text-amber-500">{"★".repeat(result.stars)}{"☆".repeat(3 - result.stars)}</div>
              <p className="text-sm text-slate-700">समय {result.time.toFixed(1)} s · उल्लंघन {result.viol}</p>
              <div className="mt-3 flex gap-2">
                <button onClick={reset} className="flex-1 rounded-lg border border-slate-300 py-2 text-sm font-medium text-slate-800">दोबारा</button>
                <button onClick={toMenu} className="flex-1 rounded-lg border border-slate-300 py-2 text-sm font-medium text-slate-800">Menu</button>
                {game.current.l + 1 < MAPS[game.current.m].levels.length && (
                  <button onClick={() => startLevel(game.current.m, game.current.l + 1)} className="flex-1 rounded-lg bg-slate-900 py-2 text-sm font-semibold text-white">अगला</button>
                )}
              </div>
            </div>
          </div>
        )}

        {violation && (
          <div className="absolute inset-0 flex items-end justify-center bg-slate-900/60 p-2 sm:items-center sm:p-4">
            <div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="viol-title"
              className={`max-h-full w-full max-w-lg overflow-y-auto rounded-xl border-t-4 bg-white p-4 shadow-2xl ${
                violation.code === "RED_ZONE" ? "border-red-600" : "border-amber-500"
              }`}
            >
              <h2 id="viol-title" className="text-lg font-semibold text-slate-900">
                {violation.title}
              </h2>
              <p className="mt-1 text-sm text-slate-700">{violation.summary}</p>

              <div className="mt-3 rounded-lg bg-slate-50 p-3">
                <p className="mb-1 text-xs font-medium text-slate-500">DGCA नियम – AI सहायक की व्याख्या</p>
                {ai.status === "loading" && (
                  <p className="animate-pulse text-sm text-slate-600">नियम खोजे जा रहे हैं…</p>
                )}
                {ai.status === "done" && (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{ai.text}</p>
                )}
                {ai.status === "error" && (
                  <div className="text-sm text-slate-700">
                    AI सहायक से जवाब नहीं मिला।{" "}
                    <button onClick={() => setRetry((c) => c + 1)} className="font-medium text-blue-700 underline">
                      दोबारा कोशिश करें
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={resume}
                className="mt-4 w-full rounded-lg bg-slate-900 py-2.5 text-sm font-semibold text-white active:bg-slate-700"
              >
                सुरक्षित स्थिति पर लौटें
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-4 select-none">
        <div className="grid grid-cols-3 gap-1.5">
          <span />
          <Pad label="Forward" onPress={(on) => press("forward", on)} />
          <span />
          <Pad label="Left" onPress={(on) => press("left", on)} />
          <Pad label="Back" onPress={(on) => press("back", on)} />
          <Pad label="Right" onPress={(on) => press("right", on)} />
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <Pad label="Turn L" onPress={(on) => press("yawL", on)} />
          <Pad label="Turn R" onPress={(on) => press("yawR", on)} />
          <Pad label="Up" onPress={(on) => press("up", on)} />
          <Pad label="Down" onPress={(on) => press("down", on)} />
        </div>
      </div>
      <p className="hidden text-xs text-slate-500 md:block">
        Keyboard: W/S = आगे/पीछे · A/D = बाएँ/दाएँ खिसकना · Q/E या ← → = मुड़ना · R/Space = ऊपर · F/Shift = नीचे · C = कैमरा
      </p>
    </div>
  );
}

/* ───────────── Small UI parts ───────────── */
function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
      <div className="mb-0.5 text-[11px] leading-tight text-slate-500">{label}</div>
      <div className="flex items-baseline">{children}</div>
    </div>
  );
}

function Legend({ color, text }: { color: string; text: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      {text}
    </div>
  );
}

function Pad({ label, onPress }: { label: string; onPress: (on: boolean) => void }) {
  return (
    <button
      type="button"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        onPress(true);
      }}
      onPointerUp={() => onPress(false)}
      onPointerCancel={() => onPress(false)}
      onContextMenu={(e) => e.preventDefault()}
      className="h-14 min-w-[4.5rem] touch-none rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 active:bg-slate-200"
    >
      {label}
    </button>
  );
}
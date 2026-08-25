console.log("script.js cargado");

// Configurar marked para que todos los links se abran en pestaña nueva
const renderer = new marked.Renderer();
renderer.link = function(href, title, text) {
  if (typeof href === "object") {
    const token = href;
    const linkText = this.parser ? this.parser.parseInline(token.tokens) : token.text;
    return '<a href="' + token.href + '" target="_blank" rel="noopener noreferrer">' + linkText + '</a>';
  }
  return '<a href="' + href + '" target="_blank" rel="noopener noreferrer">' + text + '</a>';
};

marked.setOptions({ renderer });
const WEBHOOK_URL = "https://judgingly-rickety-iron.ngrok-free.dev/webhook/3ff149f3-d479-4ff7-950b-2cea18b6d699";

const chatMessages = document.getElementById("chatMessages");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");

const prefsBtn = document.getElementById("prefsBtn");
const soundBtn = document.getElementById("soundBtn");
const prefsPanel = document.getElementById("prefsPanel");
const prefsReset = document.getElementById("prefsReset");
const prefsClose = document.getElementById("prefsClose");

const sessionId = crypto.randomUUID();


const mainMenuOptions = Array.from(document.querySelectorAll("#chatMessages > .quick-buttons button"))
  .map(button => ({
    label: button.textContent.trim(),
    value: button.dataset.message
  }));

let currentContextRoute = null;

/* ============================================================
   PREFERENCIAS VISUALES (US N°14)
   ============================================================ */
const PREFS_KEY = "exabot_prefs";
const DEFAULT_PREFS = { theme: "light", fontsize: "med", sound: "on" };

function loadPrefs() {
  try {
    return { ...DEFAULT_PREFS, ...(JSON.parse(localStorage.getItem(PREFS_KEY)) || {}) };
  } catch (e) {
    return { ...DEFAULT_PREFS };
  }
}

function savePrefs(p) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(p));
}

function applyPrefs(p) {
  const html = document.documentElement;
  html.setAttribute("data-theme", p.theme);
  html.setAttribute("data-fontsize", p.fontsize);
  if (soundBtn) {
    const ICON_ON = '<img src="imagenes/icon_sound_on.png" alt="" width="22" height="22">';
    const ICON_OFF = '<img src="imagenes/icon_sound_off.png" alt="" width="22" height="22">';
    soundBtn.innerHTML = p.sound === "off" ? ICON_OFF : ICON_ON;
    soundBtn.title = p.sound === "off" ? "Sonido silenciado (tocá para activar)" : "Sonido activado (tocá para silenciar)";
  }
  document.querySelectorAll(".prefs-options").forEach(group => {
    const key = group.dataset.group;
    group.querySelectorAll("button").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.value === p[key]);
    });
  });
}

let prefs = loadPrefs();
applyPrefs(prefs);

function togglePrefs(forceOpen) {
  const open = typeof forceOpen === "boolean" ? forceOpen : prefsPanel.hasAttribute("hidden");
  if (open) prefsPanel.removeAttribute("hidden");
  else prefsPanel.setAttribute("hidden", "");
  prefsBtn.setAttribute("aria-expanded", String(open));
}

prefsBtn.addEventListener("click", () => togglePrefs());

soundBtn.addEventListener("click", () => {
  prefs.sound = prefs.sound === "off" ? "on" : "off";
  savePrefs(prefs);
  applyPrefs(prefs);
});
prefsClose.addEventListener("click", () => togglePrefs(false));

document.querySelectorAll(".prefs-options").forEach(group => {
  group.addEventListener("click", event => {
    const btn = event.target.closest("button");
    if (!btn) return;
    prefs[group.dataset.group] = btn.dataset.value;
    savePrefs(prefs);
    applyPrefs(prefs);
  });
});

prefsReset.addEventListener("click", () => {
  prefs = { ...DEFAULT_PREFS };
  savePrefs(prefs);
  applyPrefs(prefs);
});

/* ============================================================
   CORRELATIVIDADES (integración solución Eliana)
   ============================================================ */
const correlativas = {
  carrera: null,
  carreraToken: null,
  nivel: null,
  nivelToken: null,
  esperandoMaterias: false,
  pedirContinuar: false,
  enModo: false
};

/* ============================================================
   MENSAJES
   ============================================================ */
function addMessage(text, sender, isLoading = false) {
  const row = document.createElement("div");
  row.classList.add("msg-row", sender);

  const avatar = document.createElement("div");
  avatar.classList.add("avatar");
  const img = document.createElement("img");
  img.src = sender === "bot" ? "imagenes/exabot_avatar.png" : "imagenes/user_avatar.png";
  img.alt = sender === "bot" ? "ExaBot" : "Vos";
  avatar.appendChild(img);

  const message = document.createElement("div");
  message.classList.add("message", sender);

  if (isLoading) {
    message.classList.add("loading-message");
  }

  message.innerHTML = marked.parse(text);

  row.appendChild(avatar);
  row.appendChild(message);
  chatMessages.appendChild(row);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  return message;
}

function startLoadingAnimation() {
  const steps = [
    "🤔 Analizando tu consulta...",
    "🔎 Buscando información...",
    "✍️ Preparando la respuesta..."
  ];

  const loadingElement = addMessage(steps[0], "bot", true);

  const timeouts = [];

  timeouts.push(setTimeout(() => {
    loadingElement.textContent = steps[1];
  }, 1500));

  timeouts.push(setTimeout(() => {
    loadingElement.textContent = steps[2];
  }, 2000));

  return {
    element: loadingElement,
    timeouts
  };
}

function stopLoadingAnimation(loading) {
  if (!loading) return;

  loading.timeouts.forEach(timeout => clearTimeout(timeout));

  if (loading.element) {
    const row = loading.element.closest(".msg-row");
    (row || loading.element).remove();
  }
}

function addImage(src) {
  const img = document.createElement("img");
  img.src = src;
  img.classList.add("chat-image");
  chatMessages.appendChild(img);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addVideo(src) {
  const video = document.createElement("video");
  video.src = src;
  video.controls = true;
  video.classList.add("chat-video");
  chatMessages.appendChild(video);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

/* ============================================================
   PARSEO DE RESPUESTAS DE n8n
   ============================================================ */
function getBotResponse(data) {
  if (Array.isArray(data)) {
    data = data[0];
  }

  return {
    text: data?.message || data?.output || data?.response || data?.text || "No pude obtener una respuesta del chatbot.",
    options: data?.options || data?.buttons || [],
    contextRoute: data?.context_route || null,
    route: data?.route || null,
    expects: data?.expects || null,
    image: data?.image_url || null,
    video: data?.video_url || null,
    placeholder: data?.placeholder || null
  };
}

/* ============================================================
   OPCIONES / BOTONES
   ============================================================ */
function addOptions(options) {
  if (!options || options.length === 0) return;

  const container = document.createElement("div");
  container.classList.add("quick-buttons");

  options.forEach(option => {
    const button = document.createElement("button");
    button.textContent = option.label;

    button.addEventListener("click", () => {
      if (option.value === "volver_menu" || option.value === "menu_principal") {
        currentContextRoute = null;
        correlativas.enModo = false;
        chatInput.placeholder = "Escribí tu consulta...";
        addMessage(option.label, "user");
        showMainMenu();
        return;
      }

      if (option.value === "menu_correlativas") {
        correlativas.enModo = true;
      }

      if (option.value === "ver_video_box") {
        currentContextRoute = null;
      }

      sendMessage(option.value, option.label);
    });

    container.appendChild(button);
  });

  const hint = document.createElement("div");
  hint.classList.add("quick-buttons-hint");
  hint.textContent = "💬 Puedes escribir tu consulta en el chat.";
  container.appendChild(hint);

  chatMessages.appendChild(container);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showMainMenu() {
  chatInput.placeholder = "Escribí tu consulta...";
  correlativas.enModo = false;
  currentContextRoute = null;
  addMessage("👋 ¿En qué puedo ayudarte?", "bot");
  addOptions(mainMenuOptions);
}


/* ============================================================
   SONIDO DE RESPUESTA (sintetizado, sin archivos)
   ============================================================ */
let audioCtx = null;

function initAudio() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
  } catch (e) {}
}

// iOS/Safari: desbloquear el audio con el primer toque del usuario
document.addEventListener("touchstart", initAudio, { once: true });
document.addEventListener("click", initAudio, { once: true });

function playNotify() {
  if (prefs.sound === "off") return;
  try {
    initAudio();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(880, audioCtx.currentTime);
    o.frequency.setValueAtTime(1174.66, audioCtx.currentTime + 0.08);
    g.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.12, audioCtx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.28);
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start();
    o.stop(audioCtx.currentTime + 0.3);
  } catch (e) {}
}

/* ============================================================
   ENVÍO DE MENSAJES
   ============================================================ */
async function sendMessage(text, visibleText = text) {
  initAudio();
  addMessage(visibleText, "user");

  chatInput.value = "";
  chatInput.disabled = true;

  const loading = startLoadingAnimation();

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
      body: JSON.stringify({
        action: "sendMessage",
        sessionId,
        chatInput: text,
        context_route: currentContextRoute
      })
    });

    const raw = await response.text();
    console.log("Respuesta cruda de n8n:", raw);

    stopLoadingAnimation(loading);

    if (!raw) {
      addMessage("n8n respondió vacío. Revisá el nodo Respond to Webhook.", "bot");
      return;
    }

    const data = JSON.parse(raw);
    const botResponse = getBotResponse(data);

    currentContextRoute = botResponse.contextRoute;

    if (botResponse.route === "menu" && botResponse.expects === "situacion") {
      correlativas.esperandoMaterias = true;
    }

    if (botResponse.placeholder) {
      chatInput.placeholder = botResponse.placeholder;
    }

    addMessage(botResponse.text, "bot");
    playNotify();

    if (botResponse.image) addImage(botResponse.image);
    if (botResponse.video) addVideo(botResponse.video);

    const esMenu = botResponse.route === "menu";
    const traeBotones = Array.isArray(botResponse.options) && botResponse.options.length > 0;

    if (traeBotones) {
      addOptions(botResponse.options);
    } else if (!esMenu) {
      const nav = correlativas.enModo
        ? [
            { label: "🙋 Contactar al GaME", value: "menu_game" },
            { label: "🏠 Volver al menú principal", value: "menu_principal" }
          ]
        : [{ label: "🏠 Volver al menú principal", value: "menu_principal" }];
      addOptions(nav);
    }

  } catch (error) {
    stopLoadingAnimation(loading);
    addMessage("No pude conectar con ExaBot. Revisá si n8n está activo o si el Webhook está escuchando.", "bot");
    console.error(error);
  } finally {
    chatInput.disabled = false;
    chatInput.focus();
  }
}

/* ============================================================
   EVENTOS
   ============================================================ */
document.querySelectorAll("#chatMessages > .quick-buttons button").forEach(button => {
  button.addEventListener("click", () => {
    const value = button.dataset.message;
    const label = button.textContent.trim();

    if (value === "menu_correlativas") {
      correlativas.enModo = true;
    }

    sendMessage(value, label);
  });
});

chatForm.addEventListener("submit", event => {
  event.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;


  sendMessage(text);
});


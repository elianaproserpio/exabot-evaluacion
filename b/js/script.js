// ExaBot B — versión SIN criterios de usabilidad (variante de control del experimento).
// Sin bienvenida, sin botones, sin markdown, sin indicador de carga, sin manejo de imágenes/videos.

const WEBHOOK_URL = "https://judgingly-rickety-iron.ngrok-free.dev/webhook/4b3c4619-c931-4aca-bd87-d0925e03962b";

const chatMessages = document.getElementById("chatMessages");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");

const sessionId = crypto.randomUUID();

function addMessage(text, sender) {
  const message = document.createElement("div");
  message.classList.add("message", sender);
  message.textContent = text; // texto plano: sin markdown, sin links clickeables
  chatMessages.appendChild(message);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function sendMessage(text) {
  addMessage(text, "user");
  chatInput.value = "";
  chatInput.disabled = true;

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
      body: JSON.stringify({
        action: "sendMessage",
        sessionId,
        chatInput: text,
        context_route: null
      })
    });

    const raw = await response.text();

    if (!raw) {
      addMessage("Error.", "bot");
      return;
    }

    let data = JSON.parse(raw);
    if (Array.isArray(data)) data = data[0];
    const texto = data?.message || data?.output || data?.response || data?.text || "Error.";
    addMessage(texto, "bot");

  } catch (error) {
    addMessage("El asistente no esta disponible.", "bot");
    console.error(error);
  } finally {
    chatInput.disabled = false;
    chatInput.focus();
  }
}

chatForm.addEventListener("submit", event => {
  event.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;
  sendMessage(text);
});

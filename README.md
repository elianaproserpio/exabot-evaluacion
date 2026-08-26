# ExaBot — Asistente Virtual para la FCEyT

ExaBot es un asistente virtual (chatbot) desarrollado para la Facultad de Ciencias Exactas y Tecnologías (FCEyT) de la Universidad Nacional de Santiago del Estero (UNSE). Su objetivo es brindar información académica e institucional a los estudiantes ingresantes de manera rápida, disponible las 24 horas y aplicando principios de usabilidad.

Este repositorio corresponde a la **interfaz web (frontend)** del asistente. La lógica conversacional se resuelve en un flujo de **n8n** que integra recuperación aumentada de información (RAG).

## Características

- Respuestas a consultas frecuentes de ingresantes (carreras, materias, correlativas, docentes, trámites, calendario académico, etc.).
- Menú de navegación con botones de respuesta rápida, combinado con respuestas generativas por RAG.
- Soporte multimedia: la interfaz puede mostrar imágenes y videos (por ejemplo, cómo llegar al box de un profesor).
- Consulta de correlatividades según la situación académica del estudiante.
- Preferencias visuales configurables (tema y tamaño de fuente).
- Diseño responsivo: funciona en celular, tablet y computadora.

## Arquitectura

```
Usuario (chat web)  ->  n8n (orquestador)  ->  PostgreSQL + pgvector (base RAG)  ->  OpenAI (gpt-4.1-mini)
```

- **Frontend:** HTML, CSS y JavaScript (este repositorio).
- **Orquestación:** n8n (ejecución local), que recibe las consultas vía Webhook.
- **Base de conocimiento:** PostgreSQL con la extensión pgvector, con embeddings generados por OpenAI.
- **Modelo de lenguaje:** gpt-4.1-mini (OpenAI).

## Tecnologías

- **HTML5** — estructura de la interfaz.
- **CSS3** — estilos y diseño responsivo.
- **JavaScript** — lógica de interacción y comunicación con n8n.
- **marked.js** — renderizado del formato Markdown de las respuestas.

## Requisitos

- Un navegador web moderno (Chrome, Firefox, Edge, Safari).
- El flujo de **n8n** en ejecución con el Webhook activo.
- La URL del Webhook configurada en `js/script.js` (variable `WEBHOOK_URL`).

## Cómo usar

1. Verificá que n8n esté corriendo y que el Webhook esté escuchando.
2. Confirmá que la variable `WEBHOOK_URL` en `js/script.js` apunte a tu Webhook.
3. Abrí el archivo `index.html` en el navegador.
4. Interactuá con el asistente escribiendo tu consulta o usando los botones del menú.

## Estructura del proyecto

```
ExaBot---asistente-virtual-para-la-FCEyT/
├── index.html        # Página principal del chat
├── README.md         # Este archivo
├── css/
│   └── style.css     # Estilos e interfaz responsiva
├── js/
│   └── script.js     # Lógica del chat y conexión con n8n
├── imagenes/         # Recursos gráficos
└── videos/           # Videos (por ejemplo, cómo llegar a un box)
```

## Autoras

- **Luz Coria** — Trabajo Final de Graduación, Licenciatura en Sistemas de Información (FCEyT — UNSE).
- **Eliana Proserpio** — Trabajo Final de Graduación, Licenciatura en Sistemas de Información (FCEyT — UNSE).

---

*Última actualización: agosto de 2026.*

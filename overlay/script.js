// Google Fonts list (you can add more)
const googleFonts = [
    'Poppins',
    'Roboto',
    'Open Sans',
    'Lato',
    'Montserrat',
    'Oswald',
    'Raleway',
    'Merriweather',
    'Nunito',
    'Ubuntu'
];

const fontSelect = document.getElementById('fontFamilySelect');

// Populate dropdown with fonts
googleFonts.forEach(font => {
    const option = document.createElement('option');
    option.value = font;
    option.textContent = font;
    fontSelect.appendChild(option);
});

// Load Google Font by adding/removing <link>
function loadGoogleFont(fontName) {
    const existingLink = document.getElementById('google-font-link');
    if (existingLink) existingLink.remove();

    const link = document.createElement('link');
    link.id = 'google-font-link';
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, '+')}&display=swap`;
    document.head.appendChild(link);
}

// Apply selected font family
fontSelect.addEventListener('change', () => {
    const selectedFont = fontSelect.value;
    loadGoogleFont(selectedFont);
    document.documentElement.style.setProperty('--chat-font-family', `'${selectedFont}', sans-serif`);
});

// Set default font
loadGoogleFont('Poppins');
fontSelect.value = 'Poppins';
document.documentElement.style.setProperty('--chat-font-family', `'Poppins', sans-serif`);

const params = new URLSearchParams(window.location.search);
const isEdit = (params.get("edit") || "false").toLowerCase() === "true";
const settingsPanel = document.getElementById("settingsPanel");

const settingsToggle = document.getElementById("settingsToggle");

if (isEdit) {
    settingsPanel.style.display = "block";
    settingsToggle.style.display = "block";
} else {
    settingsPanel.style.display = "none";
    settingsToggle.style.display = "none";
}

// Load settings from URL params or defaults
const twitchColorInput = document.getElementById('twitchColor');
const youtubeColorInput = document.getElementById('youtubeColor');
const fadeTimeInput = document.getElementById('fadeTime');
const msgBgColorInput = document.getElementById('msgBgColor');
const msgBgOpacityInput = document.getElementById('msgBgOpacity');

if (params.has('twitchColor')) twitchColorInput.value = params.get('twitchColor');
if (params.has('youtubeColor')) youtubeColorInput.value = params.get('youtubeColor');
if (params.has('fadeTime')) fadeTimeInput.value = params.get('fadeTime');
if (params.has('msgBgColor')) msgBgColorInput.value = params.get('msgBgColor');
if (params.has('fontFamily')) {
    const fontFromUrl = params.get('fontFamily');
    if (googleFonts.includes(fontFromUrl)) {
        fontSelect.value = fontFromUrl;
        loadGoogleFont(fontFromUrl);
        document.documentElement.style.setProperty('--chat-font-family', `'${fontFromUrl}', sans-serif`);
    }
}

let fadeTime = parseInt(fadeTimeInput.value, 10) * 1000;
const chat = document.getElementById("chat");

function hexToRgb(hex) {
    // Convert hex #RRGGBB to object {r, g, b}
    let bigint = parseInt(hex.slice(1), 16);
    let r = (bigint >> 16) & 255;
    let g = (bigint >> 8) & 255;
    let b = bigint & 255;
    return { r, g, b };
}

function applySettings() {
    document.documentElement.style.setProperty('--twitch-color', twitchColorInput.value);
    document.documentElement.style.setProperty('--youtube-color', youtubeColorInput.value);

    const rgb = hexToRgb(msgBgColorInput.value);
    const alpha = parseFloat(msgBgOpacityInput.value);
    const rgbaColor = `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`;

    document.documentElement.style.setProperty('--msg-bg-color', rgbaColor);

    fadeTime = parseInt(fadeTimeInput.value, 10) * 1000;
    document.documentElement.style.setProperty('--fade-time', fadeTimeInput.value + 's');
}

// Apply on input changes automatically
[twitchColorInput, youtubeColorInput, msgBgColorInput, msgBgOpacityInput, fadeTimeInput].forEach(input => {
    input.addEventListener('input', () => {
        applySettings();
    });
});

// Also apply font family changes from dropdown
fontSelect.addEventListener('change', applySettings);

// Initial apply
applySettings();

// Copy URL with current params for OBS
document.getElementById('copyUrlBtn').addEventListener('click', () => {
    const baseUrl = window.location.origin + window.location.pathname;

    const urlParams = new URLSearchParams({
        edit: 'false',
        twitchColor: twitchColorInput.value,
        youtubeColor: youtubeColorInput.value,
        msgBgColor: msgBgColorInput.value,
        msgBgOpacity: msgBgOpacityInput.value,
        fadeTime: fadeTimeInput.value,
        fontFamily: fontSelect.value
    });

    const finalUrl = `${baseUrl}?${urlParams.toString()}`;
    navigator.clipboard.writeText(finalUrl).then(() => {
        alert('URL copied to clipboard:\n' + finalUrl);
    }).catch(() => {
        alert('Failed to copy URL');
    });
});

// Toggle panel open/close
settingsToggle.addEventListener('click', () => {
    const isOpen = settingsPanel.classList.toggle('open');
    settingsToggle.textContent = isOpen ? 'Settings »' : 'Settings «';
});

// Connect to Streamer.bot WebSocket
const ws = new WebSocket("ws://localhost:8080");
ws.onopen = () => {
    console.log("Connected to Streamer.bot WebSocket");

    // Subscribe to Twitch and YouTube chat messages
    ws.send(JSON.stringify({
        request: "Subscribe",
        id: "twitch-youtube-chat-subscribe",
        events: {
            YouTube: ["Message"],
            Twitch: ["ChatMessage"]
        }
    }));
};

ws.onmessage = (event) => {
    const packet = JSON.parse(event.data);
    console.log("Parsed packet:", packet);

    // Get the badge urls
    let badges = [];
    if (packet?.data?.user?.badges && Array.isArray(packet.data.user.badges)) {
        badges = packet.data.user.badges.map(badge => badge.imageUrl)
    }

    // Twitch chat
    if (packet?.event?.source === "Twitch") {
        addMessage(packet.data.user.name, packet.data.message.message, "twitch", badges);
    }

    // Youtube chat
    if (packet?.event?.source === "Youtube") {
        addMessage(packet.data.user.name, packet.data.message.message, "youtube", badges);
    }
};

// ---- constants ----
const GAP_PX = 10;
const ANIM_MS = 500; // keep in sync with CSS if any

// ---- helper: shift all following siblings left by `distance` in perfect sync ----
function shiftFollowingSiblingsLeft(target, distance) {
  const all = Array.from(chat.children);
  const index = all.indexOf(target);
  if (index === -1) return () => {};

  const toMove = all.slice(index + 1);

  // Prime phase: freeze current state and tag nodes as shifting
  toMove.forEach(msg => {
    msg.classList.add('shifting');
    msg.style.transition = 'none';
    const t = getComputedStyle(msg).transform;
    msg.style.transform = (t === 'none') ? 'translate3d(0,0,0)' : t;
    msg.style.opacity = '1'; // ensure no accidental fade on siblings
  });

  // Commit priming
  void chat.offsetWidth;

  // Enable transitions next frame, then set targets the frame after
  requestAnimationFrame(() => {
    toMove.forEach(msg => {
      msg.style.transition = `transform ${ANIM_MS}ms ease`;
    });
    requestAnimationFrame(() => {
      toMove.forEach(msg => {
        msg.style.transform = `translate3d(-${distance}px, 0, 0)`;
      });
    });
  });

  // Cleanup returns a function that resets only nodes we tagged
  return () => {
    // Only reset nodes that are still shifting and still in the DOM
    const shiftingNow = Array.from(chat.querySelectorAll('.shifting'));
    shiftingNow.forEach(msg => {
      msg.style.transition = 'none';
      msg.style.transform = 'translate3d(0,0,0)';
      msg.style.opacity = '1';
      msg.classList.remove('shifting');
    });
    // Commit reset, then allow future transitions
    void chat.offsetWidth;
    shiftingNow.forEach(msg => { msg.style.transition = ''; });
  };
}

// ---- unified removal: slide/fade the target and shift siblings in parallel ----
function animateRemoveMessage(msgElement, extraOffset = GAP_PX, callback) {
  // Guard: prevent double-removal races
  if (msgElement.dataset.removing === '1') return;
  msgElement.dataset.removing = '1';

  const width = msgElement.offsetWidth + extraOffset;

  // Start siblings shift immediately (returns cleanup function)
  const cleanupSibs = shiftFollowingSiblingsLeft(msgElement, width);

  // Animate the removed item out in parallel
  msgElement.style.transition = `transform ${ANIM_MS}ms ease, opacity ${ANIM_MS}ms ease`;
  // Ensure layout is committed, then animate
  void msgElement.offsetWidth;
  msgElement.style.transform = `translate3d(-${width}px, 0, 0)`;
  msgElement.style.opacity = '0';

  // Finish exactly when the transitions end (fallback timer)
  const done = () => {
    // Idempotent: in case something else already removed it
    if (msgElement.parentNode) msgElement.parentNode.removeChild(msgElement);
    msgElement.dataset.removing = '';
    cleanupSibs();
    if (typeof callback === 'function') callback();
  };

  // Prefer transitionend to be precise; fallback to timeout
  let finished = false;
  const onEnd = (e) => {
    if (finished) return;
    if (e.target !== msgElement) return;
    if (e.propertyName !== 'transform') return;
    finished = true;
    msgElement.removeEventListener('transitionend', onEnd);
    done();
  };
  msgElement.addEventListener('transitionend', onEnd);
  setTimeout(() => {
    if (!finished) {
      msgElement.removeEventListener('transitionend', onEnd);
      done();
    }
  }, ANIM_MS + 50);
}

// ---- overflow compaction: reuse the same coordinated removal ----
let isCompacting = false;
function compactOverflow() {
  if (isCompacting) return;
  if (chat.children.length <= 10) return;

  isCompacting = true;

  // Always remove the first message and shift the rest simultaneously
  const first = chat.firstElementChild;
  if (!first) { isCompacting = false; return; }

  animateRemoveMessage(first, GAP_PX, () => {
    isCompacting = false;
    // If more arrived during the animation, run again
    if (chat.children.length > 10) compactOverflow();
  });
}

// ---- addMessage: ensure consistent slide-in and compact on overflow ----
function addMessage(user, message, platform, badges) {
  const div = document.createElement("div");
  div.className = `msg ${platform.toLowerCase()}`;

  let badgesHTML = '';
  if (badges && badges.length) {
    badgesHTML = badges.map(url => `<img src="${url}" alt="badge" class="badge" />`).join('');
  }

  div.innerHTML = `${badgesHTML}<span class="user">${user}:</span> ${message}`;

  // Ensure slide-in initial state (even if CSS doesn't define it)
  div.style.transition = 'transform 300ms ease';
  div.style.transform = 'translate3d(100%, 0, 0)';
  div.style.opacity = '1';

  chat.appendChild(div);

  // Commit initial transform, then slide to 0
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      div.style.transform = 'translate3d(0, 0, 0)';
    });
  });

  // Auto-remove after fadeTime using the unified coordinated removal
  setTimeout(() => {
    if (div.parentNode) animateRemoveMessage(div);
  }, fadeTime);

  // Compact on overflow
  compactOverflow();
}
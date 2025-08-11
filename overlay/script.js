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
const isPreview = params.get("preview").toLowerCase() === "true";
const settingsPanel = document.getElementById("settingsPanel");

if (isPreview) settingsPanel.style.display = "block";

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
        preview: 'false',         // so settings panel does NOT show in OBS
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
        console.log("Badges:", badges);
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

function addMessage(user, message, platform, badges) {
    const div = document.createElement("div");
    div.className = `msg ${platform.toLowerCase()}`;

    // Generate badges HTML if any
    let badgesHTML = '';
    if (badges && badges.length) {
        badgesHTML = badges.map(badgeUrl =>
            `<img src="${badgeUrl}" alt="badge" class="badge" />`
        ).join('');
    }

    div.innerHTML = `${badgesHTML}<span class="user">${user}:</span> ${message}`;
    chat.appendChild(div);

    // Force reflow to apply initial style (translateX(100%))
    void div.offsetWidth;

    // Animate new message entrance (translateX(0))
    div.style.transform = 'translateX(0)';

    // Calculate total width occupied by all messages, including gap
    let totalWidth = 0;
    for (let child of chat.children) {
        totalWidth += child.offsetWidth + 10; // 10px gap
    }
    totalWidth -= 10; // No gap after the last message

    const containerWidth = chat.clientWidth;

    // If totalWidth exceeds container, move messages to the left
    if (totalWidth > containerWidth) {
        const overflow = totalWidth - containerWidth;
        const firstMsg = chat.children[0];

        // 1. Animate all messages to the left
        for (let msg of chat.children) {
            msg.style.transition = 'transform 0.5s ease';
            msg.style.transform = `translateX(${-overflow}px)`;
        }

        // 2. After transition ends, animate the first message exit separately
        const onTransitionEnd = (event) => {
            // Ensure it's the firstMsg that finished transform transition
            if (event.propertyName !== 'transform' || event.target !== firstMsg) return;
            firstMsg.removeEventListener('transitionend', onTransitionEnd);

            // Animate first message disappearing (move left + opacity)
            firstMsg.style.transition = 'transform 0.5s ease, opacity 0.5s ease';
            firstMsg.style.transform = `translateX(${-overflow - firstMsg.offsetWidth - 10}px)`;
            firstMsg.style.opacity = '0';

            // After animation, remove it and reset positions
            setTimeout(() => {
                if (firstMsg.parentNode) firstMsg.parentNode.removeChild(firstMsg);

                for (let msg of chat.children) {
                    msg.style.transition = 'transform 0.5s ease';
                    msg.style.transform = 'translateX(0)';
                }
            }, 500);
        };

        firstMsg.addEventListener('transitionend', onTransitionEnd);
    }

    // Auto-remove after fadeTime (if still present)
    setTimeout(() => {
        if (div.parentNode) div.parentNode.removeChild(div);
    }, fadeTime);

    // Limit to 10 messages
    if (chat.children.length > 10) {
        chat.removeChild(chat.firstChild);
    }
}

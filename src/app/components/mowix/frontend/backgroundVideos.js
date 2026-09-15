// Container YouTube background videos: muted, looping between start and end, sized to cover.
import { forEachWithSettings, getDevice, outerSize } from "./utils";

let apiPromise;
function loadYouTubeApi() {
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (!apiPromise) {
    apiPromise = new Promise((resolve) => {
      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (previous) previous();
        resolve(window.YT);
      };
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(script);
    });
  }
  return apiPromise;
}

const youtubeId = (url) => (url.match(/^(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtu\.be\/|youtube\.com\/(?:(?:watch)?\?(?:.*&)?vi?=|(?:embed|v|vi|user|shorts)\/))([^?&"'>]+)/) || [])[1];

function coverSize(container) {
  const width = outerSize(container, "width");
  const height = outerSize(container, "height");
  const ratio = 16 / 9;
  return width / height > ratio ? { width, height: width / ratio } : { width: height * ratio, height };
}

export default function initBackgroundVideos(root) {
  return forEachWithSettings(
    root,
    (settings) => settings.background_background === "video" && Boolean(settings.background_video_link),
    (element, settings) => {
      const container = element.querySelector(":scope > .elementor-background-video-container, :scope > .e-con-inner > .elementor-background-video-container");
      const embed = container?.querySelector(".elementor-background-video-embed");
      const videoId = youtubeId(settings.background_video_link);
      // Elementor doesn't load background videos on mobile unless "Play on Mobile" is enabled.
      if (!embed || !videoId || (getDevice() === "mobile" && settings.background_play_on_mobile !== "yes")) return null;

      const start = Number(settings.background_video_start) || 0;
      const end = Number(settings.background_video_end) || 0;
      let player;
      let loopTimer;
      let destroyed = false;

      const resize = () => {
        const iframe = player?.getIframe?.();
        if (!iframe) return;
        const size = coverSize(container);
        iframe.style.width = `${size.width}px`;
        iframe.style.height = `${size.height}px`;
      };
      const loop = () => {
        if (destroyed || !player?.getIframe()?.contentWindow) return;
        player.seekTo(start);
        if (end) loopTimer = setTimeout(loop, (end - start + 1) * 1000);
      };

      container.classList.add("elementor-loading", "elementor-invisible");
      loadYouTubeApi().then((YT) => {
        if (destroyed) return;
        // Chrome no longer fires PLAYING at start, so reveal on UNSTARTED there.
        const revealState = window.chrome ? YT.PlayerState.UNSTARTED : YT.PlayerState.PLAYING;
        player = new YT.Player(embed, {
          videoId,
          playerVars: { controls: 0, rel: 0, playsinline: 1, cc_load_policy: 0 },
          events: {
            onReady: () => {
              player.mute();
              resize();
              loop();
              player.playVideo();
            },
            onStateChange: (event) => {
              if (event.data === revealState) container.classList.remove("elementor-invisible", "elementor-loading");
              if (event.data === YT.PlayerState.ENDED) player.seekTo(start);
            },
          },
        });
      });
      window.addEventListener("resize", resize);

      return () => {
        destroyed = true;
        clearTimeout(loopTimer);
        window.removeEventListener("resize", resize);
        container.classList.remove("elementor-loading", "elementor-invisible");
        if (player?.destroy) {
          player.destroy();
          // YT.Player replaced the embed <div> with an <iframe>; put the placeholder back.
          if (!container.querySelector(".elementor-background-video-embed")) {
            const placeholder = document.createElement("div");
            placeholder.className = "elementor-background-video-embed";
            placeholder.setAttribute("role", "presentation");
            container.appendChild(placeholder);
          }
        }
      };
    },
  );
}

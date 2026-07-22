import { useRef, useState, useEffect, useCallback } from "react"
import Hls from "hls.js"
import { Play, Pause, Volume2, VolumeX, Maximize } from "lucide-react"

interface TrailerPlayerProps {
  src: string
  poster?: string
  title?: string
}

function getYoutubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}

function YoutubeEmbed({ videoId, poster, title }: { videoId: string; poster?: string; title?: string }) {
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`

  return (
    <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black">
      <iframe
        src={embedUrl}
        title={title || "Trailer"}
        className="absolute inset-0 h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  )
}

export function TrailerPlayer({ src, poster, title }: TrailerPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(true)
  const [ended, setEnded] = useState(false)
  const [showControls, setShowControls] = useState(false)
  const [progress, setProgress] = useState(0)
  const [clicked, setClicked] = useState(false)

  const isHls = src?.includes(".m3u8")
  const youtubeId = src ? getYoutubeId(src) : null

  useEffect(() => {
    const video = videoRef.current
    if (!video || !src) return

    if (isHls && Hls.isSupported()) {
      const hls = new Hls()
      hls.loadSource(src)
      hls.attachMedia(video)
      return () => { hls.destroy() }
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src
    }
  }, [src, isHls])

  const togglePlay = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    if (playing) {
      video.pause()
    } else {
      setEnded(false)
      video.play()
    }
    setPlaying(!playing)
  }, [playing])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const onTimeUpdate = () => setProgress(video.currentTime / (video.duration || 1))
    const onEnded = () => { setPlaying(false); setEnded(true) }
    video.addEventListener("timeupdate", onTimeUpdate)
    video.addEventListener("ended", onEnded)
    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate)
      video.removeEventListener("ended", onEnded)
    }
  }, [])

  if (!src) return null

  // YouTube mode
  if (youtubeId) {
    return (
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black">
        {!clicked ? (
          <div
            className="relative h-full w-full cursor-pointer group"
            onClick={() => setClicked(true)}
          >
            {poster && <img src={poster} alt="" className="h-full w-full object-cover" />}
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-red-600/80 backdrop-blur-sm flex items-center justify-center hover:bg-red-600 transition-all group-hover:scale-110">
                <Play className="h-7 w-7 text-white fill-white ml-0.5" />
              </div>
            </div>
          </div>
        ) : (
          <YoutubeEmbed videoId={youtubeId} poster={poster} title={title} />
        )}
      </div>
    )
  }

  // HLS / direct video mode
  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video rounded-xl overflow-hidden bg-black group cursor-pointer"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      onClick={togglePlay}
    >
      <video
        ref={videoRef}
        className="h-full w-full object-cover"
        playsInline
        muted={muted}
        poster={poster}
      />

      <div className={`absolute inset-0 bg-gradient-to-t from-black/60 to-transparent transition-opacity ${playing ? "opacity-0 group-hover:opacity-100" : "opacity-100"}`} />

      {!playing && !ended && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-orange-500/40 backdrop-blur-sm flex items-center justify-center hover:bg-orange-500/60 transition-all">
            <Play className="h-7 w-7 text-white fill-white ml-0.5" />
          </div>
        </div>
      )}

      {ended && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-orange-500/40 backdrop-blur-sm flex items-center justify-center hover:bg-orange-500/60 transition-all mx-auto mb-2">
              <Play className="h-7 w-7 text-white fill-white ml-0.5" />
            </div>
            <p className="text-white text-sm font-medium">Repetir</p>
          </div>
        </div>
      )}

      <div
        className={`absolute bottom-0 left-0 right-0 p-3 transition-opacity duration-200 ${showControls || !playing ? "opacity-100" : "opacity-0"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full h-1 bg-white/20 rounded-full mb-2 cursor-pointer overflow-hidden">
          <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${progress * 100}%` }} />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={togglePlay} className="text-white hover:text-orange-400 transition-colors">
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-white" />}
            </button>
            <button onClick={() => setMuted(!muted)} className="text-white/70 hover:text-white transition-colors">
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
          </div>
          {title && <span className="text-white/50 text-[10px] truncate max-w-[200px]">{title}</span>}
          <button onClick={() => videoRef.current?.requestFullscreen()} className="text-white/70 hover:text-white transition-colors">
            <Maximize className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

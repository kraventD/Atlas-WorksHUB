import { useState, useCallback } from "react"
import { X, ChevronLeft, ChevronRight } from "lucide-react"

interface ScreenshotsGalleryProps {
  screenshots: string[]
}

export function ScreenshotsGallery({ screenshots }: ScreenshotsGalleryProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const open = useCallback((i: number) => setOpenIndex(i), [])
  const close = useCallback(() => setOpenIndex(null), [])
  const prev = useCallback(() => {
    setOpenIndex((i) => (i !== null && i > 0 ? i - 1 : i))
  }, [])
  const next = useCallback(() => {
    setOpenIndex((i) => (i !== null && i < screenshots.length - 1 ? i + 1 : i))
  }, [screenshots.length])

  if (!screenshots?.length) return null

  return (
    <>
      <div className="flex gap-2 h-full">
        {(screenshots.slice(0, 6)).map((shot, i) => (
          <div
            className="flex-1 rounded-lg overflow-hidden bg-[#141414] border border-white/5 opacity-85 hover:opacity-100 transition-all cursor-pointer"
            onClick={() => open(i)}
          >
            <img src={shot} alt="" className="h-full w-full object-cover" />
          </div>
        ))}
      </div>

      {openIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={close}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors z-10"
            onClick={close}
          >
            <X className="h-8 w-8" />
          </button>

          {openIndex > 0 && (
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors z-10"
              onClick={(e) => { e.stopPropagation(); prev() }}
            >
              <ChevronLeft className="h-10 w-10" />
            </button>
          )}

          {openIndex < screenshots.length - 1 && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors z-10"
              onClick={(e) => { e.stopPropagation(); next() }}
            >
              <ChevronRight className="h-10 w-10" />
            </button>
          )}

          <img
            src={screenshots[openIndex]}
            alt=""
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-sm">
            {openIndex + 1} / {screenshots.length}
          </div>
        </div>
      )}
    </>
  )
}

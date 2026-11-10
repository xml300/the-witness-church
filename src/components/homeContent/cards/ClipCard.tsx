/* Thumbnails come from other platforms' servers, so a plain img is used. */
/* eslint-disable @next/next/no-img-element */

const PLATFORM_COLORS: Record<string, string> = {
  YouTube: "#FF0000",
  Instagram: "#E040FB",
  Facebook: "#1877F2",
  TikTok: "#69C9D0",
  X: "#FFFFFF",
};

interface ClipCardProps {
  platform: string;
  title: string;
  url: string;
  image: string;
}

export default function ClipCard({ platform, title, url, image }: ClipCardProps) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block rounded-2xl overflow-hidden"
    >
      <div className="h-[200px] md:h-[220px] bg-gradient-to-br from-navy to-navy-deep">
        {image && (
          <img
            src={image}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-11 h-11 bg-white/20 border border-white/60 rounded-full flex items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-200 scale-90 group-hover:scale-100">
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white ml-0.5" aria-hidden="true">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="flex items-center gap-1.5 mb-1.5">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: PLATFORM_COLORS[platform] ?? "#9CA3AF" }}
          />
          <span className="text-[10px] font-bold tracking-[1px] uppercase text-white/70">
            {platform}
          </span>
        </div>
        <p className="text-[12px] font-medium text-white leading-snug line-clamp-2">
          {title}
        </p>
      </div>
    </a>
  );
}

import React, { useState, useEffect } from 'react';
import { ExternalLink, Play, AlertCircle, Copy, Check, Video } from 'lucide-react';
import { parseVideoUrl } from '../utils/videoEmbed';

/**
 * Embedded Video Player
 * Supports Google Drive preview, YouTube, Vimeo, direct MP4, and external fallback.
 */
export default function VideoPlayer({ videoUrl, videoLinks = [], entryId = '' }) {
  const [selectedUrl, setSelectedUrl] = useState(videoUrl || (videoLinks.length > 0 ? videoLinks[0] : ''));
  const [hasError, setHasError] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (videoUrl) setSelectedUrl(videoUrl);
    else if (videoLinks.length > 0) setSelectedUrl(videoLinks[0]);
    setHasError(false);
  }, [videoUrl, videoLinks]);

  const parsed = parseVideoUrl(selectedUrl);

  const handleCopy = () => {
    if (!selectedUrl) return;
    navigator.clipboard.writeText(selectedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!selectedUrl) {
    return (
      <div className="w-full aspect-video rounded-2xl glass-card flex flex-col items-center justify-center p-6 text-center border-dashed border-white/20">
        <Video className="w-12 h-12 text-[#a3a3a3] mb-3 opacity-60" />
        <h4 className="text-lg font-semibold text-[#fafafa]">No Video Link Provided</h4>
        <p className="text-sm text-[#a3a3a3] mt-1 max-w-sm">
          This participant did not submit a valid video link during registration.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl glass-card overflow-hidden border border-white/10 shadow-2xl bg-black/60">
      {/* Video Container */}
      <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
        {parsed.isEmbeddable && !hasError ? (
          parsed.type === 'direct' ? (
            <video
              src={parsed.embedUrl}
              controls
              playsInline
              className="w-full h-full object-contain"
              onError={() => setHasError(true)}
            />
          ) : (
            <iframe
              src={parsed.embedUrl}
              title={`Video submission for ${entryId}`}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              sandbox="allow-scripts allow-same-origin allow-presentation allow-forms"
              onError={() => setHasError(true)}
            />
          )
        ) : (
          /* Prominent Fallback if not embeddable or embed fails */
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-neutral-900/90 to-black/95">
            <AlertCircle className="w-12 h-12 text-amber-500 mb-3" />
            <h4 className="text-lg font-semibold text-[#fafafa]">
              {hasError ? 'Video Embed Blocked by Provider' : 'External Video Link'}
            </h4>
            <p className="text-xs md:text-sm text-[#a3a3a3] mt-1 max-w-md mb-5">
              Some storage links (such as private Google Drive files or special formats) require opening directly in a new tab.
            </p>
            <a
              href={selectedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all active:scale-95 text-sm md:text-base min-h-[44px]"
            >
              <ExternalLink className="w-5 h-5" />
              Open Video in New Tab
            </a>
          </div>
        )}
      </div>

      {/* Video Toolbar & Multi-Link Selector */}
      <div className="p-3 md:p-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 bg-white/[0.02]">
        {/* Multi-link selector pills if there are multiple video links */}
        {videoLinks && videoLinks.length > 1 ? (
          <div className="flex items-center gap-2 overflow-x-auto py-1">
            <span className="text-xs font-semibold text-[#a3a3a3] uppercase tracking-wider">
              Angles:
            </span>
            {videoLinks.map((link, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setSelectedUrl(link);
                  setHasError(false);
                }}
                className={`px-3 py-1 text-xs rounded-lg font-medium transition-all min-h-[36px] ${
                  selectedUrl === link
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-white/5 hover:bg-white/10 text-[#a3a3a3]'
                }`}
              >
                Video {idx + 1}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-[#a3a3a3]">
            <Play className="w-3.5 h-3.5 text-red-500" />
            <span>{parsed.title || 'Official Submission Video'}</span>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={handleCopy}
            title="Copy Video URL"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-[#fafafa] border border-white/10 transition-colors min-h-[36px]"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy Link'}</span>
          </button>

          <a
            href={selectedUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open externally"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-red-400 border border-red-500/30 transition-colors min-h-[36px]"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Open in Tab</span>
          </a>
        </div>
      </div>
    </div>
  );
}

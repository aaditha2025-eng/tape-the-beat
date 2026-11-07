/**
 * Helper to parse, transform and embed video URLs
 * Supports Google Drive preview conversion, YouTube, Vimeo, and direct video links.
 */

export function parseVideoUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return {
      type: 'invalid',
      originalUrl: '',
      embedUrl: null,
      isEmbeddable: false,
    };
  }

  const url = rawUrl.trim();

  // 1. Google Drive Links
  // Patterns:
  // - https://drive.google.com/file/d/{FILE_ID}/view...
  // - https://drive.google.com/open?id={FILE_ID}
  // - https://drive.google.com/uc?id={FILE_ID}
  const driveFileMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  const driveIdMatch = url.match(/drive\.google\.com\/(?:open|uc)\?id=([a-zA-Z0-9_-]+)/);
  const driveId = (driveFileMatch && driveFileMatch[1]) || (driveIdMatch && driveIdMatch[1]);

  if (driveId) {
    return {
      type: 'drive',
      originalUrl: url,
      embedUrl: `https://drive.google.com/file/d/${driveId}/preview`,
      isEmbeddable: true,
      title: 'Google Drive Video',
    };
  }

  // 2. YouTube Links
  // Patterns:
  // - https://www.youtube.com/watch?v={ID}
  // - https://youtu.be/{ID}
  // - https://www.youtube.com/shorts/{ID}
  const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/);
  if (ytMatch && ytMatch[1]) {
    return {
      type: 'youtube',
      originalUrl: url,
      embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=0&rel=0`,
      isEmbeddable: true,
      title: 'YouTube Video',
    };
  }

  // 3. Vimeo Links
  const vimeoMatch = url.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)/);
  if (vimeoMatch && vimeoMatch[3]) {
    return {
      type: 'vimeo',
      originalUrl: url,
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[3]}`,
      isEmbeddable: true,
      title: 'Vimeo Video',
    };
  }

  // 4. Direct video files (.mp4, .webm, .mov)
  if (/\.(mp4|webm|mov|ogg)($|\?)/i.test(url)) {
    return {
      type: 'direct',
      originalUrl: url,
      embedUrl: url,
      isEmbeddable: true,
      title: 'Direct Video Stream',
    };
  }

  // 5. Generic or non-embeddable web links
  return {
    type: 'generic',
    originalUrl: url,
    embedUrl: null,
    isEmbeddable: false,
    title: 'External Video Link',
  };
}

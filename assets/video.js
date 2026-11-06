for (const trigger of document.querySelectorAll('[data-video-src]')) {
  trigger.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    event.preventDefault();

    const frame = document.createElement('iframe');
    frame.className = 'video-frame';
    frame.title = trigger.dataset.videoTitle;
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    frame.allowFullscreen = true;
    frame.src = trigger.dataset.videoSrc;

    const fallback = trigger.nextElementSibling;
    trigger.replaceWith(frame);
    fallback.hidden = false;
    frame.focus();
  });
}

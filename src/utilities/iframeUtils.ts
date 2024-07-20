
export const updateIframeContent = (content: string, iframeRef: React.RefObject<HTMLIFrameElement>) => {
    if (iframeRef.current) {
      const iframe = iframeRef.current;
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  
      if (iframeDoc) {
        // Store the current scroll position
        const scrollPosition = {
          x: iframeDoc.documentElement.scrollLeft || iframeDoc.body.scrollLeft,
          y: iframeDoc.documentElement.scrollTop || iframeDoc.body.scrollTop
        };
  
        // Update the content
        const contentWrapper = iframeDoc.getElementById('content-wrapper');
        if (contentWrapper) {
          contentWrapper.innerHTML = content;
        } else {
          // If content-wrapper doesn't exist, update the body
          iframeDoc.body.innerHTML = `<div id="content-wrapper">${content}</div>`;
        }
  
        // Restore the scroll position
        iframeDoc.documentElement.scrollTo(scrollPosition.x, scrollPosition.y);
        iframeDoc.body.scrollTo(scrollPosition.x, scrollPosition.y);
  
        // Reapply styles
        const styleElement = iframeDoc.getElementById('highlight-styles');
        if (!styleElement) {
          const newStyle = iframeDoc.createElement('style');
          newStyle.id = 'highlight-styles';
          newStyle.textContent = `
            .highlight-element {
              position: relative;
            }
            .highlight-element::after {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              border: 2px solid red;
              pointer-events: none;
              z-index: 9999;
            }
          `;
          iframeDoc.head.appendChild(newStyle);
        }
      }
    }
  };
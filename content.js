(function() {
      // This script is injected into the webpage.
      // It looks for <video> elements and their <source> tags to find an MP4 URL.

      let videoUrl = null;

      // Find all <video> elements on the page.
      const videoElements = document.querySelectorAll('video');

      for (let video of videoElements) {
        // 1. Check the video element's src attribute directly.
        if (video.src && video.src.toLowerCase().endsWith('.mp4')) {
          videoUrl = video.src;
          break; // Found one, stop looking
        }

        // 2. Check <source> elements within the <video> element.
        const sourceElements = video.querySelectorAll('source');
        for (let source of sourceElements) {
          if (source.src && source.src.toLowerCase().endsWith('.mp4')) {
            videoUrl = source.src;
            break; // Found one, stop looking
          }
          // Sometimes the type attribute explicitly states mp4
          if (source.src && source.type && source.type.toLowerCase() === 'video/mp4') {
            videoUrl = source.src;
            break; 
          }
        }
        if (videoUrl) break; // Found one in sources, stop looking in other video tags
      }
      
      // If no .mp4 found directly, try to find any video source URL.
      // This is a fallback, as the request was specific for .mp4
      if (!videoUrl && videoElements.length > 0) {
          for (let video of videoElements) {
              if (video.src && typeof video.src === 'string' && video.src.startsWith('http')) {
                  videoUrl = video.src;
                  console.log("Found a generic video src:", videoUrl);
                  break;
              }
              const sourceElements = video.querySelectorAll('source');
              for (let source of sourceElements) {
                  if (source.src && typeof source.src === 'string' && source.src.startsWith('http')) {
                      videoUrl = source.src;
                      console.log("Found a generic source src:", videoUrl);
                      break;
                  }
              }
              if (videoUrl) break;
          }
      }


      // Send the found URL (or null if not found) back to the background script.
      chrome.runtime.sendMessage({ type: "videoUrl", url: videoUrl }, (response) => {
        if (chrome.runtime.lastError) {
          // Handle potential errors, e.g., if the receiving end is not available
          console.error("Error sending message:", chrome.runtime.lastError.message);
        } else {
          // Optional: handle response from background script
          // console.log("Message sent, response from background:", response);
        }
      });

    })();
    
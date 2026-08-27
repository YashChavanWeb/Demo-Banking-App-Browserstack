/**
 * BrowserStack Camera Injection Utility
 *
 * Calls the BrowserStack executor API to inject an image/video into the
 * device camera feed. This ensures camera injection works reliably with
 * expo-camera's CameraView for both liveness capture and QR scanning.
 *
 * Usage: call injectCameraImage(mediaUrl) BEFORE the user taps capture,
 * or call injectCameraImage() when the camera view mounts.
 *
 * BrowserStack executor payload format:
 *   POST http://localhost:8040
 *   { "action": "cameraImageInjection", "arguments": { "url": "<imageUrl>" } }
 */

const BS_EXECUTOR_URL = 'http://localhost:8040';

export type BSCameraAction =
  | 'cameraImageInjection'
  | 'cameraVideoInjection'
  | 'stopCameraInjection';

interface BSExecutorPayload {
  action: BSCameraAction;
  arguments?: {
    url?: string;
  };
}

/**
 * Send a command to the BrowserStack executor running on the device.
 * Returns true on success, false if not running on BrowserStack (safe to ignore).
 */
async function bsExecutor(payload: BSExecutorPayload): Promise<boolean> {
  try {
    const response = await fetch(BS_EXECUTOR_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return response.ok;
  } catch {
    // Not running on BrowserStack — silently ignore
    return false;
  }
}

/**
 * Inject an image into the BrowserStack camera feed.
 * @param imageUrl - A publicly accessible image URL or a BrowserStack media:// URL
 */
export async function injectCameraImage(imageUrl: string): Promise<boolean> {
  return bsExecutor({
    action: 'cameraImageInjection',
    arguments: { url: imageUrl },
  });
}

/**
 * Inject a video into the BrowserStack camera feed.
 * @param videoUrl - A publicly accessible video URL or a BrowserStack media:// URL
 */
export async function injectCameraVideo(videoUrl: string): Promise<boolean> {
  return bsExecutor({
    action: 'cameraVideoInjection',
    arguments: { url: videoUrl },
  });
}

/**
 * Stop any active camera injection and restore the real camera feed.
 */
export async function stopCameraInjection(): Promise<boolean> {
  return bsExecutor({ action: 'stopCameraInjection' });
}


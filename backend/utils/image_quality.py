import cv2
import numpy as np
import logging

logger = logging.getLogger(__name__)

def check_image_quality(file_bytes, blur_threshold=160.0, contrast_threshold=40.0) -> tuple[bool, str, float]:
    """
    Checks image for: Blur, Resolution, Brightness, and Contrast.
    Returns: (is_bad_quality, reason_message, score)
    """
    try:
        nparr = np.frombuffer(file_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return True, "Invalid image data", 0.0

        # 1. Resolution Check (Extremity: Image too small)
        height, width = img.shape[:2]
        if height < 200 or width < 200:
            return True, f"Resolution too low ({width}x{height})", 0.0

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # 2. Blur Check (Laplacian Variance)
        variance = cv2.Laplacian(gray, cv2.CV_64F).var()
        if variance < blur_threshold:
            return True, "Image is too blurry", variance

        # 3. Brightness Check (Extremity: Dark or Washed out)
        avg_brightness = np.mean(gray)
        if avg_brightness < 30:
            return True, "Image is too dark", avg_brightness
        if avg_brightness > 260:
            return True, "Image is too bright/glare detected", avg_brightness

        # 4. Contrast Check (New Extremity: Faint text)
        contrast = gray.std() # Standard deviation of pixel intensities
        logger.info(f"Quality Scores -> Blur: {variance:.2f}, Contrast: {contrast:.2f}, Brightness: {avg_brightness:.2f}")
        
        if contrast < contrast_threshold:
            return True, "Contrast too low (Text is too faint)", contrast

        return False, "Quality OK", variance

    except Exception as e:
        logger.error(f"Quality check failed: {str(e)}")
        return False, "Check failed", 0.0
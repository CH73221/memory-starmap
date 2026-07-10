import logging
from PIL import Image

logger = logging.getLogger(__name__)


def extract_text_from_image(file_path: str) -> str:
    """Extract text from an image using OCR.
    Note: Requires pytesseract and Tesseract OCR to be installed.
    Falls back to a placeholder message if not available.
    """
    try:
        import pytesseract
        image = Image.open(file_path)
        text = pytesseract.image_to_string(image, lang='chi_sim+eng')
        return text.strip()
    except ImportError:
        return "[图片OCR功能需要安装pytesseract和Tesseract OCR引擎]"
    except Exception as e:
        logger.error(f"OCR extraction error: {e}")
        return f"[图片文字提取失败: {str(e)}]"

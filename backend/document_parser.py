"""Document parsing module.

Re-exports document parsing functions for PDF, DOCX, and DOC resume files.
"""

from backend.services.document_parser import (
    extract_doc_text,
    extract_docx_text,
    extract_pdf_text,
    extract_resume_text,
)

__all__ = [
    "extract_doc_text",
    "extract_docx_text",
    "extract_pdf_text",
    "extract_resume_text",
]

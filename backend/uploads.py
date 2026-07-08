"""Driver document uploads: filesystem storage, never served as static.

Layout: UPLOADS_DIR/company_{cid}/app_{aid}/{doc_type}.{ext}
IDs only — stable, no PII on disk, multi-tenant-friendly (drop one company_* folder
to offboard a company). The DB (ComplianceDocument.file_path + the draft answers) is
the source of truth; this module only builds safe paths and sniffs content. Files are
served through guarded FileResponse endpoints, so the path on disk is never reachable
by URL.
"""
import os
import shutil
from io import BytesIO
from pathlib import Path
from typing import Optional

from fastapi.responses import FileResponse
from PIL import Image, ImageOps
import pillow_heif

pillow_heif.register_heif_opener()  # let Pillow read iPhone .heic photos

# doc_type (path/URL-safe key) -> ComplianceDocument.document_type
DOC_TYPES = {
    "medical_cert": "Medical Cert",
    "cdl": "CDL",
    "annual_inspection": "Annual Inspection",
    "registration": "Registration",
    "owner_license": "Owner License",
}

MAX_BYTES = 15 * 1024 * 1024   # 15 MB raw upload cap (HEIC/high-res photos run big)
JPEG_QUALITY = 90              # visually lossless for documents, strong size win
MAX_EDGE = 2600               # cap long edge — plenty to read any scanned document


def _input_kind(data: bytes) -> Optional[str]:
    """Classify the upload by magic bytes (never trust the client name): 'pdf' is
    stored as-is, 'image' (jpg/png/heic) is normalized to JPEG."""
    if data[:5] == b"%PDF-":
        return "pdf"
    if data[:3] == b"\xff\xd8\xff":            # JPEG
        return "image"
    if data[:8] == b"\x89PNG\r\n\x1a\n":       # PNG
        return "image"
    if data[4:8] == b"ftyp" and data[8:12] in (   # HEIC/HEIF brands
        b"heic", b"heix", b"hevc", b"heim", b"heis", b"hevm", b"hevs", b"mif1", b"msf1"
    ):
        return "image"
    return None


def _to_jpeg(data: bytes) -> bytes:
    """Decode any supported image (incl. HEIC), fix phone rotation, cap dimensions,
    and re-encode as JPEG. PyMuPDF reads JPEG natively, so the contract merge needs
    no extra conversion."""
    img = Image.open(BytesIO(data))
    img = ImageOps.exif_transpose(img)   # honor the camera orientation tag
    img = img.convert("RGB")             # drop alpha/palette for JPEG
    img.thumbnail((MAX_EDGE, MAX_EDGE))  # downscale only if larger; keeps aspect
    out = BytesIO()
    img.save(out, "JPEG", quality=JPEG_QUALITY, optimize=True)
    return out.getvalue()


def _root() -> Path:
    d = Path(os.getenv("UPLOADS_DIR", str(Path(__file__).parent / "uploads")))
    d.mkdir(parents=True, exist_ok=True)
    return d


def _save_into(rel_dir: Path, doc_type: str, data: bytes) -> str:
    """Validate + store a document under rel_dir/<doc_type>.<ext>. Returns the path
    relative to UPLOADS_DIR (stored in the DB). Raises ValueError on bad type/size."""
    if doc_type not in DOC_TYPES:
        raise ValueError(f"unknown document type: {doc_type}")
    if not data:
        raise ValueError("empty file")
    if len(data) > MAX_BYTES:
        raise ValueError("file too large (max 15 MB)")
    kind = _input_kind(data)
    if kind is None:
        raise ValueError("unsupported file type (use PDF, JPG, PNG, or HEIC)")
    if kind == "pdf":
        ext, payload = "pdf", data
    else:
        try:
            payload = _to_jpeg(data)
        except Exception as exc:  # corrupt/unreadable image
            raise ValueError(f"could not read image: {exc}")
        ext = "jpg"
    rel = rel_dir / f"{doc_type}.{ext}"
    dest = _root() / rel
    dest.parent.mkdir(parents=True, exist_ok=True)
    # One current file per doc_type: drop any prior copy with a different extension.
    for old in dest.parent.glob(f"{doc_type}.*"):
        if old != dest:
            old.unlink()
    dest.write_bytes(payload)
    return str(rel).replace("\\", "/")


def save(company_id: int, app_id: int, doc_type: str, data: bytes) -> str:
    """Driver upload (token flow), scoped per company/application."""
    # int() coerces the ids — no caller-controlled text ever lands in the path.
    return _save_into(Path(f"company_{int(company_id)}") / f"app_{int(app_id)}", doc_type, data)


def save_app_truck(company_id: int, app_id: int, truck_idx: int, doc_type: str, data: bytes) -> str:
    """Driver upload (token flow) for one of an owner-operator's trucks, scoped by the
    equipment index. Relocated into the truck's own folder at submit (move_to_truck)."""
    return _save_into(
        Path(f"company_{int(company_id)}") / f"app_{int(app_id)}" / f"truck_{int(truck_idx)}",
        doc_type, data,
    )


def save_truck(truck_id: int, doc_type: str, data: bytes) -> str:
    """Manager upload for a fleet truck's document."""
    return _save_into(Path("trucks") / f"truck_{int(truck_id)}", doc_type, data)


def save_company(company_id: int, doc_type: str, data: bytes) -> str:
    """Manager upload for a company-level document (owner license)."""
    return _save_into(Path("companies") / f"company_{int(company_id)}", doc_type, data)


def save_driver(driver_id: int, doc_type: str, data: bytes) -> str:
    """Manager upload for a driver's document (CDL, medical cert)."""
    return _save_into(Path("drivers") / f"driver_{int(driver_id)}", doc_type, data)


def move_to_truck(rel_path: str, truck_id: int, doc_type: str) -> str:
    """Relocate a driver-uploaded truck doc (stored per app) into the truck's own
    folder, so every truck document lives under trucks/truck_{id}/ regardless of who
    uploaded it. Returns the new relative path (or the original if the file is gone)."""
    try:
        src = resolve(rel_path)
    except ValueError:
        return rel_path
    if not src.exists():
        return rel_path
    ext = src.suffix.lstrip(".") or "bin"
    new_rel = Path("trucks") / f"truck_{int(truck_id)}" / f"{doc_type}.{ext}"
    dest = _root() / new_rel
    if src == dest:
        return str(new_rel).replace("\\", "/")   # already in place (re-submit)
    dest.parent.mkdir(parents=True, exist_ok=True)
    for old in dest.parent.glob(f"{doc_type}.*"):
        if old != dest:
            old.unlink()
    src.replace(dest)
    return str(new_rel).replace("\\", "/")


def file_response(path, **kwargs) -> FileResponse:
    """Serve an uploaded document with caching disabled. These files are sensitive
    PII and their URL is stable across replacements, so a cached browser copy would
    resurface an old version after a re-upload. `no-store` forbids that."""
    headers = {"Cache-Control": "no-store", **kwargs.pop("headers", {})}
    return FileResponse(path, headers=headers, **kwargs)


def resolve(rel_path: str) -> Path:
    """Map a stored relative path back to an absolute one, guarding against traversal:
    the resolved path must stay under UPLOADS_DIR."""
    root = _root().resolve()
    p = (root / rel_path).resolve()
    if not p.is_relative_to(root):
        raise ValueError("path escapes uploads root")
    return p


def remove_dir(rel_dir: str) -> None:
    """Best-effort delete of an uploads subfolder (e.g. on cascade delete). Never
    raises — leftover files are unreachable without their DB rows anyway."""
    try:
        p = resolve(rel_dir)
    except ValueError:
        return
    if p.is_dir():
        shutil.rmtree(p, ignore_errors=True)

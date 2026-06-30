"""
PDF Generator with Merger Functionality

This script:
1. Compiles the Typst template to generate the base PDF
2. Merges external PDFs (W-9, Fines/Fees) at the correct positions
3. Outputs the final merged PDF

Usage:
    python pdf_generator.py --payload driver_data.json --output final.pdf
"""

import argparse
import base64
import json
import shutil
import subprocess
import tempfile
import uuid
from pathlib import Path

try:
    import pymupdf
except ImportError:
    print("PyMuPDF not installed. Run: pip install pymupdf")
    exit(1)

try:
    from PIL import Image  # signature autocrop (optional — degrades gracefully)
except ImportError:
    Image = None


class PDFGenerator:
    # Unique marker rendered by main.typ on the throwaway page where the W-9 goes.
    W9_ANCHOR = "W9INSERTANCHORPAGE"

    def __init__(self, base_dir: Path = None):
        self.base_dir = base_dir or Path(__file__).parent
        self.main_typ = self.base_dir / "main.typ"
        self.w9_pdf = self.base_dir / "fw9.pdf"
    
    def compile_typst(self, payload: dict, output_path: Path) -> bool:
        """Compile the Typst template with the given payload."""
        payload_json = json.dumps(payload)
        
        cmd = [
            "typst", "compile",
            str(self.main_typ),
            str(output_path),
            "--input", f"payload={payload_json}"
        ]
        
        try:
            result = subprocess.run(
                cmd,
                cwd=str(self.base_dir),
                capture_output=True,
                text=True
            )
            
            if result.returncode != 0:
                print(f"Typst compilation failed: {result.stderr}")
                return False
            
            return True
        except FileNotFoundError:
            print("Typst not found. Please install Typst: https://typst.app/")
            return False
    
    def merge_pdfs(self, base_pdf_path: Path, output_path: Path, is_owner: bool = False, w9_path: Path | None = None) -> bool:
        """Splice the IRS W-9 PDF into the Typst output at the anchor page.

        main.typ renders a throwaway page carrying the unique W9_ANCHOR marker
        exactly where the 6-page W-9 belongs. We find that page, drop it, and
        insert the (filled or blank) W-9 in its place. This is robust to
        owner/non-owner and to optional pages — no hardcoded page offsets.
        (`is_owner` is retained for signature compatibility but no longer used.)
        """
        try:
            base_doc = pymupdf.open(str(base_pdf_path))
            final_doc = pymupdf.open()
            w9_src = w9_path if (w9_path and w9_path.exists()) else self.w9_pdf

            def _insert_w9() -> None:
                if w9_src.exists():
                    w9_doc = pymupdf.open(str(w9_src))
                    final_doc.insert_pdf(w9_doc)
                    w9_doc.close()

            anchor_idx = None
            for i in range(len(base_doc)):
                if base_doc[i].search_for(self.W9_ANCHOR):
                    anchor_idx = i
                    break

            for i in range(len(base_doc)):
                if i == anchor_idx:
                    _insert_w9()          # replace the anchor page with the W-9
                    continue
                final_doc.insert_pdf(base_doc, from_page=i, to_page=i)

            if anchor_idx is None:
                # Anchor missing (template drift): append the W-9 rather than
                # silently dropping a required federal form.
                print("WARNING: W-9 anchor page not found; appending W-9 at end")
                _insert_w9()

            final_doc.save(str(output_path))
            base_doc.close()
            final_doc.close()
            return True

        except Exception as e:
            print(f"PDF merge failed: {e}")
            return False
    
    def _prepare_signatures(self, payload: dict) -> Path | None:
        """Decode base64 signature images to temp PNGs inside base_dir and set
        an `image_path` (relative to base_dir) so the Typst template can embed them.
        Returns the temp dir for later cleanup, or None if there were no images."""
        sigs = payload.get("signatures")
        if not isinstance(sigs, dict):
            return None
        sig_dir: Path | None = None
        for key, sig in sigs.items():
            if not isinstance(sig, dict):
                continue
            b64 = sig.get("image_base64")
            if not b64 or not isinstance(b64, str):
                continue
            if b64.strip().startswith("data:") and "," in b64:
                b64 = b64.split(",", 1)[1]
            try:
                raw = base64.b64decode(b64)
            except Exception:
                continue
            if sig_dir is None:
                sig_dir = self.base_dir / f"_sig_tmp_{uuid.uuid4().hex}"
                sig_dir.mkdir(parents=True, exist_ok=True)
            safe = "".join(c for c in str(key) if c.isalnum() or c in "_-") or "sig"
            fp = sig_dir / f"{safe}.png"
            fp.write_bytes(raw)
            self._autocrop_signature(fp)
            sig["image_path"] = f"{sig_dir.name}/{fp.name}"
            # Drop the raw base64 now that it's a file: the template embeds via
            # image_path, and leaving it in would bloat the Typst --input arg past
            # the OS command-line limit (Errno 7: Argument list too long).
            sig.pop("image_base64", None)
        return sig_dir

    @staticmethod
    def _autocrop_signature(fp: Path) -> None:
        """Trim the empty margins around a signature so it renders as the mark
        itself, not a tiny stroke inside a huge transparent/white box. Handles
        both drawn (transparent background) and uploaded/typed (opaque, usually
        white background) images. Best-effort: never raises."""
        if Image is None:
            return
        try:
            img = Image.open(fp).convert("RGBA")
            alpha = img.getchannel("A")
            if alpha.getextrema()[0] < 255:
                bbox = alpha.getbbox()                       # drawn: opaque strokes
            else:
                gray = img.convert("L")                      # opaque: dark ink on light bg
                bbox = gray.point(lambda p: 255 if p < 200 else 0).getbbox()
            if not bbox:
                return
            pad = 6
            l, t, r, b = bbox
            img.crop((
                max(0, l - pad), max(0, t - pad),
                min(img.width, r + pad), min(img.height, b + pad),
            )).save(fp)
        except Exception:
            pass  # leave the original image untouched on any failure

    @staticmethod
    def _draw_check(page, rect) -> None:
        """Draw a checkmark inside a form box. Radio/checkbox widgets bake to a filled
        dot; overlaying a tick makes the selected option read as a checkbox. Coordinates
        are PyMuPDF page space (origin top-left, y grows downward)."""
        x0, y0, x1, y1 = rect.x0, rect.y0, rect.x1, rect.y1
        w, h = x1 - x0, y1 - y0
        p1 = (x0 + 0.20 * w, y0 + 0.52 * h)   # mid-left
        p2 = (x0 + 0.42 * w, y0 + 0.74 * h)   # bottom vertex
        p3 = (x0 + 0.82 * w, y0 + 0.24 * h)   # upper-right
        width = max(0.8, min(w, h) * 0.12)
        page.draw_line(p1, p2, color=(0, 0, 0), width=width)
        page.draw_line(p2, p3, color=(0, 0, 0), width=width)

    # W-9 federal tax classification -> the tax_classification radio export value
    # on fw9.pdf (the form was rebuilt by hand; these are the new field names).
    _W9_CLASS = {"Individual": "individual", "C Corp": "c_corp",
                 "S Corp": "s_corp", "Partnership": "partnership",
                 "LLC": "llc", "Trust/estate": "trust_estate", "Other": "other"}

    def _fill_w9(self, payload: dict) -> Path | None:
        """Fill the IRS W-9 AcroForm (fw9.pdf) from the driver's W-9 data.
        Returns a filled temp PDF path, or None to fall back to the blank form."""
        w9 = payload.get("w9")
        if not w9 or not self.w9_pdf.exists():
            return None
        try:
            doc = pymupdf.open(str(self.w9_pdf))
        except Exception:
            return None
        page = doc[0]
        tin_digits = "".join(ch for ch in str(w9.get("tin", "")) if ch.isdigit())
        use_ssn = w9.get("type", "Individual") == "Individual"
        class_export = self._W9_CLASS.get(w9.get("type", "Individual"))

        # W-9 signature box: prefer the handwritten image (already decoded to a PNG
        # by _prepare_signatures), else type the legal name. Date from the sig stamp.
        # Fall back to the driver's main (applicant) signature when no dedicated W-9
        # signature was captured, so the W-9 matches the rest of the packet.
        sigs = payload.get("signatures") or {}
        w9_sig = sigs.get("w9") or sigs.get("applicant") or {}
        img_rel = w9_sig.get("image_path")
        sig_img = self.base_dir / img_rel if img_rel else None
        sig_date = w9_sig.get("date") or payload.get("application_date", "") or ""

        # TIN: 9 single-digit boxes, left-to-right. SSN boxes are ssn1..ssn9,
        # EIN boxes are "Employer identification number 1".."9".
        digit_box = {}
        if len(tin_digits) >= 9:
            prefix = "ssn" if use_ssn else "Employer identification number "
            for i in range(9):
                digit_box[f"{prefix}{i + 1}"] = tin_digits[i]

        text_map = {
            "name": w9.get("name", "") or "",
            "business name": w9.get("business_name", "") or "",
            "address": w9.get("address", "") or "",
            "city, state, and zip code": w9.get("city_state_zip", "") or "",
            "LLC classification": w9.get("llc_classification", "") or "",
            "Other (see instructions)_1": w9.get("other_classification", "") or "",
            "Exempt payee code (if any)": w9.get("exempt_payee_code", "") or "",
            "fatca_exemption_code": w9.get("fatca_exemption_code", "") or "",
            "Date": sig_date,
        }
        sig_widget = None
        class_rect = None  # box of the selected tax-classification option (see below)
        for widget in page.widgets():
            name = widget.field_name
            ftype = widget.field_type_string
            if name == "Signature":
                sig_widget = widget
            elif ftype == "Text" and name in text_map:
                widget.field_value = text_map[name]
                widget.update()
            elif ftype == "Text" and name in digit_box:
                widget.field_value = digit_box[name]
                widget.update()
            elif name == "tax_classification" and class_export and \
                    class_export in (widget.button_states().get("normal") or []):
                # Don't toggle the radio "on": its baked appearance is a filled dot.
                # Capture the box and draw a checkmark over it instead (below), so the
                # flattened W-9 reads as a ticked checkbox. Grouping is irrelevant here
                # because the code always selects exactly one option.
                class_rect = widget.rect

        # Signature: overlay the image on its box (and drop the widget so no empty
        # field remains), or fall back to the typed legal name.
        if sig_widget is not None:
            if sig_img and sig_img.exists():
                rect = sig_widget.rect
                page.delete_widget(sig_widget)
                try:
                    page.insert_image(rect, filename=str(sig_img), keep_proportion=True)
                except Exception:
                    pass
            else:
                sig_widget.field_value = w9.get("name", "") or w9_sig.get("signer_first_name", "")
                sig_widget.update()

        # Tick the selected tax classification with a drawn checkmark (the empty box
        # border still renders from the radio's off-appearance after baking).
        if class_rect is not None:
            self._draw_check(page, class_rect)

        # Flatten form fields into static page content so the values always
        # render (and can't be edited) after the W-9 is merged into the packet.
        try:
            doc.bake()
        except Exception:
            pass  # older PyMuPDF without bake(): widgets still carry values
        out = self.base_dir / f"_w9_filled_{uuid.uuid4().hex}.pdf"
        doc.save(str(out))
        doc.close()
        return out

    def _append_documents(self, output_path: Path, documents: dict | None) -> None:
        """Append driver-uploaded documents (already resolved to absolute paths) to the
        end of the assembled contract — images become a page, PDFs are inserted whole.
        Best-effort: a broken/missing file is skipped, never fails the whole packet."""
        if not documents:
            return
        try:
            final = pymupdf.open(str(output_path))
        except Exception:
            return
        appended = False
        for doc_type, path in documents.items():
            try:
                src = pymupdf.open(path)
                if not src.is_pdf:                       # image -> 1-page PDF
                    src = pymupdf.open("pdf", src.convert_to_pdf())
                final.insert_pdf(src)
                src.close()
                appended = True
            except Exception as e:
                print(f"skip uploaded document {doc_type}: {e}")
        if appended:
            final.save(str(output_path), incremental=True, encryption=pymupdf.PDF_ENCRYPT_KEEP)
        final.close()

    def generate(self, payload: dict, output_path: Path) -> bool:
        """Generate the complete PDF with all merges."""

        is_owner = payload.get("is_owner", False)
        sig_dir = self._prepare_signatures(payload)
        w9_path = self._fill_w9(payload)

        try:
            # Step 1: Compile Typst to temp file
            with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
                temp_path = Path(tmp.name)

            print(f"Compiling Typst template...")
            if not self.compile_typst(payload, temp_path):
                return False

            print(f"Typst compiled: {temp_path}")

            # Step 2: Merge with external PDFs (filled W-9 included)
            print(f"Merging PDFs (is_owner={is_owner})...")
            if not self.merge_pdfs(temp_path, output_path, is_owner, w9_path=w9_path):
                return False

            # Step 3: Append driver-uploaded documents (medical cert, license, …).
            self._append_documents(output_path, payload.get("documents"))

            # Cleanup
            temp_path.unlink()

            print(f"Final PDF generated: {output_path}")

            # Get page count
            doc = pymupdf.open(str(output_path))
            print(f"Total pages: {len(doc)}")
            doc.close()

            return True
        finally:
            if sig_dir and sig_dir.exists():
                shutil.rmtree(sig_dir, ignore_errors=True)
            if w9_path and w9_path.exists():
                w9_path.unlink()


def main():
    parser = argparse.ArgumentParser(description="Generate driver application PDF")
    parser.add_argument("--payload", "-p", required=True, help="Path to JSON payload file")
    parser.add_argument("--output", "-o", required=True, help="Output PDF path")
    
    args = parser.parse_args()
    
    # Load payload
    with open(args.payload, "r") as f:
        payload = json.load(f)
    
    # Generate PDF
    generator = PDFGenerator()
    success = generator.generate(payload, Path(args.output))
    
    return 0 if success else 1


if __name__ == "__main__":
    exit(main())

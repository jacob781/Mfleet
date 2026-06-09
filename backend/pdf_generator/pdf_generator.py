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


class PDFGenerator:
    def __init__(self, base_dir: Path = None):
        self.base_dir = base_dir or Path(__file__).parent
        self.main_typ = self.base_dir / "main.typ"
        self.w9_pdf = self.base_dir / "fw9.pdf"
        self.fines_pdf = self.base_dir / "FINES_AND_FEES_SCHEDULE.pdf"
    
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
    
    def merge_pdfs(self, base_pdf_path: Path, output_path: Path, is_owner: bool, w9_path: Path | None = None) -> bool:
        """
        Merge the base PDF with external PDFs.
        
        Document structure:
        - Pages 1-33: Core application (always present)
        - Pages 34-47: Lease Agreement (OWNER ONLY)
        - Page 48: Supplement B
        - Page 49: W-9 form (6 pages from fw9.pdf)
        - Pages 50+: Direct Deposit, Penalties (replace with FINES_AND_FEES_SCHEDULE.pdf), 
                     Dash Camera, Hold Harmless, Incident Protocol
        """
        try:
            base_doc = pymupdf.open(str(base_pdf_path))
            final_doc = pymupdf.open()
            
            # Calculate insertion points based on owner status
            if is_owner:
                # Owner mode: Pages 34-47 (Lease) + 48 (Supplement B) present
                # After Supplement B, insert W-9
                supplement_b_end = -1  # Will find it
                
                # For owner: Supplement B is after Lease Agreement
                # In our structure, we need to find where to insert W-9
                # Since we're inserting after all generated content, 
                # we insert W-9 after supplement B
                
                # For now, we'll append in the correct order:
                # 1. All generated pages up to and including page 50 (Direct Deposit)
                # 2. Then insert W-9 (this is page 49 in the final doc)
                # 3. Then continue with remaining pages
                
                # Simpler approach: Insert W-9 before Direct Deposit
                # In our Typst output order:
                # - Lease Agreement (8 pages for owner)
                # - Supplement B (1 page)
                # - Direct Deposit (1 page)
                # - Penalties (3 pages) <- Replace with FINES_AND_FEES_SCHEDULE.pdf
                
                # Owner mode has 65 pages, non-owner has 57
                # Let's calculate the insertion point
                
                # Base pages before Sprint 5 = 44 pages
                # Lease Agreement = 8 pages (owner only)
                # Supplement B = 1 page
                # So W-9 goes after page 44 + 8 + 1 = 53 for owner
                
                w9_insert_after = 52  # 0-indexed, after Supplement B
            else:
                # Non-owner: No Lease Agreement
                # Supplement B is right after page 44
                w9_insert_after = 44  # 0-indexed
            
            # Insert all pages up to W-9 insertion point
            for i in range(min(w9_insert_after + 1, len(base_doc))):
                final_doc.insert_pdf(base_doc, from_page=i, to_page=i)
            
            # Insert W-9 form (filled copy if provided, else the blank template)
            w9_src = w9_path if (w9_path and w9_path.exists()) else self.w9_pdf
            if w9_src.exists():
                w9_doc = pymupdf.open(str(w9_src))
                final_doc.insert_pdf(w9_doc)
                w9_doc.close()
            
            # Find and handle penalties section
            # We need to skip the Typst-generated penalties pages and use FINES_AND_FEES_SCHEDULE.pdf instead
            # For now, insert remaining pages from base PDF
            # NOTE: In future, we'll replace the penalties section
            
            remaining_start = w9_insert_after + 1
            if remaining_start < len(base_doc):
                # Skip the penalties pages (3 pages) and insert the PDF version instead
                # Direct Deposit is 1 page after W-9 insertion point
                # Penalties is the next 3 pages
                
                # Insert Direct Deposit page
                direct_deposit_page = remaining_start
                if direct_deposit_page < len(base_doc):
                    final_doc.insert_pdf(base_doc, from_page=direct_deposit_page, to_page=direct_deposit_page)
                
                # Insert Fines/Fees PDF instead of Typst penalties
                if self.fines_pdf.exists():
                    fines_doc = pymupdf.open(str(self.fines_pdf))
                    final_doc.insert_pdf(fines_doc)
                    fines_doc.close()
                
                # Skip the 3 Typst penalties pages and insert remaining
                skip_penalties = 3
                after_penalties = direct_deposit_page + 1 + skip_penalties
                if after_penalties < len(base_doc):
                    for i in range(after_penalties, len(base_doc)):
                        final_doc.insert_pdf(base_doc, from_page=i, to_page=i)
            
            # Save the final document
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
            sig["image_path"] = f"{sig_dir.name}/{fp.name}"
            # Drop the raw base64 now that it's a file: the template embeds via
            # image_path, and leaving it in would bloat the Typst --input arg past
            # the OS command-line limit (Errno 7: Argument list too long).
            sig.pop("image_base64", None)
        return sig_dir

    # W-9 federal tax classification box -> AcroField export state on fw9.pdf.
    _W9_CLASS_BOX = {"Individual": "1", "C Corp": "2", "S Corp": "3", "Partnership": "4"}

    def _fill_w9(self, w9: dict | None) -> Path | None:
        """Fill the IRS W-9 AcroForm (fw9.pdf) from the driver's W-9 data.
        Returns a filled temp PDF path, or None to fall back to the blank form."""
        if not w9 or not self.w9_pdf.exists():
            return None
        try:
            doc = pymupdf.open(str(self.w9_pdf))
        except Exception:
            return None
        page = doc[0]
        tin_digits = "".join(ch for ch in str(w9.get("tin", "")) if ch.isdigit())
        wtype = w9.get("type", "Individual")
        class_box = self._W9_CLASS_BOX.get(wtype)
        use_ssn = wtype == "Individual"
        text_map = {
            "f1_01[0]": w9.get("name", "") or "",
            "f1_02[0]": w9.get("business_name", "") or "",
            "f1_07[0]": w9.get("address", "") or "",
            "f1_08[0]": w9.get("city_state_zip", "") or "",
        }
        for widget in page.widgets():
            short = widget.field_name.split(".")[-1]
            ftype = widget.field_type_string
            if ftype == "Text":
                if short in text_map:
                    widget.field_value = text_map[short]
                    widget.update()
                elif use_ssn and len(tin_digits) == 9:
                    part = {"f1_11[0]": tin_digits[0:3], "f1_12[0]": tin_digits[3:5], "f1_13[0]": tin_digits[5:9]}.get(short)
                    if part is not None:
                        widget.field_value = part
                        widget.update()
                elif not use_ssn and len(tin_digits) >= 9:
                    part = {"f1_14[0]": tin_digits[0:2], "f1_15[0]": tin_digits[2:9]}.get(short)
                    if part is not None:
                        widget.field_value = part
                        widget.update()
            elif ftype == "CheckBox" and class_box and short.startswith("c1_1["):
                if class_box in widget.button_states().get("normal", []):
                    widget.field_value = class_box
                    widget.update()
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

    def generate(self, payload: dict, output_path: Path) -> bool:
        """Generate the complete PDF with all merges."""

        is_owner = payload.get("is_owner", False)
        sig_dir = self._prepare_signatures(payload)
        w9_path = self._fill_w9(payload.get("w9"))

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

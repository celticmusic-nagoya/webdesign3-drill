"""Create and verify the teacher's ready-to-open delivery folder. No GitHub required."""
import hashlib
import json
import pathlib
import shutil
import sys
import zipfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
INNER = ROOT / "dist" / "teacher-handoff"
DELIVERY = ROOT / "dist" / "teacher-delivery"
README = "最初にお読みください.txt"
ZIP = "ChatGPT引継ぎパッケージ.zip"

def hash_file(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()

def create():
    if DELIVERY.exists():
        shutil.rmtree(DELIVERY)
    DELIVERY.mkdir(parents=True)
    shutil.copytree(INNER / "app", DELIVERY / "app")
    # UTF-8 BOM and CRLF for Windows Notepad.
    text = (ROOT / "docs" / "TEACHER_FOLDER_README.txt").read_text(encoding="utf-8")
    (DELIVERY / README).write_bytes(b"\xef\xbb\xbf" + text.replace("\n", "\r\n").encode("utf-8"))
    with zipfile.ZipFile(DELIVERY / ZIP, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6) as z:
        for p in sorted(INNER.rglob("*")):
            if p.is_file():
                z.write(p, p.relative_to(INNER).as_posix())

def verify():
    assert {p.name for p in DELIVERY.iterdir()} == {"app", README, ZIP}
    instructions = (DELIVERY / README).read_text(encoding="utf-8-sig")
    assert "index.html" in instructions and ZIP in instructions and "AI_START.txt" in instructions
    expected = json.loads((INNER / "PACKAGE_MANIFEST.json").read_text(encoding="utf-8"))
    records = {r["path"]: r for r in expected["files"]}
    with zipfile.ZipFile(DELIVERY / ZIP) as z:
        names = z.namelist()
        assert len(names) == len(set(names)), "Duplicate archive entries"
        assert set(names) == set(records) | {"PACKAGE_MANIFEST.json"}, "ZIP contents differ from manifest"
        assert {"AI_START.txt", "source/AGENTS.md", "app/index.html", "source/tools/build-local.cjs"} <= set(names)
        assert z.read("PACKAGE_MANIFEST.json") == (INNER / "PACKAGE_MANIFEST.json").read_bytes()
        for name, record in records.items():
            data = z.read(name)
            assert len(data) == record["size"], name
            assert hashlib.sha256(data).hexdigest() == record["sha256"], name
            if name.startswith("app/"):
                assert hash_file(DELIVERY / name) == record["sha256"], "Outer app differs: " + name
        assert z.testzip() is None
    actual_app = {p.relative_to(DELIVERY).as_posix() for p in (DELIVERY / "app").rglob("*") if p.is_file()}
    assert actual_app == {n for n in records if n.startswith("app/")}
    print("PASS: teacher delivery folder, Windows TXT, nested ZIP integrity,", len(records), "files, identical app")

if __name__ == "__main__":
    if "--verify-only" not in sys.argv:
        create()
    verify()

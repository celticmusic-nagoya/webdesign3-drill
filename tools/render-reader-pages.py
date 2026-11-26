"""Regenerate reader WebP pages locally, without Git or GitHub. Update text/page counts separately."""
import argparse, hashlib, json, pathlib
import fitz
from PIL import Image

root = pathlib.Path(__file__).resolve().parent.parent / "materials"
def digest(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def blob(p):
    b=p.read_bytes()
    return hashlib.sha1(b"blob "+str(len(b)).encode()+b"\0"+b).hexdigest()
def render(pdf, out, stem, scale, guide=False):
    out.mkdir(exist_ok=True)
    rows=[]
    with fitz.open(pdf) as doc:
        for i,p in enumerate(doc,1):
            pix=p.get_pixmap(matrix=fitz.Matrix(scale,scale),alpha=False)
            img=Image.frombytes("RGB",(pix.width,pix.height),pix.samples)
            dest=out/f"{stem}{i:02}.webp"
            img.save(dest,quality=90)
            with Image.open(dest) as check:
                check.load()
                assert check.size==img.size
            row=dict(width=img.width,height=img.height,sha256=digest(dest))
            row["page" if guide else "file"]=i if guide else dest.name
            rows.append(row)
    assert rows
    return dict(source_git_sha=blob(pdf),pages=rows)
def write(out,obj):
    (out/"manifest.json").write_text(json.dumps(obj,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
if __name__=="__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("target",choices=["guide","lectures"])
    args=parser.parse_args()
    if args.target=="guide":
        out=root/"exam-guide-pages"
        write(out,render(root/"攻略マニュアル.pdf",out,"page-",2.0,True))
    else:
        out=root/"textbook-pages"
        write(out,{str(n):render(root/f"lesson-{n:02}.pdf",out,f"lesson-{n:02}-",1.8) for n in (3,4)})
    print("Generated",out,"; verify all pages visually and update reader text/counts.")

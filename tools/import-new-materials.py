#!/usr/bin/env python3
"""Import the eight supplied PDF originals and two 60-question sets from the ZIP.
Usage: python3 tools/import-new-materials.py /path/to/webdesign3_new_materials.zip
Does not overwrite the two existing lesson PDFs or any existing question IDs.
"""
import hashlib, json, pathlib, sys, zipfile
ROOT=pathlib.Path(__file__).resolve().parent.parent
SOURCES=[
 ('テキスト3回目.pdf','lesson-03.pdf',23),
 ('テキスト4回目.pdf','lesson-04.pdf',20),
 ('第3回_自宅学習_穴埋め.pdf','homework-03.pdf',4),
 ('第4回_自宅学習_穴埋め.pdf','homework-04.pdf',4),
 ('第1〜4回_総合復習60問_過去問収録.pdf','review-01-04-questions.pdf',7),
 ('第1〜4回_総合復習60問_解答・解説.pdf','review-01-04-answers.pdf',3),
 ('第3・4回_総合復習60問_問題冊子.pdf','review-03-04-questions.pdf',7),
 ('第3・4回_総合復習60問_解答・解説.pdf','review-03-04-answers.pdf',3)]
def main(archive):
 with zipfile.ZipFile(archive) as z:
  manifest={x['filename']:x for x in json.loads(z.read('manifest.json'))}
  questions=json.loads(z.read('question_sets.json'))
  assert len(questions)==120 and len({q['id'] for q in questions})==120
  assert {q['category'] for q in questions}=={'LECTURE_1_4_REVIEW','LECTURE_3_4_REVIEW'}
  assert all(q['id']>=2001 for q in questions)
  assert all(isinstance(q['correct'],int) and 0<=q['correct']<len(q['options']) for q in questions)
  for source,dest,pages in SOURCES:
   data=z.read('pdf/'+source)
   assert data.startswith(b'%PDF-') and hashlib.sha256(data).hexdigest()==manifest[source]['sha256']
   assert manifest[source]['pages']==pages
  for source,dest,_ in SOURCES:
   (ROOT/'materials'/dest).write_bytes(z.read('pdf/'+source))
  js='// Generated from supplied original PDF question/answer booklets; do not edit by hand.\nwindow.ADDITIONAL_LECTURE_QUESTIONS = '+json.dumps(questions,ensure_ascii=False,separators=(',',':'))+';\n'
  (ROOT/'materials/question-sets-03-04.js').write_text(js,encoding='utf-8')
  (ROOT/'materials/NEW_MATERIALS_MANIFEST.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
  print('PASS: eight SHA-256 verified PDFs and 120 unique questions imported')
if __name__=='__main__':
 if len(sys.argv)!=2: raise SystemExit('Usage: python3 tools/import-new-materials.py ZIP')
 main(sys.argv[1])

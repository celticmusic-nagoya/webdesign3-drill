# 編集・再生成・サーバー掲載手順（GitHubなし）

## 配布物と編集原本
app/index.html は単一HTMLとして動く生成物。app/ には原本PDFと他の閲覧ページも同梱する。source/ は保守正本であり、app/ だけの直接編集では次の再生成時に修正が失われる。前版ZIPを別保存し、修正版を別版として保存する。学生の学習データは配布ZIPに含まれず、端末のlocalStorageに保存される。

## ファイル対応
| 機能 | 編集先 |
| --- | --- |
| トップ、通常問題、苦手問題、模擬試験、単語帳 | index.html（QUESTIONS、CATEGORIES） |
| 総合復習120問 | materials/question-sets-03-04.js |
| 穴埋めドリル200問 | materials/homework-drill.js、homework-drill.html |
| 教科書問題158問 | materials/textbook-original.js、textbook-original.html |
| 第1・2回教科書 | textbook.html、materials/lesson-01.pdf、lesson-02.pdf、SOURCE_MANIFEST.json |
| 第3・4回・追加教材 | additional-materials.html、materials/lesson-03.pdf、lesson-04.pdf など、textbook-pages/manifest.json |
| 攻略マニュアル | exam-guide.html、materials/攻略マニュアル.pdf、exam-guide-pages/manifest.json |
| 閲覧操作 | reader-swipe.js |
| ソース版PWA | sw.js、manifest.webmanifest |
| 配布版生成 | tools/build-offline.cjs、tools/build-local.cjs、tools/build-teacher-package.cjs |
| QA | tools/qa-textbook-browser.cjs、tools/qa-offline-browser.cjs、tools/qa-review-source.cjs、tools/qa-teacher-package.cjs |

## 教材の追加・改訂
- 原本、版、ページ数、SHA-256、出典・配布許諾を記録。原本に欠損があれば先生に確認する。PDFのファイル名だけを追加しても画面には反映されない。
- 問題は既存バンクの形式を参照し、一意な固定id、question、options、correct（0始まり）、explanation、type、categoryを保持。教科書系は lesson/page/textbookPage、総合復習は source_question も参照。正答と誤答の理由を説明する。
- 第5回以降は既存の4回固定の選択UI、ページ配列、参照、生成・QAの件数をすべて見直す。PDFの入れ替え時は本文、ページ画像・マニフェスト、参照、目次、PDF一覧とキャッシュを同期する。
- 第3・4回と攻略マニュアルのページ画像は tools/render-reader-pages.py でローカル再生成可能。先に原本とページ数を確定し、生成後に目次・本文・固定件数テストを更新する。第1・2回は SOURCE_MANIFEST.json と本文も更新する。旧版の原本・画像は別ZIPに保護。
- 総合復習解答PDFの原本照合は tools/qa-review-source.cjs。SHAと答えの対応を正しい原本から確認して更新する。合格を偽装するためにチェックを削除しない。
- ソース版PWAのキャッシュ名は sw.js、exam-guide.html、additional-materials.html で統一する。配布版は埋め込み資産を再生成する。

## ローカル生成
実行環境: Node.js 22、Python 3.12、Popplerの pdfinfo/pdftoppm（PATH上）、npm依存関係。初回の依存インストールはネット接続が必要。WindowsではWSL/Linuxの開発環境、またはこれらが揃うChatGPTの実行環境を推奨。アプリ閲覧自体はインストール不要。

source/ に移動して実行:
```sh
npm install --no-save --no-package-lock tailwindcss@3.4.17 playwright@1.58.2
npx playwright install chromium
python3 -m pip install PyMuPDF==1.26.7 Pillow==11.3.0
node tools/build-local.cjs
node tools/qa-review-source.cjs
node tools/qa-textbook-browser.cjs
node tools/qa-offline-browser.cjs
node tools/build-teacher-package.cjs
node tools/qa-teacher-package.cjs
```
LinuxでChromiumのシステム依存が不足する場合は npx playwright install --with-deps chromium を利用（管理権限が必要な場合あり）。配布フォルダは dist/teacher-handoff/ に生成される。これをZIPにする。元のsource/を残したまま作業する。

## サーバーへ掲載（学校・自前サーバー）
生成された app/ の中身だけを静的サイトの公開ディレクトリへ置く。PHP・DB・GitHubは不要。index.html と相対パスを維持し、HTTPS推奨。サブディレクトリでも動作するか確認する。この配布版はHTML内に画像・PDF・CSSを収録しており、外部CDNを必要としない。一般公開前に教材の許諾を確認。URLを知らせないだけではアクセス制限にならないので、校内限定ならサーバー側で認証・IP制限等を設定する。学習記録は各利用者のブラウザ内に残り、学校側で成績を自動集計する機能はない。別のURL/ファイルパスに移ると保存領域も変わる。通常問題集のバックアップはあるが、全ドリル・閲覧履歴を完全移行する機能はない。

## 現行基準
2026-11-26、機能基準コミット 1fcef4db5bb8431b5dd82402a4001c2370f28b7e。通常問題300（基本120＋総合演習60＋総合復習120）、教科書問題158、穴埋め200（計658収録レコード、類似問題あり）。教科書4回13/10/23/20ページ、攻略マニュアル11ページ。学習再開、模擬試験、教科書参照・復帰、ページ送り、縮小・原本保存に対応。総合復習120問は原本正答照合済み、第20・25・52問は承認済み補完文。358問の意味上の全件照合、全データの一括バックアップ、Windows/Android実機の最新確認は未完了。実施済み自動QAと実機確認を区別する。

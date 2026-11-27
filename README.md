# ウェブデザイン技能検定3級 学習アプリ

PC・スマホ対応の教材閲覧・学習・試験対策アプリ。先生への引継ぎはGitHubを必要としません。

- [先生向け引継ぎ・初回指示](docs/TEACHER_START.md)
- [編集・再生成・サーバー掲載手順](docs/MAINTENANCE.md)
- [AI共通保守規約](AGENTS.md)
- [検査・配布チェックリスト](docs/RELEASE_CHECKLIST.md)
- [総合復習の原本照合](docs/REVIEW_SOURCE_AUDIT_20261126.md)

配布パッケージは app/（実行版）と source/（編集原本）の2つに分ける。app/index.html を開けば通信なしで利用できる。source/ から tools/build-local.cjs で再生成し、tools/build-teacher-package.cjs で引継ぎ一式を再作成する。GitHub Actionsを使う場合は Teacher handoff package の成果物を取得する。先生側の管理・更新・サーバー掲載は独立して可能。

先生へ渡す最終フォルダは dist/teacher-delivery/。app/、最初にお読みください.txt、ChatGPT引継ぎパッケージ.zip、オンライン版QR.png の4項目を収録する。更新時は内側のZIPをChatGPTに添付し、AI_START.txtを読ませる。GitHub Actionsの配布成果物名は webdesign3-teacher-ready-folder。

JS直前対策：トップからチートシート4ページ（テキスト再構成版）と40問の分野別・全問・誤答演習。問題ごとに資料ページを参照し元の問題へ復帰可能。原本PDFバイナリは別途保管。

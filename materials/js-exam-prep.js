window.JS_EXAM_PREP={
  "source": {
    "name": "JS_得点に変える直前チートシート_最終版.pdf",
    "sha256": "53b06b3c6c71746ec8d75d6d588165e6f539c1282cd57d694396d92e46f2256d",
    "pages": 4,
    "format": "source-derived text edition; original binary not embedded",
    "questions": "学習用の作成問題（原本の過去問そのものではない）"
  },
  "pages": [
    {
      "title": "知識・記述ルール",
      "sections": [
        [
          "01 標準規格を聞かれたら ECMAScript",
          "ECMAScript（エクマスクリプト）は、JavaScriptの基礎となる言語仕様。実行環境によって基本ルールがばらばらにならないよう、共通の仕様が定められている。Javaとは別の言語。問題文の「JavaScript」「標準化」「仕様」に注目。"
        ],
        [
          "02 HTMLにJavaScriptを書く方法は2種類",
          "script要素はJavaScriptをHTML文書に組み込むときに使う。",
          [
            [
              "HTMLに直接記述",
              "\u003cscript>\n alert(\"こんにちは\");\n\u003c/script>"
            ],
            [
              "外部JSファイルを読み込む",
              "\u003cscript src=\"sample.js\">\u003c/script>"
            ],
            [
              "比較：外部CSS",
              "\u003clink rel=\"stylesheet\" href=\"style.css\">"
            ]
          ],
          "外部JSは script と src、外部CSSは link と href。外部JSは1つのHTML文書に複数読み込める。"
        ],
        [
          "03 HTML・CSSの知識で要素を探す",
          "documentは現在のHTML文書を表す。DOMはHTMLなどの文書をプログラムから扱う仕組み。",
          [
            [
              "ID名 title",
              "document.getElementById(\"title\")"
            ],
            [
              "CSSセレクタでID",
              "document.querySelector(\"#title\")"
            ],
            [
              "CSSセレクタでクラス",
              "document.querySelector(\".title\")"
            ],
            [
              "main要素",
              "document.querySelector(\"main\")"
            ]
          ],
          "CSSと同じ指定方法ならquerySelector。getElementByIdはID名だけなので # は不要。querySelectorは最初に一致した要素を取得する。"
        ]
      ]
    },
    {
      "title": "CSSの知識を使う",
      "sections": [
        [
          "04 ドット記法",
          "ドット（.）は、対象が持っている情報や機能を指定するときに使う。box.style.colorは「boxのstyleのcolor」。boxがHTML要素なら文字色の指定を扱う。",
          [
            [
              "非表示：display: none;",
              "style.display = \"none\";"
            ],
            [
              "文字サイズ：font-size: 2em;",
              "style.fontSize = \"2em\";"
            ],
            [
              "文字色：color: red;",
              "style.color = \"red\";"
            ],
            [
              "背景色：background-color: red;",
              "style.backgroundColor = \"red\";"
            ]
          ],
          "この形式でCSSを変更するならstyle。通常のCSSプロパティ名にハイフンがある場合は、ハイフンを取り次の文字を大文字にする（キャメルケース）。"
        ],
        [
          "05 穴埋め問題は、問題文の目的を先に見る",
          "例題① ボタンを押すとboxを非表示にする。",
          [
            [
              "コード",
              "function hideElem() {\n box. A = \"none\";\n}"
            ],
            [
              "選択肢",
              "1. display / 2. style.display / 3. block / 4. style.color"
            ]
          ],
          "非表示 → CSSのdisplay: none → JSではstyle.display → 正解2。hideElemは作成者が付けた名前。"
        ],
        [
          "05 例題② 文字を大きくする",
          "空欄に入るのは？",
          [
            [
              "コード",
              "function fontLarge() {\n document.getElementById(\"box\"). A = \"2em\";\n}"
            ],
            [
              "選択肢",
              "1. size / 2. font-size / 3. style.fontSize / 4. style.size"
            ]
          ],
          "文字サイズ → CSSのfont-size → styleとキャメルケース → 正解3。長いコードでも空欄に必要な部分を見る。"
        ]
      ]
    },
    {
      "title": "イベントと用語",
      "sections": [
        [
          "06 イベントは「いつ」、ハンドラは「何をする」",
          "イベント＝クリックや入力などの出来事。イベントハンドラ＝その出来事に応じて実行される処理（関数など）。onclickなどやaddEventListenerで結びつける。greetは作成者が付けた関数名。",
          [
            [
              "クリック",
              "button.onclick = greet;"
            ],
            [
              "クリック",
              "button.addEventListener(\"click\", greet);"
            ],
            [
              "クリック：onclick",
              "\"click\""
            ],
            [
              "入力：oninput",
              "\"input\""
            ],
            [
              "値の変更：onchange",
              "\"change\""
            ],
            [
              "読み込み完了：onload",
              "\"load\""
            ]
          ],
          "addEventListenerのイベント名にはonを付けない。値の変更ならchange。"
        ],
        [
          "07 問題文の言葉から記述を探す",
          "問題文のヒントと記述を対応させる。",
          [
            [
              "文字として内容を変更",
              "textContent"
            ],
            [
              "HTMLとして内容を変更",
              "innerHTML"
            ],
            [
              "コンソールに出力",
              "console.log"
            ],
            [
              "警告ダイアログを表示",
              "alert"
            ],
            [
              "関数を定義する",
              "function"
            ],
            [
              "フォームの入力値",
              "value（例：field.value）"
            ]
          ],
          "alert()はブラウザ上にメッセージとOKボタンを表示する。警告だけでなく結果やお知らせにも使える。"
        ]
      ]
    },
    {
      "title": "短いコードの実行結果",
      "sections": [
        [
          "08 配列は0番から数える",
          "配列は複数の値を順番にまとめたもの。[ ]で並んだ値に番号を振る。",
          [
            [
              "コード",
              "var items = [\"A\", \"B\", \"C\"];\nconsole.log(items[1]);"
            ],
            [
              "番号と値",
              "0 → A / 1 → B / 2 → C"
            ],
            [
              "結果",
              "B"
            ]
          ],
          "この配列のitems[3]は存在しないためundefined。"
        ],
        [
          "09 代入は右から左、文字列の＋はつなぐ",
          "変数は値を使うために付けた名前。=は右側の値を左側に入れる。letは入れ直せる。constは再代入できない。",
          [
            [
              "初期値",
              "let word = \"Web\";"
            ],
            [
              "代入",
              "word = word + \"Site\";"
            ],
            [
              "出力",
              "console.log(word); // WebSite"
            ],
            [
              "数値の＋",
              "10 + 20 → 30"
            ],
            [
              "文字列の＋",
              "\"10\" + \"20\" → \"1020\""
            ]
          ],
          "引用符で囲まれた文字列同士の+は連結。数値同士の+は足し算。"
        ],
        [
          "10 試験直前チェック",
          "① JavaScriptの基礎となる標準規格は？ ② 外部JSのファイル指定はsrc / href？ ③ JSのstyleで背景色を指定する記述は？ ④ addEventListenerでクリックを指定するイベント名は？ ⑤ [\"X\", \"Y\", \"Z\"] のインデックス1の値は？ ⑥ let x = \"A\"; x = x + \"B\"; の後のxの値は？",
          [
            [
              "答え",
              "① ECMAScript　② src　③ style.backgroundColor　④ click　⑤ Y　⑥ AB"
            ]
          ],
          "原資料の参照：第3回講義テキスト、R7-3第2問、R7-4第12問、R8-1第13・18問、R8-2第13・21問。例題は復習用に作成されたもの。"
        ]
      ]
    }
  ],
  "questions": [
    {
      "id": "JS-001",
      "page": 1,
      "topic": 1,
      "question": "JavaScriptの基礎となる標準規格はどれか。",
      "options": [
        "ECMAScript",
        "Java",
        "HTML",
        "CSS"
      ],
      "correct": 0,
      "explanation": "「標準化」「仕様」に注目。ECMAScriptはJavaScriptの共通言語仕様であり、Javaとは別の言語。"
    },
    {
      "id": "JS-002",
      "page": 1,
      "topic": 1,
      "question": "ECMAScriptの説明として適切なものはどれか。",
      "options": [
        "HTMLの要素名",
        "JavaScriptの基本ルールを定める仕様",
        "CSSの記述方式",
        "ブラウザ名"
      ],
      "correct": 1,
      "explanation": "環境による基本ルールのばらつきを抑える共通仕様。HTML要素、CSS、ブラウザそのものではない。"
    },
    {
      "id": "JS-003",
      "page": 1,
      "topic": 2,
      "question": "HTMLに直接JavaScriptを書くときに使う要素はどれか。",
      "options": [
        "link",
        "style",
        "script",
        "main"
      ],
      "correct": 2,
      "explanation": "JavaScriptをHTML文書に組み込むのはscript要素。linkは外部CSSなどの参照に用いる。"
    },
    {
      "id": "JS-004",
      "page": 1,
      "topic": 2,
      "question": "外部JavaScriptを読み込む正しい記述はどれか。",
      "options": [
        "\u003cscript href=\"sample.js\">\u003c/script>",
        "\u003clink src=\"sample.js\">",
        "\u003cstyle src=\"sample.js\">\u003c/style>",
        "\u003cscript src=\"sample.js\">\u003c/script>"
      ],
      "correct": 3,
      "explanation": "外部JSはscriptとsrcの組み合わせ。hrefはここでは使わない。"
    },
    {
      "id": "JS-005",
      "page": 1,
      "topic": 2,
      "question": "外部CSSの読み込みに使う組み合わせはどれか。",
      "options": [
        "link と href",
        "script と src",
        "link と src",
        "script と href"
      ],
      "correct": 0,
      "explanation": "資料の比較表では外部CSSはlink rel=\"stylesheet\" href、外部JSはscript src。"
    },
    {
      "id": "JS-006",
      "page": 1,
      "topic": 2,
      "question": "1つのHTML文書に外部JSを複数読み込める。",
      "options": [
        "○",
        "×"
      ],
      "correct": 0,
      "explanation": "script要素を複数記述して、複数の外部JSを読み込める。"
    },
    {
      "id": "JS-007",
      "page": 1,
      "topic": 3,
      "question": "現在のHTML文書を表すのはどれか。",
      "options": [
        "style",
        "document",
        "value",
        "function"
      ],
      "correct": 1,
      "explanation": "documentは現在の文書を表す。DOMは文書をプログラムから扱う仕組み。"
    },
    {
      "id": "JS-008",
      "page": 1,
      "topic": 3,
      "question": "ID名titleの要素をgetElementByIdで取得する正しい記述はどれか。",
      "options": [
        "document.getElementById(\"#title\")",
        "document.getElementById(\".title\")",
        "document.getElementById(\"title\")",
        "document.querySelector(\".title\")"
      ],
      "correct": 2,
      "explanation": "getElementByIdの引数はID名そのもの。#を付けるのはCSSセレクタを使うquerySelectorの場合。"
    },
    {
      "id": "JS-009",
      "page": 1,
      "topic": 3,
      "question": "CSSセレクタでクラスtitleを取得する記述はどれか。",
      "options": [
        "document.querySelector(\"#title\")",
        "document.getElementById(\"title\")",
        "document.querySelector(\"title\")",
        "document.querySelector(\".title\")"
      ],
      "correct": 3,
      "explanation": "クラスセレクタはドット＋クラス名。querySelectorはCSSと同じ指定方法を使う。"
    },
    {
      "id": "JS-010",
      "page": 1,
      "topic": 3,
      "question": "main要素をCSSセレクタで取得する記述はどれか。",
      "options": [
        "document.querySelector(\"main\")",
        "document.querySelector(\"#main\")",
        "document.querySelector(\".main\")",
        "document.getElementById(\"main\")"
      ],
      "correct": 0,
      "explanation": "要素名のセレクタには#や.を付けない。#mainはID、.mainはクラス。"
    },
    {
      "id": "JS-011",
      "page": 1,
      "topic": 3,
      "question": "querySelectorは一致する要素のうち最初の1つを取得する。",
      "options": [
        "○",
        "×"
      ],
      "correct": 0,
      "explanation": "資料の03の要点。CSSセレクタに最初に一致する要素を取得する。"
    },
    {
      "id": "JS-012",
      "page": 2,
      "topic": 4,
      "question": "box.style.colorが扱うものはどれか（boxはHTML要素）。",
      "options": [
        "背景色",
        "文字色",
        "文字の大きさ",
        "表示・非表示"
      ],
      "correct": 1,
      "explanation": "boxのstyleのcolorと区切って読む。CSSのcolorは文字色。"
    },
    {
      "id": "JS-013",
      "page": 2,
      "topic": 4,
      "question": "CSSのfont-sizeをJSのstyleで変更するプロパティ名はどれか。",
      "options": [
        "font-size",
        "fontsize",
        "fontSize",
        "font_size"
      ],
      "correct": 2,
      "explanation": "ハイフンを取り次の文字を大文字にする。font-size → fontSize。"
    },
    {
      "id": "JS-014",
      "page": 2,
      "topic": 4,
      "question": "背景色を赤にする記述はどれか。",
      "options": [
        "box.style.color = \"red\";",
        "box.backgroundColor = \"red\";",
        "box.style.background-color = \"red\";",
        "box.style.backgroundColor = \"red\";"
      ],
      "correct": 3,
      "explanation": "background-colorをキャメルケースに変えてstyle.backgroundColorとする。colorは文字色。"
    },
    {
      "id": "JS-015",
      "page": 2,
      "topic": 5,
      "question": "ボタンを押すとboxを非表示にする。空欄Aは？\nfunction hideElem() {\n box. A = \"none\";\n}",
      "options": [
        "display",
        "style.display",
        "block",
        "style.color"
      ],
      "correct": 1,
      "explanation": "目的は非表示。CSSのdisplay:noneからstyle.displayを選ぶ。hideElemの名前を読み解く必要はない。"
    },
    {
      "id": "JS-016",
      "page": 2,
      "topic": 5,
      "question": "文字を大きくする。空欄Aは？\nfunction fontLarge() {\n document.getElementById(\"box\"). A = \"2em\";\n}",
      "options": [
        "size",
        "font-size",
        "style.fontSize",
        "style.size"
      ],
      "correct": 2,
      "explanation": "文字サイズ→font-size→style.fontSize。CSSとJSの記述差に注目する。"
    },
    {
      "id": "JS-017",
      "page": 2,
      "topic": 4,
      "question": "boxの文字色を赤にする記述はどれか。",
      "options": [
        "box.style.color = \"red\";",
        "box.style.backgroundColor = \"red\";",
        "box.color = \"red\";",
        "box.style.fontSize = \"red\";"
      ],
      "correct": 0,
      "explanation": "目的は文字色。style.colorを使う。背景色のbackgroundColorや文字サイズのfontSizeとは区別する。"
    },
    {
      "id": "JS-018",
      "page": 2,
      "topic": 4,
      "question": "CSSのbackground-colorをJSで変更するとき、style.backgroundColorと記述する。",
      "options": [
        "○",
        "×"
      ],
      "correct": 0,
      "explanation": "CSSのハイフン付きプロパティをこの形式で指定するときはキャメルケースにする。"
    },
    {
      "id": "JS-019",
      "page": 3,
      "topic": 6,
      "question": "イベントとイベントハンドラの関係として適切なのはどれか。",
      "options": [
        "イベントは関数、ハンドラは出来事",
        "イベントは出来事、ハンドラは応じて実行する処理",
        "どちらもCSSプロパティ",
        "どちらも標準規格名"
      ],
      "correct": 1,
      "explanation": "イベントは「いつ」、ハンドラは「何をする」。クリックなどの出来事と処理を結びつける。"
    },
    {
      "id": "JS-020",
      "page": 3,
      "topic": 6,
      "question": "button.onclick = greet; のgreetは何を表すか。",
      "options": [
        "クリックイベント名",
        "CSSのプロパティ",
        "実行する関数",
        "HTMLの属性名"
      ],
      "correct": 2,
      "explanation": "greetは作成者が付けた関数名。クリックに応じて実行する処理を指定する。"
    },
    {
      "id": "JS-021",
      "page": 3,
      "topic": 6,
      "question": "addEventListenerでクリックを指定するイベント名はどれか。",
      "options": [
        "\"onclick\"",
        "\"oninput\"",
        "\"load\"",
        "\"click\""
      ],
      "correct": 3,
      "explanation": "addEventListenerのイベント名にはonを付けない。onclickはon〜プロパティ側の名前。"
    },
    {
      "id": "JS-022",
      "page": 3,
      "topic": 6,
      "question": "addEventListenerで入力を指定するイベント名はどれか。",
      "options": [
        "\"input\"",
        "\"oninput\"",
        "\"change\"",
        "\"onclick\""
      ],
      "correct": 0,
      "explanation": "入力はinput。oninputはon〜プロパティ側。値の変更はchange。"
    },
    {
      "id": "JS-023",
      "page": 3,
      "topic": 6,
      "question": "addEventListenerで値の変更を指定するイベント名はどれか。",
      "options": [
        "\"onchange\"",
        "\"change\"",
        "\"click\"",
        "\"load\""
      ],
      "correct": 1,
      "explanation": "onを付けないchangeが正解。資料の例題と同じ区別を確認する。"
    },
    {
      "id": "JS-024",
      "page": 3,
      "topic": 6,
      "question": "読み込み完了を表すon〜プロパティはどれか。",
      "options": [
        "onclick",
        "onchange",
        "onload",
        "oninput"
      ],
      "correct": 2,
      "explanation": "読み込み完了はonload。addEventListenerで指定する名前はload。"
    },
    {
      "id": "JS-025",
      "page": 3,
      "topic": 7,
      "question": "要素の内容を文字として変更する記述はどれか。",
      "options": [
        "innerHTML",
        "value",
        "console.log",
        "textContent"
      ],
      "correct": 3,
      "explanation": "文字として扱うならtextContent。HTMLとして内容を変更するならinnerHTML。"
    },
    {
      "id": "JS-026",
      "page": 3,
      "topic": 7,
      "question": "要素の内容をHTMLとして変更する記述はどれか。",
      "options": [
        "innerHTML",
        "textContent",
        "alert",
        "function"
      ],
      "correct": 0,
      "explanation": "HTMLとして内容を変更するのはinnerHTML。文字として扱うtextContentと対比する。"
    },
    {
      "id": "JS-027",
      "page": 3,
      "topic": 7,
      "question": "コンソールに値を出力する記述はどれか。",
      "options": [
        "alert",
        "console.log",
        "function",
        "style"
      ],
      "correct": 1,
      "explanation": "console.logはコンソール出力。ブラウザ上の警告ダイアログはalert。"
    },
    {
      "id": "JS-028",
      "page": 3,
      "topic": 7,
      "question": "警告ダイアログを表示する記述はどれか。",
      "options": [
        "textContent",
        "console.log",
        "alert",
        "value"
      ],
      "correct": 2,
      "explanation": "alert()はブラウザ上にメッセージとOKボタンを表示する。結果やお知らせにも使える。"
    },
    {
      "id": "JS-029",
      "page": 3,
      "topic": 7,
      "question": "関数を定義するときに使うキーワードはどれか。",
      "options": [
        "document",
        "value",
        "style",
        "function"
      ],
      "correct": 3,
      "explanation": "functionは関数を定義する記述。documentは文書、valueは入力値などを扱う。"
    },
    {
      "id": "JS-030",
      "page": 3,
      "topic": 7,
      "question": "input要素を表すfieldから入力された値を取得する記述はどれか。",
      "options": [
        "field.value",
        "field.style",
        "field.alert",
        "field.onclick"
      ],
      "correct": 0,
      "explanation": "フォームの入力欄の値はvalueで取得できる。"
    },
    {
      "id": "JS-031",
      "page": 4,
      "topic": 8,
      "question": "次のコードの出力は？\nvar items = [\"A\", \"B\", \"C\"];\nconsole.log(items[1]);",
      "options": [
        "A",
        "B",
        "C",
        "undefined"
      ],
      "correct": 1,
      "explanation": "配列は0番から数える。0=A、1=B、2=CなのでB。"
    },
    {
      "id": "JS-032",
      "page": 4,
      "topic": 8,
      "question": "次のコードの出力は？\nvar items = [\"A\", \"B\", \"C\"];\nconsole.log(items[3]);",
      "options": [
        "A",
        "B",
        "C",
        "undefined"
      ],
      "correct": 3,
      "explanation": "この配列の有効なインデックスは0〜2。3には値がないためundefined。"
    },
    {
      "id": "JS-033",
      "page": 4,
      "topic": 8,
      "question": "[\"X\", \"Y\", \"Z\"] のインデックス0の値はどれか。",
      "options": [
        "X",
        "Y",
        "Z",
        "undefined"
      ],
      "correct": 0,
      "explanation": "配列の番号は0から始まるため、先頭のXは0番。1番はY、2番はZ。"
    },
    {
      "id": "JS-034",
      "page": 4,
      "topic": 9,
      "question": "代入の=は右側の値を左側に入れる記述である。",
      "options": [
        "○",
        "×"
      ],
      "correct": 0,
      "explanation": "右側を先に評価し、その値を左側の変数に入れる。"
    },
    {
      "id": "JS-035",
      "page": 4,
      "topic": 9,
      "question": "letとconstの説明として適切なのはどれか。",
      "options": [
        "どちらも再代入できない",
        "letは再代入でき、constは再代入できない",
        "constだけ再代入できる",
        "どちらも文字列専用"
      ],
      "correct": 1,
      "explanation": "資料の09の要点。letは値を入れ直せるが、constは再代入できない。"
    },
    {
      "id": "JS-036",
      "page": 4,
      "topic": 9,
      "question": "次のコードの出力は？\nlet word = \"Web\";\nword = word + \"Site\";\nconsole.log(word);",
      "options": [
        "Web",
        "Site",
        "WebSite",
        "Web Site"
      ],
      "correct": 2,
      "explanation": "右側のwordはWeb。文字列WebとSiteを連結し、WebSiteを代入する。空白は追加されない。"
    },
    {
      "id": "JS-037",
      "page": 4,
      "topic": 9,
      "question": "次のコードの出力は？\nconsole.log(10 + 20);",
      "options": [
        "1020",
        "10",
        "20",
        "30"
      ],
      "correct": 3,
      "explanation": "数値同士の+は足し算。10+20=30。"
    },
    {
      "id": "JS-038",
      "page": 4,
      "topic": 9,
      "question": "次のコードの出力は？\nconsole.log(\"10\" + \"20\");",
      "options": [
        "1020",
        "30",
        "10",
        "20"
      ],
      "correct": 0,
      "explanation": "引用符で囲まれた文字列同士の+は連結。10と20をつなげるので1020。"
    },
    {
      "id": "JS-039",
      "page": 4,
      "topic": 10,
      "question": "let x = \"A\"; x = x + \"B\"; の後のxの値は？",
      "options": [
        "A",
        "AB",
        "B",
        "A B"
      ],
      "correct": 1,
      "explanation": "右側のAとBを連結したABをxに代入する。資料の直前チェック⑥と同じ。"
    },
    {
      "id": "JS-040",
      "page": 4,
      "topic": 10,
      "question": "[\"X\", \"Y\", \"Z\"] のインデックス1の値は？",
      "options": [
        "X",
        "Z",
        "Y",
        "undefined"
      ],
      "correct": 2,
      "explanation": "0=X、1=Y、2=Z。資料の直前チェック⑤に対応する。"
    }
  ]
};

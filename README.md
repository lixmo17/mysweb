# mysweb · 百团答题系统

同一个题库、同一套玩法，提供了**两种形态**，按使用场景挑一个即可。

## 目录结构

```
mysweb/
├─ app/ lib/ data/ public/ package.json   # 形态一：服务端版（Next.js）
├─ standalone/                            # 形态二：纯前端版（零依赖单页）
├─ 题库说明.md
└─ README.md
```

## 形态一：服务端版（Next.js）

题目和统计都存在服务器上，所有设备共用一份数据，正确率是全局汇总的。

```bash
npm run dev      # http://localhost:3000
npm run build
npm run start
```

- 题库：`data/questions.json`（73 题：普通 48 题 + gal 25 题；每次抽 10 题平均约 9 道普通题 + 1 道 gal 题）
- 统计数据：`data/records.json`，导出报表在根目录 `正确率统计.txt`
- 局域网内其他设备访问 `http://本机IP:3000` 即可
- 需要有一台机器一直跑着服务

## 形态二：纯前端版（standalone）

没有服务端，没有依赖，一个网页加一个图片文件夹，双击或静态托管都能用。

- 入口：`standalone/index.html`，题库内联在页面里
- 统计存在浏览器本地，每台设备各存一份
- 多设备汇总：在统计页生成「成绩码」发给负责汇总的同学，在汇总机上合并
- 在线地址（GitHub Pages 自动发布）：https://lixmo17.github.io/mysweb/
- 打包好的压缩包：`standalone/题库测试1.zip`，直接发人即可解压使用
- 也可以把 `standalone/` 目录传到任意静态托管（Vercel、Netlify、对象存储等），
  或本地执行 `npx serve standalone`

推送到 `main` 分支后，`.github/workflows/deploy-pages.yml` 会自动把
`standalone/` 目录发布到 GitHub Pages，不需要手动操作。

详见 `standalone/使用说明.md`。

## 两种形态的区别

| | 服务端版 | 纯前端版 |
| --- | --- | --- |
| 是否需要服务器 | 需要 | 不需要 |
| 正确率统计 | 所有设备自动汇总 | 各设备本地，靠成绩码汇总 |
| 答案保密性 | 答案在服务端 | 答案随页面下发（F12 可见） |
| 部署难度 | 中等 | 上传文件夹即可 |
| 适合场景 | 固定场地、要实时全局数据 | 随时随地分享、现场离线可用 |

## 改题目

两个版本共用同一份题库内容，加题时两处都要改：

- 服务端版：`data/questions.json`
- 纯前端版：`standalone/index.html` 里 `<script id="question-bank">` 那段 JSON

字段说明见 `题库说明.md`。

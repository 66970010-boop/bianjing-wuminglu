# 汴京无名录 · 分层网页原型

运行入口：`dist/index.html`。静态页面无构建依赖。

## 图层

- 场景背景：`dist/assets/river-layer.png`、`stall-layer.png`；在 `.scene` 层引用。
- 人物透明层：`baker-layer.png`、`boatman-layer.png`、`merchant-layer.png`、`fortune-layer.png`、`monk-layer.png`、`toy-layer.png`；由 `img()` 放入 `.layer`，位置由页面 CSS 控制。
- 纸纹、赭红圆、关系线、色块：CSS `texture`、`sun`、`relation-line`。
- 标题、导航、对话、提示、按钮、热点：均为 HTML DOM 元素，由 `render()` 按页面构建。
- 剧情状态：`state`，保存在浏览器 `localStorage` 的 `bj-state` 中。可在浏览器开发者工具中清除该键以重玩。

## 页面与玩法

`render()` 包含首页、四段序章、游卷、人物对话、场景小游戏、无名录、史料页、终章。`visit()` 记录遇见人物，`clue()` 确认饼店与船夫关系；所有交互坐标集中在 `hotspot()` 调用处。玩法文案在 `info`、`arr` 和无名录 `detail` 模板中。

当前图片属于生成的概念补绘，不是《清明上河图》原作。需要接入原作时替换场景资源并重新核对热点位置；史料引文仍需校对。开场与六人物关系网络为原型，职业互动深度尚未达到完整版。

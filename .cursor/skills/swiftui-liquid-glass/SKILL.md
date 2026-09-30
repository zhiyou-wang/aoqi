---
name: swiftui-liquid-glass
description: Reference for Apple Liquid Glass on iOS 26 and macOS. Use when the user asks for liquid glass, Apple glass, or native glass materials, including when translating those rules to the web.
license: dimillian/skills, see https://github.com/dimillian/skills/blob/main/swiftui-liquid-glass/SKILL.md
---

# SwiftUI Liquid Glass

来源：<https://github.com/dimillian/skills/blob/main/swiftui-liquid-glass/SKILL.md>

苹果液态玻璃是透镜，不是一块发灰的模糊层。多个玻璃件要放在同一个容器里，形状、染色和间距保持一致。只有能点的东西才做交互玻璃。文字始终清楚。

原生接口优先：

- 成组玻璃包在 `GlassEffectContainer` 里。
- `.glassEffect(...)` 放在布局修饰之后。
- 次按钮用 `.buttonStyle(.glass)`，主按钮用 `.buttonStyle(.glassProminent)`。
- 形状用连续圆角，不要和旁边的控件各用一种半径。
- iOS 26 以下退回 `.ultraThinMaterial`。

在网页上没有这些 API 时，用同一条规则实现：背景采样、模糊、边缘高光、来自场景的染色，玻璃叠在有透视的场景上，按钮比玻璃再厚一层。

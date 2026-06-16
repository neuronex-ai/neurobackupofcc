## Apple HIG Refactor Mode

When asked to refactor UI, layout, components, interactions, or animations, use Apple's Human Interface Guidelines as the primary design source.

Only use these HIG areas:
- Foundations: layout, color, typography, motion, materials, accessibility, SF Symbols, writing.
- Behaviors: motion, gestures, feedback, navigation behavior, presentation behavior, input behavior.
- Components: system-defined controls, navigation, search, presentation, selection/input, status, lists, menus, toolbars, sheets, text fields.

Workflow:
1. Inspect the current screen/component implementation.
2. Identify custom UI that should become native platform components.
3. Map each screen element to the closest Apple HIG component or foundation rule.
4. Refactor using native platform primitives first.
5. Avoid decorative custom animations unless they clarify state, direction, cause, or feedback.
6. Use motion only when it reinforces spatial continuity, gesture response, task feedback, or state change.
7. Preserve accessibility: Dynamic Type, semantic colors, sufficient contrast, VoiceOver labels, reduced motion support, safe areas, and touch targets.
8. In the final summary, include:
   - changed components
   - HIG sections consulted
   - custom UI replaced with native UI
   - animation/behavior changes
   - remaining HIG risks

Links for Search:
- https://developer.apple.com/design/human-interface-guidelines/
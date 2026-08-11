# Implement Android Predictive Back Transitions in My Expo React Native Application

I want to add a polished **Android predictive back gesture system** to my existing Expo React Native application.

The goal is to make the back gesture feel physically interactive: while the user swipes from the edge, the currently active UI should respond **continuously to the gesture progress**, rather than waiting until the gesture is completed.

Do not redesign my existing UI or navigation architecture unnecessarily. First inspect the existing project structure, navigation setup, modal/sheet implementations, animation libraries, and Expo configuration. Then integrate predictive back into the existing architecture.

## Core Requirement

Implement a reusable predictive-back system where the application can determine which UI layer is currently handling the back gesture and apply an appropriate transition to that layer.

The system should conceptually expose:

```ts
backProgress: number // 0 → 1
```

where:

* `0` = back gesture has just started
* `0.5` = gesture is approximately halfway
* `1` = back action is committed

The active UI should respond continuously to this progress.

The implementation must also support cancellation:

```text
Gesture starts
    ↓
UI responds interactively
    ↓
User releases
    ├── Commit → complete the back action
    └── Cancel → smoothly restore the original state
```

---

# Transition Types

Create the system so different UI surfaces can select from different transition behaviours.

## 1. Horizontal Slide Transition

Use for UI surfaces that should physically slide away with the back gesture.

Conceptually:

```ts
translateX = -distance * backProgress
```

Requirements:

* Movement must directly follow the finger.
* No delayed animation while the gesture is active.
* On commit, finish the dismissal naturally.
* On cancellation, spring smoothly back to the original position.
* Support velocity when deciding whether the gesture should commit.

The transition should feel like the user is physically pulling the current layer away.

---

## 2. Fade Transition

Use for surfaces that should disappear gradually rather than slide.

Conceptually:

```ts
opacity = 1 - backProgress
```

Requirements:

* Opacity must track gesture progress continuously.
* The underlying UI should become visible progressively.
* On cancellation, restore opacity smoothly.
* On commit, complete the dismissal.

Avoid making this a simple fixed-duration animation. The user's finger should control the progress.

---

## 3. Scale + Fade Transition

Create a transition combining a small scale reduction with fading.

Conceptually:

```ts
opacity = 1 - backProgress

scale = 1 - (backProgress * SCALE_AMOUNT)
```

Use a subtle scale amount.

The effect should remain restrained and native-looking rather than becoming a dramatic zoom animation.

Both scale and opacity must be driven by the same back-progress value.

---

## 4. Vertical Dismissal Transition

Support UI surfaces that should move vertically during back navigation.

Conceptually:

```ts
translateY = distance * backProgress
```

Requirements:

* Follow the gesture continuously.
* Restore naturally when cancelled.
* Complete the dismissal when committed.
* Allow the direction and distance to be configurable.

---

## 5. Custom/Composable Transition

Do not hard-code the system so that only the above transitions are possible.

Create an architecture where a UI surface can define its own mapping from:

```ts
backProgress
```

to animated properties.

For example:

```ts
{
  translateX,
  translateY,
  opacity,
  scale
}
```

The transition mechanism should therefore be extensible.

---

# Architecture

Create a reusable abstraction around predictive back.

Prefer an architecture similar to:

```text
Android Back Gesture
        │
        ▼
Back Progress Controller
        │
        ▼
Currently Active Back Handler
        │
        ├── Horizontal Slide
        ├── Fade
        ├── Scale + Fade
        ├── Vertical Dismiss
        └── Custom Transition
```

The system should not require every component to implement Android-specific logic.

Instead, UI surfaces should be able to register themselves as the current back handler and specify their desired transition.

For example, conceptually:

```ts
registerBackHandler({
  priority: ...,
  transition: ...,
  onCommit: ...,
  onCancel: ...,
});
```

Use an appropriate API/design based on the existing application architecture rather than blindly copying this interface.

---

# Priority / Active Layer Handling

Back handling should respect UI hierarchy.

If multiple UI layers are present, the visually/top-most dismissible layer should receive the back gesture first.

Conceptually:

```text
Highest priority
    ↓
Active modal / overlay
    ↓
Temporary UI layer
    ↓
Navigation screen
    ↓
Application root
```

Do not allow multiple layers to respond to the same back gesture simultaneously.

There should be exactly one active back interaction at a time.

---

# Gesture Behaviour

The predictive back gesture should be interactive.

Do not implement:

```ts
onBackPress → startAnimation()
```

as the primary mechanism.

Instead:

```text
gesture begins
      ↓
progress updates continuously
      ↓
animated values update continuously
      ↓
gesture ends
      ↓
commit OR cancel
```

The animation should feel attached to the user's finger.

---

# Commit / Cancel Behaviour

Implement a sensible threshold and velocity-based decision.

For example:

```ts
shouldCommit =
  progress > threshold ||
  velocity > velocityThreshold
```

Do not blindly use these exact values. Tune them based on the existing application and Android interaction conventions.

### On commit

1. Finish the transition.
2. Perform the actual dismissal/navigation action.
3. Clean up the registered back handler.
4. Leave the UI in its final state.

### On cancellation

1. Do not perform navigation/dismissal.
2. Animate the UI back to its original position/state.
3. Restore opacity/scale/etc.
4. Keep the UI mounted and interactive.

---

# Animation Requirements

Use the application's existing animation solution if one already exists.

If Reanimated is already installed, prefer it for gesture-driven animations.

The gesture progress and animated values should remain off the React render cycle whenever possible.

Do not repeatedly call:

```ts
setState(...)
```

for every gesture frame.

Prefer shared/animated values.

The main principle is:

> React manages application state. The animation system manages frame-by-frame motion.

---

# Performance Requirements

The implementation should feel smooth on real Android devices.

Avoid:

* React state updates during every gesture frame.
* Layout-based animations where transforms are sufficient.
* Re-rendering the entire application during the gesture.
* Expensive calculations inside gesture callbacks.
* Unnecessary component remounting.
* Multiple competing gesture handlers.

Prefer:

* Transform-based animation.
* Opacity animation.
* UI-thread animation where supported.
* Shared animated values.
* Lightweight gesture callbacks.
* Stable component references.

Target a native-feeling 60 FPS experience, while allowing higher-refresh-rate devices to animate naturally.

---

# Navigation Integration

Inspect the application's existing navigation implementation before making changes.

If React Navigation or another navigation library is already being used:

* Preserve the existing navigation architecture.
* Do not replace navigation unnecessarily.
* Integrate predictive back with the existing navigation stack.
* Ensure navigation history remains correct.
* Ensure custom UI layers can consume back before navigation does.
* Ensure a cancelled gesture does not accidentally navigate.

The system should distinguish between:

```text
Custom UI dismissal
```

and:

```text
Navigation back
```

while allowing both to participate in the same predictive-back architecture.

---

# Expo / Android Requirements

This application uses Expo.

Implement the feature in a way that is compatible with an Expo development build / native Android build.

Do not assume that Expo Go provides every native Android predictive-back API required for this functionality.

If native Android configuration or a config plugin is required:

1. Explain why it is necessary.
2. Make the smallest appropriate native/configuration changes.
3. Keep the implementation compatible with the Expo workflow.
4. Do not eject unnecessarily.

If the currently installed Expo/React Native version imposes limitations, identify them clearly and implement the closest robust architecture supported by the project.

---

# Styling Constraints

Do not change the existing application's visual design.

The predictive-back system should operate on existing UI surfaces.

Do not introduce:

* Unnecessary shadows.
* New gradients.
* Arbitrary blur effects.
* Large scale transformations.
* Excessive bounce.
* Unrelated visual effects.

The animation should be subtle and responsive.

The user should feel that the interface is following their gesture rather than watching a predefined animation.

---

# Safe Areas

Do not interfere with the application's existing safe-area handling.

Predictive-back animation should transform the UI layer without breaking:

* Status bar spacing.
* Navigation bar spacing.
* Display cutouts.
* Notches.
* Bottom home indicators.

Reuse the application's existing safe-area solution.

---

# Android Back Semantics

The implementation must preserve normal Android back behaviour.

The system should support:

```text
Back gesture
Back button
Programmatic back action
```

where appropriate.

A normal back action should still work even if predictive-back animation is unavailable.

Predictive animation should enhance back navigation rather than become a single point of failure.

---

# Accessibility

Do not make the application dependent on gesture interaction alone.

Back navigation must remain possible through standard Android mechanisms.

Avoid animation choices that make the interface difficult to understand when animations are reduced or disabled.

If the application already has reduced-motion/accessibility preferences, respect them.

---

# Code Quality

Before implementing:

1. Inspect the repository.
2. Identify the existing navigation architecture.
3. Identify the existing animation/gesture libraries.
4. Identify existing modal/sheet/overlay patterns.
5. Identify where global providers or root-level components are defined.
6. Determine the least invasive integration point.

Then implement the predictive-back system.

Keep the implementation modular.

Prefer:

```text
back interaction controller
        +
transition definitions
        +
UI registration
```

rather than scattering Android back logic throughout unrelated components.

---

# Deliverables

After implementation, provide:

1. A summary of the architecture.
2. A list of files changed.
3. An explanation of how Android back progress reaches the animation layer.
4. An explanation of how different transition types are selected.
5. An explanation of commit vs cancellation behaviour.
6. Any Expo/native configuration changes required.
7. Instructions for testing it on an Android development build.
8. Any limitations caused by the current Expo/React Native version.

Do not rewrite unrelated parts of the application.

Do not introduce a new navigation library.

Do not replace existing child components.

The final implementation should be production-oriented, modular, and easy to extend with additional transition types later.
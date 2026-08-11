# React Native Sidebar — Parent Component Only

## Scope

This document defines **only the parent/sidebar container component**.

The sidebar's internal UI is intentionally excluded. Child components are assumed to already exist and can be rendered through `children`.

The component is responsible for:

- Opening and closing the sidebar.
- Horizontal swipe interaction.
- Smooth UI-thread animation.
- Backdrop/overlay animation.
- Dismissing when the backdrop is pressed.
- Snapping open/closed based on drag distance and velocity.
- Respecting safe-area/layout constraints.
- Providing a lightweight, reusable container API.

---

## Recommended Stack

Use:

- **React Native**
- **React Native Reanimated**
- **React Native Gesture Handler**
- `react-native-safe-area-context` when the sidebar needs to account for system insets.

The important architectural rule is:

> React owns the sidebar's logical state; Reanimated owns the sidebar's frame-by-frame motion.

---

## Parent Component

```tsx
import React, { ReactNode } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SIDEBAR_WIDTH = Math.min(SCREEN_WIDTH * 0.82, 360);

type SidebarProps = {
  children: ReactNode;
  open: boolean;
  onClose: () => void;
};

export default function Sidebar({
  children,
  open,
  onClose,
}: SidebarProps) {
  const translateX = useSharedValue(
    open ? 0 : -SIDEBAR_WIDTH,
  );

  const backdropOpacity = useSharedValue(open ? 1 : 0);

  const openSidebar = () => {
    translateX.value = withSpring(0, {
      damping: 22,
      stiffness: 220,
      mass: 0.7,
    });

    backdropOpacity.value = withTiming(1, {
      duration: 180,
    });
  };

  const closeSidebar = () => {
    translateX.value = withSpring(-SIDEBAR_WIDTH, {
      damping: 22,
      stiffness: 220,
      mass: 0.7,
    });

    backdropOpacity.value = withTiming(0, {
      duration: 150,
    });
  };

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      const nextX = Math.max(
        -SIDEBAR_WIDTH,
        Math.min(0, event.translationX),
      );

      translateX.value = nextX;

      backdropOpacity.value =
        1 + nextX / SIDEBAR_WIDTH;
    })
    .onEnd((event) => {
      const shouldOpen =
        translateX.value > -SIDEBAR_WIDTH * 0.5 ||
        event.velocityX > 800;

      if (shouldOpen) {
        openSidebar();
      } else {
        closeSidebar();
        runOnJS(onClose)();
      }
    });

  const sidebarStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: translateX.value,
      },
    ],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  return (
    <View
      pointerEvents={open ? 'auto' : 'none'}
      style={StyleSheet.absoluteFill}
    >
      <Animated.Pressable
        onPress={() => {
          closeSidebar();
          onClose();
        }}
        style={[
          styles.backdrop,
          backdropStyle,
        ]}
      />

      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            styles.sidebar,
            {
              width: SIDEBAR_WIDTH,
            },
            sidebarStyle,
          ]}
        >
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },

  sidebar: {
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,

    backgroundColor: '#FFFFFF',

    elevation: 8,

    shadowOffset: {
      width: 2,
      height: 0,
    },

    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
});
```

---

# Important Implementation Constraint

The example above assumes the parent receives:

```tsx
open
onClose
```

from its parent.

For example:

```tsx
<Sidebar
  open={sidebarOpen}
  onClose={() => setSidebarOpen(false)}
>
  <YourSidebarContent />
</Sidebar>
```

The actual sidebar content is deliberately not part of this component.

---

# Animation Constraints

## 1. Animate `transform`

Use:

```tsx
transform: [
  {
    translateX,
  },
]
```

Do **not** continuously animate:

```tsx
left
width
marginLeft
paddingLeft
```

during a gesture.

`translateX` allows the visual movement to remain inexpensive and avoids repeatedly triggering layout work.

---

## 2. Keep gesture values on the UI thread

During the gesture, prefer:

```tsx
translateX.value = ...
```

instead of:

```tsx
setPosition(...)
```

Do not update React state on every gesture frame.

React state should represent application state such as:

```text
open
closed
```

while Reanimated shared values represent:

```text
current pixel position
current opacity
current animation progress
```

---

# Gesture Constraints

The drawer should behave like a physical surface.

During dragging:

```text
closed
  ↓
finger moves right
  ↓
sidebar follows finger
  ↓
finger released
  ↓
snap open OR snap closed
```

A useful default is:

```tsx
const shouldOpen =
  translateX.value > -SIDEBAR_WIDTH * 0.5 ||
  event.velocityX > 800;
```

This means:

- Drag past roughly 50% → open.
- Release with sufficiently strong rightward velocity → open.
- Otherwise → close.

Tune these values based on the desired feel.

---

# Spring Configuration

A good starting point:

```tsx
withSpring(0, {
  damping: 22,
  stiffness: 220,
  mass: 0.7,
});
```

For the closed position:

```tsx
withSpring(-SIDEBAR_WIDTH, {
  damping: 22,
  stiffness: 220,
  mass: 0.7,
});
```

### Tuning

More responsive:

```tsx
stiffness: 260
```

More relaxed:

```tsx
stiffness: 180
```

Less bounce:

```tsx
damping: 26
```

More bounce:

```tsx
damping: 16
```

Avoid excessive bounce for a utility/navigation sidebar. The target feeling should be **quick, controlled, and lightweight**.

---

# Backdrop Styling

The backdrop should normally animate independently:

```tsx
const backdropStyle = useAnimatedStyle(() => ({
  opacity: backdropOpacity.value,
}));
```

A simple backdrop is preferable:

```tsx
backgroundColor: 'rgba(0, 0, 0, 0.35)'
```

Avoid adding expensive blur effects unless the application's design actually requires them.

The sidebar should remain visually dominant while the rest of the application becomes slightly subdued.

---

# Sidebar Styling

The parent should control only container-level styling.

Recommended:

```tsx
{
  position: 'absolute',
  left: 0,
  top: 0,
  bottom: 0,
  height: '100%',
  backgroundColor: '#FFFFFF',
}
```

The parent should **not** know about:

- Header layout.
- Navigation item layout.
- Conversation rows.
- Icons.
- Buttons.
- Search UI.
- Footer UI.
- User profile UI.

Those belong to child components.

---

# Width Constraint

Avoid making the sidebar equal to the full screen width unless that is specifically required.

A good starting point is:

```tsx
const SIDEBAR_WIDTH = Math.min(
  SCREEN_WIDTH * 0.82,
  360,
);
```

This gives approximately:

```text
Small phone  → ~80% of screen
Large phone  → capped at 360px
Tablet       → should generally use a separate layout strategy
```

The exact width should be a design decision rather than something dictated by the animation.

---

# Layering

The sidebar should be rendered above the main application.

Conceptually:

```text
Root
│
├── Main Application
│
└── Sidebar Layer
    │
    ├── Backdrop
    │
    └── Sidebar
        └── children
```

Use:

```tsx
position: 'absolute'
```

for the sidebar layer.

This prevents opening the drawer from causing the main application's layout to reflow.

---

# Pointer Events

When closed, the sidebar layer should not block the application underneath.

Use:

```tsx
pointerEvents={open ? 'auto' : 'none'}
```

This is important.

Otherwise, an invisible/translated sidebar can accidentally intercept touches intended for the main screen.

---

# Safe Areas

If the child content needs to respect:

- Status bar.
- Notches.
- Display cutouts.
- Home indicators.

handle those concerns in the sidebar content or through a safe-area wrapper.

Do not unnecessarily mix safe-area calculations into the animation logic.

For example:

```tsx
<SafeAreaView>
  {children}
</SafeAreaView>
```

The animation should continue to operate on the outer sidebar container.

---

# Performance Rules

### Do

- Use Reanimated shared values.
- Animate `transform`.
- Animate opacity separately.
- Use Gesture Handler for dragging.
- Keep React state out of the frame-by-frame gesture.
- Keep the animated component hierarchy shallow.
- Virtualize large child lists.
- Keep expensive rendering outside the animated container where possible.

### Avoid

```tsx
setState(...)
```

inside every gesture update.

Avoid:

```tsx
width: animatedWidth
```

for the drawer's movement.

Avoid rebuilding the entire sidebar tree on every drag frame.

Avoid unnecessary:

```tsx
useEffect(...)
```

or expensive calculations tied to the animation.

---

# State Model

Keep the logical state extremely simple.

```tsx
const [sidebarOpen, setSidebarOpen] = useState(false);
```

Then:

```tsx
<Sidebar
  open={sidebarOpen}
  onClose={() => setSidebarOpen(false)}
>
  <SidebarContent />
</Sidebar>
```

The parent application owns:

```text
Is sidebar open?
```

The Sidebar component owns:

```text
Where is the sidebar visually?
How fast is it moving?
How far has it been dragged?
What is the backdrop opacity?
```

This separation is intentional.

---

# Optional Improvements

For a more polished production implementation, the parent component can later add:

- Edge-only swipe-to-open.
- Swipe-to-close from anywhere on the sidebar.
- Android back-button handling.
- Accessibility announcements.
- Reduced-motion support.
- Dynamic screen/orientation dimensions.
- Tablet-specific widths.
- RTL support.
- Velocity-aware backdrop opacity.
- Slight parallax on the underlying screen.

These should be added independently rather than making the base sidebar parent unnecessarily complex.

---

# Design Goal

The intended interaction should feel like:

```text
Instant response
       ↓
Finger directly controls drawer
       ↓
No visible lag
       ↓
Release
       ↓
Short, controlled spring
       ↓
Stable resting position
```

The most important principle is:

> **Do not animate the layout. Animate the surface.**

The sidebar should behave like a layer sitting above the application, moving with `translateX`, while the underlying application remains structurally unchanged.

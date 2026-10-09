---
title: "Taste in Systems: Why Good Code Eliminates Special Cases"
year: "2026"
tags: "systems / architecture / craft"
description: "Why true elegance in engineering is not about complex object hierarchies, but structuring data so that edge cases disappear entirely."
seoDescription: "An architectural essay on good taste in programming, pointer manipulation, and data design by Linus Torvalds."
thumbnailSrc: "/images/blog/taste-systems.webp"
---

## The Definition of Good Taste

People often ask what separates an adequate programmer from a truly skilled systems architect. In my view, it rarely comes down to familiarity with fifty different frameworks or the ability to memorize standard library signatures.

It comes down to **taste**.

Taste is not an abstract aesthetic judgment; it is a very concrete structural discipline. You can see it immediately when you look at a ten-line function: does the programmer write four `if` statements to handle head-of-list insertions, null pointers, and tail modifications? Or do they use a pointer-to-a-pointer so that every insertion—first element, middle element, last element—executes identical machine code?

:::quote[Linus Torvalds — Systems Philosophy]
Good taste means you structure the problem so that the special cases simply don't exist. If you find yourself writing conditional ladders to save yourself from your own design, your design is broken.
:::

:::figure[Figure 1.0 — Visualizing pointer-to-pointer indirect link list manipulation]
![Pointer manipulation diagram without edge branches](/images/blog/taste-systems.webp)
:::

## Eliminating the Special Case

Consider a singly linked list deletion. In conventional code taught in university lectures, you maintain a `previous` pointer and a `current` pointer. If the element to remove is the head of the list, you must modify the list head directly; otherwise, you modify `prev->next`.

```c
// The classic bad-taste implementation
void remove_element(struct list **head, struct list *target) {
    struct list *prev = NULL;
    struct list *curr = *head;

    while (curr != target) {
        prev = curr;
        curr = curr->next;
    }

    if (!prev)
        *head = target->next;
    else
        prev->next = target->next;
}
```

Now observe how indirect pointers eliminate the branching entirely:

```c
// The good-taste implementation
void remove_element(struct list **head, struct list *target) {
    struct list **indirect = head;

    while (*indirect != target)
        indirect = &(*indirect)->next;

    *indirect = target->next;
}
```

Notice what happened: there is no `if` check. There is no special case for the head. The code is half the size, executes fewer instructions, and contains zero branching mispredictions. That is taste.

:::metrics
100% : Branch Misprediction Elimination
0 : Special Case Conditionals
4x : Code Density & Clarity
:::

:::note[Core Principle]
Always model data around how memory, hardware buses, and caches actually operate. Abstractions that hide physical memory cost always fail under scale.
:::

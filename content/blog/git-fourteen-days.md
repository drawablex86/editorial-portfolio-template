---
title: "The Accidental Content Tracker: Designing Git in Fourteen Days"
year: "2025"
tags: "git / version-control / unix"
description: "How a complete breakdown in kernel source control tooling led to an entirely new model of content-addressable storage and distributed graph history."
seoDescription: "The engineering retrospectives and cryptographic file storage architecture behind Git by Linus Torvalds."
thumbnailSrc: "/images/blog/git-two-weeks.webp"
---

## Designing from Outrage

When BitKeeper access was revoked in the spring of 2005, the kernel development community faced a catastrophic bottleneck. Existing open-source version control systems—CVS, Subversion, Monotone—were fundamentally unusable for the scale, velocity, and distributed branching of the Linux kernel.

They were slow, obsessed with centralized servers, and modeled history as file-by-file delta diffs rather than whole-tree snapshots.

I took a two-week window, disappeared into my office, and began writing what was originally intended to be a simple, stupid content tracker.

:::quote[Linus Torvalds — Git Design Goal]
In many ways, Git is just a filesystem with a tiny set of cryptographic primitives on top. It does not track files; it tracks content.
:::

:::figure[Figure 2.0 — Object Graph representation in Git: Blobs, Trees, and Commits]
![Git Directed Acyclic Graph commit tree](/images/blog/git-two-weeks.webp)
:::

## The Three Core Primitives

The entire architecture of Git boils down to three immutable object types stored inside a hash-indexed directory (`.git/objects`):

1. **Blob**: Raw byte streams representing file contents, named strictly by their SHA hash.
2. **Tree**: A directory listing associating mode permissions, filenames, and SHA references to blobs or child trees.
3. **Commit**: A cryptographically signed manifest containing a tree hash, zero or more parent commit hashes, author metadata, and a timestamp.

Because every commit references a root tree hash, branching and merging are not expensive network operations; they are simply updating a 40-byte pointer in `.git/refs/heads/`.

:::metrics
14 : Days from First Commit to Self-Hosting
3 : Core Object Types (Blob, Tree, Commit)
O(1) : Local Branch Creation Complexity
:::

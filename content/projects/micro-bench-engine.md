---
title: "Micro-Bench: Kernel Syscall Latency Profiler"
year: "2024"
tags: "benchmarking / performance / c"
description: "A minimal nanosecond-resolution benchmarking utility measuring context-switch overhead, memory bus contention, and TLB shootdown latency."
seoDescription: "Micro-benchmarking harness for low-level kernel profiling by Linus Torvalds."
thumbnailSrc: "/images/projects/bench-hero.webp"
projectType: "experiment"
archetype: "experiment"
metadata:
  role: "Author"
  techStack: ["C", "Assembly", "rdtsc", "POSIX Timers"]
  deliverables: ["CLI Tool", "Statistical Latency Plotter"]
gallery:
  - "/images/projects/bench-hero.webp"
  - "/images/projects/bench-latency.webp"
---

## Objective

Standard macro-benchmarks frequently mask critical cacheline bouncing and false sharing because they aggregate execution over millions of cycles. `micro-bench` isolates single instruction execution times using hardware timestamp counters (`rdtsc`/`rdtscp`).

:::figure[Figure 1.0 — Latency distribution under high multi-core thread contention]
![Latency distribution curve graph](/images/projects/bench-latency.webp)
:::

## Key Findings

- **Context Switch Penalty**: On modern out-of-order CPUs, the true cost of a context switch is rarely the register save/restore (~50ns); it is the subsequent L1/L2 cache cold misses over the following 10 microseconds.
- **Lockless Read Advantage**: Read operations utilizing memory order acquire semantics execute 28x faster than traditional mutual exclusion primitives.

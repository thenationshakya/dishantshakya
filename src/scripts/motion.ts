// Site-wide motion: reveal-once entrances, line-split headings, and the header
// that steps aside while reading down and returns on the way up.

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

function reveals() {
  const els = document.querySelectorAll<HTMLElement>("[data-reveal], [data-shutter]");
  if (!("IntersectionObserver" in window) || reduce) {
    els.forEach((el) => el.classList.add("is-in"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add("is-in");
        io.unobserve(e.target);
      }
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.08 }
  );
  els.forEach((el) => io.observe(el));
}

function lines() {
  const els = [...document.querySelectorAll<HTMLElement>("[data-lines]")];
  if (!els.length || !("IntersectionObserver" in window) || reduce) return;

  const restore = (el: HTMLElement) => {
    el.textContent = el.dataset.text ?? el.textContent;
    el.classList.remove("is-split", "is-in");
  };
  const split = (el: HTMLElement) => {
    const text = (el.textContent ?? "").trim().replace(/\s+/g, " ");
    el.dataset.text = text;
    el.textContent = "";
    const words = text.split(" ").map((word) => {
      const s = document.createElement("span");
      s.style.display = "inline-block";
      s.textContent = word;
      el.append(s, " ");
      return s;
    });
    const rows: { top: number; words: string[] }[] = [];
    for (const w of words) {
      const last = rows.at(-1);
      if (last && Math.abs(last.top - w.offsetTop) < 4) last.words.push(w.textContent ?? "");
      else rows.push({ top: w.offsetTop, words: [w.textContent ?? ""] });
    }
    el.textContent = "";
    rows.forEach((row, i) => {
      const mask = document.createElement("span");
      const inner = document.createElement("span");
      mask.className = "line";
      inner.style.setProperty("--i", String(i));
      inner.textContent = row.words.join(" ");
      mask.append(inner);
      el.append(mask, " ");
    });
    el.classList.add("is-split");
  };

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const el = e.target as HTMLElement;
        io.unobserve(el);
        el.classList.add("is-in");
        el.querySelector(".line:last-of-type > span")?.addEventListener(
          "transitionend",
          () => restore(el),
          { once: true }
        );
      }
    },
    { rootMargin: "0px 0px -10% 0px" }
  );

  document.fonts.ready.then(() =>
    els.forEach((el) => {
      split(el);
      io.observe(el);
    })
  );

  let width = innerWidth;
  addEventListener("resize", () => {
    if (innerWidth === width) return;
    width = innerWidth;
    els
      .filter((el) => el.matches(".is-split:not(.is-in)"))
      .forEach((el) => {
        io.unobserve(el);
        restore(el);
      });
  });
}

function header() {
  const bar = document.querySelector<HTMLElement>("[data-site-header]");
  if (!bar) return;
  let last = scrollY;
  let ticking = false;
  addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = scrollY;
        const open = bar.querySelector("[aria-expanded='true']");
        bar.classList.toggle("is-away", !open && y > 240 && y > last + 4);
        if (y < last - 4 || y < 240) bar.classList.remove("is-away");
        bar.classList.toggle("is-scrolled", y > 8);
        last = y;
        ticking = false;
      });
    },
    { passive: true }
  );
}

reveals();
lines();
header();

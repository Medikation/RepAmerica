"use client";
/* Minimal re-implementation of the header behaviour from assets/global.js (MenuDrawer / HeaderDrawer /
 * DetailsModal / StickyHeader custom elements) + the `.js` html class the theme's CSS keys on.
 * It only toggles the same classes/attributes the Dawn CSS already handles. Renders nothing. */
import { useEffect } from "react";
import { usePathname } from "next/navigation";

const OPEN_DELAY = 0;      // global.js: setTimeout(() => add 'menu-opening')
const CLOSE_ANIMATION = 400; // global.js: closeAnimation waits 400ms before removing [open]

export default function HeaderClient({ stickyType }: { stickyType: string }) {
  const pathname = usePathname();

  /* `<html class="js">` — theme.liquid sets it statically; base.css / component-menu-drawer.css use it. */
  useEffect(() => {
    document.documentElement.classList.add("js");
  }, []);

  /* Mark the current page in the inline menu + drawer (Liquid `link.current`). */
  useEffect(() => {
    const section = document.querySelector<HTMLElement>(".section-header");
    if (!section) return;
    const current = pathname.replace(/\/$/, "") || "/";
    section.querySelectorAll<HTMLAnchorElement>("a.header__menu-item, a.menu-drawer__menu-item").forEach((a) => {
      const href = (a.getAttribute("href") ?? "").replace(/\/$/, "") || "/";
      const isCurrent = href === current;
      const span = a.querySelector("span");
      if (isCurrent) {
        a.setAttribute("aria-current", "page");
        if (a.classList.contains("menu-drawer__menu-item")) a.classList.add("menu-drawer__menu-item--active");
        else span?.classList.add("header__active-menu-item");
      } else {
        a.removeAttribute("aria-current");
        a.classList.remove("menu-drawer__menu-item--active");
        span?.classList.remove("header__active-menu-item");
      }
    });
  }, [pathname]);

  /* Drawer + search modal + dropdown behaviour. */
  useEffect(() => {
    const section = document.querySelector<HTMLElement>(".section-header");
    const headerWrapper = section?.querySelector<HTMLElement>(".header-wrapper");
    const drawer = section?.querySelector<HTMLElement>("header-drawer");
    const mainDetails = drawer?.querySelector<HTMLDetailsElement>("#Details-menu-drawer-container");
    if (!section || !headerWrapper) return;
    const cleanups: (() => void)[] = [];
    const on = <K extends keyof HTMLElementEventMap>(el: EventTarget, type: K | string, fn: (e: Event) => void) => {
      el.addEventListener(type, fn);
      cleanups.push(() => el.removeEventListener(type, fn));
    };

    /* ---- HeaderDrawer ---- */
    if (drawer && mainDetails) {
      const breakpoint = drawer.dataset.breakpoint ?? "tablet";
      const borderOffset = headerWrapper.classList.contains("header-wrapper--border-bottom") ? 1 : 0;
      const setPositions = () => {
        document.documentElement.style.setProperty("--header-bottom-position", `${Math.trunc(section.getBoundingClientRect().bottom - borderOffset)}px`);
        document.documentElement.style.setProperty("--viewport-height", `${window.innerHeight}px`);
      };
      const closeAnimation = (details: HTMLDetailsElement) => {
        window.setTimeout(() => details.removeAttribute("open"), CLOSE_ANIMATION);
      };
      const openDrawer = (summary: HTMLElement) => {
        setPositions();
        section.classList.add("menu-open");
        window.setTimeout(() => mainDetails.classList.add("menu-opening"), OPEN_DELAY);
        summary.setAttribute("aria-expanded", "true");
        window.addEventListener("resize", setPositions);
        document.body.classList.add(`overflow-hidden-${breakpoint}`);
      };
      const closeDrawer = (summary?: HTMLElement | null) => {
        mainDetails.classList.remove("menu-opening");
        mainDetails.querySelectorAll("details").forEach((d) => {
          d.removeAttribute("open");
          d.classList.remove("menu-opening");
        });
        mainDetails.querySelectorAll(".submenu-open").forEach((el) => el.classList.remove("submenu-open"));
        document.body.classList.remove(`overflow-hidden-${breakpoint}`);
        section.classList.remove("menu-open");
        window.removeEventListener("resize", setPositions);
        summary?.setAttribute("aria-expanded", "false");
        closeAnimation(mainDetails);
      };
      const closeSubmenu = (details: HTMLDetailsElement) => {
        details.closest(".submenu-open")?.classList.remove("submenu-open");
        details.classList.remove("menu-opening");
        details.querySelector("summary")?.setAttribute("aria-expanded", "false");
        closeAnimation(details);
      };

      mainDetails.querySelectorAll<HTMLElement>("summary").forEach((summary) => {
        on(summary, "click", (event) => {
          const details = summary.parentElement as HTMLDetailsElement;
          if (details === mainDetails) {
            if (details.hasAttribute("open")) {
              event.preventDefault();
              closeDrawer(summary);
            } else {
              openDrawer(summary);
            }
          } else {
            window.setTimeout(() => {
              details.classList.add("menu-opening");
              summary.setAttribute("aria-expanded", "true");
              details.closest(".has-submenu")?.classList.add("submenu-open");
            }, 100);
          }
        });
      });
      mainDetails.querySelectorAll<HTMLButtonElement>("button.menu-drawer__close-button").forEach((btn) => {
        on(btn, "click", () => {
          const details = btn.closest("details");
          if (details) closeSubmenu(details as HTMLDetailsElement);
        });
      });
      on(drawer, "keyup", (event) => {
        if ((event as KeyboardEvent).code?.toUpperCase() !== "ESCAPE") return;
        const openDetails = (event.target as HTMLElement).closest("details[open]") as HTMLDetailsElement | null;
        if (!openDetails) return;
        openDetails === mainDetails ? closeDrawer(mainDetails.querySelector("summary")) : closeSubmenu(openDetails);
      });
      cleanups.push(() => {
        window.removeEventListener("resize", setPositions);
        document.body.classList.remove(`overflow-hidden-${breakpoint}`);
      });
    }

    /* ---- DetailsModal (search) ---- */
    section.querySelectorAll<HTMLElement>("details-modal").forEach((modal) => {
      const details = modal.querySelector("details");
      const summary = modal.querySelector<HTMLElement>("summary");
      if (!details || !summary) return;
      const close = (focusToggle = true) => {
        details.removeAttribute("open");
        summary.setAttribute("aria-expanded", "false");
        document.body.classList.remove("overflow-hidden");
        if (focusToggle) summary.focus();
      };
      on(summary, "click", (event) => {
        event.preventDefault();
        if (details.hasAttribute("open")) {
          close();
        } else {
          details.setAttribute("open", "");
          summary.setAttribute("aria-expanded", "true");
          document.body.classList.add("overflow-hidden");
          window.setTimeout(() => details.querySelector<HTMLInputElement>('input[type="search"]')?.focus(), 0);
        }
      });
      modal.querySelectorAll<HTMLElement>('button[type="button"].modal__close-button').forEach((btn) => on(btn, "click", () => close()));
      on(modal, "keyup", (event) => {
        if ((event as KeyboardEvent).code?.toUpperCase() === "ESCAPE") close();
      });
      on(modal, "click", (event) => {
        if ((event.target as HTMLElement).closest(".modal-overlay") || (event.target as HTMLElement).closest(".search-modal") === event.target) close();
      });
      /* Show/hide the "clear search term" reset button like search-form.js. */
      const input = modal.querySelector<HTMLInputElement>('input[type="search"]');
      const reset = modal.querySelector<HTMLButtonElement>(".reset__button");
      if (input && reset) {
        const toggleReset = () => reset.classList.toggle("hidden", input.value.length === 0);
        on(input, "input", toggleReset);
        on(reset, "click", () => { input.value = ""; toggleReset(); input.focus(); });
      }
    });

    /* ---- header-menu dropdowns: close on outside click / Escape ---- */
    const menus = Array.from(section.querySelectorAll<HTMLDetailsElement>("header-menu > details"));
    if (menus.length) {
      on(document, "click", (event) => {
        menus.forEach((d) => { if (d.open && !d.contains(event.target as Node)) d.removeAttribute("open"); });
      });
      on(document, "keyup", (event) => {
        if ((event as KeyboardEvent).code?.toUpperCase() === "ESCAPE") menus.forEach((d) => d.removeAttribute("open"));
      });
    }

    return () => cleanups.forEach((fn) => fn());
  }, []);

  /* Close drawer / search / dropdowns after a client-side navigation. */
  useEffect(() => {
    const section = document.querySelector<HTMLElement>(".section-header");
    if (!section) return;
    section.querySelectorAll<HTMLDetailsElement>("details[open]").forEach((d) => {
      d.removeAttribute("open");
      d.classList.remove("menu-opening");
    });
    section.querySelectorAll(".submenu-open").forEach((el) => el.classList.remove("submenu-open"));
    section.classList.remove("menu-open");
    document.body.classList.remove("overflow-hidden", "overflow-hidden-tablet", "overflow-hidden-desktop", "overflow-hidden-mobile");
  }, [pathname]);

  /* ---- StickyHeader (sections/header.liquid {% javascript %}) ---- */
  useEffect(() => {
    if (stickyType === "none") return;
    const header = document.querySelector<HTMLElement>(".section-header");
    if (!header) return;
    const alwaysSticky = stickyType === "always" || stickyType === "reduce-logo-size";
    let headerBounds: { top: number; bottom: number } = { top: 0, bottom: 0 };
    let currentScrollTop = 0;

    const setHeaderHeight = () => document.documentElement.style.setProperty("--header-height", `${header.offsetHeight}px`);
    setHeaderHeight();
    const mql = window.matchMedia("(max-width: 990px)");
    mql.addEventListener("change", setHeaderHeight);

    if (alwaysSticky) header.classList.add("shopify-section-header-sticky");

    const observer = new IntersectionObserver((entries, obs) => {
      const r = entries[0].intersectionRect;
      headerBounds = { top: r.top, bottom: r.bottom };
      obs.disconnect();
    });
    observer.observe(header);

    const hide = () => {
      if (alwaysSticky) return;
      header.classList.add("shopify-section-header-hidden", "shopify-section-header-sticky");
      header.querySelectorAll<HTMLDetailsElement>("header-menu > details[open]").forEach((d) => d.removeAttribute("open"));
      header.querySelectorAll<HTMLDetailsElement>("details-modal > details[open]").forEach((d) => d.removeAttribute("open"));
    };
    const reveal = () => {
      if (alwaysSticky) return;
      header.classList.add("shopify-section-header-sticky", "animate");
      header.classList.remove("shopify-section-header-hidden");
    };
    const reset = () => {
      if (alwaysSticky) return;
      header.classList.remove("shopify-section-header-hidden", "shopify-section-header-sticky", "animate");
    };
    const onScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      if (scrollTop > currentScrollTop && scrollTop > headerBounds.bottom) {
        header.classList.add("scrolled-past-header");
        requestAnimationFrame(hide);
      } else if (scrollTop < currentScrollTop && scrollTop > headerBounds.bottom) {
        header.classList.add("scrolled-past-header");
        requestAnimationFrame(reveal);
      } else if (scrollTop <= headerBounds.top) {
        header.classList.remove("scrolled-past-header");
        requestAnimationFrame(reset);
      }
      currentScrollTop = scrollTop;
    };
    window.addEventListener("scroll", onScroll, false);
    return () => {
      window.removeEventListener("scroll", onScroll);
      mql.removeEventListener("change", setHeaderHeight);
      observer.disconnect();
    };
  }, [stickyType]);

  return null;
}

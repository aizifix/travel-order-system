"use client";

import { useEffect, useRef, type MutableRefObject } from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
  "[contenteditable='true']",
].join(", ");

type UseDrawerFocusManagementOptions<TElement extends HTMLElement> = Readonly<{
  isOpen: boolean;
  drawerRef: MutableRefObject<TElement | null>;
  returnFocusRef: MutableRefObject<HTMLElement | null>;
}>;

export function useDrawerFocusManagement<TElement extends HTMLElement>({
  isOpen,
  drawerRef,
  returnFocusRef,
}: UseDrawerFocusManagementOptions<TElement>) {
  const wasOpenRef = useRef(false);

  useEffect(() => {
    const drawer = drawerRef.current;
    if (!isOpen || !drawer) {
      return;
    }

    if (returnFocusRef.current === null && document.activeElement instanceof HTMLElement) {
      returnFocusRef.current = document.activeElement;
    }

    const focusableElements = getFocusableElements(drawer);
    const initialFocusTarget = focusableElements[0] ?? drawer;
    initialFocusTarget.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") {
        return;
      }

      const focusableNodes = getFocusableElements(drawer);
      if (focusableNodes.length === 0) {
        event.preventDefault();
        drawer.focus();
        return;
      }

      const firstNode = focusableNodes[0];
      const lastNode = focusableNodes[focusableNodes.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey && activeElement === firstNode) {
        event.preventDefault();
        lastNode.focus();
        return;
      }

      if (!event.shiftKey && activeElement === lastNode) {
        event.preventDefault();
        firstNode.focus();
      }
    };

    drawer.addEventListener("keydown", handleKeyDown);
    wasOpenRef.current = true;

    return () => {
      drawer.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, drawerRef, returnFocusRef]);

  useEffect(() => {
    if (isOpen || !wasOpenRef.current) {
      return;
    }

    const returnTarget = returnFocusRef.current;
    if (returnTarget && returnTarget.isConnected) {
      returnTarget.focus();
    }

    returnFocusRef.current = null;
    wasOpenRef.current = false;
  }, [isOpen, returnFocusRef]);
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) => {
      if (element.getAttribute("aria-hidden") === "true") {
        return false;
      }
      if (element.hasAttribute("disabled")) {
        return false;
      }
      return element.offsetParent !== null || element === document.activeElement;
    },
  );
}

import { useRef, useCallback, useEffect } from 'react';

interface FocusManagementOptions {
  returnFocusOnCleanup?: boolean;
  trapFocus?: boolean;
}

export function useFocusManagement(
  isActive: boolean,
  options: FocusManagementOptions = {}
) {
  const { returnFocusOnCleanup = true, trapFocus = false } = options;
  const containerRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // 最初にフォーカス可能な要素を取得
  const getFocusableElements = useCallback((): HTMLElement[] => {
    if (!containerRef.current) return [];

    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"]):not([disabled])',
      '[contenteditable="true"]'
    ].join(',');

    return Array.from(
      containerRef.current.querySelectorAll(focusableSelectors)
    ) as HTMLElement[];
  }, []);

  // 最初の要素にフォーカス
  const focusFirstElement = useCallback(() => {
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  }, [getFocusableElements]);

  // 最後の要素にフォーカス
  const focusLastElement = useCallback(() => {
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[focusableElements.length - 1].focus();
    }
  }, [getFocusableElements]);

  // フォーカストラップのキーハンドラー
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!trapFocus || !isActive) return;

    if (event.key === 'Tab') {
      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement as HTMLElement;

      if (event.shiftKey) {
        // Shift + Tab (backward)
        if (activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab (forward)
        if (activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    }

    // Escapeキーでフォーカスを戻す
    if (event.key === 'Escape' && returnFocusOnCleanup) {
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    }
  }, [trapFocus, isActive, getFocusableElements, returnFocusOnCleanup]);

  // アクティブ状態が変更された時の処理
  useEffect(() => {
    if (isActive) {
      // 現在のフォーカス要素を保存
      previousFocusRef.current = document.activeElement as HTMLElement;

      // 最初の要素にフォーカス
      setTimeout(focusFirstElement, 0);

      // フォーカストラップを有効化
      if (trapFocus) {
        document.addEventListener('keydown', handleKeyDown);
      }
    } else if (returnFocusOnCleanup && previousFocusRef.current) {
      // フォーカスを戻す
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }

    return () => {
      if (trapFocus) {
        document.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [isActive, trapFocus, returnFocusOnCleanup, focusFirstElement, handleKeyDown]);

  return {
    containerRef,
    focusFirstElement,
    focusLastElement,
    getFocusableElements
  };
}
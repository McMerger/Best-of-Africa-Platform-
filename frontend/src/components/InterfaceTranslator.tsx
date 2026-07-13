import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { request } from '../services/api';

type TranslationResponse = { translations: string[] };
const originalText = new WeakMap<Text, string>();
const originalAttributes = new WeakMap<Element, Map<string, string>>();
const cache = new Map<string, string>();
const SKIP = 'script,style,code,pre,textarea,[contenteditable="true"],[data-no-translate]';

export function InterfaceTranslator() {
  const { language } = useLanguage();
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;
    let timer = 0;

    const restore = () => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      while ((node = walker.nextNode())) {
        const text = node as Text;
        const original = originalText.get(text);
        if (original !== undefined) text.data = original;
      }
      document.querySelectorAll('[placeholder],[aria-label],[title]').forEach(element => {
        const originals = originalAttributes.get(element);
        originals?.forEach((value, name) => element.setAttribute(name, value));
      });
    };

    const collect = () => {
      const items: Array<{ value: string; apply: (translated: string) => void }> = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          const parent = node.parentElement;
          const value = node.textContent?.trim() || '';
          if (!parent || parent.closest(SKIP) || !value || !/[A-Za-z]/.test(value)) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        },
      });
      let node: Node | null;
      while ((node = walker.nextNode())) {
        const text = node as Text;
        if (!originalText.has(text)) originalText.set(text, text.data);
        const value = originalText.get(text)!;
        items.push({ value: value.trim(), apply: translated => { text.data = value.replace(value.trim(), translated); } });
      }
      document.querySelectorAll('[placeholder],[aria-label],[title]').forEach(element => {
        if (element.closest(SKIP)) return;
        let originals = originalAttributes.get(element);
        if (!originals) { originals = new Map(); originalAttributes.set(element, originals); }
        for (const name of ['placeholder', 'aria-label', 'title']) {
          const current = element.getAttribute(name);
          if (!current || !/[A-Za-z]/.test(current)) continue;
          if (!originals.has(name)) originals.set(name, current);
          const value = originals.get(name)!;
          items.push({ value, apply: translated => element.setAttribute(name, translated) });
        }
      });
      return items;
    };

    const translate = async () => {
      if (cancelled) return;
      if (language === 'en') { restore(); return; }
      const items = collect();
      const unique = [...new Set(items.map(item => item.value))];
      for (let offset = 0; offset < unique.length && !cancelled; offset += 60) {
        const batch = unique.slice(offset, offset + 60);
        const missing = batch.filter(text => !cache.has(`${language}:${text}`));
        if (missing.length) {
          try {
            const result = await request<TranslationResponse>('/translate/interface', {
              method: 'POST', headers: { 'X-Requested-With': 'XMLHttpRequest' },
              body: JSON.stringify({ language, texts: missing }),
            });
            missing.forEach((text, index) => cache.set(`${language}:${text}`, result.translations[index] || text));
          } catch { /* Keep the original text when translation is temporarily unavailable. */ }
        }
        if (!cancelled) items.filter(item => batch.includes(item.value)).forEach(item => item.apply(cache.get(`${language}:${item.value}`) || item.value));
      }
    };

    const schedule = () => { window.clearTimeout(timer); timer = window.setTimeout(translate, 120); };
    restore();
    schedule();
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => { cancelled = true; window.clearTimeout(timer); observer.disconnect(); restore(); };
  }, [language, location.pathname]);

  return null;
}

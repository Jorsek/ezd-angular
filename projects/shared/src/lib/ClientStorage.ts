import { Injectable } from '@angular/core';

/**
 * A wrapper for client or session storage that provides a namespace for keys
 * As an application grows, keys in storage should be well organized
 *
 * Namespacing avoids key collisions across features/modules
 * Lets you swap localStorage vs sessionStorage cleanly
 * Implements W3 Storage, so it’s easy to mock or replace
 */
@Injectable({ providedIn: 'root' })
export class ClientStorage implements Storage {
  private storage: Storage;
  private readonly namespacePrefix: string;

  // todo: default namespacePrefix is set to localization-insights and this is injectable as a singleton
  // but should be updated later to make this class more useful in different modules
  constructor() {
    this.namespacePrefix = 'localization-insights';
    this.storage = sessionStorage;
  }
  // constructor(namespacePrefix: string, strategy: "local" | "session" = "session") {
  //   this.namespacePrefix = namespacePrefix;
  //   this.storage = strategy === "local" ? localStorage : sessionStorage;
  // }

  /** gets value as parsed JSON **/
  getObj<T>(key: string): T | null {
    const raw = this.getItem(key);
    if (raw === null) {
      return null;
    }

    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  /** sets value, serializing as JSON **/
  setObj(key: string, value: unknown): void {
    this.setItem(key, JSON.stringify(value));
  }

  /**
   * Returns an object exposing get and set and encapsulates the key
   * Useful if you call set and get in the same component so you don't have to repeat the key
   **/
  object<T>(key: string): { get: () => T | null; set: (value: T) => void } {
    return { get: () => this.getObj<T>(key), set: (value) => this.setObj(key, value) };
  }

  /** Number of keys in this namespace */
  get length(): number {
    return this.getNamespacedKeys().length;
  }

  /** Remove all keys in this namespace */
  clear(): void {
    for (const key of this.getNamespacedKeys()) {
      this.storage.removeItem(key);
    }
  }

  getItem(key: string): string | null {
    return this.storage.getItem(this.getKey(key));
  }

  /**
   * Returns the key at the given index *within this namespace*
   * Namespace prefix is stripped to match Storage API expectations
   */
  key(index: number): string | null {
    const keys = this.getNamespacedKeys();
    const fullKey = keys[index] ?? null;

    if (!fullKey) {
      return null;
    }

    return fullKey.slice(this.namespacePrefix.length + 1);
  }

  removeItem(key: string): void {
    this.storage.removeItem(this.getKey(key));
  }

  setItem(key: string, value: string): void {
    this.storage.setItem(this.getKey(key), value);
  }

  /** Convert logical key -> namespaced storage key */
  private getKey(key: string): string {
    return `${this.namespacePrefix}:${key}`;
  }

  /** All raw storage keys belonging to this namespace */
  private getNamespacedKeys(): string[] {
    const prefix = `${this.namespacePrefix}:`;
    const keys: string[] = [];

    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key && key.startsWith(prefix)) {
        keys.push(key);
      }
    }

    return keys;
  }
}

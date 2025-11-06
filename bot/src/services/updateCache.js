/**
 * Cache local + debounce pour éviter les requêtes Discord inutiles
 * Stocke l'état des sorties et n'envoie les updates que s'il y a un changement réel
 */

const DEBOUNCE_MS = 2000; // attendre 2s avant de traiter une update
const CACHE_TTL_MS = 300000; // cache valide 5min

class UpdateCache {
  constructor() {
    this.cache = new Map(); // sortieId -> { participants, timestamp, debounceTimer }
  }

  /**
   * Retourne la clé cache pour une sortie
   */
  getCacheKey(sortieId) {
    return `sortie_${sortieId}`;
  }

  /**
   * Récupère les participants en cache pour une sortie
   */
  getCachedParticipants(sortieId) {
    const key = this.getCacheKey(sortieId);
    const cached = this.cache.get(key);
    if (!cached) return null;

    // Vérifier si le cache est expiré
    if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
      this.cache.delete(key);
      return null;
    }

    return cached.participants;
  }

  /**
   * Met à jour le cache pour une sortie
   * Retourne true si les participants ont changé, false sinon
   */
  updateCache(sortieId, newParticipants) {
    const key = this.getCacheKey(sortieId);
    const cached = this.cache.get(key);

    // Comparer les participants (sortis pour comparaison)
    const oldParticipants = cached?.participants ?? [];
    const oldSorted = [...oldParticipants].sort().join(',');
    const newSorted = [...newParticipants].sort().join(',');

    const hasChanged = oldSorted !== newSorted;

    if (hasChanged) {
      this.cache.set(key, {
        participants: newParticipants,
        timestamp: Date.now(),
        debounceTimer: null
      });
    }

    return hasChanged;
  }

  /**
   * Récupère un debounce timer pour une sortie (annule le précédent)
   * Retourne une Promise qui se résout après DEBOUNCE_MS sans nouvelles modifications
   */
  getDebounceTimer(sortieId) {
    return new Promise((resolve) => {
      const key = this.getCacheKey(sortieId);
      const cached = this.cache.get(key) ?? {};

      // Annuler le timer précédent s'il existe
      if (cached.debounceTimer) {
        clearTimeout(cached.debounceTimer);
      }

      // Créer un nouveau timer
      const newTimer = setTimeout(() => {
        resolve();
      }, DEBOUNCE_MS);

      cached.debounceTimer = newTimer;
      if (!this.cache.has(key)) {
        this.cache.set(key, cached);
      } else {
        const current = this.cache.get(key);
        current.debounceTimer = newTimer;
      }
    });
  }

  /**
   * Réinitialise le cache pour une sortie
   */
  clear(sortieId) {
    const key = this.getCacheKey(sortieId);
    const cached = this.cache.get(key);
    if (cached && cached.debounceTimer) clearTimeout(cached.debounceTimer);
    this.cache.delete(key);
  }

  /**
   * Réinitialise tout le cache
   */
  clearAll() {
    for (const cached of this.cache.values()) {
      if (cached.debounceTimer) clearTimeout(cached.debounceTimer);
    }
    this.cache.clear();
  }
}

module.exports = new UpdateCache();
// lexorank.js - Implémentation de la logique LexoRank

const BASE_CHARS = "0123456789abcdefghijklmnopqrstuvwxyz";
const BASE = BASE_CHARS.length;
const INITIAL_RANK = "n"; // Milieu de l'alphabet

/**
 * Génère un LexoRank entre deux ranks
 * @param {string|null} prev - Rank précédent (null si début)
 * @param {string|null} next - Rank suivant (null si fin)
 * @returns {string} Nouveau rank
 */
export function generateLexoRank(prev, next) {
  // Cas 1: Aucune photo (première photo)
  if (!prev && !next) {
    return INITIAL_RANK;
  }

  // Cas 2: Ajout à la fin
  if (prev && !next) {
    return increment(prev);
  }

  // Cas 3: Ajout au début
  if (!prev && next) {
    // Utilise between avec une valeur virtuelle avant
    return between("", next);
  }

  // Cas 4: Ajout entre deux éléments
  return between(prev, next);
}

/**
 * Génère un rank entre deux ranks existants
 * @param {string} prev - Rank précédent (peut être vide pour début)
 * @param {string} next - Rank suivant
 * @returns {string} Nouveau rank
 */
function between(prev, next) {
  let result = "";
  let i = 0;

  while (true) {
    const prevChar = i < prev.length ? prev[i] : "0";
    const nextChar = i < next.length ? next[i] : "z";

    if (prevChar === nextChar) {
      result += prevChar;
      i++;
      continue;
    }

    const prevIndex = BASE_CHARS.indexOf(prevChar);
    const nextIndex = BASE_CHARS.indexOf(nextChar);

    // S'il y a de la place entre les deux caractères
    if (nextIndex - prevIndex > 1) {
      const midIndex = Math.floor((prevIndex + nextIndex) / 2);
      result += BASE_CHARS[midIndex];
      return result;
    }

    // Pas assez de place, on garde le caractère prev et on continue
    result += prevChar;
    i++;

    // Si on a dépassé prev, on ajoute un caractère médian
    if (i >= prev.length) {
      const nextCharAtI = i < next.length ? next[i] : "z";
      const nextIndexAtI = BASE_CHARS.indexOf(nextCharAtI);

      if (nextIndexAtI > 0) {
        const midIndex = Math.floor(nextIndexAtI / 2);
        result += BASE_CHARS[midIndex];
        return result;
      } else {
        // Si next[i] est '0', on ne peut pas mettre quelque chose au milieu
        // On continue avec '0' et on ajoute après
        result += "0";
        i++;
        continue;
      }
    }
  }
}

/**
 * Incrémente un rank (pour ajout à la fin)
 * @param {string} rank - Rank à incrémenter
 * @returns {string} Nouveau rank
 */
function increment(rank) {
  // Trouve le dernier caractère qui n'est pas 'z'
  let i = rank.length - 1;

  while (i >= 0) {
    const char = rank[i];
    const index = BASE_CHARS.indexOf(char);

    if (index < BASE - 1) {
      // On peut incrémenter ce caractère
      return rank.substring(0, i) + BASE_CHARS[index + 1];
    }

    i--;
  }

  // Tous les caractères sont 'z', on ajoute un caractère
  return rank + BASE_CHARS[1];
}

/**
 * Compare deux LexoRanks
 * @param {string} a - Premier rank
 * @param {string} b - Second rank
 * @returns {number} -1 si a < b, 0 si a === b, 1 si a > b
 */
export function compareLexoRank(a, b) {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

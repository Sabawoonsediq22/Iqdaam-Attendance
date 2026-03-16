/**
 * Predefined class names for the academic progression series.
 * These represent a sequential book series that students progress through.
 * Each class is one month long.
 */

// Academic series classes in sequential order
export const ACADEMIC_CLASS_NAMES = [
  "Step 1",
  "Step 2",
  "Step 3",
  "Step 4",
  "Ladder 1",
  "Ladder 2",
  "Ladder 3",
  "Ladder 4",
  "Focus 1",
  "Focus 2",
  "Focus 3",
  "Focus 4",
  "Top 1",
  "Top 2",
  "Top 3",
  "Master",
] as const;

// Non-academic skill classes
export const SKILL_CLASS_NAMES = ["Computer", "Math", "Dictation"] as const;

// All available class names
export const ALL_CLASS_NAMES = [
  ...ACADEMIC_CLASS_NAMES,
  ...SKILL_CLASS_NAMES,
] as const;

export type ClassName = (typeof ALL_CLASS_NAMES)[number];

// Academic class name type
export type AcademicClassName = (typeof ACADEMIC_CLASS_NAMES)[number];

// Skill class name type
export type SkillClassName = (typeof SKILL_CLASS_NAMES)[number];

/**
 * Get the next class name in the academic progression sequence.
 * Returns null if the class is the final level (Master).
 */
export function getNextAcademicClassName(currentName: string): string | null {
  const currentIndex = ACADEMIC_CLASS_NAMES.indexOf(
    currentName as AcademicClassName,
  );

  // If not in academic series or it's Master (last class)
  if (currentIndex === -1 || currentIndex === ACADEMIC_CLASS_NAMES.length - 1) {
    return null;
  }

  return ACADEMIC_CLASS_NAMES[currentIndex + 1];
}

/**
 * Check if a class name is part of the academic series
 */
export function isAcademicClass(name: string): name is AcademicClassName {
  return ACADEMIC_CLASS_NAMES.includes(name as AcademicClassName);
}

/**
 * Check if a class name is a skill class
 */
export function isSkillClass(name: string): name is SkillClassName {
  return SKILL_CLASS_NAMES.includes(name as SkillClassName);
}

/**
 * Get the index of an academic class in the sequence
 */
export function getAcademicClassIndex(name: string): number {
  return ACADEMIC_CLASS_NAMES.indexOf(name as AcademicClassName);
}

/**
 * Check if this is the last class in the academic series
 */
export function isLastAcademicClass(name: string): boolean {
  return name === "Master";
}

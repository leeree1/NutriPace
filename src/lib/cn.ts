type ClassValue = string | false | null | undefined

/** Łączy klasy CSS, pomijając wartości "puste" (warunkowe klasy Tailwinda). */
export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(' ')
}

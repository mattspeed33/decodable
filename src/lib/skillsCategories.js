export const SKILLS_CATEGORIES = [
  { id: 'phonological-awareness', label: 'Phonological Awareness' },
  { id: 'alphabet-knowledge', label: 'Alphabet Knowledge' },
  { id: 'phonics-decoding', label: 'Phonics & Decoding' },
  { id: 'phonics-automaticity', label: 'Phonics Automaticity' },
  { id: 'sight-word-fluency', label: 'Sight Word Fluency' },
  { id: 'oral-reading-fluency', label: 'Oral Reading Fluency' },
  { id: 'spelling-encoding', label: 'Spelling & Encoding' },
  { id: 'vocabulary', label: 'Vocabulary' },
  { id: 'reading-comprehension', label: 'Reading Comprehension' },
  { id: 'print-concepts', label: 'Print Concepts' },
  { id: 'writing-written-expression', label: 'Writing & Written Expression' },
]

export function getDefaultPdfPath(categoryId) {
  return `/skills-defaults/${categoryId}.pdf`
}

export function getCategoryById(categoryId) {
  return SKILLS_CATEGORIES.find((category) => category.id === categoryId) || null
}

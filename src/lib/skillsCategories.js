export const SKILLS_CATEGORIES = [
  { id: 'intake-snapshot', label: 'Intake Snapshot', pdf: '00_intake_snapshot.pdf', desc: 'First-session baseline across all skill areas' },
  { id: 'phonological-awareness', label: 'Phonological Awareness', pdf: '01_phonological_awareness.pdf', desc: 'Rhyming, blending, segmenting, and sound manipulation' },
  { id: 'alphabet-knowledge', label: 'Alphabet Knowledge', pdf: '02_alphabet_knowledge.pdf', desc: 'Letter names, sounds, and uppercase/lowercase recognition' },
  { id: 'phonics-decoding', label: 'Phonics & Decoding', pdf: '03_phonics_decoding.pdf', desc: 'CVC, blends, digraphs, and vowel pattern decoding' },
  { id: 'phonics-automaticity', label: 'Phonics Automaticity', pdf: '04_phonics_automaticity.pdf', desc: 'Speed and accuracy with real and nonsense words' },
  { id: 'sight-word-fluency', label: 'Sight Word Fluency', pdf: '05_sight_word_fluency.pdf', desc: 'Instant recognition of high-frequency words' },
  { id: 'oral-reading-fluency', label: 'Oral Reading Fluency', pdf: '06_oral_reading_fluency.pdf', desc: 'Words per minute, accuracy, and expression in connected text' },
  { id: 'spelling-encoding', label: 'Spelling & Encoding', pdf: '07_spelling_encoding.pdf', desc: 'Spelling patterns, phonetic accuracy, and dictation' },
  { id: 'vocabulary', label: 'Vocabulary', pdf: '08_vocabulary.pdf', desc: 'Word meaning, context clues, and oral language' },
  { id: 'reading-comprehension', label: 'Reading Comprehension', pdf: '09_reading_comprehension.pdf', desc: 'Retelling, main idea, and understanding what they read' },
  { id: 'print-concepts', label: 'Print Concepts', pdf: '10_print_concepts.pdf', desc: 'Book handling, directionality, and text features' },
  { id: 'writing-written-expression', label: 'Writing & Written Expression', pdf: '11_writing_expression.pdf', desc: 'Sentence formation, idea organization, and handwriting' },
]

export function getDefaultPdfPath(categoryId) {
  const cat = SKILLS_CATEGORIES.find(c => c.id === categoryId)
  return cat ? `/skills-defaults/${cat.pdf}` : null
}

export function getCategoryById(categoryId) {
  return SKILLS_CATEGORIES.find((category) => category.id === categoryId) || null
}

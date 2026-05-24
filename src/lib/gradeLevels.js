// Grade-level scale (index = numeric position for bar rendering)
export const GRADE_LEVELS = [
  { key: 'pre-k', label: 'Pre-K', short: 'PK', index: 0 },
  { key: 'k', label: 'Kindergarten', short: 'K', index: 1 },
  { key: 'early-1st', label: 'Early 1st', short: 'E1', index: 2 },
  { key: 'late-1st', label: 'Late 1st', short: 'L1', index: 3 },
  { key: 'early-2nd', label: 'Early 2nd', short: 'E2', index: 4 },
  { key: 'late-2nd', label: 'Late 2nd', short: 'L2', index: 5 },
  { key: '3rd', label: '3rd Grade', short: '3rd', index: 6 },
  { key: 'above-3rd', label: 'Above 3rd', short: '3rd+', index: 7 },
]

export const GRADE_LEVEL_MAP = Object.fromEntries(GRADE_LEVELS.map(g => [g.key, g]))

// What grade level the student SHOULD be at, based on their enrolled grade
export const EXPECTED_LEVEL = {
  'K': 'k',
  '1st': 'late-1st',
  '2nd': 'late-2nd',
  '3rd': '3rd',
}

// Skill benchmarks — what each grade-level looks like per skill
export const SKILL_BENCHMARKS = {
  'phonological-awareness': {
    'pre-k': 'Rhyme recognition only',
    'k': 'Blending/segmenting 3-sound words',
    'early-1st': 'Phoneme deletion',
    'late-1st': 'Phoneme substitution',
    'early-2nd': 'Full manipulation',
  },
  'alphabet-knowledge': {
    'pre-k': '10+ letters recognized',
    'k': 'All letters + sounds',
    'early-1st': 'Digraphs solid',
  },
  'phonics-decoding': {
    'k': 'CVC words',
    'early-1st': 'Blends + digraphs',
    'late-1st': 'Magic-e / CVCe',
    'early-2nd': 'Vowel teams',
    'late-2nd': 'R-controlled vowels',
    '3rd': 'Multisyllabic words',
  },
  'phonics-automaticity': {
    'early-1st': 'Real words only',
    'late-1st': 'Nonsense words emerging',
    'early-2nd': 'Nonsense words solid',
  },
  'sight-words': {
    'k': 'Pre-Primer words',
    'early-1st': 'Primer words',
    'late-1st': 'Dolch 1st grade',
    'early-2nd': 'Dolch 2nd grade',
    'late-2nd': 'Dolch 3rd grade',
    '3rd': 'Fry 100+',
  },
  'oral-reading-fluency': {
    'k': '15-25 WCPM',
    'early-1st': '40-60 WCPM',
    'late-1st': '60-75 WCPM',
    'early-2nd': '75-90 WCPM',
    'late-2nd': '90-100 WCPM',
    '3rd': '100+ WCPM',
  },
  'spelling-encoding': {
    'k': 'CVC spelling',
    'early-1st': 'Digraphs/blends',
    'late-1st': 'Magic-e patterns',
    'early-2nd': 'Vowel teams',
    'late-2nd': 'R-controlled',
    '3rd': 'Morphology',
  },
  'vocabulary': {
    'k': 'Basic nouns/verbs',
    'early-1st': 'Simple adjectives',
    'late-1st': 'Context clues',
    'early-2nd': 'Multiple meanings',
    'late-2nd': 'Academic vocab',
    '3rd': 'Morphological awareness',
  },
  'reading-comprehension': {
    'k': 'Retell with prompts',
    'early-1st': 'Literal recall',
    'late-1st': 'Inferential',
    'early-2nd': 'Text evidence',
    'late-2nd': 'Main idea',
    '3rd': "Author's purpose",
  },
  'print-concepts': {
    'k': 'Most concepts',
    'early-1st': 'All concepts solid',
    'late-1st': 'Compound sentences',
    'early-2nd': 'Paragraph structure',
  },
  'writing-expression': {
    'k': 'Labels and lists',
    'early-1st': 'Simple sentences',
    'late-1st': 'Compound sentences',
    'early-2nd': 'Short paragraphs',
    'late-2nd': 'Organized writing',
    '3rd': 'Multi-paragraph',
  },
}

// Calculate status: Behind / On Track / Ahead. Colors come from v4 tokens
// so consumers stay inside the design system.
export function getStatus(currentLevel, studentGrade) {
  const expected = EXPECTED_LEVEL[studentGrade]
  if (!expected || !currentLevel) return { status: 'unknown', label: 'Not Assessed', color: 'var(--v4-ink-4)' }

  const currentIdx = GRADE_LEVELS.findIndex(g => g.key === currentLevel)
  const expectedIdx = GRADE_LEVELS.findIndex(g => g.key === expected)

  if (currentIdx < 0 || expectedIdx < 0) return { status: 'unknown', label: 'Not Assessed', color: 'var(--v4-ink-4)' }

  const diff = currentIdx - expectedIdx

  if (diff >= 0) return { status: 'ahead', label: 'Ahead', color: 'var(--v4-green)' }
  if (diff >= -1) return { status: 'on-track', label: 'On Track', color: 'var(--v4-amber)' }
  return { status: 'behind', label: 'Behind', color: 'var(--v4-red)' }
}

// Get bar fill percentage (0–100) for a grade level
export function getLevelPercent(levelKey) {
  const idx = GRADE_LEVELS.findIndex(g => g.key === levelKey)
  if (idx < 0) return 0
  return Math.round(((idx + 1) / GRADE_LEVELS.length) * 100)
}

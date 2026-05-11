// Field types:
// 'check'       — single ✓/✗ toggle
// 'check-grid'  — array of items, each gets ✓/✗ (stored as array of passed keys)
// 'letter-grid' — 26 letter checkboxes (stored as array of known letters)
// 'sight-word-grid' — array of words, each gets A/S/X rating
// 'spelling-row'    — word + student_wrote + C/P/X + error_pattern
// 'number'      — numeric input
// 'text'        — single-line text
// 'textarea'    — multiline text
// 'select'      — dropdown
// 'fluency-select' — Fluent / Labored / Word-by-word
// 'score-3'     — 1/2/3 radio

const LETTER_ORDER = 'SMTAPRFDHCLGBNWJKVYZXQEIOU'.split('')

const FLUENCY_OPTIONS = [
  { value: 'fluent', label: 'Fluent' },
  { value: 'labored', label: 'Labored' },
  { value: 'word-by-word', label: 'Word-by-word' },
]

export const FORM_SCHEMAS = {
  // ─── 00 INTAKE SNAPSHOT ────────────────────────────────
  'intake-snapshot': {
    label: 'Student Intake Snapshot',
    subtitle: 'Teacher Copy · Oral · ~5 min · New Student Triage',
    instruction: 'Triage assessment — not a deep dive. Goal: find which 2-3 skill areas to go deeper on next session.',
    sections: [
      {
        number: 1, title: 'Rhyming',
        prompt: 'Say: "Do cat and hat rhyme? ... Now tell me a word that rhymes with sun."',
        fields: [
          { key: 'rhyme_cat_hat', type: 'check', label: 'cat / hat — rhyme?', expected: 'YES' },
          { key: 'rhyme_sun', type: 'check', label: 'sun — rhymes with?', expected: 'any -un word' },
        ],
        note: 'Misses either -> Phonological Awareness is the starting point. Do not move to phonics yet.',
      },
      {
        number: 2, title: 'Letter Sounds',
        prompt: 'Say: "What sound does this letter make? — the sound, not the name."',
        fields: [
          { key: 'letter_sounds', type: 'check-grid', items: ['s', 'm', 'b', 'f', 'sh', 'ch', 'th'], expected: ['/s/', '/m/', '/b/', '/f/', '/sh/', '/ch/', '/th/'] },
        ],
        note: 'Misses 3+ letters -> start with Alphabet Knowledge. Misses only sh/ch/th -> UFLI Units 5-7 is the target.',
      },
      {
        number: 3, title: 'Decode & Spell',
        prompt: 'Say: "I\'m going to say a word — write it out or say each sound you hear."',
        fields: [
          { key: 'decode_sat', type: 'check', label: 'sat', expected: 'CVC — K level' },
          { key: 'decode_ship', type: 'check', label: 'ship', expected: 'digraph — 1st grade level' },
          { key: 'decode_cake', type: 'check', label: 'cake', expected: 'magic-e — 2nd grade level' },
        ],
        note: "Misses 'sat' -> UFLI Units 1-4. Misses 'ship' -> Units 5-7. Misses 'cake' -> Unit 14 is the target.",
      },
      {
        number: 4, title: 'Nonsense Word Check',
        prompt: 'Say: "Read this real word... now read this silly made-up word with the same sounds."',
        fields: [
          { key: 'nonsense_hop_fop', type: 'check', label: 'hop → fop', expected: 'Match?' },
          { key: 'nonsense_cake_vake', type: 'check', label: 'cake → vake', expected: 'Match?' },
        ],
        note: 'Reads real word but fails nonsense -> memorizing without decoding. Flag Phonics Automaticity — critical to address.',
      },
      {
        number: 5, title: 'Oral Reading — Passage Level',
        prompt: 'Say: "Read this passage out loud. Start at The Ship. Move up or down based on comfort."',
        fields: [
          { key: 'passage_k', type: 'check', label: 'K — The Cat (CVC short vowels)' },
          { key: 'passage_1st', type: 'check', label: '1st — The Ship (blends + digraphs)' },
          { key: 'passage_2nd', type: 'check', label: '2nd — A Day at the Lake (silent e + vowel teams)' },
          { key: 'passage_3rd', type: 'check', label: '3rd — The Picnic Plan (multisyllabic)' },
          { key: 'highest_passage', type: 'text', label: 'Highest passage reached' },
          { key: 'hesitated_on', type: 'text', label: 'Hesitated / struggled on' },
        ],
        note: 'Passage level where fluency breaks down = reading placement. Hesitations point to exact phonics pattern to target.',
      },
      {
        title: 'Notes',
        fields: [
          { key: 'notes', type: 'textarea', label: 'Notes' },
        ],
      },
    ],
  },

  // ─── 01 PHONOLOGICAL AWARENESS ─────────────────────────
  'phonological-awareness': {
    label: 'Phonological Awareness',
    subtitle: 'Teacher Copy · Oral · ~8 min',
    instruction: 'Read each prompt in italics exactly as written. All oral — student never sees this sheet.',
    sections: [
      {
        number: 1, title: 'Rhyme Recognition',
        prompt: 'Say: "I\'m going to say two words. Do they rhyme — yes or no?"',
        fields: [
          { key: 'rhyme_rec_cat_hat', type: 'check', label: 'cat / hat', expected: 'YES' },
          { key: 'rhyme_rec_dog_sun', type: 'check', label: 'dog / sun', expected: 'NO' },
          { key: 'rhyme_rec_pin_win', type: 'check', label: 'pin / win', expected: 'YES' },
        ],
      },
      {
        number: 2, title: 'Rhyme Production',
        prompt: 'Say: "Tell me any word that rhymes with ___. A silly word is fine!"',
        fields: [
          { key: 'rhyme_prod_cat', type: 'check', label: 'cat', expected: 'any -at word' },
          { key: 'rhyme_prod_hop', type: 'check', label: 'hop', expected: 'any -op word' },
          { key: 'rhyme_prod_sun', type: 'check', label: 'sun', expected: 'any -un word' },
        ],
        note: "Can't produce rhymes -> onset-rime awareness needs direct instruction before phonics.",
      },
      {
        number: 3, title: 'Syllable Segmentation',
        prompt: 'Say: "Clap the parts in this word and tell me how many."',
        fields: [
          { key: 'syll_rainbow', type: 'check', label: 'rainbow', expected: '2' },
          { key: 'syll_elephant', type: 'check', label: 'elephant', expected: '3' },
          { key: 'syll_cat', type: 'check', label: 'cat', expected: '1' },
        ],
        note: 'Misses syllables -> syllable awareness needs work. Try compound words first (rain-bow).',
      },
      {
        number: 4, title: 'Onset-Rime Blending',
        prompt: 'Say: "I\'ll say a word in two parts — you put them together. /c/ ... /at/ = ?"',
        fields: [
          { key: 'onset_sun', type: 'check', label: '/s/ + /un/', expected: 'sun' },
          { key: 'onset_moon', type: 'check', label: '/m/ + /oon/', expected: 'moon' },
          { key: 'onset_flag', type: 'check', label: '/fl/ + /ag/', expected: 'flag' },
        ],
        note: "Can't blend onset-rime -> move back to rhyme work before phoneme-level tasks.",
      },
      {
        number: 5, title: 'Phoneme Blending',
        prompt: 'Say: "I\'ll say each sound separately — you blend them into a word."',
        fields: [
          { key: 'blend_sat', type: 'check', label: '/s/ /a/ /t/', expected: 'sat' },
          { key: 'blend_fish', type: 'check', label: '/f/ /i/ /sh/', expected: 'fish' },
          { key: 'blend_stop', type: 'check', label: '/s/ /t/ /o/ /p/', expected: 'stop' },
        ],
        note: "Can't blend phonemes -> Hegarty blending level not yet mastered. Target before segmenting.",
      },
      {
        number: 6, title: 'Phoneme Segmentation',
        prompt: 'Say: "Tap your finger for each sound you hear in this word."',
        fields: [
          { key: 'seg_sun', type: 'check', label: 'sun', expected: '/s/u/n/ — 3' },
          { key: 'seg_ship', type: 'check', label: 'ship', expected: '/sh/i/p/ — 3' },
          { key: 'seg_flag', type: 'check', label: 'flag', expected: '/f/l/a/g/ — 4' },
        ],
        note: "Can't segment -> critical gap. Segmenting is the foundation of spelling. Prioritize this.",
      },
      {
        number: 7, title: 'Phoneme Deletion',
        prompt: 'Say: "Say the word — now say it without that sound. What\'s left?"',
        fields: [
          { key: 'del_smash', type: 'check', label: 'smash (no /s/)', expected: 'mash' },
          { key: 'del_flag', type: 'check', label: 'flag (no /f/)', expected: 'lag' },
          { key: 'del_trip', type: 'check', label: 'trip (no /t/)', expected: 'rip' },
        ],
        note: "Can't delete -> phoneme manipulation not yet developed. Solidify blending and segmenting first.",
      },
      {
        title: 'Notes',
        fields: [{ key: 'notes', type: 'textarea', label: 'Notes' }],
      },
    ],
  },

  // ─── 02 ALPHABET KNOWLEDGE ─────────────────────────────
  'alphabet-knowledge': {
    label: 'Alphabet Knowledge',
    subtitle: 'Teacher Copy · Oral · ~5 min',
    instruction: 'Point to each letter. Ask for the sound, not the name.',
    sections: [
      {
        title: 'Letter Sounds - Uppercase',
        prompt: 'Say: "What sound does this letter make?"',
        fields: [
          { key: 'uppercase_sounds', type: 'letter-grid', letters: LETTER_ORDER, case: 'upper' },
        ],
        note: 'Misses 5+ -> start here before any phonics.',
      },
      {
        title: 'Letter Sounds - Lowercase',
        prompt: 'Say: "What sound does this letter make?"',
        fields: [
          { key: 'lowercase_sounds', type: 'letter-grid', letters: LETTER_ORDER, case: 'lower' },
        ],
        note: 'Knows uppercase but not lowercase -> needs targeted lowercase practice.',
      },
      {
        title: 'Digraph Sounds',
        prompt: 'Say: "What sound do these two letters make together?"',
        fields: [
          { key: 'digraph_sh', type: 'check', label: 'sh', expected: '/sh/' },
          { key: 'digraph_ch', type: 'check', label: 'ch', expected: '/ch/' },
          { key: 'digraph_th', type: 'check', label: 'th', expected: '/th/' },
          { key: 'digraph_wh', type: 'check', label: 'wh', expected: '/wh/' },
          { key: 'digraph_ck', type: 'check', label: 'ck', expected: '/k/' },
        ],
        note: 'Misses digraphs -> UFLI Units 5-7 is the immediate target.',
      },
      {
        title: 'Notes',
        fields: [{ key: 'notes', type: 'textarea', label: 'Notes' }],
      },
    ],
  },

  // ─── 03 PHONICS & DECODING ─────────────────────────────
  'phonics-decoding': {
    label: 'Phonics & Decoding',
    subtitle: 'Teacher Copy · Oral · ~8 min',
    instruction: 'Student reads each word aloud. Mark correct or incorrect. Note the substitution if wrong.',
    sections: [
      {
        number: 1, title: 'CVC Short Vowels - Units 1-4',
        prompt: 'Say: "Read each word aloud."',
        fields: [
          { key: 'cvc_sat', type: 'check', label: 'sat', expected: 'CVC' },
          { key: 'cvc_hop', type: 'check', label: 'hop', expected: 'CVC' },
          { key: 'cvc_bin', type: 'check', label: 'bin', expected: 'CVC' },
        ],
        note: 'First section where student misses 2+ = current UFLI working unit.',
      },
      {
        number: 2, title: 'Digraphs - Units 5-7',
        prompt: 'Say: "Read each word aloud."',
        fields: [
          { key: 'di_ship', type: 'check', label: 'ship', expected: 'sh' },
          { key: 'di_chin', type: 'check', label: 'chin', expected: 'ch' },
          { key: 'di_think', type: 'check', label: 'think', expected: 'th' },
        ],
        note: 'Misses here -> UFLI Units 5-7 digraph instruction is the target.',
      },
      {
        number: 3, title: 'Consonant Blends - Units 8-10',
        prompt: 'Say: "Read each word aloud."',
        fields: [
          { key: 'bl_flag', type: 'check', label: 'flag', expected: 'l-blend' },
          { key: 'bl_trip', type: 'check', label: 'trip', expected: 'r-blend' },
          { key: 'bl_spin', type: 'check', label: 'spin', expected: 's-blend' },
        ],
        note: 'Blend errors -> Units 8-10. Note which blend type is breaking down.',
      },
      {
        number: 4, title: 'Three-Letter Blends - Units 11-13',
        prompt: 'Say: "Read each word aloud."',
        fields: [
          { key: '3bl_strap', type: 'check', label: 'strap', expected: 'str' },
          { key: '3bl_scram', type: 'check', label: 'scram', expected: 'scr' },
          { key: '3bl_split', type: 'check', label: 'split', expected: 'spl' },
        ],
        note: 'Cluster errors -> Units 11-13. Common gap even for confident 1st graders.',
      },
      {
        number: 5, title: 'Magic-E / CVCe - Unit 14',
        prompt: 'Say: "Read each word aloud."',
        fields: [
          { key: 'cvce_cake', type: 'check', label: 'cake', expected: 'CVCe' },
          { key: 'cvce_bike', type: 'check', label: 'bike', expected: 'CVCe' },
          { key: 'cvce_home', type: 'check', label: 'home', expected: 'CVCe' },
        ],
        note: "Magic-e errors -> Unit 14. Check if student reads as CVC (e.g. 'cam' for 'cake').",
      },
      {
        number: 6, title: 'Vowel Teams - Units 15-17',
        prompt: 'Say: "Read each word aloud."',
        fields: [
          { key: 'vt_rain', type: 'check', label: 'rain', expected: 'ai' },
          { key: 'vt_feet', type: 'check', label: 'feet', expected: 'ee' },
          { key: 'vt_boat', type: 'check', label: 'boat', expected: 'oa' },
        ],
        note: 'Vowel team errors -> Units 15-17. Very common gap in 2nd grade students.',
      },
      {
        number: 7, title: 'R-Controlled - Units 18-20',
        prompt: 'Say: "Read each word aloud."',
        fields: [
          { key: 'rc_farm', type: 'check', label: 'farm', expected: 'ar' },
          { key: 'rc_bird', type: 'check', label: 'bird', expected: 'ir' },
          { key: 'rc_corn', type: 'check', label: 'corn', expected: 'or' },
        ],
        note: 'R-controlled errors -> Units 18-20. Often mixed up (er/ir/ur).',
      },
      {
        title: 'Notes',
        fields: [{ key: 'notes', type: 'textarea', label: 'Notes' }],
      },
    ],
  },

  // ─── 04 PHONICS AUTOMATICITY ───────────────────────────
  'phonics-automaticity': {
    label: 'Phonics Automaticity',
    subtitle: 'Teacher Copy · Oral · ~5 min',
    instruction: 'Give real word first — immediately follow with a nonsense word, same pattern. Reveals memorizing vs. true decoding.',
    sections: [
      {
        number: 1, title: 'Real Word vs. Nonsense Word',
        prompt: 'Say: "Read this word... now read this silly made-up word. Just sound it out."',
        fields: [
          { key: 'auto_hop', type: 'check', label: 'hop', expected: 'CVC' },
          { key: 'auto_fop', type: 'check', label: 'fop (nonsense)', expected: 'CVC' },
          { key: 'auto_ship', type: 'check', label: 'ship', expected: 'digraph' },
          { key: 'auto_chib', type: 'check', label: 'chib (nonsense)', expected: 'digraph' },
          { key: 'auto_flag', type: 'check', label: 'flag', expected: 'l-blend' },
          { key: 'auto_plag', type: 'check', label: 'plag (nonsense)', expected: 'l-blend' },
          { key: 'auto_cake', type: 'check', label: 'cake', expected: 'magic-e' },
          { key: 'auto_vake', type: 'check', label: 'vake (nonsense)', expected: 'magic-e' },
          { key: 'auto_rain', type: 'check', label: 'rain', expected: 'vowel team' },
          { key: 'auto_daip', type: 'check', label: 'daip (nonsense)', expected: 'vowel team' },
          { key: 'auto_bird', type: 'check', label: 'bird', expected: 'r-controlled' },
          { key: 'auto_sird', type: 'check', label: 'sird (nonsense)', expected: 'r-controlled' },
        ],
        note: 'Real word correct + nonsense word wrong = memorizing without decoding. Must address before advancing.',
      },
      {
        number: 2, title: 'Timed Word Reading - 30 Seconds',
        prompt: 'Say: "Read as many words as you can. Go as fast as you can. Ready? Go."',
        fields: [
          { key: 'timed_words_correct', type: 'number', label: 'Words correct in 30 sec' },
          { key: 'timed_hesitated_on', type: 'text', label: 'Hesitated on' },
        ],
        note: 'Under 10 words / 30 sec = fluency concern. Drill current UFLI unit to automaticity before advancing.',
      },
      {
        title: 'Notes',
        fields: [{ key: 'notes', type: 'textarea', label: 'Notes' }],
      },
    ],
  },

  // ─── 05 SIGHT WORD FLUENCY ─────────────────────────────
  'sight-word-fluency': {
    label: 'Sight Word Fluency',
    subtitle: 'Teacher Copy · Oral · ~6 min',
    instruction: 'Point to each word. Student reads aloud. A = automatic (under 2 sec) S = slow X = unknown',
    sections: [
      {
        number: 1, title: 'Dolch Pre-Primer',
        prompt: 'Say: "Read each word as fast as you can."',
        fields: [
          { key: 'dolch_preprimer', type: 'sight-word-grid', words: ['the','a','and','I','it','in','is','to','you','he','she','we','my','at','be','do','go','no','so','up'] },
        ],
        note: '5+ X marks = this Dolch list is the current sight word target for daily review.',
      },
      {
        number: 2, title: 'Dolch Primer',
        prompt: 'Say: "Read each word as fast as you can."',
        fields: [
          { key: 'dolch_primer', type: 'sight-word-grid', words: ['all','am','are','as','but','can','did','for','had','him','his','how','out','put','run','see','said','was','with','they'] },
        ],
        note: '5+ X marks = this Dolch list is the current sight word target for daily review.',
      },
      {
        number: 3, title: 'Dolch 1st Grade',
        prompt: 'Say: "Read each word as fast as you can."',
        fields: [
          { key: 'dolch_1st', type: 'sight-word-grid', words: ['after','again','any','ask','by','could','every','fly','from','give','going','just','know','let','live','may','old','once','open','over'] },
        ],
        note: '5+ X marks = this Dolch list is the current sight word target for daily review.',
      },
      {
        title: 'Notes',
        fields: [{ key: 'notes', type: 'textarea', label: 'Notes' }],
      },
    ],
  },

  // ─── 06 ORAL READING FLUENCY ───────────────────────────
  'oral-reading-fluency': {
    label: 'Oral Reading Fluency',
    subtitle: 'Teacher Copy · Oral · ~8 min',
    instruction: 'Time 1 minute per passage. Mark errors with a slash. Note substitutions, omissions, hesitations.',
    sections: [
      {
        number: 1, title: 'K Level - CVC Short Vowels — "The Cat"',
        passage: 'The cat sat on the mat. The cat is big. The cat ran to the man. The man had a hat.',
        fields: [
          { key: 'k_wcpm', type: 'number', label: 'WCPM', placeholder: 'Benchmark: 15-25' },
          { key: 'k_errors', type: 'number', label: 'Errors' },
          { key: 'k_fluency', type: 'fluency-select', label: 'Reading quality' },
        ],
      },
      {
        number: 2, title: '1st Grade - Blends & Digraphs — "The Ship"',
        passage: 'The ship is in the pond. A frog can jump on the ship. The frog and fish swim. The ship had a big flag.',
        fields: [
          { key: '1st_wcpm', type: 'number', label: 'WCPM', placeholder: 'Benchmark: 40-60' },
          { key: '1st_errors', type: 'number', label: 'Errors' },
          { key: '1st_fluency', type: 'fluency-select', label: 'Reading quality' },
        ],
      },
      {
        number: 3, title: '2nd Grade - Silent E & Vowel Teams — "A Day at the Lake"',
        passage: 'Jake made a cake for the trip. He came to the lake with his mom. They ate the cake by the lake. It was a nice day to swim and play.',
        fields: [
          { key: '2nd_wcpm', type: 'number', label: 'WCPM', placeholder: 'Benchmark: 70-90' },
          { key: '2nd_errors', type: 'number', label: 'Errors' },
          { key: '2nd_fluency', type: 'fluency-select', label: 'Reading quality' },
        ],
      },
      {
        number: 4, title: '3rd Grade - Multisyllabic — "The Picnic Plan"',
        passage: 'The children planned a picnic at the park. They packed sandwiches, snacks, and drinks. When they arrived, they spread a blanket. Everyone enjoyed the sunny afternoon.',
        fields: [
          { key: '3rd_wcpm', type: 'number', label: 'WCPM', placeholder: 'Benchmark: 90-110' },
          { key: '3rd_errors', type: 'number', label: 'Errors' },
          { key: '3rd_fluency', type: 'fluency-select', label: 'Reading quality' },
        ],
      },
      {
        title: 'Notes',
        fields: [{ key: 'notes', type: 'textarea', label: 'Notes' }],
      },
    ],
  },

  // ─── 07 SPELLING & ENCODING ────────────────────────────
  'spelling-encoding': {
    label: 'Spelling & Encoding',
    subtitle: 'Teacher Copy · Dictation · ~6 min',
    instruction: 'Dictate each word. Student writes it. C = correct  P = phonetically plausible  X = random error',
    sections: [
      {
        number: 1, title: 'CVC Short Vowels (Units 1-4)',
        prompt: 'Say: "Write this word: ___"',
        fields: [
          { key: 'spell_sat', type: 'spelling-row', word: 'sat' },
          { key: 'spell_hop', type: 'spelling-row', word: 'hop' },
          { key: 'spell_bin', type: 'spelling-row', word: 'bin' },
        ],
        note: 'P = hears sounds but pattern not internalized. X = phonological gap.',
      },
      {
        number: 2, title: 'Digraphs (Units 5-7)',
        prompt: 'Say: "Write this word: ___"',
        fields: [
          { key: 'spell_ship', type: 'spelling-row', word: 'ship' },
          { key: 'spell_chin', type: 'spelling-row', word: 'chin' },
          { key: 'spell_back', type: 'spelling-row', word: 'back' },
        ],
        note: "Common error: writes 'sh' as 's'. Points to digraph instruction need.",
      },
      {
        number: 3, title: 'Consonant Blends (Units 8-10)',
        prompt: 'Say: "Write this word: ___"',
        fields: [
          { key: 'spell_flag', type: 'spelling-row', word: 'flag' },
          { key: 'spell_trip', type: 'spelling-row', word: 'trip' },
          { key: 'spell_spin', type: 'spelling-row', word: 'spin' },
        ],
        note: "Drops a blend letter (e.g. 'fag' for 'flag') = blend sequencing not solid.",
      },
      {
        number: 4, title: 'Magic-E / CVCe (Unit 14)',
        prompt: 'Say: "Write this word: ___"',
        fields: [
          { key: 'spell_cake', type: 'spelling-row', word: 'cake' },
          { key: 'spell_bike', type: 'spelling-row', word: 'bike' },
          { key: 'spell_home', type: 'spelling-row', word: 'home' },
        ],
        note: "Writes 'cak' for 'cake' = CVCe not internalized. Target Unit 14.",
      },
      {
        number: 5, title: 'Vowel Teams (Units 15-17)',
        prompt: 'Say: "Write this word: ___"',
        fields: [
          { key: 'spell_rain', type: 'spelling-row', word: 'rain' },
          { key: 'spell_feet', type: 'spelling-row', word: 'feet' },
          { key: 'spell_boat', type: 'spelling-row', word: 'boat' },
        ],
        note: "Writes 'rane' = phonetically plausible but wrong team. Needs vowel team sorting.",
      },
      {
        number: 6, title: 'R-Controlled (Units 18-20)',
        prompt: 'Say: "Write this word: ___"',
        fields: [
          { key: 'spell_farm', type: 'spelling-row', word: 'farm' },
          { key: 'spell_bird', type: 'spelling-row', word: 'bird' },
          { key: 'spell_corn', type: 'spelling-row', word: 'corn' },
        ],
        note: 'Mixes er/ir/ur = r-controlled vowels not solidified. Units 18-20.',
      },
      {
        title: 'Notes',
        fields: [{ key: 'notes', type: 'textarea', label: 'Notes' }],
      },
    ],
  },

  // ─── 08 VOCABULARY ─────────────────────────────────────
  'vocabulary': {
    label: 'Vocabulary',
    subtitle: 'Teacher Copy · Oral · ~6 min',
    instruction: 'All oral. No reading required. Listen for depth of meaning, not just yes or no answers.',
    sections: [
      {
        number: 1, title: 'Word Meaning',
        prompt: 'Say: "What does this word mean? Tell me in your own words."',
        fields: [
          { key: 'meaning_enormous', type: 'check', label: 'enormous', expected: 'very big' },
          { key: 'meaning_exhausted', type: 'check', label: 'exhausted', expected: 'very tired' },
          { key: 'meaning_drenched', type: 'check', label: 'drenched', expected: 'very wet' },
        ],
        note: "Can't define 2+ words = vocabulary depth is a target. Focus on EL Education vocabulary routines.",
      },
      {
        number: 2, title: 'Vocabulary in Context',
        prompt: 'Say: "I\'ll read a sentence. Tell me what the underlined word means in that sentence."',
        fields: [
          { key: 'ctx_enormous', type: 'check', label: 'The enormous dog barely fit through the door.', expected: 'very big' },
          { key: 'ctx_exhausted', type: 'check', label: 'She was so exhausted she fell asleep at dinner.', expected: 'very tired' },
          { key: 'ctx_drenched', type: 'check', label: 'After the rain, his shoes were drenched.', expected: 'very wet' },
        ],
        note: 'Misses context clues = language comprehension strand needs attention.',
      },
      {
        number: 3, title: 'Multiple Meaning Words',
        prompt: 'Say: "Can you tell me two different ways to use this word?"',
        fields: [
          { key: 'multi_bat', type: 'check', label: 'bat', expected: 'tool / animal' },
          { key: 'multi_spring', type: 'check', label: 'spring', expected: 'season / bounce' },
          { key: 'multi_light', type: 'check', label: 'light', expected: 'not heavy / lamp' },
        ],
        note: 'Struggles with multiple meanings = word consciousness is low. Needs rich read-aloud and discussion.',
      },
      {
        title: 'Notes',
        fields: [{ key: 'notes', type: 'textarea', label: 'Notes' }],
      },
    ],
  },

  // ─── 09 READING COMPREHENSION ──────────────────────────
  'reading-comprehension': {
    label: 'Reading Comprehension',
    subtitle: 'Teacher Copy · Oral · ~8 min',
    instruction: 'Read the passage aloud OR have the student read it. Then ask all questions orally.',
    sections: [
      {
        title: 'Passage',
        passage: "Mia found a small, wet puppy under a bush in the rain. She wrapped it in her jacket and ran home. Her mom said they could keep it if no one claimed it. Mia named the puppy Biscuit. Every morning Mia feeds Biscuit and takes him for a walk.",
        fields: [],
      },
      {
        title: 'Comprehension Questions',
        fields: [
          { key: 'q1_literal', type: 'check', label: '1. Where did Mia find the puppy?', expected: 'Under a bush in the rain', tag: 'Literal' },
          { key: 'q2_literal', type: 'check', label: '2. What did Mia do when she found it?', expected: 'Wrapped it in her jacket and ran home', tag: 'Literal' },
          { key: 'q3_inferential', type: 'check', label: '3. How do you think Mia felt? Why?', expected: 'Worried / excited / caring — must give a reason', tag: 'Inferential' },
          { key: 'q4_inferential', type: 'check', label: "4. Why did mom say 'if no one claimed it'?", expected: 'The puppy might belong to someone else', tag: 'Inferential' },
          { key: 'q5_evidence', type: 'check', label: '5. What shows Mia takes good care of Biscuit?', expected: 'She feeds him and walks him every morning', tag: 'Text Evidence' },
          { key: 'q6_vocabulary', type: 'check', label: "6. What does 'claimed' mean here?", expected: 'Said it was theirs / came to get it', tag: 'Vocabulary' },
        ],
        note: 'Literal OK + Inferential wrong = language comprehension gap. Both wrong = prioritize EL Education read-aloud routines.',
      },
      {
        title: 'Notes',
        fields: [{ key: 'notes', type: 'textarea', label: 'Notes' }],
      },
    ],
  },

  // ─── 10 PRINT CONCEPTS ─────────────────────────────────
  'print-concepts': {
    label: 'Print Concepts',
    subtitle: 'Teacher Copy · Observation · ~4 min · K Only',
    instruction: 'Hold a simple picture book. Ask and observe. Do not lead the student to the answer.',
    sections: [
      {
        title: 'Print Concepts Checklist',
        fields: [
          { key: 'pc_orientation', type: 'check', label: '1. Book Orientation', prompt: 'Hand book upside-down - does student correct it?', expected: 'Turns right-side-up independently' },
          { key: 'pc_front_cover', type: 'check', label: '2. Front Cover', prompt: 'Show me the front of this book.', expected: 'Points to front cover correctly' },
          { key: 'pc_where_start', type: 'check', label: '3. Where to Start', prompt: 'Show me where I start reading.', expected: 'Points to top left of page' },
          { key: 'pc_directionality', type: 'check', label: '4. Directionality', prompt: 'Show me which way I read across the page.', expected: 'Moves finger left to right' },
          { key: 'pc_return_sweep', type: 'check', label: '5. Return Sweep', prompt: 'What do I do at the end of a line?', expected: 'Moves to next line, starts left' },
          { key: 'pc_word_vs_letter', type: 'check', label: '6. Word vs. Letter', prompt: 'Point to one word. Now point to one letter.', expected: 'Correctly identifies both' },
          { key: 'pc_first_last', type: 'check', label: '7. First / Last Word', prompt: 'Point to the first word. Now the last.', expected: 'Identifies both correctly' },
          { key: 'pc_punctuation', type: 'check', label: '8. Punctuation', prompt: 'What is this mark? (point to period, then comma)', expected: 'Names or describes its function' },
        ],
        note: 'Misses 4+ = print concepts instruction needed before phonics. Common with K students with limited book exposure.',
      },
      {
        title: 'Notes',
        fields: [{ key: 'notes', type: 'textarea', label: 'Notes' }],
      },
    ],
  },

  // ─── 11 WRITING & WRITTEN EXPRESSION ───────────────────
  'writing-written-expression': {
    label: 'Writing & Written Expression',
    subtitle: 'Teacher Copy · Written · ~8 min',
    instruction: 'Student writes on their own blank sheet. You observe and score on this sheet.',
    sections: [
      {
        number: 1, title: 'Letter Formation',
        prompt: 'Say: "Write the letters I say. Uppercase first, then lowercase."',
        fields: [
          { key: 'letter_form', type: 'check-grid', items: ['S','M','B','F','R','s','m','b','f','r'], labels: ['S','M','B','F','R','s','m','b','f','r'] },
        ],
        note: 'Illegible or reversed letters = formation needs explicit practice. Note b/d and p/q reversals.',
      },
      {
        number: 2, title: 'Sentence Writing',
        prompt: 'Say: "Write one sentence about something you did this week. Use your best spelling."',
        fields: [
          { key: 'sw_capital', type: 'check', label: 'Capital letter', expected: 'Sentence begins with uppercase' },
          { key: 'sw_punctuation', type: 'check', label: 'End punctuation', expected: 'Period, question mark, or exclamation' },
          { key: 'sw_complete', type: 'check', label: 'Complete thought', expected: 'Subject + verb, makes sense' },
          { key: 'sw_phonics', type: 'check', label: 'Phonics in spelling', expected: 'Reflects current phonics level' },
          { key: 'sw_spacing', type: 'check', label: 'Word spacing', expected: 'Clear spaces between words' },
        ],
        note: 'Missing conventions = mechanics target. Spelling errors = cross-reference Phonics & Encoding.',
      },
      {
        number: 3, title: 'Written Response to Text',
        prompt: 'Say: "After reading - write one or two sentences: What happened in this story?"',
        fields: [
          { key: 'wr_content', type: 'score-3', label: 'Content', criteria: 'Accurately reflects the passage' },
          { key: 'wr_vocabulary', type: 'score-3', label: 'Vocabulary', criteria: 'Uses words from the text' },
          { key: 'wr_conventions', type: 'score-3', label: 'Conventions', criteria: 'Caps, punctuation, spacing' },
        ],
        note: 'Low content = comprehension concern. Both low = start with oral retelling before written response.',
      },
      {
        title: 'Notes',
        fields: [{ key: 'notes', type: 'textarea', label: 'Notes' }],
      },
    ],
  },
}

// Get empty form_data for a category
export function getEmptyFormData(categoryId) {
  const schema = FORM_SCHEMAS[categoryId]
  if (!schema) return {}
  const data = {}
  for (const section of schema.sections) {
    for (const field of section.fields) {
      if (field.type === 'letter-grid') data[field.key] = []
      else if (field.type === 'check-grid') data[field.key] = []
      else if (field.type === 'sight-word-grid') data[field.key] = {}  // { word: 'A'|'S'|'X' }
      else if (field.type === 'spelling-row') data[field.key] = { score: '', student_wrote: '', error: '' }
      else if (field.type === 'check') data[field.key] = null  // null = not marked, true = pass, false = fail
      else if (field.type === 'number') data[field.key] = ''
      else data[field.key] = ''
    }
  }
  return data
}

// Serialize form_data to readable text for AI analysis
export function serializeFormData(categoryId, formData) {
  const schema = FORM_SCHEMAS[categoryId]
  if (!schema || !formData) return ''
  const lines = [`ASSESSMENT: ${schema.label}`]
  for (const section of schema.sections) {
    if (section.title && section.title !== 'Notes') lines.push(`\n${section.title}:`)
    for (const field of section.fields) {
      const val = formData[field.key]
      if (val === '' || val === undefined || val === null) continue

      if (field.type === 'check') {
        lines.push(`- ${field.label}: ${val === true ? 'PASS' : val === false ? 'MISS' : ''}`)
      } else if (field.type === 'letter-grid') {
        if (Array.isArray(val) && val.length > 0) lines.push(`- ${field.key}: ${val.length}/${field.letters.length} known (${val.join(', ')})`)
      } else if (field.type === 'check-grid') {
        if (Array.isArray(val) && val.length > 0) lines.push(`- Passed: ${val.join(', ')} (${val.length}/${field.items.length})`)
      } else if (field.type === 'sight-word-grid') {
        if (typeof val === 'object' && Object.keys(val).length > 0) {
          const auto = Object.entries(val).filter(([,v]) => v === 'A').map(([w]) => w)
          const slow = Object.entries(val).filter(([,v]) => v === 'S').map(([w]) => w)
          const unknown = Object.entries(val).filter(([,v]) => v === 'X').map(([w]) => w)
          if (auto.length) lines.push(`- Automatic: ${auto.join(', ')}`)
          if (slow.length) lines.push(`- Slow: ${slow.join(', ')}`)
          if (unknown.length) lines.push(`- Unknown: ${unknown.join(', ')}`)
        }
      } else if (field.type === 'spelling-row') {
        if (typeof val === 'object' && val.score) {
          const scoreLabel = val.score === 'C' ? 'Correct' : val.score === 'P' ? 'Phonetically plausible' : 'Random error'
          lines.push(`- ${field.word}: ${scoreLabel}${val.student_wrote ? ` (wrote: ${val.student_wrote})` : ''}${val.error ? ` [${val.error}]` : ''}`)
        }
      } else if (field.type === 'score-3') {
        lines.push(`- ${field.label}: ${val}/3`)
      } else if (field.type === 'fluency-select') {
        const opt = FLUENCY_OPTIONS.find(o => o.value === val)
        lines.push(`- ${field.label}: ${opt?.label || val}`)
      } else if (val) {
        lines.push(`- ${field.label || field.key}: ${val}`)
      }
    }
  }
  return lines.join('\n')
}

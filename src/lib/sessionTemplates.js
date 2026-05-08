export const SESSION_TEMPLATES = [
  {
    id: 'first-session',
    name: 'First Session',
    icon: '👋',
    description: 'Intake review, baseline check, rapport building',
    session_goal: 'Get to know the student, establish baseline, and build trust',
    ufli_focus_unit: null,
    ufli_focus_unit_name: 'To be determined',
    blocks: [
      {
        time_start: '0:00', time_end: '0:10', name: 'Get to Know You', type: 'warm-up',
        what_to_do: ['Ask about favorite books and what they like to read', 'Chat about school — what feels easy, what feels hard', 'Let them pick a book to look at together'],
        example_words_or_prompts: [], materials_needed: [],
        watch_for: 'Confidence level and attitude toward reading'
      },
      {
        time_start: '0:10', time_end: '0:20', name: 'Letter & Sound Check', type: 'phonemic_awareness',
        what_to_do: ['Quick alphabet recognition — show letters, ask for sounds', 'Check CVC blending with simple words', 'Note which sounds are automatic vs. hesitant'],
        example_words_or_prompts: ['cat', 'sit', 'hop', 'fun', 'bed'],
        materials_needed: ['Letter cards or alphabet chart'],
        watch_for: 'Which letters/sounds cause hesitation'
      },
      {
        time_start: '0:20', time_end: '0:35', name: 'Baseline Reading Check', type: 'connected_reading',
        what_to_do: ['Start with a K-level decodable passage', 'Move up levels until they struggle', 'Note accuracy, fluency, and self-correction'],
        example_words_or_prompts: [],
        materials_needed: ['Decodable passages at K, 1st, 2nd, 3rd levels'],
        watch_for: 'Where decoding breaks down — this sets the UFLI placement'
      },
      {
        time_start: '0:35', time_end: '0:45', name: 'Spelling Sample', type: 'encoding_spelling',
        what_to_do: ['Dictate 5-8 words at increasing difficulty', 'Include CVC, blends, digraphs, and one CVCe word', 'Note phonetic spelling attempts — these show what they know'],
        example_words_or_prompts: ['hat', 'ship', 'blend', 'cake', 'train'],
        materials_needed: ['Paper and pencil'],
        watch_for: 'Are they using phonics to spell or guessing?'
      },
      {
        time_start: '0:45', time_end: '0:50', name: 'Wrap Up & Encouragement', type: 'confidence_close',
        what_to_do: ['Name 2-3 specific things they did well', 'Preview what you\'ll work on together', 'Let them know you\'re excited to help them'],
        example_words_or_prompts: [],
        materials_needed: [],
        watch_for: 'End on a high note — first impressions matter'
      },
    ],
    prep_checklist: ['Print decodable passages (K through 3rd)', 'Letter/sound cards ready', 'Spelling word list prepared', 'Paper and pencils'],
    tutor_reminder: 'This is about building trust, not testing. Keep it light and encouraging.'
  },
  {
    id: 'reassessment',
    name: 'Re-Assessment Day',
    icon: '📊',
    description: 'Measure growth, update placement, adjust the plan',
    session_goal: 'Measure progress since last assessment and update the learning plan',
    ufli_focus_unit: null,
    ufli_focus_unit_name: 'Review',
    blocks: [
      {
        time_start: '0:00', time_end: '0:05', name: 'Check-In', type: 'warm-up',
        what_to_do: ['Quick chat about how reading has been going at home', 'Review what you\'ve been working on together', 'Frame this as a celebration, not a test'],
        example_words_or_prompts: [],
        materials_needed: [],
        watch_for: 'Anxiety — keep it casual'
      },
      {
        time_start: '0:05', time_end: '0:15', name: 'Phonics Pattern Check', type: 'phonics_instruction',
        what_to_do: ['Test the patterns you\'ve been teaching — real words AND nonsense words', 'Compare to baseline — are they decoding or memorizing?', 'Note which patterns are now automatic'],
        example_words_or_prompts: ['bake/dake', 'train/frain', 'shop/thop'],
        materials_needed: ['Word cards — real and nonsense pairs'],
        watch_for: 'Real words correct but nonsense words wrong = memorization flag'
      },
      {
        time_start: '0:15', time_end: '0:30', name: 'Passage Reading', type: 'connected_reading',
        what_to_do: ['Read the same passage level as baseline assessment', 'Then try one level higher', 'Time for 1 minute to get fluency count'],
        example_words_or_prompts: [],
        materials_needed: ['Decodable passages', 'Timer'],
        watch_for: 'Fluency improvement, self-correction strategies'
      },
      {
        time_start: '0:30', time_end: '0:40', name: 'Spelling Re-Check', type: 'encoding_spelling',
        what_to_do: ['Dictate similar words to the baseline spelling sample', 'Include patterns you\'ve been teaching', 'Compare to original — look for phonics transfer'],
        example_words_or_prompts: [],
        materials_needed: ['Paper and pencil', 'Baseline spelling sample for comparison'],
        watch_for: 'Are they applying the patterns in writing?'
      },
      {
        time_start: '0:40', time_end: '0:50', name: 'Celebrate & Preview', type: 'confidence_close',
        what_to_do: ['Show them specific growth — "Last time you couldn\'t do X, now you can!"', 'Preview the next phase of learning', 'Send a positive note home to parents'],
        example_words_or_prompts: [],
        materials_needed: [],
        watch_for: 'Make growth visible and concrete'
      },
    ],
    prep_checklist: ['Pull baseline assessment for comparison', 'Print word cards (real + nonsense)', 'Same-level decodable passage ready', 'Timer for fluency count'],
    tutor_reminder: 'Frame everything as growth. Compare to their OWN baseline, not to grade level.'
  },
  {
    id: 'confidence-builder',
    name: 'Confidence Builder',
    icon: '⭐',
    description: 'Easy wins, familiar patterns, positive momentum',
    session_goal: 'Build reading confidence through success with familiar and slightly challenging material',
    ufli_focus_unit: null,
    ufli_focus_unit_name: 'Review of mastered skills',
    blocks: [
      {
        time_start: '0:00', time_end: '0:08', name: 'Favorite Book Time', type: 'warm-up',
        what_to_do: ['Let them choose a familiar book to read aloud', 'Praise fluency and expression', 'Point out words they decoded without help'],
        example_words_or_prompts: [],
        materials_needed: ['Selection of books at their comfort level'],
        watch_for: 'Joy and engagement — that\'s the goal today'
      },
      {
        time_start: '0:08', time_end: '0:18', name: 'Pattern Champion', type: 'phonics_instruction',
        what_to_do: ['Review 2-3 patterns they\'ve already mastered', 'Speed drill — how many words can they read in 60 seconds?', 'Celebrate the score and try to beat it'],
        example_words_or_prompts: [],
        materials_needed: ['Word cards for mastered patterns'],
        watch_for: 'Automaticity building — this should feel easy and fast'
      },
      {
        time_start: '0:18', time_end: '0:30', name: 'Reading Success', type: 'connected_reading',
        what_to_do: ['Read a decodable text at their comfort level', 'Focus on expression and fluency, not accuracy drilling', 'Re-read a favorite paragraph with "radio voice"'],
        example_words_or_prompts: [],
        materials_needed: ['Decodable reader at comfort level'],
        watch_for: 'Expression and confidence growing'
      },
      {
        time_start: '0:30', time_end: '0:40', name: 'Word Building Game', type: 'encoding_spelling',
        what_to_do: ['Build words with letter tiles using known patterns', 'Make it a game — "Can you change CAT to BAT to BAG?"', 'Introduce one slightly new challenge at the end'],
        example_words_or_prompts: ['cat→bat→bag→big→dig→dog'],
        materials_needed: ['Letter tiles or magnetic letters'],
        watch_for: 'Willingness to try — that\'s the win'
      },
      {
        time_start: '0:40', time_end: '0:50', name: 'Star Moment', type: 'confidence_close',
        what_to_do: ['Name 3 specific things they crushed today', 'Write one on a "star card" they take home', 'Preview next session with excitement'],
        example_words_or_prompts: [],
        materials_needed: ['Star cards or sticky notes'],
        watch_for: 'They should leave feeling like a reader'
      },
    ],
    prep_checklist: ['Pick books at comfort level', 'Word cards for mastered patterns only', 'Letter tiles ready', 'Star cards or sticky notes'],
    tutor_reminder: 'Today is about JOY. No new hard skills. If they\'re struggling, go easier.'
  },
  {
    id: 'fluency-focus',
    name: 'Fluency Focus',
    icon: '🏃',
    description: 'Timed reads, repeated reading, prosody practice',
    session_goal: 'Increase reading speed and expression through repeated practice with connected text',
    ufli_focus_unit: null,
    ufli_focus_unit_name: 'Fluency practice',
    blocks: [
      {
        time_start: '0:00', time_end: '0:05', name: 'Warm-Up Read', type: 'warm-up',
        what_to_do: ['Quick familiar text read-aloud to get warmed up', 'Focus on smooth reading, not perfection'],
        example_words_or_prompts: [],
        materials_needed: ['Familiar decodable text'],
        watch_for: 'Starting energy and engagement'
      },
      {
        time_start: '0:05', time_end: '0:15', name: 'Sight Word Speed', type: 'phonemic_awareness',
        what_to_do: ['Flash sight word cards — goal is automatic recognition', '60-second challenge: how many can they read?', 'Track the number and try to beat it on round 2'],
        example_words_or_prompts: ['the', 'said', 'have', 'come', 'were', 'there'],
        materials_needed: ['Sight word flash cards', 'Timer'],
        watch_for: 'Which words still cause pauses'
      },
      {
        time_start: '0:15', time_end: '0:30', name: 'Repeated Reading', type: 'connected_reading',
        what_to_do: ['Read a passage cold — time for 1 minute, count words', 'Practice tricky words from the passage', 'Re-read the same passage — time again, compare scores', 'Third read focusing on expression and "radio voice"'],
        example_words_or_prompts: [],
        materials_needed: ['Grade-level decodable passage', 'Timer', 'Pencil to mark errors'],
        watch_for: 'Words-per-minute improvement across reads'
      },
      {
        time_start: '0:30', time_end: '0:40', name: 'Phrase Reading', type: 'phonics_instruction',
        what_to_do: ['Read phrases on cards — focus on reading in chunks, not word-by-word', 'Practice scooping phrases with a finger', 'Model fluent phrasing, then have them echo'],
        example_words_or_prompts: ['the big dog', 'ran to the park', 'a little red bird'],
        materials_needed: ['Phrase cards'],
        watch_for: 'Word-by-word reading vs. phrase reading'
      },
      {
        time_start: '0:40', time_end: '0:50', name: 'Performance Read', type: 'confidence_close',
        what_to_do: ['Final read of the passage — their "performance"', 'Record them reading if they\'re willing (great to show parents)', 'Celebrate the fluency gains from today'],
        example_words_or_prompts: [],
        materials_needed: [],
        watch_for: 'Confidence and willingness to perform'
      },
    ],
    prep_checklist: ['Decodable passage at instructional level', 'Sight word flash cards', 'Phrase cards', 'Timer', 'Score tracking sheet'],
    tutor_reminder: 'Fluency comes from repeated practice with the SAME text, not new text. Three reads minimum.'
  },
  {
    id: 'phonics-deep-dive',
    name: 'Phonics Deep Dive',
    icon: '🔬',
    description: 'Intensive phonics instruction, word sorts, nonsense words',
    session_goal: 'Deeply teach and practice the current UFLI phonics pattern',
    ufli_focus_unit: null,
    ufli_focus_unit_name: 'Current working pattern',
    blocks: [
      {
        time_start: '0:00', time_end: '0:05', name: 'Sound Warm-Up', type: 'warm-up',
        what_to_do: ['Quick review of previously mastered sounds', 'Phoneme segmenting with 3-4 words', 'Blending practice with today\'s target sound'],
        example_words_or_prompts: [],
        materials_needed: [],
        watch_for: 'Are previous sounds still solid?'
      },
      {
        time_start: '0:05', time_end: '0:15', name: 'Phonemic Awareness', type: 'phonemic_awareness',
        what_to_do: ['Oral manipulation with today\'s pattern', '"Say CAKE. Now change the /k/ to /l/. What word?"', 'Blend and segment 6-8 words with target pattern'],
        example_words_or_prompts: ['cake→lake', 'bike→hike', 'nose→rose'],
        materials_needed: [],
        watch_for: 'Can they manipulate sounds orally before seeing print?'
      },
      {
        time_start: '0:15', time_end: '0:30', name: 'Phonics Instruction', type: 'phonics_instruction',
        what_to_do: ['Introduce or reinforce the pattern explicitly', 'Word sort — real words into pattern categories', 'Nonsense word check — can they decode unfamiliar words with this pattern?', 'Dictation — say a word, they write it'],
        example_words_or_prompts: [],
        materials_needed: ['Word sort cards', 'Nonsense word list', 'Whiteboard or paper'],
        watch_for: 'Real words correct but nonsense wrong = memorizing, not decoding'
      },
      {
        time_start: '0:30', time_end: '0:40', name: 'Decodable Reading', type: 'connected_reading',
        what_to_do: ['Read a decodable text heavy with today\'s pattern', 'Point out target pattern words as they read', 'If they miss one, stop and decode it together'],
        example_words_or_prompts: [],
        materials_needed: ['Decodable text matched to pattern'],
        watch_for: 'Are they applying the pattern in connected text?'
      },
      {
        time_start: '0:40', time_end: '0:50', name: 'Write & Review', type: 'encoding_spelling',
        what_to_do: ['Dictate 2-3 sentences using target pattern words', 'Review their spelling — praise phonics attempts', 'Summarize what they learned today'],
        example_words_or_prompts: [],
        materials_needed: ['Paper and pencil'],
        watch_for: 'Transfer from reading to writing'
      },
    ],
    prep_checklist: ['Word sort cards for target pattern', 'Nonsense word list', 'Decodable text matched to pattern', 'Whiteboard markers or paper'],
    tutor_reminder: 'Go deep, not wide. Master ONE pattern today. Nonsense words tell you if they really get it.'
  },
  {
    id: 'review-reinforce',
    name: 'Review & Reinforce',
    icon: '🔄',
    description: 'Spiral review of struggling patterns, mixed practice',
    session_goal: 'Revisit and strengthen patterns that haven\'t stuck yet',
    ufli_focus_unit: null,
    ufli_focus_unit_name: 'Mixed review',
    blocks: [
      {
        time_start: '0:00', time_end: '0:08', name: 'Pattern Shuffle', type: 'warm-up',
        what_to_do: ['Flash cards mixing 3-4 different patterns they\'ve learned', 'Quick sort — can they categorize words by pattern?', 'Note which patterns are automatic vs. still slow'],
        example_words_or_prompts: [],
        materials_needed: ['Mixed pattern word cards'],
        watch_for: 'Which patterns have stuck and which haven\'t'
      },
      {
        time_start: '0:08', time_end: '0:18', name: 'Trouble Spot Drill', type: 'phonics_instruction',
        what_to_do: ['Focus on the 1-2 patterns causing the most trouble', 'Go back to basics — oral blending, then written', 'Nonsense words to check real understanding', 'Build confidence before moving on'],
        example_words_or_prompts: [],
        materials_needed: ['Targeted word cards', 'Nonsense word list'],
        watch_for: 'Frustration — keep it supportive'
      },
      {
        time_start: '0:18', time_end: '0:28', name: 'Mixed Reading', type: 'connected_reading',
        what_to_do: ['Read a passage that includes multiple learned patterns', 'When they hit a tricky word, prompt: "What pattern do you see?"', 'Celebrate when they self-correct'],
        example_words_or_prompts: [],
        materials_needed: ['Multi-pattern decodable text'],
        watch_for: 'Self-correction and strategy use'
      },
      {
        time_start: '0:28', time_end: '0:38', name: 'Spelling Scramble', type: 'encoding_spelling',
        what_to_do: ['Dictate words from mixed patterns — they write', 'After each word, ask "What pattern did you use?"', 'Make it a game — points for correct spelling AND naming the pattern'],
        example_words_or_prompts: [],
        materials_needed: ['Whiteboard or paper'],
        watch_for: 'Can they name the pattern, not just spell the word?'
      },
      {
        time_start: '0:38', time_end: '0:50', name: 'Reading Race & Close', type: 'confidence_close',
        what_to_do: ['Timed word list with all learned patterns mixed', 'Beat their own score from last time', 'Name the patterns that are getting stronger', 'Preview what\'s coming next'],
        example_words_or_prompts: [],
        materials_needed: ['Mixed word list', 'Timer'],
        watch_for: 'Progress over time — compare to previous scores'
      },
    ],
    prep_checklist: ['Mixed pattern word cards', 'Nonsense word list for trouble patterns', 'Multi-pattern decodable text', 'Timer and score sheet from last session'],
    tutor_reminder: 'Spiral review is where patterns become automatic. Don\'t rush to new material if old patterns are shaky.'
  },
]

-- Drama Games content refresh (description + activity_text)
-- Generated 2026-10-19 for Studio Score / CCDesigner
-- Apply manually to the live Supabase database. Do not run from CI.
-- Updates by activity id; titles/time/category/year groups unchanged
-- (apart from any obvious title typo fixes applied in the snapshot).

BEGIN;

-- Mirror Twins
UPDATE activities
SET description = '<p>Let''s play Mirror Twins. In pairs, one child moves slowly while the other mirrors exactly.</p><p><strong>Why it works</strong></p><ul><li>Builds concentration and body awareness</li><li>Great introduction to mime</li><li>Develops non-verbal communication</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space. Children work in pairs. No props needed. About 10 minutes.</p><p><strong>How to play</strong></p><ol><li>In pairs, one child moves slowly while the other mirrors exactly</li><li>Swap roles after 1-2 minutes</li></ol><p><strong>Teacher tips</strong></p><ul><li>Model one round first, then swap roles so everyone leads.</li><li>Keep rounds short and celebrate big, clear choices.</li><li>Use simple stop/go cues the class already knows.</li></ul><p><strong>Make it easier</strong></p><p>Work as a whole class first, then try with a partner.</p><p><strong>Make it harder</strong></p><p>Add a second cue (speed, size or emotion) once the basic game is secure.</p>',
    updated_at = NOW()
WHERE id = 'd17f19ed-9cf8-4547-9a40-69202d26c3ea';

-- Yes, Let's!
UPDATE activities
SET description = '<p>Let''s play Yes, Let''s!. Leader calls ''Let''s [action]!'' (e.g.</p><p><strong>Why it works</strong></p><ul><li>Encourages group play and imagination</li><li>Builds collective enthusiasm</li><li>Supports following directions</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. Whole class. No props needed. About 10 minutes.</p><p><strong>How to play</strong></p><ol><li>Leader calls ''Let''s [action]!'' (e.g. swim with whales)</li><li>Everyone replies ''Yes, let''s!'' and mimes the action together</li></ol><p><strong>Teacher tips</strong></p><ul><li>Keep rounds short and celebrate big, clear choices.</li><li>Use simple stop/go cues the class already knows.</li></ul><p><strong>Make it easier</strong></p><p>Teacher models first; children copy as a whole group before trying in pairs.</p><p><strong>Make it harder</strong></p><p>Demand clearer weight, size and texture so the audience can ''see'' the object.</p>',
    updated_at = NOW()
WHERE id = 'c3b8daa3-cc7e-49dc-9422-507b6f908bb5';

-- Freeze Monster
UPDATE activities
SET description = '<p>Let''s play Freeze Monster. Play music for dancing.</p><p><strong>Why it works</strong></p><ul><li>Develops self-control and listening</li><li>Introduces imaginative freezing</li><li>Fun way to practice stillness</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. Props: optional music player. About 10 minutes.</p><p><strong>How to play</strong></p><ol><li>Play music for dancing</li><li>When music stops, children freeze in silly poses like monsters, superheroes, or trees</li></ol><p><strong>Teacher tips</strong></p><ul><li>Use a clear freeze signal (clap, word or drum) and hold stillness for a count of three.</li><li>Keep tracks short so you can reset energy quickly.</li><li>Keep rounds short and celebrate big, clear choices.</li></ul><p><strong>Make it easier</strong></p><p>Teacher models first; children copy as a whole group before trying in pairs.</p><p><strong>Make it harder</strong></p><p>Add a second cue (speed, size or emotion) once the basic game is secure.</p>',
    updated_at = NOW()
WHERE id = 'f49e5a10-2320-4a8f-81ef-1e39aa6f05fd';

-- Teleporting Environments
UPDATE activities
SET description = '<p>Let''s play Teleporting Environments. Children walk around pretending to be in specific places (desert, jungle, snowy mountain).</p><p><strong>Why it works</strong></p><ul><li>Develops spatial awareness</li><li>Encourages physical storytelling</li><li>Builds quick thinking and adaptation</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Open floor space with clear pathways. No props needed. About 10 minutes.</p><p><strong>How to play</strong></p><ol><li>Children walk around pretending to be in specific places (desert, jungle, snowy mountain)</li><li>Shout ''TELEPORT!'' and name new location</li></ol><p><strong>Teacher tips</strong></p><ul><li>Keep rounds short and celebrate big, clear choices.</li><li>Use simple stop/go cues the class already knows.</li></ul><p><strong>Make it easier</strong></p><p>Teacher models first; children copy as a whole group before trying in pairs.</p><p><strong>Make it harder</strong></p><p>Add a second cue (speed, size or emotion) once the basic game is secure.</p>',
    updated_at = NOW()
WHERE id = '80855026-ad93-4968-9135-a4e35f1ad892';

-- Sculptors and Clay
UPDATE activities
SET description = '<p>Let''s play Sculptors and Clay. In pairs or groups, one child is sculptor and gently molds others into shapes or statues.</p><p><strong>Why it works</strong></p><ul><li>Develops physical awareness and creativity</li><li>Teaches turn-taking and cooperation</li><li>Foundation for tableau building</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space. Children work in pairs. No props needed. About 10 minutes.</p><p><strong>How to play</strong></p><ol><li>Ask the class to find a partner and face each other with a little space around them.</li><li>In pairs or groups, one child is sculptor and gently molds others into shapes or statues. Hold pose then swap roles.</li><li>Use a clear freeze cue; hold the picture, then relax and reset.</li></ol><p><strong>Teacher tips</strong></p><ul><li>Use a clear freeze signal (clap, word or drum) and hold stillness for a count of three.</li><li>Model one round first, then swap roles so everyone leads.</li><li>Keep rounds short and celebrate big, clear choices.</li></ul><p><strong>Make it easier</strong></p><p>Work as a whole class first, then try with a partner.</p><p><strong>Make it harder</strong></p><p>Add a second cue (speed, size or emotion) once the basic game is secure.</p>',
    updated_at = NOW()
WHERE id = '22aa4be2-c256-4030-817a-bed3a281efea';

-- Popcorn Gum
UPDATE activities
SET description = '<p>Let''s play Popcorn Gum. Mime putting gum in mouth, chew it bigger and bigger until it pops!.</p><p><strong>Why it works</strong></p><ul><li>Develops mime and facial expression</li><li>Encourages creative movement</li><li>Fun warm-up for storytelling</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. No props needed. About 10 minutes.</p><p><strong>How to play</strong></p><ol><li>Mime putting gum in mouth, chew it bigger and bigger until it pops!</li><li>Add sound effects and exaggerate facial expressions</li></ol><p><strong>Teacher tips</strong></p><ul><li>Keep rounds short and celebrate big, clear choices.</li><li>Use simple stop/go cues the class already knows.</li></ul><p><strong>Make it easier</strong></p><p>Teacher models first; children copy as a whole group before trying in pairs.</p><p><strong>Make it harder</strong></p><p>Layer dynamics (loud/soft, near/far) and keep a shared pulse.</p>',
    updated_at = NOW()
WHERE id = '434bb402-d4c7-436f-b401-b1713543ef02';

-- Alphabet Sounds
UPDATE activities
SET description = '<p>Let''s play Alphabet Sounds. Children take turns making sounds and movements for letters of the alphabet (e.g.</p><p><strong>Why it works</strong></p><ul><li>Supports phonics and sound recognition</li><li>Combines vocal exploration with coordination</li><li>Links literacy with drama</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. No props needed. About 15 minutes.</p><p><strong>How to play</strong></p><ol><li>Gather attention and explain the game in one short sentence.</li><li>Children take turns making sounds and movements for letters of the alphabet (e.g. ''Aaaah'' with waving hands).</li><li>Repeat once or twice, celebrating clear choices, then stop while energy is still high.</li></ol><p><strong>Teacher tips</strong></p><ul><li>Keep rounds short and celebrate big, clear choices.</li><li>Use simple stop/go cues the class already knows.</li></ul><p><strong>Make it easier</strong></p><p>Teacher models first; children copy as a whole group before trying in pairs.</p><p><strong>Make it harder</strong></p><p>Layer dynamics (loud/soft, near/far) and keep a shared pulse.</p>',
    updated_at = NOW()
WHERE id = 'a2b45f33-bbd1-4b85-87b4-78a347ff7b0b';

-- Fruit Bowl Character Swap
UPDATE activities
SET description = '<p>Let''s play Fruit Bowl Character Swap. Children sit in circle, each assigned a fruit or character.</p><p><strong>Why it works</strong></p><ul><li>Builds listening and memory skills</li><li>Introduces group role play</li><li>Develops spontaneous characterisation</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear space so the class can sit or stand in a circle. No props needed. About 10 minutes.</p><p><strong>How to play</strong></p><ol><li>Children sit in circle, each assigned a fruit or character</li><li>When their name is called, they switch seats acting out their role</li><li>''Fruit Bowl!'' = everyone switches</li></ol><p><strong>Teacher tips</strong></p><ul><li>Keep the circle tight enough that everyone can see and hear.</li><li>Keep rounds short and celebrate big, clear choices.</li><li>Use simple stop/go cues the class already knows.</li></ul><p><strong>Make it easier</strong></p><p>Teacher models first; children copy as a whole group before trying in pairs.</p><p><strong>Make it harder</strong></p><p>Add a second cue (speed, size or emotion) once the basic game is secure.</p>',
    updated_at = NOW()
WHERE id = '39872a4a-f365-4abf-a405-e01bea125541';

-- What Are You Doing? Simple
UPDATE activities
SET description = '<p>Let''s play What Are You Doing? Simple. One child mimes an action.</p><p><strong>Why it works</strong></p><ul><li>Introduces improvisation with language</li><li>Develops quick thinking and verb recall</li><li>Encourages creative responses</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. No props needed. About 10 minutes.</p><p><strong>How to play</strong></p><ol><li>One child mimes an action</li><li>Another asks ''What are you doing?'' Child responds with different action and mimes that</li></ol><p><strong>Teacher tips</strong></p><ul><li>Keep rounds short and celebrate big, clear choices.</li><li>Use simple stop/go cues the class already knows.</li></ul><p><strong>Make it easier</strong></p><p>Teacher models first; children copy as a whole group before trying in pairs.</p><p><strong>Make it harder</strong></p><p>Demand clearer weight, size and texture so the audience can ''see'' the object.</p>',
    updated_at = NOW()
WHERE id = 'ef53adf7-5673-49ee-ac48-1e4c58edf248';

-- Rainstorm Chorus
UPDATE activities
SET description = '<p>Let''s play Rainstorm Chorus. Group gradually builds rainstorm using body sounds: tap fingers for rain, clap for heavier rain, stomp for thunder, then reverse to calm.</p><p><strong>Why it works</strong></p><ul><li>Develops ensemble rhythm</li><li>Teaches soundscape building</li><li>Supports sequencing skills</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. Whole class. No props needed. About 10 minutes.</p><p><strong>How to play</strong></p><ol><li>Gather attention and explain the game in one short sentence.</li><li>Group gradually builds rainstorm using body sounds: tap fingers for rain, clap for heavier rain, stomp for thunder, then reverse to calm.</li><li>Repeat once or twice, celebrating clear choices, then stop while energy is still high.</li></ol><p><strong>Teacher tips</strong></p><ul><li>Keep rounds short and celebrate big, clear choices.</li><li>Use simple stop/go cues the class already knows.</li></ul><p><strong>Make it easier</strong></p><p>Teacher models first; children copy as a whole group before trying in pairs.</p><p><strong>Make it harder</strong></p><p>Layer dynamics (loud/soft, near/far) and keep a shared pulse.</p>',
    updated_at = NOW()
WHERE id = 'f9e68694-48e4-4cb7-abe8-49e1809835dc';

-- Walking Like a Character
UPDATE activities
SET description = '<p>Let''s play Walking Like a Character. Children walk around room copying character walks suggested by teacher (robot, old person, baby, lion).</p><p><strong>Why it works</strong></p><ul><li>Introduces physical characterisation</li><li>Develops movement control</li><li>Encourages imagination through movement</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Open floor space with clear pathways. No props needed. About 10 minutes.</p><p><strong>How to play</strong></p><ol><li>Gather attention and explain the game in one short sentence.</li><li>Children walk around room copying character walks suggested by teacher (robot, old person, baby, lion). Change every 20-30 seconds.</li><li>Repeat once or twice, celebrating clear choices, then stop while energy is still high.</li></ol><p><strong>Teacher tips</strong></p><ul><li>Keep rounds short and celebrate big, clear choices.</li><li>Use simple stop/go cues the class already knows.</li></ul><p><strong>Make it easier</strong></p><p>Teacher models first; children copy as a whole group before trying in pairs.</p><p><strong>Make it harder</strong></p><p>Add a second cue (speed, size or emotion) once the basic game is secure.</p>',
    updated_at = NOW()
WHERE id = 'fa5b6ded-9183-4786-8e60-cdb2a285bc63';

-- Wink Detective
UPDATE activities
SET description = '<p>Let''s play Wink Detective. One child (detective) turns away while teacher chooses secret ''tagger''.</p><p><strong>Why it works</strong></p><ul><li>Develops observation and focus</li><li>Encourages dramatic reaction</li><li>Builds non-verbal communication</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. No props needed. About 10 minutes.</p><p><strong>How to play</strong></p><ol><li>One child (detective) turns away while teacher chooses secret ''tagger''</li><li>Tagger winks at classmates who dramatically fall down</li><li>Detective guesses the tagger</li></ol><p><strong>Teacher tips</strong></p><ul><li>Remind children to tag or wink gently — no pushing.</li><li>Keep rounds short and celebrate big, clear choices.</li><li>Use simple stop/go cues the class already knows.</li></ul><p><strong>Make it easier</strong></p><p>Teacher models first; children copy as a whole group before trying in pairs.</p><p><strong>Make it harder</strong></p><p>Add a second cue (speed, size or emotion) once the basic game is secure.</p>',
    updated_at = NOW()
WHERE id = '93ecc27c-7105-41c9-b950-43c605fb6db5';

-- Emotion Statues
UPDATE activities
SET description = '<p>Let''s play Emotion Statues. Teacher calls out emotions (happy, scared, angry, excited).</p><p><strong>Why it works</strong></p><ul><li>Develops emotional literacy</li><li>Teaches body language</li><li>Entry point to role play</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. Props: hat and emotion slips. About 10 minutes.</p><p><strong>How to play</strong></p><ol><li>Teacher calls out emotions (happy, scared, angry, excited)</li><li>Children freeze in full-body ''statue'' showing that feeling</li></ol><p><strong>Teacher tips</strong></p><ul><li>Use a clear freeze signal (clap, word or drum) and hold stillness for a count of three.</li><li>Keep rounds short and celebrate big, clear choices.</li><li>Use simple stop/go cues the class already knows.</li></ul><p><strong>Make it easier</strong></p><p>Teacher models first; children copy as a whole group before trying in pairs.</p><p><strong>Make it harder</strong></p><p>Add a second cue (speed, size or emotion) once the basic game is secure.</p><p><strong>Extension</strong></p><p>Link to a story book face or feeling word of the day.</p>',
    updated_at = NOW()
WHERE id = '1be62bd5-87b0-46d8-b963-38c825d509ea';

-- Invisible Ball Pass
UPDATE activities
SET description = '<p>Let''s play Invisible Ball Pass. Stand in circle pretending to pass balls of different sizes, weights and textures.</p><p><strong>Why it works</strong></p><ul><li>Develops mime and group interaction</li><li>Builds sensory imagination</li><li>Foundation for object work</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear space so the class can sit or stand in a circle. No props needed. About 10 minutes.</p><p><strong>How to play</strong></p><ol><li>Stand in circle pretending to pass balls of different sizes, weights and textures</li><li>Name the object (''heavy watermelon'', ''hot potato'') and respond physically</li></ol><p><strong>Teacher tips</strong></p><ul><li>Keep the circle tight enough that everyone can see and hear.</li><li>Keep rounds short and celebrate big, clear choices.</li><li>Use simple stop/go cues the class already knows.</li></ul><p><strong>Make it easier</strong></p><p>Teacher models first; children copy as a whole group before trying in pairs.</p><p><strong>Make it harder</strong></p><p>Demand clearer weight, size and texture so the audience can ''see'' the object.</p>',
    updated_at = NOW()
WHERE id = 'a38af99a-42f9-47ec-ba8c-acaf011b652b';

-- Name and Move
UPDATE activities
SET description = '<p>Let''s play Name and Move. In circle, each child says their name with a unique movement.</p><p><strong>Why it works</strong></p><ul><li>Builds confidence and memory</li><li>Supports coordination development</li><li>Perfect for icebreakers and community building</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear space so the class can sit or stand in a circle. No props needed. About 10 minutes.</p><p><strong>How to play</strong></p><ol><li>In circle, each child says their name with a unique movement</li><li>Group repeats the name and movement back</li></ol><p><strong>Teacher tips</strong></p><ul><li>Keep the circle tight enough that everyone can see and hear.</li><li>Keep rounds short and celebrate big, clear choices.</li><li>Use simple stop/go cues the class already knows.</li></ul><p><strong>Make it easier</strong></p><p>Teacher models first; children copy as a whole group before trying in pairs.</p><p><strong>Make it harder</strong></p><p>Add a second cue (speed, size or emotion) once the basic game is secure.</p>',
    updated_at = NOW()
WHERE id = 'be96199e-2319-4166-b256-bbec918cc3a6';

-- Magic Box
UPDATE activities
SET description = '<p>Let''s play Magic Box. Place imaginary box in centre.</p><p><strong>Why it works</strong></p><ul><li>Develops creative thinking and mime</li><li>Opens pathway to prop use</li><li>Encourages object-based storytelling</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. No props needed. About 10 minutes.</p><p><strong>How to play</strong></p><ol><li>Place imaginary box in centre</li><li>Each child takes turn reaching in, pulling out pretend object and showing (not telling) what it is through mime</li></ol><p><strong>Teacher tips</strong></p><ul><li>Keep rounds short and celebrate big, clear choices.</li><li>Use simple stop/go cues the class already knows.</li></ul><p><strong>Make it easier</strong></p><p>Teacher models first; children copy as a whole group before trying in pairs.</p><p><strong>Make it harder</strong></p><p>Demand clearer weight, size and texture so the audience can ''see'' the object.</p>',
    updated_at = NOW()
WHERE id = '8ba5342b-ef12-443c-88b4-1c5321522a68';

-- Follow the Leader Action Parade
UPDATE activities
SET description = '<p>Let''s play Follow the Leader Action Parade. One child leads line or circle walk while performing simple actions (clapping, hopping).</p><p><strong>Why it works</strong></p><ul><li>Develops listening and rhythm</li><li>Encourages leadership and coordination</li><li>Builds group cohesion</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear space so the class can sit or stand in a circle. No props needed. About 10 minutes.</p><p><strong>How to play</strong></p><ol><li>Bring the class into a circle so everyone can see and hear.</li><li>One child leads line or circle walk while performing simple actions (clapping, hopping). Others follow. Switch leaders often.</li><li>Swap roles or rotate turns so everyone leads at least once.</li></ol><p><strong>Teacher tips</strong></p><ul><li>Keep the circle tight enough that everyone can see and hear.</li><li>Keep rounds short and celebrate big, clear choices.</li><li>Use simple stop/go cues the class already knows.</li></ul><p><strong>Make it easier</strong></p><p>Teacher models first; children copy as a whole group before trying in pairs.</p><p><strong>Make it harder</strong></p><p>Add a second cue (speed, size or emotion) once the basic game is secure.</p>',
    updated_at = NOW()
WHERE id = '1f4e2bb9-74f4-4d5b-8a40-d6b7e357e46e';

-- Balloon Balance
UPDATE activities
SET description = '<p>Let''s play Balloon Balance. Children imagine balancing invisible balloon on different body parts (head, hand, shoulder).</p><p><strong>Why it works</strong></p><ul><li>Encourages body control and balance</li><li>Develops imagination and precision</li><li>Supports spatial awareness</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. No props needed. About 10 minutes.</p><p><strong>How to play</strong></p><ol><li>Children imagine balancing invisible balloon on different body parts (head, hand, shoulder)</li><li>Change size and weight of balloon</li></ol><p><strong>Teacher tips</strong></p><ul><li>Keep rounds short and celebrate big, clear choices.</li><li>Use simple stop/go cues the class already knows.</li></ul><p><strong>Make it easier</strong></p><p>Teacher models first; children copy as a whole group before trying in pairs.</p><p><strong>Make it harder</strong></p><p>Demand clearer weight, size and texture so the audience can ''see'' the object.</p>',
    updated_at = NOW()
WHERE id = '59c7ad6e-921d-4062-ad1c-a22325620eaf';

-- Sound Journey
UPDATE activities
SET description = '<p>Let''s play Sound Journey. Teacher narrates simple journey (through forest) and children use voice and body to create accompanying sounds (birds, crunching leaves, thunder).</p><p><strong>Why it works</strong></p><ul><li>Develops listening and environmental storytelling</li><li>Builds vocal control</li><li>Prepares for soundscape work</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. No props needed. About 15 minutes.</p><p><strong>How to play</strong></p><ol><li>Gather attention and explain the game in one short sentence.</li><li>Teacher narrates simple journey (through forest) and children use voice and body to create accompanying sounds (birds, crunching leaves, thunder).</li><li>Repeat once or twice, celebrating clear choices, then stop while energy is still high.</li></ol><p><strong>Teacher tips</strong></p><ul><li>Keep rounds short and celebrate big, clear choices.</li><li>Use simple stop/go cues the class already knows.</li></ul><p><strong>Make it easier</strong></p><p>Teacher models first; children copy as a whole group before trying in pairs.</p><p><strong>Make it harder</strong></p><p>Layer dynamics (loud/soft, near/far) and keep a shared pulse.</p>',
    updated_at = NOW()
WHERE id = '08c6a359-0003-419b-b15e-9f42488411eb';

-- Shape Monsters
UPDATE activities
SET description = '<p>Let''s play Shape Monsters. Call out simple shapes (triangle, circle).</p><p><strong>Why it works</strong></p><ul><li>Combines geometry with movement</li><li>Develops physical awareness</li><li>Cross-curricular drama for shape units</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear space so the class can sit or stand in a circle. No props needed. About 10 minutes.</p><p><strong>How to play</strong></p><ol><li>Call out simple shapes (triangle, circle)</li><li>Children form them with bodies or with others</li><li>Add fun like ''Triangle Monster!'' with monster actions</li></ol><p><strong>Teacher tips</strong></p><ul><li>Keep the circle tight enough that everyone can see and hear.</li><li>Keep rounds short and celebrate big, clear choices.</li><li>Use simple stop/go cues the class already knows.</li></ul><p><strong>Make it easier</strong></p><p>Teacher models first; children copy as a whole group before trying in pairs.</p><p><strong>Make it harder</strong></p><p>Add a second cue (speed, size or emotion) once the basic game is secure.</p>',
    updated_at = NOW()
WHERE id = '756900c7-8c7c-469c-a087-49955b01c9e8';

-- Change the Weather
UPDATE activities
SET description = '<p>Let''s play Change the Weather. Teacher calls weather scenarios (''icy'', ''thunderstorm'', ''sunny'') and children move around space reacting physically and vocally.</p><p><strong>Why it works</strong></p><ul><li>Develops physical expression</li><li>Encourages sensory exploration</li><li>Helps embody different environments</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Open floor space with clear pathways. No props needed. About 10 minutes.</p><p><strong>How to play</strong></p><ol><li>Gather attention and explain the game in one short sentence.</li><li>Teacher calls weather scenarios (''icy'', ''thunderstorm'', ''sunny'') and children move around space reacting physically and vocally.</li><li>Repeat once or twice, celebrating clear choices, then stop while energy is still high.</li></ol><p><strong>Teacher tips</strong></p><ul><li>Keep rounds short and celebrate big, clear choices.</li><li>Use simple stop/go cues the class already knows.</li></ul><p><strong>Make it easier</strong></p><p>Teacher models first; children copy as a whole group before trying in pairs.</p><p><strong>Make it harder</strong></p><p>Add a second cue (speed, size or emotion) once the basic game is secure.</p>',
    updated_at = NOW()
WHERE id = '3908956c-f3a4-4994-a5c0-cd3d25bb3c43';

-- Find a Friend Matching
UPDATE activities
SET description = '<p>Let''s play Find a Friend Matching. Call matching prompts like ''Find a friend who wears red'' or ''Find a friend who likes bananas''.</p><p><strong>Why it works</strong></p><ul><li>Develops social skills and observation</li><li>Encourages communication</li><li>Non-verbal interaction warm-up</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space. Children work in pairs. No props needed. About 10 minutes.</p><p><strong>How to play</strong></p><ol><li>Ask the class to find a partner and face each other with a little space around them.</li><li>Call matching prompts like ''Find a friend who wears red'' or ''Find a friend who likes bananas''. Children pair up quickly.</li><li>Repeat once or twice, celebrating clear choices, then stop while energy is still high.</li></ol><p><strong>Teacher tips</strong></p><ul><li>Keep rounds short and celebrate big, clear choices.</li><li>Use simple stop/go cues the class already knows.</li></ul><p><strong>Make it easier</strong></p><p>Teacher models first; children copy as a whole group before trying in pairs.</p><p><strong>Make it harder</strong></p><p>Add a second cue (speed, size or emotion) once the basic game is secure.</p>',
    updated_at = NOW()
WHERE id = 'd7f9c7c9-ce68-4cca-bf14-dbc07dee7f4d';

-- Ribbon of Sound
UPDATE activities
SET description = '<p>Let''s play Ribbon of Sound. Children stand in circle.</p><p><strong>Why it works</strong></p><ul><li>Builds listening and vocal exploration</li><li>Develops ensemble awareness</li><li>Encourages sequencing</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear space so the class can sit or stand in a circle. No props needed. About 10 minutes.</p><p><strong>How to play</strong></p><ol><li>Children stand in circle</li><li>One makes a sound, next echoes it, sound travels around. Then new sound begins</li></ol><p><strong>Teacher tips</strong></p><ul><li>Keep the circle tight enough that everyone can see and hear.</li><li>Keep rounds short and celebrate big, clear choices.</li><li>Use simple stop/go cues the class already knows.</li></ul><p><strong>Make it easier</strong></p><p>Teacher models first; children copy as a whole group before trying in pairs.</p><p><strong>Make it harder</strong></p><p>Layer dynamics (loud/soft, near/far) and keep a shared pulse.</p>',
    updated_at = NOW()
WHERE id = '2b7a3e1b-8297-46ca-825e-932f0cc26d11';

-- Popcorn Pop
UPDATE activities
SET description = '<p>Let''s play Popcorn Pop. Children squat as ''corn kernels''.</p><p><strong>Why it works</strong></p><ul><li>Builds energy control and group timing</li><li>Develops expressive movement</li><li>Fun way to build group rhythm</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. No props needed. About 10 minutes.</p><p><strong>How to play</strong></p><ol><li>Children squat as ''corn kernels''</li><li>As pretend heat builds, they gradually ''pop'' up and clap like popcorn popping</li></ol><p><strong>Teacher tips</strong></p><ul><li>Keep rounds short and celebrate big, clear choices.</li><li>Use simple stop/go cues the class already knows.</li></ul><p><strong>Make it easier</strong></p><p>Teacher models first; children copy as a whole group before trying in pairs.</p><p><strong>Make it harder</strong></p><p>Add a second cue (speed, size or emotion) once the basic game is secure.</p>',
    updated_at = NOW()
WHERE id = '7590d52f-c372-4795-9598-45b8b5c4eaec';

-- Bubblegum Stretch
UPDATE activities
SET description = '<p>Let''s play Bubblegum Stretch. Children mime chewing bubblegum that stretches out as it grows.</p><p><strong>Why it works</strong></p><ul><li>Develops mime and facial expression</li><li>Encourages playful exaggeration</li><li>Classic warm-up for creative expression</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. No props needed. About 10 minutes.</p><p><strong>How to play</strong></p><ol><li>Children mime chewing bubblegum that stretches out as it grows</li><li>Add sound effects and big exaggeration</li></ol><p><strong>Teacher tips</strong></p><ul><li>Keep rounds short and celebrate big, clear choices.</li><li>Use simple stop/go cues the class already knows.</li></ul><p><strong>Make it easier</strong></p><p>Teacher models first; children copy as a whole group before trying in pairs.</p><p><strong>Make it harder</strong></p><p>Layer dynamics (loud/soft, near/far) and keep a shared pulse.</p>',
    updated_at = NOW()
WHERE id = 'dbaff0c4-9ece-43b3-8533-a77a97c5e392';

-- Wrong Words
UPDATE activities
SET description = '<p>Let''s play Wrong Words. Teacher points to object and children must say unrelated word (pointing at chair, saying ''sandwich'').</p><p><strong>Why it works</strong></p><ul><li>Loosens verbal thinking</li><li>Encourages creative connections</li><li>Develops spontaneity and vocabulary flexibility</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. Props: chairs. About 10 minutes.</p><p><strong>How to play</strong></p><ol><li>Gather attention and explain the game in one short sentence.</li><li>Teacher points to object and children must say unrelated word (pointing at chair, saying ''sandwich'').</li><li>Repeat once or twice, celebrating clear choices, then stop while energy is still high.</li></ol><p><strong>Teacher tips</strong></p><ul><li>Keep rounds short and celebrate big, clear choices.</li><li>Use simple stop/go cues the class already knows.</li></ul><p><strong>Make it easier</strong></p><p>Teacher models first; children copy as a whole group before trying in pairs.</p><p><strong>Make it harder</strong></p><p>Add a second cue (speed, size or emotion) once the basic game is secure.</p>',
    updated_at = NOW()
WHERE id = '08f2b705-2061-4b7b-bdac-53af423f8734';

-- Tongue Twisters Fun
UPDATE activities
SET description = '<p>Let''s play Tongue Twisters Fun. Children try tongue twisters like ''Red lorry, yellow lorry'', exaggerating speed and clarity as whole-group echo.</p><p><strong>Why it works</strong></p><ul><li>Supports speech development</li><li>Develops articulation and phonics</li><li>Adds playful language challenge</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. Whole class. No props needed. About 10 minutes.</p><p><strong>How to play</strong></p><ol><li>Gather attention and explain the game in one short sentence.</li><li>Children try tongue twisters like ''Red lorry, yellow lorry'', exaggerating speed and clarity as whole-group echo.</li><li>Repeat once or twice, celebrating clear choices, then stop while energy is still high.</li></ol><p><strong>Teacher tips</strong></p><ul><li>Keep rounds short and celebrate big, clear choices.</li><li>Use simple stop/go cues the class already knows.</li></ul><p><strong>Make it easier</strong></p><p>Teacher models first; children copy as a whole group before trying in pairs.</p><p><strong>Make it harder</strong></p><p>Add a second cue (speed, size or emotion) once the basic game is secure.</p>',
    updated_at = NOW()
WHERE id = 'a00346de-23b8-469b-9fc4-16ce8d3c75ae';

-- Traffic Lights Walk
UPDATE activities
SET description = '<p>Let''s play Traffic Lights Walk. Children walk around.</p><p><strong>Why it works</strong></p><ul><li>Builds listening and body control</li><li>Develops adaptability</li><li>Excellent for impulse control</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Open floor space with clear pathways. No props needed. About 10 minutes.</p><p><strong>How to play</strong></p><ol><li>Children walk around</li><li>On ''Red'' freeze, ''Amber'' walk slowly, ''Green'' walk normally</li><li>Then switch colours (green means freeze)</li></ol><p><strong>Teacher tips</strong></p><ul><li>Use a clear freeze signal (clap, word or drum) and hold stillness for a count of three.</li><li>Keep rounds short and celebrate big, clear choices.</li><li>Use simple stop/go cues the class already knows.</li></ul><p><strong>Make it easier</strong></p><p>Teacher models first; children copy as a whole group before trying in pairs.</p><p><strong>Make it harder</strong></p><p>Add a second cue (speed, size or emotion) once the basic game is secure.</p>',
    updated_at = NOW()
WHERE id = 'fd8b5723-89c5-401d-82f5-0b579de38e57';

-- Firing Line Word Snap
UPDATE activities
SET description = '<p>Let''s play Firing Line Word Snap. In small groups, one child is ''Goalie''.</p><p><strong>Why it works</strong></p><ul><li>Sharpens language fluency</li><li>Develops verbal association</li><li>Builds quick thinking</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Open floor space. Work in small groups. No props needed. About 10 minutes.</p><p><strong>How to play</strong></p><ol><li>In small groups, one child is ''Goalie''. Others ''fire'' words (e.g</li><li>''ocean'') and goalie responds quickly with associated word (e.g. ''fish'')</li></ol><p><strong>Teacher tips</strong></p><ul><li>Keep rounds short and celebrate big, clear choices.</li><li>Use simple stop/go cues the class already knows.</li></ul><p><strong>Make it easier</strong></p><p>Teacher models first; children copy as a whole group before trying in pairs.</p><p><strong>Make it harder</strong></p><p>Add a second cue (speed, size or emotion) once the basic game is secure.</p>',
    updated_at = NOW()
WHERE id = 'a498f2a2-e549-4f26-9083-9ee86c8e1eb8';

-- Cloud Sculptures
UPDATE activities
SET description = '<p>Let''s play Cloud Sculptures. Form ''cloud'' shapes with bodies; freeze when music stops.</p><p><strong>Why it works</strong></p><ul><li>Promotes creativity and group mirroring</li><li>Develops spatial awareness</li><li>Links to weather topics</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. Props: optional music player. About 10 minutes.</p><p><strong>How to play</strong></p><ol><li>Form ''cloud'' shapes with bodies; freeze when music stops</li><li>Explore different cloud types (fluffy, stormy, wispy)</li></ol><p><strong>Teacher tips</strong></p><ul><li>Use a clear freeze signal (clap, word or drum) and hold stillness for a count of three.</li><li>Keep tracks short so you can reset energy quickly.</li><li>Keep rounds short and celebrate big, clear choices.</li></ul><p><strong>Make it easier</strong></p><p>Teacher models first; children copy as a whole group before trying in pairs.</p><p><strong>Make it harder</strong></p><p>Add a second cue (speed, size or emotion) once the basic game is secure.</p>',
    updated_at = NOW()
WHERE id = 'fae9df2c-fe37-41be-9fea-273d0a7923e5';

-- Parade of Animals
UPDATE activities
SET description = '<p>Let''s play Parade of Animals. On call, children walk and sound like animals, pausing and changing on cues.</p><p><strong>Why it works</strong></p><ul><li>Enhances character play</li><li>Develops animal knowledge</li><li>Builds movement vocabulary</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. No props needed. About 15 minutes.</p><p><strong>How to play</strong></p><ol><li>On call, children walk and sound like animals, pausing and changing on cues</li><li>Include farm animals, zoo animals, pets</li></ol><p><strong>Teacher tips</strong></p><ul><li>Keep rounds short and celebrate big, clear choices.</li><li>Use simple stop/go cues the class already knows.</li></ul><p><strong>Make it easier</strong></p><p>Teacher models first; children copy as a whole group before trying in pairs.</p><p><strong>Make it harder</strong></p><p>Layer dynamics (loud/soft, near/far) and keep a shared pulse.</p><p><strong>Extension</strong></p><p>Choose animals from a class topic or story.</p>',
    updated_at = NOW()
WHERE id = '507b0b0d-cc2a-4add-aba6-9529b0b0068d';

-- Silent Orchestra
UPDATE activities
SET description = '<p>Let''s play Silent Orchestra. Children act as musical instruments using body sounds.</p><p><strong>Why it works</strong></p><ul><li>Builds ensemble and creative noise</li><li>Develops rhythm awareness</li><li>Introduces musical concepts</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. Props: optional music player. About 15 minutes.</p><p><strong>How to play</strong></p><ol><li>Children act as musical instruments using body sounds</li><li>Include conductor cues for loud/soft, fast/slow</li></ol><p><strong>Teacher tips</strong></p><ul><li>Keep tracks short so you can reset energy quickly.</li><li>Keep rounds short and celebrate big, clear choices.</li><li>Use simple stop/go cues the class already knows.</li></ul><p><strong>Make it easier</strong></p><p>Teacher models first; children copy as a whole group before trying in pairs.</p><p><strong>Make it harder</strong></p><p>Layer dynamics (loud/soft, near/far) and keep a shared pulse.</p>',
    updated_at = NOW()
WHERE id = 'cdbd006b-ce55-4c7e-9ed2-692a0bf2e8b3';

-- Giant Steps
UPDATE activities
SET description = '<p>Let''s play Giant Steps. Walk as if huge (giant), then shrink to tiny.</p><p><strong>Why it works</strong></p><ul><li>Teaches size awareness and expressive pacing</li><li>Develops control and imagination</li><li>Links to fairy tale themes</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. No props needed. About 10 minutes.</p><p><strong>How to play</strong></p><ol><li>Walk as if huge (giant), then shrink to tiny</li><li>Explore different sizes and weights of movement</li></ol><p><strong>Teacher tips</strong></p><ul><li>Keep rounds short and celebrate big, clear choices.</li><li>Use simple stop/go cues the class already knows.</li></ul><p><strong>Make it easier</strong></p><p>Teacher models first; children copy as a whole group before trying in pairs.</p><p><strong>Make it harder</strong></p><p>Add a second cue (speed, size or emotion) once the basic game is secure.</p>',
    updated_at = NOW()
WHERE id = '2cf7eb01-b132-4326-a375-265f189b6fdc';

-- Emotion Walks
UPDATE activities
SET description = '<p>Let''s play Emotion Walks. Walk like feeling an emotion in motion (''angry stomp'' or ''happy skip'').</p><p><strong>Why it works</strong></p><ul><li>Encourages emotive movement</li><li>Builds emotional vocabulary</li><li>Links feelings to physicality</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. No props needed. About 10 minutes.</p><p><strong>How to play</strong></p><ol><li>Walk like feeling an emotion in motion (''angry stomp'' or ''happy skip'')</li><li>Explore how emotions affect movement</li></ol><p><strong>Teacher tips</strong></p><ul><li>Keep rounds short and celebrate big, clear choices.</li><li>Use simple stop/go cues the class already knows.</li></ul><p><strong>Make it easier</strong></p><p>Teacher models first; children copy as a whole group before trying in pairs.</p><p><strong>Make it harder</strong></p><p>Add a second cue (speed, size or emotion) once the basic game is secure.</p><p><strong>Extension</strong></p><p>Link to a story book face or feeling word of the day.</p>',
    updated_at = NOW()
WHERE id = '1d50693d-99a1-44a4-8aa6-275e049c6706';

-- Statue Freeze Tag
UPDATE activities
SET description = '<p>Let''s play Statue Freeze Tag. Taggers freeze others who must hold statue poses until unfrozen.</p><p><strong>Why it works</strong></p><ul><li>Builds control and fun engagement</li><li>Combines movement with stillness</li><li>Develops creative posing</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. No props needed. About 15 minutes.</p><p><strong>How to play</strong></p><ol><li>Taggers freeze others who must hold statue poses until unfrozen</li><li>Add themes like ''animal statues'' or ''happy statues''</li></ol><p><strong>Teacher tips</strong></p><ul><li>Use a clear freeze signal (clap, word or drum) and hold stillness for a count of three.</li><li>Remind children to tag or wink gently — no pushing.</li><li>Keep rounds short and celebrate big, clear choices.</li></ul><p><strong>Make it easier</strong></p><p>Teacher models first; children copy as a whole group before trying in pairs.</p><p><strong>Make it harder</strong></p><p>Add a second cue (speed, size or emotion) once the basic game is secure.</p><p><strong>Extension</strong></p><p>Choose animals from a class topic or story.</p>',
    updated_at = NOW()
WHERE id = '2f453d22-ebbc-4c5f-b575-9f0f844589c2';

-- Story Circles
UPDATE activities
SET description = '<p>Let''s play Story Circles. Children sit in circle and mime story episodes.</p><p><strong>Why it works</strong></p><ul><li>Bridges nonverbal and verbal storytelling</li><li>Develops narrative sequence</li><li>Builds story comprehension</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear space so the class can sit or stand in a circle. No props needed. About 20 minutes.</p><p><strong>How to play</strong></p><ol><li>Children sit in circle and mime story episodes</li><li>After each segment, they verbally name what happened</li></ol><p><strong>Teacher tips</strong></p><ul><li>Keep the circle tight enough that everyone can see and hear.</li><li>Keep rounds short and celebrate big, clear choices.</li><li>Use simple stop/go cues the class already knows.</li></ul><p><strong>Make it easier</strong></p><p>Teacher models first; children copy as a whole group before trying in pairs.</p><p><strong>Make it harder</strong></p><p>Require a clear beginning, middle and end within the time limit.</p>',
    updated_at = NOW()
WHERE id = 'd04153e0-c208-4f53-a727-e514d04e7042';

-- Magic Mirror
UPDATE activities
SET description = '<p>Let''s play Magic Mirror. Children pretend to look into mirror and mimic facial expressions made by teacher or peer.</p><p><strong>Why it works</strong></p><ul><li>Builds facial awareness and empathy</li><li>Develops observation skills</li><li>Introduces reflection concepts</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. No props needed. About 10 minutes.</p><p><strong>How to play</strong></p><ol><li>Gather attention and explain the game in one short sentence.</li><li>Children pretend to look into mirror and mimic facial expressions made by teacher or peer.</li><li>Repeat once or twice, celebrating clear choices, then stop while energy is still high.</li></ol><p><strong>Teacher tips</strong></p><ul><li>Keep rounds short and celebrate big, clear choices.</li><li>Use simple stop/go cues the class already knows.</li></ul><p><strong>Make it easier</strong></p><p>Teacher models first; children copy as a whole group before trying in pairs.</p><p><strong>Make it harder</strong></p><p>Add a second cue (speed, size or emotion) once the basic game is secure.</p>',
    updated_at = NOW()
WHERE id = 'b073d141-1b36-468e-a022-6acbf8512b69';

-- Shadow Puppets
UPDATE activities
SET description = '<p>Let''s play Shadow Puppets. Use hands to create animal shapes; group creates a shadow story together.</p><p><strong>Why it works</strong></p><ul><li>Supports storytelling and fine motor coordination</li><li>Develops creativity and narrative</li><li>Introduces shadow play concepts</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. Whole class. Props: simple puppets (socks or paper bags). About 15 minutes.</p><p><strong>How to play</strong></p><ol><li>Gather attention and explain the game in one short sentence.</li><li>Use hands to create animal shapes; group creates a shadow story together.</li><li>Repeat once or twice, celebrating clear choices, then stop while energy is still high.</li></ol><p><strong>Teacher tips</strong></p><ul><li>Keep rounds short and celebrate big, clear choices.</li><li>Use simple stop/go cues the class already knows.</li></ul><p><strong>Make it easier</strong></p><p>Teacher models first; children copy as a whole group before trying in pairs.</p><p><strong>Make it harder</strong></p><p>Require a clear beginning, middle and end within the time limit.</p><p><strong>Extension</strong></p><p>Choose animals from a class topic or story.</p>',
    updated_at = NOW()
WHERE id = 'de997bb1-0c0d-4c5e-9278-e7354af81786';

-- Emotion Telephone
UPDATE activities
SET description = '<p>Let''s play Emotion Telephone. Children whisper an emotion around circle; final child acts it out physically.</p><p><strong>Why it works</strong></p><ul><li>Combines listening memory and emotional expression</li><li>Develops emotional vocabulary</li><li>Builds group attention</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear space so the class can sit or stand in a circle. No props needed. About 10 minutes.</p><p><strong>How to play</strong></p><ol><li>Bring the class into a circle so everyone can see and hear.</li><li>Children whisper an emotion around circle; final child acts it out physically.</li><li>Repeat once or twice, celebrating clear choices, then stop while energy is still high.</li></ol><p><strong>Teacher tips</strong></p><ul><li>Keep the circle tight enough that everyone can see and hear.</li><li>Keep rounds short and celebrate big, clear choices.</li><li>Use simple stop/go cues the class already knows.</li></ul><p><strong>Make it easier</strong></p><p>Teacher models first; children copy as a whole group before trying in pairs.</p><p><strong>Make it harder</strong></p><p>Add a second cue (speed, size or emotion) once the basic game is secure.</p><p><strong>Extension</strong></p><p>Link to a story book face or feeling word of the day.</p>',
    updated_at = NOW()
WHERE id = '384b21f8-def6-4d2c-8195-35a7c9eb3e97';

-- Balloon Bounce
UPDATE activities
SET description = '<p>Let''s play Balloon Bounce. Mime passing an imaginary balloon that gets bigger/smaller, heavier/lighter.</p><p><strong>Why it works</strong></p><ul><li>Builds awareness of force and spatial timing</li><li>Develops mime skills</li><li>Encourages group coordination</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. No props needed. About 10 minutes.</p><p><strong>How to play</strong></p><ol><li>Gather attention and explain the game in one short sentence.</li><li>Mime passing an imaginary balloon that gets bigger/smaller, heavier/lighter.</li><li>Repeat once or twice, celebrating clear choices, then stop while energy is still high.</li></ol><p><strong>Teacher tips</strong></p><ul><li>Keep the circle tight enough that everyone can see and hear.</li><li>Keep rounds short and celebrate big, clear choices.</li><li>Use simple stop/go cues the class already knows.</li></ul><p><strong>Make it easier</strong></p><p>Teacher models first; children copy as a whole group before trying in pairs.</p><p><strong>Make it harder</strong></p><p>Demand clearer weight, size and texture so the audience can ''see'' the object.</p>',
    updated_at = NOW()
WHERE id = 'd579a5e8-39c9-4b29-980d-f5f64d7e1184';

-- Jump & Freeze
UPDATE activities
SET description = '<p>Let''s play Jump &amp; Freeze. On teacher cue, children jump and freeze mid-air in different poses.</p><p><strong>Why it works</strong></p><ul><li>Develops timing and physical control</li><li>Builds body awareness</li><li>Fun energy activity</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. No props needed. About 10 minutes.</p><p><strong>How to play</strong></p><ol><li>Gather attention and explain the game in one short sentence.</li><li>On teacher cue, children jump and freeze mid-air in different poses.</li><li>Use a clear freeze cue; hold the picture, then relax and reset.</li></ol><p><strong>Teacher tips</strong></p><ul><li>Use a clear freeze signal (clap, word or drum) and hold stillness for a count of three.</li><li>Keep rounds short and celebrate big, clear choices.</li><li>Use simple stop/go cues the class already knows.</li></ul><p><strong>Make it easier</strong></p><p>Teacher models first; children copy as a whole group before trying in pairs.</p><p><strong>Make it harder</strong></p><p>Add a second cue (speed, size or emotion) once the basic game is secure.</p>',
    updated_at = NOW()
WHERE id = 'a096dabc-4733-4087-be74-ca6079f02033';

-- Weather Walk
UPDATE activities
SET description = '<p>Let''s play Weather Walk. Walk like wind, rain, sun, snow etc., using body, face, voice to embody weather.</p><p><strong>Why it works</strong></p><ul><li>Builds sensory drama awareness</li><li>Links to weather topics</li><li>Develops expressive movement</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. No props needed. About 10 minutes.</p><p><strong>How to play</strong></p><ol><li>Gather attention and explain the game in one short sentence.</li><li>Walk like wind, rain, sun, snow etc., using body, face, voice to embody weather.</li><li>Repeat once or twice, celebrating clear choices, then stop while energy is still high.</li></ol><p><strong>Teacher tips</strong></p><ul><li>Keep rounds short and celebrate big, clear choices.</li><li>Use simple stop/go cues the class already knows.</li></ul><p><strong>Make it easier</strong></p><p>Teacher models first; children copy as a whole group before trying in pairs.</p><p><strong>Make it harder</strong></p><p>Add a second cue (speed, size or emotion) once the basic game is secure.</p>',
    updated_at = NOW()
WHERE id = 'bc7b4e97-1bad-4573-91df-72109c1db745';

-- Good Elf, Bad Elf
UPDATE activities
SET description = '<p>Let''s play Good Elf, Bad Elf. Mime helpful vs mischievous characters on cue.</p><p><strong>Why it works</strong></p><ul><li>Encourages rapid role shifts</li><li>Builds character awareness</li><li>Develops bright energy</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. No props needed. About 10 minutes.</p><p><strong>How to play</strong></p><ol><li>Mime helpful vs mischievous characters on cue</li><li>Explore contrasting character types</li></ol><p><strong>Teacher tips</strong></p><ul><li>Keep rounds short and celebrate big, clear choices.</li><li>Use simple stop/go cues the class already knows.</li></ul><p><strong>Make it easier</strong></p><p>Teacher models first; children copy as a whole group before trying in pairs.</p><p><strong>Make it harder</strong></p><p>Demand clearer weight, size and texture so the audience can ''see'' the object.</p>',
    updated_at = NOW()
WHERE id = '239f2747-4fc8-4a92-b10c-5c91bd7d1aa3';

-- Musical Boxes
UPDATE activities
SET description = '<p>Let''s play Musical Boxes. Circle passes invisible ''music box'' with sound and movement.</p><p><strong>Why it works</strong></p><ul><li>Builds group memory and coordination</li><li>Develops musical imagination</li><li>Encourages creativity</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear space so the class can sit or stand in a circle. No props needed. About 15 minutes.</p><p><strong>How to play</strong></p><ol><li>Circle passes invisible ''music box'' with sound and movement</li><li>Each child adds their own musical element</li></ol><p><strong>Teacher tips</strong></p><ul><li>Keep the circle tight enough that everyone can see and hear.</li><li>Keep rounds short and celebrate big, clear choices.</li><li>Use simple stop/go cues the class already knows.</li></ul><p><strong>Make it easier</strong></p><p>Teacher models first; children copy as a whole group before trying in pairs.</p><p><strong>Make it harder</strong></p><p>Layer dynamics (loud/soft, near/far) and keep a shared pulse.</p>',
    updated_at = NOW()
WHERE id = '4e1f4e34-a08d-42dc-bcbe-164f048dcd16';

-- Colour Walk
UPDATE activities
SET description = '<p>Let''s play Colour Walk. Move to different corners based on called colours; add gestures or sounds for each colour.</p><p><strong>Why it works</strong></p><ul><li>Encourages listening and group movement</li><li>Links colours to actions</li><li>Develops spatial awareness</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. No props needed. About 10 minutes.</p><p><strong>How to play</strong></p><ol><li>Gather attention and explain the game in one short sentence.</li><li>Move to different corners based on called colours; add gestures or sounds for each colour.</li><li>Repeat once or twice, celebrating clear choices, then stop while energy is still high.</li></ol><p><strong>Teacher tips</strong></p><ul><li>Keep rounds short and celebrate big, clear choices.</li><li>Use simple stop/go cues the class already knows.</li></ul><p><strong>Make it easier</strong></p><p>Teacher models first; children copy as a whole group before trying in pairs.</p><p><strong>Make it harder</strong></p><p>Layer dynamics (loud/soft, near/far) and keep a shared pulse.</p>',
    updated_at = NOW()
WHERE id = '59e908e3-6b23-4789-92df-39b8e79c63f8';

-- Crocodile Smile
UPDATE activities
SET description = '<p>Let''s play Crocodile Smile. Children show big toothy smiles, then freeze statue.</p><p><strong>Why it works</strong></p><ul><li>Builds facial motor control and playfulness</li><li>Develops expression awareness</li><li>Fun warm-up activity</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. No props needed. About 10 minutes.</p><p><strong>How to play</strong></p><ol><li>Children show big toothy smiles, then freeze statue</li><li>Explore different facial expressions</li></ol><p><strong>Teacher tips</strong></p><ul><li>Use a clear freeze signal (clap, word or drum) and hold stillness for a count of three.</li><li>Keep rounds short and celebrate big, clear choices.</li><li>Use simple stop/go cues the class already knows.</li></ul><p><strong>Make it easier</strong></p><p>Teacher models first; children copy as a whole group before trying in pairs.</p><p><strong>Make it harder</strong></p><p>Add a second cue (speed, size or emotion) once the basic game is secure.</p>',
    updated_at = NOW()
WHERE id = 'c32836d6-ea4b-457f-8d06-4e1ac53b065c';

-- Slow Motion Slip
UPDATE activities
SET description = '<p>Let''s play Slow Motion Slip. Walk normally, then slowly add slow motion on signal; alternate fast and slow movement.</p><p><strong>Why it works</strong></p><ul><li>Teaches pace and control</li><li>Develops body awareness</li><li>Builds movement quality</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. No props needed. About 10 minutes.</p><p><strong>How to play</strong></p><ol><li>Gather attention and explain the game in one short sentence.</li><li>Walk normally, then slowly add slow motion on signal; alternate fast and slow movement.</li><li>Repeat once or twice, celebrating clear choices, then stop while energy is still high.</li></ol><p><strong>Teacher tips</strong></p><ul><li>Keep rounds short and celebrate big, clear choices.</li><li>Use simple stop/go cues the class already knows.</li></ul><p><strong>Make it easier</strong></p><p>Teacher models first; children copy as a whole group before trying in pairs.</p><p><strong>Make it harder</strong></p><p>Add a second cue (speed, size or emotion) once the basic game is secure.</p>',
    updated_at = NOW()
WHERE id = '9a04358a-9edd-43be-96f3-d3ca3cdd4c8a';

-- Thank You Wave
UPDATE activities
SET description = '<p>Let''s play Thank You Wave. Children pass waves and thank-you mimes around circle (bow, curtsey, handshake).</p><p><strong>Why it works</strong></p><ul><li>Ends session on pleasant ritual</li><li>Builds social awareness</li><li>Develops gratitude expression</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear space so the class can sit or stand in a circle. No props needed. About 10 minutes.</p><p><strong>How to play</strong></p><ol><li>Bring the class into a circle so everyone can see and hear.</li><li>Children pass waves and thank-you mimes around circle (bow, curtsey, handshake).</li><li>Repeat once or twice, celebrating clear choices, then stop while energy is still high.</li></ol><p><strong>Teacher tips</strong></p><ul><li>Keep the circle tight enough that everyone can see and hear.</li><li>Keep rounds short and celebrate big, clear choices.</li><li>Use simple stop/go cues the class already knows.</li></ul><p><strong>Make it easier</strong></p><p>Teacher models first; children copy as a whole group before trying in pairs.</p><p><strong>Make it harder</strong></p><p>Demand clearer weight, size and texture so the audience can ''see'' the object.</p>',
    updated_at = NOW()
WHERE id = '326e1f0b-da25-4bee-ab96-17ef81c3fea6';

-- Goodbye Mime
UPDATE activities
SET description = '<p>Let''s play Goodbye Mime. Each child in turn mimes wave or gesture saying goodbye.</p><p><strong>Why it works</strong></p><ul><li>Creates closure and respect</li><li>Builds social ritual awareness</li><li>Ends sessions positively</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. Whole class. No props needed. About 10 minutes.</p><p><strong>How to play</strong></p><ol><li>Each child in turn mimes wave or gesture saying goodbye</li><li>Create group farewell ritual</li></ol><p><strong>Teacher tips</strong></p><ul><li>Keep rounds short and celebrate big, clear choices.</li><li>Use simple stop/go cues the class already knows.</li></ul><p><strong>Make it easier</strong></p><p>Teacher models first; children copy as a whole group before trying in pairs.</p><p><strong>Make it harder</strong></p><p>Demand clearer weight, size and texture so the audience can ''see'' the object.</p>',
    updated_at = NOW()
WHERE id = 'f6609910-305f-4c43-859c-d0c1373d2abf';

-- Ten-Second Objects
UPDATE activities
SET description = '<p>Play Ten-Second Objects to get everyone listening and responding. Small groups (3-5 children) sculpt bodies into named object within 10 seconds using only mime.</p><p><strong>Why it works</strong></p><ul><li>Builds collaboration and body awareness</li><li>Develops creativity and group composition</li><li>Foundation for mime and tableau work</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Open floor space. Work in small groups. Groups of 3–5. No props needed. About 10 minutes.</p><p><strong>How to play</strong></p><ol><li>Organise the class into small groups and give them a clear playing space.</li><li>Small groups (3-5 children) sculpt bodies into named object within 10 seconds using only mime.</li><li>Play a second round with a fresh prompt, then share one strong moment with the class.</li></ol><p><strong>Teacher tips</strong></p><ul><li>Praise clear listening and inventive detail.</li><li>If energy spikes, freeze the group and restart from stillness.</li></ul><p><strong>Make it easier</strong></p><p>Reduce choices and model the first round together.</p><p><strong>Make it harder</strong></p><p>Demand clearer weight, size and texture so the audience can ''see'' the object.</p>',
    updated_at = NOW()
WHERE id = '1374a1c2-8844-4145-8b07-64d975790ebf';

-- 1-2-3 Action Count
UPDATE activities
SET description = '<p>Play 1-2-3 Action Count to get everyone listening and responding. Circle counts 1-2-3 in sequence; on ''1'' stamp, ''2'' clap, ''3'' jump.</p><p><strong>Why it works</strong></p><ul><li>Develops rhythm and teamwork</li><li>Builds coordination and ensemble focus</li><li>Excellent warm-up for group work</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear space so the class can sit or stand in a circle. No props needed. About 10 minutes.</p><p><strong>How to play</strong></p><ol><li>Circle counts 1-2-3 in sequence; on ''1'' stamp, ''2'' clap, ''3'' jump</li><li>Continue quickly building rhythm</li></ol><p><strong>Teacher tips</strong></p><ul><li>Keep the circle tight enough that everyone can see and hear.</li><li>Praise clear listening and inventive detail.</li><li>If energy spikes, freeze the group and restart from stillness.</li></ul><p><strong>Make it easier</strong></p><p>Reduce choices and model the first round together.</p><p><strong>Make it harder</strong></p><p>Add a time limit, a second rule, or ask pairs to share one polished moment.</p>',
    updated_at = NOW()
WHERE id = '380813ad-fc9f-4a57-a7a1-d395dda67e83';

-- Daft Definitions
UPDATE activities
SET description = '<p>Play Daft Definitions to get everyone listening and responding. In pairs, children invent silly meanings for everyday objects (e.g.</p><p><strong>Why it works</strong></p><ul><li>Develops creativity and oral language</li><li>Encourages humour and imagination</li><li>Loosens thinking for story improvisation</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space. Children work in pairs. No props needed. About 15 minutes.</p><p><strong>How to play</strong></p><ol><li>In pairs, children invent silly meanings for everyday objects (e.g</li><li>''What''s a teapot?'' → ''It''s a singing elephant!''). Share with class</li></ol><p><strong>Teacher tips</strong></p><ul><li>Model one round first, then swap roles so everyone leads.</li><li>Praise clear listening and inventive detail.</li><li>If energy spikes, freeze the group and restart from stillness.</li></ul><p><strong>Make it easier</strong></p><p>Work as a whole class first, then try with a partner.</p><p><strong>Make it harder</strong></p><p>Add a time limit, a second rule, or ask pairs to share one polished moment.</p>',
    updated_at = NOW()
WHERE id = '28927533-c290-48ea-b71c-a6b10f6592ad';

-- Grandma's Footsteps
UPDATE activities
SET description = '<p>Play Grandma''s Footsteps to get everyone listening and responding. One child (Grandma) faces away at end.</p><p><strong>Why it works</strong></p><ul><li>Builds body control and suspense</li><li>Develops spatial awareness</li><li>Creates tension and dramatic movement</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. Whole class. No props needed. About 6 minutes.</p><p><strong>How to play</strong></p><ol><li>One child (Grandma) faces away at end. Others sneak forward</li><li>When Grandma turns, everyone freezes!</li><li>If caught moving, return to line</li></ol><p><strong>Teacher tips</strong></p><ul><li>Use a clear freeze signal (clap, word or drum) and hold stillness for a count of three.</li><li>Praise clear listening and inventive detail.</li><li>If energy spikes, freeze the group and restart from stillness.</li></ul><p><strong>Make it easier</strong></p><p>Reduce choices and model the first round together.</p><p><strong>Make it harder</strong></p><p>Add a time limit, a second rule, or ask pairs to share one polished moment.</p>',
    updated_at = NOW()
WHERE id = '4b280bd9-d417-4abc-806b-8a6a7f8ac84e';

-- Freeze-Frame Stories
UPDATE activities
SET description = '<p>Play Freeze-Frame Stories to get everyone listening and responding. Small groups freeze into scene from story (e.g.</p><p><strong>Why it works</strong></p><ul><li>Develops visual storytelling</li><li>Builds imagination and posture expression</li><li>Great for story comprehension</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Open floor space. Work in small groups. No props needed. About 15 minutes.</p><p><strong>How to play</strong></p><ol><li>Small groups freeze into scene from story (e.g. lost in forest)</li><li>Hold 5-10 seconds, then explain what''s happening</li></ol><p><strong>Teacher tips</strong></p><ul><li>Use a clear freeze signal (clap, word or drum) and hold stillness for a count of three.</li><li>Side-coach with short prompts rather than stopping the scene unless safety needs it.</li><li>Praise clear listening and inventive detail.</li></ul><p><strong>Make it easier</strong></p><p>Reduce choices and model the first round together.</p><p><strong>Make it harder</strong></p><p>Require a clear beginning, middle and end within the time limit.</p><p><strong>Extension</strong></p><p>Bring one statue to life for five seconds, then freeze again.</p>',
    updated_at = NOW()
WHERE id = '38dc7bad-0e25-417e-b367-e56665b8f706';

-- Wrong Names
UPDATE activities
SET description = '<p>Play Wrong Names to get everyone listening and responding. Teacher says a name; child must respond with a different name.</p><p><strong>Why it works</strong></p><ul><li>Builds listening and mental agility</li><li>Creates fun and humour</li><li>Gets children thinking quickly</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear space so the class can sit or stand in a circle. No props needed. About 10 minutes.</p><p><strong>How to play</strong></p><ol><li>Teacher says a name; child must respond with a different name</li><li>Continue rapidly around circle</li></ol><p><strong>Teacher tips</strong></p><ul><li>Keep the circle tight enough that everyone can see and hear.</li><li>Praise clear listening and inventive detail.</li><li>If energy spikes, freeze the group and restart from stillness.</li></ul><p><strong>Make it easier</strong></p><p>Reduce choices and model the first round together.</p><p><strong>Make it harder</strong></p><p>Add a time limit, a second rule, or ask pairs to share one polished moment.</p>',
    updated_at = NOW()
WHERE id = '942f5cc3-f219-480b-a1cd-6a147a4cb18e';

-- Sound Picture
UPDATE activities
SET description = '<p>Play Sound Picture to get everyone listening and responding. Choose setting (market, sea).</p><p><strong>Why it works</strong></p><ul><li>Develops sequential listening</li><li>Builds sound layering creativity</li><li>Preparation for environment drama</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. No props needed. About 15 minutes.</p><p><strong>How to play</strong></p><ol><li>Choose setting (market, sea)</li><li>One child starts with sound; each adds layer (seagulls, waves), building soundscape</li></ol><p><strong>Teacher tips</strong></p><ul><li>Praise clear listening and inventive detail.</li><li>If energy spikes, freeze the group and restart from stillness.</li></ul><p><strong>Make it easier</strong></p><p>Reduce choices and model the first round together.</p><p><strong>Make it harder</strong></p><p>Layer dynamics (loud/soft, near/far) and keep a shared pulse.</p><p><strong>Extension</strong></p><p>Perform the soundscape under a short narrated story.</p>',
    updated_at = NOW()
WHERE id = '4bf6aea5-8cbc-4bef-a3c5-2a1a8e54f9c8';

-- One-Word Story
UPDATE activities
SET description = '<p>Play One-Word Story to get everyone listening and responding. Sit in circle.</p><p><strong>Why it works</strong></p><ul><li>Develops listening and sequencing</li><li>Builds narrative construction skills</li><li>Excellent for language building</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear space so the class can sit or stand in a circle. No props needed. About 15 minutes.</p><p><strong>How to play</strong></p><ol><li>Sit in circle</li><li>Each child gives one word in turn to build story together. See what narrative unfolds!</li></ol><p><strong>Teacher tips</strong></p><ul><li>Keep the circle tight enough that everyone can see and hear.</li><li>Praise clear listening and inventive detail.</li><li>If energy spikes, freeze the group and restart from stillness.</li></ul><p><strong>Make it easier</strong></p><p>Reduce choices and model the first round together.</p><p><strong>Make it harder</strong></p><p>Require a clear beginning, middle and end within the time limit.</p>',
    updated_at = NOW()
WHERE id = '18fddf61-7762-4e5f-94f3-13e2f8fd0061';

-- Animal Characters
UPDATE activities
SET description = '<p>Play Animal Characters to get everyone listening and responding. Children mime animals (using body and sound) while classmates guess what it is.</p><p><strong>Why it works</strong></p><ul><li>Develops characterisation and observation</li><li>Builds expressive movement skills</li><li>Explores physical traits</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. No props needed. About 10 minutes.</p><p><strong>How to play</strong></p><ol><li>Gather attention and explain the game in one short sentence.</li><li>Children mime animals (using body and sound) while classmates guess what it is.</li><li>Take a few guesses, reveal the answer, then rotate so another child has a turn.</li></ol><p><strong>Teacher tips</strong></p><ul><li>Praise clear listening and inventive detail.</li><li>If energy spikes, freeze the group and restart from stillness.</li></ul><p><strong>Make it easier</strong></p><p>Reduce choices and model the first round together.</p><p><strong>Make it harder</strong></p><p>Layer dynamics (loud/soft, near/far) and keep a shared pulse.</p>',
    updated_at = NOW()
WHERE id = 'c96fe235-3ee5-4380-95a2-bec12df0fc44';

-- Guess Who I Am
UPDATE activities
SET description = '<p>Play Guess Who I Am to get everyone listening and responding. One child mimes a character/object as classmates guess.</p><p><strong>Why it works</strong></p><ul><li>Develops nonverbal communication</li><li>Builds symbolic mime skills</li><li>Encourages cultural literacy</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. No props needed. About 10 minutes.</p><p><strong>How to play</strong></p><ol><li>Gather attention and explain the game in one short sentence.</li><li>One child mimes a character/object as classmates guess. Rotate turns around class.</li><li>Take a few guesses, reveal the answer, then rotate so another child has a turn.</li></ol><p><strong>Teacher tips</strong></p><ul><li>Praise clear listening and inventive detail.</li><li>If energy spikes, freeze the group and restart from stillness.</li></ul><p><strong>Make it easier</strong></p><p>Reduce choices and model the first round together.</p><p><strong>Make it harder</strong></p><p>Demand clearer weight, size and texture so the audience can ''see'' the object.</p>',
    updated_at = NOW()
WHERE id = '3c9166d0-d0dc-4523-9131-27c5e7ede245';

-- Sound Machines
UPDATE activities
SET description = '<p>Play Sound Machines to get everyone listening and responding. Each student adds a simple, repetitive sound and motion to create a complex, evolving machine.</p><p><strong>Why it works</strong></p><ul><li>Encourages group synchronisation</li><li>Develops rhythm and focus</li><li>Builds ensemble co-operation</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. No props needed. About 15 minutes.</p><p><strong>How to play</strong></p><ol><li>Gather attention and explain the game in one short sentence.</li><li>Each student adds a simple, repetitive sound and motion to create a complex, evolving machine.</li><li>Play a second round with a fresh prompt, then share one strong moment with the class.</li></ol><p><strong>Teacher tips</strong></p><ul><li>Praise clear listening and inventive detail.</li><li>If energy spikes, freeze the group and restart from stillness.</li></ul><p><strong>Make it easier</strong></p><p>Reduce choices and model the first round together.</p><p><strong>Make it harder</strong></p><p>Layer dynamics (loud/soft, near/far) and keep a shared pulse.</p>',
    updated_at = NOW()
WHERE id = '24a6d616-1f3d-4eed-b280-a7aa33416d0d';

-- Magic Cloak
UPDATE activities
SET description = '<p>Play Magic Cloak to get everyone listening and responding. Children pretend to put on an imaginary cloak that gives them a new power or emotion (e.g.</p><p><strong>Why it works</strong></p><ul><li>Builds imaginative character work</li><li>Develops quick emotional shifts</li><li>Encourages physical expression of feelings</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. Props: hat and emotion slips. About 10 minutes.</p><p><strong>How to play</strong></p><ol><li>Children pretend to put on an imaginary cloak that gives them a new power or emotion (e.g. ''happy cloak'')</li><li>They then move and act accordingly</li></ol><p><strong>Teacher tips</strong></p><ul><li>Praise clear listening and inventive detail.</li><li>If energy spikes, freeze the group and restart from stillness.</li></ul><p><strong>Make it easier</strong></p><p>Reduce choices and model the first round together.</p><p><strong>Make it harder</strong></p><p>Demand clearer weight, size and texture so the audience can ''see'' the object.</p>',
    updated_at = NOW()
WHERE id = 'c00458fc-b09a-4600-bc4a-a57a3934a4b5';

-- Pass the Facial Expression
UPDATE activities
SET description = '<p>Play Pass the Facial Expression to get everyone listening and responding. Pupils sit in a circle and one person makes a facial expression.</p><p><strong>Why it works</strong></p><ul><li>Develops observation skills and non-verbal communication</li><li>Encourages emotional literacy</li><li>Builds focus and visual memory</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear space so the class can sit or stand in a circle. No props needed. About 10 minutes.</p><p><strong>How to play</strong></p><ol><li>Pupils sit in a circle and one person makes a facial expression</li><li>The next person copies it and passes it on, without a sound</li></ol><p><strong>Teacher tips</strong></p><ul><li>Keep the circle tight enough that everyone can see and hear.</li><li>Praise clear listening and inventive detail.</li><li>If energy spikes, freeze the group and restart from stillness.</li></ul><p><strong>Make it easier</strong></p><p>Reduce choices and model the first round together.</p><p><strong>Make it harder</strong></p><p>Layer dynamics (loud/soft, near/far) and keep a shared pulse.</p>',
    updated_at = NOW()
WHERE id = '708a2401-d7d3-417e-bb23-d6eaa2989115';

-- Freeze Frame Story
UPDATE activities
SET description = '<p>Play Freeze Frame Story to get everyone listening and responding. The teacher tells a simple story, and at key moments, the pupils freeze to create a tableau (a still picture) of the scene.</p><p><strong>Why it works</strong></p><ul><li>Introduces non-verbal scene creation</li><li>Builds understanding of narrative moments</li><li>Encourages teamwork and physical composition</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. No props needed. About 20 minutes.</p><p><strong>How to play</strong></p><ol><li>Gather attention and explain the game in one short sentence.</li><li>The teacher tells a simple story, and at key moments, the pupils freeze to create a tableau (a still picture) of the scene.</li><li>Use a clear freeze cue; hold the picture, then relax and reset.</li></ol><p><strong>Teacher tips</strong></p><ul><li>Use a clear freeze signal (clap, word or drum) and hold stillness for a count of three.</li><li>Side-coach with short prompts rather than stopping the scene unless safety needs it.</li><li>Praise clear listening and inventive detail.</li></ul><p><strong>Make it easier</strong></p><p>Reduce choices and model the first round together.</p><p><strong>Make it harder</strong></p><p>Require a clear beginning, middle and end within the time limit.</p><p><strong>Extension</strong></p><p>Bring one statue to life for five seconds, then freeze again.</p>',
    updated_at = NOW()
WHERE id = '68141294-e987-48cd-9531-945849928728';

-- The Bus Stop
UPDATE activities
SET description = '<p>Play The Bus Stop to get everyone listening and responding. A ''bus stop'' is set up with chairs.</p><p><strong>Why it works</strong></p><ul><li>Encourages spontaneous role play</li><li>Develops dialogue and interaction</li><li>Builds confidence in simple improvisation</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Open floor space with clear pathways. Props: chairs. About 20 minutes.</p><p><strong>How to play</strong></p><ol><li>A ''bus stop'' is set up with chairs</li><li>Pupils take turns getting on and off the ''bus'', and in pairs or small groups, create a simple, improvised scene while waiting</li></ol><p><strong>Teacher tips</strong></p><ul><li>Model one round first, then swap roles so everyone leads.</li><li>Side-coach with short prompts rather than stopping the scene unless safety needs it.</li><li>Praise clear listening and inventive detail.</li></ul><p><strong>Make it easier</strong></p><p>Work as a whole class first, then try with a partner.</p><p><strong>Make it harder</strong></p><p>Require a clear beginning, middle and end within the time limit.</p>',
    updated_at = NOW()
WHERE id = 'f3404b89-9981-4014-84aa-ecd076f52fbd';

-- What Are You Doing? (KS1)
UPDATE activities
SET description = '<p>Play What Are You Doing? (KS1) to get everyone listening and responding. One person mimes an action.</p><p><strong>Why it works</strong></p><ul><li>Sharpens quick thinking and verbal/physical dexterity</li><li>Develops creative links between actions</li><li>Enhances improvisational skills</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. No props needed. About 10 minutes.</p><p><strong>How to play</strong></p><ol><li>One person mimes an action</li><li>The next person asks "What are you doing?" and the first person responds with an unrelated action, which the second person then mimes</li></ol><p><strong>Teacher tips</strong></p><ul><li>Praise clear listening and inventive detail.</li><li>If energy spikes, freeze the group and restart from stillness.</li></ul><p><strong>Make it easier</strong></p><p>Reduce choices and model the first round together.</p><p><strong>Make it harder</strong></p><p>Demand clearer weight, size and texture so the audience can ''see'' the object.</p>',
    updated_at = NOW()
WHERE id = '79b6a9a5-a01f-4a2f-b444-7cfeb14b2bd9';

-- Character Hot Seat
UPDATE activities
SET description = '<p>Play Character Hot Seat to get everyone listening and responding. One student sits in a chair as a character from a book or their imagination.</p><p><strong>Why it works</strong></p><ul><li>Develops characterisation and backstory</li><li>Encourages empathy and insight</li><li>Builds verbal confidence and speaking in role</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. Props: chairs. About 15 minutes.</p><p><strong>How to play</strong></p><ol><li>One student sits in a chair as a character from a book or their imagination</li><li>Other pupils ask them questions about their character''s life and feelings</li></ol><p><strong>Teacher tips</strong></p><ul><li>Protect the performer: questions stay kind and in-role.</li><li>Praise clear listening and inventive detail.</li><li>If energy spikes, freeze the group and restart from stillness.</li></ul><p><strong>Make it easier</strong></p><p>Reduce choices and model the first round together.</p><p><strong>Make it harder</strong></p><p>Add a time limit, a second rule, or ask pairs to share one polished moment.</p><p><strong>Extension</strong></p><p>Write a diary entry or thought-track in role afterwards.</p>',
    updated_at = NOW()
WHERE id = 'b9984e5c-1c06-4fc7-8c09-099eadf53101';

-- Sound Effects Story
UPDATE activities
SET description = '<p>Play Sound Effects Story to get everyone listening and responding. The teacher narrates a story with lots of descriptive sounds.</p><p><strong>Why it works</strong></p><ul><li>Develops listening and auditory memory</li><li>Builds a soundscape as a group</li><li>Enhances vocal and sound-making skills</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. Props: short scripts or student-written scenes. About 15 minutes.</p><p><strong>How to play</strong></p><ol><li>The teacher narrates a story with lots of descriptive sounds</li><li>Pupils listen and create the appropriate sound effects with their voices or bodies at the right moments</li></ol><p><strong>Teacher tips</strong></p><ul><li>Praise clear listening and inventive detail.</li><li>If energy spikes, freeze the group and restart from stillness.</li></ul><p><strong>Make it easier</strong></p><p>Reduce choices and model the first round together.</p><p><strong>Make it harder</strong></p><p>Layer dynamics (loud/soft, near/far) and keep a shared pulse.</p>',
    updated_at = NOW()
WHERE id = '283d4518-160f-4554-bab9-f0c5ae0c1fe5';

-- Emotion Walkabout
UPDATE activities
SET description = '<p>Play Emotion Walkabout to get everyone listening and responding. Pupils walk around the room, and the teacher calls out different emotions.</p><p><strong>Why it works</strong></p><ul><li>Links emotions to physicality</li><li>Expands emotional vocabulary</li><li>Promotes body language awareness</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Open floor space with clear pathways. No props needed. About 10 minutes.</p><p><strong>How to play</strong></p><ol><li>Pupils walk around the room, and the teacher calls out different emotions</li><li>The pupils change their walk, posture, and expression to match the emotion</li></ol><p><strong>Teacher tips</strong></p><ul><li>Praise clear listening and inventive detail.</li><li>If energy spikes, freeze the group and restart from stillness.</li></ul><p><strong>Make it easier</strong></p><p>Reduce choices and model the first round together.</p><p><strong>Make it harder</strong></p><p>Add a time limit, a second rule, or ask pairs to share one polished moment.</p>',
    updated_at = NOW()
WHERE id = 'dcb6c0fb-5d88-4677-8e00-c357fd1460c8';

-- Puppet Theatre
UPDATE activities
SET description = '<p>Play Puppet Theatre to get everyone listening and responding. Using simple puppets (e.g., socks or paper bags), pupils create and perform a short, simple story for the class.</p><p><strong>Why it works</strong></p><ul><li>Develops storytelling and narrative skills</li><li>Encourages voice work and character voices</li><li>Promotes collaboration and fine motor skills</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. Props: simple puppets (socks or paper bags). About 20 minutes.</p><p><strong>How to play</strong></p><ol><li>Gather attention and explain the game in one short sentence.</li><li>Using simple puppets (e.g., socks or paper bags), pupils create and perform a short, simple story for the class.</li><li>Play a second round with a fresh prompt, then share one strong moment with the class.</li></ol><p><strong>Teacher tips</strong></p><ul><li>Praise clear listening and inventive detail.</li><li>If energy spikes, freeze the group and restart from stillness.</li></ul><p><strong>Make it easier</strong></p><p>Reduce choices and model the first round together.</p><p><strong>Make it harder</strong></p><p>Require a clear beginning, middle and end within the time limit.</p>',
    updated_at = NOW()
WHERE id = 'bbb040f4-15a1-428f-9f92-230f4e45b70a';

-- Guess the Emotion
UPDATE activities
SET description = '<p>Play Guess the Emotion to get everyone listening and responding. Pupils work in small groups.</p><p><strong>Why it works</strong></p><ul><li>Strengthens non-verbal communication</li><li>Builds emotional literacy and empathy</li><li>Promotes observation skills</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Open floor space. Work in small groups. Props: hat and emotion slips. About 10 minutes.</p><p><strong>How to play</strong></p><ol><li>Pupils work in small groups</li><li>One person acts out a given emotion without speaking, and the others guess what it is</li></ol><p><strong>Teacher tips</strong></p><ul><li>Praise clear listening and inventive detail.</li><li>If energy spikes, freeze the group and restart from stillness.</li></ul><p><strong>Make it easier</strong></p><p>Reduce choices and model the first round together.</p><p><strong>Make it harder</strong></p><p>Add a time limit, a second rule, or ask pairs to share one polished moment.</p>',
    updated_at = NOW()
WHERE id = '877a6a66-35d9-47df-8e4f-567dfe4e58aa';

-- Invisible Objects
UPDATE activities
SET description = '<p>Play Invisible Objects to get everyone listening and responding. The teacher gives pupils a prompt (e.g.</p><p><strong>Why it works</strong></p><ul><li>Develops advanced mime skills</li><li>Enhances sensory imagination</li><li>Fosters focus and precision</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. No props needed. About 15 minutes.</p><p><strong>How to play</strong></p><ol><li>The teacher gives pupils a prompt (e.g</li><li>''a heavy box'', ''a tiny spider'')</li><li>Pupils then mime interacting with that object, showing its weight, size, and texture</li></ol><p><strong>Teacher tips</strong></p><ul><li>Praise clear listening and inventive detail.</li><li>If energy spikes, freeze the group and restart from stillness.</li></ul><p><strong>Make it easier</strong></p><p>Reduce choices and model the first round together.</p><p><strong>Make it harder</strong></p><p>Demand clearer weight, size and texture so the audience can ''see'' the object.</p>',
    updated_at = NOW()
WHERE id = 'a38c2d45-04fd-4c3f-8412-ee7c99cf14b9';

-- Human Alphabet
UPDATE activities
SET description = '<p>Play Human Alphabet to get everyone listening and responding. In small groups, pupils use their bodies to form the shapes of different letters of the alphabet, or spell out simple words.</p><p><strong>Why it works</strong></p><ul><li>Combines physical movement with literacy</li><li>Encourages teamwork and spatial awareness</li><li>A fun way to reinforce spelling</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Open floor space. Work in small groups. No props needed. About 10 minutes.</p><p><strong>How to play</strong></p><ol><li>Organise the class into small groups and give them a clear playing space.</li><li>In small groups, pupils use their bodies to form the shapes of different letters of the alphabet, or spell out simple words.</li><li>Play a second round with a fresh prompt, then share one strong moment with the class.</li></ol><p><strong>Teacher tips</strong></p><ul><li>Praise clear listening and inventive detail.</li><li>If energy spikes, freeze the group and restart from stillness.</li></ul><p><strong>Make it easier</strong></p><p>Reduce choices and model the first round together.</p><p><strong>Make it harder</strong></p><p>Add a time limit, a second rule, or ask pairs to share one polished moment.</p>',
    updated_at = NOW()
WHERE id = '45480951-5279-48e7-a366-c9b4f10f479f';

-- Robot Factory
UPDATE activities
SET description = '<p>Play Robot Factory to get everyone listening and responding. Pupils take on the role of robots.</p><p><strong>Why it works</strong></p><ul><li>Develops movement control and coordination</li><li>Encourages creative physicalisation</li><li>Builds focus and following multi-step directions</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. No props needed. About 15 minutes.</p><p><strong>How to play</strong></p><ol><li>Pupils take on the role of robots</li><li>The teacher gives them commands (e.g</li><li>''walk left'', ''pick up a box'') which they must perform with robot-like movements and sounds</li></ol><p><strong>Teacher tips</strong></p><ul><li>Praise clear listening and inventive detail.</li><li>If energy spikes, freeze the group and restart from stillness.</li></ul><p><strong>Make it easier</strong></p><p>Reduce choices and model the first round together.</p><p><strong>Make it harder</strong></p><p>Layer dynamics (loud/soft, near/far) and keep a shared pulse.</p>',
    updated_at = NOW()
WHERE id = '97a42b18-01a4-43a9-908a-071acb85ae4e';

-- The Human Orchestra
UPDATE activities
SET description = '<p>Play The Human Orchestra to get everyone listening and responding. A ''conductor'' stands in front of the group and points to different sections, who must create the sound and action of a specific instrument (e.g., ''violins''….</p><p><strong>Why it works</strong></p><ul><li>Builds group focus and listening skills</li><li>Develops musical imagination and rhythm</li><li>Encourages collective performance</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. Whole class. No props needed. About 15 minutes.</p><p><strong>How to play</strong></p><ol><li>Gather attention and explain the game in one short sentence.</li><li>A ''conductor'' stands in front of the group and points to different sections, who must create the sound and action of a specific instrument (e.g., ''violins'' hum a high note, ''drums'' stomp feet).</li><li>Play a second round with a fresh prompt, then share one strong moment with the class.</li></ol><p><strong>Teacher tips</strong></p><ul><li>Praise clear listening and inventive detail.</li><li>If energy spikes, freeze the group and restart from stillness.</li></ul><p><strong>Make it easier</strong></p><p>Reduce choices and model the first round together.</p><p><strong>Make it harder</strong></p><p>Layer dynamics (loud/soft, near/far) and keep a shared pulse.</p>',
    updated_at = NOW()
WHERE id = '9be8d931-254c-422d-89a9-480df1af555d';

-- The Great Zoo Escape
UPDATE activities
SET description = '<p>Play The Great Zoo Escape to get everyone listening and responding. The teacher announces that the zoo gates are open!.</p><p><strong>Why it works</strong></p><ul><li>Encourages creative movement</li><li>Develops animal knowledge and sounds</li><li>Builds imaginative play and quick reactions</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Open floor space with clear pathways. No props needed. About 15 minutes.</p><p><strong>How to play</strong></p><ol><li>The teacher announces that the zoo gates are open!</li><li>Pupils must walk and act like various animals trying to escape, changing animals on cue</li></ol><p><strong>Teacher tips</strong></p><ul><li>Praise clear listening and inventive detail.</li><li>If energy spikes, freeze the group and restart from stillness.</li></ul><p><strong>Make it easier</strong></p><p>Reduce choices and model the first round together.</p><p><strong>Make it harder</strong></p><p>Add a time limit, a second rule, or ask pairs to share one polished moment.</p>',
    updated_at = NOW()
WHERE id = 'a2f1c658-1269-4177-b3aa-8bf97744e8a1';

-- Mirror Scenes
UPDATE activities
SET description = '<p>Play Mirror Scenes to get everyone listening and responding. In pairs, pupils create short, mirrored scenes where they copy each other''s actions in real-time to tell a short story (e.g.</p><p><strong>Why it works</strong></p><ul><li>Enhances non-verbal storytelling</li><li>Develops observation and synchronisation</li><li>Fosters partnership and cooperation</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space. Children work in pairs. No props needed. About 15 minutes.</p><p><strong>How to play</strong></p><ol><li>Ask the class to find a partner and face each other with a little space around them.</li><li>In pairs, pupils create short, mirrored scenes where they copy each other''s actions in real-time to tell a short story (e.g. getting ready in the morning).</li><li>Play a second round with a fresh prompt, then share one strong moment with the class.</li></ol><p><strong>Teacher tips</strong></p><ul><li>Model one round first, then swap roles so everyone leads.</li><li>Side-coach with short prompts rather than stopping the scene unless safety needs it.</li><li>Praise clear listening and inventive detail.</li></ul><p><strong>Make it easier</strong></p><p>Work as a whole class first, then try with a partner.</p><p><strong>Make it harder</strong></p><p>Require a clear beginning, middle and end within the time limit.</p>',
    updated_at = NOW()
WHERE id = 'a906ce67-b40c-4dee-a08b-3db853edfd69';

-- Character Interviews
UPDATE activities
SET description = '<p>Play Character Interviews to get everyone listening and responding. The teacher holds up a picture of a character (e.g.</p><p><strong>Why it works</strong></p><ul><li>Develops understanding of character voice</li><li>Encourages creative thinking and questioning</li><li>Builds speaking-in-role skills</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. No props needed. About 15 minutes.</p><p><strong>How to play</strong></p><ol><li>The teacher holds up a picture of a character (e.g. a king, a pirate)</li><li>The class interviews the character by asking them questions, with the teacher or a student answering in character</li></ol><p><strong>Teacher tips</strong></p><ul><li>Praise clear listening and inventive detail.</li><li>If energy spikes, freeze the group and restart from stillness.</li></ul><p><strong>Make it easier</strong></p><p>Reduce choices and model the first round together.</p><p><strong>Make it harder</strong></p><p>Add a time limit, a second rule, or ask pairs to share one polished moment.</p>',
    updated_at = NOW()
WHERE id = 'b1b7708d-864f-4016-a08d-31a03665938d';

-- The Emotion Switch
UPDATE activities
SET description = '<p>Play The Emotion Switch to get everyone listening and responding. Pupils walk around the room.</p><p><strong>Why it works</strong></p><ul><li>Builds emotional vocabulary and physical expression</li><li>Encourages rapid transitions</li><li>Develops physical empathy</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Open floor space with clear pathways. No props needed. About 10 minutes.</p><p><strong>How to play</strong></p><ol><li>Pupils walk around the room</li><li>The teacher calls out two contrasting emotions (e.g. ''happy to sad'')</li><li>Pupils must quickly change their walk and expression to show the new feeling</li></ol><p><strong>Teacher tips</strong></p><ul><li>Praise clear listening and inventive detail.</li><li>If energy spikes, freeze the group and restart from stillness.</li></ul><p><strong>Make it easier</strong></p><p>Reduce choices and model the first round together.</p><p><strong>Make it harder</strong></p><p>Add a time limit, a second rule, or ask pairs to share one polished moment.</p>',
    updated_at = NOW()
WHERE id = '5d4814e5-8d39-4f17-86a5-0cf5650a0cd2';

-- The Conductor
UPDATE activities
SET description = '<p>Play The Conductor to get everyone listening and responding. A ''conductor'' stands in front of the group.</p><p><strong>Why it works</strong></p><ul><li>Teaches dynamics and tempo in sound</li><li>Develops non-verbal communication</li><li>Builds group listening and response</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. Whole class. No props needed. About 15 minutes.</p><p><strong>How to play</strong></p><ol><li>A ''conductor'' stands in front of the group</li><li>The group produces a single, continuous sound</li><li>The conductor uses hand gestures to make the sound louder, softer, faster, slower, and cut out sections</li></ol><p><strong>Teacher tips</strong></p><ul><li>Praise clear listening and inventive detail.</li><li>If energy spikes, freeze the group and restart from stillness.</li></ul><p><strong>Make it easier</strong></p><p>Reduce choices and model the first round together.</p><p><strong>Make it harder</strong></p><p>Layer dynamics (loud/soft, near/far) and keep a shared pulse.</p>',
    updated_at = NOW()
WHERE id = 'b3bc87ec-1f1f-4057-b336-3c9154d0a4bd';

-- Giant and Dwarf
UPDATE activities
SET description = '<p>Play Giant and Dwarf to get everyone listening and responding. Pupils walk normally.</p><p><strong>Why it works</strong></p><ul><li>Develops control of pace and energy</li><li>Builds awareness of physical contrast</li><li>Encourages imaginative movement</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. No props needed. About 10 minutes.</p><p><strong>How to play</strong></p><ol><li>Pupils walk normally</li><li>On cue, they change to a very slow, giant-like walk or a very fast, tiny-dwarf-like scurry</li></ol><p><strong>Teacher tips</strong></p><ul><li>Praise clear listening and inventive detail.</li><li>If energy spikes, freeze the group and restart from stillness.</li></ul><p><strong>Make it easier</strong></p><p>Reduce choices and model the first round together.</p><p><strong>Make it harder</strong></p><p>Add a time limit, a second rule, or ask pairs to share one polished moment.</p>',
    updated_at = NOW()
WHERE id = 'fa14224f-79b5-43ce-b54b-e8e338626efc';

-- The Magical Garden
UPDATE activities
SET description = '<p>Play The Magical Garden to get everyone listening and responding. Pupils pretend to be different plants or creatures in a magical garden.</p><p><strong>Why it works</strong></p><ul><li>Develops environmental storytelling</li><li>Encourages creative physicalisation of nature</li><li>Links to science and nature topics</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. No props needed. About 15 minutes.</p><p><strong>How to play</strong></p><ol><li>Pupils pretend to be different plants or creatures in a magical garden</li><li>The teacher describes what is happening in the garden (e.g</li><li>''the sun is out'', ''a storm is coming''). Pupils react with movement</li></ol><p><strong>Teacher tips</strong></p><ul><li>Praise clear listening and inventive detail.</li><li>If energy spikes, freeze the group and restart from stillness.</li></ul><p><strong>Make it easier</strong></p><p>Reduce choices and model the first round together.</p><p><strong>Make it harder</strong></p><p>Add a time limit, a second rule, or ask pairs to share one polished moment.</p>',
    updated_at = NOW()
WHERE id = '26774287-ab2a-4eec-be68-9a4d2ad24e72';

-- Pass the Sound
UPDATE activities
SET description = '<p>Play Pass the Sound to get everyone listening and responding. Pupils sit in a circle.</p><p><strong>Why it works</strong></p><ul><li>Builds auditory and visual memory</li><li>Develops vocal and physical synchronisation</li><li>Encourages focus and attention to detail</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear space so the class can sit or stand in a circle. No props needed. About 10 minutes.</p><p><strong>How to play</strong></p><ol><li>Pupils sit in a circle</li><li>One person creates a simple sound and an accompanying gesture</li><li>The next person copies it exactly and passes it on, like ''telephone''</li></ol><p><strong>Teacher tips</strong></p><ul><li>Keep the circle tight enough that everyone can see and hear.</li><li>Praise clear listening and inventive detail.</li><li>If energy spikes, freeze the group and restart from stillness.</li></ul><p><strong>Make it easier</strong></p><p>Reduce choices and model the first round together.</p><p><strong>Make it harder</strong></p><p>Layer dynamics (loud/soft, near/far) and keep a shared pulse.</p>',
    updated_at = NOW()
WHERE id = '05bd2d13-937d-4a74-bcaa-70d6f199d356';

-- Role Play Scenarios
UPDATE activities
SET description = '<p>Play Role Play Scenarios to get everyone listening and responding. The teacher presents simple scenarios (e.g.</p><p><strong>Why it works</strong></p><ul><li>Provides structure for improvisation</li><li>Develops dialogue and interaction</li><li>Builds confidence in simple role play</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Open floor space. Work in small groups. No props needed. About 20 minutes.</p><p><strong>How to play</strong></p><ol><li>The teacher presents simple scenarios (e.g</li><li>''two friends meet at the park'', ''a trip to the zoo'')</li><li>Small groups of pupils improvise a short scene based on the prompt</li></ol><p><strong>Teacher tips</strong></p><ul><li>Side-coach with short prompts rather than stopping the scene unless safety needs it.</li><li>Praise clear listening and inventive detail.</li><li>If energy spikes, freeze the group and restart from stillness.</li></ul><p><strong>Make it easier</strong></p><p>Reduce choices and model the first round together.</p><p><strong>Make it harder</strong></p><p>Require a clear beginning, middle and end within the time limit.</p>',
    updated_at = NOW()
WHERE id = '8008a163-3b8a-46f6-8501-3a45877566ea';

-- The Weather Report
UPDATE activities
SET description = '<p>Play The Weather Report to get everyone listening and responding. Pupils are assigned a weather type (e.g., wind, sun, rain).</p><p><strong>Why it works</strong></p><ul><li>Combines physical and vocal expression</li><li>Encourages quick, responsive changes</li><li>Links to geography and science topics</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. No props needed. About 15 minutes.</p><p><strong>How to play</strong></p><ol><li>Pupils are assigned a weather type (e.g., wind, sun, rain)</li><li>The teacher gives a prompt (''a sunny day turns windy'') and pupils must change their movements and sounds to match the weather report</li></ol><p><strong>Teacher tips</strong></p><ul><li>Praise clear listening and inventive detail.</li><li>If energy spikes, freeze the group and restart from stillness.</li></ul><p><strong>Make it easier</strong></p><p>Reduce choices and model the first round together.</p><p><strong>Make it harder</strong></p><p>Layer dynamics (loud/soft, near/far) and keep a shared pulse.</p>',
    updated_at = NOW()
WHERE id = '6adbdd2e-480a-4255-a60f-5bcf4a5525fb';

-- Find the Prop
UPDATE activities
SET description = '<p>Play Find the Prop to get everyone listening and responding. Place a variety of simple props (e.g.</p><p><strong>Why it works</strong></p><ul><li>Develops object work and creative use of props</li><li>Encourages individual storytelling</li><li>Builds spontaneous character creation</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. Props: a few simple props (scarf, hat, cup). About 15 minutes.</p><p><strong>How to play</strong></p><ol><li>Place a variety of simple props (e.g. a scarf, a hat, a plastic cup) in the centre</li><li>Pupils take turns choosing a prop and using it to tell a short story or become a character</li></ol><p><strong>Teacher tips</strong></p><ul><li>Praise clear listening and inventive detail.</li><li>If energy spikes, freeze the group and restart from stillness.</li></ul><p><strong>Make it easier</strong></p><p>Reduce choices and model the first round together.</p><p><strong>Make it harder</strong></p><p>Require a clear beginning, middle and end within the time limit.</p>',
    updated_at = NOW()
WHERE id = 'f4c0d0c6-00eb-4b98-87a8-a4a44dcc26f9';

-- Silent Movie
UPDATE activities
SET description = '<p>Play Silent Movie to get everyone listening and responding. The class acts out a short, well-known fairy tale or story with no dialogue, only music and exaggerated mime.</p><p><strong>Why it works</strong></p><ul><li>Enhances non-verbal communication</li><li>Builds understanding of physical storytelling</li><li>Promotes teamwork and synchronisation</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. Props: optional music player. About 20 minutes.</p><p><strong>How to play</strong></p><ol><li>Gather attention and explain the game in one short sentence.</li><li>The class acts out a short, well-known fairy tale or story with no dialogue, only music and exaggerated mime.</li><li>Play a second round with a fresh prompt, then share one strong moment with the class.</li></ol><p><strong>Teacher tips</strong></p><ul><li>Keep tracks short so you can reset energy quickly.</li><li>Side-coach with short prompts rather than stopping the scene unless safety needs it.</li><li>Praise clear listening and inventive detail.</li></ul><p><strong>Make it easier</strong></p><p>Reduce choices and model the first round together.</p><p><strong>Make it harder</strong></p><p>Require a clear beginning, middle and end within the time limit.</p>',
    updated_at = NOW()
WHERE id = '500306af-14cd-458b-bf3e-b7dc06c3fc79';

-- Freeze and Guess
UPDATE activities
SET description = '<p>Play Freeze and Guess to get everyone listening and responding. Pupils move around the room.</p><p><strong>Why it works</strong></p><ul><li>Encourages creative posing and thinking</li><li>Develops imagination and abstract thought</li><li>Builds awareness of body language</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Open floor space with clear pathways. No props needed. About 10 minutes.</p><p><strong>How to play</strong></p><ol><li>Pupils move around the room</li><li>The teacher shouts ''Freeze!'' and pupils must hold a pose</li><li>The teacher then prompts them with ''What could you be?''</li><li>Pupils can then whisper their idea</li></ol><p><strong>Teacher tips</strong></p><ul><li>Use a clear freeze signal (clap, word or drum) and hold stillness for a count of three.</li><li>Praise clear listening and inventive detail.</li><li>If energy spikes, freeze the group and restart from stillness.</li></ul><p><strong>Make it easier</strong></p><p>Reduce choices and model the first round together.</p><p><strong>Make it harder</strong></p><p>Add a time limit, a second rule, or ask pairs to share one polished moment.</p>',
    updated_at = NOW()
WHERE id = '1a66d90c-fa8d-441f-8070-7e52cbcef3b4';

-- Three-Line Scenes
UPDATE activities
SET description = '<p>Play Three-Line Scenes to get everyone listening and responding. In pairs, pupils are given a setting and two characters.</p><p><strong>Why it works</strong></p><ul><li>Teaches concise dialogue and scene structure</li><li>Encourages a clear beginning and end</li><li>Develops quick, purposeful improvisation</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space. Children work in pairs. No props needed. About 15 minutes.</p><p><strong>How to play</strong></p><ol><li>In pairs, pupils are given a setting and two characters</li><li>They must improvise a scene that lasts for only three lines of dialogue</li></ol><p><strong>Teacher tips</strong></p><ul><li>Model one round first, then swap roles so everyone leads.</li><li>Side-coach with short prompts rather than stopping the scene unless safety needs it.</li><li>Praise clear listening and inventive detail.</li></ul><p><strong>Make it easier</strong></p><p>Work as a whole class first, then try with a partner.</p><p><strong>Make it harder</strong></p><p>Require a clear beginning, middle and end within the time limit.</p>',
    updated_at = NOW()
WHERE id = 'bc2b86cb-3f58-455e-bbf9-c003b76ec712';

-- Storytellers Circle
UPDATE activities
SET description = '<p>Play Storytellers Circle to get everyone listening and responding. One student starts a story with a sentence.</p><p><strong>Why it works</strong></p><ul><li>Builds collaborative storytelling skills</li><li>Fosters imagination and active listening</li><li>Develops narrative sequencing</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear space so the class can sit or stand in a circle. No props needed. About 15 minutes.</p><p><strong>How to play</strong></p><ol><li>One student starts a story with a sentence</li><li>The next student adds a sentence, and so on, until the story is complete</li></ol><p><strong>Teacher tips</strong></p><ul><li>Keep the circle tight enough that everyone can see and hear.</li><li>Praise clear listening and inventive detail.</li><li>If energy spikes, freeze the group and restart from stillness.</li></ul><p><strong>Make it easier</strong></p><p>Reduce choices and model the first round together.</p><p><strong>Make it harder</strong></p><p>Require a clear beginning, middle and end within the time limit.</p>',
    updated_at = NOW()
WHERE id = 'ce58db3f-e4cd-473f-836a-71cc51fdd57e';

-- The Human Statue Museum
UPDATE activities
SET description = '<p>Play The Human Statue Museum to get everyone listening and responding. Pupils pretend to be statues in a museum.</p><p><strong>Why it works</strong></p><ul><li>Promotes self-control and stillness</li><li>Develops creative posing and composition</li><li>Enhances physical discipline</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. Props: optional light switch or ''lights'' cue. About 10 minutes.</p><p><strong>How to play</strong></p><ol><li>Pupils pretend to be statues in a museum</li><li>The teacher is the ''curator'' who turns the lights on and off</li><li>When the lights are on, the statues must be perfectly still</li><li>When they are off, they can move and change their pose</li></ol><p><strong>Teacher tips</strong></p><ul><li>Use a clear freeze signal (clap, word or drum) and hold stillness for a count of three.</li><li>Praise clear listening and inventive detail.</li><li>If energy spikes, freeze the group and restart from stillness.</li></ul><p><strong>Make it easier</strong></p><p>Reduce choices and model the first round together.</p><p><strong>Make it harder</strong></p><p>Add a time limit, a second rule, or ask pairs to share one polished moment.</p>',
    updated_at = NOW()
WHERE id = 'e9af66a4-368a-462e-911a-5abf41ab9ab7';

-- Emotional Obstacle Course
UPDATE activities
SET description = '<p>Play Emotional Obstacle Course to get everyone listening and responding. The teacher sets up an imaginary obstacle course.</p><p><strong>Why it works</strong></p><ul><li>Links emotional states to physical actions</li><li>Develops body control and creative problem solving</li><li>Builds emotional literacy through movement</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Open floor space with clear pathways. No props needed. About 15 minutes.</p><p><strong>How to play</strong></p><ol><li>The teacher sets up an imaginary obstacle course</li><li>Pupils must navigate it while embodying a specific emotion (e.g. happily skipping over a river, angrily climbing a ladder)</li></ol><p><strong>Teacher tips</strong></p><ul><li>Praise clear listening and inventive detail.</li><li>If energy spikes, freeze the group and restart from stillness.</li></ul><p><strong>Make it easier</strong></p><p>Reduce choices and model the first round together.</p><p><strong>Make it harder</strong></p><p>Demand clearer weight, size and texture so the audience can ''see'' the object.</p>',
    updated_at = NOW()
WHERE id = 'e0edea28-221b-4d7a-8a16-2b2596f1e61e';

-- The Character Line-Up
UPDATE activities
SET description = '<p>Play The Character Line-Up to get everyone listening and responding. A line of pupils stands at the front of the class.</p><p><strong>Why it works</strong></p><ul><li>Develops physical characterisation</li><li>Encourages quick thinking and confident performance</li><li>Builds understanding of character traits</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. No props needed. About 15 minutes.</p><p><strong>How to play</strong></p><ol><li>A line of pupils stands at the front of the class</li><li>The teacher names a characteristic (e.g</li><li>''the bravest person'', ''the most tired person'')</li><li>Pupils must step forward and act out that characteristic</li></ol><p><strong>Teacher tips</strong></p><ul><li>Praise clear listening and inventive detail.</li><li>If energy spikes, freeze the group and restart from stillness.</li></ul><p><strong>Make it easier</strong></p><p>Reduce choices and model the first round together.</p><p><strong>Make it harder</strong></p><p>Add a time limit, a second rule, or ask pairs to share one polished moment.</p>',
    updated_at = NOW()
WHERE id = '169c6ac3-3f77-43ac-82ca-3a038d2eb2c7';

-- The Magical Potion
UPDATE activities
SET description = '<p>Play The Magical Potion to get everyone listening and responding. Pupils work in small groups to create an imaginary ''magical potion'' with their bodies and voices.</p><p><strong>Why it works</strong></p><ul><li>Encourages teamwork and creativity</li><li>Builds soundscape creation skills</li><li>Develops a sense of group ritual</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Open floor space. Work in small groups. No props needed. About 15 minutes.</p><p><strong>How to play</strong></p><ol><li>Pupils work in small groups to create an imaginary ''magical potion'' with their bodies and voices</li><li>Each person adds an ingredient with a sound and movement</li></ol><p><strong>Teacher tips</strong></p><ul><li>Praise clear listening and inventive detail.</li><li>If energy spikes, freeze the group and restart from stillness.</li></ul><p><strong>Make it easier</strong></p><p>Reduce choices and model the first round together.</p><p><strong>Make it harder</strong></p><p>Layer dynamics (loud/soft, near/far) and keep a shared pulse.</p>',
    updated_at = NOW()
WHERE id = '863909c9-99ed-4dae-966b-ae369a7eeb2d';

-- Where Am I?
UPDATE activities
SET description = '<p>Play Where Am I? to get everyone listening and responding. One student stands at the front and mimes being in a specific location (e.g.</p><p><strong>Why it works</strong></p><ul><li>Develops spatial awareness and environmental mime</li><li>Encourages clear, detailed physical storytelling</li><li>Builds observation skills</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. No props needed. About 10 minutes.</p><p><strong>How to play</strong></p><ol><li>One student stands at the front and mimes being in a specific location (e.g. a swimming pool, a busy road)</li><li>The rest of the class guesses the location</li></ol><p><strong>Teacher tips</strong></p><ul><li>Praise clear listening and inventive detail.</li><li>If energy spikes, freeze the group and restart from stillness.</li></ul><p><strong>Make it easier</strong></p><p>Reduce choices and model the first round together.</p><p><strong>Make it harder</strong></p><p>Demand clearer weight, size and texture so the audience can ''see'' the object.</p>',
    updated_at = NOW()
WHERE id = 'aceb2583-1638-4115-b385-5a264bd61485';

-- Talking Objects
UPDATE activities
SET description = '<p>Play Talking Objects to get everyone listening and responding. Pupils are given an object (e.g.</p><p><strong>Why it works</strong></p><ul><li>Encourages creative perspective-taking</li><li>Develops imaginative language and voice work</li><li>Promotes empathy for non-human subjects</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. No props needed. About 15 minutes.</p><p><strong>How to play</strong></p><ol><li>Pupils are given an object (e.g. a shoe, a pencil)</li><li>They then have to talk from the perspective of that object, telling its story or describing its feelings</li></ol><p><strong>Teacher tips</strong></p><ul><li>Praise clear listening and inventive detail.</li><li>If energy spikes, freeze the group and restart from stillness.</li></ul><p><strong>Make it easier</strong></p><p>Reduce choices and model the first round together.</p><p><strong>Make it harder</strong></p><p>Require a clear beginning, middle and end within the time limit.</p>',
    updated_at = NOW()
WHERE id = 'a5db6dee-c52c-4ff5-baf5-8793252a5d26';

-- The Human Camera
UPDATE activities
SET description = '<p>Play The Human Camera to get everyone listening and responding. In pairs, one person is the ''camera'' and the other is the ''director''.</p><p><strong>Why it works</strong></p><ul><li>Develops spatial awareness and non-verbal communication</li><li>Encourages creative scene composition</li><li>Builds leadership and following directions</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Open floor space with clear pathways. No props needed. About 10 minutes.</p><p><strong>How to play</strong></p><ol><li>In pairs, one person is the ''camera'' and the other is the ''director''</li><li>The director moves the camera around the room and shouts ''Click!'' to take a picture of a frozen scene</li><li>The camera must ''take'' the picture by freezing in place</li></ol><p><strong>Teacher tips</strong></p><ul><li>Model one round first, then swap roles so everyone leads.</li><li>Side-coach with short prompts rather than stopping the scene unless safety needs it.</li><li>Praise clear listening and inventive detail.</li></ul><p><strong>Make it easier</strong></p><p>Work as a whole class first, then try with a partner.</p><p><strong>Make it harder</strong></p><p>Require a clear beginning, middle and end within the time limit.</p>',
    updated_at = NOW()
WHERE id = '18191501-e003-4dc0-87d4-ec02f321ac12';

-- Follow the Voice
UPDATE activities
SET description = '<p>Play Follow the Voice to get everyone listening and responding. Pupils close their eyes and listen as a ''leader'' walks around the room, making a specific sound.</p><p><strong>Why it works</strong></p><ul><li>Enhances auditory focus and listening skills</li><li>Develops trust and spatial awareness</li><li>Builds attention to vocal cues</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Open floor space with clear pathways. No props needed. About 10 minutes.</p><p><strong>How to play</strong></p><ol><li>Pupils close their eyes and listen as a ''leader'' walks around the room, making a specific sound</li><li>They must follow the sound without bumping into anyone</li></ol><p><strong>Teacher tips</strong></p><ul><li>Keep the space obstacle-free and use a soft safety word if anyone feels unsure.</li><li>Praise clear listening and inventive detail.</li><li>If energy spikes, freeze the group and restart from stillness.</li></ul><p><strong>Make it easier</strong></p><p>Reduce choices and model the first round together.</p><p><strong>Make it harder</strong></p><p>Layer dynamics (loud/soft, near/far) and keep a shared pulse.</p>',
    updated_at = NOW()
WHERE id = 'f3096c34-104f-4203-80f0-9676e1acc329';

-- Three Sounds
UPDATE activities
SET description = '<p>Play Three Sounds to get everyone listening and responding. A leader makes three distinct sounds.</p><p><strong>Why it works</strong></p><ul><li>Builds auditory memory and sequencing skills</li><li>Develops vocal mimicry and control</li><li>Fosters group concentration</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. Whole class. No props needed. About 10 minutes.</p><p><strong>How to play</strong></p><ol><li>A leader makes three distinct sounds</li><li>The group must listen carefully and repeat the sequence of sounds in the correct order</li></ol><p><strong>Teacher tips</strong></p><ul><li>Praise clear listening and inventive detail.</li><li>If energy spikes, freeze the group and restart from stillness.</li></ul><p><strong>Make it easier</strong></p><p>Reduce choices and model the first round together.</p><p><strong>Make it harder</strong></p><p>Layer dynamics (loud/soft, near/far) and keep a shared pulse.</p>',
    updated_at = NOW()
WHERE id = '4603c4d2-af3a-45ef-b334-7e6da78a2c3e';

-- The Story Map
UPDATE activities
SET description = '<p>Play The Story Map to get everyone listening and responding. Using a large piece of paper, pupils draw a map of a fictional place.</p><p><strong>Why it works</strong></p><ul><li>Bridges visual and dramatic storytelling</li><li>Encourages creative world-building</li><li>Develops spatial reasoning and narrative planning</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. Props: large paper and pens. About 20 minutes.</p><p><strong>How to play</strong></p><ol><li>Using a large piece of paper, pupils draw a map of a fictional place</li><li>Then, they use the map as a guide to act out a story, moving around the ''map'' as they tell the narrative</li></ol><p><strong>Teacher tips</strong></p><ul><li>Praise clear listening and inventive detail.</li><li>If energy spikes, freeze the group and restart from stillness.</li></ul><p><strong>Make it easier</strong></p><p>Reduce choices and model the first round together.</p><p><strong>Make it harder</strong></p><p>Require a clear beginning, middle and end within the time limit.</p>',
    updated_at = NOW()
WHERE id = 'fad67b3a-5303-41b7-a04c-aa54276b2735';

-- Emotions in a Hat
UPDATE activities
SET description = '<p>Play Emotions in a Hat to get everyone listening and responding. Write different emotions on pieces of paper and place them in a hat.</p><p><strong>Why it works</strong></p><ul><li>Reinforces emotional vocabulary</li><li>Builds performance confidence</li><li>Encourages a variety of expressions</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. Props: hat and emotion slips. About 10 minutes.</p><p><strong>How to play</strong></p><ol><li>Write different emotions on pieces of paper and place them in a hat</li><li>Pupils take turns picking an emotion and acting it out for the class to guess</li></ol><p><strong>Teacher tips</strong></p><ul><li>Praise clear listening and inventive detail.</li><li>If energy spikes, freeze the group and restart from stillness.</li></ul><p><strong>Make it easier</strong></p><p>Reduce choices and model the first round together.</p><p><strong>Make it harder</strong></p><p>Add a time limit, a second rule, or ask pairs to share one polished moment.</p>',
    updated_at = NOW()
WHERE id = 'a904414e-8571-43d2-8efe-6463b30d6150';

-- Animal Mime Relay
UPDATE activities
SET description = '<p>Play Animal Mime Relay to get everyone listening and responding. Divide the class into teams.</p><p><strong>Why it works</strong></p><ul><li>Builds creative physical expression</li><li>Encourages teamwork and observation</li><li>A fun, energetic activity</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Open floor space with clear pathways. Split into equal teams. No props needed. About 15 minutes.</p><p><strong>How to play</strong></p><ol><li>Divide the class into teams</li><li>One person from each team mimes an animal and runs to a designated spot</li><li>They mime the animal for the next person in their team to guess</li></ol><p><strong>Teacher tips</strong></p><ul><li>Praise clear listening and inventive detail.</li><li>If energy spikes, freeze the group and restart from stillness.</li></ul><p><strong>Make it easier</strong></p><p>Reduce choices and model the first round together.</p><p><strong>Make it harder</strong></p><p>Demand clearer weight, size and texture so the audience can ''see'' the object.</p>',
    updated_at = NOW()
WHERE id = '4102e925-06d1-4189-814e-1a225d312c17';

-- The Mood Room
UPDATE activities
SET description = '<p>Play The Mood Room to get everyone listening and responding. Pupils walk around the room, and the teacher changes the ''mood'' of the space by playing different styles of music (e.g., happy, spooky, sad).</p><p><strong>Why it works</strong></p><ul><li>Teaches the link between music and emotion</li><li>Develops expressive movement</li><li>Fosters a sensory understanding of mood</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Open floor space with clear pathways. Props: optional music player. About 15 minutes.</p><p><strong>How to play</strong></p><ol><li>Pupils walk around the room, and the teacher changes the ''mood'' of the space by playing different styles of music (e.g., happy, spooky, sad)</li><li>Pupils must react with their movement and expression</li></ol><p><strong>Teacher tips</strong></p><ul><li>Keep tracks short so you can reset energy quickly.</li><li>Praise clear listening and inventive detail.</li><li>If energy spikes, freeze the group and restart from stillness.</li></ul><p><strong>Make it easier</strong></p><p>Reduce choices and model the first round together.</p><p><strong>Make it harder</strong></p><p>Add a time limit, a second rule, or ask pairs to share one polished moment.</p>',
    updated_at = NOW()
WHERE id = '25dc2d3f-9bfd-496c-8f58-84ab7d907cfa';

-- Who's Missing?
UPDATE activities
SET description = '<p>Play Who''s Missing? to get everyone listening and responding. One student is ''it'' and closes their eyes.</p><p><strong>Why it works</strong></p><ul><li>Develops observation and memory skills</li><li>Builds quiet concentration</li><li>Fun group game</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Open floor space with clear pathways. No props needed. About 10 minutes.</p><p><strong>How to play</strong></p><ol><li>One student is ''it'' and closes their eyes</li><li>The teacher taps another student to quietly leave the room</li><li>The ''it'' student then opens their eyes and has to guess who is missing</li></ol><p><strong>Teacher tips</strong></p><ul><li>Keep the space obstacle-free and use a soft safety word if anyone feels unsure.</li><li>Praise clear listening and inventive detail.</li><li>If energy spikes, freeze the group and restart from stillness.</li></ul><p><strong>Make it easier</strong></p><p>Reduce choices and model the first round together.</p><p><strong>Make it harder</strong></p><p>Add a time limit, a second rule, or ask pairs to share one polished moment.</p>',
    updated_at = NOW()
WHERE id = '2df88c1b-cfd3-40bc-ba33-235e5c0015c7';

-- The Living Room
UPDATE activities
SET description = '<p>Play The Living Room to get everyone listening and responding. Pupils stand in a circle and pretend to be different pieces of furniture in a living room.</p><p><strong>Why it works</strong></p><ul><li>Encourages creative physicalisation</li><li>Develops imagination and spatial awareness</li><li>A fun way to practice stillness and focus</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Open floor space with clear pathways. No props needed. About 15 minutes.</p><p><strong>How to play</strong></p><ol><li>Pupils stand in a circle and pretend to be different pieces of furniture in a living room</li><li>The teacher or another student can then enter the ''room'' and interact with the ''furniture''</li></ol><p><strong>Teacher tips</strong></p><ul><li>Keep the circle tight enough that everyone can see and hear.</li><li>Praise clear listening and inventive detail.</li><li>If energy spikes, freeze the group and restart from stillness.</li></ul><p><strong>Make it easier</strong></p><p>Reduce choices and model the first round together.</p><p><strong>Make it harder</strong></p><p>Add a time limit, a second rule, or ask pairs to share one polished moment.</p>',
    updated_at = NOW()
WHERE id = '4cb7321d-fe27-4653-a996-3b8caa16b0a9';

-- Yes, and...
UPDATE activities
SET description = '<p>Use Yes, and... to sharpen listening and bold offers. In pairs, pupils improvise a scene.</p><p><strong>Why it works</strong></p><ul><li>Teaches the foundation of improvisational scene-building</li><li>Fosters creative collaboration</li><li>Develops listening and quick thinking</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space. Children work in pairs. No props needed. About 15 minutes.</p><p><strong>How to play</strong></p><ol><li>In pairs, pupils improvise a scene</li><li>One person starts with a sentence</li><li>The other person must respond with a sentence that starts with ''Yes, and...'' and adds new information to the scene</li></ol><p><strong>Teacher tips</strong></p><ul><li>Model one round first, then swap roles so everyone leads.</li><li>Side-coach with short prompts rather than stopping the scene unless safety needs it.</li><li>Ask for precision: clear offers, strong focus, and respectful audience behaviour.</li></ul><p><strong>Make it easier</strong></p><p>Work as a whole class first, then try with a partner.</p><p><strong>Make it harder</strong></p><p>Require a clear beginning, middle and end within the time limit.</p><p><strong>Extension</strong></p><p>Replay the strongest 20 seconds and polish one offer.</p>',
    updated_at = NOW()
WHERE id = '431bf974-e769-4a77-b8e2-6b2a7b356e2d';

-- Character in the Hot Seat
UPDATE activities
SET description = '<p>Use Character in the Hot Seat to sharpen listening and bold offers. One student is selected to sit in the ''hot seat''.</p><p><strong>Why it works</strong></p><ul><li>Deepens characterisation and backstory</li><li>Builds confidence in speaking in role</li><li>Develops verbal improvisation and consistency</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. Props: chairs. About 20 minutes.</p><p><strong>How to play</strong></p><ol><li>One student is selected to sit in the ''hot seat''</li><li>They are given a character role (e.g. an astronaut, a grumpy shopkeeper) and must answer questions from the class in character</li></ol><p><strong>Teacher tips</strong></p><ul><li>Protect the performer: questions stay kind and in-role.</li><li>Ask for precision: clear offers, strong focus, and respectful audience behaviour.</li><li>Name what worked after a round (listening, commitment, ensemble timing).</li></ul><p><strong>Make it easier</strong></p><p>Give a clearer prompt or allow a short planning whisper before performing.</p><p><strong>Make it harder</strong></p><p>Raise the challenge with constraints (no words, fixed emotion, or a tighter time limit).</p><p><strong>Extension</strong></p><p>Write a diary entry or thought-track in role afterwards.</p>',
    updated_at = NOW()
WHERE id = '0a9640ec-2790-467e-9754-8f73b82d60a1';

-- Soundscape Story
UPDATE activities
SET description = '<p>Use Soundscape Story to sharpen listening and bold offers. The class works together to create a full soundscape for a story.</p><p><strong>Why it works</strong></p><ul><li>Teaches teamwork and timing</li><li>Builds complex soundscapes</li><li>Develops aural storytelling skills</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. No props needed. About 20 minutes.</p><p><strong>How to play</strong></p><ol><li>The class works together to create a full soundscape for a story</li><li>Pupils are assigned different sounds (e.g., wind, car horns, footsteps) and must create them on cue from a ''director''</li></ol><p><strong>Teacher tips</strong></p><ul><li>Ask for precision: clear offers, strong focus, and respectful audience behaviour.</li><li>Name what worked after a round (listening, commitment, ensemble timing).</li></ul><p><strong>Make it easier</strong></p><p>Give a clearer prompt or allow a short planning whisper before performing.</p><p><strong>Make it harder</strong></p><p>Layer dynamics (loud/soft, near/far) and keep a shared pulse.</p><p><strong>Extension</strong></p><p>Perform the soundscape under a short narrated story.</p>',
    updated_at = NOW()
WHERE id = '551f55b1-74a7-4c6b-81b0-f2c86fca11c1';

-- Emotion Mask
UPDATE activities
SET description = '<p>Use Emotion Mask to sharpen listening and bold offers. Pupils create an ''emotion mask'' with their hands over their face.</p><p><strong>Why it works</strong></p><ul><li>Refines facial expression control</li><li>Builds awareness of subtle emotion cues</li><li>A focused activity for expression work</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. Props: hat and emotion slips. About 10 minutes.</p><p><strong>How to play</strong></p><ol><li>Pupils create an ''emotion mask'' with their hands over their face</li><li>They then make a facial expression</li><li>When they lower their hands, they must hold that expression perfectly still for the class to guess</li></ol><p><strong>Teacher tips</strong></p><ul><li>Use a clear freeze signal (clap, word or drum) and hold stillness for a count of three.</li><li>Ask for precision: clear offers, strong focus, and respectful audience behaviour.</li><li>Name what worked after a round (listening, commitment, ensemble timing).</li></ul><p><strong>Make it easier</strong></p><p>Give a clearer prompt or allow a short planning whisper before performing.</p><p><strong>Make it harder</strong></p><p>Raise the challenge with constraints (no words, fixed emotion, or a tighter time limit).</p>',
    updated_at = NOW()
WHERE id = '47ff2677-5390-453e-9586-37bcd9296920';

-- Three-Scene Plays
UPDATE activities
SET description = '<p>Use Three-Scene Plays to sharpen listening and bold offers. In small groups, pupils are given a simple plot (e.g.</p><p><strong>Why it works</strong></p><ul><li>Teaches playwriting and scene structure</li><li>Encourages collaborative storytelling</li><li>Develops performance and acting skills</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Open floor space. Work in small groups. No props needed. About 30 minutes.</p><p><strong>How to play</strong></p><ol><li>Organise the class into small groups and give them a clear playing space.</li><li>In small groups, pupils are given a simple plot (e.g. a mystery, a rescue) and must create a short play with a clear beginning, middle, and end, using three distinct scenes.</li><li>Play a second round with a fresh prompt, then share one strong moment with the class.</li></ol><p><strong>Teacher tips</strong></p><ul><li>Side-coach with short prompts rather than stopping the scene unless safety needs it.</li><li>Ask for precision: clear offers, strong focus, and respectful audience behaviour.</li><li>Name what worked after a round (listening, commitment, ensemble timing).</li></ul><p><strong>Make it easier</strong></p><p>Give a clearer prompt or allow a short planning whisper before performing.</p><p><strong>Make it harder</strong></p><p>Require a clear beginning, middle and end within the time limit.</p><p><strong>Extension</strong></p><p>Replay the strongest 20 seconds and polish one offer.</p>',
    updated_at = NOW()
WHERE id = '046afaa6-7034-4c3e-b2f6-8a8334f455ff';

-- Gibberish Translator
UPDATE activities
SET description = '<p>Use Gibberish Translator to sharpen listening and bold offers. In pairs, one person speaks in a made-up language (gibberish) with a clear emotion or intention.</p><p><strong>Why it works</strong></p><ul><li>Develops focus on emotion and subtext</li><li>Teaches non-verbal communication</li><li>Builds creative, spontaneous dialogue</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space. Children work in pairs. Props: hat and emotion slips. About 15 minutes.</p><p><strong>How to play</strong></p><ol><li>In pairs, one person speaks in a made-up language (gibberish) with a clear emotion or intention</li><li>The other person ''translates'' what they are saying, creating an improvised scene</li></ol><p><strong>Teacher tips</strong></p><ul><li>Model one round first, then swap roles so everyone leads.</li><li>Side-coach with short prompts rather than stopping the scene unless safety needs it.</li><li>Ask for precision: clear offers, strong focus, and respectful audience behaviour.</li></ul><p><strong>Make it easier</strong></p><p>Work as a whole class first, then try with a partner.</p><p><strong>Make it harder</strong></p><p>Require a clear beginning, middle and end within the time limit.</p><p><strong>Extension</strong></p><p>Replay the strongest 20 seconds and polish one offer.</p>',
    updated_at = NOW()
WHERE id = '7b8588eb-e632-4e75-abcc-bf7b6349a457';

-- The Living Tableau
UPDATE activities
SET description = '<p>Use The Living Tableau to sharpen listening and bold offers. A group of pupils creates a frozen picture (tableau) of a specific scene (e.g.</p><p><strong>Why it works</strong></p><ul><li>Bridges physical and verbal performance</li><li>Develops understanding of subtext and motivation</li><li>Encourages thoughtful characterisation</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Open floor space. Work in small groups. Whole class. No props needed. About 20 minutes.</p><p><strong>How to play</strong></p><ol><li>A group of pupils creates a frozen picture (tableau) of a specific scene (e.g</li><li>''a moment from history'', ''a crowded city street'')</li><li>On a cue, one person in the tableau says their inner thoughts</li></ol><p><strong>Teacher tips</strong></p><ul><li>Use a clear freeze signal (clap, word or drum) and hold stillness for a count of three.</li><li>Side-coach with short prompts rather than stopping the scene unless safety needs it.</li><li>Ask for precision: clear offers, strong focus, and respectful audience behaviour.</li></ul><p><strong>Make it easier</strong></p><p>Give a clearer prompt or allow a short planning whisper before performing.</p><p><strong>Make it harder</strong></p><p>Require a clear beginning, middle and end within the time limit.</p><p><strong>Extension</strong></p><p>Bring one statue to life for five seconds, then freeze again.</p>',
    updated_at = NOW()
WHERE id = '9dc9d904-e61e-4807-9dcd-550f9555d0ea';

-- Character Walks
UPDATE activities
SET description = '<p>Use Character Walks to sharpen listening and bold offers. The teacher calls out a character type (e.g., ''a sneaky spy'', ''a proud queen'').</p><p><strong>Why it works</strong></p><ul><li>Refines physical characterisation</li><li>Develops awareness of pace, weight, and posture</li><li>Encourages detailed movement</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Open floor space with clear pathways. No props needed. About 10 minutes.</p><p><strong>How to play</strong></p><ol><li>The teacher calls out a character type (e.g., ''a sneaky spy'', ''a proud queen'')</li><li>Pupils must walk around the space embodying that character</li><li>The teacher can give more complex prompts (e.g., ''a sneaky spy walking on a creaky floor'')</li></ol><p><strong>Teacher tips</strong></p><ul><li>Ask for precision: clear offers, strong focus, and respectful audience behaviour.</li><li>Name what worked after a round (listening, commitment, ensemble timing).</li></ul><p><strong>Make it easier</strong></p><p>Give a clearer prompt or allow a short planning whisper before performing.</p><p><strong>Make it harder</strong></p><p>Raise the challenge with constraints (no words, fixed emotion, or a tighter time limit).</p>',
    updated_at = NOW()
WHERE id = '6fcfeeb6-dfbb-4b8e-bf1e-f78c79953cba';

-- Conscience Alley
UPDATE activities
SET description = '<p>Use Conscience Alley to sharpen listening and bold offers. One student stands at one end of two lines of pupils facing each other.</p><p><strong>Why it works</strong></p><ul><li>Introduces the concept of inner conflict</li><li>Encourages verbal improvisation and empathy</li><li>Builds understanding of character motivation</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. No props needed. About 15 minutes.</p><p><strong>How to play</strong></p><ol><li>One student stands at one end of two lines of pupils facing each other</li><li>As they walk down the ''alley'', pupils on each side whisper advice or thoughts from a character''s ''conscience''</li></ol><p><strong>Teacher tips</strong></p><ul><li>Ask for precision: clear offers, strong focus, and respectful audience behaviour.</li><li>Name what worked after a round (listening, commitment, ensemble timing).</li></ul><p><strong>Make it easier</strong></p><p>Give a clearer prompt or allow a short planning whisper before performing.</p><p><strong>Make it harder</strong></p><p>Raise the challenge with constraints (no words, fixed emotion, or a tighter time limit).</p>',
    updated_at = NOW()
WHERE id = '19fdd9ef-4d2c-4445-bd75-c260c7be0d76';

-- Director's Cut
UPDATE activities
SET description = '<p>Use Director''s Cut to sharpen listening and bold offers. Two or three pupils improvise a scene.</p><p><strong>Why it works</strong></p><ul><li>Teaches directing and performance feedback</li><li>Encourages critical thinking about acting choices</li><li>Builds confidence in making and receiving suggestions</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. No props needed. About 20 minutes.</p><p><strong>How to play</strong></p><ol><li>Two or three pupils improvise a scene</li><li>The rest of the class are ''directors'' who can shout ''Cut!'' and give a direction for the actors to follow (e.g., ''Do that faster!'', ''Show us how you feel!'')</li></ol><p><strong>Teacher tips</strong></p><ul><li>Side-coach with short prompts rather than stopping the scene unless safety needs it.</li><li>Ask for precision: clear offers, strong focus, and respectful audience behaviour.</li><li>Name what worked after a round (listening, commitment, ensemble timing).</li></ul><p><strong>Make it easier</strong></p><p>Give a clearer prompt or allow a short planning whisper before performing.</p><p><strong>Make it harder</strong></p><p>Require a clear beginning, middle and end within the time limit.</p><p><strong>Extension</strong></p><p>Replay the strongest 20 seconds and polish one offer.</p>',
    updated_at = NOW()
WHERE id = '69efa24e-c15f-4566-8f69-c2f0518359f4';

-- The Human Machine
UPDATE activities
SET description = '<p>Use The Human Machine to sharpen listening and bold offers. Each student adds a simple, repetitive movement and sound to create an increasingly complex ''machine''.</p><p><strong>Why it works</strong></p><ul><li>Develops synchronisation and group rhythm</li><li>Teaches the concept of ensemble performance</li><li>Builds focus and non-verbal communication</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. No props needed. About 15 minutes.</p><p><strong>How to play</strong></p><ol><li>Each student adds a simple, repetitive movement and sound to create an increasingly complex ''machine''</li><li>The ''director'' can then control the machine by speeding it up or slowing it down</li></ol><p><strong>Teacher tips</strong></p><ul><li>Ask for precision: clear offers, strong focus, and respectful audience behaviour.</li><li>Name what worked after a round (listening, commitment, ensemble timing).</li></ul><p><strong>Make it easier</strong></p><p>Give a clearer prompt or allow a short planning whisper before performing.</p><p><strong>Make it harder</strong></p><p>Layer dynamics (loud/soft, near/far) and keep a shared pulse.</p>',
    updated_at = NOW()
WHERE id = 'e972418b-dea8-4e64-9fcd-17ad9f633313';

-- Freeze and Swap
UPDATE activities
SET description = '<p>Use Freeze and Swap to sharpen listening and bold offers. Two pupils are improvising a scene.</p><p><strong>Why it works</strong></p><ul><li>Promotes quick thinking and adaptability</li><li>Teaches scene continuation and change</li><li>A fun, fast-paced improvisation game</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. No props needed. About 15 minutes.</p><p><strong>How to play</strong></p><ol><li>Two pupils are improvising a scene</li><li>The teacher shouts ''Freeze!'' and tags one of the pupils</li><li>A third student takes their place, repeating the frozen pose, and then continues the scene with a completely new idea</li></ol><p><strong>Teacher tips</strong></p><ul><li>Use a clear freeze signal (clap, word or drum) and hold stillness for a count of three.</li><li>Remind children to tag or wink gently — no pushing.</li><li>Side-coach with short prompts rather than stopping the scene unless safety needs it.</li></ul><p><strong>Make it easier</strong></p><p>Give a clearer prompt or allow a short planning whisper before performing.</p><p><strong>Make it harder</strong></p><p>Require a clear beginning, middle and end within the time limit.</p><p><strong>Extension</strong></p><p>Replay the strongest 20 seconds and polish one offer.</p>',
    updated_at = NOW()
WHERE id = '00eec09a-fdea-428d-8f6f-2653a1eb7537';

-- Storytellers' Theatre
UPDATE activities
SET description = '<p>Use Storytellers'' Theatre to sharpen listening and bold offers. Pupils are given a story (e.g., a short fable or myth).</p><p><strong>Why it works</strong></p><ul><li>Encourages narrative analysis and performance</li><li>Builds a bridge between literature and drama</li><li>Promotes clear storytelling and vocal delivery</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. No props needed. About 25 minutes.</p><p><strong>How to play</strong></p><ol><li>Pupils are given a story (e.g., a short fable or myth)</li><li>They break it down into scenes and use simple movement and narration to tell the story to the class</li></ol><p><strong>Teacher tips</strong></p><ul><li>Side-coach with short prompts rather than stopping the scene unless safety needs it.</li><li>Ask for precision: clear offers, strong focus, and respectful audience behaviour.</li><li>Name what worked after a round (listening, commitment, ensemble timing).</li></ul><p><strong>Make it easier</strong></p><p>Give a clearer prompt or allow a short planning whisper before performing.</p><p><strong>Make it harder</strong></p><p>Require a clear beginning, middle and end within the time limit.</p><p><strong>Extension</strong></p><p>Replay the strongest 20 seconds and polish one offer.</p>',
    updated_at = NOW()
WHERE id = '28b8e36a-2934-485c-b7b6-2d389f5f821c';

-- Emotion Circle
UPDATE activities
SET description = '<p>Use Emotion Circle to sharpen listening and bold offers. The group stands in a circle.</p><p><strong>Why it works</strong></p><ul><li>Develops physical and emotional memory</li><li>Encourages expression through movement</li><li>Builds group synergy and trust</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear space so the class can sit or stand in a circle. No props needed. About 15 minutes.</p><p><strong>How to play</strong></p><ol><li>The group stands in a circle</li><li>One person starts with a physical movement and an accompanying emotion</li><li>The next person copies it and adds another movement and emotion, building a sequence</li></ol><p><strong>Teacher tips</strong></p><ul><li>Keep the circle tight enough that everyone can see and hear.</li><li>Ask for precision: clear offers, strong focus, and respectful audience behaviour.</li><li>Name what worked after a round (listening, commitment, ensemble timing).</li></ul><p><strong>Make it easier</strong></p><p>Give a clearer prompt or allow a short planning whisper before performing.</p><p><strong>Make it harder</strong></p><p>Raise the challenge with constraints (no words, fixed emotion, or a tighter time limit).</p>',
    updated_at = NOW()
WHERE id = '44d70067-db9e-4177-9488-7b3aeca3b7e4';

-- Creating an Environment
UPDATE activities
SET description = '<p>Use Creating an Environment to sharpen listening and bold offers. Pupils use their bodies and voices to create a complete environment, such as a jungle, a busy city, or an underwater world.</p><p><strong>Why it works</strong></p><ul><li>Fosters creative and collaborative world-building</li><li>Enhances spatial awareness and environmental storytelling</li><li>Builds a strong sense of ensemble</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. No props needed. About 20 minutes.</p><p><strong>How to play</strong></p><ol><li>Pupils use their bodies and voices to create a complete environment, such as a jungle, a busy city, or an underwater world</li><li>The teacher or a student can then ''walk through'' the environment</li></ol><p><strong>Teacher tips</strong></p><ul><li>Ask for precision: clear offers, strong focus, and respectful audience behaviour.</li><li>Name what worked after a round (listening, commitment, ensemble timing).</li></ul><p><strong>Make it easier</strong></p><p>Give a clearer prompt or allow a short planning whisper before performing.</p><p><strong>Make it harder</strong></p><p>Raise the challenge with constraints (no words, fixed emotion, or a tighter time limit).</p>',
    updated_at = NOW()
WHERE id = '3c852de8-bfb4-48bb-be2f-b727870adff8';

-- Found Object Story
UPDATE activities
SET description = '<p>Use Found Object Story to sharpen listening and bold offers. Pupils are given a random, everyday object (e.g.</p><p><strong>Why it works</strong></p><ul><li>Encourages creative use of props</li><li>Develops imaginative storytelling and problem-solving</li><li>Builds the skill of creating meaning with simple objects</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Open floor space. Work in small groups. Props: one everyday object. About 25 minutes.</p><p><strong>How to play</strong></p><ol><li>Pupils are given a random, everyday object (e.g. a shoe, a bottle, a piece of string)</li><li>In small groups, they must create a short play where the object is the central character or prop</li></ol><p><strong>Teacher tips</strong></p><ul><li>Ask for precision: clear offers, strong focus, and respectful audience behaviour.</li><li>Name what worked after a round (listening, commitment, ensemble timing).</li></ul><p><strong>Make it easier</strong></p><p>Give a clearer prompt or allow a short planning whisper before performing.</p><p><strong>Make it harder</strong></p><p>Require a clear beginning, middle and end within the time limit.</p>',
    updated_at = NOW()
WHERE id = '16270d15-e14d-4d68-b5f2-01beec0792d6';

-- Back-to-Back Scenes
UPDATE activities
SET description = '<p>Use Back-to-Back Scenes to sharpen listening and bold offers. In pairs, pupils sit back-to-back.</p><p><strong>Why it works</strong></p><ul><li>Teaches the importance of voice and tone</li><li>Develops listening and verbal communication</li><li>A fun exercise to challenge vocal skills</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space. Children work in pairs. No props needed. About 15 minutes.</p><p><strong>How to play</strong></p><ol><li>In pairs, pupils sit back-to-back</li><li>The teacher gives them a scene scenario</li><li>They must improvise the scene using only their voices, focusing on dialogue, tone, and vocal nuance</li></ol><p><strong>Teacher tips</strong></p><ul><li>Model one round first, then swap roles so everyone leads.</li><li>Side-coach with short prompts rather than stopping the scene unless safety needs it.</li><li>Ask for precision: clear offers, strong focus, and respectful audience behaviour.</li></ul><p><strong>Make it easier</strong></p><p>Work as a whole class first, then try with a partner.</p><p><strong>Make it harder</strong></p><p>Require a clear beginning, middle and end within the time limit.</p><p><strong>Extension</strong></p><p>Replay the strongest 20 seconds and polish one offer.</p>',
    updated_at = NOW()
WHERE id = '8d2d451d-a6db-4c9b-9986-4f63ca162e78';

-- News Reporters
UPDATE activities
SET description = '<p>Use News Reporters to sharpen listening and bold offers. Pupils work in small groups to improvise a news report about an imaginary event (e.g.</p><p><strong>Why it works</strong></p><ul><li>Builds improvisational skills and character roles</li><li>Encourages clear, purposeful speaking</li><li>Develops teamwork and quick scene-creation</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Open floor space. Work in small groups. No props needed. About 20 minutes.</p><p><strong>How to play</strong></p><ol><li>Pupils work in small groups to improvise a news report about an imaginary event (e.g</li><li>''a giant cat has appeared in the town square'')</li><li>They must create a reporter, a witness, and an expert</li></ol><p><strong>Teacher tips</strong></p><ul><li>Side-coach with short prompts rather than stopping the scene unless safety needs it.</li><li>Ask for precision: clear offers, strong focus, and respectful audience behaviour.</li><li>Name what worked after a round (listening, commitment, ensemble timing).</li></ul><p><strong>Make it easier</strong></p><p>Give a clearer prompt or allow a short planning whisper before performing.</p><p><strong>Make it harder</strong></p><p>Demand clearer weight, size and texture so the audience can ''see'' the object.</p><p><strong>Extension</strong></p><p>Replay the strongest 20 seconds and polish one offer.</p>',
    updated_at = NOW()
WHERE id = 'b9980310-768d-4d12-ac02-0cfb7ff70698';

-- Physical Storytelling
UPDATE activities
SET description = '<p>Use Physical Storytelling to sharpen listening and bold offers. The teacher reads a dramatic story aloud.</p><p><strong>Why it works</strong></p><ul><li>Teaches non-verbal storytelling and listening</li><li>Develops physical expression and body control</li><li>Links narrative to movement</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. No props needed. About 20 minutes.</p><p><strong>How to play</strong></p><ol><li>The teacher reads a dramatic story aloud</li><li>Pupils follow the narration with their bodies, physically embodying the characters and events without speaking</li></ol><p><strong>Teacher tips</strong></p><ul><li>Ask for precision: clear offers, strong focus, and respectful audience behaviour.</li><li>Name what worked after a round (listening, commitment, ensemble timing).</li></ul><p><strong>Make it easier</strong></p><p>Give a clearer prompt or allow a short planning whisper before performing.</p><p><strong>Make it harder</strong></p><p>Require a clear beginning, middle and end within the time limit.</p>',
    updated_at = NOW()
WHERE id = '3c26dd35-56cd-46fb-8612-a86b943b622b';

-- Thought Tap
UPDATE activities
SET description = '<p>Use Thought Tap to sharpen listening and bold offers. Two pupils improvise a short scene.</p><p><strong>Why it works</strong></p><ul><li>Introduces the concept of subtext</li><li>Builds insight into character motivation</li><li>Encourages deeper, more thoughtful acting</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. No props needed. About 15 minutes.</p><p><strong>How to play</strong></p><ol><li>Two pupils improvise a short scene</li><li>On a cue, the teacher taps one student on the shoulder</li><li>The student then stops and says their character''s inner thoughts out loud before rejoining the scene</li></ol><p><strong>Teacher tips</strong></p><ul><li>Side-coach with short prompts rather than stopping the scene unless safety needs it.</li><li>Ask for precision: clear offers, strong focus, and respectful audience behaviour.</li><li>Name what worked after a round (listening, commitment, ensemble timing).</li></ul><p><strong>Make it easier</strong></p><p>Give a clearer prompt or allow a short planning whisper before performing.</p><p><strong>Make it harder</strong></p><p>Require a clear beginning, middle and end within the time limit.</p><p><strong>Extension</strong></p><p>Replay the strongest 20 seconds and polish one offer.</p>',
    updated_at = NOW()
WHERE id = '564c9b03-e5f5-4347-9d30-63a70fc55755';

-- The Story Circle (Advanced)
UPDATE activities
SET description = '<p>Use The Story Circle (Advanced) to sharpen listening and bold offers. Each student adds a sentence to a developing story.</p><p><strong>Why it works</strong></p><ul><li>Promotes creative problem-solving and thinking on your feet</li><li>Builds advanced narrative construction</li><li>Encourages risk-taking in storytelling</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear space so the class can sit or stand in a circle. No props needed. About 20 minutes.</p><p><strong>How to play</strong></p><ol><li>Each student adds a sentence to a developing story</li><li>This version has a rule: the new sentence must change the direction of the story in some way (e.g., by adding a new character, a twist, or a problem)</li></ol><p><strong>Teacher tips</strong></p><ul><li>Keep the circle tight enough that everyone can see and hear.</li><li>Ask for precision: clear offers, strong focus, and respectful audience behaviour.</li><li>Name what worked after a round (listening, commitment, ensemble timing).</li></ul><p><strong>Make it easier</strong></p><p>Give a clearer prompt or allow a short planning whisper before performing.</p><p><strong>Make it harder</strong></p><p>Require a clear beginning, middle and end within the time limit.</p>',
    updated_at = NOW()
WHERE id = 'd78e88e7-2136-4957-80a7-545e485b1cb2';

-- Body Percussion Symphony
UPDATE activities
SET description = '<p>Use Body Percussion Symphony to sharpen listening and bold offers. The class works together to create a rhythmic piece using only body percussion (claps, snaps, stomps, chest pats).</p><p><strong>Why it works</strong></p><ul><li>Develops rhythm and timing</li><li>Builds group focus and synchronisation</li><li>A fun and energetic musical drama activity</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. No props needed. About 15 minutes.</p><p><strong>How to play</strong></p><ol><li>The class works together to create a rhythmic piece using only body percussion (claps, snaps, stomps, chest pats)</li><li>A student conductor directs the piece</li></ol><p><strong>Teacher tips</strong></p><ul><li>Ask for precision: clear offers, strong focus, and respectful audience behaviour.</li><li>Name what worked after a round (listening, commitment, ensemble timing).</li></ul><p><strong>Make it easier</strong></p><p>Give a clearer prompt or allow a short planning whisper before performing.</p><p><strong>Make it harder</strong></p><p>Raise the challenge with constraints (no words, fixed emotion, or a tighter time limit).</p>',
    updated_at = NOW()
WHERE id = 'daaba464-d0c3-459a-9601-58ed092001c7';

-- Vocal Dynamics
UPDATE activities
SET description = '<p>Use Vocal Dynamics to sharpen listening and bold offers. Pupils practice speaking a single sentence (e.g., ''I went to the store'') in different ways, varying their pitch, pace, and volume to convey different meanings.</p><p><strong>Why it works</strong></p><ul><li>Teaches vocal variety and control</li><li>Develops a deeper understanding of tone</li><li>Enhances verbal communication skills</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. No props needed. About 10 minutes.</p><p><strong>How to play</strong></p><ol><li>Gather attention and explain the game in one short sentence.</li><li>Pupils practice speaking a single sentence (e.g., ''I went to the store'') in different ways, varying their pitch, pace, and volume to convey different meanings.</li><li>Play a second round with a fresh prompt, then share one strong moment with the class.</li></ol><p><strong>Teacher tips</strong></p><ul><li>Ask for precision: clear offers, strong focus, and respectful audience behaviour.</li><li>Name what worked after a round (listening, commitment, ensemble timing).</li></ul><p><strong>Make it easier</strong></p><p>Give a clearer prompt or allow a short planning whisper before performing.</p><p><strong>Make it harder</strong></p><p>Raise the challenge with constraints (no words, fixed emotion, or a tighter time limit).</p>',
    updated_at = NOW()
WHERE id = '5db3603b-8de3-4688-b77b-7e65e76afdbe';

-- One-Minute Scenes
UPDATE activities
SET description = '<p>Use One-Minute Scenes to sharpen listening and bold offers. In pairs, pupils are given a simple prompt (e.g.</p><p><strong>Why it works</strong></p><ul><li>Teaches time management in performance</li><li>Encourages concise and purposeful storytelling</li><li>Develops confidence in short-form improvisation</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space. Children work in pairs. No props needed. About 20 minutes.</p><p><strong>How to play</strong></p><ol><li>In pairs, pupils are given a simple prompt (e.g</li><li>''meeting a stranger'', ''losing something important'') and must create a scene that lasts for exactly one minute</li></ol><p><strong>Teacher tips</strong></p><ul><li>Model one round first, then swap roles so everyone leads.</li><li>Side-coach with short prompts rather than stopping the scene unless safety needs it.</li><li>Ask for precision: clear offers, strong focus, and respectful audience behaviour.</li></ul><p><strong>Make it easier</strong></p><p>Work as a whole class first, then try with a partner.</p><p><strong>Make it harder</strong></p><p>Require a clear beginning, middle and end within the time limit.</p><p><strong>Extension</strong></p><p>Replay the strongest 20 seconds and polish one offer.</p>',
    updated_at = NOW()
WHERE id = '2ddb39f8-5a21-4917-87c3-b05bc2fb0868';

-- The Human Photograph
UPDATE activities
SET description = '<p>Use The Human Photograph to sharpen listening and bold offers. The teacher calls out a setting or situation (e.g.</p><p><strong>Why it works</strong></p><ul><li>Develops visual storytelling and scene composition</li><li>Encourages collaborative problem-solving</li><li>Builds an understanding of physical relationships</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. No props needed. About 15 minutes.</p><p><strong>How to play</strong></p><ol><li>The teacher calls out a setting or situation (e.g</li><li>''a family dinner'', ''the playground at lunchtime'')</li><li>The class works together to quickly form a frozen tableau that tells a story about that moment</li></ol><p><strong>Teacher tips</strong></p><ul><li>Use a clear freeze signal (clap, word or drum) and hold stillness for a count of three.</li><li>Ask for precision: clear offers, strong focus, and respectful audience behaviour.</li><li>Name what worked after a round (listening, commitment, ensemble timing).</li></ul><p><strong>Make it easier</strong></p><p>Give a clearer prompt or allow a short planning whisper before performing.</p><p><strong>Make it harder</strong></p><p>Require a clear beginning, middle and end within the time limit.</p><p><strong>Extension</strong></p><p>Bring one statue to life for five seconds, then freeze again.</p>',
    updated_at = NOW()
WHERE id = '5492daab-50cb-4140-833d-25ead36cd4fe';

-- Story Cards
UPDATE activities
SET description = '<p>Use Story Cards to sharpen listening and bold offers. Pupils are given a set of cards with a character, a setting, and a problem.</p><p><strong>Why it works</strong></p><ul><li>Provides a structured framework for improvisation</li><li>Encourages creative problem-solving</li><li>Builds collaboration and performance skills</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Open floor space. Work in small groups. Props: character, setting and problem cards. About 25 minutes.</p><p><strong>How to play</strong></p><ol><li>Pupils are given a set of cards with a character, a setting, and a problem</li><li>In small groups, they must create and perform a short play that incorporates all three elements</li></ol><p><strong>Teacher tips</strong></p><ul><li>Ask for precision: clear offers, strong focus, and respectful audience behaviour.</li><li>Name what worked after a round (listening, commitment, ensemble timing).</li></ul><p><strong>Make it easier</strong></p><p>Give a clearer prompt or allow a short planning whisper before performing.</p><p><strong>Make it harder</strong></p><p>Require a clear beginning, middle and end within the time limit.</p>',
    updated_at = NOW()
WHERE id = '39f73103-2511-42bd-ab52-df593d283a92';

-- The Emotion Tunnel
UPDATE activities
SET description = '<p>Use The Emotion Tunnel to sharpen listening and bold offers. Pupils form two lines facing each other.</p><p><strong>Why it works</strong></p><ul><li>Introduces complex emotional states</li><li>Develops non-verbal communication and empathy</li><li>A powerful exercise in responding to cues</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. Props: hat and emotion slips. About 15 minutes.</p><p><strong>How to play</strong></p><ol><li>Pupils form two lines facing each other</li><li>One student walks down the middle, and the pupils on each side whisper different emotions or feelings that the person walking should embody</li></ol><p><strong>Teacher tips</strong></p><ul><li>Ask for precision: clear offers, strong focus, and respectful audience behaviour.</li><li>Name what worked after a round (listening, commitment, ensemble timing).</li></ul><p><strong>Make it easier</strong></p><p>Give a clearer prompt or allow a short planning whisper before performing.</p><p><strong>Make it harder</strong></p><p>Raise the challenge with constraints (no words, fixed emotion, or a tighter time limit).</p>',
    updated_at = NOW()
WHERE id = '5bb1a5b6-4f52-4250-9e20-f505525f1815';

-- What's in the Box?
UPDATE activities
SET description = '<p>Use What''s in the Box? to sharpen listening and bold offers. A student mimes opening a box and reacting to the invisible object inside.</p><p><strong>Why it works</strong></p><ul><li>Develops collaborative mime and imagination</li><li>Builds a shared sense of reality in a scene</li><li>Encourages object-based improvisation</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. No props needed. About 15 minutes.</p><p><strong>How to play</strong></p><ol><li>A student mimes opening a box and reacting to the invisible object inside</li><li>Another student then enters and reacts to the same invisible object</li><li>The scene continues with others joining in</li></ol><p><strong>Teacher tips</strong></p><ul><li>Side-coach with short prompts rather than stopping the scene unless safety needs it.</li><li>Ask for precision: clear offers, strong focus, and respectful audience behaviour.</li><li>Name what worked after a round (listening, commitment, ensemble timing).</li></ul><p><strong>Make it easier</strong></p><p>Give a clearer prompt or allow a short planning whisper before performing.</p><p><strong>Make it harder</strong></p><p>Require a clear beginning, middle and end within the time limit.</p><p><strong>Extension</strong></p><p>Replay the strongest 20 seconds and polish one offer.</p>',
    updated_at = NOW()
WHERE id = 'bbfb4851-8f67-40a2-8edb-56cfaa8e947c';

-- The Invisible Rope
UPDATE activities
SET description = '<p>Use The Invisible Rope to sharpen listening and bold offers. In a circle, pupils hold an imaginary rope.</p><p><strong>Why it works</strong></p><ul><li>Builds group focus and synchronisation</li><li>Develops sensory and physical awareness</li><li>A warm-up for ensemble work</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear space so the class can sit or stand in a circle. No props needed. About 10 minutes.</p><p><strong>How to play</strong></p><ol><li>In a circle, pupils hold an imaginary rope</li><li>The ''leader'' can change the rope''s texture, weight, or temperature, and the other pupils must react in unison</li></ol><p><strong>Teacher tips</strong></p><ul><li>Keep the circle tight enough that everyone can see and hear.</li><li>Ask for precision: clear offers, strong focus, and respectful audience behaviour.</li><li>Name what worked after a round (listening, commitment, ensemble timing).</li></ul><p><strong>Make it easier</strong></p><p>Give a clearer prompt or allow a short planning whisper before performing.</p><p><strong>Make it harder</strong></p><p>Demand clearer weight, size and texture so the audience can ''see'' the object.</p>',
    updated_at = NOW()
WHERE id = '4c725e22-a15a-4bf5-8e07-b3c2d567b5fd';

-- The Monologue
UPDATE activities
SET description = '<p>Use The Monologue to sharpen listening and bold offers. Pupils are given a character and a situation, and they must write and perform a short monologue from that character''s perspective.</p><p><strong>Why it works</strong></p><ul><li>Teaches monologue structure and delivery</li><li>Encourages individual character development</li><li>Builds writing and performance skills</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. No props needed. About 25 minutes.</p><p><strong>How to play</strong></p><ol><li>Gather attention and explain the game in one short sentence.</li><li>Pupils are given a character and a situation, and they must write and perform a short monologue from that character''s perspective.</li><li>Play a second round with a fresh prompt, then share one strong moment with the class.</li></ol><p><strong>Teacher tips</strong></p><ul><li>Ask for precision: clear offers, strong focus, and respectful audience behaviour.</li><li>Name what worked after a round (listening, commitment, ensemble timing).</li></ul><p><strong>Make it easier</strong></p><p>Give a clearer prompt or allow a short planning whisper before performing.</p><p><strong>Make it harder</strong></p><p>Raise the challenge with constraints (no words, fixed emotion, or a tighter time limit).</p>',
    updated_at = NOW()
WHERE id = 'f4f54b45-3191-4951-8f50-a09635aafe52';

-- The Newsroom
UPDATE activities
SET description = '<p>Use The Newsroom to sharpen listening and bold offers. Pupils work in groups to create a news show, with a presenter, weather reporter, and on-location correspondents.</p><p><strong>Why it works</strong></p><ul><li>Develops speaking in role and improvisational skills</li><li>Encourages creative thinking and role diversification</li><li>Builds teamwork and communication</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Open floor space with clear pathways. No props needed. About 30 minutes.</p><p><strong>How to play</strong></p><ol><li>Pupils work in groups to create a news show, with a presenter, weather reporter, and on-location correspondents</li><li>They must improvise a full broadcast about a given theme</li></ol><p><strong>Teacher tips</strong></p><ul><li>Side-coach with short prompts rather than stopping the scene unless safety needs it.</li><li>Ask for precision: clear offers, strong focus, and respectful audience behaviour.</li><li>Name what worked after a round (listening, commitment, ensemble timing).</li></ul><p><strong>Make it easier</strong></p><p>Give a clearer prompt or allow a short planning whisper before performing.</p><p><strong>Make it harder</strong></p><p>Raise the challenge with constraints (no words, fixed emotion, or a tighter time limit).</p><p><strong>Extension</strong></p><p>Replay the strongest 20 seconds and polish one offer.</p>',
    updated_at = NOW()
WHERE id = '4b83bb9c-506d-4697-9ee2-7646e0b6a3b4';

-- Rhythm Circle
UPDATE activities
SET description = '<p>Use Rhythm Circle to sharpen listening and bold offers. Pupils sit in a circle and pass a rhythm around by clapping, snapping, or stomping.</p><p><strong>Why it works</strong></p><ul><li>Teaches rhythm, timing, and focus</li><li>Develops auditory and physical memory</li><li>Builds group cohesion and ensemble skills</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear space so the class can sit or stand in a circle. No props needed. About 10 minutes.</p><p><strong>How to play</strong></p><ol><li>Pupils sit in a circle and pass a rhythm around by clapping, snapping, or stomping</li><li>The leader can change the rhythm or speed</li></ol><p><strong>Teacher tips</strong></p><ul><li>Keep the circle tight enough that everyone can see and hear.</li><li>Ask for precision: clear offers, strong focus, and respectful audience behaviour.</li><li>Name what worked after a round (listening, commitment, ensemble timing).</li></ul><p><strong>Make it easier</strong></p><p>Give a clearer prompt or allow a short planning whisper before performing.</p><p><strong>Make it harder</strong></p><p>Raise the challenge with constraints (no words, fixed emotion, or a tighter time limit).</p>',
    updated_at = NOW()
WHERE id = '6fad5b6a-b2c7-403a-94ed-915313b20a8c';

-- The Memory Game
UPDATE activities
SET description = '<p>Use The Memory Game to sharpen listening and bold offers. A group of pupils mimes a series of actions (e.g.</p><p><strong>Why it works</strong></p><ul><li>Sharpens observation and attention to detail</li><li>Builds visual memory</li><li>A fun, focused activity for group work</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Open floor space with clear pathways. Whole class. No props needed. About 15 minutes.</p><p><strong>How to play</strong></p><ol><li>A group of pupils mimes a series of actions (e.g. making a sandwich)</li><li>One person then leaves the room</li><li>The group changes one small detail of the mime, and the person who left has to guess what changed</li></ol><p><strong>Teacher tips</strong></p><ul><li>Ask for precision: clear offers, strong focus, and respectful audience behaviour.</li><li>Name what worked after a round (listening, commitment, ensemble timing).</li></ul><p><strong>Make it easier</strong></p><p>Give a clearer prompt or allow a short planning whisper before performing.</p><p><strong>Make it harder</strong></p><p>Demand clearer weight, size and texture so the audience can ''see'' the object.</p>',
    updated_at = NOW()
WHERE id = 'baad0d75-b9d5-4312-8296-09756584039b';

-- Emotional Body Language
UPDATE activities
SET description = '<p>Use Emotional Body Language to sharpen listening and bold offers. The teacher calls out a list of emotions.</p><p><strong>Why it works</strong></p><ul><li>Teaches the power of physical expression</li><li>Develops body awareness and control</li><li>Focuses on non-verbal communication</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. Props: hat and emotion slips. About 15 minutes.</p><p><strong>How to play</strong></p><ol><li>The teacher calls out a list of emotions</li><li>Pupils must use only their bodies (no faces) to express that emotion for the class to guess</li></ol><p><strong>Teacher tips</strong></p><ul><li>Ask for precision: clear offers, strong focus, and respectful audience behaviour.</li><li>Name what worked after a round (listening, commitment, ensemble timing).</li></ul><p><strong>Make it easier</strong></p><p>Give a clearer prompt or allow a short planning whisper before performing.</p><p><strong>Make it harder</strong></p><p>Raise the challenge with constraints (no words, fixed emotion, or a tighter time limit).</p>',
    updated_at = NOW()
WHERE id = '1667bfe8-5e4b-45c2-92a5-a261fcccd89d';

-- The Soundscape Journey
UPDATE activities
SET description = '<p>Use The Soundscape Journey to sharpen listening and bold offers. The class creates a continuous soundscape of a journey (e.g.</p><p><strong>Why it works</strong></p><ul><li>Builds complex soundscape skills</li><li>Encourages aural storytelling</li><li>Develops ensemble work and active listening</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. No props needed. About 20 minutes.</p><p><strong>How to play</strong></p><ol><li>The class creates a continuous soundscape of a journey (e.g. from the city to the forest)</li><li>They must listen and adapt their sounds as the scene changes</li></ol><p><strong>Teacher tips</strong></p><ul><li>Side-coach with short prompts rather than stopping the scene unless safety needs it.</li><li>Ask for precision: clear offers, strong focus, and respectful audience behaviour.</li><li>Name what worked after a round (listening, commitment, ensemble timing).</li></ul><p><strong>Make it easier</strong></p><p>Give a clearer prompt or allow a short planning whisper before performing.</p><p><strong>Make it harder</strong></p><p>Layer dynamics (loud/soft, near/far) and keep a shared pulse.</p><p><strong>Extension</strong></p><p>Perform the soundscape under a short narrated story.</p>',
    updated_at = NOW()
WHERE id = 'b7b10544-8108-458f-aafb-7d0a7247f125';

-- The Silent Argument
UPDATE activities
SET description = '<p>Use The Silent Argument to sharpen listening and bold offers. In pairs, pupils improvise an argument using only non-verbal communication.</p><p><strong>Why it works</strong></p><ul><li>Teaches the power of non-verbal cues</li><li>Develops physical expression and empathy</li><li>A fun, challenging exercise in communication</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space. Children work in pairs. No props needed. About 10 minutes.</p><p><strong>How to play</strong></p><ol><li>In pairs, pupils improvise an argument using only non-verbal communication</li><li>They must use facial expressions, gestures, and body language to convey their feelings</li></ol><p><strong>Teacher tips</strong></p><ul><li>Model one round first, then swap roles so everyone leads.</li><li>Side-coach with short prompts rather than stopping the scene unless safety needs it.</li><li>Ask for precision: clear offers, strong focus, and respectful audience behaviour.</li></ul><p><strong>Make it easier</strong></p><p>Work as a whole class first, then try with a partner.</p><p><strong>Make it harder</strong></p><p>Raise the challenge with constraints (no words, fixed emotion, or a tighter time limit).</p><p><strong>Extension</strong></p><p>Replay the strongest 20 seconds and polish one offer.</p>',
    updated_at = NOW()
WHERE id = 'e38a3b36-8c75-4fda-afd4-9c00d4f2de44';

-- The Story of Us
UPDATE activities
SET description = '<p>Use The Story of Us to sharpen listening and bold offers. The class works together to create a physical representation of a story from their shared experience (e.g., ''our school trip'', ''a favourite memory'').</p><p><strong>Why it works</strong></p><ul><li>Fosters community and shared narrative</li><li>Encourages creative and personal storytelling</li><li>A powerful way to build group cohesion</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. Whole class. No props needed. About 25 minutes.</p><p><strong>How to play</strong></p><ol><li>The class works together to create a physical representation of a story from their shared experience (e.g., ''our school trip'', ''a favourite memory'')</li><li>They use tableaux and group movement</li></ol><p><strong>Teacher tips</strong></p><ul><li>Use a clear freeze signal (clap, word or drum) and hold stillness for a count of three.</li><li>Ask for precision: clear offers, strong focus, and respectful audience behaviour.</li><li>Name what worked after a round (listening, commitment, ensemble timing).</li></ul><p><strong>Make it easier</strong></p><p>Give a clearer prompt or allow a short planning whisper before performing.</p><p><strong>Make it harder</strong></p><p>Require a clear beginning, middle and end within the time limit.</p><p><strong>Extension</strong></p><p>Bring one statue to life for five seconds, then freeze again.</p>',
    updated_at = NOW()
WHERE id = 'ca745b1e-9e8f-4bf6-815e-50a59e401c33';

-- A Day in the Life
UPDATE activities
SET description = '<p>Use A Day in the Life to sharpen listening and bold offers. Pupils are given a character type (e.g.</p><p><strong>Why it works</strong></p><ul><li>Builds structured improvisation and character work</li><li>Encourages creative thinking and sequencing</li><li>Develops sustained characterisation</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. No props needed. About 20 minutes.</p><p><strong>How to play</strong></p><ol><li>Gather attention and explain the game in one short sentence.</li><li>Pupils are given a character type (e.g. a baker, a rock star) and must improvise a series of short scenes showing a typical day in their life.</li><li>Play a second round with a fresh prompt, then share one strong moment with the class.</li></ol><p><strong>Teacher tips</strong></p><ul><li>Side-coach with short prompts rather than stopping the scene unless safety needs it.</li><li>Ask for precision: clear offers, strong focus, and respectful audience behaviour.</li><li>Name what worked after a round (listening, commitment, ensemble timing).</li></ul><p><strong>Make it easier</strong></p><p>Give a clearer prompt or allow a short planning whisper before performing.</p><p><strong>Make it harder</strong></p><p>Require a clear beginning, middle and end within the time limit.</p><p><strong>Extension</strong></p><p>Replay the strongest 20 seconds and polish one offer.</p>',
    updated_at = NOW()
WHERE id = '9e36397b-b821-476e-951f-8a36aeb13bc1';

-- The Human Chessboard
UPDATE activities
SET description = '<p>Use The Human Chessboard to sharpen listening and bold offers. The floor is treated as a chessboard.</p><p><strong>Why it works</strong></p><ul><li>Combines physical movement with strategic thinking</li><li>Develops following directions and spatial awareness</li><li>A unique, active group game</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. No props needed. About 20 minutes.</p><p><strong>How to play</strong></p><ol><li>The floor is treated as a chessboard</li><li>Pupils take on the role of different chess pieces and must move according to the rules of the game</li><li>A ''grandmaster'' can call out the moves</li></ol><p><strong>Teacher tips</strong></p><ul><li>Ask for precision: clear offers, strong focus, and respectful audience behaviour.</li><li>Name what worked after a round (listening, commitment, ensemble timing).</li></ul><p><strong>Make it easier</strong></p><p>Give a clearer prompt or allow a short planning whisper before performing.</p><p><strong>Make it harder</strong></p><p>Raise the challenge with constraints (no words, fixed emotion, or a tighter time limit).</p>',
    updated_at = NOW()
WHERE id = '088cab66-25d5-44e0-ad62-4eeef486b07c';

-- Pass the Prop
UPDATE activities
SET description = '<p>Use Pass the Prop to sharpen listening and bold offers. Pupils sit in a circle and are given a mundane object (e.g., a stick).</p><p><strong>Why it works</strong></p><ul><li>Encourages creative object work and improvisation</li><li>Builds spontaneous imagination</li><li>Develops non-verbal storytelling</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear space so the class can sit or stand in a circle. Props: one everyday object. About 15 minutes.</p><p><strong>How to play</strong></p><ol><li>Pupils sit in a circle and are given a mundane object (e.g., a stick)</li><li>They must pass the object around, but each person must use it as if it is a different, new object (e.g., a sword, a microphone)</li></ol><p><strong>Teacher tips</strong></p><ul><li>Keep the circle tight enough that everyone can see and hear.</li><li>Ask for precision: clear offers, strong focus, and respectful audience behaviour.</li><li>Name what worked after a round (listening, commitment, ensemble timing).</li></ul><p><strong>Make it easier</strong></p><p>Give a clearer prompt or allow a short planning whisper before performing.</p><p><strong>Make it harder</strong></p><p>Raise the challenge with constraints (no words, fixed emotion, or a tighter time limit).</p>',
    updated_at = NOW()
WHERE id = 'c10f6e7a-5dd9-4ecc-8a72-45af2a1288c1';

-- Story of the Day
UPDATE activities
SET description = '<p>Use Story of the Day to sharpen listening and bold offers. At the end of a session, pupils work together to re-enact a short, funny or interesting story from something that happened that day, using simple dialogue and….</p><p><strong>Why it works</strong></p><ul><li>Encourages observational and reflective drama</li><li>Builds a sense of shared experience</li><li>Ends the session on a creative note</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. No props needed. About 15 minutes.</p><p><strong>How to play</strong></p><ol><li>Gather attention and explain the game in one short sentence.</li><li>At the end of a session, pupils work together to re-enact a short, funny or interesting story from something that happened that day, using simple dialogue and movement.</li><li>Play a second round with a fresh prompt, then share one strong moment with the class.</li></ol><p><strong>Teacher tips</strong></p><ul><li>Side-coach with short prompts rather than stopping the scene unless safety needs it.</li><li>Ask for precision: clear offers, strong focus, and respectful audience behaviour.</li><li>Name what worked after a round (listening, commitment, ensemble timing).</li></ul><p><strong>Make it easier</strong></p><p>Give a clearer prompt or allow a short planning whisper before performing.</p><p><strong>Make it harder</strong></p><p>Require a clear beginning, middle and end within the time limit.</p>',
    updated_at = NOW()
WHERE id = '0c3bfd0d-e931-497c-8c44-3ae2733ee137';

-- Circle of Whispers
UPDATE activities
SET description = '<p>Use Circle of Whispers to sharpen listening and bold offers. Pupils sit in a circle.</p><p><strong>Why it works</strong></p><ul><li>Develops listening and memory skills</li><li>Highlights changes in communication</li><li>A classic, fun communication game</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear space so the class can sit or stand in a circle. No props needed. About 10 minutes.</p><p><strong>How to play</strong></p><ol><li>Pupils sit in a circle</li><li>One person whispers a phrase to the person next to them</li><li>This continues around the circle</li><li>The last person says the phrase aloud</li></ol><p><strong>Teacher tips</strong></p><ul><li>Keep the circle tight enough that everyone can see and hear.</li><li>Ask for precision: clear offers, strong focus, and respectful audience behaviour.</li><li>Name what worked after a round (listening, commitment, ensemble timing).</li></ul><p><strong>Make it easier</strong></p><p>Give a clearer prompt or allow a short planning whisper before performing.</p><p><strong>Make it harder</strong></p><p>Raise the challenge with constraints (no words, fixed emotion, or a tighter time limit).</p>',
    updated_at = NOW()
WHERE id = 'bc25bbdb-b38c-4f8b-b2d6-37b09e511aea';

-- Character Profile
UPDATE activities
SET description = '<p>Use Character Profile to sharpen listening and bold offers. Pupils are given a blank ''character profile'' sheet to fill out.</p><p><strong>Why it works</strong></p><ul><li>Teaches character development and backstory creation</li><li>Encourages individual creativity</li><li>Bridges writing and performance</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. Props: blank character profile sheets. About 25 minutes.</p><p><strong>How to play</strong></p><ol><li>Pupils are given a blank ''character profile'' sheet to fill out</li><li>They then act out their character using the details they''ve created, such as their likes, dislikes, and backstory</li></ol><p><strong>Teacher tips</strong></p><ul><li>Ask for precision: clear offers, strong focus, and respectful audience behaviour.</li><li>Name what worked after a round (listening, commitment, ensemble timing).</li></ul><p><strong>Make it easier</strong></p><p>Give a clearer prompt or allow a short planning whisper before performing.</p><p><strong>Make it harder</strong></p><p>Require a clear beginning, middle and end within the time limit.</p>',
    updated_at = NOW()
WHERE id = '25c05a35-a7b0-4335-92cb-1cf9f2820d65';

-- The Soundscape
UPDATE activities
SET description = '<p>Use The Soundscape to sharpen listening and bold offers. The class is given a theme (e.g., ''a busy marketplace'').</p><p><strong>Why it works</strong></p><ul><li>Builds collaboration and listening skills</li><li>Develops aural world-building</li><li>Encourages creative vocal work</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. No props needed. About 15 minutes.</p><p><strong>How to play</strong></p><ol><li>The class is given a theme (e.g., ''a busy marketplace'')</li><li>Pupils use their voices and bodies to create all the sounds one might hear in that environment, working together to build a complex sound picture</li></ol><p><strong>Teacher tips</strong></p><ul><li>Ask for precision: clear offers, strong focus, and respectful audience behaviour.</li><li>Name what worked after a round (listening, commitment, ensemble timing).</li></ul><p><strong>Make it easier</strong></p><p>Give a clearer prompt or allow a short planning whisper before performing.</p><p><strong>Make it harder</strong></p><p>Layer dynamics (loud/soft, near/far) and keep a shared pulse.</p><p><strong>Extension</strong></p><p>Perform the soundscape under a short narrated story.</p>',
    updated_at = NOW()
WHERE id = 'e979a307-9f0f-4ff1-9f85-4d56291141cf';

-- The Living Diorama
UPDATE activities
SET description = '<p>Use The Living Diorama to sharpen listening and bold offers. Pupils form groups and are given a historical or literary event.</p><p><strong>Why it works</strong></p><ul><li>Links drama to other subjects like history or literature</li><li>Develops creative research and scene-building skills</li><li>Builds an understanding of visual storytelling</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. No props needed. About 25 minutes.</p><p><strong>How to play</strong></p><ol><li>Pupils form groups and are given a historical or literary event</li><li>They must create a living diorama (a frozen scene with no sound) of that event, paying close attention to detail and composition</li></ol><p><strong>Teacher tips</strong></p><ul><li>Side-coach with short prompts rather than stopping the scene unless safety needs it.</li><li>Ask for precision: clear offers, strong focus, and respectful audience behaviour.</li><li>Name what worked after a round (listening, commitment, ensemble timing).</li></ul><p><strong>Make it easier</strong></p><p>Give a clearer prompt or allow a short planning whisper before performing.</p><p><strong>Make it harder</strong></p><p>Layer dynamics (loud/soft, near/far) and keep a shared pulse.</p><p><strong>Extension</strong></p><p>Replay the strongest 20 seconds and polish one offer.</p>',
    updated_at = NOW()
WHERE id = '44c9ca6d-8da5-448a-9c40-9abec567b5d0';

-- Ensemble Walk
UPDATE activities
SET description = '<p>Use Ensemble Walk to sharpen listening and bold offers. Pupils walk around the room, focusing on moving together as a group.</p><p><strong>Why it works</strong></p><ul><li>Builds a strong sense of ensemble and group awareness</li><li>Develops synchronisation and listening skills</li><li>A simple yet powerful warm-up</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Open floor space with clear pathways. Whole class. No props needed. About 10 minutes.</p><p><strong>How to play</strong></p><ol><li>Pupils walk around the room, focusing on moving together as a group</li><li>A leader can change the pace or direction, and the group must respond as one</li></ol><p><strong>Teacher tips</strong></p><ul><li>Ask for precision: clear offers, strong focus, and respectful audience behaviour.</li><li>Name what worked after a round (listening, commitment, ensemble timing).</li></ul><p><strong>Make it easier</strong></p><p>Give a clearer prompt or allow a short planning whisper before performing.</p><p><strong>Make it harder</strong></p><p>Raise the challenge with constraints (no words, fixed emotion, or a tighter time limit).</p>',
    updated_at = NOW()
WHERE id = 'a6f81086-d50e-4bb1-b9dc-846ce56cc203';

-- Character Improv
UPDATE activities
SET description = '<p>Use Character Improv to sharpen listening and bold offers. Pupils are given two contrasting character types (e.g., ''a brave knight'' and ''a timid mouse'').</p><p><strong>Why it works</strong></p><ul><li>Develops versatile and quick characterisation</li><li>Encourages fast-paced improvisation</li><li>Builds confidence in playing different types of roles</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. No props needed. About 15 minutes.</p><p><strong>How to play</strong></p><ol><li>Pupils are given two contrasting character types (e.g., ''a brave knight'' and ''a timid mouse'')</li><li>They must improvise a short scene where they play both characters, switching roles on a cue</li></ol><p><strong>Teacher tips</strong></p><ul><li>Side-coach with short prompts rather than stopping the scene unless safety needs it.</li><li>Ask for precision: clear offers, strong focus, and respectful audience behaviour.</li><li>Name what worked after a round (listening, commitment, ensemble timing).</li></ul><p><strong>Make it easier</strong></p><p>Give a clearer prompt or allow a short planning whisper before performing.</p><p><strong>Make it harder</strong></p><p>Require a clear beginning, middle and end within the time limit.</p><p><strong>Extension</strong></p><p>Replay the strongest 20 seconds and polish one offer.</p>',
    updated_at = NOW()
WHERE id = '62b6c941-3dcd-4ce8-a6c1-305ee0e0523f';

-- Vocal Stretches
UPDATE activities
SET description = '<p>Use Vocal Stretches to sharpen listening and bold offers. Pupils practice vocal warm-up exercises like buzzing, humming, and mouth stretches to prepare their voices for performance.</p><p><strong>Why it works</strong></p><ul><li>Enhances vocal health and control</li><li>Develops articulation and projection</li><li>Builds a sense of physical preparation</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. No props needed. About 5 minutes.</p><p><strong>How to play</strong></p><ol><li>Gather attention and explain the game in one short sentence.</li><li>Pupils practice vocal warm-up exercises like buzzing, humming, and mouth stretches to prepare their voices for performance.</li><li>Play a second round with a fresh prompt, then share one strong moment with the class.</li></ol><p><strong>Teacher tips</strong></p><ul><li>Ask for precision: clear offers, strong focus, and respectful audience behaviour.</li><li>Name what worked after a round (listening, commitment, ensemble timing).</li></ul><p><strong>Make it easier</strong></p><p>Give a clearer prompt or allow a short planning whisper before performing.</p><p><strong>Make it harder</strong></p><p>Raise the challenge with constraints (no words, fixed emotion, or a tighter time limit).</p>',
    updated_at = NOW()
WHERE id = 'e9a9414c-e664-4586-8f25-abac95a0173c';

-- The Three-Part Story
UPDATE activities
SET description = '<p>Use The Three-Part Story to sharpen listening and bold offers. The teacher gives a beginning, middle, and end to a story.</p><p><strong>Why it works</strong></p><ul><li>Provides a framework for narrative creation</li><li>Builds structured storytelling skills</li><li>Encourages collaborative playwriting</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Open floor space. Work in small groups. No props needed. About 25 minutes.</p><p><strong>How to play</strong></p><ol><li>The teacher gives a beginning, middle, and end to a story</li><li>Pupils work in groups to create a short play that fits this structure, filling in the details with their own ideas</li></ol><p><strong>Teacher tips</strong></p><ul><li>Ask for precision: clear offers, strong focus, and respectful audience behaviour.</li><li>Name what worked after a round (listening, commitment, ensemble timing).</li></ul><p><strong>Make it easier</strong></p><p>Give a clearer prompt or allow a short planning whisper before performing.</p><p><strong>Make it harder</strong></p><p>Require a clear beginning, middle and end within the time limit.</p>',
    updated_at = NOW()
WHERE id = 'ce53ad45-edec-4e0d-83c0-f23558119a45';

-- The Human Car
UPDATE activities
SET description = '<p>Use The Human Car to sharpen listening and bold offers. Pupils form a ''car'' with their bodies and must move around the room as one unit, making engine sounds and reacting to imaginary ''traffic''.</p><p><strong>Why it works</strong></p><ul><li>A fun way to teach teamwork and physical synchronisation</li><li>Develops spatial awareness and coordination</li><li>Encourages creative, collaborative movement</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Open floor space with clear pathways. No props needed. About 15 minutes.</p><p><strong>How to play</strong></p><ol><li>Gather attention and explain the game in one short sentence.</li><li>Pupils form a ''car'' with their bodies and must move around the room as one unit, making engine sounds and reacting to imaginary ''traffic''.</li><li>Play a second round with a fresh prompt, then share one strong moment with the class.</li></ol><p><strong>Teacher tips</strong></p><ul><li>Ask for precision: clear offers, strong focus, and respectful audience behaviour.</li><li>Name what worked after a round (listening, commitment, ensemble timing).</li></ul><p><strong>Make it easier</strong></p><p>Give a clearer prompt or allow a short planning whisper before performing.</p><p><strong>Make it harder</strong></p><p>Layer dynamics (loud/soft, near/far) and keep a shared pulse.</p>',
    updated_at = NOW()
WHERE id = 'fe194e2a-050e-4a92-bb81-1c17bcdf0286';

-- The Emotion Swap
UPDATE activities
SET description = '<p>Use The Emotion Swap to sharpen listening and bold offers. In pairs, pupils improvise a simple scene.</p><p><strong>Why it works</strong></p><ul><li>Builds emotional adaptability and quick thinking</li><li>Develops awareness of how emotion changes a scene</li><li>A fun, challenging improvisation game</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space. Children work in pairs. Props: hat and emotion slips. About 15 minutes.</p><p><strong>How to play</strong></p><ol><li>In pairs, pupils improvise a simple scene</li><li>The teacher calls out an emotion, and both pupils must immediately switch to that emotion, changing the tone and direction of the scene</li></ol><p><strong>Teacher tips</strong></p><ul><li>Model one round first, then swap roles so everyone leads.</li><li>Side-coach with short prompts rather than stopping the scene unless safety needs it.</li><li>Ask for precision: clear offers, strong focus, and respectful audience behaviour.</li></ul><p><strong>Make it easier</strong></p><p>Work as a whole class first, then try with a partner.</p><p><strong>Make it harder</strong></p><p>Require a clear beginning, middle and end within the time limit.</p><p><strong>Extension</strong></p><p>Replay the strongest 20 seconds and polish one offer.</p>',
    updated_at = NOW()
WHERE id = '7e4e8de9-579d-4ff4-b459-b3ed2e3f63d1';

-- Table Read
UPDATE activities
SET description = '<p>Use Table Read to sharpen listening and bold offers. Pupils are given a short script (or a script they have written themselves).</p><p><strong>Why it works</strong></p><ul><li>Introduces script work and reading</li><li>Develops vocal performance and clarity</li><li>Builds a foundation for scripted scenes</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear space so the class can sit or stand in a circle. Props: short scripts or student-written scenes. About 20 minutes.</p><p><strong>How to play</strong></p><ol><li>Pupils are given a short script (or a script they have written themselves)</li><li>They sit in a circle and read the script aloud, focusing on vocal performance, tone, and character</li></ol><p><strong>Teacher tips</strong></p><ul><li>Keep the circle tight enough that everyone can see and hear.</li><li>Ask for precision: clear offers, strong focus, and respectful audience behaviour.</li><li>Name what worked after a round (listening, commitment, ensemble timing).</li></ul><p><strong>Make it easier</strong></p><p>Give a clearer prompt or allow a short planning whisper before performing.</p><p><strong>Make it harder</strong></p><p>Raise the challenge with constraints (no words, fixed emotion, or a tighter time limit).</p>',
    updated_at = NOW()
WHERE id = 'b6a2cc63-20a4-4074-9000-ccf3e34c21e9';

-- The Prop Box
UPDATE activities
SET description = '<p>Use The Prop Box to sharpen listening and bold offers. A box is filled with a variety of unusual props.</p><p><strong>Why it works</strong></p><ul><li>Encourages creative thinking and problem-solving</li><li>Builds imaginative use of objects</li><li>Develops spontaneous scene creation</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. Props: a few simple props (scarf, hat, cup). About 20 minutes.</p><p><strong>How to play</strong></p><ol><li>A box is filled with a variety of unusual props</li><li>Pupils take turns reaching in and pulling one out</li><li>They must then create a short, one-minute scene that features the prop in a creative and unexpected way</li></ol><p><strong>Teacher tips</strong></p><ul><li>Side-coach with short prompts rather than stopping the scene unless safety needs it.</li><li>Ask for precision: clear offers, strong focus, and respectful audience behaviour.</li><li>Name what worked after a round (listening, commitment, ensemble timing).</li></ul><p><strong>Make it easier</strong></p><p>Give a clearer prompt or allow a short planning whisper before performing.</p><p><strong>Make it harder</strong></p><p>Require a clear beginning, middle and end within the time limit.</p><p><strong>Extension</strong></p><p>Replay the strongest 20 seconds and polish one offer.</p>',
    updated_at = NOW()
WHERE id = '90706ca0-435e-4c1c-8ff4-75988935c8d6';

-- The Silent Walk
UPDATE activities
SET description = '<p>Use The Silent Walk to sharpen listening and bold offers. The class walks around the room silently.</p><p><strong>Why it works</strong></p><ul><li>A focused exercise for listening and stillness</li><li>Develops self-control and non-verbal communication</li><li>A great way to begin or end a session</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Open floor space with clear pathways. No props needed. About 10 minutes.</p><p><strong>How to play</strong></p><ol><li>The class walks around the room silently</li><li>The teacher claps once to stop, twice to turn and face a partner, and three times to sit down</li></ol><p><strong>Teacher tips</strong></p><ul><li>Model one round first, then swap roles so everyone leads.</li><li>Ask for precision: clear offers, strong focus, and respectful audience behaviour.</li><li>Name what worked after a round (listening, commitment, ensemble timing).</li></ul><p><strong>Make it easier</strong></p><p>Give a clearer prompt or allow a short planning whisper before performing.</p><p><strong>Make it harder</strong></p><p>Raise the challenge with constraints (no words, fixed emotion, or a tighter time limit).</p>',
    updated_at = NOW()
WHERE id = '39f1c958-c3d2-4525-9f23-9a818ea1dc3f';

-- Emotion Machine
UPDATE activities
SET description = '<p>Use Emotion Machine to sharpen listening and bold offers. Pupils work together to create a machine that makes or changes emotions.</p><p><strong>Why it works</strong></p><ul><li>Fosters abstract and creative thinking</li><li>Builds a complex sound and movement piece</li><li>A powerful ensemble exercise</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear floor space for movement. Props: hat and emotion slips. About 15 minutes.</p><p><strong>How to play</strong></p><ol><li>Pupils work together to create a machine that makes or changes emotions</li><li>Each student adds a sound and movement to the machine</li></ol><p><strong>Teacher tips</strong></p><ul><li>Ask for precision: clear offers, strong focus, and respectful audience behaviour.</li><li>Name what worked after a round (listening, commitment, ensemble timing).</li></ul><p><strong>Make it easier</strong></p><p>Give a clearer prompt or allow a short planning whisper before performing.</p><p><strong>Make it harder</strong></p><p>Layer dynamics (loud/soft, near/far) and keep a shared pulse.</p>',
    updated_at = NOW()
WHERE id = '1af23154-e261-4f83-82f5-5f72390903ef';

-- Character Profile Walk
UPDATE activities
SET description = '<p>Use Character Profile Walk to sharpen listening and bold offers. Pupils are given a character profile and walk around the room as that character.</p><p><strong>Why it works</strong></p><ul><li>Develops subtle, internal characterisation</li><li>Encourages brief, purposeful improvisation</li><li>Builds confidence in speaking in role</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Open floor space with clear pathways. No props needed. About 20 minutes.</p><p><strong>How to play</strong></p><ol><li>Pupils are given a character profile and walk around the room as that character</li><li>When they bump into another character, they improvise a short, two-line conversation</li></ol><p><strong>Teacher tips</strong></p><ul><li>Side-coach with short prompts rather than stopping the scene unless safety needs it.</li><li>Ask for precision: clear offers, strong focus, and respectful audience behaviour.</li><li>Name what worked after a round (listening, commitment, ensemble timing).</li></ul><p><strong>Make it easier</strong></p><p>Give a clearer prompt or allow a short planning whisper before performing.</p><p><strong>Make it harder</strong></p><p>Raise the challenge with constraints (no words, fixed emotion, or a tighter time limit).</p><p><strong>Extension</strong></p><p>Replay the strongest 20 seconds and polish one offer.</p>',
    updated_at = NOW()
WHERE id = '9db6d0f9-997b-4476-b809-2f1e3c0d9963';

-- The Story of an Object
UPDATE activities
SET description = '<p>Use The Story of an Object to sharpen listening and bold offers. A student brings in an object from home.</p><p><strong>Why it works</strong></p><ul><li>Links drama to personal experience and objects</li><li>Encourages creative and collaborative storytelling</li><li>Builds a sense of community</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Open floor space with clear pathways. Props: a brought-in object (optional). About 25 minutes.</p><p><strong>How to play</strong></p><ol><li>A student brings in an object from home</li><li>The class then works together to create a short, improvised play that tells the story of that object, from its creation to its journey to the classroom</li></ol><p><strong>Teacher tips</strong></p><ul><li>Side-coach with short prompts rather than stopping the scene unless safety needs it.</li><li>Ask for precision: clear offers, strong focus, and respectful audience behaviour.</li><li>Name what worked after a round (listening, commitment, ensemble timing).</li></ul><p><strong>Make it easier</strong></p><p>Give a clearer prompt or allow a short planning whisper before performing.</p><p><strong>Make it harder</strong></p><p>Require a clear beginning, middle and end within the time limit.</p><p><strong>Extension</strong></p><p>Replay the strongest 20 seconds and polish one offer.</p>',
    updated_at = NOW()
WHERE id = '75fbb81f-3176-47f7-b4d5-01d1972de281';

-- Goodbye Circle
UPDATE activities
SET description = '<p>Use Goodbye Circle to sharpen listening and bold offers. The class stands in a circle.</p><p><strong>Why it works</strong></p><ul><li>Provides a positive and structured end to a session</li><li>Builds a sense of ritual and community</li><li>A fun and energetic way to finish</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Clear space so the class can sit or stand in a circle. No props needed. About 5 minutes.</p><p><strong>How to play</strong></p><ol><li>The class stands in a circle</li><li>The teacher or a student leads a fun, physical goodbye ritual, such as a group bow, a final cheer, or a wave that gets bigger and bigger</li></ol><p><strong>Teacher tips</strong></p><ul><li>Keep the circle tight enough that everyone can see and hear.</li><li>Ask for precision: clear offers, strong focus, and respectful audience behaviour.</li><li>Name what worked after a round (listening, commitment, ensemble timing).</li></ul><p><strong>Make it easier</strong></p><p>Give a clearer prompt or allow a short planning whisper before performing.</p><p><strong>Make it harder</strong></p><p>Raise the challenge with constraints (no words, fixed emotion, or a tighter time limit).</p>',
    updated_at = NOW()
WHERE id = '62f7031a-a529-458e-a374-b51ef84968cc';

-- Bubble Gum Warm Up
UPDATE activities
SET description = '<p>Let''s wake up our faces and imaginations with Bubble Gum Warm Up. We mime a huge piece of chewing gum, pass it around the circle in funny ways, and keep the silliness controlled.</p><p><strong>Why it works</strong></p><ul><li>Warms up facial expression and mime</li><li>Builds turn-taking in a circle</li><li>Encourages playful exaggeration without props</li></ul>',
    activity_text = '<p><strong>Setup</strong></p><p>Sit or stand in a circle with clear floor space. No props needed — the gum is imaginary. About 10 minutes.</p><p><strong>How to play</strong></p><ol><li>Mime taking a piece of chewing gum from your pocket and putting it in your mouth (invent a silly flavour together).</li><li>Chew with big, clear exaggeration so everyone can see.</li><li>Stick the imaginary gum onto the person next to you in a new place each time (nose, shoe, hair, elbow).</li><li>Pass the gum around the circle, each child finding a different way to stick and peel it off.</li><li>Optional finish: stretch the gum between two children, then ''snap'' it and freeze.</li></ol><p><strong>Teacher tips</strong></p><ul><li>Keep it hygiene-friendly: remind children it is pretend gum only.</li><li>Model one clear pass before the circle continues independently.</li><li>Use a freeze cue if the energy gets too wild.</li></ul><p><strong>Make it easier</strong></p><p>Teacher leads the first full circuit while children copy the chew together.</p><p><strong>Make it harder</strong></p><p>Add a rule: no repeating a stick-spot that has already been used.</p><p><strong>Extension</strong></p><p>Invent a tiny story about where the gum came from before you pass it on.</p>',
    updated_at = NOW()
WHERE id = 'bc7a8c5e-d06e-43fe-a25f-179f7e283db9';

-- Expected rows updated: 163
COMMIT;

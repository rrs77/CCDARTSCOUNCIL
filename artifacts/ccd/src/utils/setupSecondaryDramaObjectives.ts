/**
 * Utility to create Secondary Drama curriculum objectives for Year 7 through Year 11
 * (custom objectives for secondary drama).
 *
 * Usage in browser console:
 * 1. Open the app and log in
 * 2. Open browser console (F12)
 * 3. Call: await window.setupSecondaryDramaObjectives()
 */

import { customObjectivesApi } from '../config/customObjectivesApi';

interface DramaAreaData {
  section?: string;
  name: string;
  description?: string;
  objectives: Array<{
    code: string;
    text: string;
    description?: string;
  }>;
}

interface DramaYearGroupData {
  yearGroup: string;
  description: string;
  color: string;
  areas: DramaAreaData[];
}

const YEAR_ORDER = ['Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11'];

export const SECONDARY_DRAMA_CURRICULUM: Record<string, DramaYearGroupData> = {
  'Year 7': {
    yearGroup: 'Year 7 Drama',
    description: 'Year 7 Drama curriculum objectives',
    color: '#A855F7',
    areas: [
      {
        section: 'Creating and Devising',
        name: 'Devising',
        description: 'Creating original drama',
        objectives: [
          { code: 'Y7-DR-D1', text: 'Use improvisation to explore ideas and situations', description: 'Improvisation' },
          { code: 'Y7-DR-D2', text: 'Work with others to create short devised pieces', description: 'Collaborative devising' },
          { code: 'Y7-DR-D3', text: 'Use stimulus (e.g. image, poem, object) to generate drama', description: 'Stimulus-based work' },
          { code: 'Y7-DR-D4', text: 'Show character through voice, movement and gesture', description: 'Characterisation' },
        ]
      },
      {
        section: 'Performing',
        name: 'Performance Skills',
        description: 'Staging and performing',
        objectives: [
          { code: 'Y7-DR-P1', text: 'Perform with clarity so that meaning is communicated to an audience', description: 'Clarity of performance' },
          { code: 'Y7-DR-P2', text: 'Use space and levels effectively in performance', description: 'Use of space' },
          { code: 'Y7-DR-P3', text: 'Use voice appropriately for character and situation', description: 'Vocal skills' },
          { code: 'Y7-DR-P4', text: 'Respond to direction and refine work in rehearsal', description: 'Rehearsal discipline' },
        ]
      },
      {
        section: 'Understanding and Evaluating',
        name: 'Drama and Theatre Appreciation',
        description: 'Analysing and evaluating drama',
        objectives: [
          { code: 'Y7-DR-U1', text: 'Describe what you see and hear in drama using drama vocabulary', description: 'Drama vocabulary' },
          { code: 'Y7-DR-U2', text: 'Identify strengths and areas for improvement in own and others\' work', description: 'Evaluation' },
          { code: 'Y7-DR-U3', text: 'Recognise how drama can reflect different times and cultures', description: 'Context and culture' },
        ]
      }
    ]
  },
  'Year 8': {
    yearGroup: 'Year 8 Drama',
    description: 'Year 8 Drama curriculum objectives',
    color: '#9333EA',
    areas: [
      {
        section: 'Creating and Devising',
        name: 'Devising',
        description: 'Developing devised work',
        objectives: [
          { code: 'Y8-DR-D1', text: 'Use a range of devising techniques to explore themes and issues', description: 'Devising techniques' },
          { code: 'Y8-DR-D2', text: 'Create and sustain character with clear motivation', description: 'Character motivation' },
          { code: 'Y8-DR-D3', text: 'Structure devised work with a clear beginning, middle and end', description: 'Structure' },
          { code: 'Y8-DR-D4', text: 'Use dramatic conventions (e.g. freeze-frame, thought-tracking) purposefully', description: 'Dramatic conventions' },
        ]
      },
      {
        section: 'Performing',
        name: 'Performance Skills',
        description: 'Developing performance',
        objectives: [
          { code: 'Y8-DR-P1', text: 'Perform with confidence and commitment to an audience', description: 'Commitment' },
          { code: 'Y8-DR-P2', text: 'Use pace, pause and emphasis to create meaning', description: 'Pace and emphasis' },
          { code: 'Y8-DR-P3', text: 'Work effectively in ensemble and support others in performance', description: 'Ensemble work' },
          { code: 'Y8-DR-P4', text: 'Apply rehearsal techniques to improve and polish performance', description: 'Rehearsal process' },
        ]
      },
      {
        section: 'Understanding and Evaluating',
        name: 'Drama and Theatre Appreciation',
        description: 'Analysis and evaluation',
        objectives: [
          { code: 'Y8-DR-U1', text: 'Analyse how drama techniques are used to create meaning and effect', description: 'Analysis of techniques' },
          { code: 'Y8-DR-U2', text: 'Evaluate performances using subject terminology', description: 'Subject terminology' },
          { code: 'Y8-DR-U3', text: 'Understand how context (social, historical, cultural) influences drama', description: 'Context' },
        ]
      }
    ]
  },
  'Year 9': {
    yearGroup: 'Year 9 Drama',
    description: 'Year 9 Drama curriculum objectives',
    color: '#7C3AED',
    areas: [
      {
        section: 'Creating and Devising',
        name: 'Devising',
        description: 'Sophisticated devising',
        objectives: [
          { code: 'Y9-DR-D1', text: 'Devise drama that explores complex themes and communicates clear intentions', description: 'Thematic devising' },
          { code: 'Y9-DR-D2', text: 'Use research to inform characterisation and context', description: 'Research-based devising' },
          { code: 'Y9-DR-D3', text: 'Make deliberate choices about form, style and convention', description: 'Form and style' },
          { code: 'Y9-DR-D4', text: 'Develop ideas through experimentation and refinement', description: 'Development process' },
        ]
      },
      {
        section: 'Performing',
        name: 'Performance Skills',
        description: 'Scripted and devised performance',
        objectives: [
          { code: 'Y9-DR-P1', text: 'Interpret script or devised material with clear artistic choices', description: 'Interpretation' },
          { code: 'Y9-DR-P2', text: 'Use physical and vocal skills to create believable character', description: 'Physical and vocal' },
          { code: 'Y9-DR-P3', text: 'Engage an audience through focus, energy and clarity', description: 'Audience engagement' },
          { code: 'Y9-DR-P4', text: 'Contribute to directorial decisions and staging', description: 'Directorial contribution' },
        ]
      },
      {
        section: 'Understanding and Evaluating',
        name: 'Drama and Theatre Appreciation',
        description: 'Critical understanding',
        objectives: [
          { code: 'Y9-DR-U1', text: 'Analyse how performers, designers and directors create meaning', description: 'Meaning and intention' },
          { code: 'Y9-DR-U2', text: 'Evaluate the effectiveness of drama in communicating ideas', description: 'Effectiveness' },
          { code: 'Y9-DR-U3', text: 'Compare different productions or interpretations of drama', description: 'Comparison' },
        ]
      }
    ]
  },
  'Year 10': {
    yearGroup: 'Year 10 Drama',
    description: 'Year 10 Drama curriculum objectives (KS4)',
    color: '#6D28D9',
    areas: [
      {
        section: 'Creating and Devising',
        name: 'Devising',
        description: 'Devised drama for assessment',
        objectives: [
          { code: 'Y10-DR-D1', text: 'Create original devised drama from a stimulus with clear intention', description: 'Intentional devising' },
          { code: 'Y10-DR-D2', text: 'Apply a range of devising strategies and document the process', description: 'Process and documentation' },
          { code: 'Y10-DR-D3', text: 'Use genre, style and convention purposefully to communicate meaning', description: 'Genre and style' },
          { code: 'Y10-DR-D4', text: 'Refine devised work in response to feedback and evaluation', description: 'Refinement' },
        ]
      },
      {
        section: 'Performing',
        name: 'Performance Skills',
        description: 'Performance from text and devised',
        objectives: [
          { code: 'Y10-DR-P1', text: 'Perform with technical control and artistic interpretation', description: 'Technical and artistic' },
          { code: 'Y10-DR-P2', text: 'Realise text or devised material with clear directorial vision', description: 'Realisation' },
          { code: 'Y10-DR-P3', text: 'Use performance space and design elements effectively', description: 'Space and design' },
          { code: 'Y10-DR-P4', text: 'Sustain character and focus throughout performance', description: 'Sustained performance' },
        ]
      },
      {
        section: 'Understanding and Evaluating',
        name: 'Drama and Theatre Appreciation',
        description: 'Analysis and evaluation of live theatre',
        objectives: [
          { code: 'Y10-DR-U1', text: 'Analyse and evaluate live theatre using subject terminology', description: 'Theatre analysis' },
          { code: 'Y10-DR-U2', text: 'Understand the roles of performer, designer and director', description: 'Theatre roles' },
          { code: 'Y10-DR-U3', text: 'Consider how context and production choices affect meaning', description: 'Context and production' },
        ]
      },
      {
        section: 'Design',
        name: 'Design Skills',
        description: 'Set, costume, lighting, sound (optional strand)',
        objectives: [
          { code: 'Y10-DR-X1', text: 'Use set, costume, lighting or sound to support meaning and atmosphere', description: 'Design for meaning' },
          { code: 'Y10-DR-X2', text: 'Make and justify design choices in relation to text or theme', description: 'Justified design' },
        ]
      }
    ]
  },
  'Year 11': {
    yearGroup: 'Year 11 Drama',
    description: 'Year 11 Drama curriculum objectives (KS4)',
    color: '#5B21B6',
    areas: [
      {
        section: 'Creating and Devising',
        name: 'Devising',
        description: 'Mature devised work',
        objectives: [
          { code: 'Y11-DR-D1', text: 'Devise coherent drama that communicates complex ideas to an audience', description: 'Coherent devising' },
          { code: 'Y11-DR-D2', text: 'Demonstrate a clear devising process with evidence of development', description: 'Process evidence' },
          { code: 'Y11-DR-D3', text: 'Select and use form, structure and convention to best serve intention', description: 'Form and structure' },
          { code: 'Y11-DR-D4', text: 'Evaluate and improve own devising through critical reflection', description: 'Critical reflection' },
        ]
      },
      {
        section: 'Performing',
        name: 'Performance Skills',
        description: 'Performance for assessment',
        objectives: [
          { code: 'Y11-DR-P1', text: 'Perform with consistency, control and clear artistic choices', description: 'Consistent performance' },
          { code: 'Y11-DR-P2', text: 'Interpret text or devised piece with originality and clarity', description: 'Original interpretation' },
          { code: 'Y11-DR-P3', text: 'Collaborate effectively in rehearsal and performance', description: 'Collaboration' },
          { code: 'Y11-DR-P4', text: 'Present work that is appropriate to audience and purpose', description: 'Audience and purpose' },
        ]
      },
      {
        section: 'Understanding and Evaluating',
        name: 'Drama and Theatre Appreciation',
        description: 'Critical analysis of theatre',
        objectives: [
          { code: 'Y11-DR-U1', text: 'Analyse and evaluate live theatre with detailed use of subject terminology', description: 'Detailed analysis' },
          { code: 'Y11-DR-U2', text: 'Explain how performance and design elements create meaning and effect', description: 'Meaning and effect' },
          { code: 'Y11-DR-U3', text: 'Consider the impact of social, historical and cultural context on drama', description: 'Contextual understanding' },
        ]
      },
      {
        section: 'Design',
        name: 'Design Skills',
        description: 'Design for performance',
        objectives: [
          { code: 'Y11-DR-X1', text: 'Create design concepts that enhance and clarify meaning in performance', description: 'Design concepts' },
          { code: 'Y11-DR-X2', text: 'Justify design decisions with reference to intention and context', description: 'Justified design decisions' },
        ]
      }
    ]
  }
};

/**
 * Create Secondary Drama curriculum objectives for Year 7 through Year 11
 */
export async function setupSecondaryDramaObjectives() {
  console.log('Setting up Secondary Drama curriculum objectives (Year 7 – Year 11)...\n');

  const results: Array<{ yearGroup: string; success: boolean; yearGroupId?: string; error?: string }> = [];

  for (const yearName of YEAR_ORDER) {
    const curriculum = SECONDARY_DRAMA_CURRICULUM[yearName];
    if (!curriculum) {
      console.error(`No curriculum data for ${yearName}`);
      results.push({ yearGroup: yearName, success: false, error: 'No curriculum data' });
      continue;
    }

    try {
      console.log(`\nProcessing ${curriculum.yearGroup}...`);

      const existingYearGroups = await customObjectivesApi.yearGroups.getAll();
      let yearGroup = existingYearGroups.find(yg => yg.name === curriculum.yearGroup);

      if (!yearGroup) {
        console.log(`  Creating year group: ${curriculum.yearGroup}...`);
        yearGroup = await customObjectivesApi.yearGroups.create({
          name: curriculum.yearGroup,
          description: curriculum.description,
          color: curriculum.color,
          sort_order: YEAR_ORDER.indexOf(yearName)
        });
        console.log('  Year group created.');
      } else {
        console.log(`  Year group already exists: ${curriculum.yearGroup}`);
      }

      const existingAreas = await customObjectivesApi.areas.getByYearGroup(yearGroup.id);

      for (const areaData of curriculum.areas) {
        let area = existingAreas.find(a => a.name === areaData.name && a.section === areaData.section);

        if (!area) {
          console.log(`  Creating area: ${areaData.name}...`);
          area = await customObjectivesApi.areas.create({
            year_group_id: yearGroup.id,
            section: areaData.section,
            name: areaData.name,
            description: areaData.description,
            sort_order: curriculum.areas.indexOf(areaData)
          });
          console.log(`  Area created: ${areaData.name}`);
        } else {
          console.log(`  Area already exists: ${areaData.name}`);
        }

        const existingObjectives = await customObjectivesApi.objectives.getByArea(area.id);

        for (const objectiveData of areaData.objectives) {
          const existingObjective = existingObjectives.find(obj => obj.objective_code === objectiveData.code);

          if (!existingObjective) {
            console.log(`    Creating objective: ${objectiveData.code} - ${objectiveData.text.substring(0, 50)}...`);
            await customObjectivesApi.objectives.create({
              area_id: area.id,
              objective_code: objectiveData.code,
              objective_text: objectiveData.text,
              description: objectiveData.description,
              sort_order: areaData.objectives.indexOf(objectiveData)
            });
          } else {
            console.log(`    Objective already exists: ${objectiveData.code}`);
          }
        }
      }

      console.log(`  ${curriculum.yearGroup} completed.`);
      results.push({ yearGroup: yearName, success: true, yearGroupId: yearGroup.id });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`  Error processing ${curriculum.yearGroup}:`, error);
      results.push({ yearGroup: yearName, success: false, error: message });
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  console.log(`Successfully created: ${successful.length} year groups`);
  successful.forEach(r => console.log(`   - ${r.yearGroup}`));
  if (failed.length > 0) {
    console.log(`\nFailed: ${failed.length} year groups`);
    failed.forEach(r => console.log(`   - ${r.yearGroup}: ${r.error}`));
  }
  console.log('\nNext: Settings → Custom Objectives to view Year 7 Drama through Year 11 Drama.');

  return { success: failed.length === 0, results };
}

if (typeof window !== 'undefined') {
  (window as unknown as { setupSecondaryDramaObjectives: typeof setupSecondaryDramaObjectives }).setupSecondaryDramaObjectives = setupSecondaryDramaObjectives;
}

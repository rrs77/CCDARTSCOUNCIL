import { supabase, TABLES, isSupabaseConfigured } from './supabase';
import type { Activity, LessonData, LessonPlan } from '../contexts/DataContext';

// API endpoints for activities
// Helper function to get current user ID
const getCurrentUserId = () => {
  let userId = localStorage.getItem('rhythmstix_user_id');
  if (!userId) {
    userId = '1';
    localStorage.setItem('rhythmstix_user_id', userId);
    if (import.meta.env.DEV) console.log('🔑 Created default user ID:', userId);
  }
  return userId;
};

/** True if id looks like a Supabase auth UUID (used for RLS user_id). */
const isAuthUserId = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

export const activitiesApi = {
  getAll: async () => {
    try {
      const userId = getCurrentUserId();
      
      if (import.meta.env.DEV) console.log('🔄 Loading activities from Supabase...', { userId, hasUserId: !!userId });
      
      // Always load ALL activities (for backwards compatibility and shared activities)
      // This ensures activities are visible even if user_id filtering would hide them
      // Use select('*') to get all columns automatically (avoids column name issues)
      let { data, error } = await supabase
        .from(TABLES.ACTIVITIES)
        .select('*');
      
      if (error) {
        console.error('❌ Error loading activities:', error);
        // Log the full error for debugging
        console.error('Error details:', JSON.stringify(error, null, 2));
        throw error;
      }
      
      console.log(`📦 Loaded ${data?.length || 0} activities from Supabase (all users)`);
      
      if (!data || data.length === 0) {
        console.warn('⚠️ No activities found in Supabase');
        return [];
      }
      
      // Convert snake_case to camelCase for frontend
      return data.map(item => ({
        _id: item.id,
        activity: item.activity,
        description: item.description,
        activityText: item.activity_text,
        descriptionHeading: item.description_heading || 'Introduction/Context',
        activityHeading: item.activity_heading || 'Activity',
        linkHeading: item.link_heading || 'Additional Link',
        time: item.time,
        videoLink: item.video_link,
        musicLink: item.music_link,
        backingLink: item.backing_link,
        resourceLink: item.resource_link,
        link: item.link,
        vocalsLink: item.vocals_link,
        imageLink: item.image_link,
        canvaLink: item.canva_link || '',
        teachingUnit: item.teaching_unit,
        category: item.category,
        level: item.level,
        unitName: item.unit_name,
        lessonNumber: item.lesson_number,
        eyfsStandards: item.eyfs_standards,
        yearGroups: (item.yeargroups || item.year_groups || []) // Map yeargroups from database (handle both column names)
      }));
    } catch (error) {
      console.warn('Failed to get activities from Supabase:', error);
      throw error;
    }
  },
  
  create: async (activity: Activity) => {
    try {
      // Convert camelCase to snake_case for database
      const { uniqueId, ...activityData } = activity;
      const dbActivity = {
        activity: activityData.activity,
        description: activityData.description,
        activity_text: activityData.activityText,
        description_heading: activityData.descriptionHeading || 'Introduction/Context',
        activity_heading: activityData.activityHeading || 'Activity',
        link_heading: activityData.linkHeading || 'Additional Link',
        time: activityData.time,
        video_link: activityData.videoLink,
        music_link: activityData.musicLink,
        backing_link: activityData.backingLink,
        resource_link: activityData.resourceLink,
        link: activityData.link,
        vocals_link: activityData.vocalsLink,
        image_link: activityData.imageLink,
        canva_link: activityData.canvaLink || '',
        teaching_unit: activityData.teachingUnit,
        category: activityData.category,
        level: activityData.level,
        unit_name: activityData.unitName,
        lesson_number: activityData.lessonNumber,
        eyfs_standards: activityData.eyfsStandards,
        yeargroups: Array.isArray(activityData.yearGroups) ? activityData.yearGroups : [] // CRITICAL: Save yearGroups
      };
      
      console.log('💾 Creating activity in Supabase with all fields:', {
        activity: dbActivity.activity,
        description_heading: dbActivity.description_heading,
        activity_heading: dbActivity.activity_heading,
        yeargroups: dbActivity.yeargroups,
        yeargroupsLength: dbActivity.yeargroups.length
      });
      
      const { data, error } = await supabase
        .from(TABLES.ACTIVITIES)
        .insert([dbActivity])
        .select()
        .single();
      
      if (error) {
        console.error('❌ Supabase insert error:', error);
        throw error;
      }
      
      console.log('✅ Activity created in Supabase:', data.id);
      
      // Convert back to camelCase for frontend
      return {
        _id: data.id,
        activity: data.activity,
        description: data.description,
        activityText: data.activity_text,
        descriptionHeading: data.description_heading || 'Introduction/Context',
        activityHeading: data.activity_heading || 'Activity',
        linkHeading: data.link_heading || 'Additional Link',
        time: data.time,
        videoLink: data.video_link,
        musicLink: data.music_link,
        backingLink: data.backing_link,
        resourceLink: data.resource_link,
        link: data.link,
        vocalsLink: data.vocals_link,
        imageLink: data.image_link,
        canvaLink: data.canva_link || '',
        teachingUnit: data.teaching_unit,
        category: data.category,
        level: data.level,
        unitName: data.unit_name,
        lessonNumber: data.lesson_number,
        eyfsStandards: data.eyfs_standards,
        yearGroups: Array.isArray(data.yeargroups) ? data.yeargroups : (data.yeargroups ? [data.yeargroups] : []) // CRITICAL: Return yearGroups
      };
    } catch (error) {
      console.error('❌ Failed to create activity in Supabase:', error);
      throw error;
    }
  },
  
  update: async (id: string, activity: Activity) => {
    try {
      // Convert camelCase to snake_case for database
      const { uniqueId, ...activityData } = activity;
      const dbActivity = {
        activity: activityData.activity,
        description: activityData.description,
        activity_text: activityData.activityText,
        description_heading: activityData.descriptionHeading || 'Introduction/Context',
        activity_heading: activityData.activityHeading || 'Activity',
        link_heading: activityData.linkHeading || 'Additional Link',
        time: activityData.time,
        video_link: activityData.videoLink,
        music_link: activityData.musicLink,
        backing_link: activityData.backingLink,
        resource_link: activityData.resourceLink,
        link: activityData.link,
        vocals_link: activityData.vocalsLink,
        image_link: activityData.imageLink,
        canva_link: activityData.canvaLink || '',
        teaching_unit: activityData.teachingUnit,
        category: activityData.category,
        level: activityData.level,
        unit_name: activityData.unitName,
        lesson_number: activityData.lessonNumber,
        eyfs_standards: activityData.eyfsStandards,
        yeargroups: Array.isArray(activityData.yearGroups) ? activityData.yearGroups : [] // CRITICAL: Save yearGroups
      };
      
      console.log('💾 Updating activity in Supabase with yearGroups:', {
        id,
        activity: dbActivity.activity,
        yeargroups: dbActivity.yeargroups,
        yeargroupsLength: dbActivity.yeargroups.length
      });
      
      const { data, error } = await supabase
        .from(TABLES.ACTIVITIES)
        .update(dbActivity)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Convert back to camelCase for frontend
      return {
        _id: data.id,
        activity: data.activity,
        description: data.description,
        activityText: data.activity_text,
        descriptionHeading: data.description_heading || 'Introduction/Context',
        activityHeading: data.activity_heading || 'Activity',
        linkHeading: data.link_heading || 'Additional Link',
        time: data.time,
        videoLink: data.video_link,
        musicLink: data.music_link,
        backingLink: data.backing_link,
        resourceLink: data.resource_link,
        link: data.link,
        vocalsLink: data.vocals_link,
        imageLink: data.image_link,
        canvaLink: data.canva_link || '',
        teachingUnit: data.teaching_unit,
        category: data.category,
        level: data.level,
        unitName: data.unit_name,
        lessonNumber: data.lesson_number,
        eyfsStandards: data.eyfs_standards,
        yearGroups: Array.isArray(data.yeargroups) ? data.yeargroups : (data.yeargroups ? [data.yeargroups] : []) // CRITICAL: Return yearGroups
      };
    } catch (error) {
      console.warn('Failed to update activity in Supabase:', error);
      throw error;
    }
  },
  
  delete: async (id: string) => {
    try {
      const { error } = await supabase
        .from(TABLES.ACTIVITIES)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.warn('Failed to delete activity from Supabase:', error);
      throw error;
    }
  },
  
  import: async (activities: Activity[]) => {
    try {
      // Convert camelCase to snake_case for database
      const cleanedActivities = activities.map(({ uniqueId, ...activity }) => ({
        activity: activity.activity,
        description: activity.description,
        activity_text: activity.activityText,
        time: activity.time,
        video_link: activity.videoLink,
        music_link: activity.musicLink,
        backing_link: activity.backingLink,
        resource_link: activity.resourceLink,
        link: activity.link,
        vocals_link: activity.vocalsLink,
        image_link: activity.imageLink,
        canva_link: activity.canvaLink || '',
        teaching_unit: activity.teachingUnit,
        category: activity.category,
        level: activity.level,
        unit_name: activity.unitName,
        lesson_number: activity.lessonNumber,
        eyfs_standards: activity.eyfsStandards
      }));
      
      // Use upsert with the correct constraint
      const { data, error } = await supabase
        .from(TABLES.ACTIVITIES)
        .upsert(cleanedActivities, { 
          onConflict: 'activity,category,lesson_number',
          ignoreDuplicates: false
        });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.warn('Failed to import activities to Supabase:', error);
      throw error;
    }
  }
};

// API endpoints for lessons
export const lessonsApi = {
  getBySheet: async (sheet: string, academicYear?: string) => {
    try {
      if (import.meta.env.DEV) console.log(`🔍 Fetching lessons for ${sheet} (${academicYear || 'default'}) from Supabase...`);
      
      // Determine which academic years to query
      const academicYearsToQuery: string[] = [];
      if (academicYear) {
        academicYearsToQuery.push(academicYear);
        // Also include 2025-2026 when querying for 2026-2027
        if (academicYear === '2026-2027') {
          academicYearsToQuery.push('2025-2026');
        }
      }
      
      // Query for all relevant academic years
      const queries = academicYearsToQuery.length > 0
        ? academicYearsToQuery.map(year => 
            supabase
              .from(TABLES.LESSONS)
              .select('*')
              .eq('sheet_name', sheet)
              .eq('academic_year', year)
              .maybeSingle()
          )
        : [
            supabase
              .from(TABLES.LESSONS)
              .select('*')
              .eq('sheet_name', sheet)
              .maybeSingle()
          ];
      
      const results = await Promise.all(queries);
      
      // Merge data from all academic years
      let mergedData: any = {
        allLessonsData: {},
        lessonNumbers: [],
        teachingUnits: [],
        lessonStandards: {}
      };
      
      let hasData = false;
      
      for (const result of results) {
        const { data, error } = result;
        
        if (error) {
          console.warn('⚠️ Supabase lessons query error for one academic year:', {
            message: error.message,
            sheet,
            academicYear
          });
          continue; // Skip this year but continue with others
        }
        
        if (data) {
          hasData = true;
          if (import.meta.env.DEV) console.log('🔍 Lessons from Supabase:', data.sheet_name, data.academic_year, data.data ? Object.keys(data.data).length : 0, 'lessons');
          // Merge lesson data
          if (data.data) {
            mergedData.allLessonsData = {
              ...mergedData.allLessonsData,
              ...data.data
            };
          }
          // Merge lesson numbers (deduplicate)
          if (data.lesson_numbers) {
            mergedData.lessonNumbers = [
              ...new Set([...mergedData.lessonNumbers, ...data.lesson_numbers])
            ];
          }
          // Merge teaching units (deduplicate)
          if (data.teaching_units) {
            mergedData.teachingUnits = [
              ...new Set([...mergedData.teachingUnits, ...data.teaching_units])
            ];
          }
        }
      }
      
      if (!hasData) return null;
      if (import.meta.env.DEV) console.log('✅ Lessons loaded:', Object.keys(mergedData.allLessonsData).length, 'merged');
      return mergedData;
    } catch (error) {
      console.error(`❌ Failed to get lessons for ${sheet} (${academicYear || 'default'}) from Supabase:`, error);
      throw error;
    }
  },
  
  updateSheet: async (sheet: string, data: any, academicYear?: string) => {
    try {
      const year = academicYear || '2025-2026';
      
      // First, check if a record exists for this sheet and academic year
      // Note: lessons table doesn't have an 'id' column, it uses sheet_name + academic_year as composite key
      const { data: existingRecord, error: checkError } = await supabase
        .from(TABLES.LESSONS)
        .select('sheet_name, academic_year')
        .eq('sheet_name', sheet)
        .eq('academic_year', year)
        .maybeSingle();
      
      if (checkError) {
        console.warn('Error checking for existing lessons record:', checkError);
        throw checkError;
      }
      
      const userId = getCurrentUserId();
      const lessonData: Record<string, unknown> = {
        sheet_name: sheet,
        academic_year: year,
        data: data.allLessonsData ?? {},
        lesson_numbers: data.lessonNumbers ?? [],
        teaching_units: data.teachingUnits ?? [],
        notes: data.notes ?? ''
      };
      if (isAuthUserId(userId)) {
        lessonData.user_id = userId;
      }

      if (existingRecord) {
        // Update existing record
        const { error: updateError } = await supabase
          .from(TABLES.LESSONS)
          .update(lessonData)
          .eq('sheet_name', sheet)
          .eq('academic_year', year);
        
        if (updateError) throw updateError;
        console.log(`✅ Updated lessons for ${sheet} (${year})`);
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from(TABLES.LESSONS)
          .insert(lessonData);
        
        if (insertError) throw insertError;
        console.log(`✅ Created lessons for ${sheet} (${year})`);
      }
      
      return { success: true };
    } catch (error) {
      console.error(`❌ Failed to update lessons for ${sheet} (${academicYear || 'default'}) in Supabase:`, error);
      throw error;
    }
  },
  
  updateLessonNotes: async (sheet: string, lessonNumber: string, notes: string) => {
    try {
      // Get current lesson data
      const { data: currentData, error: fetchError } = await supabase
        .from(TABLES.LESSONS)
        .select('data')
        .eq('sheet_name', sheet)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Update the specific lesson's notes in the data structure
      const updatedData = {
        ...currentData.data,
        [lessonNumber]: {
          ...currentData.data[lessonNumber],
          notes: notes
        }
      };
      
      // Save back to Supabase
      const { error } = await supabase
        .from(TABLES.LESSONS)
        .update({
          data: updatedData,
          updated_at: new Date().toISOString()
        })
        .eq('sheet_name', sheet);
      
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.warn(`Failed to update lesson notes for ${sheet}:${lessonNumber}:`, error);
      throw error;
    }
  },
  
  // Delete all lessons for a specific sheet and academic year
  deleteBySheet: async (sheet: string, academicYear?: string) => {
    try {
      const query = supabase
        .from(TABLES.LESSONS)
        .delete()
        .eq('sheet_name', sheet);
      
      if (academicYear) {
        query.eq('academic_year', academicYear);
      }
      
      const { error } = await query;
      
      if (error) throw error;
      console.log(`✅ Deleted lessons for ${sheet}${academicYear ? ` (${academicYear})` : ''}`);
      return { success: true };
    } catch (error) {
      console.error(`❌ Failed to delete lessons for ${sheet}:`, error);
      throw error;
    }
  },
  
  // Delete ALL lessons from Supabase (use with caution!)
  deleteAll: async () => {
    try {
      const { error } = await supabase
        .from(TABLES.LESSONS)
        .delete()
        .neq('sheet_name', ''); // Delete all rows
      
      if (error) throw error;
      console.log('✅ Deleted all lessons from Supabase');
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to delete all lessons:', error);
      throw error;
    }
  }
};

// API endpoints for lesson plans
export const lessonPlansApi = {
  getAll: async () => {
    try {
      const { data, error } = await supabase
        .from(TABLES.LESSON_PLANS)
        .select('*');
      
      if (error) throw error;
      
      // Convert dates from strings to Date objects
      return (data || []).map(plan => ({
        ...plan,
        date: new Date(plan.date),
        createdAt: new Date(plan.created_at),
        updatedAt: new Date(plan.updated_at)
      }));
    } catch (error) {
      console.warn('Failed to get lesson plans from Supabase:', error);
      throw error;
    }
  },
  
  create: async (plan: LessonPlan) => {
    try {
      const userId = getCurrentUserId();
      const row: Record<string, unknown> = {
        date: plan.date.toISOString(),
        week: plan.week,
        class_name: plan.className,
        activities: plan.activities,
        duration: plan.duration,
        notes: plan.notes,
        status: plan.status,
        unit_id: plan.unitId,
        unit_name: plan.unitName,
        lesson_number: plan.lessonNumber,
        title: plan.title,
        term: plan.term,
        time: plan.time
      };
      if (isAuthUserId(userId)) {
        row.user_id = userId;
      }
      const { data, error } = await supabase
        .from(TABLES.LESSON_PLANS)
        .insert([row])
        .select()
        .single();
      
      if (error) throw error;
      
      // Convert back to camelCase for frontend
      return {
        ...data,
        id: data.id,
        className: data.class_name,
        unitId: data.unit_id,
        unitName: data.unit_name,
        lessonNumber: data.lesson_number,
        date: new Date(data.date),
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    } catch (error) {
      console.warn('Failed to create lesson plan in Supabase:', error);
      throw error;
    }
  },
  
  update: async (id: string, plan: LessonPlan) => {
    try {
      // Convert to snake_case for database
      const { data, error } = await supabase
        .from(TABLES.LESSON_PLANS)
        .update({
          date: plan.date.toISOString(),
          week: plan.week,
          class_name: plan.className,
          activities: plan.activities,
          duration: plan.duration,
          notes: plan.notes,
          status: plan.status,
          unit_id: plan.unitId,
          unit_name: plan.unitName,
          lesson_number: plan.lessonNumber,
          title: plan.title,
          term: plan.term,
          time: plan.time
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Convert back to camelCase for frontend
      return {
        ...data,
        id: data.id,
        className: data.class_name,
        unitId: data.unit_id,
        unitName: data.unit_name,
        lessonNumber: data.lesson_number,
        date: new Date(data.date),
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    } catch (error) {
      console.warn('Failed to update lesson plan in Supabase:', error);
      throw error;
    }
  },
  
  delete: async (id: string) => {
    try {
      const { error } = await supabase
        .from(TABLES.LESSON_PLANS)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.warn('Failed to delete lesson plan from Supabase:', error);
      throw error;
    }
  },
  
  // Delete all lesson plans from Supabase (use with caution!)
  deleteAll: async () => {
    try {
      const { error } = await supabase
        .from(TABLES.LESSON_PLANS)
        .delete()
        .neq('id', ''); // Delete all rows
      
      if (error) throw error;
      console.log('✅ Deleted all lesson plans from Supabase');
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to delete all lesson plans:', error);
      throw error;
    }
  }
};

// API endpoints for EYFS standards
export const eyfsApi = {
  getBySheet: async (sheet: string) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.EYFS_STATEMENTS)
        .select('*')
        .eq('sheet_name', sheet)
        .maybeSingle();
      
      if (error) throw error;
      
      if (!data) {
        // No data found for this sheet
        return null;
      }
      
      return {
        allStatements: data.all_statements || [],
        structuredStatements: data.structured_statements || {}
      };
    } catch (error) {
      console.warn(`Failed to get EYFS standards for ${sheet} from Supabase:`, error);
      throw error;
    }
  },
  
  updateSheet: async (sheet: string, data: any) => {
    try {
      const { error } = await supabase
        .from(TABLES.EYFS_STATEMENTS)
        .upsert({
          sheet_name: sheet,
          all_statements: data.allStatements,
          structured_statements: data.structuredStatements
        }, { onConflict: 'sheet_name' });
      
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.warn(`Failed to update EYFS standards for ${sheet} in Supabase:`, error);
      throw error;
    }
  }
};

// API endpoints for half-terms
export const halfTermsApi = {
  getBySheet: async (sheet: string, academicYear?: string) => {
    try {
      if (import.meta.env.DEV) console.log(`🔍 Fetching half-terms for ${sheet} (${academicYear || 'default'}) from Supabase...`);
      
      const query = supabase
        .from('half_terms')
        .select('*')
        .eq('sheet_name', sheet);
      
      // Filter by academic year if provided
      if (academicYear) {
        query.eq('academic_year', academicYear);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('❌ Supabase half-terms query error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          sheet,
          academicYear
        });
        throw error;
      }
      
      console.log('✅ Half-terms query successful:', data?.length || 0, 'terms found');
      
      return (data || []).map(item => ({
        id: item.id,
        name: item.name,
        lessons: item.lessons || [],
        stacks: item.stacks || [], // Add stacks support
        isComplete: item.is_complete || false,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at)
      }));
    } catch (error) {
      console.error(`❌ Failed to get half-terms for ${sheet} (${academicYear || 'default'}) from Supabase:`, error);
      throw error;
    }
  },
  
  updateHalfTerm: async (sheet: string, halfTermId: string, lessons: string[], isComplete: boolean, academicYear?: string, stacks?: string[]) => {
    try {
      console.log('🔄 halfTermsApi.updateHalfTerm called with:', { sheet, halfTermId, lessons, isComplete, stacks, academicYear });
      
      // Get the half-term name based on ID
      const halfTermNames: Record<string, string> = {
        'A1': 'Autumn 1',
        'A2': 'Autumn 2', 
        'SP1': 'Spring 1',
        'SP2': 'Spring 2',
        'SM1': 'Summer 1',
        'SM2': 'Summer 2'
      };
      
      const year = academicYear || '2025-2026';
      
      const upsertData: any = {
          id: halfTermId,
          sheet_name: sheet,
        academic_year: year,
          name: halfTermNames[halfTermId] || halfTermId,
          lessons: lessons,
          is_complete: isComplete,
        term_id: halfTermId, // This is part of the unique constraint
          updated_at: new Date().toISOString()
      };
      
      // Add stacks if provided
      if (stacks !== undefined) {
        upsertData.stacks = stacks;
      }
      
      console.log('🔄 Upserting to Supabase with data:', upsertData);
      
      // Use upsert with onConflict to handle the unique constraint properly
      // The unique constraint is on (sheet_name, term_id), so we need to specify that
      // First try to update existing record using the unique constraint fields
      const updateResult = await supabase
          .from(TABLES.HALF_TERMS)
          .update(upsertData)
          .eq('sheet_name', sheet)
          .eq('academic_year', year)
          .eq('term_id', halfTermId)
          .select();
      
      let data, error;
      
      // Check if update found and modified any records
      // Supabase returns an array, empty if no rows matched
      if (updateResult.error) {
        // If there was an error, throw it
        throw updateResult.error;
      } else if (updateResult.data && updateResult.data.length > 0) {
        // Update found and modified a record
        data = updateResult.data[0];
        console.log(`✅ Updated half-term ${halfTermId} for ${sheet} (${year})`);
      } else {
        // No existing record found, try to insert new one
        const insertResult = await supabase
          .from(TABLES.HALF_TERMS)
          .insert(upsertData)
          .select()
          .single();
        
        data = insertResult.data;
        error = insertResult.error;
        
        if (error) {
          // If insert fails with duplicate key, record exists but update didn't find it
          // This can happen if the record has a different academic_year
          // Since unique constraint is on (sheet_name, term_id), update using those fields only
          if (error.code === '23505' || error.message?.includes('duplicate key')) {
            console.log('⚠️ Insert failed with duplicate key, retrying update (unique constraint is on sheet_name + term_id)...');
            const retryResult = await supabase
              .from(TABLES.HALF_TERMS)
              .update(upsertData)
              .eq('sheet_name', sheet)
              .eq('term_id', halfTermId)
              .select();
            
            if (retryResult.error) {
              throw retryResult.error;
            }
            if (retryResult.data && retryResult.data.length > 0) {
              data = retryResult.data[0];
              console.log(`✅ Updated half-term ${halfTermId} for ${sheet} (matched by sheet_name and term_id, updated academic_year to ${year})`);
            } else {
              // Still no record found - this shouldn't happen if duplicate key error occurred
              console.warn(`⚠️ No record found for half-term ${halfTermId} after retry - this is unexpected`);
              throw new Error(`Failed to update half-term ${halfTermId} - record not found despite duplicate key error`);
            }
          } else {
            throw error;
          }
        } else {
          console.log(`✅ Created half-term ${halfTermId} for ${sheet} (${year})`);
        }
      }
      
      console.log('🔄 Supabase response:', { data, error });
      
      if (error) throw error;
      
      return {
        id: data.id,
        name: data.name,
        lessons: data.lessons || [],
        stacks: data.stacks || [], // Add stacks support
        isComplete: data.is_complete || false,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    } catch (error) {
      console.error(`❌ Failed to update half-term ${halfTermId} for ${sheet} in Supabase:`, error);
      console.error(`❌ Error details:`, {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }
  },
  
  initializeHalfTerms: async (sheet: string, academicYear?: string) => {
    try {
      const defaultHalfTerms = [
        { id: 'A1', name: 'Autumn 1' },
        { id: 'A2', name: 'Autumn 2' },
        { id: 'SP1', name: 'Spring 1' },
        { id: 'SP2', name: 'Spring 2' },
        { id: 'SM1', name: 'Summer 1' },
        { id: 'SM2', name: 'Summer 2' }
      ];
      
      const year = academicYear || '2025-2026';
      const halfTermsToInsert = defaultHalfTerms.map(term => ({
        id: term.id,
        sheet_name: sheet,
        academic_year: year,
        name: term.name,
        lessons: [],
        is_complete: false,
        term_id: term.id // Add the missing term_id field
      }));
      
      // For initialization, we'll use insert with ignoreDuplicates to avoid conflicts
      const { data, error } = await supabase
        .from('half_terms')
        .insert(halfTermsToInsert)
        .select();
      
      if (error) {
        // If there's an error, it might be because records already exist
        // Check if the error is about duplicate key violation
        if (error.code === '23505' || error.message.includes('duplicate key')) {
          console.log(`ℹ️ Half-terms for ${sheet} (${year}) already exist, skipping initialization`);
          return []; // Return empty array to indicate no new records were created
        }
        throw error;
      }
      
      console.log(`✅ Initialized ${data?.length || 0} half-terms for ${sheet} (${year})`);
      return data || [];
    } catch (error) {
      console.warn(`Failed to initialize half-terms for ${sheet} in Supabase:`, error);
      throw error;
    }
  }
};

// API endpoints for year groups
export const yearGroupsApi = {
  getAll: async () => {
    try {
      console.log('🔍 Fetching year groups from Supabase table:', TABLES.YEAR_GROUPS);
      const { data, error } = await supabase
        .from(TABLES.YEAR_GROUPS)
        .select('*')
        .order('sort_order');
      
      if (error) {
        console.error('❌ Error fetching year groups:', error);
        throw error;
      }
      
      console.log('📦 Raw year groups data from Supabase:', data);
      
      // Deduplicate by name and convert UUIDs back to text IDs for the frontend
      const uniqueData = (data || []).reduce((acc, group) => {
        const existing = acc.find(g => g.name === group.name);
        if (!existing) {
          acc.push({
            ...group,
            id: group.name // Use name as ID for frontend compatibility
          });
        }
        return acc;
      }, [] as any[]);
      
      console.log('📦 Deduplicated and formatted year groups for frontend:', uniqueData);
      return uniqueData;
    } catch (error) {
      console.error('❌ Failed to get year groups from Supabase:', error);
      throw error;
    }
  },

  upsert: async (yearGroups: any[]) => {
    try {
      // SAFE UPSERT: Only add missing year groups, never delete existing ones
      console.log('🔄 Safe upsert - checking existing year groups first...');
      
      // First, get existing year groups
      const { data: existing, error: fetchError } = await supabase
        .from(TABLES.YEAR_GROUPS)
        .select('*')
        .order('sort_order');
      
      if (fetchError) {
        console.error('❌ Error fetching existing year groups:', fetchError);
        throw fetchError;
      }
      
      const existingNames = new Set((existing || []).map(g => g.name));
      console.log('📦 Existing year groups:', Array.from(existingNames));
      
      // Deduplicate incoming year groups by name
      const uniqueYearGroups = yearGroups.reduce((acc, group) => {
        const exists = acc.find(g => g.name === group.name);
        if (!exists) {
          acc.push(group);
        }
        return acc;
      }, [] as any[]);
      
      // Find year groups that need to be added (don't exist yet)
      const toAdd = uniqueYearGroups.filter(g => !existingNames.has(g.name));
      
      if (toAdd.length === 0) {
        console.log('✅ All year groups already exist, nothing to add');
        return existing;
      }
      
      // Find the highest sort_order
      const maxOrder = (existing || []).reduce((max, g) => Math.max(max, g.sort_order || 0), 0);
      
      // Format the new year groups for insertion
      const formattedYearGroups = toAdd.map((group, index) => ({
        id: crypto.randomUUID(),
        name: group.name,
        color: group.color || '#14B8A6',
        sort_order: maxOrder + index + 1
      }));
      
      console.log('📝 Adding missing year groups:', formattedYearGroups.map(g => g.name));
      
      // Insert only the missing year groups
      const { data, error } = await supabase
        .from(TABLES.YEAR_GROUPS)
        .insert(formattedYearGroups)
        .select();
      
      if (error) {
        console.error('❌ Year groups insert error:', error);
        throw error;
      }
      
      console.log('✅ Added missing year groups:', data?.map(g => g.name));
      
      // Return combined list
      return [...(existing || []), ...(data || [])];
    } catch (error) {
      console.error('❌ Failed to upsert year groups to Supabase:', error);
      throw error;
    }
  },

  // EXPLICIT REPLACE: Only use this when user explicitly clicks "Reset to Defaults"
  replaceAll: async (yearGroups: any[]) => {
    try {
      console.log('⚠️ EXPLICIT REPLACE: Removing all year groups and replacing with:', yearGroups.map(g => g.name));
      
      // Delete all existing
      const { error: deleteError } = await supabase
        .from(TABLES.YEAR_GROUPS)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (deleteError) {
        console.warn('⚠️ Failed to clear year groups:', deleteError);
      }
      
      // Format and insert new ones
      const formatted = yearGroups.map((group, index) => ({
        id: crypto.randomUUID(),
        name: group.name,
        color: group.color || '#14B8A6',
        sort_order: index
      }));
      
      const { data, error } = await supabase
        .from(TABLES.YEAR_GROUPS)
        .insert(formatted)
        .select();
      
      if (error) throw error;
      
      console.log('✅ Year groups replaced:', data?.map(g => g.name));
      return data;
    } catch (error) {
      console.error('❌ Failed to replace year groups:', error);
      throw error;
    }
  },

  delete: async (id: string) => {
    const { error } = await supabase
      .from(TABLES.YEAR_GROUPS)
      .delete()
      .eq('id', id);
    if (error) {
      console.error('Supabase year_groups delete error:', error.message, error.code);
      throw error;
    }
    return { success: true };
  }
};

// Normalise year_groups from DB (can be object or string from JSONB)
function normaliseYearGroups(raw: any): Record<string, boolean> {
  if (raw == null) return {};
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw as Record<string, boolean>;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
}

// API endpoints for categories (uses public.custom_categories - same table as ~2 weeks ago when year group persistence worked)
// Supabase/Postgres use snake_case (year_groups); app uses camelCase (yearGroups)
export const customCategoriesApi = {
  getAll: async () => {
    try {
      const { data, error } = await supabase
        .from(TABLES.CUSTOM_CATEGORIES)
        .select('*')
        .order('position');
      
      if (error) throw error;
      const rows = data || [];
      
      // Log raw data from Supabase to debug yearGroups
      const categoriesWithYearGroups = rows.filter((r: any) => {
        const normalized = normaliseYearGroups(r.year_groups);
        return normalized && Object.keys(normalized).length > 0 && Object.values(normalized).some(v => v === true);
      });
      
      if (categoriesWithYearGroups.length > 0) {
        console.log('📥 Categories loaded from Supabase WITH year groups:', categoriesWithYearGroups.map((r: any) => ({
          name: r.name,
          year_groups_raw: r.year_groups,
          year_groups_normalized: normaliseYearGroups(r.year_groups),
          assignedKeys: Object.keys(normaliseYearGroups(r.year_groups)).filter(k => normaliseYearGroups(r.year_groups)[k] === true)
        })));
      } else {
        console.warn('⚠️ NO categories loaded from Supabase with year groups assigned. Total categories:', rows.length);
        console.log('📥 Sample category data:', rows.slice(0, 3).map((r: any) => ({
          name: r.name,
          year_groups_raw: r.year_groups,
          year_groups_type: typeof r.year_groups,
          year_groups_is_null: r.year_groups === null,
          year_groups_normalized: normaliseYearGroups(r.year_groups)
        })));
      }
      
      return rows.map((row: any) => ({
        id: row.id,  // Preserve Supabase primary key for round-trip upserts
        name: row.name,
        color: row.color,
        position: row.position,
        group: row.group,
        groups: row.groups ?? [],
        yearGroups: normaliseYearGroups(row.year_groups)
      }));
    } catch (error) {
      console.warn('Failed to get categories from Supabase:', error);
      throw error;
    }
  },

  upsert: async (categories: any[]) => {
    try {
      const rows = categories.map((cat: any) => {
        const yearGroups = cat.yearGroups ?? {};
        const yearGroupsObj = typeof yearGroups === 'object' && !Array.isArray(yearGroups) ? yearGroups : {};
        
        // Ensure groups is a valid array (not null/undefined)
        const groupsArray = Array.isArray(cat.groups) ? cat.groups : (cat.group ? [cat.group] : []);
        
        // Ensure position is a number
        const position = typeof cat.position === 'number' ? cat.position : (cat.position ? parseInt(cat.position, 10) : 0);
        
        // Ensure color is a string
        const color = cat.color || '#6B7280';
        
        // Debug logging for year group assignments
        if (yearGroupsObj && Object.keys(yearGroupsObj).length > 0 && Object.values(yearGroupsObj).some(v => v === true)) {
          console.log('💾 Saving category with year groups:', {
            name: cat.name,
            yearGroups: yearGroupsObj,
            yearGroupKeys: Object.keys(yearGroupsObj).filter(k => yearGroupsObj[k] === true)
          });
        }
        
        // NOTE: The actual Supabase table column is "group" (not "group_name").
        // Sending "group_name" caused PGRST204 "column not found" errors that
        // silently killed every upsert, preventing year_groups from persisting.
        const rowData: any = {
          name: cat.name,
          color: color,
          position: position,
          groups: groupsArray,
          year_groups: yearGroupsObj
        };
        
        // Remove null/undefined values that might cause issues
        Object.keys(rowData).forEach(key => {
          if (rowData[key] === undefined) {
            delete rowData[key];
          }
        });
        
        return rowData;
      });
      
      // Log what we're about to upsert
      const categoriesWithYearGroups = rows.filter(r => r.year_groups && Object.keys(r.year_groups).length > 0 && Object.values(r.year_groups).some(v => v === true));
      if (categoriesWithYearGroups.length > 0) {
        console.log('📤 Upserting categories with year group assignments:', categoriesWithYearGroups.map(c => ({
          name: c.name,
          year_groups: c.year_groups
        })));
      }
      
      // Log sample row data to debug format issues
      if (rows.length > 0) {
        console.log('📤 Sample row data being sent to Supabase:', {
          sample: rows[0],
          totalRows: rows.length,
          sampleYearGroups: rows[0].year_groups,
          sampleGroups: rows[0].groups,
          sampleGroupsType: typeof rows[0].groups,
          sampleGroupsIsArray: Array.isArray(rows[0].groups)
        });
      }
      
      // Validate data before sending to Supabase
      const validatedRows = rows.map((row, index) => {
        try {
          // Ensure year_groups is a valid JSONB object
          if (row.year_groups && typeof row.year_groups !== 'object') {
            console.warn(`⚠️ Invalid year_groups type for category "${row.name}", converting to object`);
            row.year_groups = {};
          }
          
          // Ensure groups is a valid array
          if (!Array.isArray(row.groups)) {
            console.warn(`⚠️ Invalid groups type for category "${row.name}", converting to array`);
            row.groups = row.group ? [row.group] : [];
          }
          
          // Ensure position is a number
          if (typeof row.position !== 'number') {
            row.position = parseInt(row.position, 10) || 0;
          }
          
          // Ensure required fields exist
          if (!row.name) {
            throw new Error(`Category at index ${index} is missing required field: name`);
          }
          
          return row;
        } catch (validationError) {
          console.error(`❌ Validation error for category at index ${index}:`, validationError);
          throw validationError;
        }
      });
      
      const { data, error } = await supabase
        .from(TABLES.CUSTOM_CATEGORIES)
        .upsert(validatedRows, { onConflict: 'name' })
        .select();
      
      if (error) {
        console.error('❌ Supabase categories upsert error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          sampleRow: validatedRows.length > 0 ? validatedRows[0] : null,
          totalRows: validatedRows.length
        });
        
        // Log the full error response for debugging
        console.error('❌ Full error object:', JSON.stringify(error, null, 2));
        
        throw error;
      }
      const result = data || [];
      
      // Debug logging for what was returned
      const returnedWithYearGroups = result.filter((r: any) => r.year_groups && Object.keys(r.year_groups).length > 0 && Object.values(r.year_groups).some((v: any) => v === true));
      if (returnedWithYearGroups.length > 0) {
        console.log('✅ Categories returned from Supabase with year groups:', returnedWithYearGroups.map((r: any) => ({
          name: r.name,
          year_groups: r.year_groups
        })));
      }
      
      return result.map((row: any) => {
        const normalizedYearGroups = normaliseYearGroups(row.year_groups);
        return {
          id: row.id,  // Preserve id from Supabase response
          name: row.name,
          color: row.color,
          position: row.position,
          group: row.group,
          groups: row.groups ?? [],
          yearGroups: normalizedYearGroups
        };
      });
    } catch (error) {
      console.warn('Failed to upsert categories to Supabase:', error);
      throw error;
    }
  },

  delete: async (name: string) => {
    try {
      const { error } = await supabase
        .from(TABLES.CUSTOM_CATEGORIES)
        .delete()
        .eq('name', name);
      
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.warn('Failed to delete category from Supabase:', error);
      throw error;
    }
  }
};

// API endpoints for category groups
export const categoryGroupsApi = {
  getAll: async () => {
    try {
      const { data, error } = await supabase
        .from(TABLES.CATEGORY_GROUPS)
        .select('*')
        .order('sort_order');
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.warn('Failed to get category groups from Supabase:', error);
      throw error;
    }
  },

  upsert: async (groups: string[]) => {
    try {
      console.log('🔄 Upserting category groups to Supabase:', groups);
      
      // Clear existing groups first
      const { error: deleteError } = await supabase
        .from(TABLES.CATEGORY_GROUPS)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows
      
      if (deleteError) {
        console.warn('⚠️ Failed to clear category groups table (continuing anyway):', deleteError);
      } else {
        console.log('🗑️ Cleared existing category groups from Supabase');
      }
      
      // Insert new groups
      const formattedGroups = groups.map((group, index) => ({
        id: crypto.randomUUID(),
        name: group,
        sort_order: index
      }));
      
      console.log('🔄 Inserting new category groups:', formattedGroups);
      
      const { data, error } = await supabase
        .from(TABLES.CATEGORY_GROUPS)
        .insert(formattedGroups)
        .select();
      
      if (error) {
        console.error('❌ Category groups insert error:', error);
        throw error;
      }
      
      console.log('✅ Category groups inserted successfully:', data);
      console.log('✅ Inserted count:', data?.length || 0);
      return data;
    } catch (error) {
      console.error('❌ Failed to upsert category groups to Supabase:', error);
      console.error('❌ Full error object:', error);
      throw error;
    }
  },

  delete: async (name: string) => {
    try {
      const { error } = await supabase
        .from(TABLES.CATEGORY_GROUPS)
        .delete()
        .eq('name', name);
      
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.warn('Failed to delete category group from Supabase:', error);
      throw error;
    }
  }
};

// API for branding settings (footer, login page - persists across devices)
export const brandingApi = {
  get: async (): Promise<Record<string, unknown> | null> => {
    try {
      const { data, error } = await supabase
        .from(TABLES.BRANDING_SETTINGS)
        .select('data')
        .eq('key', 'default')
        .maybeSingle();
      if (error) throw error;
      return (data?.data as Record<string, unknown>) ?? null;
    } catch (error) {
      if (import.meta.env.DEV) console.warn('Failed to load branding from Supabase:', error);
      return null;
    }
  },

  upsert: async (branding: Record<string, unknown>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from(TABLES.BRANDING_SETTINGS)
        .upsert(
          { key: 'default', data: branding, updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        );
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to save branding to Supabase:', error);
      return false;
    }
  }
};

// Export/Import all data
export const dataApi = {
  /** Lightweight check that Supabase is reachable (used for connection status). Uses only the activities table. */
  checkConnection: async (): Promise<boolean> => {
    try {
      const { error } = await supabase.from(TABLES.ACTIVITIES).select('id').limit(1);
      return !error;
    } catch {
      return false;
    }
  },

  exportAll: async () => {
    try {
      // Get all data from core tables (always exist)
      const [activities, lessons, lessonPlans, standards, halfTerms, customCategories, categoryGroups, yearGroups, lessonStacks, activityStacks] = await Promise.all([
        supabase.from(TABLES.ACTIVITIES).select('*'),
        supabase.from(TABLES.LESSONS).select('*'),
        supabase.from(TABLES.LESSON_PLANS).select('*'),
        supabase.from(TABLES.EYFS_STATEMENTS).select('*'),
        supabase.from('half_terms').select('*'),
        supabase.from(TABLES.CUSTOM_CATEGORIES).select('*'),
        supabase.from(TABLES.CATEGORY_GROUPS).select('*'),
        supabase.from(TABLES.YEAR_GROUPS).select('*'),
        supabase.from(TABLES.LESSON_STACKS).select('*'),
        supabase.from(TABLES.ACTIVITY_STACKS).select('*')
      ]);
      
      // Check for errors in core tables
      if (activities.error) throw activities.error;
      if (lessons.error) throw lessons.error;
      if (lessonPlans.error) throw lessonPlans.error;
      if (standards.error) throw standards.error;
      if (halfTerms.error) throw halfTerms.error;
      if (customCategories.error) throw customCategories.error;
      if (categoryGroups.error) throw categoryGroups.error;
      if (yearGroups.error) throw yearGroups.error;
      if (lessonStacks.error) throw lessonStacks.error;
      if (activityStacks.error) throw activityStacks.error;

      // Try to get custom objectives data (optional - tables might not exist yet)
      let customObjectiveYearGroups = { data: [] };
      let customObjectiveAreas = { data: [] };
      let customObjectives = { data: [] };
      let activityCustomObjectives = { data: [] };

      try {
        const [coyg, coa, co, aco] = await Promise.all([
          supabase.from(TABLES.CUSTOM_OBJECTIVE_YEAR_GROUPS).select('*'),
          supabase.from(TABLES.CUSTOM_OBJECTIVE_AREAS).select('*'),
          supabase.from(TABLES.CUSTOM_OBJECTIVES).select('*'),
          supabase.from(TABLES.ACTIVITY_CUSTOM_OBJECTIVES).select('*')
        ]);
        
        customObjectiveYearGroups = coyg;
        customObjectiveAreas = coa;
        customObjectives = co;
        activityCustomObjectives = aco;
        
        console.log('✅ Custom objectives tables found and exported');
      } catch (customError) {
        console.log('ℹ️ Custom objectives tables not found (migration not run yet) - continuing with core data only');
      }
      
      return {
        activities: activities.data || [],
        lessons: lessons.data || [],
        lessonPlans: lessonPlans.data || [],
        standards: standards.data || [],
        halfTerms: halfTerms.data || [],
        customCategories: customCategories.data || [],
        categoryGroups: categoryGroups.data || [],
        yearGroups: yearGroups.data || [],
        lessonStacks: lessonStacks.data || [],
        activityStacks: activityStacks.data || [],
        customObjectiveYearGroups: customObjectiveYearGroups.data || [],
        customObjectiveAreas: customObjectiveAreas.data || [],
        customObjectives: customObjectives.data || [],
        activityCustomObjectives: activityCustomObjectives.data || []
      };
    } catch (error) {
      console.warn('Failed to export data from Supabase:', error);
      throw error;
    }
  },
  
  importAll: async (data: any) => {
    try {
      // Start a transaction to import all data
      const promises = [];
      
      if (data.activities && data.activities.length > 0) {
        // Clean activities data (remove uniqueId and convert to snake_case)
        const cleanedActivities = data.activities.map(({ uniqueId, ...activity }: any) => ({
          activity: activity.activity,
          description: activity.description,
          activity_text: activity.activityText,
          time: activity.time,
          video_link: activity.videoLink,
          music_link: activity.musicLink,
          backing_link: activity.backingLink,
          resource_link: activity.resourceLink,
          link: activity.link,
          vocals_link: activity.vocalsLink,
          image_link: activity.imageLink,
          canva_link: activity.canvaLink || '',
          teaching_unit: activity.teachingUnit,
          category: activity.category,
          level: activity.level,
          unit_name: activity.unitName,
          lesson_number: activity.lessonNumber,
          eyfs_standards: activity.eyfsStandards
        }));
        promises.push(
          supabase
            .from(TABLES.ACTIVITIES)
            .upsert(cleanedActivities, { 
              onConflict: 'activity,category,lesson_number',
              ignoreDuplicates: false 
            })
        );
      }
      
      if (data.lessons) {
        const lessonsData = Object.entries(data.lessons).map(([sheet, sheetData]: [string, any]) => ({
          sheet_name: sheet,
          data: sheetData.allLessonsData || {},
          lesson_numbers: sheetData.lessonNumbers || [],
          teaching_units: sheetData.teachingUnits || []
          // Note: lesson_standards_map and eyfs_statements_map columns don't exist
          // Standards are stored within the lesson data itself
        }));
        
        promises.push(
          supabase
            .from(TABLES.LESSONS)
            .upsert(lessonsData, { onConflict: 'sheet_name' })
        );
      }
      
      if (data.lessonPlans && data.lessonPlans.length > 0) {
        // Convert lesson plans to snake_case
        const lessonPlansData = data.lessonPlans.map((plan: any) => ({
          id: plan.id,
          date: new Date(plan.date).toISOString(),
          week: plan.week,
          class_name: plan.className,
          activities: plan.activities,
          duration: plan.duration,
          notes: plan.notes,
          status: plan.status,
          unit_id: plan.unitId,
          unit_name: plan.unitName,
          lesson_number: plan.lessonNumber,
          title: plan.title,
          term: plan.term,
          time: plan.time
        }));
        
        promises.push(
          supabase
            .from(TABLES.LESSON_PLANS)
            .upsert(lessonPlansData, { onConflict: 'id' })
        );
      }
      
      if (data.eyfs) {
        const eyfsData = Object.entries(data.eyfs).map(([sheet, sheetData]: [string, any]) => ({
          sheet_name: sheet,
          all_statements: sheetData.allStatements || [],
          structured_statements: sheetData.structuredStatements || {}
        }));
        
        promises.push(
          supabase
            .from(TABLES.EYFS_STATEMENTS)
            .upsert(eyfsData, { onConflict: 'sheet_name' })
        );
      }
      
      // Import settings tables
      if (data.customCategories && data.customCategories.length > 0) {
        promises.push(
          supabase
            .from(TABLES.CUSTOM_CATEGORIES)
            .upsert(data.customCategories, { onConflict: 'id' })
        );
      }
      
      if (data.categoryGroups && data.categoryGroups.length > 0) {
        promises.push(
          supabase
            .from(TABLES.CATEGORY_GROUPS)
            .upsert(data.categoryGroups, { onConflict: 'id' })
        );
      }
      
      if (data.yearGroups && data.yearGroups.length > 0) {
        promises.push(
          supabase
            .from(TABLES.YEAR_GROUPS)
            .upsert(data.yearGroups, { onConflict: 'id' })
        );
      }
      
      if (data.lessonStacks && data.lessonStacks.length > 0) {
        promises.push(
          supabase
            .from(TABLES.LESSON_STACKS)
            .upsert(data.lessonStacks, { onConflict: 'id' })
        );
      }
      
      if (data.activityStacks && data.activityStacks.length > 0) {
        promises.push(
          supabase
            .from(TABLES.ACTIVITY_STACKS)
            .upsert(data.activityStacks, { onConflict: 'id' })
        );
      }
      
      // Import custom objectives data if present
      if (data.customObjectiveYearGroups && data.customObjectiveYearGroups.length > 0) {
        promises.push(
          supabase
            .from(TABLES.CUSTOM_OBJECTIVE_YEAR_GROUPS)
            .upsert(data.customObjectiveYearGroups, { onConflict: 'id' })
        );
      }
      
      if (data.customObjectiveAreas && data.customObjectiveAreas.length > 0) {
        promises.push(
          supabase
            .from(TABLES.CUSTOM_OBJECTIVE_AREAS)
            .upsert(data.customObjectiveAreas, { onConflict: 'id' })
        );
      }
      
      if (data.customObjectives && data.customObjectives.length > 0) {
        promises.push(
          supabase
            .from(TABLES.CUSTOM_OBJECTIVES)
            .upsert(data.customObjectives, { onConflict: 'id' })
        );
      }
      
      if (data.activityCustomObjectives && data.activityCustomObjectives.length > 0) {
        promises.push(
          supabase
            .from(TABLES.ACTIVITY_CUSTOM_OBJECTIVES)
            .upsert(data.activityCustomObjectives, { onConflict: 'activity_id,objective_id' })
        );
      }
      
      // Execute all promises
      await Promise.all(promises);
      
      return { success: true };
    } catch (error) {
      console.warn('Failed to import data to Supabase:', error);
      throw error;
    }
  }
};

// WordPress API Configuration
const WORDPRESS_CONFIG = {
  BASE_URL: import.meta.env.VITE_WORDPRESS_URL || 'https://your-wordpress-site.com',
  API_ENDPOINT: '/wp-json/wp/v2',
  AUTH_ENDPOINT: '/wp-json/jwt-auth/v1/token',
  VALIDATE_ENDPOINT: '/wp-json/jwt-auth/v1/token/validate',
};

// WordPress API helper
export const wordpressAPI = {
  async authenticate(username: string, password: string) {
    const baseUrl = WORDPRESS_CONFIG.BASE_URL;
    
    console.log('🔍 WordPress API Debug:', {
      baseUrl,
      authEndpoint: WORDPRESS_CONFIG.AUTH_ENDPOINT,
      fullUrl: `${baseUrl}${WORDPRESS_CONFIG.AUTH_ENDPOINT}`,
      username
    });
    
    if (!baseUrl || baseUrl === 'https://your-wordpress-site.com') {
      throw new Error('WordPress URL not configured');
    }
    
    const response = await fetch(`${baseUrl}${WORDPRESS_CONFIG.AUTH_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        password,
      }),
    });
    
    console.log('🔍 WordPress API Response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ WordPress API Error:', errorData);
      throw new Error(errorData.message || 'Authentication failed');
    }
    
    return response.json();
  },
  
  async validateToken(token: string) {
    try {
      const baseUrl = WORDPRESS_CONFIG.BASE_URL;
      
      if (!baseUrl || baseUrl === 'https://your-wordpress-site.com') {
        return false;
      }
      
      const response = await fetch(`${baseUrl}${WORDPRESS_CONFIG.VALIDATE_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      return response.ok;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  },
  
  async getUserInfo(token: string) {
    const baseUrl = WORDPRESS_CONFIG.BASE_URL;
    
    if (!baseUrl || baseUrl === 'https://your-wordpress-site.com') {
      throw new Error('WordPress URL not configured');
    }
    
    const response = await fetch(`${baseUrl}${WORDPRESS_CONFIG.API_ENDPOINT}/users/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }
    
    return response.json();
  }
};

// Activity Packs API
export interface ActivityPack {
  id: string;
  pack_id: string;
  name: string;
  description: string;
  /** Optional rich-text introduction to the pack (shown with pack content). */
  introduction?: string | null;
  price: number;
  icon: string;
  category_ids: string[];
  /** Lesson stack IDs included in this pack; buyers can add these units in one click. */
  stack_ids?: string[];
  /** Section ids (eyfs, ks1, ks2, ks3, ks4, ks5, other) where this pack appears in Lesson Library; empty = all. */
  year_group_sections?: string[];
  is_active: boolean;
  /** Email of the creator who owns this pack. Creators can only edit/delete their own. */
  creator_email?: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserPurchase {
  id: string;
  user_email: string;
  pack_id: string;
  purchase_date: string;
  paypal_transaction_id?: string;
  amount: number;
  status: string;
}

export const activityPacksApi = {
  // Get all active packs
  getAllPacks: async (): Promise<ActivityPack[]> => {
    if (!isSupabaseConfigured()) return [];
    
    const { data, error } = await supabase
      .from('activity_packs')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Get all packs (admin only)
  getAllPacksAdmin: async (): Promise<ActivityPack[]> => {
    if (!isSupabaseConfigured()) return [];
    
    const { data, error } = await supabase
      .from('activity_packs')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Get packs created by a specific creator (for creator role)
  getPacksForCreator: async (creatorEmail: string): Promise<ActivityPack[]> => {
    if (!isSupabaseConfigured() || !creatorEmail) return [];
    
    const { data, error } = await supabase
      .from('activity_packs')
      .select('*')
      .eq('creator_email', creatorEmail)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Create or update a pack (admin only)
  upsertPack: async (pack: Partial<ActivityPack>): Promise<ActivityPack> => {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
    
    const payload: Record<string, unknown> = {
      ...pack,
      updated_at: new Date().toISOString()
    };
    if (pack.year_group_sections !== undefined) {
      payload.year_group_sections = pack.year_group_sections;
    }
    if (pack.introduction !== undefined) {
      payload.introduction = pack.introduction || null;
    }
    const { data, error } = await supabase
      .from('activity_packs')
      .upsert(payload)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete a pack (admin only)
  deletePack: async (packId: string): Promise<void> => {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
    
    const { error } = await supabase
      .from('activity_packs')
      .delete()
      .eq('pack_id', packId);
    
    if (error) throw error;
  },

  // Get user's purchased packs
  getUserPurchases: async (userEmail: string): Promise<string[]> => {
    if (!isSupabaseConfigured()) return [];
    
    const { data, error } = await supabase
      .from('user_purchases')
      .select('pack_id')
      .eq('user_email', userEmail)
      .eq('status', 'active');
    
    if (error) throw error;
    return data?.map(p => p.pack_id) || [];
  },

  // Record a purchase
  recordPurchase: async (purchase: Partial<UserPurchase>): Promise<UserPurchase> => {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
    
    const { data, error } = await supabase
      .from('user_purchases')
      .insert(purchase)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get all purchases (admin only)
  getAllPurchases: async (): Promise<UserPurchase[]> => {
    if (!isSupabaseConfigured()) return [];
    
    const { data, error } = await supabase
      .from('user_purchases')
      .select('*')
      .order('purchase_date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Check if user has a specific pack
  userHasPack: async (userEmail: string, packId: string): Promise<boolean> => {
    if (!isSupabaseConfigured()) return false;
    
    const { data, error } = await supabase
      .rpc('user_has_pack', {
        p_user_email: userEmail,
        p_pack_id: packId
      });
    
    if (error) {
      console.error('Error checking pack ownership:', error);
      return false;
    }
    
    return data || false;
  }
};
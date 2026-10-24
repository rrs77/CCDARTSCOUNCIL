import { supabase, TABLES } from './supabase';
import { resolveOrganisationId } from './api';
import type { ActivityStack } from '../contexts/DataContext';

export const activityStacksApi = {
  // Get all activity stacks
  getAll: async (): Promise<ActivityStack[]> => {
    try {
      if (import.meta.env.DEV) console.log('🔍 Fetching activity stacks from Supabase...');
      const { data, error } = await supabase
        .from(TABLES.ACTIVITY_STACKS)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Failed to fetch activity stacks:', error);
        throw error;
      }

      console.log('✅ Fetched activity stacks:', data?.length || 0, 'stacks');
      
      // Transform from database format
      return (data || []).map(item => ({
        id: item.id,
        name: item.name,
        activities: item.activities || [],
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
        category: item.category,
        totalTime: item.total_time || 0,
        description: item.description
      }));
    } catch (error) {
      console.error('❌ Failed to fetch activity stacks:', error);
      return [];
    }
  },

  // Create a new activity stack
  create: async (stack: ActivityStack): Promise<ActivityStack | null> => {
    try {
      console.log('➕ Creating activity stack in Supabase:', stack.name);
      
      const organisationId = await resolveOrganisationId();
      if (!organisationId) {
        throw new Error('organisation_id is required to save activity stacks.');
      }
      const { data, error } = await supabase
        .from(TABLES.ACTIVITY_STACKS)
        .insert([{
          id: stack.id,
          name: stack.name,
          activities: stack.activities,
          category: stack.category,
          total_time: stack.totalTime,
          description: stack.description,
          organisation_id: organisationId,
          created_at: stack.createdAt.toISOString(),
          updated_at: stack.updatedAt.toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to create activity stack:', error);
        throw error;
      }

      console.log('✅ Activity stack created successfully');
      return stack;
    } catch (error) {
      console.error('❌ Failed to create activity stack:', error);
      return null;
    }
  },

  // Update an existing activity stack
  update: async (stackId: string, updates: Partial<ActivityStack>): Promise<boolean> => {
    try {
      console.log('📝 Updating activity stack in Supabase:', stackId);
      
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.activities !== undefined) updateData.activities = updates.activities;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.totalTime !== undefined) updateData.total_time = updates.totalTime;
      if (updates.description !== undefined) updateData.description = updates.description;

      const { error } = await supabase
        .from(TABLES.ACTIVITY_STACKS)
        .update(updateData)
        .eq('id', stackId);

      if (error) {
        console.error('❌ Failed to update activity stack:', error);
        throw error;
      }

      console.log('✅ Activity stack updated successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to update activity stack:', error);
      return false;
    }
  },

  // Delete an activity stack
  delete: async (stackId: string): Promise<boolean> => {
    try {
      console.log('🗑️ Deleting activity stack from Supabase:', stackId);
      
      const { error } = await supabase
        .from(TABLES.ACTIVITY_STACKS)
        .delete()
        .eq('id', stackId);

      if (error) {
        console.error('❌ Failed to delete activity stack:', error);
        throw error;
      }

      console.log('✅ Activity stack deleted successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to delete activity stack:', error);
      return false;
    }
  }
};


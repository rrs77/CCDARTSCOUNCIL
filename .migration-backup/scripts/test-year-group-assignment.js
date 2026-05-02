#!/usr/bin/env node
/**
 * Test script to verify year group assignment persistence
 * 
 * This script:
 * 1. Checks what year groups exist in the database
 * 2. Shows what year group keys are being used
 * 3. Tests saving a category with year group assignment
 * 4. Verifies the data was saved correctly
 * 
 * Run: node scripts/test-year-group-assignment.js
 */

const url = process.env.VITE_SUPABASE_URL || 'https://wiudrzdkbpyziaodqoog.supabase.co';
const key = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpdWRyemRrYnB5emlhb2Rxb29nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5MzgxNzcsImV4cCI6MjA2NjUxNDE3N30.LpD82hY_1wYzroA09nYfaz13iNx5gRJzmPTt0gPCLMI';

async function fetchYearGroups() {
  const res = await fetch(`${url}/rest/v1/year_groups?select=*&order=sort_order`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch year groups: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

async function fetchCategories() {
  const res = await fetch(`${url}/rest/v1/custom_categories?select=*&order=position`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch categories: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

async function testUpsert() {
  // Get a test category (use first one)
  const categories = await fetchCategories();
  if (categories.length === 0) {
    console.log('❌ No categories found');
    return;
  }
  
  const testCategory = categories[0];
  console.log('\n📋 Test Category:', testCategory.name);
  console.log('   Current year_groups:', JSON.stringify(testCategory.year_groups || 'N/A'));
  
  // Get year groups to see what keys we should use
  const yearGroups = await fetchYearGroups();
  console.log('\n📚 Available Year Groups:');
  yearGroups.forEach(yg => {
    console.log(`   - ID: "${yg.id || yg.name}", Name: "${yg.name}"`);
    console.log(`     Key to use: "${yg.id || yg.name}"`);
  });
  
  if (yearGroups.length === 0) {
    console.log('❌ No year groups found');
    return;
  }
  
  // Test: Assign first year group to test category
  const testYearGroup = yearGroups[0];
  const yearGroupKey = testYearGroup.id || testYearGroup.name;
  
  console.log(`\n🧪 Testing assignment: "${testCategory.name}" → "${yearGroupKey}"`);
  
  const updatedCategory = {
    name: testCategory.name,
    color: testCategory.color || '#6B7280',
    position: testCategory.position || 0,
    group_name: testCategory.group_name || null,
    groups: testCategory.groups || [],
    year_groups: {
      [yearGroupKey]: true
    }
  };
  
  console.log('📤 Upserting:', JSON.stringify(updatedCategory, null, 2));
  
  const res = await fetch(`${url}/rest/v1/custom_categories`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify(updatedCategory),
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    console.error('❌ Upsert failed:', res.status, errorText);
    return;
  }
  
  const result = await res.json();
  console.log('✅ Upsert successful!');
  console.log('📥 Returned data:', JSON.stringify(result, null, 2));
  
  // Verify by fetching again
  console.log('\n🔍 Verifying save...');
  const verifyRes = await fetch(`${url}/rest/v1/custom_categories?name=eq.${encodeURIComponent(testCategory.name)}&select=*`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (verifyRes.ok) {
    const verified = await verifyRes.json();
    if (verified.length > 0) {
      const cat = verified[0];
      console.log('✅ Verified category:', cat.name);
      console.log('   year_groups:', JSON.stringify(cat.year_groups));
      const hasAssignment = cat.year_groups && cat.year_groups[yearGroupKey] === true;
      console.log(`   Has assignment for "${yearGroupKey}":`, hasAssignment ? '✅ YES' : '❌ NO');
    }
  }
}

async function main() {
  try {
    console.log('🔍 Year Group Assignment Test\n');
    console.log('Supabase URL:', url);
    
    // Show current state
    console.log('\n📊 Current State:');
    const yearGroups = await fetchYearGroups();
    console.log(`   Year Groups: ${yearGroups.length}`);
    yearGroups.forEach(yg => {
      console.log(`     - "${yg.name}" (ID: "${yg.id || yg.name}")`);
    });
    
    const categories = await fetchCategories();
    console.log(`\n   Categories: ${categories.length}`);
    const categoriesWithAssignments = categories.filter(c => 
      c.year_groups && Object.keys(c.year_groups).length > 0 && Object.values(c.year_groups).some(v => v === true)
    );
    console.log(`   Categories with year group assignments: ${categoriesWithAssignments.length}`);
    
    if (categoriesWithAssignments.length > 0) {
      console.log('\n   Categories WITH assignments:');
      categoriesWithAssignments.forEach(cat => {
        const assignedKeys = Object.keys(cat.year_groups).filter(k => cat.year_groups[k] === true);
        console.log(`     - "${cat.name}": [${assignedKeys.join(', ')}]`);
      });
    }
    
    // Run test
    await testUpsert();
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();

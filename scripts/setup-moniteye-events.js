const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupMoniteyeEventsTable() {
  console.log('🔧 Setting up moniteye_events sample data...');
  console.log('⚠️  Note: You need to create the table manually in Supabase first using the SQL script.');

  try {
    // Test if table exists by trying to query it
    const { data: testData, error: testError } = await supabase
      .from('moniteye_events')
      .select('count(*)')
      .limit(1);

    if (testError) {
      console.error('❌ Table does not exist. Please create it first using the SQL script in scripts/create-moniteye-events-table.sql');
      console.log('\n📝 Instructions:');
      console.log('1. Go to your Supabase dashboard');
      console.log('2. Open SQL Editor');
      console.log('3. Copy and paste the contents of scripts/create-moniteye-events-table.sql');
      console.log('4. Click "Run" to execute the script');
      console.log('5. Then run this setup script again');
      return;
    }

    console.log('✅ Table exists! Adding sample events...');

    // Insert sample data
    const { error: insertError } = await supabase
      .from('moniteye_events')
      .insert([
        {
          title: 'Company All-Hands Meeting',
          description: 'Quarterly all-hands meeting to discuss company progress and goals',
          start_date: '2025-06-15T09:00:00Z',
          end_date: '2025-06-15T11:00:00Z',
          all_day: false,
          event_type: 'company',
          created_by: 'Admin',
          location: 'Main Conference Room'
        },
        {
          title: 'Team Building Event',
          description: 'Annual team building activities and lunch',
          start_date: '2025-06-20T10:00:00Z',
          end_date: '2025-06-20T16:00:00Z',
          all_day: false,
          event_type: 'company',
          created_by: 'Admin',
          location: 'Offsite Location'
        },
        {
          title: 'Important Announcement',
          description: 'New product launch announcement to all staff',
          start_date: '2025-06-12T14:00:00Z',
          end_date: '2025-06-12T15:00:00Z',
          all_day: false,
          event_type: 'announcement',
          created_by: 'Admin',
          location: 'Virtual Meeting'
        },
        {
          title: 'Office Closure',
          description: 'Office closed for maintenance',
          start_date: '2025-06-25T00:00:00Z',
          end_date: '2025-06-25T23:59:59Z',
          all_day: true,
          event_type: 'holiday',
          created_by: 'Admin',
          location: ''
        }
      ]);

    if (insertError) {
      console.error('❌ Error inserting sample data:', insertError);
      return;
    }

    console.log('✅ Successfully added sample events!');
    
    // Test the setup
    const { data: events, error: finalTestError } = await supabase
      .from('moniteye_events')
      .select('*');

    if (finalTestError) {
      console.error('❌ Error testing table:', finalTestError);
      return;
    }

    console.log(`🎉 Setup complete! Found ${events.length} events in the database.`);
    events.forEach(event => {
      console.log(`   📅 ${event.title} (${event.event_type})`);
    });
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the setup
setupMoniteyeEventsTable(); 
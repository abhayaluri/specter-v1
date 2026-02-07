import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function createTestSource() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get first user
  const { data: users } = await supabase.auth.admin.listUsers()
  const userId = users.users[0]?.id

  if (!userId) {
    console.error('❌ No users found in database')
    process.exit(1)
  }

  // Create test source
  const { data, error } = await supabase
    .from('sources')
    .insert({
      content: 'This is a comprehensive article about artificial intelligence, machine learning, and deep learning. AI systems are transforming how we process information and make decisions.',
      source_type: 'note',
      owner_id: userId
    })
    .select()

  if (error) {
    console.error('❌ Error creating source:', error)
    process.exit(1)
  }

  console.log('✅ Test source created:', data[0].id)
}

createTestSource()

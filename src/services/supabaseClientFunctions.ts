import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

export async function fetchHtmlContent(projectId) {
  const { data, error } = await supabase
    .from('projects')
    .select('html_content')
    .eq('id', projectId)
    .single();

  if (error) {
    console.error('Error fetching HTML content:', error);
    throw error;
  }

  return data?.html_content || '';
}

export async function saveHtmlContent(projectId, content) {
  const { error } = await supabase
    .from('projects')
    .update({ html_content: content })
    .eq('id', projectId);

  if (error) {
    console.error('Error saving HTML content:', error);
    throw error;
  }
}

export async function addEmailToList(email) {
  const { data, error } = await supabase
    .from('email_list')
    .insert([{ email: email }]);

  if (error) {
    console.error('Error adding email to list:', error);
    throw error;
  }

  return data;
}
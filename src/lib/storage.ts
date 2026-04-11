import { supabase } from './supabase';

const BUCKET = 'fukuyama-templates';

export async function uploadFukuyamaTemplate(
  file: File,
  quotationId: string
): Promise<{ url: string; path: string }> {
  const ext = file.name.split('.').pop() ?? 'png';
  const path = `${quotationId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type,
  });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, path };
}

export async function uploadFukuyamaInterimTemplate(
  file: File,
  quotationId: string
): Promise<{ url: string; path: string }> {
  const ext = file.name.split('.').pop() ?? 'png';
  const path = `${quotationId}/interim/${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type,
  });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, path };
}

export async function deleteFukuyamaTemplate(storagePath: string): Promise<void> {
  await supabase.storage.from(BUCKET).remove([storagePath]);
}

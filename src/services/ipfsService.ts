import { supabase } from '../database/supabase';

const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;

/**
 * Upload a blob to IPFS via Pinata and register it in the database
 */
export async function uploadCertificateToIPFS(
  blob: Blob,
  fileName: string,
  retirementId: number
): Promise<{ success: boolean; cid?: string; error?: string }> {
  try {
    if (!PINATA_JWT) {
      throw new Error('Missing VITE_PINATA_JWT in environment variables');
    }

    const formData = new FormData();
    formData.append('file', blob, fileName);

    const metadata = JSON.stringify({
      name: fileName,
      keyvalues: {
        retirementId: retirementId.toString(),
        type: 'RETIREMENT_CERTIFICATE'
      }
    });
    formData.append('pinataMetadata', metadata);

    const options = JSON.stringify({
      cidVersion: 0
    });
    formData.append('pinataOptions', options);

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PINATA_JWT}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to upload to Pinata');
    }

    const result = await response.json();
    const cid = result.IpfsHash;

    // Register in Supabase IPFS_FILES table
    const { error: dbError } = await supabase.from('IPFS_FILES').insert({
      object_type: 'RETIREMENT',
      object_id: retirementId,
      file_type: 'RETIREMENT_CERTIFICATE',
      cid: cid,
      file_name: fileName,
      mime_type: blob.type,
      file_size: blob.size,
      is_public: true
    });

    if (dbError) {
      console.error('Error saving IPFS CID to database:', dbError);
      // We don't throw here as the file is already pinned, 
      // but we inform the user it might not be linked correctly.
    }

    return { success: true, cid };
  } catch (error: any) {
    console.error('IPFS Upload Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Check if a certificate is already pinpointed on IPFS
 */
export async function getCertificateIPFS(retirementId: number, certificateCode: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('IPFS_FILES')
    .select('cid')
    .eq('object_type', 'RETIREMENT')
    .eq('object_id', retirementId)
    .eq('file_type', 'RETIREMENT_CERTIFICATE')
    .ilike('file_name', `%${certificateCode}%`)
    .maybeSingle();

  if (error || !data) return null;
  return data.cid;
}

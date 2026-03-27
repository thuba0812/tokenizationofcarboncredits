import { supabase } from '../database/supabase';

const PINATA_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJjYjBhZDZiOC01YjIwLTQ4MGItYTU0Zi1hZGExNTcxZTIwZDMiLCJlbWFpbCI6InRydWNuaHQyMzQxNkBzdC51ZWwuZWR1LnZuIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6ImE1YjEwMGM0ZTJhYTA4NDBkYWY0Iiwic2NvcGVkS2V5U2VjcmV0IjoiZTU0Y2M3MDU4MGRiNTYwOTVjYjRjMmQzNmExMmZhMGY0Mjc3ZTAwYWRmNjM5MmIzM2M0OTJhMjUxOTcxMzhhOSIsImV4cCI6MTgwNjEzODQxMn0.ybWw6iIPxbnnyVhADsorefWrsdWhF9BW7ocU0MmGZBM';

/**
 * Upload a blob to IPFS via Pinata and register it in the database
 */
export async function uploadCertificateToIPFS(
  blob: Blob,
  fileName: string,
  retirementId: number
): Promise<{ success: boolean; cid?: string; error?: string }> {
  try {
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
export async function getCertificateIPFS(retirementId: number, creditCode: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('IPFS_FILES')
    .select('cid')
    .eq('object_type', 'RETIREMENT')
    .eq('object_id', retirementId)
    .eq('file_type', 'RETIREMENT_CERTIFICATE')
    .ilike('file_name', `%${creditCode}%`)
    .maybeSingle();

  if (error || !data) return null;
  return data.cid;
}

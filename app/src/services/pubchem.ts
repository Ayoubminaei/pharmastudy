import type { PubChemCompound } from '@/types';

const PUBCHEM_API_BASE = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug';

// Helper to fetch with timeout
async function fetchWithTimeout(url: string, timeout = 10000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

export async function searchPubChem(query: string): Promise<PubChemCompound[]> {
  try {
    const response = await fetchWithTimeout(
      `${PUBCHEM_API_BASE}/compound/name/${encodeURIComponent(query)}/cids/JSON?name_type=word`,
      15000
    );
    
    if (!response.ok) {
      throw new Error('Failed to search PubChem');
    }
    
    const data = await response.json();
    
    if (!data.IdentifierList || !data.IdentifierList.CID) {
      return [];
    }
    
    const cids = data.IdentifierList.CID.slice(0, 10);
    
    const compounds = await Promise.all(
      cids.map(async (cid: number) => {
        try {
          const [nameRes, propsRes] = await Promise.all([
            fetchWithTimeout(`${PUBCHEM_API_BASE}/compound/cid/${cid}/synonyms/JSON`, 10000),
            fetchWithTimeout(`${PUBCHEM_API_BASE}/compound/cid/${cid}/property/MolecularFormula,MolecularWeight/JSON`, 10000)
          ]);
          
          const nameData = await nameRes.json();
          const propsData = await propsRes.json();
          
          // Use direct PubChem image URL instead of blob URL for persistence
          const imageUrl = `${PUBCHEM_API_BASE}/compound/cid/${cid}/PNG`;
          
          return {
            cid,
            name: nameData.InformationList?.Information?.[0]?.Synonym?.[0] || `Compound ${cid}`,
            molecularFormula: propsData.PropertyTable?.Properties?.[0]?.MolecularFormula,
            molecularWeight: propsData.PropertyTable?.Properties?.[0]?.MolecularWeight,
            imageUrl,
            synonyms: nameData.InformationList?.Information?.[0]?.Synonym?.slice(0, 5) || []
          };
        } catch (error) {
          console.error(`Error fetching compound ${cid}:`, error);
          return null;
        }
      })
    );
    
    return compounds.filter((c): c is PubChemCompound => c !== null);
  } catch (error) {
    console.error('PubChem search error:', error);
    return [];
  }
}

export async function getPubChemCompound(cid: number): Promise<PubChemCompound | null> {
  try {
    const [nameRes, propsRes, descRes] = await Promise.all([
      fetchWithTimeout(`${PUBCHEM_API_BASE}/compound/cid/${cid}/synonyms/JSON`, 10000),
      fetchWithTimeout(`${PUBCHEM_API_BASE}/compound/cid/${cid}/property/MolecularFormula,MolecularWeight,IUPACName/JSON`, 10000),
      fetchWithTimeout(`${PUBCHEM_API_BASE}/compound/cid/${cid}/description/JSON`, 10000)
    ]);
    
    const [nameData, propsData, descData] = await Promise.all([
      nameRes.json(),
      propsRes.json(),
      descRes.json()
    ]);
    
    // Use direct PubChem image URL instead of blob URL for persistence
    const imageUrl = `${PUBCHEM_API_BASE}/compound/cid/${cid}/PNG`;
    const property = propsData.PropertyTable?.Properties?.[0];
    
    return {
      cid,
      name: nameData.InformationList?.Information?.[0]?.Synonym?.[0] || property?.IUPACName || `Compound ${cid}`,
      molecularFormula: property?.MolecularFormula,
      molecularWeight: property?.MolecularWeight,
      description: descData.InformationList?.Information?.[0]?.Description,
      imageUrl,
      synonyms: nameData.InformationList?.Information?.[0]?.Synonym?.slice(0, 5) || []
    };
  } catch (error) {
    console.error('PubChem fetch error:', error);
    return null;
  }
}

export function getPubChemImageUrl(cid: number): string {
  return `${PUBCHEM_API_BASE}/compound/cid/${cid}/PNG`;
}

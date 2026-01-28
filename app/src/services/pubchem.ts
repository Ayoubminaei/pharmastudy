import type { PubChemCompound } from '@/types';

const PUBCHEM_API_BASE = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug';

export async function searchPubChem(query: string): Promise<PubChemCompound[]> {
  try {
    const response = await fetch(
      `${PUBCHEM_API_BASE}/compound/name/${encodeURIComponent(query)}/cids/JSON?name_type=word`
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
          const [nameRes, propsRes, imageRes] = await Promise.all([
            fetch(`${PUBCHEM_API_BASE}/compound/cid/${cid}/synonyms/JSON`),
            fetch(`${PUBCHEM_API_BASE}/compound/cid/${cid}/property/MolecularFormula,MolecularWeight/JSON`),
            fetch(`${PUBCHEM_API_BASE}/compound/cid/${cid}/PNG`)
          ]);
          
          const nameData = await nameRes.json();
          const propsData = await propsRes.json();
          const imageBlob = await imageRes.blob();
          const imageUrl = URL.createObjectURL(imageBlob);
          
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
    const [nameRes, propsRes, descRes, imageRes] = await Promise.all([
      fetch(`${PUBCHEM_API_BASE}/compound/cid/${cid}/synonyms/JSON`),
      fetch(`${PUBCHEM_API_BASE}/compound/cid/${cid}/property/MolecularFormula,MolecularWeight,IUPACName/JSON`),
      fetch(`${PUBCHEM_API_BASE}/compound/cid/${cid}/description/JSON`),
      fetch(`${PUBCHEM_API_BASE}/compound/cid/${cid}/PNG`)
    ]);
    
    const [nameData, propsData, descData, imageBlob] = await Promise.all([
      nameRes.json(),
      propsRes.json(),
      descRes.json(),
      imageRes.blob()
    ]);
    
    const imageUrl = URL.createObjectURL(imageBlob);
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

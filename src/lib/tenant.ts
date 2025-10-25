import { supabase } from "./supabaseClient";
export type SupabaseClient = typeof supabase;

export async function getCurrentCompanyId(supabase: any): Promise<string> {
  console.log("🏢 Récupération du company_id...");
  
  // En mode développement, toujours utiliser l'entreprise de dev
  console.log("🔧 Mode développement : Utilisation de l'entreprise de développement");
  return await getDefaultCompanyId(supabase);
}

async function getDefaultCompanyId(supabase: any): Promise<string> {
  console.log("🏢 Mode développement: utilisation de l'entreprise existante Go-Prod HQ");
  
  // UUID de l'entreprise existante Go-Prod HQ
  const DEV_COMPANY_ID = "06f6c960-3f90-41cb-b0d7-46937eaf90a8";
  
  try {
    // Vérifier que l'entreprise Go-Prod HQ existe
    const { data: existingCompany, error: searchErr } = await supabase
      .from("companies")
      .select("id, name")
      .eq("id", DEV_COMPANY_ID)
      .maybeSingle();

    if (searchErr) {
      console.log("⚠️ Erreur lors de la recherche d'entreprise:", searchErr);
    }

    if (existingCompany?.id) {
      console.log("✅ Entreprise Go-Prod HQ trouvée:", existingCompany.id, "-", existingCompany.name);
      return existingCompany.id;
    }

    // Si l'entreprise n'existe pas, c'est un problème
    console.error("❌ L'entreprise Go-Prod HQ n'existe pas dans la base de données");
    throw new Error("L'entreprise Go-Prod HQ n'existe pas");
  } catch (error) {
    console.error("💥 Erreur critique lors de la gestion du company_id:", error);
    throw new Error("Impossible de récupérer l'entreprise Go-Prod HQ");
  }
}

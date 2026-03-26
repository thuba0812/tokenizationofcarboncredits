import { BaseRepository } from './BaseRepository';
import type { PurchasedCredit, Transaction, Certificate } from '../types';
import { projectRepository } from './ProjectRepository';

export class PortfolioRepository extends BaseRepository<any> {
  constructor() {
    super('TOKEN_BALANCES');
  }

  async getPurchasedCredits(walletId: number): Promise<PurchasedCredit[]> {
    // Thường join TOKEN_BALANCES với PROJECT_VINTAGES và PROJECTS
    const { data, error } = await this.client
      .from('TOKEN_BALANCES')
      .select(`
        *,
        PROJECT_VINTAGES (
          *,
          PROJECTS (
            *,
            ORGANIZATIONS (
              *,
              WALLETS ( wallet_address )
            ),
            PROJECT_VINTAGES (
               *,
               LISTINGS ( * )
            )
          )
        )
      `)
      .eq('wallet_id', walletId)
      .gt('current_amount', 0);
      
    if (error) {
      console.error('Error fetching portfolio:', error);
      return [];
    }

    const credits: PurchasedCredit[] = [];
    
    for (const row of data as any[]) {
       const vintage = row.PROJECT_VINTAGES;
       if (!vintage || !vintage.PROJECTS) continue;
       
       const projectData = vintage.PROJECTS;
       const project = projectRepository.mapToDTO(projectData);
       
       if (project) {
          credits.push({
            project: project,
            quantity: row.current_amount,
            pricePerToken: 0, // Fallback
            purchaseDate: new Date(row.updated_at).toLocaleDateString('vi-VN'),
          });
       }
    }
    
    return credits;
  }

  async getTransactions(walletId: number): Promise<Transaction[]> {
    const { data, error } = await this.client
      .from('TOKEN_ACTIVITY_LOGS')
      .select(`
        *,
        PROJECT_VINTAGES (
          *,
          PROJECTS ( project_code )
        )
      `)
      .eq('wallet_id', walletId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }

    return (data as any[]).map(row => {
      let type: 'mint' | 'sell' | 'request' = 'request';
      if (row.activity_type === 'MINT') type = 'mint';
      else if (row.activity_type === 'PURCHASE') type = 'sell';
      
      const projectCode = row.PROJECT_VINTAGES?.PROJECTS?.project_code || 'UNKNOWN';

      return {
        id: row.activity_id.toString(),
        date: new Date(row.created_at).toLocaleDateString('vi-VN'),
        txHash: '0x' + Math.random().toString(16).substr(2, 8), // MOCK until we have it in activity log
        activity: `${row.activity_type} (${projectCode})`,
        projectCode: projectCode,
        amount: row.delta_amount,
        type
      };
    });
  }

  async getCertificates(organizationId: number): Promise<Certificate[]> {
    const { data, error } = await this.client
      .from('RETIREMENTS')
      .select(`
        *,
        RETIREMENT_DETAILS (
          *,
          PROJECT_VINTAGES (
            PROJECTS ( project_id, project_code, project_name )
          )
        )
      `)
      .eq('organization_id', organizationId)
      .eq('retirement_status', 'COMPLETED');

    if (error) {
       console.error('Error fetching certificates', error);
       return [];
    }

    const certs: Certificate[] = [];
    for (const cert of data as any[]) {
      for (const det of cert.RETIREMENT_DETAILS || []) {
        const p = det.PROJECT_VINTAGES?.PROJECTS;
        if (!p) continue;
        
        certs.push({
          id: `CERT-${cert.retirement_id}`,
          projectId: p.project_id.toString(),
          projectName: p.project_name,
          projectCode: p.project_code,
          date: new Date(cert.retired_at || cert.created_at).toLocaleDateString('vi-VN'),
          quantity: det.retired_amount
        });
      }
    }
    
    return certs;
  }
}

export const portfolioRepository = new PortfolioRepository();

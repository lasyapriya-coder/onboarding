export interface Step {
  id: string;
  number: string;
  title: string;
  method?: 'POST' | 'PUT' | 'GET';
  endpoint?: string;
  optional?: boolean;
}

export const ONBOARDING_STEPS: Step[] = [
  { id: 'merchant-pan-ckyc', number: '00', title: 'Merchant, PAN & CKYC Details', method: 'POST', endpoint: '/api/v3/merchants' },
  { id: 'business-details', number: '01', title: 'Business Details', method: 'PUT', endpoint: '/api/v1/merchants/{uuid}/update' },
  { id: 'signatory-details', number: '02', title: 'Signatory Details', method: 'PUT', endpoint: '/api/v1/merchants/{uuid}/signatory_details' },
  { id: 'addresses', number: '03', title: 'Addresses', method: 'PUT', endpoint: '/api/v1/merchants/{uuid}/update' },
  { id: 'vkyc', number: '04', title: 'Video KYC', method: 'POST', endpoint: '/api/v3/merchants/kyc_document/create_vkyc_profile', optional: true },
  { id: 'ubo-details', number: '05', title: 'UBO Details', method: 'PUT', endpoint: '/api/v1/merchants/{uuid}/signatory_details' },
  { id: 'business-members', number: '06', title: 'Business Members', method: 'PUT', endpoint: '/api/v1/merchants/{uuid}/submit_business_members' },
  { id: 'upload-kyc', number: '07', title: 'Upload KYC Docs', method: 'POST', endpoint: '/api/v3/merchants/{mid}/kyc_document' },
  { id: 'approval', number: '08', title: 'Approval Status', method: 'GET', endpoint: '/api/v1/merchants/{uuid}/status' },
  { id: 'esign', number: '09', title: 'E-Sign Agreement', method: 'GET', endpoint: '/api/v1/merchants/{uuid}/generate_merged_document_for_esign' },
];

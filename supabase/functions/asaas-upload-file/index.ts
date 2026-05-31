/**
 * asaas-upload-file
 *
 * General file upload for Asaas sub-account documents.
 * This is a simplified version that handles file uploads for various purposes.
 *
 * POST /asaas-upload-file
 * Expects multipart/form-data with:
 *   - document_type: string
 *   - file: File
 *   - group?: string (e.g., 'IDENTIFICATION', 'SOCIAL_CONTRACT')
 */

import {
    corsResponse,
    jsonResponse,
    errorResponse,
    getAuthenticatedUser,
    getFinancialAccount,
    asaasRequest,
    getAsaasPendingDocuments,
} from '../_shared/asaas-client.ts';

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return corsResponse();

    try {
        const user = await getAuthenticatedUser(req);

        // 1. Get financial account
        const financialAccount = await getFinancialAccount(user.id);
        if (!financialAccount?.metadata?.asaas_api_key) {
            return errorResponse('Conta financeira não configurada.', 403);
        }

        const subApiKey = financialAccount.metadata.asaas_api_key;

        // 2. Parse multipart form data
        const formData = await req.formData();
        const documentType = formData.get('document_type') as string;
        const file = formData.get('file') as File;
        const group = formData.get('group') as string;

        if (!file) {
            return errorResponse('file é obrigatório', 400);
        }

        // 3. Upload document
        const asaasFormData = new FormData();
        asaasFormData.append('documentFile', file, file.name);
        if (documentType) asaasFormData.append('type', documentType);
        if (group) asaasFormData.append('documentGroup', group);

        const result = await asaasRequest(
            '/myAccount/documents',
            'POST',
            asaasFormData,
            subApiKey
        );

        // 4. Get remaining pending documents
        let pendingDocs = null;
        try {
            pendingDocs = await getAsaasPendingDocuments(subApiKey);
        } catch (err) {
            console.error('[asaas-upload-file] Error fetching pending docs:', err);
        }

        return jsonResponse({
            success: true,
            document: result,
            pending_documents: pendingDocs?.data || [],
        });

    } catch (error: any) {
        console.error('asaas-upload-file error:', error);
        return errorResponse(error.message || 'Internal error', 500);
    }
});

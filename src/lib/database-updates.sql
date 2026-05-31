-- Adicionando colunas para dados bancários completos na tabela financial_accounts
ALTER TABLE public.financial_accounts 
ADD COLUMN IF NOT EXISTS bank_agency TEXT,
ADD COLUMN IF NOT EXISTS bank_account TEXT,
ADD COLUMN IF NOT EXISTS bank_account_digit TEXT,
ADD COLUMN IF NOT EXISTS bank_account_type TEXT;

-- Atualizando comentários das colunas para clareza
COMMENT ON COLUMN public.financial_accounts.bank_agency IS 'Agência bancária do psicólogo';
COMMENT ON COLUMN public.financial_accounts.bank_account IS 'Número da conta bancária';
COMMENT ON COLUMN public.financial_accounts.bank_account_digit IS 'Dígito verificador da conta';
COMMENT ON COLUMN public.financial_accounts.bank_account_type IS 'Tipo da conta (CONTA_CORRENTE, CONTA_POUPANCA)';

-- Garantindo que RLS permite o acesso necessário
ALTER TABLE public.financial_accounts ENABLE ROW LEVEL SECURITY;
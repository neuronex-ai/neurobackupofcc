-- Remover a restrição antiga que causava o erro
ALTER TABLE public.nb_payments DROP CONSTRAINT IF EXISTS nb_payments_payment_method_type_check;

-- Adicionar a nova restrição que aceita os métodos individuais e as combinações comuns enviadas pelo app
ALTER TABLE public.nb_payments ADD CONSTRAINT nb_payments_payment_method_type_check 
CHECK (payment_method_type IN (
    'PIX', 
    'BOLETO', 
    'CREDIT_CARD', 
    'UNDEFINED', 
    'PIX,CARD', 
    'PIX,BOLETO', 
    'CARD,BOLETO', 
    'PIX,CARD,BOLETO',
    'pix',
    'card',
    'boleto'
));

-- Garantir que a coluna aceite strings de tamanho adequado
ALTER TABLE public.nb_payments ALTER COLUMN payment_method_type TYPE TEXT;